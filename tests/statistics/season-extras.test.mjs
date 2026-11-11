import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../../src/data/statistics/season-extras.json", import.meta.url), "utf8"));
const refs = JSON.parse(readFileSync(new URL("../../src/data/statistics/season-extras-sources.json", import.meta.url), "utf8"));

test("2005–06 keeps playoffs and no incorrect standings", () => {
  const season = data["season-001"];
  assert.equal(Object.hasOwn(season, "standings"), false);
  assert.equal(season.playoffs.matches.length, 15);
  assert.equal(refs["season-001"].length, 1);
});

for (const [seasonId, expectedChampion] of [["season-002", "NY"], ["season-003", "ATL"]]) {
  test(`${seasonId} has 30 teams, valid standings, complete bracket and source metadata`, () => {
    const season = data[seasonId];
    assert.equal(season.playoffs.champion, expectedChampion);
    assert.equal(refs[seasonId].length, 5);
    assert.equal(season.playoffs.matches.length, 15);
    assert.deepEqual(Object.keys(season.standings).sort(), ["east", "west"]);
    for (const conference of ["east", "west"]) {
      const rows = season.standings[conference];
      assert.equal(rows.length, 15);
      assert.equal(new Set(rows.map(row => row.team)).size, 15);
      rows.forEach((row, i) => {
        assert.equal(row.rank, i + 1);
        assert.equal(row.wins + row.losses, 82);
      });
      const first = season.playoffs.matches.filter(m => m.conference === conference && m.round === "first-round");
      assert.equal(first.length, 4);
      assert.deepEqual(
        [...new Set(first.flatMap(m => [m.homeTeam, m.awayTeam]))].sort(),
        rows.slice(0, 8).map(r => r.team).sort(),
      );
      const quarter = season.playoffs.matches.filter(m => m.conference === conference && m.round === "quarterfinals");
      const conferenceFinals = season.playoffs.matches.filter(m => m.conference === conference && m.round === "conference-finals");
      assert.equal(quarter.length, 2);
      assert.equal(conferenceFinals.length, 1);
      assert.deepEqual(
        quarter.flatMap(m => [m.homeTeam, m.awayTeam]).sort(),
        first.map(m => m.winner).sort(),
      );
      assert.deepEqual(
        conferenceFinals.flatMap(m => [m.homeTeam, m.awayTeam]).sort(),
        quarter.map(m => m.winner).sort(),
      );
    }
    const final = season.playoffs.matches.filter(m => m.round === "nba-finals");
    assert.equal(final.length, 1);
    assert.equal(final[0].winner, expectedChampion);
    assert.equal(final[0].homeWins === 4 || final[0].awayWins === 4, true);
    for (const match of season.playoffs.matches) {
      assert.notEqual(match.homeTeam, match.awayTeam);
      assert.equal(Math.max(match.homeWins, match.awayWins), 4);
      assert.equal(Math.min(match.homeWins, match.awayWins) < 4, true);
    }
  });
}

test("2006–07 finals: New York Knicks 4–0 Minnesota Timberwolves", () => {
  const final = data["season-002"].playoffs.matches.find(m => m.round === "nba-finals");
  assert.equal(final.homeTeam, "NY");
  assert.equal(final.awayTeam, "MIN");
  assert.equal(final.homeWins, 4);
  assert.equal(final.awayWins, 0);
});
