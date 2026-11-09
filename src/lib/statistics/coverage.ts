import { z } from "zod";
import { identifierSchema } from "./identifiers.ts";
import type { Coverage } from "./derived-types.ts";
import type { PlayerPhaseStats } from "./types.ts";

const uniqueIds = z
  .array(identifierSchema)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate evidence reference");
/** A reviewed assertion about this exact player/season/phase/team scope. */
export const coverageEvidenceSchema = z
  .object({
    status: z.enum(["complete", "partial"]),
    sourceIds: uniqueIds.refine((ids) => ids.length > 0, "Coverage requires evidence"),
    note: z.string().trim().min(1),
    expectedGames: z.number().int().nonnegative().safe().optional(),
    expectedGameIds: uniqueIds.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.expectedGameIds && value.expectedGames !== value.expectedGameIds.length)
      ctx.addIssue({
        code: "custom",
        message: "Expected game IDs require an equal expectedGames count",
      });
  });
export const displayPrecisionSchema = z
  .object({
    mpg: z.number().int().min(0).max(8).optional(),
    ppg: z.number().int().min(0).max(8).optional(),
    rpg: z.number().int().min(0).max(8).optional(),
    apg: z.number().int().min(0).max(8).optional(),
    spg: z.number().int().min(0).max(8).optional(),
    bpg: z.number().int().min(0).max(8).optional(),
    topg: z.number().int().min(0).max(8).optional(),
    fgPct: z.number().int().min(0).max(8).optional(),
    threePct: z.number().int().min(0).max(8).optional(),
    ftPct: z.number().int().min(0).max(8).optional(),
  })
  .strict();

export function periodCoverage(record: PlayerPhaseStats): Coverage {
  return {
    status: record.coverage?.status ?? "unknown",
    known: 1,
    expected: 1,
    unit: "periods",
    evidenceSourceIds: record.coverage?.sourceIds ?? [],
  };
}
/** A number alone is never a completeness proof: require the reviewed set of game IDs. */
export function gameCoverage(gameIds: readonly string[], record?: PlayerPhaseStats): Coverage {
  const ids = new Set(gameIds);
  const proof = record?.coverage;
  const expectedIds = proof?.expectedGameIds;
  const complete =
    proof?.status === "complete" &&
    expectedIds !== undefined &&
    expectedIds.length === ids.size &&
    expectedIds.every((id) => ids.has(id));
  return {
    status: complete
      ? "complete"
      : ids.size === 0
        ? "none"
        : proof?.status === "partial" || proof?.expectedGames !== undefined
          ? "partial"
          : "unknown",
    known: ids.size,
    expected: proof?.expectedGames,
    unit: "games",
    evidenceSourceIds: proof?.sourceIds ?? [],
  };
}
export function metricCoverage(base: Coverage, known: number, required: number): Coverage {
  return {
    ...base,
    known,
    expected: base.expected === undefined ? undefined : required,
    status: known === 0 ? "none" : known < required ? "partial" : base.status,
  };
}
