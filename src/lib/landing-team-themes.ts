/** Team identity references and deliberately darker UI surfaces; see docs/landing-team-themes.md. */
export const teamPalettes = {
  "New Orleans Hornets": { primary: "#008CA8", secondary: "#1D1160", accent: "#FDBB30" },
  "Sacramento Kings": { primary: "#5A2D81", secondary: "#63727A", accent: "#A7A9AC" },
  "Atlanta Hawks": { primary: "#E03A3E", secondary: "#FDB927", accent: "#FDB927" },
  "Denver Nuggets": { primary: "#0E2240", secondary: "#FEC524", accent: "#1D428A" },
  "Indiana Pacers": { primary: "#002D62", secondary: "#FDBB30", accent: "#FDBB30" },
  "Detroit Pistons": { primary: "#C8102E", secondary: "#1D42BA", accent: "#BEC0C2" },
  "Toronto Raptors": { primary: "#CE1141", secondary: "#000000", accent: "#A1A1A4" },
  "New York Knicks": { primary: "#006BB6", secondary: "#F58426", accent: "#F58426" },
  "San Antonio Spurs": { primary: "#C4CED4", secondary: "#000000", accent: "#9FA7AD" },
  "Minnesota Timberwolves": { primary: "#0C2340", secondary: "#236192", accent: "#78BE20" },
  "Philadelphia 76ers": { primary: "#006BB6", secondary: "#ED174C", accent: "#FFFFFF" },
  "Houston Rockets": { primary: "#CE1141", secondary: "#000000", accent: "#C4CED4" },
  "Chicago Bulls": { primary: "#CE1141", secondary: "#000000", accent: "#FFFFFF" },
} as const;
export type LandingTeam = keyof typeof teamPalettes;
export const LANDING_THEME_DURATION_MS = 1200;
export const INITIAL_PROTAGONIST_ID = "nando";

function mix(first: string, second: string, weight: number): string {
  const rgb = (hex: string) =>
    [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const a = rgb(first),
    b = rgb(second);
  return (
    "#" +
    a
      .map((channel, index) =>
        Math.round(channel * (1 - weight) + b[index] * weight)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function createLandingTheme(palette: {
  primary: string;
  secondary: string;
  accent: string;
}) {
  return {
    "--team-primary": palette.primary,
    "--team-secondary": palette.secondary,
    "--team-accent": palette.accent,
    "--team-background": mix(palette.primary, "#000000", 0.6),
    "--team-background-deep": mix(palette.primary, "#000000", 0.88),
    "--team-surface": mix(palette.primary, "#080C12", 0.78),
    "--team-surface-hover": mix(palette.primary, "#080C12", 0.62),
    "--team-border": mix(palette.primary, "#FFFFFF", 0.42),
    "--team-text": mix(palette.primary, "#FFFFFF", 0.96),
    "--team-text-muted": mix(palette.primary, "#FFFFFF", 0.77),
    "--team-glow": mix(palette.primary, palette.accent, 0.24),
    "--team-shadow": mix(palette.primary, "#000000", 0.93),
    "--team-focus": mix(palette.accent, "#FFFFFF", 0.55),
  };
}
export const landingTeamThemes = Object.fromEntries(
  Object.entries(teamPalettes).map(([team, palette]) => [team, createLandingTheme(palette)]),
) as Record<LandingTeam, ReturnType<typeof createLandingTheme>>;
const neutralTheme = createLandingTheme({
  primary: "#465268",
  secondary: "#151C28",
  accent: "#C4CED4",
});
export function getLandingTheme(team: string) {
  return Object.hasOwn(landingTeamThemes, team)
    ? landingTeamThemes[team as LandingTeam]
    : neutralTheme;
}
