import { z } from "zod";

export const availabilityStatusSchema = z.enum([
  "available",
  "not-imported",
  "not-played",
  "not-qualified",
  "no-games",
]);
export const importStatusSchema = z.enum([
  "received",
  "extracted",
  "pending-review",
  "approved",
  "rejected",
  "published",
]);
export const entityStatusSchema = z.enum(["active", "inactive"]);
export const seasonStatusSchema = z.enum(["planned", "in-progress", "completed", "cancelled"]);
export const gameStatusSchema = z.enum(["scheduled", "played", "postponed", "cancelled"]);
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export type ImportStatus = z.infer<typeof importStatusSchema>;
