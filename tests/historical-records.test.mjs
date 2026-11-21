import test from "node:test";
import assert from "node:assert/strict";
import { getHistoricalLeaderboard } from "../src/lib/historical-records.ts";

function phase(playerId, seasonId, phaseId, totals, options = {}) {
  return {
    kind: "phase",
    id: `${playerId}-${seasonId}-${phaseId}-${options.scope ?? "team"}`,
    playerId,
    seasonId,
    phaseId,
    scope: options.scope ?? "team",
    teamId: options.teamId ?? "new-york-knicks",
    availability: "available",
    revision: 1,
    sourceIds: [`source-${playerId}-${seasonId}-${phaseId}`],
    stats: { totals, averages: options.averages, percentages: options.percentages },
    coverage: options.note ? { note: options.note } : undefined,
  };
}

function leaderboard(records, perspective, metricId = "points", mode = "total", extra = {}) {
  return getHistoricalLeaderboard(records, { perspective, metricId, mode, ...extra });
}

test("prefers consolidated rows and omits ambiguous team-only duplicates", () => {
  const rows = [
    phase("player-a", "season-001", "regular", { gp: 10, points: 100 }, { teamId: "team-a" }),
    phase("player-a", "season-001", "regular", { gp: 10, points: 100 }, { scope: "all-teams" }),
    phase("player-a", "season-001", "regular", { gp: 10, points: 60 }, { teamId: "team-b" }),
    phase("player-b", "season-001", "regular", { gp: 10, points: 90 }, { teamId: "team-a" }),
    phase("player-b", "season-001", "regular", { gp: 10, points: 80 }, { teamId: "team-b" }),
  ];
  const result = leaderboard(rows, "career");
  assert.deepEqual(
    result.map(({ playerId, value }) => [playerId, value]),
    [["player-a", 100]],
  );
});

test("career averages are weighted by games and playoffs remain separate", () => {
  const rows = [
    phase("player-a", "season-001", "regular", { gp: 1, points: 10 }),
    phase("player-a", "season-002", "regular", { gp: 9, points: 180 }),
    phase("player-a", "season-002", "playoffs", { gp: 2, points: 50 }),
  ];
  assert.equal(leaderboard(rows, "career", "points", "average")[0].value, 19);
  assert.equal(
    leaderboard(rows, "playoffs", "points", "average", { aggregateSeasons: true })[0].value,
    25,
  );
});

test("regular-season averages can rank each season or consolidate them by games", () => {
  const rows = [
    phase("player-a", "season-001", "regular", { gp: 1, points: 10 }),
    phase("player-a", "season-002", "regular", { gp: 9, points: 180 }),
  ];
  const bySeason = leaderboard(rows, "regular", "points", "average");
  const overall = leaderboard(rows, "regular", "points", "average", {
    aggregateSeasons: true,
  });

  assert.deepEqual(
    bySeason.map(({ seasonId, value }) => [seasonId, value]),
    [
      ["season-002", 20],
      ["season-001", 10],
    ],
  );
  assert.deepEqual(
    overall.map(({ seasonId, seasonIds, value }) => [seasonId, seasonIds, value]),
    [[undefined, ["season-001", "season-002"], 19]],
  );
});

test("playoff averages can rank each campaign or consolidate them by games", () => {
  const rows = [
    phase("player-a", "season-001", "playoffs", { gp: 1, points: 10 }),
    phase("player-a", "season-002", "playoffs", { gp: 9, points: 180 }),
  ];
  const bySeason = leaderboard(rows, "playoffs", "points", "average", {
    aggregateSeasons: false,
  });
  const overall = leaderboard(rows, "playoffs", "points", "average", {
    aggregateSeasons: true,
  });

  assert.deepEqual(
    bySeason.map(({ seasonId, value }) => [seasonId, value]),
    [
      ["season-002", 20],
      ["season-001", 10],
    ],
  );
  assert.deepEqual(
    overall.map(({ seasonId, seasonIds, value }) => [seasonId, seasonIds, value]),
    [[undefined, ["season-001", "season-002"], 19]],
  );

  const firstRounds = [
    phase("player-b", "season-001", "first-round", { gp: 10, points: 150 }),
    phase("player-b", "season-002", "first-round", { gp: 20, points: 500 }),
    phase("player-c", "season-001", "first-round", { gp: 10, fgm: 50, fga: 100 }),
    phase("player-c", "season-002", "first-round", { gp: 10, fgm: 50, fga: 100 }),
  ];
  const firstRoundAverage = leaderboard(firstRounds, "playoffs", "points", "average", {
    phaseId: "first-round",
    aggregateSeasons: true,
  });
  const firstRoundPercentage = leaderboard(firstRounds, "playoffs", "fgPct", "average", {
    phaseId: "first-round",
    aggregateSeasons: true,
  });

  assert.deepEqual(
    firstRoundAverage.map(({ playerId, value }) => [playerId, value]),
    [["player-b", 650 / 30]],
  );
  assert.deepEqual(
    firstRoundPercentage.map(({ playerId, value }) => [playerId, value]),
    [["player-c", 50]],
  );

  const approximateRounds = [
    phase("player-d", "season-001", "first-round", { gp: 5 }, { averages: { ppg: 27.6 } }),
    phase("player-d", "season-002", "first-round", { gp: 7 }, { averages: { ppg: 31.4 } }),
  ];
  const approximateOverall = leaderboard(approximateRounds, "playoffs", "points", "average", {
    phaseId: "first-round",
    aggregateSeasons: true,
  });

  assert.equal(approximateOverall[0].value, (27.6 * 5 + 31.4 * 7) / 12);
  assert.equal(approximateOverall[0].approximate, true);
});

test("scoring-leader seasons count shared leads and skip incomplete seasons", () => {
  const rows = [
    phase("player-a", "season-001", "regular", { gp: 80, points: 2000 }),
    phase("player-b", "season-001", "regular", { gp: 80, points: 2000 }),
    phase("player-c", "season-001", "regular", { gp: 80, points: 1900 }),
    phase("player-a", "season-002", "regular", { gp: 80, points: 2100 }),
    phase("player-b", "season-002", "regular", { gp: 80, points: 1900 }),
    phase("player-a", "season-003", "regular", { gp: 80, points: 2200 }),
    phase("player-b", "season-003", "regular", { gp: 80 }),
  ];
  const result = leaderboard(rows, "career", "scoring-leads");
  assert.deepEqual(
    result.map(({ playerId, value, seasonIds }) => [playerId, value, seasonIds]),
    [
      ["player-a", 2, ["season-001", "season-002"]],
      ["player-b", 1, ["season-001"]],
    ],
  );
  const selectedSeason = leaderboard(rows, "career", "scoring-leads", "total", {
    seasonId: "season-001",
  });
  assert.deepEqual(
    selectedSeason.map(({ rank, value }) => [rank, value]),
    [
      [1, 1],
      [1, 1],
    ],
  );
});

test("tied percentages share their rank and low-attempt samples are excluded", () => {
  const rows = [
    phase(
      "player-a",
      "season-001",
      "regular",
      { gp: 30, fgm: 60, fga: 100 },
      { percentages: { fgPct: 60 } },
    ),
    phase(
      "player-b",
      "season-001",
      "regular",
      { gp: 30, fgm: 60, fga: 100 },
      { percentages: { fgPct: 60 } },
    ),
    phase(
      "player-c",
      "season-001",
      "regular",
      { gp: 30, fgm: 59, fga: 100 },
      { percentages: { fgPct: 59 } },
    ),
    phase(
      "player-d",
      "season-001",
      "regular",
      { gp: 29, fgm: 80, fga: 90 },
      { percentages: { fgPct: 88.9 } },
    ),
  ];
  const result = leaderboard(rows, "regular", "fgPct");
  assert.deepEqual(
    result.map(({ rank, playerId }) => [rank, playerId]),
    [
      [1, "player-a"],
      [1, "player-b"],
      [3, "player-c"],
    ],
  );
});

test("a season with missing shot attempts does not produce an efficiency leader", () => {
  const rows = [
    phase(
      "player-a",
      "season-012",
      "regular",
      { gp: 82, fgm: 600, fga: 1000 },
      { percentages: { fgPct: 60 } },
    ),
    phase(
      "player-b",
      "season-012",
      "regular",
      { gp: 82, fgm: 550, fga: 1000 },
      { percentages: { fgPct: 55 } },
    ),
    phase(
      "player-c",
      "season-012",
      "regular",
      { gp: 82, fgm: 700 },
      { percentages: { fgPct: 70 } },
    ),
  ];
  assert.deepEqual(leaderboard(rows, "regular", "fgPct", "total", { seasonId: "season-012" }), []);
});

test("postseason longevity counts published playoff aggregates only", () => {
  const rows = [
    phase("player-a", "season-001", "playoffs", { gp: 10, points: 200 }),
    phase("player-a", "season-002", "playoffs", { gp: 12, points: 250 }),
    phase("player-b", "season-002", "playoffs", { gp: 8, points: 160 }),
    phase("player-a", "season-002", "first-round", { gp: 7 }),
  ];
  const result = leaderboard(rows, "playoffs", "playoff-seasons");
  assert.deepEqual(
    result.map(({ playerId, value }) => [playerId, value]),
    [
      ["player-a", 2],
      ["player-b", 1],
    ],
  );
  assert.deepEqual(leaderboard(rows, "career", "playoff-seasons"), []);
  assert.deepEqual(
    leaderboard(rows, "playoffs", "playoff-seasons", "total", { seasonId: "season-002" }),
    [],
  );
});

test("fictitious reconstructions and unsupported averages never enter a ranking", () => {
  const rows = [
    phase("player-a", "season-001", "regular", { gp: 82, points: 2000 }),
    phase(
      "player-a",
      "season-002",
      "regular",
      { gp: 82 },
      { averages: { ppg: 25 }, note: "DADOS FICTÍCIOS — estimativa" },
    ),
    phase("player-b", "season-001", "regular", { gp: 82 }, { averages: { ppg: 22 } }),
  ];
  assert.deepEqual(
    leaderboard(rows, "career").map(({ playerId, value }) => [playerId, value]),
    [["player-a", 2000]],
  );
  assert.equal(leaderboard(rows, "career", "points", "average")[0].value, 2000 / 82);
  assert.deepEqual(
    leaderboard(rows, "regular", "points", "average").map(({ playerId }) => playerId),
    ["player-a", "player-b"],
  );
});
