import { z } from "zod";

export const phaseIdSchema = z.enum([
  "regular",
  "playoffs",
  "first-round",
  "quarterfinals",
  "conference-finals",
  "nba-finals",
]);
export const phaseSchema = z
  .object({
    id: phaseIdSchema,
    name: z.string().trim().min(1),
    order: z.number().int().nonnegative().safe(),
    type: z.enum(["stage", "aggregate"]),
    parentId: phaseIdSchema.optional(),
  })
  .strict()
  .superRefine((phase, ctx) => {
    if ((phase.id === "playoffs") !== (phase.type === "aggregate"))
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "Only playoffs is an aggregate view; it is not a round",
      });
    if (
      phase.parentId &&
      (phase.parentId !== "playoffs" || phase.id === "playoffs" || phase.id === "regular")
    )
      ctx.addIssue({
        code: "custom",
        path: ["parentId"],
        message: "Only playoff rounds may belong to the playoffs aggregate",
      });
  });
export const seasonPhasesSchema = z.array(phaseSchema).superRefine((phases, ctx) => {
  const ids = new Set<string>();
  const orders = new Set<number>();
  phases.forEach((phase, index) => {
    if (ids.has(phase.id))
      ctx.addIssue({ code: "custom", path: [index, "id"], message: "Duplicate phase" });
    if (orders.has(phase.order))
      ctx.addIssue({ code: "custom", path: [index, "order"], message: "Duplicate phase order" });
    ids.add(phase.id);
    orders.add(phase.order);
    if (phase.parentId) {
      const parent = phases.find((item) => item.id === phase.parentId);
      if (!parent || parent.type !== "aggregate" || parent.order >= phase.order)
        ctx.addIssue({
          code: "custom",
          path: [index, "parentId"],
          message: "Parent aggregate must be configured before its child",
        });
    }
  });
});
export const phaseCatalog = [
  { id: "regular", name: "Temporada regular", order: 0, type: "stage" },
  { id: "playoffs", name: "Playoffs", order: 1, type: "aggregate" },
  { id: "first-round", name: "Primeira rodada", order: 2, type: "stage", parentId: "playoffs" },
  { id: "quarterfinals", name: "Quartas de final", order: 3, type: "stage", parentId: "playoffs" },
  {
    id: "conference-finals",
    name: "Finais de conferência",
    order: 4,
    type: "stage",
    parentId: "playoffs",
  },
  { id: "nba-finals", name: "Finais", order: 5, type: "stage", parentId: "playoffs" },
] as const satisfies readonly z.infer<typeof phaseSchema>[];
export type PhaseId = z.infer<typeof phaseIdSchema>;
