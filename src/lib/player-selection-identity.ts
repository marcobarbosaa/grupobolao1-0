import { newRoster } from "./new-roster";
import { createLandingTheme } from "./landing-team-themes";

// Presentation only: audited against the approved selection PNGs, not season records.
const presentation: Record<string, { team?: string; number: string; file?: string }> = {
  "fabio-carvalho": { number: "44" },
  abel: { team: "Phoenix Suns", number: "0" },
  "gam-mori": { number: "24" },
  "marco-barbosa": { number: "46" },
  "cristiano-ronaldo": { team: "Denver Nuggets", number: "22" },
  dias: { team: "Dallas Mavericks", number: "31" },
  russo: { number: "7" },
  jonas: { number: "13" },
  enzo: { number: "43" },
  tailan: { team: "New York Knicks", number: "6" },
  "matheus-medeiros": { number: "35", file: "medeiros" },
  nando: { number: "28" },
  guilherme: { number: "39" },
};

// Deliberate art direction per represented franchise (13 players, 11 franchises).
export const selectionTeams = {
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

export const selectionRoster = newRoster.map((player) => {
  const visual = presentation[player.id];
  const team = visual?.team ?? player.team;
  const identity = selectionTeams[team as keyof typeof selectionTeams];
  return {
    ...player,
    team,
    number: visual?.number,
    selectionPortrait: `/jogadores/selecao/${visual?.file ?? player.id}.png`,
    identity,
    crest: `/jogadores/escudos/${identity.logo}.${identity.code === "CHI" ? "svg" : "png"}`,
  };
});

export function getSelectionTheme(index: number) {
  const palette = selectionRoster[index].identity;
  return {
    ...createLandingTheme(palette),
    "--team-background": palette.base,
    "--team-background-deep": palette.deep,
    "--team-glow": palette.light,
    "--team-text": "#FFFFFF",
    "--team-text-muted": "#E0E5EC",
  };
}
