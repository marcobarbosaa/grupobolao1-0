import { datasetSchema, getRegisteredPlayers } from "./schemas.ts";
import { gameStatsKey, phaseStatsKey } from "./identifiers.ts";
import type { StatisticsDataset } from "./types.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}
export type ValidationResult =
  | { success: true; data: StatisticsDataset; issues: [] }
  | { success: false; issues: ValidationIssue[] };

export function validateDataset(input: unknown): ValidationResult {
  const parsed = datasetSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  const data = parsed.data;
  const issues: ValidationIssue[] = [];
  const fail = (path: string, message: string) => issues.push({ path, message });
  function index<T extends { id: string }>(items: readonly T[], category: string): Map<string, T> {
    const map = new Map<string, T>();
    items.forEach((item, i) => {
      if (map.has(item.id)) fail(category + "." + i + ".id", "Duplicate ID: " + item.id);
      else map.set(item.id, item);
    });
    return map;
  }
  index(getRegisteredPlayers(), "players");
  const teams = index(data.teams, "teams");
  const seasons = index(data.seasons, "seasons");
  const games = index(data.games, "games");
  const sources = index(data.sources, "sources");
  const batches = index(data.batches, "batches");
  index(data.teamHistory, "teamHistory");
  index(data.revisions, "revisions");
  const hashes = new Set<string>();
  data.sources.forEach((source, i) => {
    if (hashes.has(source.contentHash))
      fail("sources." + i, "Duplicate contentHash; reuse the existing source ID");
    hashes.add(source.contentHash);
  });
  const ref = (map: ReadonlyMap<string, unknown>, id: string, path: string) => {
    if (!map.has(id)) fail(path, "Unresolved reference: " + id);
  };
  const checkPhase = (seasonId: string, phaseId: string, path: string) => {
    ref(seasons, seasonId, path + ".seasonId");
    const season = seasons.get(seasonId);
    if (season && !season.phases.some((phase) => phase.id === phaseId))
      fail(path + ".phaseId", "Phase is not configured in season " + seasonId);
  };
  data.games.forEach((game, i) => {
    const path = "games." + i;
    checkPhase(game.seasonId, game.phaseId, path);
    ref(teams, game.homeTeamId, path + ".homeTeamId");
    ref(teams, game.awayTeamId, path + ".awayTeamId");
  });
  data.teamHistory.forEach((history, i) => {
    ref(teams, history.teamId, "teamHistory." + i + ".teamId");
    ref(seasons, history.seasonId, "teamHistory." + i + ".seasonId");
  });
  data.batches.forEach((batch, i) => {
    batch.sourceIds.forEach((sourceId) => {
      ref(sources, sourceId, "batches." + i + ".sourceIds");
      const source = sources.get(sourceId);
      if (
        source &&
        batch.approvedAt &&
        Date.parse(source.receivedAt) > Date.parse(batch.approvedAt)
      )
        fail("batches." + i + ".approvedAt", "Approval precedes receipt of a source");
    });
  });
  const logicalIds = new Map<string, string>();
  const identities = new Map<string, string>();
  data.statistics.forEach((record, i) => {
    const path = "statistics." + i;
    const logicalKey = record.kind === "game" ? gameStatsKey(record) : phaseStatsKey(record);
    const existing = logicalIds.get(logicalKey);
    if (existing && existing !== record.id)
      fail(
        path + ".id",
        "Duplicate logical statistics identity; reuse record ID " + existing + " in a new revision",
      );
    logicalIds.set(logicalKey, record.id);
    const oldKey = identities.get(record.id);
    if (oldKey && oldKey !== logicalKey)
      fail(path + ".id", "Record ID cannot change its logical identity across revisions");
    identities.set(record.id, logicalKey);
    if (record.kind === "game") {
      ref(games, record.gameId, path + ".gameId");
      ref(teams, record.teamId, path + ".teamId");
      const game = games.get(record.gameId);
      if (game && record.teamId !== game.homeTeamId && record.teamId !== game.awayTeamId)
        fail(path + ".teamId", "Player team is not a participant in this game");
      if (game && record.availability === "available" && game.status !== "played")
        fail(path + ".availability", "Available game statistics require a played game");
    } else {
      checkPhase(record.seasonId, record.phaseId, path);
      if (record.teamId) ref(teams, record.teamId, path + ".teamId");
      record.coverage?.expectedGameIds?.forEach((gameId) => {
        const expected = games.get(gameId);
        if (
          expected &&
          (expected.seasonId !== record.seasonId ||
            (record.phaseId === "playoffs"
              ? expected.phaseId === "regular"
              : expected.phaseId !== record.phaseId) ||
            (record.teamId &&
              expected.homeTeamId !== record.teamId &&
              expected.awayTeamId !== record.teamId))
        )
          fail(
            path + ".coverage.expectedGameIds",
            "Coverage game contradicts the period or team scope",
          );
      });
    }
  });
  data.awards.forEach((award, i) => {
    ref(seasons, award.seasonId, "awards." + i + ".seasonId");
    if (award.teamId) ref(teams, award.teamId, "awards." + i + ".teamId");
  });

  const extrasIdentities = new Map<string, string>();
  const extrasSeasons = new Map<string, string>();
  data.extras.forEach((extra, i) => {
    ref(seasons, extra.seasonId, "extras." + i + ".seasonId");
    if (
      (extrasIdentities.has(extra.id) && extrasIdentities.get(extra.id) !== extra.seasonId) ||
      (extrasSeasons.has(extra.seasonId) && extrasSeasons.get(extra.seasonId) !== extra.id)
    )
      fail("extras." + i, "Extras identity must remain unique per season across revisions");
    extrasIdentities.set(extra.id, extra.seasonId);
    extrasSeasons.set(extra.seasonId, extra.id);
  });
  const versions = new Map<string, { sourceIds: string[]; revision: number; path: string }>();
  const versionKey = (kind: string, id: string, revision: number) =>
    JSON.stringify([kind, id, revision]);
  const addVersion = (
    kind: string,
    record: { id: string; revision: number; sourceIds: string[] },
    path: string,
  ) => {
    const key = versionKey(kind, record.id, record.revision);
    if (versions.has(key)) fail(path, "Duplicate record revision: " + key);
    else versions.set(key, { ...record, path });
    record.sourceIds.forEach((sourceId) => ref(sources, sourceId, path + ".sourceIds"));
  };
  data.statistics.forEach((record, i) => addVersion(record.kind, record, "statistics." + i));
  data.awards.forEach((award, i) => addVersion("award", award, "awards." + i));
  data.extras.forEach((extra, i) => addVersion("extras", extra, "extras." + i));
  const revisions = new Map<string, StatisticsDataset["revisions"][number]>();
  data.revisions.forEach((revision, i) => {
    const path = "revisions." + i;
    const key = versionKey(revision.recordKind, revision.recordId, revision.revision);
    if (revisions.has(key)) fail(path, "Duplicate audit entry for record revision");
    else revisions.set(key, revision);
    const version = versions.get(key);
    if (!version) fail(path + ".recordId", "Audit revision references a missing record version");
    else if (
      JSON.stringify([...version.sourceIds].sort()) !==
      JSON.stringify([...revision.sourceIds].sort())
    )
      fail(path + ".sourceIds", "Audit sources must exactly match the record sources");
    ref(batches, revision.batchId, path + ".batchId");
    const batch = batches.get(revision.batchId);
    if (batch && batch.status !== "published")
      fail(path + ".batchId", "Persisted records require a published, manually approved batch");
    if (batch && Date.parse(revision.createdAt) < Date.parse(batch.createdAt))
      fail(path + ".createdAt", "Revision precedes its batch");
    if (batch?.approvedAt && Date.parse(revision.createdAt) > Date.parse(batch.approvedAt))
      fail(path + ".createdAt", "Revision was created after approval; obtain a new review batch");
    revision.sourceIds.forEach((sourceId) => {
      ref(sources, sourceId, path + ".sourceIds");
      if (batch && !batch.sourceIds.includes(sourceId))
        fail(path + ".sourceIds", "Source is not covered by the approval batch");
      const source = sources.get(sourceId);
      if (source && Date.parse(revision.createdAt) < Date.parse(source.receivedAt))
        fail(path + ".createdAt", "Revision precedes source receipt");
    });
  });
  versions.forEach((version, key) => {
    if (!revisions.has(key))
      fail(version.path, "Missing provenance/audit revision for published record");
  });
  data.revisions.forEach((revision, i) => {
    if (revision.revision <= 1) return;
    const previous = revisions.get(
      versionKey(revision.recordKind, revision.recordId, revision.revision - 1),
    );
    if (!previous)
      fail(
        "revisions." + i + ".supersedesRevision",
        "Preceding revision must be retained; no gaps or silent overwrite",
      );
    else if (Date.parse(revision.createdAt) < Date.parse(previous.createdAt))
      fail("revisions." + i + ".createdAt", "Revision chronology is inconsistent");
  });
  // An award occurrence keeps its season/type; a reviewed correction may change its recipient.
  const awardIdentities = new Map<string, string>();
  data.awards.forEach((award, i) => {
    const key = JSON.stringify([award.seasonId, award.type]);
    if (awardIdentities.has(award.id) && awardIdentities.get(award.id) !== key)
      fail("awards." + i + ".id", "Award identity cannot change across revisions");
    awardIdentities.set(award.id, key);
  });
  return issues.length ? { success: false, issues } : { success: true, data, issues: [] };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => JSON.stringify(key) + ":" + canonical(entry))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
/** Compare two validated snapshots before publication. This function never writes. */
export function validateAppendOnly(
  previous: StatisticsDataset,
  next: StatisticsDataset,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  function retain<T>(
    old: readonly T[],
    current: readonly T[],
    key: (item: T) => string,
    category: string,
  ) {
    const nextByKey = new Map(current.map((item) => [key(item), item]));
    for (const item of old) {
      const replacement = nextByKey.get(key(item));
      if (!replacement || canonical(item) !== canonical(replacement))
        issues.push({
          path: category + "." + key(item),
          message: "Approved history cannot be removed or overwritten; append a revision",
        });
    }
  }
  retain(
    previous.statistics,
    next.statistics,
    (row) => row.kind + ":" + row.id + ":" + row.revision,
    "statistics",
  );
  retain(previous.extras ?? [], next.extras ?? [], (row) => row.id + ":" + row.revision, "extras");
  retain(previous.awards, next.awards, (row) => row.id + ":" + row.revision, "awards");
  retain(previous.revisions, next.revisions, (row) => row.id, "revisions");
  retain(previous.sources, next.sources, (row) => row.id, "sources");
  // Approval may advance to publication, but approval evidence itself is immutable.
  const approved = previous.batches.filter((batch) =>
    ["approved", "published"].includes(batch.status),
  );
  retain(
    approved.map((batch) => ({ ...batch, status: "published" })),
    next.batches
      .filter((batch) => ["approved", "published"].includes(batch.status))
      .map((batch) => ({ ...batch, status: "published" })),
    (row) => row.id,
    "batches",
  );
  for (const old of previous.batches.filter((batch) => batch.status === "published")) {
    if (next.batches.find((batch) => batch.id === old.id)?.status !== "published")
      issues.push({ path: "batches." + old.id, message: "Published batch cannot move backwards" });
  }
  return issues;
}
