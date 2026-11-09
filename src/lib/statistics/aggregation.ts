import { z } from "zod";
import { metricCatalog } from "./metrics.ts";
import { playerIdSchema, seasonIdSchema, identifierSchema } from "./identifiers.ts";
import { phaseIdSchema } from "./phases.ts";
import { selectCurrentRevisions, StatisticalInputError } from "./revisions.ts";
import { periodCoverage, gameCoverage, metricCoverage } from "./coverage.ts";
import {
  averageNumerators,
  percentageOperands,
  calculateAverage,
  calculatePercentage,
  sumCounts,
  roundingTolerance,
} from "./calculations.ts";
import type {
  Coverage,
  DerivedMetric,
  Metric,
  StatisticalRecord,
  StatisticalResult,
  StatisticsQuery,
  TotalMetric,
  MetricConflict,
} from "./derived-types.ts";
import type { PlayerPhaseStats } from "./types.ts";

export const statisticsQuerySchema = z
  .object({
    playerId: playerIdSchema,
    seasonId: seasonIdSchema,
    phaseId: phaseIdSchema,
    teamId: identifierSchema.optional(),
  })
  .strict();
export const metricNames: Metric[] = [
  ...Object.keys(metricCatalog.totals),
  ...Object.keys(metricCatalog.averages),
  ...Object.keys(metricCatalog.percentages),
] as Metric[];
const unique = <T>(values: readonly T[]) => [...new Set(values)];
function references(records: readonly StatisticalRecord[]) {
  return records.map(({ kind, id, revision }) => ({ kind, id, revision }));
}
function context(input: unknown, queryInput: StatisticsQuery) {
  const query = statisticsQuerySchema.parse(queryInput);
  const { dataset, records } = selectCurrentRevisions(input);
  const season = dataset.seasons.find((item) => item.id === query.seasonId);
  if (!season)
    throw new StatisticalInputError([{ path: "query.seasonId", message: "Unknown season" }]);
  if (
    !season.phases.some((phase) => phase.id === query.phaseId) &&
    !(
      query.phaseId === "playoffs" &&
      season.phases.some((phase) => phase.id !== "regular" && phase.type === "stage")
    )
  )
    throw new StatisticalInputError([{ path: "query.phaseId", message: "Unconfigured phase" }]);
  if (query.teamId && !dataset.teams.some((team) => team.id === query.teamId))
    throw new StatisticalInputError([{ path: "query.teamId", message: "Unknown team" }]);
  const rounds = season.phases
    .filter((phase) => phase.type === "stage" && phase.id !== "regular")
    .map((phase) => phase.id);
  const phaseMatches = (phase: string) =>
    query.phaseId === "playoffs"
      ? rounds.includes(phase as (typeof rounds)[number])
      : phase === query.phaseId;
  const games = records.filter((record) => {
    if (
      record.kind !== "game" ||
      record.playerId !== query.playerId ||
      (query.teamId && record.teamId !== query.teamId)
    )
      return false;
    const game = dataset.games.find((item) => item.id === record.gameId)!;
    return game.seasonId === query.seasonId && phaseMatches(game.phaseId);
  });
  const phases = records.filter(
    (record): record is PlayerPhaseStats =>
      record.kind === "phase" &&
      record.playerId === query.playerId &&
      record.seasonId === query.seasonId &&
      (query.teamId ? record.teamId === query.teamId : record.scope === "all-teams"),
  );
  const direct = phases.find((record) => record.phaseId === query.phaseId);
  return { dataset, records, query, rounds, games, phases, direct };
}
function derived(
  metric: Metric,
  value: number | null,
  records: readonly StatisticalRecord[],
  coverage: Coverage,
  method: DerivedMetric["method"],
  status: DerivedMetric["status"] = "available",
  reason?: string,
): DerivedMetric {
  return {
    metric,
    value,
    status,
    method,
    reason,
    sourceRecordIds: unique(records.map((record) => record.id)),
    sourceRecords: references(records),
    sourceIds: unique(records.flatMap((record) => record.sourceIds)),
    coverage,
    precision: {
      kind: method === "ratio" || (method === "sum" && metric === "minutes") ? "derived" : "exact",
    },
  };
}
function totalValue(record: StatisticalRecord, key: TotalMetric): number | undefined {
  // An available per-game record describes one appearance unless it explicitly reports GP=0.
  if (key === "gp" && record.kind === "game") return record.stats.totals?.gp ?? 1;
  return record.stats.totals?.[key];
}
function buildMetrics(records: readonly StatisticalRecord[], coverage: Coverage, required: number) {
  const available = records.filter((record) => record.availability === "available");
  const metrics: StatisticalResult["metrics"] = {};
  for (const key of Object.keys(metricCatalog.totals) as TotalMetric[]) {
    const rows = available.filter((record) => totalValue(record, key) !== undefined);
    const sum = sumCounts(
      rows.map((record) => totalValue(record, key)),
      key === "minutes",
    );
    metrics[key] = derived(
      key,
      sum.value,
      rows,
      metricCoverage(coverage, rows.length, required),
      "sum",
      sum.status,
      sum.status === "available" ? undefined : sum.reason,
    );
  }
  for (const [metric, numerator] of Object.entries(averageNumerators)) {
    const rows = available.filter(
      (record) =>
        totalValue(record, numerator) !== undefined && totalValue(record, "gp") !== undefined,
    );
    const top = sumCounts(
      rows.map((record) => totalValue(record, numerator)),
      numerator === "minutes",
    );
    const bottom = sumCounts(rows.map((record) => totalValue(record, "gp")));
    const ratio = calculateAverage(top.value ?? undefined, bottom.value ?? undefined);
    metrics[metric as Metric] = derived(
      metric as Metric,
      ratio.value,
      rows,
      metricCoverage(coverage, rows.length, required),
      "ratio",
      ratio.status,
      ratio.status === "available" ? undefined : ratio.reason,
    );
  }
  for (const [metric, [numerator, denominator]] of Object.entries(percentageOperands)) {
    const rows = available.filter(
      (record) =>
        totalValue(record, numerator) !== undefined &&
        totalValue(record, denominator) !== undefined,
    );
    const top = sumCounts(rows.map((record) => totalValue(record, numerator)));
    const bottom = sumCounts(rows.map((record) => totalValue(record, denominator)));
    const ratio = calculatePercentage(top.value ?? undefined, bottom.value ?? undefined);
    metrics[metric as Metric] = derived(
      metric as Metric,
      ratio.value,
      rows,
      metricCoverage(coverage, rows.length, required),
      "ratio",
      ratio.status,
      ratio.status === "available" ? undefined : ratio.reason,
    );
  }
  return metrics;
}
function result(
  query: StatisticsQuery,
  representation: StatisticalResult["representation"],
  records: readonly StatisticalRecord[],
  coverage: Coverage,
  history: Coverage,
  required: number,
): StatisticalResult {
  if (representation === "teams" || representation === "rounds") {
    const owner = new Map<string, string>();
    for (const record of records) {
      if (record.kind !== "phase") continue;
      for (const gameId of record.coverage?.expectedGameIds ?? []) {
        if (owner.has(gameId))
          throw new StatisticalInputError([
            {
              path: "statistics." + record.id + ".coverage",
              message: "Overlapping game evidence with " + owner.get(gameId),
            },
          ]);
        owner.set(gameId, record.id);
      }
    }
  }
  const metrics = buildMetrics(records, coverage, required);
  const output: StatisticalResult = {
    query: { ...query },
    representation,
    coverage,
    gameCoverage: history,
    gameCount: metrics.gp?.value ?? null,
    metrics,
    sourceRecords: references(records),
    sourceIds: unique(records.flatMap((record) => record.sourceIds)),
    conflicts: [],
    warnings: [],
  };
  // Check observed rounded metrics on every summand, not just a top-level consolidated source.
  for (const record of records) {
    const local = buildMetrics([record], coverage, 1);
    for (const group of ["averages", "percentages"] as const) {
      for (const [name, value] of Object.entries(record.stats[group] ?? {})) {
        const key = name as Metric;
        const observed = derived(key, value, [record], coverage, "direct-source");
        observed.precision = {
          kind: "display-rounded",
          decimals:
            record.displayPrecision?.[name as keyof NonNullable<typeof record.displayPrecision>],
        };
        const calculated = local[key];
        if (calculated?.status !== "available" || metricsAgree(observed, calculated)) continue;
        if (observed.precision.decimals === undefined) {
          output.warnings.push(
            record.id + ": " + key + ": display precision unknown; consistency cannot be certified",
          );
          continue;
        }
        const reason = "Observed value disagrees with exact totals beyond documented rounding";
        output.conflicts.push({ metric: key, reason, candidates: [observed, calculated] });
        output.metrics[key] = { ...output.metrics[key]!, value: null, status: "conflict", reason };
      }
    }
  }
  return output;
}
export function metricsAgree(a: DerivedMetric, b: DerivedMetric): boolean {
  if (a.value === null || b.value === null) return true;
  // A missing decimal declaration never receives an invented tolerance.
  const magnitude = Math.max(Math.abs(a.value), Math.abs(b.value), 1);
  const allowance = (metric: DerivedMetric) =>
    metric.precision.kind === "display-rounded" && metric.precision.decimals !== undefined
      ? roundingTolerance(metric.precision.decimals, magnitude)
      : 0;
  const machine = Number.EPSILON * magnitude * 8;
  // Exact integer counts must match exactly, even at large magnitudes.
  const bothExact =
    a.precision.kind === "exact" && b.precision.kind === "exact" && a.metric !== "minutes";
  return Math.abs(a.value - b.value) <= (bothExact ? 0 : allowance(a) + allowance(b) + machine);
}
function directResult(
  query: StatisticsQuery,
  record: PlayerPhaseStats,
  history: Coverage,
): StatisticalResult {
  const coverage = periodCoverage(record);
  const output = result(query, "consolidated", [record], coverage, history, 1);
  for (const [group, values] of Object.entries(record.stats)) {
    for (const [metric, value] of Object.entries(values ?? {})) {
      const key = metric as Metric;
      const observed = derived(key, value, [record], coverage, "direct-source");
      if (group !== "totals")
        observed.precision = {
          kind: "display-rounded",
          decimals:
            record.displayPrecision?.[key as keyof NonNullable<typeof record.displayPrecision>],
        };
      if (output.metrics[key]?.status === "conflict") continue;
      output.metrics[key] = observed;
    }
  }
  return output;
}
/** Independent representation: never adds a consolidated row to individual games. */
export function aggregateGames(input: unknown, query: StatisticsQuery): StatisticalResult {
  return gamesFromContext(context(input, query));
}
function gamesFromContext(ctx: ReturnType<typeof context>): StatisticalResult {
  const known = ctx.games.filter(
    (record) =>
      record.kind === "game" &&
      record.availability === "available" &&
      record.stats.totals?.gp !== 0,
  );
  const history = gameCoverage(
    known.map((record) => (record.kind === "game" ? record.gameId : "")),
    ctx.direct,
  );
  const output = result(
    ctx.query,
    "games",
    ctx.games,
    history,
    history,
    Math.max(
      ctx.games.filter((record) => ["available", "not-imported"].includes(record.availability))
        .length,
      history.expected ?? 0,
    ),
  );
  return output;
}
/** Rounds are mutually exclusive; the playoffs aggregate itself is never a summand. */
export function aggregatePlayoffs(input: unknown, query: StatisticsQuery): StatisticalResult {
  if (query.phaseId !== "playoffs")
    throw new RangeError("Playoffs aggregation requires phaseId=playoffs");
  return roundsFromContext(context(input, query));
}
function roundsFromContext(ctx: ReturnType<typeof context>): StatisticalResult {
  const rows = ctx.phases.filter((record) => ctx.rounds.includes(record.phaseId));
  const certified = rows.filter(
    (record) => record.coverage?.status === "complete" && record.availability !== "not-imported",
  );
  const coverage: Coverage = {
    status:
      rows.length === 0
        ? "none"
        : rows.length < ctx.rounds.length
          ? "partial"
          : certified.length === ctx.rounds.length
            ? "complete"
            : rows.some(
                  (record) =>
                    record.coverage?.status === "partial" || record.availability === "not-imported",
                )
              ? "partial"
              : "unknown",
    known: rows.length,
    expected: ctx.rounds.length,
    unit: "periods",
    evidenceSourceIds: unique(rows.flatMap((record) => record.coverage?.sourceIds ?? [])),
  };
  // Certified non-participation accounts for a round, without creating a fictitious zero record.
  const absent = certified.filter((record) =>
    ["not-played", "not-qualified", "no-games"].includes(record.availability),
  ).length;
  const history = gamesFromContext(ctx).gameCoverage;
  return result(ctx.query, "rounds", rows, coverage, history, ctx.rounds.length - absent);
}
/** Enumerates alternative representations, never a combined sum of alternatives. */
export function collectRepresentations(
  input: unknown,
  query: StatisticsQuery,
): StatisticalResult[] {
  const ctx = context(input, query);
  const games = gamesFromContext(ctx);
  const candidates: StatisticalResult[] = [];
  if (ctx.direct) candidates.push(directResult(ctx.query, ctx.direct, games.gameCoverage));
  if (query.phaseId === "playoffs") candidates.push(roundsFromContext(ctx));
  if (!query.teamId) {
    const teams = ctx.records.filter(
      (record): record is PlayerPhaseStats =>
        record.kind === "phase" &&
        record.playerId === query.playerId &&
        record.seasonId === query.seasonId &&
        record.phaseId === query.phaseId &&
        record.scope === "team",
    );
    if (teams.length) {
      // Distinct team scopes partition appearances, but observed teams do not prove all teams are present.
      const coverage: Coverage = {
        status: "unknown",
        known: teams.length,
        unit: "periods",
        evidenceSourceIds: unique(teams.flatMap((record) => record.coverage?.sourceIds ?? [])),
      };
      candidates.push(
        result(ctx.query, "teams", teams, coverage, games.gameCoverage, teams.length),
      );
    }
  }
  candidates.push(games);
  return candidates;
}
