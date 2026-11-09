import { publishedDataset, season } from "./fixtures.mjs";
import { phaseCatalog } from "../../src/lib/statistics/phases.ts";
export const query = { playerId: "abel", seasonId: "season-001", phaseId: "regular" };
export function engineDataset() {
  const data = publishedDataset();
  data.statistics = [];
  data.revisions = [];
  data.games = [];
  data.seasons[0].phases = structuredClone(phaseCatalog);
  return data;
}
export function addRecord(data, record) {
  data.statistics.push(record);
  data.revisions.push({
    id: "audit-" + record.id + "-" + record.revision,
    recordId: record.id,
    recordKind: record.kind,
    revision: record.revision,
    sourceIds: [...record.sourceIds],
    batchId: "batch-a",
    createdAt: "2026-01-01T01:00:00Z",
    ...(record.revision > 1
      ? { supersedesRevision: record.revision - 1, reason: "Synthetic correction" }
      : {}),
  });
  return record;
}
export function addGame(data, id, totals, extra = {}) {
  const {
    playerId = "abel",
    teamId = "team-a",
    seasonId = "season-001",
    phaseId = "regular",
    availability = "available",
    ...other
  } = extra;
  if (!data.games.some((game) => game.id === id))
    data.games.push({
      id,
      seasonId,
      phaseId,
      homeTeamId: "team-a",
      awayTeamId: "team-b",
      status: "played",
    });
  return addRecord(data, {
    id: "stats-" + id + "-" + playerId,
    kind: "game",
    gameId: id,
    playerId,
    teamId,
    availability,
    stats: { totals },
    sourceIds: ["source-a"],
    revision: 1,
    ...other,
  });
}
export function addPhase(data, phaseId, stats, extra = {}) {
  const {
    id = "phase-" + phaseId,
    playerId = "abel",
    seasonId = "season-001",
    teamId,
    availability = "available",
    ...other
  } = extra;
  return addRecord(data, {
    id,
    kind: "phase",
    playerId,
    seasonId,
    phaseId,
    scope: teamId ? "team" : "all-teams",
    ...(teamId ? { teamId } : {}),
    availability,
    stats,
    sourceIds: ["source-a"],
    revision: 1,
    ...other,
  });
}
export function proof(expectedGames, expectedGameIds) {
  return {
    status: "complete",
    sourceIds: ["source-a"],
    note: "Synthetic reviewed full-period evidence",
    ...(expectedGames === undefined ? {} : { expectedGames }),
    ...(expectedGameIds === undefined ? {} : { expectedGameIds }),
  };
}
export function twoGames() {
  const data = engineDataset();
  addGame(data, "game-one", { points: 30, assists: 8, fgm: 10, fga: 20 });
  addGame(data, "game-two", { points: 20, assists: 6, fgm: 5, fga: 10 });
  return data;
}
export function addSecondSeason(data) {
  data.seasons.push(season(2));
}
