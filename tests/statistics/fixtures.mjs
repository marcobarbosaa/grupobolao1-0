// Synthetic records are confined to tests. Production manifest stays empty.
export function emptyDataset() {
  return {
    teams: [],
    seasons: [],
    games: [],
    teamHistory: [],
    statistics: [],
    awards: [],
    sources: [],
    batches: [],
    revisions: [],
  };
}
export function season(edition = 1) {
  return {
    id: "season-" + String(edition).padStart(3, "0"),
    edition,
    label: "Test season",
    sport: "basquete",
    status: "planned",
    phases: [{ id: "regular", name: "Test regular", order: 0, type: "stage" }],
  };
}
export function publishedDataset() {
  return {
    ...emptyDataset(),
    teams: [
      { id: "team-a", name: "Test team A", sport: "basquete", status: "active" },
      { id: "team-b", name: "Test team B", sport: "basquete", status: "active" },
    ],
    seasons: [season()],
    games: [
      {
        id: "game-a",
        seasonId: "season-001",
        phaseId: "regular",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "played",
      },
    ],
    statistics: [
      {
        id: "stats-a",
        kind: "game",
        gameId: "game-a",
        playerId: "abel",
        teamId: "team-a",
        availability: "available",
        stats: { totals: { blocks: 0 } },
        sourceIds: ["source-a"],
        revision: 1,
      },
    ],
    sources: [
      {
        id: "source-a",
        kind: "screenshot",
        fileName: "test.png",
        contentHash: "a".repeat(64),
        receivedAt: "2026-01-01T00:00:00Z",
        metadata: {},
      },
    ],
    batches: [
      {
        id: "batch-a",
        sourceIds: ["source-a"],
        status: "published",
        createdAt: "2026-01-01T00:00:00Z",
        approvedAt: "2026-01-01T01:00:00Z",
        approvedBy: "test-reviewer",
      },
    ],
    revisions: [
      {
        id: "revision-a",
        recordId: "stats-a",
        recordKind: "game",
        batchId: "batch-a",
        revision: 1,
        sourceIds: ["source-a"],
        createdAt: "2026-01-01T01:00:00Z",
      },
    ],
  };
}
export function correctedDataset() {
  const data = publishedDataset();
  data.statistics.push({
    ...structuredClone(data.statistics[0]),
    revision: 2,
    stats: { totals: { blocks: 1 } },
  });
  data.batches.push({
    ...data.batches[0],
    id: "batch-b",
    createdAt: "2026-01-02T00:00:00Z",
    approvedAt: "2026-01-02T01:00:00Z",
  });
  data.revisions.push({
    ...data.revisions[0],
    batchId: "batch-b",
    id: "revision-b",
    revision: 2,
    supersedesRevision: 1,
    reason: "Correction from reviewed test evidence",
    createdAt: "2026-01-02T00:00:00Z",
  });
  return data;
}
export function emptyManifest() {
  return {
    schemaVersion: "1.0",
    seasons: [],
    statistics: [],
    games: [],
    awards: [],
    teams: [],
    teamHistory: [],
    sources: [],
    batches: [],
    revisions: [],
  };
}
