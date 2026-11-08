import type { Player, Season } from "./mock-data";
import type { HomePlayer } from "./home-data";
import {
  metrics,
  phases,
  type PlayerAward,
  type PlayerPresentation,
  type StatPhase,
  type PlayerFilters,
} from "./player-types";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// Absence is not evidence of elimination. No averages, games or rounds are inferred.
export function adaptStatPhase(value: unknown): StatPhase {
  const raw = record(value);
  if (
    raw.status === "not-played" ||
    raw.status === "not-qualified" ||
    raw.status === "no-games" ||
    raw.status === "not-imported"
  ) {
    return { status: raw.status, values: {} };
  }
  if (raw.gp === 0) return { status: "no-games", values: { gp: 0 } };
  const values: StatPhase["values"] = {};
  for (const metric of metrics) {
    const number = raw[metric.id];
    if (
      typeof number === "number" &&
      Number.isFinite(number) &&
      number >= 0 &&
      (metric.id !== "gp" || Number.isInteger(number))
    ) {
      values[metric.id] = number;
    }
  }
  return Object.keys(values).length
    ? { status: "available", values, source: "Estatísticas importadas do acervo da liga" }
    : { status: "not-imported", values: {} };
}

const awardLabels: Record<string, { label: string; kind: PlayerAward["kind"] }> = {
  "NBA Champion": { label: "Campeão da NBA", kind: "title" },
  MVP: { label: "MVP da temporada", kind: "individual" },
  "Finals MVP": { label: "MVP das Finais", kind: "individual" },
  DPOY: { label: "Defensor do Ano", kind: "individual" },
  "Defensive Player of the Year": { label: "Defensor do Ano", kind: "individual" },
  "Sixth Man of the Year": { label: "Sexto Homem do Ano", kind: "individual" },
  ROTY: { label: "Novato do Ano", kind: "individual" },
  "Rookie of the Year": { label: "Novato do Ano", kind: "individual" },
  MIP: { label: "Jogador que Mais Evoluiu", kind: "individual" },
  "Most Improved Player": { label: "Jogador que Mais Evoluiu", kind: "individual" },
  "All-Star": { label: "All-Star", kind: "selection" },
};

export function adaptAwards(player: Player, leagueSeasons: Season[]): PlayerAward[] {
  const awards = new Map<string, PlayerAward>();
  const rawAwards =
    "awards" in player && Array.isArray(player.awards)
      ? player.awards.filter((value): value is string => typeof value === "string")
      : [];
  for (const name of rawAwards) {
    const current = awards.get(name);
    const metadata = awardLabels[name] ?? {
      label: name,
      kind: name.startsWith("All-") ? ("selection" as const) : ("other" as const),
    };
    awards.set(name, { id: name, ...metadata, count: (current?.count ?? 0) + 1, years: [] });
  }
  // Rings are explicitly recorded. Membership of a championship team does not assign a title year.
  if (player.rings > 0)
    awards.set("NBA Champion", {
      id: "NBA Champion",
      ...awardLabels["NBA Champion"],
      count: player.rings,
      years: [],
    });
  for (const [id, field] of [
    ["MVP", "mvp"],
    ["Finals MVP", "finalsMvp"],
  ] as const) {
    const years = leagueSeasons
      .filter((season) => season[field] === player.name)
      .map((season) => ({ seasonId: season.id, year: season.year }));
    if (!years.length) continue;
    const count = Math.max(awards.get(id)?.count ?? 0, years.length);
    awards.set(id, { id, ...awardLabels[id], count, years });
  }
  return [...awards.values()];
}

export function adaptPlayerProfile(
  player: Player,
  portrait: HomePlayer,
  importedSeasons: unknown,
  leagueSeasons: Season[],
): PlayerPresentation {
  const imported = record(importedSeasons);
  const awards = adaptAwards(player, leagueSeasons);
  return {
    ...portrait,
    teamNames: [...player.teams],
    positions: player.archetype.split(" ")[0].split("-"),
    archetype: player.archetype.slice(player.archetype.indexOf(" ") + 1),
    biography: player.bio,
    awards,
    // career supplies chronology and team only; its synthetic stat fallbacks are deliberately not used.
    career: player.career.map((year) => {
      const raw = record(imported[year.season]);
      const availablePhases = Object.fromEntries(
        phases.map(({ id }) => [id, adaptStatPhase(raw[id])]),
      ) as PlayerPresentation["career"][number]["phases"];
      return {
        id: year.season,
        year: year.year,
        team: year.team,
        phases: availablePhases,
        awards: awards
          .filter((award) => award.years.some((date) => date.seasonId === year.season))
          .map(({ id, label }) => ({ id, label })),
      };
    }),
  };
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function filterPlayers(players: PlayerPresentation[], filters: PlayerFilters) {
  const result = players.filter(
    (player) =>
      (!filters.q || normalizeSearch(player.name).includes(normalizeSearch(filters.q))) &&
      (!filters.team || player.teamNames.includes(filters.team)) &&
      (!filters.position || player.positions.includes(filters.position)),
  );
  if (filters.order)
    result.sort(
      (a, b) => a.name.localeCompare(b.name, "pt-BR") * (filters.order === "za" ? -1 : 1),
    );
  return result;
}

export function validatePlayerFilters(search: Record<string, unknown>): PlayerFilters {
  return {
    q: typeof search.q === "string" && search.q.trim() ? search.q.slice(0, 100) : undefined,
    team: typeof search.team === "string" && search.team ? search.team : undefined,
    position: typeof search.position === "string" && search.position ? search.position : undefined,
    order: search.order === "az" || search.order === "za" ? search.order : undefined,
  };
}
