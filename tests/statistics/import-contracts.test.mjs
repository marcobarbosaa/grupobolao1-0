import test from "node:test";
import assert from "node:assert/strict";
import {
  candidateBatchSchema,
  publicationAuthorizationSchema,
} from "../../src/lib/statistics/import-contracts.ts";
import {
  normalizeImportNumber,
  normalizeImportStatistics,
  resolveImportPlayer,
} from "../../src/lib/statistics/import-normalization.ts";
import { getRegisteredPlayers } from "../../src/lib/statistics/schemas.ts";
import { candidate, addGameItem } from "./import-fixtures.mjs";
test("candidate contracts accept partial records but refuse self-approval and unknown keys", () => {
  const batch = candidate();
  addGameItem(batch);
  batch.items.push({
    id: "award-test",
    kind: "award",
    award: { type: "mvp", label: "Synthetic MVP" },
  });
  assert.equal(candidateBatchSchema.safeParse(batch).success, true);
  batch.approved = true;
  assert.equal(candidateBatchSchema.safeParse(batch).success, false);
  delete batch.approved;
  batch.items[0].legacyScore = 99;
  assert.equal(candidateBatchSchema.safeParse(batch).success, false);
});
test("invalid IDs, duplicate entries and image source metadata are rejected", () => {
  for (const mutate of [
    (b) => {
      b.id = "../bad";
    },
    (b) => b.items.push(structuredClone(b.items[0])),
    (b) => {
      b.sources[0].source.contentHash = "bad";
    },
    (b) => {
      b.sources[0].path = "../image.png";
    },
    (b) => {
      b.sources[0].source.kind = "document";
    },
    (b) => {
      b.receivedAt = "2020-01-01T00:00:00Z";
    },
  ]) {
    const batch = candidate();
    mutate(batch);
    assert.equal(candidateBatchSchema.safeParse(batch).success, false);
  }
});
test("decimal normalization preserves declared precision and genuine zero", () => {
  assert.deepEqual(normalizeImportNumber("27,40", false), { value: 27.4, decimals: 2 });
  assert.deepEqual(normalizeImportNumber("27.4", false), { value: 27.4, decimals: 1 });
  assert.equal(normalizeImportNumber("50%", true).value, 50);
  assert.equal(normalizeImportNumber("0", false).value, 0);
  assert.equal(normalizeImportNumber("1,234", false, ",").value, 1.234);
  for (const raw of ["?", "--", "1 234", "1,234.5", "1e3", "-1", "NaN", "1,234", "01"])
    assert.throws(() => normalizeImportNumber(raw, false));
  assert.throws(() => normalizeImportNumber("20%", false));
  assert.throws(() => normalizeImportNumber("1,2", false, "."));
  assert.throws(() => normalizeImportNumber(Infinity, false));
});
test("screen context disambiguates PTS and never defaults unknown numbers to zero", () => {
  const item = candidateBatchSchema.parse(candidate()).items[0];
  const average = normalizeImportStatistics(item);
  assert.equal(average.stats.averages.ppg, 27.4);
  assert.equal(average.displayPrecision.ppg, 2);
  item.screen = "totals";
  item.values = [
    { label: "PTS", value: "27" },
    { label: "AST", value: null },
  ];
  const total = normalizeImportStatistics(item);
  assert.equal(total.stats.totals.points, 27);
  assert.equal(total.stats.totals.assists, undefined);
  assert.deepEqual(total.missing, ["assists"]);
  delete item.screen;
  assert.throws(() => normalizeImportStatistics(item), /semantics/);
});
test("normalization refuses unknown, duplicate, out-of-range and inconsistent metrics", () => {
  const item = candidateBatchSchema.parse(candidate()).items[0];
  item.screen = "totals";
  for (const values of [
    [{ label: "unknown", value: "1" }],
    [{ label: "FG%", value: "101" }],
    [{ label: "PTS", value: "1.5" }],
    [
      { label: "PTS", value: "1" },
      { label: "points", value: "2" },
    ],
    [
      { label: "FGM", value: "10" },
      { label: "FGA", value: "5" },
    ],
    [{ label: "ppg", value: "0.123456789" }],
  ]) {
    item.values = values;
    assert.throws(() => normalizeImportStatistics(item));
  }
});
test("all 13 identities resolve exactly; aliases are explicit and ambiguity never auto-matches", () => {
  for (const player of getRegisteredPlayers())
    assert.equal(resolveImportPlayer({ name: player.name }, []), player.id);
  assert.throws(() => resolveImportPlayer({ name: "Marco Barboza" }, []), /Unknown/);
  const alias = {
    name: "MB",
    playerId: "marco-barbosa",
    approvedBy: "reviewer",
    approvedAt: "2026-01-01T00:00:00Z",
  };
  assert.equal(resolveImportPlayer({ name: "MB" }, [alias]), "marco-barbosa");
  assert.throws(
    () => resolveImportPlayer({ name: "MB" }, [alias, { ...alias, playerId: "abel" }]),
    /Ambiguous/,
  );
  assert.throws(() => resolveImportPlayer({ id: "abel", name: "MB" }, [alias]), /disagree/);
});
test("authorization schema is distinct and requires content, baseline and scope bindings", () => {
  assert.equal(publicationAuthorizationSchema.safeParse({ approved: true }).success, false);
});

test("lossy normalization is refused rather than rounded silently", () => {
  assert.throws(() => normalizeImportNumber("0.10000000000000001", false, "."), /precision/);
  assert.throws(() => normalizeImportNumber("9007199254740993", false), /precision/);
  assert.equal(normalizeImportNumber("0.00000001", false, ".").value, 0.00000001);
});
