import { mkdtemp, mkdir, writeFile, rm, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute, sep } from "node:path";
import { sha256 } from "../../scripts/statistics/imports/io.ts";
import { emptyDataset, emptyManifest, season } from "./fixtures.mjs";
import { prepareReview, authorizeReview } from "../../scripts/statistics/imports/review.ts";
export { emptyDataset };
export const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZuoAAAAASUVORK5CYII=",
  "base64",
);
export function candidate() {
  const sourceIds = ["source-test"];
  return {
    schemaVersion: "1.0",
    id: "import-test",
    receivedAt: "2026-02-01T12:00:00Z",
    sources: [
      {
        path: "image.png",
        source: {
          id: "source-test",
          kind: "screenshot",
          fileName: "original-test.png",
          contentHash: sha256(imageBytes),
          receivedAt: "2026-02-01T11:00:00Z",
          metadata: {},
        },
      },
    ],
    entities: {
      seasons: [{ value: season(3), sourceIds }],
      teams: [
        {
          value: { id: "team-a", name: "Synthetic A", sport: "basquete", status: "active" },
          sourceIds,
        },
        {
          value: { id: "team-b", name: "Synthetic B", sport: "basquete", status: "active" },
          sourceIds,
        },
      ],
    },
    items: [
      {
        id: "summary-test",
        kind: "season-summary",
        player: { id: "abel" },
        seasonId: "season-003",
        phaseId: "regular",
        scope: "all-teams",
        availability: "available",
        sourceIds,
        screen: "averages",
        values: [
          { label: "GP", value: "2" },
          { label: "PTS", value: "27,40" },
        ],
      },
    ],
  };
}
export function addGameItem(batch, id = "game-one", player = "abel") {
  const sourceIds = ["source-test"];
  batch.entities.games ??= [];
  batch.entities.games.push({
    value: {
      id,
      seasonId: "season-003",
      phaseId: "regular",
      homeTeamId: "team-a",
      awayTeamId: "team-b",
      status: "played",
    },
    sourceIds,
  });
  batch.items.push({
    id: "box-" + id + "-" + player,
    kind: "game-box-score",
    player: { id: player },
    seasonId: "season-003",
    phaseId: "regular",
    gameId: id,
    teamId: "team-a",
    sourceIds,
    availability: "available",
    screen: "totals",
    values: [
      { label: "PTS", value: "30" },
      { label: "AST", value: "8" },
    ],
  });
}
export async function sandbox(t) {
  const base = await mkdtemp(join(tmpdir(), "statistics-import-test-"));
  const inbox = join(base, "inbox"),
    root = join(base, "statistics");
  await mkdir(inbox);
  await mkdir(root);
  await writeFile(join(inbox, "image.png"), imageBytes);
  await writeFile(join(root, "manifest.json"), JSON.stringify(emptyManifest(), null, 2) + "\n");
  t.after(async () => {
    const actual = await realpath(base),
      temp = await realpath(tmpdir()),
      rel = relative(temp, actual);
    if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith(".." + sep))
      throw new Error("Unsafe test cleanup");
    await rm(actual, { recursive: true, force: true });
  });
  return {
    base,
    inbox,
    root,
    paths: { inputRoot: inbox, batchPath: "batch.json", statisticsRoot: root },
  };
}
export async function putBatch(env, batch) {
  await writeFile(join(env.inbox, "batch.json"), JSON.stringify(batch, null, 2) + "\n");
}
export async function approve(env, batch) {
  await putBatch(env, batch);
  const prepared = await prepareReview(env.paths);
  const authorization = authorizeReview(prepared, {
    reviewHash: prepared.review.reviewHash,
    approvedBy: "synthetic-reviewer",
    approvedAt: "2026-02-02T12:00:00Z",
    recordIds: batch.items.map((i) => i.id),
    correctionIds: prepared.review.changes
      .filter((c) => c.action === "correction")
      .map((c) => c.itemId),
  });
  await writeFile(join(env.inbox, "authorization.json"), JSON.stringify(authorization));
  return {
    prepared,
    authorization,
    options: { ...env.paths, authorizationPath: "authorization.json" },
  };
}
