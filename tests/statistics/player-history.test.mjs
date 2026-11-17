import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  resolvePlayerAppearance,
  parseSeasonPeriod,
  seasonStart,
  latestAppearanceSeason,
} from "../../src/lib/player-history.ts";
const read = (p) => JSON.parse(readFileSync(new URL("../../" + p, import.meta.url), "utf8"));
const { records } = read("public/jogadores/rotas/manifest.json");
const manifest = read("src/data/statistics/manifest.json");
const seasons = manifest.seasons
  .flatMap((p) => read("src/data/statistics/" + p))
  .map((s) => ({ id: s.id, year: `${2004 + s.edition}-${2005 + s.edition}` }));
const get = (id, season) => resolvePlayerAppearance(records, seasons, id, season);
test("all 13 players have valid images whenever a historical appearance is confirmed", () => {
  assert.equal(new Set(records.map((r) => r.player)).size, 13);
  for (const player of new Set(records.map((r) => r.player))) {
    let confirmed = 0;
    for (const season of seasons) {
      const appearance = get(player, season.id);
      if (!appearance.matched) {
        assert.equal(appearance.image, undefined, `${player} ${season.id}`);
        continue;
      }
      confirmed++;
      assert.ok(existsSync(new URL("../../public" + appearance.image, import.meta.url)));
    }
    assert.ok(confirmed > 0, `No confirmed appearance for ${player}`);
  }
});
test("every interval resolves inclusively and preserves the correct file", () => {
  for (const record of records) {
    const range = parseSeasonPeriod(record.period);
    assert.ok(range);
    for (const season of seasons) {
      const year = seasonStart(season.year);
      if (year >= range.start && year <= range.end)
        assert.equal(get(record.player, season.id).image, record.asset);
    }
  }
});
test("confirmed transfer boundaries", () => {
  for (const [player, before, oldTeam, after, newTeam] of [
    ["nando", "2011-2012", "Houston Rockets", "2012-2013", "Denver Nuggets"],
    ["tailan", "2008-2009", "Minnesota Timberwolves", "2009-2010", "New York Knicks"],
    ["marco-barbosa", "2010-2011", "Denver Nuggets", "2011-2012", "Miami Heat"],
    ["cristiano-ronaldo", "2008-2009", "Indiana Pacers", "2009-2010", "Phoenix Suns"],
    ["cristiano-ronaldo", "2009-2010", "Phoenix Suns", "2010-2011", "Denver Nuggets"],
  ]) {
    assert.equal(get(player, before).team, oldTeam);
    assert.equal(get(player, after).team, newTeam);
  }
});
test("aliases, season formats and latest season", () => {
  for (const [alias, id] of [
    ["Fábio Carvalho", "binho"],
    ["gam-mori", "gam"],
    ["marco-barbosa", "marco"],
    ["matheus-medeiros", "medeiros"],
    ["cerrote", "cristiano-ronaldo"],
  ])
    assert.equal(get(alias, "season-008").image, get(id, "2012/13").image);
  assert.equal(latestAppearanceSeason([...seasons].reverse()).id, seasons.at(-1).id);
  assert.equal(get("marco", "2011–12").team, "Miami Heat");
});
test("missing, malformed, ambiguous and future records never invent affiliations", () => {
  for (const value of ["2099-2100", "2004-2005", "2011-2013", "bad"]) {
    assert.equal(get("enzo", value).matched, false);
    assert.equal(get("enzo", value).image, undefined);
  }
  assert.equal(get("unknown", "season-008").matched, false);
  assert.equal(parseSeasonPeriod("2012-2013_a_2010-2011"), undefined);
  assert.equal(
    resolvePlayerAppearance([...records, records[0]], seasons, "abel", "season-001").matched,
    false,
  );
});

test("all period-specific crest files exist and contain image bytes", () => {
  const logos = read("src/data/statistics/historical-logos.json");
  const codes = [
    "NO",
    "SAC",
    "ATL",
    "DEN",
    "IND",
    "PHX",
    "DET",
    "DAL",
    "TOR",
    "NY",
    "SA",
    "MIN",
    "PHI",
    "HOU",
    "CHI",
    "MIA",
  ];
  for (const season of seasons)
    for (const code of codes) {
      const logo = logos.seasonOverrides[season.id]?.[code] ?? logos.base[code];
      const ext = ["CHI", "MIA"].includes(code) ? ".svg" : "@3x.png";
      const bytes = readFileSync(
        new URL(
          `../../public/jogadores/escudos/historicos/${logo.year}/${logo.slug}${ext}`,
          import.meta.url,
        ),
      );
      assert.ok(
        ext === ".svg"
          ? bytes.toString().includes("<svg")
          : bytes.subarray(1, 4).toString() === "PNG",
      );
    }
});
