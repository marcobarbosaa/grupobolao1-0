import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("../../src/data/statistics/season-extras.json", import.meta.url), "utf8"),
);
const refs = JSON.parse(
  readFileSync(
    new URL("../../src/data/statistics/season-extras-sources.json", import.meta.url),
    "utf8",
  ),
);

test("2005–06 keeps playoffs and no incorrect standings", () => {
  const season = data["season-001"];
  assert.equal(Object.hasOwn(season, "standings"), false);
  assert.equal(season.playoffs.matches.length, 15);
  assert.equal(refs["season-001"].length, 1);
});

for (const [seasonId, expectedChampion] of [
  ["season-002", "NY"],
  ["season-003", "ATL"],
]) {
  test(`${seasonId} keeps standings, bracket and source metadata`, () => {
    const season = data[seasonId];
    assert.equal(season.playoffs.champion, expectedChampion);
    assert.equal(refs[seasonId].length, 5);
    assert.equal(season.playoffs.matches.length, 15);
    assert.deepEqual(Object.keys(season.standings).sort(), ["east", "west"]);

    for (const conference of ["east", "west"]) {
      const rows = season.standings[conference];
      assert.equal(rows.length, 15);
      assert.equal(new Set(rows.map((row) => row.team)).size, 15);
      rows.forEach((row, index) => {
        assert.equal(row.rank, index + 1);
        assert.equal(row.wins + row.losses, 82);
      });

      const inRound = (round) =>
        season.playoffs.matches.filter(
          (match) => match.conference === conference && match.round === round,
        );

      const first = inRound("first-round");
      const quarter = inRound("quarterfinals");
      const conferenceFinals = inRound("conference-finals");
      assert.equal(first.length, 4);
      assert.equal(quarter.length, 2);
      assert.equal(conferenceFinals.length, 1);

      const teamsInRound = (matches) =>
        matches.flatMap((match) => [match.homeTeam, match.awayTeam]).sort();

      assert.deepEqual(
        teamsInRound(first),
        rows
          .slice(0, 8)
          .map((row) => row.team)
          .sort(),
      );
      assert.deepEqual(teamsInRound(quarter), first.map((match) => match.winner).sort());
      assert.deepEqual(teamsInRound(conferenceFinals), quarter.map((match) => match.winner).sort());
    }

    const finals = season.playoffs.matches.filter((match) => match.round === "nba-finals");
    assert.equal(finals.length, 1);
    assert.equal(finals[0].winner, expectedChampion);

    for (const match of season.playoffs.matches) {
      assert.notEqual(match.homeTeam, match.awayTeam);
      assert.equal(Math.max(match.homeWins, match.awayWins), 4);
      assert.equal(Math.min(match.homeWins, match.awayWins) < 4, true);
    }
  });
}

test("2006–07 NBA Finals: New York Knicks 4–0 Minnesota", () => {
  const final = data["season-002"].playoffs.matches.find((match) => match.round === "nba-finals");
  assert.equal(final.homeTeam, "NY");
  assert.equal(final.awayTeam, "MIN");
  assert.equal(final.homeWins, 4);
  assert.equal(final.awayWins, 0);
});

const logoData = JSON.parse(
  readFileSync(
    new URL("../../src/data/statistics/historical-logos.json", import.meta.url),
    "utf8",
  ),
);
const details2006 = JSON.parse(
  readFileSync(
    new URL("../../src/data/statistics/season-002/standings-details.json", import.meta.url),
    "utf8",
  ),
);
const details2007 = JSON.parse(
  readFileSync(
    new URL("../../src/data/statistics/season-003/standings-details.json", import.meta.url),
    "utf8",
  ),
);

test("Historical emblems cover all 30 franchises, including original relocations", () => {
  const codes = Object.values(data["season-002"].standings)
    .flat()
    .map((row) => row.team);
  assert.equal(Object.keys(logoData.base).length, 30);
  for (const code of codes) {
    assert.ok(logoData.base[code], `No historical emblem for ${code}`);
  }
  assert.equal(logoData.base.SEA.slug, "seattle-supersonics");
  assert.equal(logoData.base.NJN.slug, "new-jersey-nets");
  assert.equal(logoData.base.CHA.slug, "charlotte-bobcats");
  assert.equal(logoData.base.NO.slug, "new-orleans-oklahoma-city-hornets");
  assert.equal(logoData.seasonOverrides["season-001"].MIL.year, 1993);
  assert.equal(logoData.seasonOverrides["season-003"].NO.year, 2007);
});

test("Detailed home, away, conference and division records match both standings", () => {
  for (const [seasonId, details] of [
    ["season-002", details2006],
    ["season-003", details2007],
  ]) {
    assert.equal(Object.keys(details).length, 30);
    const rows = Object.values(data[seasonId].standings).flat();
    for (const row of rows) {
      const extra = details[row.team];
      assert.ok(extra, `Missing ${seasonId} details for ${row.team}`);
      const [homeWins, homeLosses] = extra.home.split("-").map(Number);
      const [awayWins, awayLosses] = extra.away.split("-").map(Number);
      assert.equal(homeWins + homeLosses, 41);
      assert.equal(awayWins + awayLosses, 41);
      assert.equal(homeWins + awayWins, row.wins);
      assert.equal(homeLosses + awayLosses, row.losses);
      assert.equal(
        extra.conference.split("-").map(Number).reduce((a, b) => a + b, 0),
        52,
      );
      assert.equal(
        extra.division.split("-").map(Number).reduce((a, b) => a + b, 0),
        16,
      );
    }
  }
});
