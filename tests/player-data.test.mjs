// Node 24+: use the project's TypeScript compiler, without a new test dependency.
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith(".") &&
      context.parentURL?.endsWith(".ts") &&
      !/\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      };
    }
    return next(url, context);
  },
});

const { adaptStatPhase, adaptPlayerProfile, adaptAwards, filterPlayers, validatePlayerFilters } =
  await import("../src/lib/player-adapter.ts");
const { playerRoster, findPlayer } = await import("../src/lib/player-data.ts");
const { players, seasons } = await import("../src/lib/mock-data.ts");
const { adaptPlayer } = await import("../src/lib/home-data.ts");
const { seasonStatsMap } = await import("../src/lib/season-stats.ts");
const { formatStat, metrics } = await import("../src/lib/player-types.ts");

test("missing phase never becomes zero or a qualification verdict", () => {
  for (const input of [undefined, null, {}, "", []])
    assert.deepEqual(adaptStatPhase(input), { status: "not-imported", values: {} });
  assert.equal(formatStat(undefined), "—");
  assert.equal(formatStat(0), "0,0");
});

test("explicit participation states remain distinct and zeros remain valid data", () => {
  for (const status of ["not-played", "not-qualified", "no-games", "not-imported"]) {
    assert.deepEqual(adaptStatPhase({ status, pts: 100 }), { status, values: {} });
  }
  assert.deepEqual(adaptStatPhase({ gp: 0, pts: 99 }), { status: "no-games", values: { gp: 0 } });
  const phase = adaptStatPhase({ gp: 1, pts: 0, ast: 0 });
  assert.equal(phase.status, "available");
  assert.deepEqual(phase.values, { gp: 1, pts: 0, ast: 0 });
  assert.equal(phase.values.reb, undefined);
});

test("malformed numbers do not enter the public statistical model", () => {
  const phase = adaptStatPhase({ gp: 2.5, pts: NaN, reb: Infinity, ast: -2, stl: "3", blk: 0 });
  assert.deepEqual(phase.values, { blk: 0 });
});

test("new presentation reads imported seasons, never synthetic career fallbacks", () => {
  const nando = players.find((player) => player.name === "Nando");
  const before = JSON.stringify(nando);
  const missing = adaptPlayerProfile(nando, adaptPlayer(nando), {}, seasons);
  assert.ok(
    missing.career.every((season) =>
      Object.values(season.phases).every((phase) => phase.status === "not-imported"),
    ),
  );
  const actual = findPlayer("8");
  assert.equal(actual.career[0].phases.regular.values.pts, seasonStatsMap.Nando[1].regular.pts);
  assert.notEqual(actual.career[0].phases.regular.values.pts, nando.career[0].stats.Regular.pts);
  assert.equal(JSON.stringify(nando), before);
});

test("all 13 original IDs and all imported seasons remain reachable", () => {
  assert.equal(playerRoster.length, 13);
  assert.equal(new Set(playerRoster.map((player) => player.id)).size, 13);
  for (const player of playerRoster) {
    assert.equal(findPlayer(player.id), player);
    for (const year of player.career) {
      for (const phase of ["regular", "playoffs", "finals"]) {
        const source = seasonStatsMap[player.name][year.id]?.[phase];
        if (source) assert.deepEqual(year.phases[phase].values, source);
        else assert.equal(year.phases[phase].status, "not-imported");
      }
      for (const phase of ["firstRound", "quarterfinals", "conferenceFinals"])
        assert.equal(year.phases[phase].status, "not-imported");
    }
  }
  assert.equal(findPlayer("9999"), undefined);
  assert.equal(findPlayer("08"), undefined);
});

test("awards are dynamic and dates require explicit individual records", () => {
  const nando = findPlayer("8");
  assert.equal(nando.awards.find((award) => award.id === "NBA Champion").count, 4);
  assert.deepEqual(nando.awards.find((award) => award.id === "NBA Champion").years, []);
  assert.deepEqual(
    nando.awards.find((award) => award.id === "Finals MVP").years.map((year) => year.seasonId),
    [5, 11, 12, 20],
  );
  assert.equal(findPlayer("3").awards.length, 0);
  const synthetic = {
    ...players[0],
    rings: 0,
    name: "Fixture",
    awards: [
      "MVP",
      "Finals MVP",
      "DPOY",
      "Sixth Man of the Year",
      "ROTY",
      "MIP",
      "All-Star",
      "All-NBA 1st Team",
      "All-Defensive 2nd Team",
      "All-Rookie 1st Team",
      "Prêmio futuro",
    ],
  };
  const awards = adaptAwards(synthetic, []);
  assert.equal(awards.length, 11);
  assert.ok(awards.every((award) => award.count === 1 && award.years.length === 0));
  assert.ok(awards.some((award) => award.label === "Prêmio futuro"));
});

test("name, team, position and sort filters combine without mutating the roster", () => {
  const original = playerRoster.map((player) => player.id);
  assert.deepEqual(
    filterPlayers(playerRoster, {
      q: "  nÁnDo ",
      team: "Portland Trail Blazers",
      position: "PF",
    }).map((player) => player.name),
    ["Nando"],
  );
  assert.equal(filterPlayers(playerRoster, { q: "Nando", team: "Orlando Magic" }).length, 0);
  assert.equal(filterPlayers(playerRoster, { order: "az" })[0].name, "Abel");
  assert.equal(filterPlayers(playerRoster, { order: "za" })[0].name, "Tailan");
  assert.deepEqual(
    playerRoster.map((player) => player.id),
    original,
  );
  assert.deepEqual(validatePlayerFilters({ q: 2, team: [], order: "ranking" }), {
    q: undefined,
    team: undefined,
    position: undefined,
    order: undefined,
  });
});

test("future totals and percentages are explicit, never derived from rounded means", () => {
  const phase = adaptStatPhase({ gp: 2, pts: 1.3, threePct: 38.5, doubleDoubles: 1 });
  assert.equal(phase.values.pointsTotal, undefined);
  assert.equal(phase.values.threePct, 38.5);
  assert.equal(phase.values.doubleDoubles, 1);
  assert.equal(phase.values.tripleDoubles, undefined);
  assert.ok(!metrics.some((metric) => ["3PA", "FTA", "MINS", "FLS"].includes(metric.short)));
});
