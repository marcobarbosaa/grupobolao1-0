import test from "node:test";
import assert from "node:assert/strict";
import { aggregateGames, aggregatePlayoffs } from "../../src/lib/statistics/aggregation.ts";
import { selectCurrentRevisions } from "../../src/lib/statistics/revisions.ts";
import { selectSeasonStats, compareStatistics } from "../../src/lib/statistics/selectors.ts";
import { validateDataset } from "../../src/lib/statistics/validate.ts";
import {
  engineDataset,
  twoGames,
  addRecord,
  addGame,
  addPhase,
  addSecondSeason,
  proof,
  query,
} from "./engine-fixtures.mjs";

test("two distinct games yield objective sums, ratios and versioned provenance", () => {
  const data = twoGames(),
    before = structuredClone(data);
  const result = aggregateGames(data, query);
  assert.equal(result.metrics.points.value, 50);
  assert.equal(result.metrics.assists.value, 14);
  assert.equal(result.metrics.ppg.value, 25);
  assert.equal(result.metrics.apg.value, 7);
  assert.equal(result.metrics.fgPct.value, 50);
  assert.equal(result.gameCount, 2);
  assert.equal(result.coverage.status, "unknown");
  assert.equal(result.metrics.points.sourceRecords.length, 2);
  assert.deepEqual(result.metrics.ppg.sourceIds, ["source-a"]);
  assert.equal(result.metrics.ppg.precision.kind, "derived");
  assert.deepEqual(data, before);
});
test("missing metrics use matching numerator/denominator subsets, never fabricated zero", () => {
  const data = twoGames();
  delete data.statistics[1].stats.totals.points;
  data.statistics[1].stats.totals.fgm = undefined;
  const result = aggregateGames(data, query);
  assert.equal(result.metrics.points.value, 30);
  assert.equal(result.metrics.ppg.value, 30);
  assert.equal(result.metrics.ppg.coverage.status, "partial");
  assert.equal(result.metrics.ppg.coverage.known, 1);
  assert.equal(result.metrics.fgPct.value, 50);
  assert.equal(result.metrics.fgPct.sourceRecords.length, 1);
  assert.equal(result.metrics.blocks.value, null);
  assert.equal(result.metrics.blocks.status, "insufficient-data");
});
test("games filter players, seasons, stages and teams without breaking transfers", () => {
  const data = twoGames();
  addSecondSeason(data);
  addGame(data, "game-other-player", { points: 100 }, { playerId: "marco-barbosa" });
  addGame(data, "game-other-season", { points: 200 }, { seasonId: "season-002" });
  addGame(data, "game-finals", { points: 300 }, { phaseId: "nba-finals" });
  data.statistics[1].teamId = "team-b";
  assert.equal(aggregateGames(data, query).metrics.points.value, 50);
  assert.equal(aggregateGames(data, { ...query, teamId: "team-a" }).metrics.points.value, 30);
  assert.equal(aggregateGames(data, { ...query, teamId: "team-b" }).metrics.points.value, 20);
  assert.equal(aggregateGames(data, { ...query, phaseId: "playoffs" }).metrics.points.value, 300);
});
test("only latest revisions are selected, independently of input order", () => {
  const data = twoGames(),
    record = structuredClone(data.statistics[0]);
  record.revision = 2;
  record.stats.totals.points = 40;
  addRecord(data, record);
  data.statistics.reverse();
  data.revisions.reverse();
  const before = structuredClone(data);
  const result = aggregateGames(data, query);
  assert.equal(result.metrics.points.value, 60);
  assert.equal(result.gameCount, 2);
  assert.equal(selectCurrentRevisions(data).records.length, 2);
  assert.equal(result.metrics.points.sourceRecords.find((r) => r.id === record.id).revision, 2);
  assert.deepEqual(data, before);
});
test("duplicate versions, logical duplicates, identity changes and revision gaps are rejected", () => {
  for (const mutate of [
    (d) => d.statistics.push(structuredClone(d.statistics[0])),
    (d) => addRecord(d, { ...structuredClone(d.statistics[0]), id: "other-stats" }),
    (d) =>
      addRecord(d, { ...structuredClone(d.statistics[0]), revision: 2, playerId: "marco-barbosa" }),
    (d) => addRecord(d, { ...structuredClone(d.statistics[0]), revision: 3 }),
    (d) => {
      d.revisions[0].sourceIds = ["missing-source"];
    },
  ]) {
    const data = twoGames();
    mutate(data);
    assert.throws(() => aggregateGames(data, query));
  }
});
test("zero attempts are undefined; directly observed zero percent remains observable", () => {
  const data = engineDataset();
  addGame(data, "game-zero", { fgm: 0, fga: 0, points: 0 });
  const gameResult = aggregateGames(data, query);
  assert.equal(gameResult.metrics.fgPct.status, "undefined");
  assert.equal(gameResult.metrics.ppg.value, 0);
  addPhase(
    data,
    "regular",
    { totals: { fgm: 0, fga: 0 }, percentages: { fgPct: 0 } },
    { coverage: proof(), displayPrecision: { fgPct: 1 } },
  );
  const observed = selectSeasonStats(data, query).metrics.fgPct;
  assert.equal(observed.value, 0);
  assert.equal(observed.method, "direct-source");
});
test("rounded averages never manufacture totals or get summed", () => {
  const data = engineDataset();
  addPhase(
    data,
    "regular",
    { totals: { gp: 82 }, averages: { ppg: 27.4 } },
    { coverage: proof(82), displayPrecision: { ppg: 1 } },
  );
  const result = selectSeasonStats(data, query);
  assert.equal(result.metrics.ppg.value, 27.4);
  assert.equal(result.metrics.ppg.precision.kind, "display-rounded");
  assert.equal(result.metrics.points.value, null);
  assert.equal(result.coverage.status, "complete");
  assert.equal(result.gameCoverage.status, "none");
});
test("coverage requires reviewed evidence, and game completeness requires the exact reviewed set", () => {
  const data = twoGames();
  const phase = addPhase(data, "regular", { totals: { gp: 2, points: 50 } });
  assert.equal(selectSeasonStats(data, query).coverage.status, "unknown");
  phase.coverage = proof(2);
  assert.equal(selectSeasonStats(data, query).coverage.status, "complete");
  assert.equal(aggregateGames(data, query).coverage.status, "partial");
  phase.coverage = proof(2, ["game-one", "game-two"]);
  assert.equal(aggregateGames(data, query).coverage.status, "complete");
  phase.coverage.expectedGameIds = ["game-one", "game-not-imported"];
  assert.equal(aggregateGames(data, query).coverage.status, "partial");
});
test("82-game official consolidated data and 12 games remain separate representations", () => {
  const data = engineDataset();
  for (let i = 0; i < 12; i++) addGame(data, "game-" + i, { points: 10 });
  addPhase(data, "regular", { totals: { gp: 82, points: 1640 } }, { coverage: proof(82) });
  const result = selectSeasonStats(data, query);
  assert.equal(result.metrics.points.value, 1640);
  assert.equal(result.metrics.ppg.value, 20);
  assert.equal(result.gameCoverage.known, 12);
  assert.equal(result.gameCoverage.expected, 82);
  assert.equal(result.gameCoverage.status, "partial");
  assert.equal(aggregateGames(data, query).metrics.points.value, 120);
});
test("no records produce no invented zero; absent appearance records do not inflate GP", () => {
  const data = engineDataset();
  assert.equal(aggregateGames(data, query).coverage.status, "none");
  assert.equal(selectSeasonStats(data, query).metrics.points.value, null);
  addGame(data, "game-absent", {}, { availability: "not-played" });
  assert.equal(aggregateGames(data, query).metrics.gp.value, null);
});
test("two rounds sum 230 points in 11 games without adding the playoffs aggregate", () => {
  const data = engineDataset();
  addPhase(data, "first-round", { totals: { gp: 6, points: 120 } }, { coverage: proof(6) });
  addPhase(data, "quarterfinals", { totals: { gp: 5, points: 110 } }, { coverage: proof(5) });
  addPhase(data, "playoffs", { totals: { gp: 11, points: 230 } }, { coverage: proof(11) });
  const q = { ...query, phaseId: "playoffs" };
  const rounds = aggregatePlayoffs(data, q);
  assert.equal(rounds.metrics.points.value, 230);
  assert.equal(rounds.metrics.ppg.value, 230 / 11);
  assert.equal(rounds.coverage.status, "partial");
  assert.equal(rounds.metrics.points.sourceRecords.length, 2);
  const official = selectSeasonStats(data, q);
  assert.equal(official.representation, "consolidated");
  assert.equal(official.metrics.points.value, 230);
  assert.equal(official.sourceRecords.length, 1);
});
test("reviewed nonparticipation covers later rounds without fabricating their statistics", () => {
  const data = engineDataset();
  addPhase(data, "first-round", { totals: { gp: 6, points: 120 } }, { coverage: proof(6) });
  for (const phase of ["quarterfinals", "conference-finals", "nba-finals"])
    addPhase(data, phase, {}, { availability: "not-qualified", coverage: proof(0) });
  const result = aggregatePlayoffs(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.coverage.status, "complete");
  assert.equal(result.metrics.points.coverage.status, "complete");
  assert.equal(result.metrics.ppg.value, 20);
  assert.equal(result.metrics.points.sourceRecords.length, 1);
});
test("unimported and unverified rounds cannot certify complete playoffs", () => {
  const data = engineDataset();
  for (const phase of ["first-round", "quarterfinals", "conference-finals"])
    addPhase(data, phase, { totals: { gp: 1, points: 10 } }, { coverage: proof(1) });
  addPhase(data, "nba-finals", {}, { availability: "not-imported" });
  assert.equal(
    aggregatePlayoffs(data, { ...query, phaseId: "playoffs" }).coverage.status,
    "partial",
  );
  assert.equal(aggregatePlayoffs(data, { ...query, phaseId: "playoffs" }).metrics.ppg.value, 10);
});
test("standalone configured final is a valid playoff round without aggregate configuration", () => {
  const data = engineDataset();
  data.seasons[0].phases = [{ id: "nba-finals", name: "Final", order: 0, type: "stage" }];
  addPhase(data, "nba-finals", { totals: { gp: 7, points: 140 } }, { coverage: proof(7) });
  const result = aggregatePlayoffs(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.coverage.status, "complete");
  assert.equal(result.metrics.points.value, 140);
});
test("complete equivalent representations produce explicit conflicts rather than choosing a maximum", () => {
  const data = twoGames();
  addPhase(
    data,
    "regular",
    { totals: { gp: 2, points: 51 } },
    { coverage: proof(2, ["game-one", "game-two"]) },
  );
  const result = selectSeasonStats(data, query);
  assert.equal(result.metrics.points.value, null);
  assert.equal(result.metrics.points.status, "conflict");
  assert.equal(result.conflicts.find((c) => c.metric === "points").candidates.length, 2);
});
test("declared rounding tolerates half a display unit, but not real inconsistencies", () => {
  const data = engineDataset();
  const phase = addPhase(
    data,
    "regular",
    { totals: { gp: 3, points: 61 }, averages: { ppg: 20.3 } },
    { coverage: proof(3), displayPrecision: { ppg: 1 } },
  );
  assert.equal(selectSeasonStats(data, query).metrics.ppg.value, 20.3);
  phase.stats.averages.ppg = 20.4;
  assert.equal(selectSeasonStats(data, query).metrics.ppg.status, "conflict");
  delete phase.displayPrecision;
  assert.equal(selectSeasonStats(data, query).metrics.ppg.value, 20.4);
  assert.ok(
    selectSeasonStats(data, query).warnings.some((warning) =>
      warning.includes("precision unknown"),
    ),
  );
});
test("team consolidated periods remain disjoint and never get added to all-teams consolidation", () => {
  const data = engineDataset();
  addPhase(
    data,
    "regular",
    { totals: { gp: 10, points: 100 } },
    { id: "team-a-phase", teamId: "team-a", coverage: proof(10) },
  );
  addPhase(
    data,
    "regular",
    { totals: { gp: 20, points: 400 } },
    { id: "team-b-phase", teamId: "team-b", coverage: proof(20) },
  );
  const partition = selectSeasonStats(data, query);
  assert.equal(partition.metrics.points.value, 500);
  assert.equal(partition.coverage.status, "unknown");
  addPhase(data, "regular", { totals: { gp: 30, points: 500 } }, { coverage: proof(30) });
  assert.equal(selectSeasonStats(data, query).metrics.points.value, 500);
  assert.equal(selectSeasonStats(data, { ...query, teamId: "team-a" }).metrics.points.value, 100);
});
test("comparisons expose complete, partial, missing and differing periods without subjective scores", () => {
  const data = engineDataset();
  addSecondSeason(data);
  addPhase(data, "regular", { totals: { gp: 2, points: 50, assists: 10 } }, { coverage: proof(2) });
  addPhase(
    data,
    "regular",
    { totals: { gp: 3, points: 90 } },
    { id: "other-player", playerId: "marco-barbosa", coverage: proof(3) },
  );
  addPhase(
    data,
    "regular",
    { totals: { gp: 1, points: 10 } },
    { id: "other-season", seasonId: "season-002", coverage: { ...proof(2), status: "partial" } },
  );
  const complete = compareStatistics(data, query, { ...query, playerId: "marco-barbosa" }, [
    "ppg",
    "apg",
  ]);
  assert.equal(complete.metrics[0].comparable, true);
  assert.equal(complete.metrics[1].comparable, false);
  const partial = compareStatistics(data, query, { ...query, seasonId: "season-002" }, ["ppg"]);
  assert.equal(partial.metrics[0].comparable, false);
  assert.equal(partial.metrics[0].right.coverage.status, "partial");
  assert.deepEqual(Object.keys(complete).sort(), ["left", "metrics", "right"]);
  assert.throws(() => compareStatistics(data, query, query, ["legacyScore"]));
});
test("coverage metadata is optional, reviewed, scope-bound and schema-checked", () => {
  const data = twoGames();
  const phase = addPhase(data, "regular", { totals: { gp: 2 } });
  assert.equal(validateDataset(data).success, true);
  phase.coverage = proof(2, ["game-one", "game-two"]);
  assert.equal(validateDataset(data).success, true);
  phase.coverage.sourceIds = ["unreviewed"];
  assert.equal(validateDataset(data).success, false);
  phase.coverage = proof(1);
  assert.equal(validateDataset(data).success, false);
  phase.coverage = proof(2, ["game-one", "game-one"]);
  assert.equal(validateDataset(data).success, false);
  phase.coverage = proof(2, ["game-one", "game-two"]);
  data.games[1].phaseId = "nba-finals";
  assert.equal(validateDataset(data).success, false);
});
test("query errors and invalid runtime values cannot bypass the foundation", () => {
  const data = twoGames();
  assert.throws(() => aggregateGames(data, { ...query, playerId: "unknown" }));
  assert.throws(() => aggregateGames(data, { ...query, seasonId: "season-999" }));
  assert.throws(() => aggregateGames(data, { ...query, teamId: "missing-team" }));
  assert.throws(() => aggregatePlayoffs(data, query));
  data.statistics[0].stats.totals.points = Infinity;
  assert.throws(() => selectSeasonStats(data, query));
});

test("all seven averages and three percentages use their own exact operands", () => {
  const data = engineDataset();
  addGame(data, "game-all", {
    points: 20,
    rebounds: 10,
    assists: 8,
    steals: 2,
    blocks: 3,
    turnovers: 4,
    minutes: 32.5,
    fgm: 5,
    fga: 10,
    threePm: 2,
    threePa: 5,
    ftm: 3,
    fta: 4,
  });
  const result = aggregateGames(data, query);
  for (const [metric, value] of Object.entries({
    ppg: 20,
    rpg: 10,
    apg: 8,
    spg: 2,
    bpg: 3,
    topg: 4,
    mpg: 32.5,
    fgPct: 50,
    threePct: 40,
    ftPct: 75,
  }))
    assert.equal(result.metrics[metric].value, value);
});
test("shot percentages weight attempts instead of averaging individual percentages", () => {
  const data = engineDataset();
  addGame(data, "game-one", { fgm: 1, fga: 1 });
  addGame(data, "game-two", { fgm: 1, fga: 9 });
  assert.equal(aggregateGames(data, query).metrics.fgPct.value, 20);
});
test("all-complete rounds can conflict with a complete official playoffs source", () => {
  const data = engineDataset();
  for (const phase of ["first-round", "quarterfinals", "conference-finals", "nba-finals"])
    addPhase(data, phase, { totals: { gp: 1, points: 10 } }, { coverage: proof(1) });
  addPhase(data, "playoffs", { totals: { gp: 4, points: 41 } }, { coverage: proof(4) });
  const result = selectSeasonStats(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.metrics.points.status, "conflict");
  assert.equal(result.metrics.gp.value, 4);
  assert.equal(result.gameCoverage.status, "none");
});
test("rounded official averages and complete game ratios agree at documented precision", () => {
  const data = engineDataset();
  addGame(data, "game-one", { points: 20 });
  addGame(data, "game-two", { points: 20 });
  addGame(data, "game-three", { points: 21 });
  addPhase(
    data,
    "regular",
    { totals: { gp: 3 }, averages: { ppg: 20.3 } },
    { coverage: proof(3, ["game-one", "game-two", "game-three"]), displayPrecision: { ppg: 1 } },
  );
  const result = selectSeasonStats(data, query);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.metrics.ppg.value, 20.3);
  assert.equal(result.metrics.points.value, null); // no mixing representations to fill a hole
});
test("a partial metric stays partial even when all expected games are registered", () => {
  const data = twoGames();
  delete data.statistics[1].stats.totals.assists;
  addPhase(
    data,
    "regular",
    { totals: { gp: 2 } },
    { coverage: proof(2, ["game-one", "game-two"]) },
  );
  const result = aggregateGames(data, query);
  assert.equal(result.coverage.status, "complete");
  assert.equal(result.metrics.points.coverage.status, "complete");
  assert.equal(result.metrics.assists.coverage.status, "partial");
  assert.equal(result.metrics.apg.value, 8);
  assert.equal(result.metrics.apg.coverage.expected, 2);
});
test("a missing consolidated import does not mask usable individual games", () => {
  const data = twoGames();
  addPhase(data, "regular", {}, { availability: "not-imported" });
  assert.equal(selectSeasonStats(data, query).representation, "games");
  assert.equal(selectSeasonStats(data, query).metrics.points.value, 50);
});
test("each round's observed averages are checked before aggregation", () => {
  const data = engineDataset();
  addPhase(
    data,
    "first-round",
    { totals: { gp: 2, points: 40 }, averages: { ppg: 30 } },
    { coverage: proof(2), displayPrecision: { ppg: 1 } },
  );
  const result = aggregatePlayoffs(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.metrics.ppg.status, "conflict");
  assert.equal(result.metrics.points.value, 40);
  assert.ok(result.conflicts[0].candidates.every((c) => c.sourceRecords.length > 0));
});
test("exact integer conflicts never use a relative tolerance that hides a one-point difference", () => {
  const data = engineDataset();
  addGame(data, "game-big", { points: Number.MAX_SAFE_INTEGER - 1 });
  addPhase(
    data,
    "regular",
    { totals: { gp: 1, points: Number.MAX_SAFE_INTEGER } },
    { coverage: proof(1, ["game-big"]) },
  );
  assert.equal(selectSeasonStats(data, query).metrics.points.status, "conflict");
});
test("positive totals with zero appearances are refused; a zero-appearance report is not a played game", () => {
  const data = engineDataset();
  const row = addGame(data, "game-bench", { gp: 0, points: 1 });
  assert.throws(() => aggregateGames(data, query), /zero appearances/);
  row.stats.totals.points = 0;
  const result = aggregateGames(data, query);
  assert.equal(result.gameCount, 0);
  assert.equal(result.gameCoverage.known, 0);
  assert.equal(result.metrics.ppg.status, "undefined");
});
test("coverage proofs cannot certify unimported data or positive games in an unplayed phase", () => {
  const data = engineDataset();
  const row = addPhase(data, "regular", {}, { availability: "not-imported", coverage: proof(0) });
  assert.equal(validateDataset(data).success, false);
  row.availability = "not-played";
  row.coverage.expectedGames = 1;
  assert.equal(validateDataset(data).success, false);
});
test("display precision must describe an existing value at the declared decimal resolution", () => {
  const data = engineDataset();
  const row = addPhase(
    data,
    "regular",
    { averages: { ppg: 20.33 } },
    { displayPrecision: { ppg: 1 } },
  );
  assert.equal(validateDataset(data).success, false);
  row.displayPrecision.ppg = 2;
  assert.equal(validateDataset(data).success, true);
  row.displayPrecision.fgPct = 1;
  assert.equal(validateDataset(data).success, false);
});
test("a reviewed not-played game outside the appearance set does not damage complete game coverage", () => {
  const data = twoGames();
  addGame(data, "game-dnp", {}, { availability: "not-played" });
  addPhase(
    data,
    "regular",
    { totals: { gp: 2 } },
    { coverage: proof(2, ["game-one", "game-two"]) },
  );
  const result = aggregateGames(data, query);
  assert.equal(result.coverage.status, "complete");
  assert.equal(result.metrics.points.coverage.status, "complete");
});
test("empty configured playoffs and rounds with only averages do not generate totals", () => {
  const data = engineDataset();
  assert.equal(aggregatePlayoffs(data, { ...query, phaseId: "playoffs" }).metrics.gp.value, null);
  addPhase(
    data,
    "first-round",
    { totals: { gp: 6 }, averages: { ppg: 20 } },
    { coverage: proof(6) },
  );
  addPhase(
    data,
    "quarterfinals",
    { totals: { gp: 5 }, averages: { ppg: 22 } },
    { coverage: proof(5) },
  );
  const result = aggregatePlayoffs(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.metrics.gp.value, 11);
  assert.equal(result.metrics.points.value, null);
  assert.equal(result.metrics.ppg.value, null);
});

test("explicitly overlapping team or round evidence is refused before a sum", () => {
  const data = engineDataset();
  addPhase(
    data,
    "regular",
    { totals: { gp: 1, points: 10 } },
    { id: "team-a-phase", teamId: "team-a", coverage: proof(1, ["future-game"]) },
  );
  addPhase(
    data,
    "regular",
    { totals: { gp: 1, points: 10 } },
    { id: "team-b-phase", teamId: "team-b", coverage: proof(1, ["future-game"]) },
  );
  assert.throws(() => selectSeasonStats(data, query), /Overlapping game evidence/);
  const rounds = engineDataset();
  addPhase(
    rounds,
    "first-round",
    { totals: { gp: 1, points: 10 } },
    { coverage: proof(1, ["future-game"]) },
  );
  addPhase(
    rounds,
    "quarterfinals",
    { totals: { gp: 1, points: 10 } },
    { coverage: proof(1, ["future-game"]) },
  );
  assert.throws(
    () => aggregatePlayoffs(rounds, { ...query, phaseId: "playoffs" }),
    /Overlapping game evidence/,
  );
});
test("a GP conflict also clears the summary gameCount", () => {
  const data = engineDataset();
  data.seasons[0].phases = data.seasons[0].phases.filter((phase) =>
    ["playoffs", "first-round"].includes(phase.id),
  );
  addPhase(data, "first-round", { totals: { gp: 2, points: 20 } }, { coverage: proof(2) });
  addPhase(data, "playoffs", { totals: { gp: 3, points: 20 } }, { coverage: proof(3) });
  const result = selectSeasonStats(data, { ...query, phaseId: "playoffs" });
  assert.equal(result.metrics.gp.status, "conflict");
  assert.equal(result.gameCount, null);
});
