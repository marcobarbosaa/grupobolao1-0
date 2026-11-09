import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAverage,
  calculatePercentage,
  sumCounts,
  roundingTolerance,
} from "../../src/lib/statistics/calculations.ts";

test("averages preserve full decimal precision and genuine zero", () => {
  assert.equal(calculateAverage(50, 2).value, 25);
  assert.equal(calculateAverage(1, 3).value, 1 / 3);
  assert.equal(calculateAverage(0, 2).value, 0);
  assert.equal(calculateAverage(10.5, 2).value, 5.25);
});
test("missing operands and zero denominators are semantically distinct", () => {
  assert.equal(calculateAverage(undefined, 2).status, "insufficient-data");
  assert.equal(calculateAverage(5, undefined).value, null);
  assert.equal(calculateAverage(0, 0).status, "undefined");
  assert.equal(calculatePercentage(0, 0).status, "undefined");
  assert.equal(calculatePercentage(undefined, 0).status, "insufficient-data");
});
test("shot percentages use ratios rather than means of percentages", () => {
  assert.equal(calculatePercentage(1, 4).value, 25);
  assert.equal(calculatePercentage(1, 3).value, (1 / 3) * 100);
  assert.equal(calculatePercentage(0, 5).value, 0);
  assert.throws(() => calculatePercentage(3, 2), RangeError);
  assert.throws(() => calculatePercentage(0.5, 2), RangeError);
});
test("invalid values and unsafe sums fail instead of producing misleading numbers", () => {
  for (const value of [NaN, Infinity, -Infinity, -1]) {
    assert.throws(() => calculateAverage(value, 2), RangeError);
    assert.throws(() => calculatePercentage(1, value), RangeError);
    assert.throws(() => sumCounts([value]), RangeError);
  }
  assert.throws(() => calculateAverage(3, 1.5), RangeError);
  assert.throws(() => sumCounts([Number.MAX_SAFE_INTEGER, 1]), RangeError);
  assert.throws(() => sumCounts([Number.MAX_VALUE, Number.MAX_VALUE], true), RangeError);
});
test("sums refuse absent summands and preserve total minutes", () => {
  assert.equal(sumCounts([0, 10]).value, 10);
  assert.equal(sumCounts([undefined, 10]).status, "insufficient-data");
  assert.equal(sumCounts([]).value, null);
  assert.equal(sumCounts([12.25, 2.5], true).value, 14.75);
});
test("rounding tolerance is half of the declared display unit", () => {
  assert.ok(Math.abs(roundingTolerance(1) - 0.05) < 1e-12);
  assert.ok(Math.abs(roundingTolerance(2) - 0.005) < 1e-12);
  assert.throws(() => roundingTolerance(-1), RangeError);
  assert.throws(() => roundingTolerance(9), RangeError);
});
