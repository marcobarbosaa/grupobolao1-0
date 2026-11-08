import type { HomePlayer } from "./home-data";

export type PhaseId =
  | "regular"
  | "playoffs"
  | "firstRound"
  | "quarterfinals"
  | "conferenceFinals"
  | "finals";
export type DataStatus = "available" | "not-imported" | "not-played" | "not-qualified" | "no-games";
export type MetricGroup = "averages" | "totals" | "percentages";
export type MetricId =
  | "gp"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "topg"
  | "pointsTotal"
  | "reboundsTotal"
  | "assistsTotal"
  | "stealsTotal"
  | "blocksTotal"
  | "turnoversTotal"
  | "doubleDoubles"
  | "tripleDoubles"
  | "fgPct"
  | "threePct"
  | "ftPct";

export interface StatPhase {
  status: DataStatus;
  values: Partial<Record<MetricId, number>>;
  source?: string;
}
export interface AwardYear {
  seasonId: number;
  year: string;
}
export interface PlayerAward {
  id: string;
  label: string;
  count: number;
  years: AwardYear[];
  kind: "title" | "individual" | "selection" | "other";
}
export interface PlayerSeason {
  id: number;
  year: string;
  team: string;
  phases: Record<PhaseId, StatPhase>;
  awards: { id: string; label: string }[];
}
export interface PlayerPresentation extends HomePlayer {
  teamNames: string[];
  positions: string[];
  archetype: string;
  biography: string;
  awards: PlayerAward[];
  career: PlayerSeason[];
}
export interface PlayerFilters {
  q?: string;
  team?: string;
  position?: string;
  order?: "az" | "za";
}

export const phases: { id: PhaseId; label: string }[] = [
  { id: "regular", label: "Temporada regular" },
  { id: "playoffs", label: "Playoffs agregados" },
  { id: "firstRound", label: "Primeira rodada" },
  { id: "quarterfinals", label: "Quartas de final" },
  { id: "conferenceFinals", label: "Finais de conferência" },
  { id: "finals", label: "Finais da NBA" },
];
export const dataStatusLabels: Record<DataStatus, string> = {
  available: "Dados disponíveis",
  "not-imported": "Dados ainda não importados",
  "not-played": "Rodada não disputada",
  "not-qualified": "Não se classificou",
  "no-games": "Sem partidas nesta fase",
};
export const metrics: {
  id: MetricId;
  label: string;
  short: string;
  group: MetricGroup | "all";
  decimals: number;
}[] = [
  { id: "gp", label: "Jogos disputados", short: "J", group: "all", decimals: 0 },
  { id: "pts", label: "Pontos", short: "PTS", group: "averages", decimals: 1 },
  { id: "reb", label: "Rebotes", short: "REB", group: "averages", decimals: 1 },
  { id: "ast", label: "Assistências", short: "AST", group: "averages", decimals: 1 },
  { id: "stl", label: "Roubos", short: "ROB", group: "averages", decimals: 1 },
  { id: "blk", label: "Tocos", short: "TOC", group: "averages", decimals: 1 },
  { id: "topg", label: "Erros de ataque", short: "ERR", group: "averages", decimals: 1 },
  { id: "pointsTotal", label: "Pontos totais", short: "PTS", group: "totals", decimals: 0 },
  { id: "reboundsTotal", label: "Rebotes totais", short: "REB", group: "totals", decimals: 0 },
  { id: "assistsTotal", label: "Assistências totais", short: "AST", group: "totals", decimals: 0 },
  { id: "stealsTotal", label: "Roubos totais", short: "ROB", group: "totals", decimals: 0 },
  { id: "blocksTotal", label: "Tocos totais", short: "TOC", group: "totals", decimals: 0 },
  {
    id: "turnoversTotal",
    label: "Erros de ataque totais",
    short: "ERR",
    group: "totals",
    decimals: 0,
  },
  { id: "doubleDoubles", label: "Duplos-duplos", short: "DD", group: "totals", decimals: 0 },
  { id: "tripleDoubles", label: "Triplos-duplos", short: "TD", group: "totals", decimals: 0 },
  {
    id: "fgPct",
    label: "Aproveitamento de arremessos",
    short: "FG%",
    group: "percentages",
    decimals: 1,
  },
  {
    id: "threePct",
    label: "Aproveitamento de três pontos",
    short: "3P%",
    group: "percentages",
    decimals: 1,
  },
  {
    id: "ftPct",
    label: "Aproveitamento de lances livres",
    short: "FT%",
    group: "percentages",
    decimals: 1,
  },
];

export function formatStat(value: number | undefined, decimals = 1) {
  return value === undefined
    ? "—"
    : value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
}
