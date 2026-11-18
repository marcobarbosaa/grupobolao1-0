import test from "node:test";
import assert from "node:assert/strict";
import { loadPilotSeason } from "../../scripts/liga-viva/pilot.ts";
import {
  reconstructSeason,
  ReconstructionInfeasibleError,
  ReconstructionInputError,
} from "../../src/lib/liga-viva/engine.ts";
import { validateReconstruction, validateSeasonTarget } from "../../src/lib/liga-viva/validate.ts";

const fixedTime = "2026-11-18T00:00:00.000Z";
let pilot;
let generated;

test("season-002 produces 1,230 validated, seeded synthetic games", async () => {
  pilot = await loadPilotSeason();
  const options = { ...pilot, seed: "pilot-test-1", generatedAt: fixedTime };
  generated = await reconstructSeason(options);
  const repeated = await reconstructSeason(options);

  assert.equal(generated.report.valid, true, generated.report.errors.join("\n"));
  assert.equal(generated.reconstruction.games.length, 1230);
  assert.deepEqual(generated.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.deepEqual(generated.reconstruction.games, repeated.reconstruction.games);
  assert.equal(generated.reconstruction.reconstructionId, repeated.reconstruction.reconstructionId);
  assert.equal(
    generated.reconstruction.games.some((game) => game.provenance !== "synthetic-constrained"),
    false,
  );
});

test("another seed can select a different valid reconstruction", async () => {
  const alternate = await reconstructSeason({
    ...pilot,
    seed: "pilot-test-2",
    generatedAt: fixedTime,
  });
  assert.equal(alternate.report.valid, true, alternate.report.errors.join("\n"));
  assert.notDeepEqual(alternate.reconstruction.games, generated.reconstruction.games);
});

test("incompatible totals and incomplete targets are rejected", async () => {
  const brokenTotal = structuredClone(pilot.target);
  brokenTotal.teams[0].wins += 1;
  assert.ok(
    validateSeasonTarget(brokenTotal, pilot.rules).some((error) =>
      error.includes("not reciprocal"),
    ),
  );
  await assert.rejects(
    reconstructSeason({ ...pilot, target: brokenTotal, seed: 1 }),
    ReconstructionInputError,
  );

  const incomplete = structuredClone(pilot.target);
  delete incomplete.teams[0].home;
  assert.ok(validateSeasonTarget(incomplete, pilot.rules).some((error) => error.includes("home")));
});

test("validator detects duplicate games, missing teams and nonreciprocal results", () => {
  const duplicate = structuredClone(generated.reconstruction);
  duplicate.games.push(structuredClone(duplicate.games[0]));
  assert.equal(validateReconstruction(pilot.target, duplicate).valid, false);
  assert.ok(
    validateReconstruction(pilot.target, duplicate).errors.some((error) =>
      error.includes("Duplicate"),
    ),
  );

  const unknown = structuredClone(generated.reconstruction);
  unknown.games[0].awayTeam = "NOT-A-TEAM";
  assert.ok(
    validateReconstruction(pilot.target, unknown).errors.some((error) =>
      error.includes("unknown team"),
    ),
  );

  const nonreciprocal = structuredClone(generated.reconstruction);
  nonreciprocal.games[0].loser = nonreciprocal.games[0].winner;
  assert.ok(
    validateReconstruction(pilot.target, nonreciprocal).errors.some((error) =>
      error.includes("not reciprocal"),
    ),
  );

  const wrongVenue = structuredClone(generated.reconstruction);
  [wrongVenue.games[0].homeTeam, wrongVenue.games[0].awayTeam] = [
    wrongVenue.games[0].awayTeam,
    wrongVenue.games[0].homeTeam,
  ];
  assert.equal(validateReconstruction(pilot.target, wrongVenue).valid, false);
});

test("validator independently catches standings, home, conference and division divergences", () => {
  const wrongRank = structuredClone(generated.reconstruction);
  wrongRank.standings[0].rank += 1;
  assert.ok(
    validateReconstruction(pilot.target, wrongRank).errors.some((error) =>
      error.includes("standings classification"),
    ),
  );

  const wrongHome = structuredClone(pilot.target);
  wrongHome.teams[0].home.wins += 1;
  wrongHome.teams[0].home.losses -= 1;
  assert.ok(
    validateReconstruction(wrongHome, generated.reconstruction).errors.some((error) =>
      error.includes("home wins"),
    ),
  );

  const wrongConference = structuredClone(pilot.target);
  wrongConference.teams[0].conferenceRecord.wins += 1;
  wrongConference.teams[0].conferenceRecord.losses -= 1;
  assert.ok(
    validateReconstruction(wrongConference, generated.reconstruction).errors.some((error) =>
      error.includes("conference wins"),
    ),
  );

  const wrongDivision = structuredClone(pilot.target);
  wrongDivision.teams[0].divisionRecord.wins += 1;
  wrongDivision.teams[0].divisionRecord.losses -= 1;
  assert.ok(
    validateReconstruction(wrongDivision, generated.reconstruction).errors.some((error) =>
      error.includes("division wins"),
    ),
  );
});

test("a different short-season format is generated and validated", async () => {
  const rules = {
    version: "short-season-1",
    provenance: "synthetic-constrained",
    calendar: { startDate: "2030-01-01", days: 8 },
    schedule: {
      gamesPerTeam: 2,
      homeGamesPerTeam: 1,
      conferenceGamesPerTeam: 2,
      divisionGamesPerTeam: 2,
      gamesPerDivisionOpponent: 2,
      conferenceNonDivisionBaseGames: 0,
      conferenceNonDivisionExtraGamesPerTeam: 0,
      interConferenceGamesPerOpponent: 0,
    },
    divisions: [{ id: "north", conference: "west", teams: ["A", "B"] }],
  };
  const target = {
    seasonId: "short-season",
    label: "Short fixture",
    teams: ["A", "B"].map((teamId, index) => ({
      teamId,
      conference: "west",
      rank: index + 1,
      wins: 1,
      losses: 1,
      pct: 0.5,
      home: { wins: 1, losses: 0 },
      away: { wins: 0, losses: 1 },
      conferenceRecord: { wins: 1, losses: 1 },
      divisionRecord: { wins: 1, losses: 1 },
    })),
  };
  const result = await reconstructSeason({
    target,
    rules,
    seed: 8,
    inputHash: "a".repeat(64),
    generatedAt: fixedTime,
  });
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.equal(result.reconstruction.games.length, 2);
});

test("mathematically impossible result constraints fail without post-generation correction", async () => {
  const rules = {
    version: "short-season-1",
    provenance: "synthetic-constrained",
    calendar: { startDate: "2030-01-01", days: 8 },
    schedule: {
      gamesPerTeam: 2,
      homeGamesPerTeam: 1,
      conferenceGamesPerTeam: 2,
      divisionGamesPerTeam: 2,
      gamesPerDivisionOpponent: 2,
      conferenceNonDivisionBaseGames: 0,
      conferenceNonDivisionExtraGamesPerTeam: 0,
      interConferenceGamesPerOpponent: 0,
    },
    divisions: [{ id: "north", conference: "west", teams: ["A", "B"] }],
  };
  const target = {
    seasonId: "impossible-short-season",
    label: "Impossible result fixture",
    teams: [
      {
        teamId: "A",
        conference: "west",
        rank: 1,
        wins: 1,
        losses: 1,
        pct: 0.5,
        home: { wins: 1, losses: 0 },
        away: { wins: 0, losses: 1 },
        conferenceRecord: { wins: 1, losses: 1 },
        divisionRecord: { wins: 1, losses: 1 },
      },
      {
        teamId: "B",
        conference: "west",
        rank: 2,
        wins: 1,
        losses: 1,
        pct: 0.5,
        home: { wins: 0, losses: 1 },
        away: { wins: 1, losses: 0 },
        conferenceRecord: { wins: 1, losses: 1 },
        divisionRecord: { wins: 1, losses: 1 },
      },
    ],
  };
  assert.deepEqual(validateSeasonTarget(target, rules), []);
  await assert.rejects(
    reconstructSeason({
      target,
      rules,
      seed: 2,
      inputHash: "b".repeat(64),
      generatedAt: fixedTime,
    }),
    ReconstructionInfeasibleError,
  );
});

test("validator checks the source hash and calendar dates", () => {
  assert.ok(
    validateReconstruction(pilot.target, generated.reconstruction, "c".repeat(64)).errors.some(
      (error) => error.includes("Input hash"),
    ),
  );
  const invalidDate = structuredClone(generated.reconstruction);
  invalidDate.games[0].date = "1900-01-01";
  assert.ok(
    validateReconstruction(pilot.target, invalidDate).errors.some((error) =>
      error.includes("date"),
    ),
  );
});
