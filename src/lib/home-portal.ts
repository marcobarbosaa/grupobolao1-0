import type { DataStatus } from "./player-types";

// Only verified imports belong in data. Editorial copy lives in the components.
export type OfficialContent<T> =
  | { status: "available"; data: T }
  | { status: Exclude<DataStatus, "available">; data?: never };

export interface SeasonSpotlightData {
  season: OfficialContent<{ name: string }>;
  nextMatch: OfficialContent<{ label: string; scheduledAt?: string }>;
  recentResults: OfficialContent<readonly { id: string; label: string }[]>;
  highlights: OfficialContent<readonly { id: string; label: string }[]>;
}
export const seasonSpotlight: SeasonSpotlightData = {
  season: { status: "not-imported" },
  nextMatch: { status: "not-imported" },
  recentResults: { status: "not-imported" },
  highlights: { status: "not-imported" },
};
export const portalStatusLabels: Record<Exclude<DataStatus, "available">, string> = {
  "not-imported": "Aguardando registros oficiais",
  "not-played": "Ainda não disputado",
  "not-qualified": "Sem classificação para esta fase",
  "no-games": "Sem partidas registradas nesta fase",
};
export interface JourneyMilestone {
  id: string;
  title: string;
  content: OfficialContent<{ description: string }>;
}
export const leagueJourney: readonly JourneyMilestone[] = [
  {
    id: "roster",
    title: "Elenco apresentado",
    content: {
      status: "available",
      data: { description: "Conheça os protagonistas da nova geração." },
    },
  },
  { id: "seasons", title: "Temporadas em preparação", content: { status: "not-imported" } },
  { id: "stats", title: "Estatísticas por importar", content: { status: "not-imported" } },
  { id: "history", title: "Histórico a construir", content: { status: "not-imported" } },
];
