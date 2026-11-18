import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { RecordTarget, SeasonRules, SeasonTarget } from "../../src/lib/liga-viva/types.ts";

const sourceUrl = (path: string) => new URL(`../../src/data/statistics/${path}`, import.meta.url);

function parseRecord(value: unknown, teamId: string, field: string): RecordTarget {
  if (typeof value !== "string" || !/^\d+-\d+$/.test(value))
    throw new Error(`${teamId}: ${field} must be a W-L string`);
  const [wins, losses] = value.split("-").map(Number);
  return { wins, losses };
}

export async function loadPilotSeason() {
  const standingsBytes = await readFile(sourceUrl("season-extras.json"));
  const detailsBytes = await readFile(sourceUrl("season-002/standings-details.json"));
  const rulesBytes = await readFile(
    new URL("../../src/data/liga-viva/rules/season-002.json", import.meta.url),
  );
  const archive = JSON.parse(standingsBytes.toString("utf8"));
  const details = JSON.parse(detailsBytes.toString("utf8"));
  const rules = JSON.parse(rulesBytes.toString("utf8")) as SeasonRules;
  const season = archive["season-002"];
  if (!season?.standings || season.seasonId !== "season-002")
    throw new Error("Season-002 observed standings are missing");

  const teams: SeasonTarget["teams"] = [];
  for (const conference of ["west", "east"] as const) {
    for (const row of season.standings[conference]) {
      const source = details[row.team];
      if (!source) throw new Error(`${row.team}: season-002 details are missing`);
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
        divisionRecord: parseRecord(source.division, row.team, "division"),
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
  const target: SeasonTarget = { seasonId: "season-002", label: season.year, teams };
  return {
    target,
    rules,
    inputHash,
    sourcePaths: [
      fileURLToPath(sourceUrl("season-extras.json")),
      fileURLToPath(sourceUrl("season-002/standings-details.json")),
      fileURLToPath(new URL("../../src/data/liga-viva/rules/season-002.json", import.meta.url)),
    ],
  };
}
