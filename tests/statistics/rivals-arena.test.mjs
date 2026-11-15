import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  comparisonMetrics,
  compareMetric,
  formatMetric,
  getSeasonRecord,
  metricValue,
  summarizeComparison,
} from "../../src/lib/rivals-arena.ts";
const read = (path) => JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const records = read("src/data/statistics/season-008/statistics.json");
test("comparison distinguishes zeros, ties, unavailable and lower-is-better", () => {
  assert.equal(compareMetric(0, 0), "tie");
  assert.equal(compareMetric(undefined, 0), "unavailable");
  assert.equal(compareMetric(undefined, undefined), "unavailable");
  assert.equal(compareMetric(2, 3), "b");
  assert.equal(compareMetric(2, 3, true), "a");
  assert.equal(formatMetric(0, comparisonMetrics[6]), "0,0%");
  assert.equal(formatMetric(undefined, comparisonMetrics[0]), "—");
});
test("published regular seasons are isolated and summary is symmetric", () => {
  const a = getSeasonRecord(records, "marco-barbosa", "season-008");
  const b = getSeasonRecord(records, "nando", "season-008");
  assert.ok(a);
  assert.ok(b);
  assert.equal(a.phaseId, "regular");
  assert.equal(metricValue(a, comparisonMetrics[0]), a.stats.averages.ppg);
  assert.equal(getSeasonRecord(records, "marco-barbosa", "season-001"), undefined);
  const result = summarizeComparison(a, b),
    reverse = summarizeComparison(b, a);
  assert.equal(result.a, reverse.b);
  assert.equal(result.b, reverse.a);
  assert.equal(result.tie, reverse.tie);
  assert.equal(result.a + result.b + result.tie + result.unavailable, 9);
  assert.deepEqual(summarizeComparison(undefined, b), { a: 0, b: 0, tie: 0, unavailable: 9 });
});
test("multiple team stints cannot silently select a partial season", () => {
  const a = records[0];
  assert.equal(getSeasonRecord([a, { ...a, teamId: "other" }], a.playerId, a.seasonId), undefined);
  const combined = { ...a, scope: "all-teams", teamId: undefined };
  assert.equal(getSeasonRecord([a, combined], a.playerId, a.seasonId), combined);
});
