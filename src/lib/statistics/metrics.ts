import { z } from "zod";

// No coercion, default zero, rounding or inference from rounded averages.
const count = z.number().finite().int().nonnegative().safe();
const decimal = z.number().finite().nonnegative();
const percent = decimal.max(100);
export const metricCatalog = {
  totals: {
    gp: count,
    gs: count,
    minutes: decimal,
    points: count,
    rebounds: count,
    assists: count,
    steals: count,
    blocks: count,
    turnovers: count,
    fgm: count,
    fga: count,
    threePm: count,
    threePa: count,
    ftm: count,
    fta: count,
    offensiveRebounds: count,
    defensiveRebounds: count,
    fouls: count,
    doubleDoubles: count,
    tripleDoubles: count,
  },
  averages: {
    mpg: decimal,
    ppg: decimal,
    rpg: decimal,
    apg: decimal,
    spg: decimal,
    bpg: decimal,
    topg: decimal,
  },
  percentages: { fgPct: percent, threePct: percent, ftPct: percent },
} as const;
export const totalsSchema = z
  .object(metricCatalog.totals)
  .partial()
  .strict()
  .superRefine((stats, ctx) => {
    const pairs = [
      ["fgm", "fga"],
      ["threePm", "threePa"],
      ["ftm", "fta"],
      ["gs", "gp"],
      ["threePm", "fgm"],
      ["threePa", "fga"],
    ] as const;
    for (const [made, attempted] of pairs) {
      if (
        stats[made] !== undefined &&
        stats[attempted] !== undefined &&
        stats[made]! > stats[attempted]!
      )
        ctx.addIssue({
          code: "custom",
          path: [made],
          message: made + " cannot exceed " + attempted,
        });
    }
  });
export const statisticsSchema = z
  .object({
    totals: totalsSchema.optional(),
    averages: z.object(metricCatalog.averages).partial().strict().optional(),
    percentages: z.object(metricCatalog.percentages).partial().strict().optional(),
  })
  .strict();
export type Statistics = z.infer<typeof statisticsSchema>;
