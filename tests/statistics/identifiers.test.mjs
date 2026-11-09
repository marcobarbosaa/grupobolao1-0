import test from "node:test";
import assert from "node:assert/strict";
import { newRoster } from "../../src/lib/new-roster.ts";
import { getRegisteredPlayers } from "../../src/lib/statistics/schemas.ts";
import {
  identifierSchema,
  playerIdSchema,
  gameStatsKey,
  phaseStatsKey,
} from "../../src/lib/statistics/identifiers.ts";
import { validateDataset, validateAppendOnly } from "../../src/lib/statistics/validate.ts";
import { emptyDataset, publishedDataset, correctedDataset, season } from "./fixtures.mjs";

test("all 13 permanent player IDs and names come from the existing registry", () => {
  const players = getRegisteredPlayers();
  assert.equal(players.length, 13);
  assert.deepEqual(
    players.map((p) => [p.id, p.name, p.sport]),
    newRoster.map((p) => [p.id, p.name, p.sport]),
  );
  for (const p of players) assert.equal(playerIdSchema.safeParse(p.id).success, true);
  for (const id of ["", "../abel", "Abel", "legacy-player", "8"])
    assert.equal(playerIdSchema.safeParse(id).success, false);
  assert.equal(identifierSchema.safeParse("team-001").success, true);
});
test("duplicate IDs and unknown players are rejected in a real dataset", () => {
  const data = publishedDataset();
  assert.equal(validateDataset(data).success, true);
  data.teams.push({ ...data.teams[0] });
  assert.equal(validateDataset(data).success, false);
  const unknown = publishedDataset();
  unknown.statistics[0].playerId = "unknown-player";
  assert.equal(validateDataset(unknown).success, false);
});
test("logical keys distinguish games and scopes without relying on names or dates", () => {
  assert.notEqual(
    gameStatsKey({ gameId: "game-a", playerId: "abel" }),
    gameStatsKey({ gameId: "game-b", playerId: "abel" }),
  );
  const base = { playerId: "abel", seasonId: "season-001", phaseId: "regular", scope: "all-teams" };
  assert.equal(phaseStatsKey(base), phaseStatsKey({ ...base, teamId: "irrelevant" }));
  assert.notEqual(phaseStatsKey(base), phaseStatsKey({ ...base, scope: "team", teamId: "team-a" }));
  assert.notEqual(
    phaseStatsKey({ ...base, scope: "team", teamId: "team-a" }),
    phaseStatsKey({ ...base, scope: "team", teamId: "team-b" }),
  );
});
test("logical duplicate stats cannot bypass identity with a different ID", () => {
  const data = publishedDataset();
  data.statistics.push({ ...data.statistics[0], id: "alias-id" });
  assert.equal(validateDataset(data).success, false);
  const duplicatedVersion = publishedDataset();
  duplicatedVersion.statistics.push({ ...duplicatedVersion.statistics[0] });
  assert.equal(validateDataset(duplicatedVersion).success, false);
});
test("complete snapshots can arrive out of order and contain seasons with no statistics", () => {
  const data = emptyDataset();
  data.seasons = [season(12), season(2), season(1)];
  assert.equal(validateDataset(data).success, true);
  const revised = correctedDataset();
  revised.statistics.reverse();
  revised.revisions.reverse();
  assert.equal(validateDataset(revised).success, true);
});
test("all references, game teams and configured phases are checked", () => {
  for (const mutate of [
    (data) => {
      data.statistics[0].gameId = "missing-game";
    },
    (data) => {
      data.games[0].seasonId = "season-099";
    },
    (data) => {
      data.games[0].homeTeamId = "missing-team";
    },
    (data) => {
      data.statistics[0].sourceIds = ["missing-source"];
    },
    (data) => {
      data.revisions[0].batchId = "missing-batch";
    },
    (data) => {
      data.games[0].phaseId = "nba-finals";
    },
    (data) => {
      data.games[0].status = "scheduled";
    },
    (data) => {
      data.teams.push({ ...data.teams[0], id: "team-c" });
      data.statistics[0].teamId = "team-c";
    },
  ]) {
    const data = publishedDataset();
    mutate(data);
    assert.equal(validateDataset(data).success, false);
  }
});
test("published records require approved source coverage and matching audit entries", () => {
  for (const mutate of [
    (data) => {
      data.revisions = [];
    },
    (data) => {
      data.batches[0].status = "pending-review";
    },
    (data) => {
      data.sources = [];
    },
    (data) => {
      data.statistics[0].sourceIds = [];
    },
    (data) => {
      data.batches[0].sourceIds = [];
    },
    (data) => {
      data.sources.push({ ...data.sources[0], id: "source-b", contentHash: "b".repeat(64) });
      data.revisions[0].sourceIds = ["source-b"];
    },
  ]) {
    const data = publishedDataset();
    mutate(data);
    assert.equal(validateDataset(data).success, false);
  }
});
test("revisions retain the predecessor and cannot change the record identity", () => {
  const valid = correctedDataset();
  assert.equal(validateDataset(valid).success, true);
  for (const mutate of [
    (data) => {
      data.statistics.shift();
      data.revisions.shift();
    },
    (data) => {
      data.revisions[1].createdAt = "2025-01-01T00:00:00Z";
    },
    (data) => {
      data.statistics[1].playerId = "marco-barbosa";
    },
  ]) {
    const data = correctedDataset();
    mutate(data);
    assert.equal(validateDataset(data).success, false);
  }
});
test("baseline guard rejects silent edits or deletions and allows appended revisions", () => {
  const previous = publishedDataset();
  assert.deepEqual(validateAppendOnly(previous, correctedDataset()), []);
  const changed = publishedDataset();
  changed.statistics[0].stats.totals.blocks = 3;
  assert.ok(validateAppendOnly(previous, changed).length > 0);
  assert.ok(validateAppendOnly(previous, emptyDataset()).length > 0);
  const rollback = publishedDataset();
  rollback.batches[0].status = "approved";
  assert.ok(validateAppendOnly(previous, rollback).length > 0);
  const sourceChanged = publishedDataset();
  sourceChanged.sources[0].contentHash = "f".repeat(64);
  assert.ok(validateAppendOnly(previous, sourceChanged).length > 0);
});
