import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildSyntheticRounds,
  calculateStandingsThroughRound,
  filterSyntheticRoundGames,
} from "../../src/lib/liga-viva/presentation.ts";

const reconstruction = JSON.parse(
  readFileSync(
    new URL("../../src/data/liga-viva/reconstructions/season-002-seed-pilot.json", import.meta.url),
    "utf8",
  ),
);

test("pilot is presented in consecutive two-day rounds containing multiple games", () => {
  const rounds = buildSyntheticRounds(reconstruction);
  assert.equal(rounds.length, 85);
  assert.equal(rounds.flatMap((round) => round.games).length, 1230);
  assert.ok(rounds.every((round) => round.games.length > 1));
  assert.ok(rounds.every((round) => round.games.length >= 14 && round.games.length <= 16));
  assert.ok(
    rounds.every((round) =>
      round.games.every((game) => Math.floor(game.dayIndex / 2) + 1 === round.number),
    ),
  );
  assert.deepEqual(
    rounds[0].games.map((game) => game.date),
    [
      "2006-10-01",
      "2006-10-01",
      "2006-10-01",
      "2006-10-01",
      "2006-10-01",
      "2006-10-01",
      "2006-10-01",
      "2006-10-02",
      "2006-10-02",
      "2006-10-02",
      "2006-10-02",
      "2006-10-02",
      "2006-10-02",
      "2006-10-02",
    ],
  );
});

test("cumulative standings include only games through the selected round", () => {
  const rounds = buildSyntheticRounds(reconstruction);
  const firstRound = calculateStandingsThroughRound(reconstruction.standings, rounds, 1);
  const laterRound = calculateStandingsThroughRound(reconstruction.standings, rounds, 2);
  const allGames = calculateStandingsThroughRound(reconstruction.standings, rounds, rounds.length);

  assert.equal(
    firstRound.reduce((sum, team) => sum + team.gamesPlayed, 0),
    rounds[0].games.length * 2,
  );
  assert.equal(
    laterRound.reduce((sum, team) => sum + team.gamesPlayed, 0),
    rounds.slice(0, 2).reduce((sum, round) => sum + round.games.length * 2, 0),
  );
  assert.equal(
    allGames.reduce((sum, team) => sum + team.wins, 0),
    1230,
  );
  assert.equal(
    allGames.reduce((sum, team) => sum + team.losses, 0),
    1230,
  );
  assert.equal(
    allGames.reduce((sum, team) => sum + team.pointsFor, 0),
    259321,
  );
  assert.equal(
    allGames.reduce((sum, team) => sum + team.pointsAgainst, 0),
    259321,
  );
  assert.ok(firstRound.every((team) => team.gamesPlayed <= team.wins + team.losses));
});

test("team filter returns only the selected team's games across both conferences", () => {
  const rounds = buildSyntheticRounds(reconstruction);
  const selectedTeam = "PHX";
  const filtered = rounds.flatMap((round) => filterSyntheticRoundGames(round, selectedTeam));
  const allGames = rounds.flatMap((round) => filterSyntheticRoundGames(round));
  const selectedConference = reconstruction.standings.find(
    (team) => team.teamId === selectedTeam,
  ).conference;

  assert.equal(filtered.length, 82);
  assert.ok(
    filtered.every((game) => game.homeTeam === selectedTeam || game.awayTeam === selectedTeam),
  );
  assert.equal(allGames.length, 1230);
  assert.ok(
    filtered.some((game) => {
      const opponent = game.homeTeam === selectedTeam ? game.awayTeam : game.homeTeam;
      return (
        reconstruction.standings.find((team) => team.teamId === opponent).conference !==
        selectedConference
      );
    }),
  );
});
