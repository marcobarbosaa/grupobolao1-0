import test from "node:test";
import assert from "node:assert/strict";
import { phaseCatalog, seasonPhasesSchema } from "../../src/lib/statistics/phases.ts";
import { seasonSchema, gameSchema } from "../../src/lib/statistics/schemas.ts";
import { publishedDataset, season } from "./fixtures.mjs";

test("seasons may select different phases or start with no configured phases", () => {
  assert.equal(seasonSchema.safeParse({ ...season(), phases: [] }).success, true);
  assert.equal(seasonSchema.safeParse({ ...season(), phases: [...phaseCatalog] }).success, true);
  assert.equal(
    seasonSchema.safeParse({
      ...season(),
      phases: [{ id: "nba-finals", name: "Custom final name", order: 0, type: "stage" }],
    }).success,
    true,
  );
  assert.equal(seasonSchema.safeParse({ ...season(), id: "season-002" }).success, false);
});
test("phase IDs, ordering and hierarchy are structurally validated", () => {
  assert.equal(seasonPhasesSchema.safeParse([phaseCatalog[0], phaseCatalog[0]]).success, false);
  assert.equal(
    seasonPhasesSchema.safeParse([{ ...phaseCatalog[1], type: "stage" }]).success,
    false,
  );
  assert.equal(
    seasonPhasesSchema.safeParse([{ ...phaseCatalog[0], type: "aggregate" }]).success,
    false,
  );
  assert.equal(seasonPhasesSchema.safeParse([phaseCatalog[2]]).success, false);
  assert.equal(
    seasonPhasesSchema.safeParse([{ ...phaseCatalog[1], parentId: "playoffs" }]).success,
    false,
  );
  assert.equal(seasonPhasesSchema.safeParse([phaseCatalog[1], phaseCatalog[2]]).success, true);
});
test("playoffs aggregation cannot be used as an extra game round", () => {
  const game = publishedDataset().games[0];
  assert.equal(gameSchema.safeParse({ ...game, phaseId: "playoffs" }).success, false);
  assert.equal(gameSchema.safeParse({ ...game, phaseId: "first-round" }).success, true);
  assert.equal(gameSchema.safeParse({ ...game, awayTeamId: game.homeTeamId }).success, false);
});
