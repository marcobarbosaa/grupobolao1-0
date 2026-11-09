import type { z } from "zod";
import type {
  playerSchema,
  teamSchema,
  seasonSchema,
  playerTeamHistorySchema,
  gameSchema,
  playerGameStatsSchema,
  playerPhaseStatsSchema,
  awardSchema,
  importSourceSchema,
  importBatchSchema,
  dataRevisionSchema,
  manifestSchema,
  datasetSchema,
} from "./schemas.ts";

export type Player = z.infer<typeof playerSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type PlayerTeamHistory = z.infer<typeof playerTeamHistorySchema>;
export type Game = z.infer<typeof gameSchema>;
export type PlayerGameStats = z.infer<typeof playerGameStatsSchema>;
export type PlayerPhaseStats = z.infer<typeof playerPhaseStatsSchema>;
export type Award = z.infer<typeof awardSchema>;
export type ImportSource = z.infer<typeof importSourceSchema>;
export type ImportBatch = z.infer<typeof importBatchSchema>;
export type DataRevision = z.infer<typeof dataRevisionSchema>;
export type StatisticsManifest = z.infer<typeof manifestSchema>;
export type StatisticsDataset = z.infer<typeof datasetSchema>;
