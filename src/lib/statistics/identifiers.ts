import { z } from "zod";
import { newRoster } from "../new-roster.ts";

export const identifierSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a stable lowercase slug identifier");
export const seasonIdSchema = z.string().regex(/^season-[0-9]{3,}$/, "Expected season-NNN");
const knownPlayerIds = new Set(newRoster.map((player) => player.id));
export const playerIdSchema = identifierSchema.refine(
  (id) => knownPlayerIds.has(id),
  "Player is not registered in new-roster",
);
export function gameStatsKey(record: { gameId: string; playerId: string }): string {
  return JSON.stringify(["game", record.gameId, record.playerId]);
}
export function phaseStatsKey(record: {
  playerId: string;
  seasonId: string;
  phaseId: string;
  scope: "all-teams" | "team";
  teamId?: string;
}): string {
  return JSON.stringify([
    "phase",
    record.playerId,
    record.seasonId,
    record.phaseId,
    record.scope,
    record.scope === "team" ? record.teamId : null,
  ]);
}
