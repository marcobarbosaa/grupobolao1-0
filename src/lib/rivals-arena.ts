import type { StatisticalRecord } from "./statistics/derived-types";

export type ComparisonMode = "season" | "career" | "playoffs";
export const comparisonModes = [
  { id: "season", label: "Temporada", enabled: true },
  { id: "career", label: "Carreira · em breve", enabled: false },
  { id: "playoffs", label: "Playoffs · em breve", enabled: false },
] as const;

export const comparisonMetrics = [
  { key: "ppg", label: "PPG", name: "Pontos por jogo", group: "averages" },
  { key: "rpg", label: "RPG", name: "Rebotes por jogo", group: "averages" },
  { key: "apg", label: "APG", name: "Assistências por jogo", group: "averages" },
  { key: "spg", label: "SPG", name: "Roubos por jogo", group: "averages" },
  { key: "bpg", label: "BPG", name: "Bloqueios por jogo", group: "averages" },
  { key: "mpg", label: "MPG", name: "Minutos por jogo", group: "averages" },
  { key: "fgPct", label: "FG%", name: "Arremessos de quadra", group: "percentages" },
  { key: "threePct", label: "3P%", name: "Bolas de três", group: "percentages" },
  { key: "ftPct", label: "FT%", name: "Lances livres", group: "percentages" },
  { key: "gp", label: "GP", name: "Jogos disputados", group: "totals" },
  { key: "gs", label: "GS", name: "Jogos como titular", group: "totals" },
  { key: "topg", label: "TOPG", name: "Turnovers · menor é melhor", group: "averages" },
] as const;
export type ComparisonMetric = (typeof comparisonMetrics)[number];

/** Never mix regular-season, round and consolidated playoff records. */
export function getSeasonRecord(
  records: readonly StatisticalRecord[],
  playerId: string,
  seasonId: string,
) {
  const matches = records.filter(
    (r) =>
      r.kind === "phase" &&
      r.phaseId === "regular" &&
      r.playerId === playerId &&
      r.seasonId === seasonId &&
      r.availability === "available",
  );
  // A published combined record takes precedence over individual team stints.
  return (
    matches.find((r) => r.kind === "phase" && r.scope === "all-teams") ??
    (matches.length === 1 ? matches[0] : undefined)
  );
}
export function metricValue(record: StatisticalRecord | undefined, metric: ComparisonMetric) {
  const values = record?.stats[metric.group] as Record<string, number | undefined> | undefined;
  const value = values?.[metric.key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
export function compareMetric(a: number | undefined, b: number | undefined, lowerIsBetter = false) {
  if (a === undefined || b === undefined) return "unavailable";
  if (a === b) return "tie";
  return (lowerIsBetter ? a < b : a > b) ? "a" : "b";
}
export function formatMetric(value: number | undefined, metric: ComparisonMetric) {
  if (value === undefined) return "—";
  return (
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: metric.group === "totals" ? 0 : 1,
      maximumFractionDigits: metric.group === "totals" ? 0 : 1,
    }) + (metric.group === "percentages" ? "%" : "")
  );
}
export function summarizeComparison(
  a: StatisticalRecord | undefined,
  b: StatisticalRecord | undefined,
) {
  return comparisonMetrics.slice(0, 9).reduce(
    (result, metric) => {
      result[compareMetric(metricValue(a, metric), metricValue(b, metric))]++;
      return result;
    },
    { a: 0, b: 0, tie: 0, unavailable: 0 },
  );
}
