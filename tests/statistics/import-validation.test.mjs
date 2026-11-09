import test from "node:test";
import assert from "node:assert/strict";
import { reviewCandidate } from "../../src/lib/statistics/import-validation.ts";
import { candidate, addGameItem, emptyDataset } from "./import-fixtures.mjs";
import { selectCurrentRevisions } from "../../src/lib/statistics/revisions.ts";
test("future seasons and partial multi-player imports prepare without changing the baseline", () => {
  const batch = candidate(),
    baseline = emptyDataset(),
    before = structuredClone(baseline);
  addGameItem(batch, "game-one", "marco-barbosa");
  const result = reviewCandidate(batch, baseline);
  assert.equal(result.report.ready, true, JSON.stringify(result.report.issues));
  assert.equal(result.proposal.seasons[0].id, "season-003");
  assert.equal(result.proposal.statistics.length, 2);
  assert.equal(result.proposal.statistics[0].stats.totals.points, undefined);
  assert.deepEqual(baseline, before);
});
test("missing identity, game, screen or unknown fields remain blocking pending issues", () => {
  for (const mutate of [
    (b) => {
      delete b.items[0].player;
    },
    (b) => {
      b.items[0].player.id = "missing";
    },
    (b) => {
      delete b.items[0].seasonId;
    },
    (b) => {
      delete b.items[0].screen;
    },
    (b) => {
      b.items[0].phaseId = "nba-finals";
      b.items[0].kind = "phase-summary";
    },
    (b) => {
      b.items[0].unrecognizedFields = [{ label: "unclear", value: "?" }];
    },
    (b) => {
      b.items[0].sourceIds = ["missing-source"];
    },
  ]) {
    const batch = candidate();
    mutate(batch);
    const result = reviewCandidate(batch, emptyDataset());
    assert.equal(result.report.ready, false);
    assert.ok(result.report.issues.length);
    assert.equal(result.proposal, undefined);
  }
});
test("game identity is explicit; repeated opponents are distinct games and aggregate playoffs is refused", () => {
  const batch = candidate();
  batch.items = [];
  addGameItem(batch, "game-one");
  addGameItem(batch, "game-two");
  assert.equal(reviewCandidate(batch, emptyDataset()).report.ready, true);
  delete batch.items[0].gameId;
  assert.equal(reviewCandidate(batch, emptyDataset()).report.ready, false);
  batch.items[0].gameId = "game-one";
  batch.entities.games[0].value.phaseId = "playoffs";
  assert.equal(reviewCandidate(batch, emptyDataset()).report.ready, false);
});
test("awards and transfer history retain sources in the reviewed change receipt", () => {
  const batch = candidate();
  batch.items = [
    {
      id: "award-new",
      kind: "award",
      player: { id: "abel" },
      seasonId: "season-003",
      sourceIds: ["source-test"],
      award: { type: "mvp", label: "Synthetic award" },
    },
    {
      id: "history-new",
      kind: "team-history",
      player: { id: "abel" },
      seasonId: "season-003",
      teamId: "team-a",
      sourceIds: ["source-test"],
      history: {},
    },
  ];
  const result = reviewCandidate(batch, emptyDataset());
  assert.equal(result.report.ready, true, JSON.stringify(result.report.issues));
  assert.equal(result.proposal.awards.length, 1);
  assert.equal(result.proposal.teamHistory.length, 1);
  assert.deepEqual(result.report.changes.at(-1).sourceIds, ["source-test"]);
});
test("same image and identical logical record are detected without creating independent versions", () => {
  const first = reviewCandidate(candidate(), emptyDataset()).proposal;
  const second = candidate();
  second.id = "import-again";
  second.receivedAt = "2026-02-02T12:00:00Z";
  second.sources[0].source.id = "same-image-alias";
  second.items[0].sourceIds = ["same-image-alias"];
  for (const rows of Object.values(second.entities))
    rows.forEach((e) => {
      e.sourceIds = ["same-image-alias"];
    });
  const result = reviewCandidate(second, first);
  assert.equal(result.report.sourceMapping["same-image-alias"], "source-test");
  assert.equal(result.report.changes.find((c) => c.itemId === "summary-test").action, "duplicate");
  assert.equal(result.report.ready, false); // no-op publication is refused
});
test("divergent numbers produce explicit conflicts and require a correction reason/current revision", () => {
  const first = reviewCandidate(candidate(), emptyDataset()).proposal;
  const second = candidate();
  second.id = "import-correction";
  second.receivedAt = "2026-02-02T12:00:00Z";
  second.items[0].values[1].value = "28,40";
  const pending = reviewCandidate(second, first);
  assert.equal(pending.report.ready, false);
  const conflict = pending.report.conflicts.find((c) => c.metric === "stats.averages.ppg");
  assert.equal(conflict.existingValue, 27.4);
  assert.equal(conflict.candidateValue, 28.4);
  second.items[0].correction = { expectedRevision: 1, reason: "Synthetic correction" };
  const corrected = reviewCandidate(second, first);
  assert.equal(corrected.report.ready, true, JSON.stringify(corrected.report.issues));
  assert.equal(corrected.proposal.statistics.length, 2);
  assert.equal(selectCurrentRevisions(corrected.proposal).records[0].revision, 2);
  assert.deepEqual(corrected.proposal.statistics[0], first.statistics[0]);
});
test("duplicate identities in a batch and changed metadata cannot silently overwrite history", () => {
  const batch = candidate();
  batch.items.push({ ...structuredClone(batch.items[0]), id: "another-id" });
  assert.equal(reviewCandidate(batch, emptyDataset()).report.ready, false);
  const first = reviewCandidate(candidate(), emptyDataset()).proposal;
  const next = candidate();
  next.id = "import-next";
  next.entities.seasons[0].value.label = "Changed";
  assert.equal(reviewCandidate(next, first).report.ready, false);
});
test("mathematical inconsistency is blocked using the existing engine and documented precision", () => {
  const batch = candidate();
  batch.items[0].values = [
    { label: "gp", value: "3" },
    { label: "points", value: "61" },
    { label: "ppg", value: "20.4" },
  ];
  const invalid = reviewCandidate(batch, emptyDataset());
  assert.equal(invalid.report.ready, false);
  assert.ok(invalid.report.issues.some((i) => i.layer === "statistical"));
  batch.items[0].values[2].value = "20.3";
  assert.equal(reviewCandidate(batch, emptyDataset()).report.ready, true);
});
