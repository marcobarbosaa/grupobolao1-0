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
  assert.equal(
    generated.report.scoring.totalPointsFor,
    generated.report.scoring.totalPointsAgainst,
  );
  assert.equal(
    generated.reconstruction.games.filter(
      (game) => Number.isSafeInteger(game.homeScore) && Number.isSafeInteger(game.awayScore),
    ).length,
    1230,
  );
  assert.ok(
    generated.reconstruction.games.every(
      (game) => game.scoreProvenance === "synthetic-constrained",
    ),
  );
  for (const team of pilot.target.teams) {
    const teamGames = generated.reconstruction.games.filter(
      (game) => game.homeTeam === team.teamId || game.awayTeam === team.teamId,
    );
    const pointsFor = teamGames.reduce(
      (sum, game) => sum + (game.homeTeam === team.teamId ? game.homeScore : game.awayScore),
      0,
    );
    const pointsAgainst = teamGames.reduce(
      (sum, game) => sum + (game.homeTeam === team.teamId ? game.awayScore : game.homeScore),
      0,
    );
    assert.equal(Math.round((pointsFor / 82) * 10) / 10, team.scoring.pointsForPerGame);
    assert.equal(Math.round((pointsAgainst / 82) * 10) / 10, team.scoring.pointsAgainstPerGame);
  }
  assert.deepEqual(generated.reconstruction.games, repeated.reconstruction.games);
  assert.equal(generated.reconstruction.reconstructionId, repeated.reconstruction.reconstructionId);
  assert.equal(
    generated.reconstruction.games.some((game) => game.provenance !== "synthetic-constrained"),
    false,
  );
});

test("season-003 reconstructs the 2007-08 standings with its historical divisions", async () => {
  const season = await loadPilotSeason("season-003");
  const result = await reconstructSeason({
    ...season,
    seed: "season-003-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-003");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-004 reconstructs the 2008-09 standings with its historical divisions", async () => {
  const season = await loadPilotSeason("season-004");
  const result = await reconstructSeason({
    ...season,
    seed: "season-004-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-004");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-005 reconstructs the 2009-10 standings with its historical divisions", async () => {
  const season = await loadPilotSeason("season-005");
  const result = await reconstructSeason({
    ...season,
    seed: "season-005-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-005");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-006 reconstructs the 2010-11 standings with its historical divisions", async () => {
  const season = await loadPilotSeason("season-006");
  const result = await reconstructSeason({
    ...season,
    seed: "season-006-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-006");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-007 records the Indiana source normalization and validates the local 82-game season", async () => {
  const season = await loadPilotSeason("season-007");
  const indiana = season.target.teams.find((team) => team.teamId === "IND");
  const normalization = season.rules.normalizations?.find((entry) => entry.teamId === "IND");
  const result = await reconstructSeason({
    ...season,
    seed: "season-007-regression-test",
    generatedAt: fixedTime,
  });

  assert.deepEqual(indiana.divisionRecord, { wins: 6, losses: 10 });
  assert.equal(normalization.sourceValue, "6-12");
  assert.equal(normalization.normalizedValue, "6-10");
  assert.equal(result.reconstruction.seasonId, "season-007");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
});

test("season-008 reconstructs the 2012-13 standings with its historical divisions", async () => {
  const season = await loadPilotSeason("season-008");
  const result = await reconstructSeason({
    ...season,
    seed: "season-008-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-008");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-009 reconstructs standings directly from its audited extras snapshot", async () => {
  const season = await loadPilotSeason("season-009");
  const result = await reconstructSeason({
    ...season,
    seed: "season-009-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-009");
  assert.match(season.target.label, /2013.*Temporada 09/);
  assert.equal(season.sourcePaths.some((path) => path.endsWith("season-009\\extras.json")), true);
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-010 reconstructs standings directly from its audited extras snapshot", async () => {
  const season = await loadPilotSeason("season-010");
  const result = await reconstructSeason({
    ...season,
    seed: "season-010-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-010");
  assert.match(season.target.label, /2014.*Temporada 10/);
  assert.equal(season.sourcePaths.some((path) => path.endsWith("season-010\\extras.json")), true);
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
  );
});

test("season-011 preserves the Southwest source mismatch and reports partial division coverage", async () => {
  const season = await loadPilotSeason("season-011");
  const southwest = season.target.teams.filter((team) =>
    season.rules.divisions[0].teams.includes(team.teamId),
  );
  const exception = season.rules.unconstrainedDivisionRecords?.[0];
  const result = await reconstructSeason({
    ...season,
    seed: "season-011-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(southwest.reduce((sum, team) => sum + team.divisionRecord.wins, 0), 38);
  assert.equal(southwest.reduce((sum, team) => sum + team.divisionRecord.losses, 0), 42);
  assert.equal(exception.expectedWins, 40);
  assert.equal(result.reconstruction.seasonId, "season-011");
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.equal(result.report.coverage.division, false);
  assert.equal(result.report.coverage.homeAway, true);
  assert.equal(result.report.coverage.conference, true);
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
});

test("season-012 reconstructs standings directly from its audited extras snapshot", async () => {
  const season = await loadPilotSeason("season-012");
  const result = await reconstructSeason({
    ...season,
    seed: "season-012-regression-test",
    generatedAt: fixedTime,
  });

  assert.equal(result.reconstruction.seasonId, "season-012");
  assert.match(season.target.label, /2016.*Temporada 12/);
  assert.equal(season.sourcePaths.some((path) => path.endsWith("season-012\\extras.json")), true);
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.deepEqual(result.report.totals, { teams: 30, games: 1230, wins: 1230, losses: 1230 });
  assert.equal(result.report.scoring.totalPointsFor, result.report.scoring.totalPointsAgainst);
  assert.deepEqual(
    season.rules.divisions.map((division) =>
      division.teams.reduce(
        (sum, teamId) =>
          sum + season.target.teams.find((team) => team.teamId === teamId).divisionRecord.wins,
        0,
      ),
    ),
    [40, 40, 40, 40, 40, 40],
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

test("integer synthetic scores preserve winners and satisfy rounded scoring targets", async () => {
  const rules = {
    version: "short-scoring-season-1",
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
    scoring: {
      displayPrecision: 1,
      minPointsPerTeam: 70,
      maxPointsPerTeam: 160,
      maxDeviationFromPairedAverage: 16,
      minCombinedPoints: 150,
      maxCombinedPoints: 260,
      maxMargin: 40,
    },
    divisions: [{ id: "north", conference: "west", teams: ["A", "B"] }],
  };
  const target = {
    seasonId: "short-scoring-season",
    label: "Short scoring fixture",
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
      scoring: { pointsForPerGame: 100, pointsAgainstPerGame: 100 },
    })),
  };
  const result = await reconstructSeason({
    target,
    rules,
    seed: 11,
    inputHash: "d".repeat(64),
    generatedAt: fixedTime,
  });
  assert.equal(result.report.valid, true, result.report.errors.join("\n"));
  assert.ok(result.reconstruction.games.every((game) => Number.isSafeInteger(game.homeScore)));
  assert.ok(result.reconstruction.games.every((game) => Number.isSafeInteger(game.awayScore)));
  assert.ok(
    result.reconstruction.games.every((game) =>
      game.winner === game.homeTeam
        ? game.homeScore > game.awayScore
        : game.awayScore > game.homeScore,
    ),
  );

  const wrongScore = structuredClone(result.reconstruction);
  wrongScore.games[0].homeScore = wrongScore.games[0].awayScore;
  assert.ok(
    validateReconstruction(target, wrongScore).errors.some((error) =>
      error.includes("score winner differs"),
    ),
  );
});

test("impossible scoring averages are rejected before optimization", async () => {
  const { target, rules, inputHash } = await loadPilotSeason();
  const impossible = structuredClone(target);
  impossible.teams[0].scoring.pointsForPerGame = 200;
  assert.ok(
    validateSeasonTarget(impossible, rules).some((error) =>
      error.includes("cannot fit the configured score range"),
    ),
  );
  await assert.rejects(
    reconstructSeason({ target: impossible, rules, seed: 1, inputHash }),
    ReconstructionInputError,
  );
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
