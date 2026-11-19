import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { RecordTarget, SeasonRules, SeasonTarget } from "../../src/lib/liga-viva/types.ts";

const sourceUrl = (path: string) => new URL(`../../src/data/statistics/${path}`, import.meta.url);
const supportedSeasonIds: readonly string[] = [
  "season-002",
  "season-003",
  "season-004",
  "season-005",
  "season-006",
  "season-007",
  "season-008",
  "season-009",
  "season-010",
  "season-011",
];
const extrasSnapshotSeasonIds = ["season-009", "season-010", "season-011"];
const fallbackSeasonLabels: Record<string, string> = {
  "season-009": "2013–14 · Temporada 09",
  "season-010": "2014–15 · Temporada 10",
  "season-011": "2015–16 · Temporada 11",
};

function parseRecord(value: unknown, teamId: string, field: string): RecordTarget {
  if (typeof value !== "string" || !/^\d+-\d+$/.test(value))
    throw new Error(`${teamId}: ${field} must be a W-L string`);
  const [wins, losses] = value.split("-").map(Number);
  return { wins, losses };
}

export async function loadPilotSeason(seasonId = "season-002") {
  if (!supportedSeasonIds.includes(seasonId))
    throw new Error(`Unsupported reconstruction season: ${seasonId}`);
  const usesExtrasSnapshot = extrasSnapshotSeasonIds.includes(seasonId);
  const standingsPath = usesExtrasSnapshot ? `${seasonId}/extras.json` : "season-extras.json";
  const standingsBytes = await readFile(sourceUrl(standingsPath));
  const detailsBytes =
    usesExtrasSnapshot ? Buffer.from("") : await readFile(sourceUrl(`${seasonId}/standings-details.json`));
  const rulesBytes = await readFile(new URL(`../../src/data/liga-viva/rules/${seasonId}.json`, import.meta.url));
  const archive = JSON.parse(standingsBytes.toString("utf8"));
  const details = usesExtrasSnapshot ? {} : JSON.parse(detailsBytes.toString("utf8"));
  const rules = JSON.parse(rulesBytes.toString("utf8")) as SeasonRules;
  const season =
    usesExtrasSnapshot
      ? archive.find((entry: { seasonId: string }) => entry.seasonId === seasonId)?.data
      : archive[seasonId];
  if (!season?.standings || (!usesExtrasSnapshot && season.seasonId !== seasonId))
    throw new Error(`${seasonId} observed standings are missing`);

  const teams: SeasonTarget["teams"] = [];
  for (const conference of ["west", "east"] as const) {
    for (const row of season.standings[conference]) {
      const source = usesExtrasSnapshot ? row : details[row.team];
      if (!source) throw new Error(`${row.team}: ${seasonId} details are missing`);
      let divisionRecord = parseRecord(source.division, row.team, "division");
      const normalization = rules.normalizations?.find(
        (entry) => entry.teamId === row.team && entry.field === "divisionRecord",
      );
      if (normalization) {
        const sourceValue = `${divisionRecord.wins}-${divisionRecord.losses}`;
        if (sourceValue !== normalization.sourceValue)
          throw new Error(`${row.team}: expected ${normalization.sourceValue}, found ${sourceValue}`);
        divisionRecord = parseRecord(normalization.normalizedValue, row.team, "normalized division");
      }
      teams.push({
        teamId: row.team,
        conference,
        rank: row.rank,
        wins: row.wins,
        losses: row.losses,
        pct: row.pct,
        home: parseRecord(source.home, row.team, "home"),
        away: parseRecord(source.away, row.team, "away"),
        conferenceRecord: parseRecord(source.conference, row.team, "conference"),
        divisionRecord,
        scoring: {
          pointsForPerGame: row.ppg,
          pointsAgainstPerGame: row.papg,
        },
      });
    }
  }

  const inputHash = createHash("sha256")
    .update(standingsBytes)
    .update("\0")
    .update(detailsBytes)
    .update("\0")
    .update(rulesBytes)
    .digest("hex");
  const target: SeasonTarget = {
    seasonId,
    label:
      season.label ??
      season.year ??
      fallbackSeasonLabels[seasonId],
    teams,
  };
  return {
    target,
    rules,
    inputHash,
    sourcePaths: [
      fileURLToPath(sourceUrl(standingsPath)),
      ...(usesExtrasSnapshot
        ? []
        : [fileURLToPath(sourceUrl(`${seasonId}/standings-details.json`))]),
      fileURLToPath(new URL(`../../src/data/liga-viva/rules/${seasonId}.json`, import.meta.url)),
    ],
  };
}
