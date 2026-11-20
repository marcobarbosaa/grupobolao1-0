export interface TeamTheme {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const teamPalettes = {
  "Denver Nuggets": {
    background: "#080F21",
    surface: "#142443",
    primary: "#FEC524",
    secondary: "#1D428A",
    accent: "#6FBEFF",
  },
  "New York Knicks": {
    background: "#08172B",
    surface: "#142B4B",
    primary: "#F58426",
    secondary: "#006BB6",
    accent: "#EAF3FF",
  },
  "Houston Rockets": {
    background: "#13080D",
    surface: "#29131B",
    primary: "#CE1141",
    secondary: "#8C233A",
    accent: "#F0BFC9",
  },
  "Miami Heat": {
    background: "#10090B",
    surface: "#261319",
    primary: "#98002E",
    secondary: "#F9A01B",
    accent: "#FF6D44",
  },
  "Phoenix Suns": {
    background: "#140C22",
    surface: "#28183C",
    primary: "#E56020",
    secondary: "#5B2B82",
    accent: "#FFC16B",
  },
  "Sacramento Kings": {
    background: "#100D1C",
    surface: "#241A3A",
    primary: "#7B45C6",
    secondary: "#63727A",
    accent: "#C6A7FF",
  },
  "New Orleans Hornets": {
    background: "#071B22",
    surface: "#12343D",
    primary: "#1D9EAA",
    secondary: "#4B276C",
    accent: "#E5C36A",
  },
  "Indiana Pacers": {
    background: "#071324",
    surface: "#152D49",
    primary: "#FDBB30",
    secondary: "#002D62",
    accent: "#81B9EA",
  },
  "Detroit Pistons": {
    background: "#090F21",
    surface: "#192943",
    primary: "#C8102E",
    secondary: "#1D42BA",
    accent: "#B8C8E3",
  },
  "Dallas Mavericks": {
    background: "#071525",
    surface: "#152C45",
    primary: "#2385D8",
    secondary: "#00538C",
    accent: "#C5D7E5",
  },
  "Atlanta Hawks": {
    background: "#1A0B10",
    surface: "#351821",
    primary: "#E03A3E",
    secondary: "#8F1D31",
    accent: "#F1C66D",
  },
  "Milwaukee Bucks": {
    background: "#071B12",
    surface: "#123B2A",
    primary: "#00471B",
    secondary: "#EEE1C6",
    accent: "#0077C0",
  },
  "Philadelphia 76ers": {
    background: "#081427",
    surface: "#152C4E",
    primary: "#006BB6",
    secondary: "#ED174C",
    accent: "#E7F0FF",
  },
  "Chicago Bulls": {
    background: "#100B0F",
    surface: "#26171E",
    primary: "#CE1141",
    secondary: "#7D172D",
    accent: "#E9BAC4",
  },
  "Toronto Raptors": {
    background: "#0D0D12",
    surface: "#24242D",
    primary: "#CE1141",
    secondary: "#75304D",
    accent: "#C7C9D1",
  },
  "Minnesota Timberwolves": {
    background: "#071520",
    surface: "#142E3D",
    primary: "#78BE20",
    secondary: "#236192",
    accent: "#A5D5E8",
  },
  "San Antonio Spurs": {
    background: "#0B0C10",
    surface: "#22252C",
    primary: "#C4CED4",
    secondary: "#6F7881",
    accent: "#F0F4F7",
  },
} as const satisfies Record<string, TeamTheme>;

export type LandingTeam = keyof typeof teamPalettes;
export const LANDING_THEME_DURATION_MS = 600;
export const INITIAL_PROTAGONIST_ID = "nando";

const teamAliases: Record<string, LandingTeam> = {
  den: "Denver Nuggets",
  mia: "Miami Heat",
  hou: "Houston Rockets",
  nyk: "New York Knicks",
  ny: "New York Knicks",
  phx: "Phoenix Suns",
  sac: "Sacramento Kings",
  noh: "New Orleans Hornets",
  no: "New Orleans Hornets",
  hornets: "New Orleans Hornets",
  "new-orleans-hornets-historico": "New Orleans Hornets",
  ind: "Indiana Pacers",
  det: "Detroit Pistons",
  dal: "Dallas Mavericks",
  atl: "Atlanta Hawks",
  phi: "Philadelphia 76ers",
  chi: "Chicago Bulls",
  tor: "Toronto Raptors",
  min: "Minnesota Timberwolves",
  sas: "San Antonio Spurs",
  sa: "San Antonio Spurs",
};

export function normalizeTeamId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const teamsById = Object.fromEntries(
  Object.keys(teamPalettes).map((team) => [normalizeTeamId(team), team]),
) as Record<string, LandingTeam>;

export function resolveTeamName(teamId: string): LandingTeam | undefined {
  const normalized = normalizeTeamId(teamId);
  return teamsById[normalized] ?? teamAliases[normalized];
}

const fallbackPalette: TeamTheme = {
  background: "#0B1018",
  surface: "#171E27",
  primary: "#64748B",
  secondary: "#334155",
  accent: "#E2E8F0",
};

export function getTeamTheme(teamId: string): TeamTheme {
  const team = resolveTeamName(teamId);
  return team ? teamPalettes[team] : fallbackPalette;
}

function mix(first: string, second: string, weight: number): string {
  const rgb = (hex: string) =>
    [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const a = rgb(first);
  const b = rgb(second);
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

function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function readableColor(backgrounds: readonly string[], preferred: string) {
  return backgrounds.every((background) => contrast(preferred, background) >= 4.5)
    ? preferred
    : backgrounds.every((background) => contrast("#FFFFFF", background) >= 4.5)
      ? "#FFFFFF"
      : backgrounds.every((background) => contrast("#000000", background) >= 4.5)
        ? "#000000"
        : "#101418";
}

export function createLandingTheme(palette: TeamTheme) {
  const backgroundDeep = mix(palette.background, "#000000", 0.32);
  const surfaceHover = mix(palette.surface, palette.background, 0.32);
  const text = readableColor(
    [palette.background, backgroundDeep, palette.surface, surfaceHover],
    "#FFFFFF",
  );
  const focus = readableColor(
    [palette.background, backgroundDeep, palette.surface, surfaceHover],
    palette.accent,
  );
  return {
    "--team-primary": palette.primary,
    "--team-secondary": palette.secondary,
    "--team-accent": palette.accent,
    "--team-background": palette.background,
    "--team-background-deep": backgroundDeep,
    "--team-surface": palette.surface,
    "--team-surface-hover": surfaceHover,
    "--team-border": mix(palette.secondary, "#FFFFFF", 0.32),
    "--team-text": text,
    "--team-text-muted": mix(text, palette.background, 0.28),
    "--team-text-on-primary": readableColor([palette.primary], "#101418"),
    "--team-glow": mix(palette.primary, palette.accent, 0.42),
    "--team-shadow": mix(palette.background, "#000000", 0.55),
    "--team-focus": focus,
  };
}

export const landingTeamThemes = Object.fromEntries(
  Object.entries(teamPalettes).map(([team, palette]) => [team, createLandingTheme(palette)]),
) as Record<LandingTeam, ReturnType<typeof createLandingTheme>>;

const fallbackTheme = createLandingTheme(fallbackPalette);

export function getLandingTheme(team: string) {
  const name = resolveTeamName(team);
  return name ? landingTeamThemes[name] : fallbackTheme;
}
