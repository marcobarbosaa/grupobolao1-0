import test from "node:test";
import assert from "node:assert/strict";
import { gameSchema, seasonSchema, importSourceSchema } from "../../src/lib/statistics/schemas.ts";
import { validateDataset } from "../../src/lib/statistics/validate.ts";
import { publishedDataset, season } from "./fixtures.mjs";

test("event dates preserve day precision, but audit timestamps remain precise", () => {
  assert.equal(seasonSchema.safeParse({ ...season(), startedAt: "2026-01-01" }).success, true);
  assert.equal(seasonSchema.safeParse({ ...season(), startedAt: "2026-02-30" }).success, false);
  assert.equal(
    gameSchema.safeParse({ ...publishedDataset().games[0], playedAt: "2026-01-01" }).success,
    true,
  );
  assert.equal(
    importSourceSchema.safeParse({ ...publishedDataset().sources[0], receivedAt: "2026-01-01" })
      .success,
    false,
  );
});
test("several games between the same teams work without dates", () => {
  const data = publishedDataset();
  data.games.push({ ...data.games[0], id: "game-b" });
  assert.equal(validateDataset(data).success, true);
});
test("all-teams and team consolidations coexist without inferring them from game totals", () => {
  const data = publishedDataset();
  const { gameId: _game, teamId: _team, ...base } = data.statistics[0];
  const all = {
    ...base,
    id: "phase-all",
    kind: "phase",
    seasonId: "season-001",
    phaseId: "regular",
    scope: "all-teams",
    stats: { averages: { ppg: 10.13 } },
  };
  const team = { ...all, id: "phase-team", scope: "team", teamId: "team-a" };
  data.statistics.push(all, team);
  data.revisions.push(
    ...[all, team].map((record) => ({
      ...data.revisions[0],
      id: "rev-" + record.id,
      recordId: record.id,
      recordKind: "phase",
    })),
  );
  assert.equal(validateDataset(data).success, true);
  const third = { ...all, id: "phase-alias" };
  data.statistics.push(third);
  assert.equal(validateDataset(data).success, false);
});
test("transfer histories and awards validate their references and review evidence", () => {
  const data = publishedDataset();
  data.teamHistory = [
    {
      id: "stint-a",
      playerId: "abel",
      teamId: "team-a",
      seasonId: "season-001",
      startedAt: "2026-01-01",
      endedAt: "2026-02-01",
    },
    {
      id: "stint-b",
      playerId: "abel",
      teamId: "team-b",
      seasonId: "season-001",
      startedAt: "2026-02-02",
    },
  ];
  data.awards = [
    {
      id: "award-a",
      seasonId: "season-001",
      playerId: "abel",
      type: "other",
      label: "Test award",
      sourceIds: ["source-a"],
      revision: 1,
    },
  ];
  data.revisions.push({
    ...data.revisions[0],
    id: "award-revision",
    recordKind: "award",
    recordId: "award-a",
  });
  assert.equal(validateDataset(data).success, true);
  data.teamHistory[1].teamId = "missing-team";
  assert.equal(validateDataset(data).success, false);
});

test("a correction created after batch approval requires a fresh review", () => {
  const data = publishedDataset();
  data.revisions[0].createdAt = "2026-01-02T00:00:00Z";
  const result = validateDataset(data);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((issue) => issue.message.includes("after approval")));
});
test("award recipients can be corrected through reviewed versions", () => {
  const data = publishedDataset();
  const award = {
    id: "award-a",
    seasonId: "season-001",
    playerId: "abel",
    type: "mvp",
    label: "Test award",
    sourceIds: ["source-a"],
    revision: 1,
  };
  data.awards = [award, { ...award, playerId: "marco-barbosa", revision: 2 }];
  data.revisions.push(
    { ...data.revisions[0], id: "award-rev-a", recordKind: "award", recordId: "award-a" },
    {
      ...data.revisions[0],
      id: "award-rev-b",
      recordKind: "award",
      recordId: "award-a",
      revision: 2,
      supersedesRevision: 1,
      reason: "Test recipient correction prepared before review",
    },
  );
  assert.equal(validateDataset(data).success, true);
});
