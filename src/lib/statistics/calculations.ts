import type { AverageMetric, PercentageMetric, TotalMetric } from "./derived-types.ts";

export const averageNumerators = {
  ppg: "points",
  rpg: "rebounds",
  apg: "assists",
  spg: "steals",
  bpg: "blocks",
  topg: "turnovers",
  mpg: "minutes",
} as const satisfies Record<AverageMetric, TotalMetric>;
export const percentageOperands = {
  fgPct: ["fgm", "fga"],
  threePct: ["threePm", "threePa"],
  ftPct: ["ftm", "fta"],
} as const satisfies Record<PercentageMetric, readonly [TotalMetric, TotalMetric]>;
export type Calculation =
  | { status: "available"; value: number }
  | { status: "insufficient-data" | "undefined"; value: null; reason: string };
function valid(value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0))
    throw new RangeError("Statistics require finite nonnegative numbers");
}
export function calculateAverage(total?: number, games?: number): Calculation {
  valid(total);
  valid(games);
  if (games !== undefined && !Number.isSafeInteger(games))
    throw new RangeError("Games must be a safe integer");
  if (total === undefined || games === undefined)
    return { status: "insufficient-data", value: null, reason: "Missing numerator or games" };
  if (games === 0) return { status: "undefined", value: null, reason: "Zero denominator" };
  const value = total / games;
  if (!Number.isFinite(value)) throw new RangeError("Numeric overflow");
  return { status: "available", value };
}
export function calculatePercentage(made?: number, attempted?: number): Calculation {
  valid(made);
  valid(attempted);
  for (const value of [made, attempted])
    if (value !== undefined && !Number.isSafeInteger(value))
      throw new RangeError("Shot counts must be safe integers");
  if (made !== undefined && attempted !== undefined && made > attempted)
    throw new RangeError("Made shots exceed attempts");
  const result = calculateAverage(made, attempted);
  return result.status === "available" ? { ...result, value: result.value * 100 } : result;
}
/** Only for values from proven distinct units. Aggregators establish disjointness. */
export function sumCounts(values: readonly (number | undefined)[], decimal = false): Calculation {
  values.forEach((value) => {
    valid(value);
    if (value !== undefined && !decimal && !Number.isSafeInteger(value))
      throw new RangeError("Counts must be safe integers");
  });
  if (!values.length || values.some((value) => value === undefined))
    return { status: "insufficient-data", value: null, reason: "Missing summand" };
  // Compensated summation limits floating point drift for minutes.
  let total = 0,
    compensation = 0;
  for (const value of values) {
    const adjusted = value! - compensation;
    const next = total + adjusted;
    compensation = next - total - adjusted;
    total = next;
  }
  if (!Number.isFinite(total) || (!decimal && !Number.isSafeInteger(total)))
    throw new RangeError("Sum exceeds numeric precision");
  return { status: "available", value: total };
}
/** Half of a documented display unit, plus floating point arithmetic error only. */
export function roundingTolerance(decimals: number, magnitude = 1): number {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8)
    throw new RangeError("Display precision must be between 0 and 8 decimals");
  valid(magnitude);
  return 0.5 * 10 ** -decimals + Number.EPSILON * Math.max(1, magnitude) * 8;
}
