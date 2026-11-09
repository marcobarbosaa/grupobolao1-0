import test from "node:test";
import assert from "node:assert/strict";
import { statisticsSchema } from "../../src/lib/statistics/metrics.ts";
import {
  playerPhaseStatsSchema,
  playerGameStatsSchema,
  playerTeamHistorySchema,
  importBatchSchema,
  importSourceSchema,
  dataRevisionSchema,
  awardSchema,
  manifestSchema,
} from "../../src/lib/statistics/schemas.ts";
import { availabilityStatusSchema, importStatusSchema } from "../../src/lib/statistics/statuses.ts";
import { publishedDataset, emptyManifest } from "./fixtures.mjs";

test("statistics preserve missing fields, true zeros and approved precision", () => {
  assert.deepEqual(statisticsSchema.parse({}), {});
  const input = {
    totals: { blocks: 0, minutes: 31.25 },
    averages: { ppg: 18.123456 },
    percentages: { fgPct: 0, ftPct: 100 },
  };
  assert.deepEqual(statisticsSchema.parse(input), input);
  assert.equal("points" in statisticsSchema.parse(input).totals, false);
});
test("metrics reject non-finite, negative, fractional counts, strings and unknown fields", () => {
  for (const value of [NaN, Infinity, -Infinity, -1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(
      statisticsSchema.safeParse({ totals: { blocks: value } }).success,
      false,
      String(value),
    );
  }
  for (const value of [NaN, Infinity, -1, 100.001])
    assert.equal(statisticsSchema.safeParse({ percentages: { fgPct: value } }).success, false);
  assert.equal(statisticsSchema.safeParse({ totals: { legacyScore: 99 } }).success, false);
  assert.equal(statisticsSchema.safeParse({ averages: { ppg: -0.1 } }).success, false);
});
test("shot constraints run only when both counts are known", () => {
  for (const [made, attempted] of [
    ["fgm", "fga"],
    ["threePm", "threePa"],
    ["ftm", "fta"],
  ]) {
    assert.equal(statisticsSchema.safeParse({ totals: { [made]: 4 } }).success, true);
    assert.equal(
      statisticsSchema.safeParse({ totals: { [made]: 4, [attempted]: 3 } }).success,
      false,
    );
    assert.equal(
      statisticsSchema.safeParse({ totals: { [made]: 0, [attempted]: 0 } }).success,
      true,
    );
  }
});
test("team and all-teams scopes cannot be confused across transfers", () => {
  const { gameId: _gameId, ...record } = publishedDataset().statistics[0];
  const phase = {
    ...record,
    kind: "phase",
    seasonId: "season-001",
    phaseId: "regular",
    scope: "team",
  };
  assert.equal(playerPhaseStatsSchema.safeParse(phase).success, true);
  assert.equal(playerPhaseStatsSchema.safeParse({ ...phase, teamId: undefined }).success, false);
  assert.equal(playerPhaseStatsSchema.safeParse({ ...phase, scope: "all-teams" }).success, false);
  assert.equal(
    playerPhaseStatsSchema.safeParse({ ...phase, scope: "all-teams", teamId: undefined }).success,
    true,
  );
  const history = { id: "stint-a", playerId: "abel", teamId: "team-a", seasonId: "season-001" };
  assert.equal(playerTeamHistorySchema.safeParse(history).success, true);
  assert.equal(
    playerTeamHistorySchema.safeParse({
      ...history,
      startedAt: "2026-02-01T00:00:00Z",
      endedAt: "2026-01-01T00:00:00Z",
    }).success,
    false,
  );
});
test("zero is available data, not an import status or an unavailable value", () => {
  const record = publishedDataset().statistics[0];
  assert.equal(playerGameStatsSchema.safeParse(record).success, true);
  assert.equal(
    playerGameStatsSchema.safeParse({ ...record, availability: "not-imported" }).success,
    false,
  );
  assert.equal(
    playerGameStatsSchema.safeParse({ ...record, availability: "not-imported", stats: {} }).success,
    true,
  );
  assert.equal(availabilityStatusSchema.safeParse("approved").success, false);
  assert.equal(importStatusSchema.safeParse("not-qualified").success, false);
});
test("pending batches may be partial; publication needs manual approval and sources", () => {
  const pending = {
    id: "batch-a",
    sourceIds: [],
    status: "pending-review",
    createdAt: "2026-01-01T00:00:00Z",
  };
  assert.equal(importBatchSchema.safeParse(pending).success, true);
  assert.equal(importBatchSchema.safeParse({ ...pending, status: "published" }).success, false);
  const approved = publishedDataset().batches[0];
  assert.equal(importBatchSchema.safeParse(approved).success, true);
  assert.equal(importBatchSchema.safeParse({ ...approved, approvedBy: undefined }).success, false);
  assert.equal(
    importBatchSchema.safeParse({ ...approved, approvedAt: "2025-01-01T00:00:00Z" }).success,
    false,
  );
});
test("sources and revisions enforce audit structure", () => {
  const source = publishedDataset().sources[0];
  assert.equal(
    importSourceSchema.safeParse({ ...source, contentHash: "not-a-sha256" }).success,
    false,
  );
  const revision = publishedDataset().revisions[0];
  assert.equal(dataRevisionSchema.safeParse({ ...revision, revision: 2 }).success, false);
  assert.equal(dataRevisionSchema.safeParse({ ...revision, supersedesRevision: 1 }).success, false);
  assert.equal(
    dataRevisionSchema.safeParse({
      ...revision,
      revision: 2,
      supersedesRevision: 1,
      reason: "Test correction",
    }).success,
    true,
  );
});
test("awards need recipients and provenance, with no artificial points", () => {
  const award = {
    id: "award-a",
    seasonId: "season-001",
    type: "champion",
    label: "Test champion",
    sourceIds: ["source-a"],
    revision: 1,
  };
  assert.equal(awardSchema.safeParse(award).success, false);
  assert.equal(awardSchema.safeParse({ ...award, teamId: "team-a" }).success, true);
  assert.equal(awardSchema.safeParse({ ...award, playerId: "abel", points: 100 }).success, false);
});
test("empty manifest is valid and schema version is mandatory", () => {
  assert.equal(manifestSchema.safeParse(emptyManifest()).success, true);
  assert.equal(
    manifestSchema.safeParse({ ...emptyManifest(), schemaVersion: "2.0" }).success,
    false,
  );
  assert.equal(
    manifestSchema.safeParse({
      ...emptyManifest(),
      seasons: ["seasons/a.json"],
      games: ["SEASONS/a.json"],
    }).success,
    false,
  );
});
