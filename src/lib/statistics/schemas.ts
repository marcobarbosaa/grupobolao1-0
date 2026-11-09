import { z } from "zod";
import { newRoster } from "../new-roster.ts";
import { identifierSchema as id, playerIdSchema, seasonIdSchema } from "./identifiers.ts";
import { phaseIdSchema, seasonPhasesSchema } from "./phases.ts";
import { coverageEvidenceSchema, displayPrecisionSchema } from "./coverage.ts";
import { statisticsSchema } from "./metrics.ts";
import {
  availabilityStatusSchema,
  importStatusSchema,
  entityStatusSchema,
  seasonStatusSchema,
  gameStatusSchema,
} from "./statuses.ts";

const text = z.string().trim().min(1);
const timestamp = z.string().datetime({ offset: true });
// Event dates may have day precision; audit timestamps require an explicit offset.
const eventDate = z.union([z.string().date(), timestamp]);
const sport = z.literal("basquete"); // Extend deliberately when another sport is introduced.
const revisionNumber = z.number().int().positive().safe();
const sourceIds = z
  .array(id)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate source reference");
const publishedSources = sourceIds.refine(
  (ids) => ids.length > 0,
  "At least one source is required",
);
function dateRange(value: { startedAt?: string; endedAt?: string }, ctx: z.RefinementCtx) {
  if (value.startedAt && value.endedAt && Date.parse(value.endedAt) < Date.parse(value.startedAt))
    ctx.addIssue({ code: "custom", path: ["endedAt"], message: "End precedes start" });
}

export const playerSchema = z
  .object({
    id: playerIdSchema,
    name: text,
    displayName: text.optional(),
    sport,
    status: entityStatusSchema,
  })
  .strict();
export function getRegisteredPlayers(): readonly z.infer<typeof playerSchema>[] {
  return newRoster.map(({ id, name, sport }) =>
    playerSchema.parse({ id, name, sport, status: "active" }),
  );
}
export const teamSchema = z
  .object({ id, name: text, abbreviation: text.optional(), sport, status: entityStatusSchema })
  .strict();
export const seasonSchema = z
  .object({
    id: seasonIdSchema,
    edition: z.number().int().positive().safe(),
    label: text,
    sport,
    status: seasonStatusSchema,
    phases: seasonPhasesSchema,
    startedAt: eventDate.optional(),
    endedAt: eventDate.optional(),
  })
  .strict()
  .superRefine((season, ctx) => {
    dateRange(season, ctx);
    if (season.id !== "season-" + String(season.edition).padStart(3, "0"))
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "Season ID must match its permanent edition number",
      });
  });
export const playerTeamHistorySchema = z
  .object({
    id,
    playerId: playerIdSchema,
    teamId: id,
    seasonId: seasonIdSchema,
    startedAt: eventDate.optional(),
    endedAt: eventDate.optional(),
  })
  .strict()
  .superRefine(dateRange);
export const gameSchema = z
  .object({
    id,
    seasonId: seasonIdSchema,
    phaseId: phaseIdSchema,
    homeTeamId: id,
    awayTeamId: id,
    playedAt: eventDate.optional(),
    status: gameStatusSchema,
    externalReference: text.optional(),
  })
  .strict()
  .superRefine((game, ctx) => {
    if (game.homeTeamId === game.awayTeamId)
      ctx.addIssue({ code: "custom", path: ["awayTeamId"], message: "A team cannot play itself" });
    if (game.phaseId === "playoffs")
      ctx.addIssue({
        code: "custom",
        path: ["phaseId"],
        message: "A game belongs to a round, not the playoffs aggregate",
      });
  });
const recordFields = {
  id,
  playerId: playerIdSchema,
  stats: statisticsSchema,
  displayPrecision: displayPrecisionSchema.optional(),
  availability: availabilityStatusSchema,
  sourceIds: publishedSources,
  revision: revisionNumber,
};
function availability(
  value: {
    availability: string;
    stats: z.infer<typeof statisticsSchema>;
    displayPrecision?: z.infer<typeof displayPrecisionSchema>;
  },
  ctx: z.RefinementCtx,
) {
  for (const [metric, decimals] of Object.entries(value.displayPrecision ?? {})) {
    const observed = { ...value.stats.averages, ...value.stats.percentages }[
      metric as keyof z.infer<typeof displayPrecisionSchema>
    ];
    if (observed === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["displayPrecision", metric],
        message: "Precision requires an observed metric",
      });
    } else if (decimals !== undefined) {
      const rounded = Number(observed.toFixed(decimals));
      if (Math.abs(observed - rounded) > Number.EPSILON * Math.max(1, observed) * 8)
        ctx.addIssue({
          code: "custom",
          path: ["displayPrecision", metric],
          message: "Observed value exceeds declared display precision",
        });
    }
  }
  const hasValues = Object.values(value.stats).some(
    (group) => group && Object.keys(group).length > 0,
  );
  if (value.availability !== "available" && hasValues)
    ctx.addIssue({
      code: "custom",
      path: ["stats"],
      message: "Unavailable statistics cannot carry values; zero is an available value",
    });
}
export const playerGameStatsSchema = z
  .object({
    ...recordFields,
    kind: z.literal("game"),
    gameId: id,
    teamId: id,
  })
  .strict()
  .superRefine((record, ctx) => {
    availability(record, ctx);
    for (const key of ["gp", "gs"] as const)
      if ((record.stats.totals?.[key] ?? 0) > 1)
        ctx.addIssue({
          code: "custom",
          path: ["stats", "totals", key],
          message: "A single game cannot contain multiple appearances",
        });
  });
export const playerPhaseStatsSchema = z
  .object({
    ...recordFields,
    kind: z.literal("phase"),
    seasonId: seasonIdSchema,
    phaseId: phaseIdSchema,
    coverage: coverageEvidenceSchema.optional(),
    scope: z.enum(["all-teams", "team"]),
    teamId: id.optional(),
  })
  .strict()
  .superRefine((record, ctx) => {
    availability(record, ctx);
    if (record.coverage) {
      if (record.coverage.sourceIds.some((sourceId) => !record.sourceIds.includes(sourceId)))
        ctx.addIssue({
          code: "custom",
          path: ["coverage", "sourceIds"],
          message: "Coverage evidence must be included in reviewed record sources",
        });
      const expected = record.coverage.expectedGames;
      const gp = record.stats.totals?.gp;
      if (
        expected !== undefined &&
        gp !== undefined &&
        (gp > expected || (record.coverage.status === "complete" && gp !== expected))
      )
        ctx.addIssue({
          code: "custom",
          path: ["coverage", "expectedGames"],
          message: "Expected games contradict reported games",
        });
      if (record.coverage.status === "complete" && record.availability === "not-imported")
        ctx.addIssue({
          code: "custom",
          path: ["coverage"],
          message: "Unimported period cannot be certified complete",
        });
      if (
        ["not-played", "not-qualified", "no-games"].includes(record.availability) &&
        expected !== undefined &&
        expected !== 0
      )
        ctx.addIssue({
          code: "custom",
          path: ["coverage"],
          message: "Unplayed period cannot certify appearances",
        });
    }
    if ((record.scope === "team") !== (record.teamId !== undefined))
      ctx.addIssue({
        code: "custom",
        path: ["teamId"],
        message: "teamId is required only for team scope; omit it for all-teams",
      });
  });
export const statisticalRecordSchema = z.union([playerGameStatsSchema, playerPhaseStatsSchema]);
export const awardSchema = z
  .object({
    id,
    seasonId: seasonIdSchema,
    playerId: playerIdSchema.optional(),
    teamId: id.optional(),
    type: z.enum(["mvp", "finals-mvp", "dpoy", "sixth-man", "champion", "other"]),
    label: text,
    sourceIds: publishedSources,
    revision: revisionNumber,
  })
  .strict()
  .superRefine((award, ctx) => {
    if (!award.playerId && !award.teamId)
      ctx.addIssue({ code: "custom", message: "An award needs a player and/or team recipient" });
  });
// Metadata is JSON-shaped; values are descriptive, never executable.
const metadataValue = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
export const importSourceSchema = z
  .object({
    id,
    kind: z.enum(["screenshot", "manual-record", "document"]),
    fileName: text,
    contentHash: z.string().regex(/^[a-f0-9]{64}$/, "Expected lowercase SHA-256"),
    capturedAt: eventDate.optional(),
    receivedAt: timestamp,
    metadata: z.record(metadataValue),
  })
  .strict()
  .superRefine((source, ctx) => {
    if (source.capturedAt && Date.parse(source.capturedAt) > Date.parse(source.receivedAt))
      ctx.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "Capture cannot follow receipt",
      });
  });
export const importBatchSchema = z
  .object({
    id,
    sourceIds,
    status: importStatusSchema,
    createdAt: timestamp,
    approvedAt: timestamp.optional(),
    approvedBy: text.optional(),
  })
  .strict()
  .superRefine((batch, ctx) => {
    if (
      ["approved", "published"].includes(batch.status) &&
      (!batch.sourceIds.length || !batch.approvedAt || !batch.approvedBy)
    )
      ctx.addIssue({
        code: "custom",
        message: "Approval/publication requires sources, approvedAt and approvedBy",
      });
    if (Boolean(batch.approvedAt) !== Boolean(batch.approvedBy))
      ctx.addIssue({
        code: "custom",
        message: "Approval timestamp and reviewer must occur together",
      });
    if (batch.approvedAt && Date.parse(batch.approvedAt) < Date.parse(batch.createdAt))
      ctx.addIssue({
        code: "custom",
        path: ["approvedAt"],
        message: "Approval precedes batch creation",
      });
  });
export const dataRevisionSchema = z
  .object({
    id,
    recordId: id,
    recordKind: z.enum(["game", "phase", "award"]),
    revision: revisionNumber,
    batchId: id,
    sourceIds: publishedSources,
    createdAt: timestamp,
    reason: text.optional(),
    supersedesRevision: revisionNumber.optional(),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.revision === 1 && record.supersedesRevision !== undefined)
      ctx.addIssue({ code: "custom", message: "First revision cannot supersede another" });
    if (
      record.revision > 1 &&
      (record.supersedesRevision !== record.revision - 1 || !record.reason)
    )
      ctx.addIssue({
        code: "custom",
        message: "A correction must identify its immediately preceding revision and a reason",
      });
  });

export const dataPathSchema = z
  .string()
  .max(240)
  .regex(
    /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.json$/,
    "Use a relative JSON path without traversal, backslashes, URI or drive",
  );
const files = z.array(dataPathSchema);
export const manifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    generatedAt: timestamp.optional(),
    seasons: files,
    statistics: files,
    games: files,
    awards: files,
    teams: files.optional(),
    teamHistory: files.optional(),
    sources: files.optional(),
    batches: files.optional(),
    revisions: files.optional(),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const paths = new Set<string>();
    for (const [category, entries] of Object.entries(manifest)) {
      if (!Array.isArray(entries)) continue;
      entries.forEach((path: string, index: number) => {
        if (paths.has(path.toLowerCase()))
          ctx.addIssue({
            code: "custom",
            path: [category, index],
            message: "File is referenced more than once (case-insensitive)",
          });
        paths.add(path.toLowerCase());
      });
    }
  });
export const datasetSchema = z
  .object({
    teams: z.array(teamSchema),
    seasons: z.array(seasonSchema),
    games: z.array(gameSchema),
    teamHistory: z.array(playerTeamHistorySchema),
    statistics: z.array(statisticalRecordSchema),
    awards: z.array(awardSchema),
    sources: z.array(importSourceSchema),
    batches: z.array(importBatchSchema),
    revisions: z.array(dataRevisionSchema),
  })
  .strict();
