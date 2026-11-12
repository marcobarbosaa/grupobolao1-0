import { extrasContentSchema } from "./extras.ts";
import { z } from "zod";
import { identifierSchema as id, seasonIdSchema, playerIdSchema } from "./identifiers.ts";
import { phaseIdSchema } from "./phases.ts";
import { coverageEvidenceSchema } from "./coverage.ts";
import { availabilityStatusSchema } from "./statuses.ts";
import { importSourceSchema, teamSchema, seasonSchema, gameSchema } from "./schemas.ts";
const text = z.string().trim().min(1).max(2000);
export const importHashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const importTimestampSchema = z.string().datetime({ offset: true });
export const inputPathSchema = z
  .string()
  .max(240)
  .regex(/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:json|png|jpg|jpeg|webp)$/);
const ids = z
  .array(id)
  .max(1000)
  .refine((v) => new Set(v).size === v.length, "Duplicate identifier");
const sourced = <T extends z.ZodTypeAny>(value: T) =>
  z
    .object({
      value,
      sourceIds: ids.refine((values) => values.length > 0, "At least one identifier is required"),
    })
    .strict();
export const candidateItemSchema = z
  .object({
    id: id.max(40),
    kind: z.enum([
      "season-summary",
      "phase-summary",
      "game-box-score",
      "award",
      "team-history",
      "season-extras",
    ]),
    extras: extrasContentSchema.optional(),
    recordId: id.optional(),
    player: z.object({ id: id.optional(), name: text.optional() }).strict().optional(),
    seasonId: seasonIdSchema.optional(),
    phaseId: phaseIdSchema.optional(),
    teamId: id.optional(),
    scope: z.enum(["all-teams", "team"]).optional(),
    gameId: id.optional(),
    sourceIds: ids
      .refine((values) => values.length > 0, "At least one identifier is required")
      .optional(),
    availability: availabilityStatusSchema.optional(),
    screen: z.enum(["totals", "averages"]).optional(),
    values: z
      .array(
        z
          .object({
            label: z.string().min(1).max(60),
            value: z.union([z.string().max(100), z.number().finite(), z.null()]),
          })
          .strict(),
      )
      .max(100)
      .optional(),
    coverage: coverageEvidenceSchema.optional(),
    award: z
      .object({
        type: z.enum(["mvp", "finals-mvp", "dpoy", "sixth-man", "champion", "other"]),
        label: text,
      })
      .strict()
      .optional(),
    history: z.object({ startedAt: text.optional(), endedAt: text.optional() }).strict().optional(),
    correction: z
      .object({ expectedRevision: z.number().int().positive().safe(), reason: text })
      .strict()
      .optional(),
    unrecognizedFields: z
      .array(z.object({ label: text, value: text.optional() }).strict())
      .max(100)
      .default([]),
    notes: z.array(text).max(100).default([]),
  })
  .strict();
export const candidateBatchSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: id.max(40),
    receivedAt: importTimestampSchema,
    decimalSeparator: z.enum([".", ","]).optional(),
    sources: z
      .array(z.object({ source: importSourceSchema, path: inputPathSchema }).strict())
      .min(1)
      .max(500),
    entities: z
      .object({
        teams: z.array(sourced(teamSchema)).max(100).default([]),
        seasons: z.array(sourced(seasonSchema)).max(100).default([]),
        games: z.array(sourced(gameSchema)).max(1000).default([]),
      })
      .strict()
      .default({}),
    items: z.array(candidateItemSchema).min(1).max(1000),
    notes: z.array(text).max(100).default([]),
  })
  .strict()
  .superRefine((batch, ctx) => {
    for (const [key, entries] of [
      ["items", batch.items],
      ["sources", batch.sources.map((s) => s.source)],
    ] as const) {
      const seen = new Set<string>();
      entries.forEach((entry, index) => {
        if (seen.has(entry.id))
          ctx.addIssue({
            code: "custom",
            path: [key, index],
            message: "Duplicate candidate identifier",
          });
        seen.add(entry.id);
      });
    }
    for (const entry of batch.sources) {
      if (entry.source.kind !== "screenshot")
        ctx.addIssue({ code: "custom", path: ["sources"], message: "Sources must be screenshots" });
      if (Date.parse(entry.source.receivedAt) > Date.parse(batch.receivedAt))
        ctx.addIssue({
          code: "custom",
          path: ["receivedAt"],
          message: "Batch receipt precedes source receipt",
        });
    }
  });
export const aliasRegistrySchema = z
  .array(
    z
      .object({
        name: text,
        playerId: playerIdSchema,
        approvedBy: text,
        approvedAt: importTimestampSchema,
      })
      .strict(),
  )
  .max(200);
export const publicationAuthorizationSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    batchId: id,
    candidateHash: importHashSchema,
    baselineHash: importHashSchema,
    reviewHash: importHashSchema,
    approvedBy: text,
    approvedAt: importTimestampSchema,
    recordIds: ids.refine((values) => values.length > 0, "At least one identifier is required"),
    correctionIds: ids,
  })
  .strict();
export type CandidateBatch = z.infer<typeof candidateBatchSchema>;
export type CandidateItem = z.infer<typeof candidateItemSchema>;
export type AliasRegistry = z.infer<typeof aliasRegistrySchema>;
export type PublicationAuthorization = z.infer<typeof publicationAuthorizationSchema>;
export interface ImportIssue {
  layer: "structural" | "identity" | "statistical" | "historical";
  path: string;
  message: string;
}
export interface ImportConflict {
  itemId: string;
  recordId: string;
  metric: string;
  existingValue: unknown;
  candidateValue: unknown;
  status: "conflict";
  requiresReview: true;
}
