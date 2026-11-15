import { newRoster } from "./new-roster";
import manifest, { localCrests } from "virtual:bolao-player-history";
import logoData from "../data/statistics/historical-logos.json";
import { publishedSeasons, publishedCatalog } from "./published-catalog";
import { latestAppearanceSeason, resolvePlayerAppearance } from "./player-history";
import { createLandingTheme, getTeamTheme, type LandingTeam } from "./landing-team-themes";

const numbers: Record<string, string> = {
  "fabio-carvalho": "44",
  abel: "0",
  "gam-mori": "24",
  "marco-barbosa": "46",
  "cristiano-ronaldo": "22",
  dias: "31",
  russo: "7",
  jonas: "13",
  enzo: "43",
  tailan: "6",
  "matheus-medeiros": "35",
  nando: "28",
  guilherme: "39",
};

const teamIdentityMetadata = {
  "Miami Heat": { code: "MIA", logo: "heat" },
  "Indiana Pacers": { code: "IND", logo: "pacers" },
  "Sacramento Kings": { code: "SAC", logo: "kings" },
  "Detroit Pistons": { code: "DET", logo: "pistons" },
  "Minnesota Timberwolves": { code: "MIN", logo: "timberwolves" },
  "New Orleans Hornets": { code: "NO", logo: "hornets" },
  "Phoenix Suns": { code: "PHX", logo: "suns" },
  "Atlanta Hawks": { code: "ATL", logo: "hawks" },
  "Denver Nuggets": { code: "DEN", logo: "nuggets" },
  "Dallas Mavericks": { code: "DAL", logo: "mavericks" },
  "Toronto Raptors": { code: "TOR", logo: "raptors" },
  "New York Knicks": { code: "NY", logo: "knicks" },
  "San Antonio Spurs": { code: "SA", logo: "spurs" },
  "Philadelphia 76ers": { code: "PHI", logo: "76ers" },
  "Houston Rockets": { code: "HOU", logo: "rockets" },
  "Chicago Bulls": { code: "CHI", logo: "bulls" },
} as const satisfies Record<LandingTeam, { code: string; logo: string }>;

const neutralIdentity = { code: "", logo: "" };
export const referenceSeason = latestAppearanceSeason(publishedSeasons)?.id ?? "";

export function getPlayerTeamTheme(playerId: string, season = referenceSeason) {
  const appearance = resolvePlayerAppearance(manifest.records, publishedSeasons, playerId, season);
  return getTeamTheme(appearance.team);
}

export function getPlayerAppearance(playerId: string, season = referenceSeason) {
  const appearance = resolvePlayerAppearance(manifest.records, publishedSeasons, playerId, season);
  const palette = getTeamTheme(appearance.team);
  const identity = {
    ...palette,
    ...(teamIdentityMetadata[appearance.team as LandingTeam] ?? neutralIdentity),
  };
  const base = logoData.base as Record<string, { year: number; slug: string }>;
  const overrides = logoData.seasonOverrides as Record<
    string,
    Record<string, { year: number; slug: string }>
  >;
  const logo =
    publishedCatalog.extras[appearance.seasonId ?? ""]?.logos?.[identity.code] ??
    overrides[appearance.seasonId ?? ""]?.[identity.code] ??
    base[identity.code];
  const extension = ["BOS", "CHI", "MIA"].includes(identity.code) ? ".svg" : "@3x.png";
  const localCrest = logo
    ? `/jogadores/escudos/historicos/${logo.year}/${logo.slug}${extension}`
    : undefined;
  return {
    ...appearance,
    identity,
    number: numbers[playerId],
    crest:
      localCrest &&
      (localCrests.includes(localCrest)
        ? localCrest
        : `https://assets.logocdn.com/images/sports/nba/${logo.year}/${logo.slug}${extension}`),
    theme: createLandingTheme(palette),
  };
}
export const selectionRoster = newRoster.map((player) => {
  const appearance = getPlayerAppearance(player.id);
  return { ...player, ...appearance, selectionPortrait: appearance.image };
});
export function getSelectionTheme(index: number) {
  return selectionRoster[index].theme;
}
