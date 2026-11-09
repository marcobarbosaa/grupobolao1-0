import { collectRepresentations, metricNames, metricsAgree } from "./aggregation.ts";
import type { Comparison, Metric, StatisticalResult, StatisticsQuery } from "./derived-types.ts";

/** Prefer a certified consolidated source; otherwise prefer complete evidence, then explicit source order.
 * Never fill holes in the selected representation using an overlapping alternative.
 */
export function selectSeasonStats(input: unknown, query: StatisticsQuery): StatisticalResult {
  const candidates = collectRepresentations(input, query);
  const selected =
    candidates.find(
      (candidate) =>
        candidate.representation === "consolidated" && candidate.coverage.status === "complete",
    ) ??
    candidates.find((candidate) => candidate.coverage.status === "complete") ??
    candidates.find((candidate) =>
      Object.values(candidate.metrics).some(
        (metric) => metric?.status === "available" || metric?.status === "conflict",
      ),
    ) ??
    candidates.find((candidate) => candidate.sourceRecords.length > 0) ??
    candidates[candidates.length - 1];
  const output = structuredClone(selected);
  const complete = candidates.filter((candidate) => candidate.coverage.status === "complete");
  for (const key of metricNames) {
    const values = complete
      .map((candidate) => candidate.metrics[key])
      .filter((metric) => metric?.status === "available" && metric.coverage.status === "complete");
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const a = values[i]!,
          b = values[j]!;
        if (!metricsAgree(a, b)) {
          const reason = "Complete representations disagree; manual review required";
          output.conflicts.push({ metric: key, reason, candidates: [a, b] });
          output.metrics[key] = {
            ...(output.metrics[key] ?? a),
            value: null,
            status: "conflict",
            reason,
          };
        }
      }
    }
  }
  // Do not hide an internally inconsistent complete alternative behind source priority.
  for (const candidate of complete) {
    if (candidate === selected) continue;
    for (const conflict of candidate.conflicts) {
      output.conflicts.push(conflict);
      output.metrics[conflict.metric] = {
        ...conflict.candidates[0],
        value: null,
        status: "conflict",
        reason: conflict.reason,
      };
    }
  }
  output.warnings = [...new Set(candidates.flatMap((candidate) => candidate.warnings))];
  output.gameCount = output.metrics.gp?.status === "available" ? output.metrics.gp.value : null;
  return output;
}
export function compareStatistics(
  input: unknown,
  leftQuery: StatisticsQuery,
  rightQuery: StatisticsQuery,
  metrics: readonly Metric[] = metricNames,
): Comparison {
  const left = selectSeasonStats(input, leftQuery),
    right = selectSeasonStats(input, rightQuery);
  for (const metric of metrics)
    if (!metricNames.includes(metric)) throw new RangeError("Unknown comparison metric: " + metric);
  return {
    left,
    right,
    metrics: [...new Set(metrics)].map((metric) => {
      const a = left.metrics[metric] ?? null,
        b = right.metrics[metric] ?? null;
      const comparable =
        a?.status === "available" &&
        b?.status === "available" &&
        a.coverage.status === "complete" &&
        b.coverage.status === "complete";
      return {
        metric,
        left: a,
        right: b,
        comparable,
        reason: comparable
          ? undefined
          : "Both sides need available values and complete metric coverage",
      };
    }),
  };
}
