import { seasonExtrasSchema } from "./extras.ts";
import {
  candidateBatchSchema,
  aliasRegistrySchema,
  type CandidateBatch,
  type ImportIssue,
  type ImportConflict,
} from "./import-contracts.ts";
import { normalizeImportStatistics, resolveImportPlayer } from "./import-normalization.ts";
import { validateDataset, validateAppendOnly } from "./validate.ts";
import {
  playerGameStatsSchema,
  playerPhaseStatsSchema,
  playerTeamHistorySchema,
  awardSchema,
} from "./schemas.ts";
import { gameStatsKey, phaseStatsKey } from "./identifiers.ts";
import { collectRepresentations } from "./aggregation.ts";
import { selectSeasonStats } from "./selectors.ts";
import { selectCurrentRevisions } from "./revisions.ts";
import type { StatisticsDataset, PlayerGameStats, PlayerPhaseStats, Award } from "./types.ts";
import type { StatisticsQuery } from "./derived-types.ts";
export function canonicalImport(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalImport).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonicalImport(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export interface ImportChange {
  itemId: string;
  category: keyof StatisticsDataset;
  recordId: string;
  action: "new" | "duplicate" | "correction";
  sourceIds: string[];
  value: unknown;
  missing: string[];
}
export interface CandidateReview {
  batchId: string;
  ready: boolean;
  issues: ImportIssue[];
  conflicts: ImportConflict[];
  changes: ImportChange[];
  sourceMapping: Record<string, string>;
  candidate: unknown;
}
export interface CandidatePlan {
  batch?: CandidateBatch;
  proposal?: StatisticsDataset;
  report: CandidateReview;
}
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
function differences(
  old: unknown,
  next: unknown,
  path = "",
): { metric: string; existingValue: unknown; candidateValue: unknown }[] {
  if (canonicalImport(old) === canonicalImport(next)) return [];
  if (
    old &&
    next &&
    typeof old === "object" &&
    typeof next === "object" &&
    !Array.isArray(old) &&
    !Array.isArray(next)
  ) {
    const a = old as Record<string, unknown>,
      b = next as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .sort()
      .flatMap((key) => differences(a[key], b[key], path ? path + "." + key : key));
  }
  return [{ metric: path, existingValue: old ?? null, candidateValue: next ?? null }];
}
function content(record: { id: string; revision: number; sourceIds: string[] }) {
  const { id, revision, sourceIds, ...value } = record;
  return value;
}
export function reviewCandidate(
  input: unknown,
  baselineInput: unknown,
  aliasesInput: unknown = [],
): CandidatePlan {
  const report: CandidateReview = {
    batchId: "invalid",
    ready: false,
    issues: [],
    conflicts: [],
    changes: [],
    sourceMapping: {},
    candidate: input,
  };
  const fail = (layer: ImportIssue["layer"], path: string, message: string) =>
    report.issues.push({ layer, path, message });
  const parsed = candidateBatchSchema.safeParse(input);
  if (!parsed.success) {
    parsed.error.issues.forEach((i) => fail("structural", i.path.join("."), i.message));
    return { report };
  }
  const batch = parsed.data;
  report.batchId = batch.id;
  const baseline = validateDataset(baselineInput);
  if (!baseline.success) {
    baseline.issues.forEach((i) => fail("historical", "baseline." + i.path, i.message));
    return { batch, report };
  }
  const aliasesResult = aliasRegistrySchema.safeParse(aliasesInput);
  if (!aliasesResult.success) {
    fail("identity", "aliases", aliasesResult.error.message);
    return { batch, report };
  }
  const aliases = aliasesResult.data;
  const next = structuredClone(baseline.data);
  if (next.batches.some((b) => b.id === batch.id))
    fail("historical", "id", "Batch ID already published");
  for (const { source } of batch.sources) {
    const byHash = next.sources.find((s) => s.contentHash === source.contentHash);
    const byId = next.sources.find((s) => s.id === source.id);
    if (byId && byId.contentHash !== source.contentHash) {
      fail("historical", "sources." + source.id, "Source ID already belongs to a different image");
      continue;
    }
    report.sourceMapping[source.id] = (byHash ?? source).id;
    if (!byHash) next.sources.push(source);
  }
  const mapSources = (sourceIds?: string[]) => {
    if (!sourceIds?.length) throw new Error("Source identification is missing");
    return [
      ...new Set(
        sourceIds.map((sourceId) => {
          const resolved = report.sourceMapping[sourceId];
          if (!resolved) throw new Error("Source is not declared in this candidate: " + sourceId);
          return resolved;
        }),
      ),
    ].sort();
  };
  for (const category of ["teams", "seasons", "games"] as const) {
    const seen = new Set<string>();
    for (const entity of batch.entities[category]) {
      try {
        if (seen.has(entity.value.id)) throw new Error("Duplicate proposed entity ID");
        seen.add(entity.value.id);
        const sourceIds = mapSources(entity.sourceIds);
        const existing = next[category].find((row) => row.id === entity.value.id);
        if (existing && canonicalImport(existing) !== canonicalImport(entity.value))
          throw new Error("Existing entity metadata cannot be overwritten by this pipeline");
        if (!existing) (next[category] as { id: string }[]).push(entity.value);
        report.changes.push({
          itemId: category + ":" + entity.value.id,
          category,
          recordId: entity.value.id,
          action: existing ? "duplicate" : "new",
          sourceIds,
          value: entity.value,
          missing: [],
        });
      } catch (error) {
        fail("historical", category + "." + entity.value.id, errorText(error));
      }
    }
  }
  const current = new Map<string, PlayerGameStats | PlayerPhaseStats>();
  baseline.data.statistics.forEach((r) => {
    if (!current.has(r.id) || current.get(r.id)!.revision < r.revision) current.set(r.id, r);
  });
  const awards = new Map<string, Award>();
  baseline.data.awards.forEach((r) => {
    if (!awards.has(r.id) || awards.get(r.id)!.revision < r.revision) awards.set(r.id, r);
  });
  const seenRecords = new Set<string>(),
    queries = new Map<string, StatisticsQuery>();
  for (const item of batch.items) {
    try {
      if (item.unrecognizedFields.length)
        throw new Error("Unrecognized extracted fields require review");
      const sourceIds = mapSources(item.sourceIds);
      const playerId = item.player ? resolveImportPlayer(item.player, aliases) : undefined;
      if (!item.seasonId) throw new Error("Season identification is missing");
      if (item.kind === "season-extras") {
        if (
          item.player ||
          item.values ||
          item.phaseId ||
          item.teamId ||
          item.gameId ||
          item.award ||
          item.history ||
          item.coverage ||
          item.screen ||
          item.scope ||
          item.availability
        )
          throw new Error("Unexpected individual fields on season extras");
        const previous = baseline.data.extras
          .filter((e) => e.seasonId === item.seasonId)
          .sort((a, b) => b.revision - a.revision)[0];
        if (item.recordId && previous && item.recordId !== previous.id)
          throw new Error("Extras record identity differs");
        let row = seasonExtrasSchema.parse({
          id: previous?.id ?? item.recordId ?? item.id,
          seasonId: item.seasonId,
          data: item.extras,
          sourceIds,
          revision: 1,
        });
        if (baseline.data.extras.some((e) => e.id === row.id && e.seasonId !== row.seasonId))
          throw new Error("Extras ID already belongs to another season");
        const key = "extras:" + item.seasonId;
        if (seenRecords.has(key)) throw new Error("Duplicate extras candidate");
        seenRecords.add(key);
        const delta = previous ? differences(previous.data, row.data) : [];
        const action = previous ? (delta.length ? "correction" : "duplicate") : "new";
        if (action === "correction") {
          delta.forEach((change) =>
            report.conflicts.push({
              itemId: item.id,
              recordId: row.id,
              ...change,
              status: "conflict",
              requiresReview: true,
            }),
          );
          if (item.correction?.expectedRevision !== previous.revision)
            throw new Error("Correction requires current expectedRevision and reason");
          row = { ...row, revision: previous.revision + 1 };
        } else if (item.correction) throw new Error("Correction without changed existing content");
        report.changes.push({
          itemId: item.id,
          category: "extras",
          recordId: row.id,
          action,
          sourceIds,
          value: row,
          missing: [],
        });
        if (action !== "duplicate") {
          next.extras.push(row);
          next.revisions.push({
            id: batch.id + "-r-" + item.id,
            recordId: row.id,
            recordKind: "extras",
            revision: row.revision,
            sourceIds,
            batchId: batch.id,
            createdAt: batch.receivedAt,
            ...(previous
              ? { supersedesRevision: previous.revision, reason: item.correction!.reason }
              : {}),
          });
        }
        continue;
      }
      if (item.extras) throw new Error("Extras require season-extras kind");
      if (item.kind !== "award" && !playerId) throw new Error("Player identification is missing");
      if (item.kind === "team-history") {
        if (
          item.values ||
          item.phaseId ||
          item.gameId ||
          item.award ||
          item.coverage ||
          item.screen ||
          item.scope ||
          item.availability
        )
          throw new Error("Unexpected fields on team history");
        if (item.correction)
          throw new Error(
            "Team history has no revision contract; corrections require a separate reviewed migration",
          );
        const row = playerTeamHistorySchema.parse({
          id: item.recordId ?? item.id,
          playerId,
          seasonId: item.seasonId,
          teamId: item.teamId,
          ...item.history,
        });
        const existing = next.teamHistory.find((r) => r.id === row.id);
        const logical = next.teamHistory.find(
          (r) =>
            r.playerId === row.playerId &&
            r.teamId === row.teamId &&
            r.seasonId === row.seasonId &&
            r.startedAt === row.startedAt &&
            r.endedAt === row.endedAt,
        );
        if (
          (existing && canonicalImport(existing) !== canonicalImport(row)) ||
          (logical && logical.id !== row.id)
        )
          throw new Error("Conflicting or duplicate team history identity");
        if (!existing) next.teamHistory.push(row);
        report.changes.push({
          itemId: item.id,
          category: "teamHistory",
          recordId: row.id,
          action: existing ? "duplicate" : "new",
          sourceIds,
          value: row,
          missing: [],
        });
        continue;
      }
      let candidate: PlayerGameStats | PlayerPhaseStats | Award;
      let previous: typeof candidate | undefined;
      let missing: string[] = [];
      if (item.kind === "award") {
        if (
          item.values ||
          item.phaseId ||
          item.gameId ||
          item.history ||
          item.coverage ||
          item.screen ||
          item.scope ||
          item.availability
        )
          throw new Error("Unexpected fields on award");
        const award = awardSchema.parse({
          id: item.recordId ?? item.id,
          playerId,
          teamId: item.teamId,
          seasonId: item.seasonId,
          ...item.award,
          revision: 1,
          sourceIds,
        });
        candidate = award;
        previous = item.recordId ? awards.get(item.recordId) : undefined;
        previous ??= [...awards.values()].find(
          (r) =>
            r.seasonId === award.seasonId &&
            r.type === award.type &&
            r.playerId === award.playerId &&
            r.teamId === award.teamId &&
            r.label === award.label,
        );
      } else {
        if (item.award || item.history) throw new Error("Unexpected non-statistical fields");
        if (!item.phaseId || !item.availability)
          throw new Error("Phase and availability must be explicitly identified");
        if (item.kind === "season-summary" && item.phaseId !== "regular")
          throw new Error("season-summary represents regular; use phase-summary for another phase");
        let normalized;
        try {
          normalized = normalizeImportStatistics(item, batch.decimalSeparator);
        } catch (error) {
          fail("statistical", "items." + item.id + ".values", errorText(error));
          continue;
        }
        missing = normalized.missing;
        const fields = {
          id: item.recordId ?? item.id,
          playerId,
          sourceIds,
          revision: 1,
          availability: item.availability,
          stats: normalized.stats,
          ...(Object.keys(normalized.displayPrecision).length
            ? { displayPrecision: normalized.displayPrecision }
            : {}),
        };
        if (item.kind === "game-box-score") {
          if (item.scope || item.coverage)
            throw new Error("Game records cannot carry consolidated scope/coverage");
          candidate = playerGameStatsSchema.parse({
            ...fields,
            kind: "game",
            gameId: item.gameId,
            teamId: item.teamId,
          });
          const game = next.games.find((g) => g.id === item.gameId);
          if (!game || game.seasonId !== item.seasonId || game.phaseId !== item.phaseId)
            throw new Error("Game identity does not match the declared season/phase");
        } else {
          if (item.gameId) throw new Error("Consolidated records cannot carry a game ID");
          candidate = playerPhaseStatsSchema.parse({
            ...fields,
            kind: "phase",
            seasonId: item.seasonId,
            phaseId: item.phaseId,
            scope: item.scope,
            teamId: item.teamId,
            ...(item.coverage
              ? { coverage: { ...item.coverage, sourceIds: mapSources(item.coverage.sourceIds) } }
              : {}),
          });
        }
        const key = candidate.kind === "game" ? gameStatsKey(candidate) : phaseStatsKey(candidate);
        previous = [...current.values()].find(
          (r) => (r.kind === "game" ? gameStatsKey(r) : phaseStatsKey(r)) === key,
        );
        const q = {
          playerId: playerId!,
          seasonId: item.seasonId,
          phaseId: item.phaseId,
          ...(item.scope === "team" || item.kind === "game-box-score"
            ? { teamId: item.teamId }
            : {}),
        };
        queries.set(canonicalImport(q), q);
        const all = { playerId: playerId!, seasonId: item.seasonId, phaseId: item.phaseId };
        queries.set(canonicalImport(all), all);
        if (item.phaseId !== "regular") {
          const playoffs = { ...all, phaseId: "playoffs" as const };
          queries.set(canonicalImport(playoffs), playoffs);
        }
      }
      if (previous && item.recordId && item.recordId !== previous.id)
        throw new Error("Logical identity already exists under record ID " + previous.id);
      if (
        !previous &&
        (baseline.data.statistics.some((r) => r.id === candidate.id) ||
          baseline.data.awards.some((r) => r.id === candidate.id))
      )
        throw new Error("Record ID already has another logical identity");
      if (previous) candidate = { ...candidate, id: previous.id };
      const identity =
        "kind" in candidate
          ? candidate.kind === "game"
            ? gameStatsKey(candidate)
            : phaseStatsKey(candidate)
          : JSON.stringify([
              "award",
              candidate.seasonId,
              candidate.type,
              candidate.playerId,
              candidate.teamId,
              candidate.label,
            ]);
      if (seenRecords.has(identity) || seenRecords.has("id:" + candidate.id))
        throw new Error("Duplicate candidate record identity");
      seenRecords.add(identity);
      seenRecords.add("id:" + candidate.id);
      const delta = previous ? differences(content(previous), content(candidate)) : [];
      const action = previous ? (delta.length ? "correction" : "duplicate") : "new";
      if (action === "correction") {
        delta.forEach((change) =>
          report.conflicts.push({
            itemId: item.id,
            recordId: candidate.id,
            ...change,
            status: "conflict",
            requiresReview: true,
          }),
        );
        if (!item.correction || item.correction.expectedRevision !== previous!.revision)
          throw new Error("Correction requires the current expectedRevision and a reason");
        candidate = { ...candidate, revision: previous!.revision + 1 };
      } else if (item.correction)
        throw new Error("Correction requested without changed existing content");
      report.changes.push({
        itemId: item.id,
        category: "kind" in candidate ? "statistics" : "awards",
        recordId: candidate.id,
        action,
        sourceIds,
        value: candidate,
        missing,
      });
      if (action === "duplicate") continue;
      if ("kind" in candidate) next.statistics.push(candidate);
      else next.awards.push(candidate);
      next.revisions.push({
        id: batch.id + "-r-" + item.id,
        recordId: candidate.id,
        recordKind: "kind" in candidate ? candidate.kind : "award",
        revision: candidate.revision,
        sourceIds,
        batchId: batch.id,
        createdAt: batch.receivedAt,
        ...(previous
          ? { supersedesRevision: previous.revision, reason: item.correction!.reason }
          : {}),
      });
    } catch (error) {
      const message = errorText(error);
      const layer = /[Cc]orrection|[Dd]uplicate|[Rr]evision|Record ID|identity already/.test(
        message,
      )
        ? "historical"
        : error instanceof Error && error.name === "ZodError"
          ? "structural"
          : "identity";
      fail(layer, "items." + item.id, message);
    }
  }
  next.batches.push({
    id: batch.id,
    sourceIds: [...new Set(Object.values(report.sourceMapping))].sort(),
    status: "published",
    createdAt: batch.receivedAt,
    approvedAt: batch.receivedAt,
    approvedBy: "review-preview-not-authorization",
  });
  const validated = validateDataset(next);
  if (!validated.success) validated.issues.forEach((i) => fail("structural", i.path, i.message));
  else {
    validateAppendOnly(baseline.data, validated.data).forEach((i) =>
      fail("historical", i.path, i.message),
    );
    if (!report.issues.length) {
      try {
        selectCurrentRevisions(validated.data);
        for (const q of queries.values()) {
          const results = [
            ...collectRepresentations(validated.data, q),
            selectSeasonStats(validated.data, q),
          ];
          for (const r of results) {
            r.conflicts.forEach((c) =>
              fail("statistical", canonicalImport(q) + "." + c.metric, c.reason),
            );
            r.warnings.forEach((warning) =>
              fail("statistical", canonicalImport(q), warning + "; declare reviewed precision"),
            );
          }
        }
      } catch (error) {
        fail("statistical", "proposal", errorText(error));
      }
    }
  }
  if (!report.changes.some((c) => c.action !== "duplicate"))
    fail(
      "historical",
      "items",
      "No changes to publish; duplicate observations are not new versions",
    );
  report.issues = report.issues.filter(
    (i, n, all) => all.findIndex((other) => canonicalImport(other) === canonicalImport(i)) === n,
  );
  report.ready = report.issues.length === 0;
  return {
    batch,
    report,
    proposal: report.ready && validated.success ? validated.data : undefined,
  };
}
