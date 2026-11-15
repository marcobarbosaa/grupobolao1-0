import { newRoster } from "./new-roster";
import manifest, { localCrests } from "virtual:bolao-player-history";
import logoData from "../data/statistics/historical-logos.json";
import { publishedSeasons, publishedCatalog } from "./published-catalog";
import { latestAppearanceSeason, resolvePlayerAppearance } from "./player-history";
import { createLandingTheme } from "./landing-team-themes";

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

// Deliberate art direction per represented franchise (13 players, 11 franchises).
export const selectionTeams = {
  "Miami Heat": {
    code: "MIA",
    primary: "#C92044",
    secondary: "#F9A33B",
    accent: "#FFD395",
    base: "#461525",
    deep: "#17080F",
    light: "#ED5267",
    logo: "heat",
  },
  "Indiana Pacers": {
    code: "IND",
    primary: "#2365A0",
    secondary: "#FDBB30",
    accent: "#FFE19A",
    base: "#142D48",
    deep: "#071321",
    light: "#6BA3D4",
    logo: "pacers",
  },
  "Sacramento Kings": {
    code: "SAC",
    primary: "#8252B4",
    secondary: "#63727A",
    accent: "#DDC6F5",
    base: "#301D49",
    deep: "#100B1C",
    light: "#AE82D5",
    logo: "kings",
  },
  "Detroit Pistons": {
    code: "DET",
    primary: "#D42C49",
    secondary: "#2366B7",
    accent: "#C9DEFA",
    base: "#42192C",
    deep: "#160D1C",
    light: "#E96277",
    logo: "pistons",
  },
  "Minnesota Timberwolves": {
    code: "MIN",
    primary: "#287BA0",
    secondary: "#33865D",
    accent: "#B7E5D2",
    base: "#153645",
    deep: "#07171F",
    light: "#5CA8C1",
    logo: "timberwolves",
  },
  "New Orleans Hornets": {
    code: "NO",
    primary: "#008DA8",
    secondary: "#39206A",
    accent: "#FFC857",
    base: "#063743",
    deep: "#03171E",
    light: "#30BCCA",
    logo: "hornets",
  },
  "Phoenix Suns": {
    code: "PHX",
    primary: "#7131B1",
    secondary: "#ED5A16",
    accent: "#FFB35C",
    base: "#32104E",
    deep: "#12091F",
    light: "#F88B32",
    logo: "suns",
  },
  "Atlanta Hawks": {
    code: "ATL",
    primary: "#F03B38",
    secondary: "#E4AB24",
    accent: "#FFE08A",
    base: "#4B1819",
    deep: "#211211",
    light: "#F7B538",
    logo: "hawks",
  },
  "Denver Nuggets": {
    code: "DEN",
    primary: "#458DC8",
    secondary: "#ECC049",
    accent: "#FFE29A",
    base: "#123A5A",
    deep: "#071724",
    light: "#68B7E2",
    logo: "nuggets",
  },
  "Dallas Mavericks": {
    code: "DAL",
    primary: "#176CC2",
    secondary: "#A8B7CA",
    accent: "#B4DEFF",
    base: "#102D57",
    deep: "#040F24",
    light: "#419BF2",
    logo: "mavericks",
  },
  "Toronto Raptors": {
    code: "TOR",
    primary: "#C91B4B",
    secondary: "#542185",
    accent: "#E2B9FA",
    base: "#30122B",
    deep: "#100C1A",
    light: "#B13674",
    logo: "raptors",
  },
  "New York Knicks": {
    code: "NY",
    primary: "#0874CA",
    secondary: "#F58426",
    accent: "#FFBD80",
    base: "#073563",
    deep: "#04162F",
    light: "#EF852E",
    logo: "knicks",
  },
  "San Antonio Spurs": {
    code: "SA",
    primary: "#8497A5",
    secondary: "#303C48",
    accent: "#E4ECF0",
    base: "#28323B",
    deep: "#0A0F14",
    light: "#A8C1D0",
    logo: "spurs",
  },
  "Philadelphia 76ers": {
    code: "PHI",
    primary: "#2679C9",
    secondary: "#D9204E",
    accent: "#F3DCA3",
    base: "#152E45",
    deep: "#0B111C",
    light: "#D34B50",
    logo: "76ers",
  },
  "Houston Rockets": {
    code: "HOU",
    primary: "#E52A47",
    secondary: "#8B9EAB",
    accent: "#E2EBF2",
    base: "#4D1728",
    deep: "#160C17",
    light: "#E45869",
    logo: "rockets",
  },
  "Chicago Bulls": {
    code: "CHI",
    primary: "#D20A32",
    secondary: "#38030E",
    accent: "#FFFFFF",
    base: "#430410",
    deep: "#090307",
    light: "#EA1741",
    logo: "bulls",
  },
} as const;

const neutral = {
  code: "",
  primary: "#64748B",
  secondary: "#334155",
  accent: "#E2E8F0",
  base: "#1E293B",
  deep: "#0F172A",
  light: "#94A3B8",
  logo: "",
};
export const referenceSeason = latestAppearanceSeason(publishedSeasons)?.id ?? "";
export function getPlayerAppearance(playerId: string, season = referenceSeason) {
  const appearance = resolvePlayerAppearance(manifest.records, publishedSeasons, playerId, season);
  const identity = selectionTeams[appearance.team as keyof typeof selectionTeams] ?? neutral;
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
    theme: {
      ...createLandingTheme(identity),
      "--team-background": identity.base,
      "--team-background-deep": identity.deep,
      "--team-glow": identity.light,
    },
  };
}
export const selectionRoster = newRoster.map((player) => {
  const appearance = getPlayerAppearance(player.id);
  return { ...player, ...appearance, selectionPortrait: appearance.image };
});
export function getSelectionTheme(index: number) {
  return selectionRoster[index].theme;
}
