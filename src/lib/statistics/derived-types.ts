import type { Statistics } from "./metrics.ts";
import type { PhaseId } from "./phases.ts";
import type { PlayerGameStats, PlayerPhaseStats } from "./types.ts";

export type StatisticalRecord = PlayerGameStats | PlayerPhaseStats;
export type TotalMetric = keyof NonNullable<Statistics["totals"]>;
export type AverageMetric = keyof NonNullable<Statistics["averages"]>;
export type PercentageMetric = keyof NonNullable<Statistics["percentages"]>;
export type Metric = TotalMetric | AverageMetric | PercentageMetric;
export type CoverageStatus = "complete" | "partial" | "unknown" | "none";
export interface Coverage {
  status: CoverageStatus;
  known: number;
  expected?: number;
  unit: "games" | "periods";
  evidenceSourceIds: string[];
}
export interface RecordReference {
  kind: "game" | "phase";
  id: string;
  revision: number;
}
export interface DerivedMetric {
  metric: Metric;
  value: number | null;
  status: "available" | "insufficient-data" | "undefined" | "conflict";
  method: "direct-source" | "sum" | "ratio";
  reason?: string;
  sourceRecordIds: string[];
  sourceRecords: RecordReference[];
  sourceIds: string[];
  coverage: Coverage;
  precision: { kind: "exact" | "display-rounded" | "derived"; decimals?: number };
}
export interface StatisticsQuery {
  playerId: string;
  seasonId: string;
  phaseId: PhaseId;
  teamId?: string;
}
export interface MetricConflict {
  metric: Metric;
  reason: string;
  candidates: DerivedMetric[];
}
export interface StatisticalResult {
  query: StatisticsQuery;
  representation: "consolidated" | "games" | "rounds" | "teams";
  coverage: Coverage;
  gameCoverage: Coverage;
  gameCount: number | null;
  metrics: Partial<Record<Metric, DerivedMetric>>;
  sourceRecords: RecordReference[];
  sourceIds: string[];
  conflicts: MetricConflict[];
  warnings: string[];
}
export interface Comparison {
  left: StatisticalResult;
  right: StatisticalResult;
  metrics: {
    metric: Metric;
    left: DerivedMetric | null;
    right: DerivedMetric | null;
    comparable: boolean;
    reason?: string;
  }[];
}
