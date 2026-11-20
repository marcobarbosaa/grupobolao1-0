import { calculateAverage, calculatePercentage, sumCounts } from "./statistics/calculations.ts";
import type {
  AverageMetric,
  PercentageMetric,
  StatisticalRecord,
  TotalMetric,
} from "./statistics/derived-types.ts";

type PhaseRecord = Extract<StatisticalRecord, { kind: "phase" }>;
export type RecordsPerspective = "career" | "regular" | "playoffs";
export type RecordsMode = "total" | "average";

export const recordCategories = [
  { id: "scoring", label: "Pontuação" },
  { id: "rebounds", label: "Rebotes" },
  { id: "assists", label: "Assistências" },
  { id: "defense", label: "Defesa" },
  { id: "efficiency", label: "Eficiência" },
  { id: "participation", label: "Participação" },
] as const;

export type RecordCategory = (typeof recordCategories)[number]["id"];

export interface RecordMetric {
  id: string;
  label: string;
  shortLabel: string;
  category: RecordCategory;
  totalKey?: TotalMetric;
  averageKey?: AverageMetric;
  percentageKey?: PercentageMetric;
  madeKey?: TotalMetric;
  attemptsKey?: TotalMetric;
}

export const recordMetrics: RecordMetric[] = [
  {
    id: "points",
    label: "Pontos",
    shortLabel: "PTS",
    category: "scoring",
    totalKey: "points",
    averageKey: "ppg",
  },
  {
    id: "scoring-leads",
    label: "Temporadas liderando em pontos",
    shortLabel: "LÍDERES",
    category: "scoring",
  },
  {
    id: "rebounds",
    label: "Rebotes",
    shortLabel: "REB",
    category: "rebounds",
    totalKey: "rebounds",
    averageKey: "rpg",
  },
  {
    id: "assists",
    label: "Assistências",
    shortLabel: "AST",
    category: "assists",
    totalKey: "assists",
    averageKey: "apg",
  },
  {
    id: "steals",
    label: "Roubos de bola",
    shortLabel: "STL",
    category: "defense",
    totalKey: "steals",
    averageKey: "spg",
  },
  {
    id: "blocks",
    label: "Tocos",
    shortLabel: "BLK",
    category: "defense",
    totalKey: "blocks",
    averageKey: "bpg",
  },
  {
    id: "threePm",
    label: "Cestas de três",
    shortLabel: "3PM",
    category: "scoring",
    totalKey: "threePm",
  },
  {
    id: "fgPct",
    label: "Arremessos de quadra",
    shortLabel: "FG%",
    category: "efficiency",
    percentageKey: "fgPct",
    madeKey: "fgm",
    attemptsKey: "fga",
  },
  {
    id: "threePct",
    label: "Bolas de três",
    shortLabel: "3P%",
    category: "efficiency",
    percentageKey: "threePct",
    madeKey: "threePm",
    attemptsKey: "threePa",
  },
  {
    id: "ftPct",
    label: "Lances livres",
    shortLabel: "FT%",
    category: "efficiency",
    percentageKey: "ftPct",
    madeKey: "ftm",
    attemptsKey: "fta",
  },
  {
    id: "games",
    label: "Jogos disputados",
    shortLabel: "GP",
    category: "participation",
    totalKey: "gp",
  },
  {
    id: "starts",
    label: "Jogos como titular",
    shortLabel: "GS",
    category: "participation",
    totalKey: "gs",
  },
  {
    id: "seasons",
    label: "Temporadas com registros",
    shortLabel: "TEMP.",
    category: "participation",
  },
  {
    id: "playoff-seasons",
    label: "Temporadas com playoffs registrados",
    shortLabel: "PÓS-TEMP.",
    category: "participation",
  },
];

export interface RankedRecord {
  key: string;
  playerId: string;
  seasonId?: string;
  seasonIds: string[];
  teamIds: string[];
  games?: number;
  value: number;
  rank: number;
}

export interface LeaderboardOptions {
  perspective: RecordsPerspective;
  metricId: string;
  mode: RecordsMode;
  seasonId?: string;
  phaseId?: string;
}

function phaseRecords(records: readonly StatisticalRecord[]): PhaseRecord[] {
  const grouped = new Map<string, PhaseRecord[]>();
  for (const record of records) {
    if (record.kind !== "phase") continue;
    const key = `${record.playerId}|${record.seasonId}|${record.phaseId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  const canonical: PhaseRecord[] = [];
  for (const group of grouped.values()) {
    const consolidated = group.filter((record) => record.scope === "all-teams");
    if (consolidated.length === 1) canonical.push(consolidated[0]);
    else if (consolidated.length === 0 && group.length === 1) canonical.push(group[0]);
  }
  return canonical;
}

function isUsable(record: PhaseRecord): boolean {
  return (
    record.availability === "available" &&
    !record.coverage?.note.toLocaleLowerCase().includes("dados fictícios")
  );
}

function total(record: PhaseRecord, key: TotalMetric): number | undefined {
  return record.stats.totals?.[key];
}

function sumAvailable(values: (number | undefined)[]): number | undefined {
  const result = sumCounts(values);
  return result.status === "available" ? result.value : undefined;
}

function careerValue(
  rows: PhaseRecord[],
  metric: RecordMetric,
  mode: RecordsMode,
): { value: number; games?: number } | undefined {
  if (metric.id === "seasons" || metric.id === "playoff-seasons") return { value: rows.length };

  if (metric.percentageKey && metric.madeKey && metric.attemptsKey) {
    const made = rows.map((record) => total(record, metric.madeKey!));
    const attempts = rows.map((record) => total(record, metric.attemptsKey!));
    const games = sumAvailable(rows.map((record) => total(record, "gp")));
    const playoff = rows.some((record) => record.phaseId === "playoffs");
    const seasonSample = rows.length === 1;
    const minGames = seasonSample ? (playoff ? 10 : 25) : playoff ? 20 : 82;
    const minAttempts = seasonSample
      ? metric.id === "fgPct"
        ? playoff
          ? 50
          : 100
        : playoff
          ? 25
          : 50
      : playoff
        ? metric.id === "fgPct"
          ? 100
          : 50
        : metric.id === "fgPct"
          ? 500
          : metric.id === "threePct"
            ? 100
            : 200;
    if (games === undefined || games < minGames) return undefined;
    const madeTotal = sumAvailable(made);
    const attemptsTotal = sumAvailable(attempts);
    if (madeTotal === undefined || attemptsTotal === undefined || attemptsTotal < minAttempts)
      return undefined;
    const result = calculatePercentage(madeTotal, attemptsTotal);
    return result.status === "available" ? { value: result.value, games } : undefined;
  }

  if (!metric.totalKey) return undefined;
  const totals = rows.map((record) => total(record, metric.totalKey!));
  const games = sumAvailable(rows.map((record) => total(record, "gp")));
  if (mode === "average") {
    if (!games || metric.totalKey === "gp" || metric.totalKey === "gs") return undefined;
    const numerator = sumAvailable(totals);
    if (numerator === undefined) return undefined;
    const result = calculateAverage(numerator, games);
    return result.status === "available" ? { value: result.value, games } : undefined;
  }
  const value = sumAvailable(totals);
  if (value === undefined) return undefined;
  return { value, games };
}

function seasonValue(
  record: PhaseRecord,
  metric: RecordMetric,
  mode: RecordsMode,
  playoff: boolean,
): { value: number; games?: number } | undefined {
  const games = total(record, "gp");
  if (metric.id === "seasons" || metric.id === "playoff-seasons") return { value: 1, games };

  if (metric.percentageKey && metric.madeKey && metric.attemptsKey) {
    const attempts = total(record, metric.attemptsKey);
    const minimumGames = playoff ? (record.phaseId === "playoffs" ? 10 : 5) : 25;
    const minimumAttempts = playoff
      ? metric.id === "fgPct"
        ? 50
        : 25
      : metric.id === "fgPct"
        ? 100
        : 50;
    if (
      games === undefined ||
      games < minimumGames ||
      attempts === undefined ||
      attempts < minimumAttempts
    )
      return undefined;
    const official = record.stats.percentages?.[metric.percentageKey];
    if (official !== undefined) return { value: official, games };
    const made = total(record, metric.madeKey);
    const result = calculatePercentage(made, attempts);
    return result.status === "available" ? { value: result.value, games } : undefined;
  }

  if (!metric.totalKey) return undefined;
  if (mode === "average") {
    if (metric.totalKey === "gp" || metric.totalKey === "gs") return undefined;
    const official = metric.averageKey ? record.stats.averages?.[metric.averageKey] : undefined;
    if (official !== undefined) return { value: official, games };
    const result = calculateAverage(total(record, metric.totalKey), games);
    return result.status === "available" ? { value: result.value, games } : undefined;
  }

  const value = total(record, metric.totalKey);
  return value === undefined ? undefined : { value, games };
}

function seasonMetricComplete(
  rows: PhaseRecord[],
  metric: RecordMetric,
  mode: RecordsMode,
): boolean {
  if (
    rows.some(
      (record) =>
        record.availability === "not-imported" ||
        record.coverage?.note.toLocaleLowerCase().includes("dados fictícios"),
    )
  )
    return false;
  const available = rows.filter((record) => record.availability === "available");
  if (!available.length) return false;
  return available.every((record) => {
    if (metric.percentageKey && metric.madeKey && metric.attemptsKey)
      return (
        total(record, metric.madeKey) !== undefined &&
        total(record, metric.attemptsKey) !== undefined &&
        total(record, "gp") !== undefined
      );
    if (!metric.totalKey) return false;
    if (mode === "average") {
      if (metric.totalKey === "gp" || metric.totalKey === "gs") return false;
      if (metric.averageKey && record.stats.averages?.[metric.averageKey] !== undefined)
        return true;
      return total(record, metric.totalKey) !== undefined && total(record, "gp") !== undefined;
    }
    return total(record, metric.totalKey) !== undefined;
  });
}

function entryFor(
  rows: PhaseRecord[],
  metric: RecordMetric,
  mode: RecordsMode,
  aggregate: boolean,
  playoff: boolean,
): RankedRecord | undefined {
  if (!rows.length) return undefined;
  const result = aggregate
    ? careerValue(rows, metric, mode)
    : seasonValue(rows[0], metric, mode, playoff);
  if (!result) return undefined;

  const seasonIds = [...new Set(rows.map((record) => record.seasonId))].sort();
  const teamIds = [...new Set(rows.flatMap((record) => (record.teamId ? [record.teamId] : [])))];
  const seasonId = seasonIds.length === 1 ? seasonIds[0] : undefined;
  return {
    key: `${rows[0].playerId}|${seasonId ?? "career"}`,
    playerId: rows[0].playerId,
    seasonId,
    seasonIds,
    teamIds,
    games: result.games,
    value: result.value,
    rank: 0,
  };
}

function scoringLeaders(records: readonly StatisticalRecord[], seasonId?: string): RankedRecord[] {
  const bySeason = new Map<string, PhaseRecord[]>();
  for (const record of phaseRecords(records)) {
    if (record.phaseId !== "regular" || (seasonId && record.seasonId !== seasonId)) continue;
    bySeason.set(record.seasonId, [...(bySeason.get(record.seasonId) ?? []), record]);
  }

  const byPlayer = new Map<string, { seasonIds: string[]; teamIds: string[] }>();
  for (const [season, rows] of bySeason) {
    if (rows.some((record) => !isUsable(record) || total(record, "points") === undefined)) continue;
    const highest = Math.max(...rows.map((record) => total(record, "points")!));
    for (const record of rows.filter((item) => total(item, "points") === highest)) {
      const current = byPlayer.get(record.playerId) ?? { seasonIds: [], teamIds: [] };
      current.seasonIds.push(season);
      if (record.teamId) current.teamIds.push(record.teamId);
      byPlayer.set(record.playerId, current);
    }
  }

  const candidates = [...byPlayer].map(([playerId, history]) => {
    const seasonIds = [...new Set(history.seasonIds)].sort();
    return {
      key: `${playerId}|scoring-leads`,
      playerId,
      seasonIds,
      teamIds: [...new Set(history.teamIds)],
      value: seasonIds.length,
      rank: 0,
    } satisfies RankedRecord;
  });
  candidates.sort((left, right) => right.value - left.value);
  let previousValue: number | undefined;
  let previousRank = 0;
  candidates.forEach((candidate, index) => {
    if (candidate.value !== previousValue) previousRank = index + 1;
    candidate.rank = previousRank;
    previousValue = candidate.value;
  });
  return candidates;
}

export function getHistoricalLeaderboard(
  records: readonly StatisticalRecord[],
  options: LeaderboardOptions,
): RankedRecord[] {
  const metric = recordMetrics.find((item) => item.id === options.metricId);
  if (!metric) return [];
  const phaseId = options.perspective === "playoffs" ? (options.phaseId ?? "playoffs") : "regular";
  if (metric.id === "scoring-leads")
    return options.perspective === "career" ? scoringLeaders(records, options.seasonId) : [];
  if (metric.id === "seasons" && (options.perspective !== "career" || options.seasonId)) return [];
  if (
    metric.id === "playoff-seasons" &&
    (options.perspective !== "playoffs" || phaseId !== "playoffs" || options.seasonId)
  )
    return [];

  const allRows = phaseRecords(records).filter(
    (record) =>
      record.phaseId === phaseId && (!options.seasonId || record.seasonId === options.seasonId),
  );
  const rows = allRows.filter(
    (record) =>
      isUsable(record) &&
      Object.values(record.stats).some((group) => group && Object.keys(group).length > 0),
  );
  const aggregate =
    (options.perspective === "career" && !options.seasonId) ||
    (options.perspective === "playoffs" && phaseId === "playoffs" && !options.seasonId);
  const playoff = options.perspective === "playoffs";
  const candidates: RankedRecord[] = [];

  if (aggregate) {
    const byPlayer = new Map<string, PhaseRecord[]>();
    for (const record of rows) {
      byPlayer.set(record.playerId, [...(byPlayer.get(record.playerId) ?? []), record]);
    }
    for (const group of byPlayer.values()) {
      const entry = entryFor(group, metric, options.mode, true, playoff);
      if (entry) candidates.push(entry);
    }
  } else {
    const bySeason = new Map<string, PhaseRecord[]>();
    for (const record of allRows) {
      bySeason.set(record.seasonId, [...(bySeason.get(record.seasonId) ?? []), record]);
    }
    for (const group of bySeason.values()) {
      if (!seasonMetricComplete(group, metric, options.mode)) continue;
      for (const record of group.filter(isUsable)) {
        const entry = entryFor([record], metric, options.mode, false, playoff);
        if (entry) candidates.push(entry);
      }
    }
  }

  candidates.sort((left, right) => right.value - left.value);
  let previousValue: number | undefined;
  let previousRank = 0;
  candidates.forEach((candidate, index) => {
    if (candidate.value !== previousValue) previousRank = index + 1;
    candidate.rank = previousRank;
    previousValue = candidate.value;
  });
  return candidates;
}
