import { players, seasons, type Player, type Season } from "./mock-data";

export interface HomePlayer {
  id: string;
  name: string;
  teams: string;
  position: string;
  portrait?: string;
  portraitSet?: string;
  originalPortrait?: string;
  focalPoint: string;
  tone: "portland" | "minnesota" | "orlando" | "neutral";
  rings: number;
  seasons: number;
}

// Art direction only. All sporting information comes from the existing records.
const presentation: Record<number, Pick<HomePlayer, "tone" | "focalPoint">> = {
  8: { tone: "portland", focalPoint: "53% 28%" },
  4: { tone: "minnesota", focalPoint: "54% 24%" },
  7: { tone: "orlando", focalPoint: "50% 20%" },
};
const featuredIds = [8, 4, 7];

export function adaptPlayer(player: Player): HomePlayer {
  const imageStem = player.imageUrl
    ?.split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "");
  return {
    id: String(player.id),
    name: player.name,
    teams: player.teams.join(" · "),
    position: player.archetype.split(" ")[0].replaceAll("-", " / "),
    portrait: imageStem ? `/jogadores/optimized/${imageStem}-960.webp` : undefined,
    portraitSet: imageStem
      ? `/jogadores/optimized/${imageStem}-480.webp 480w, /jogadores/optimized/${imageStem}-960.webp 960w`
      : undefined,
    originalPortrait: player.imageUrl,
    focalPoint: presentation[player.id]?.focalPoint ?? "50% 25%",
    tone: presentation[player.id]?.tone ?? "neutral",
    rings: player.rings,
    seasons: player.seasons,
  };
}

export function createHomeData(playerRecords: Player[], seasonRecords: Season[]) {
  const roster = playerRecords.map(adaptPlayer);
  const featured = featuredIds.flatMap((id) => {
    const player = roster.find((entry) => entry.id === String(id));
    return player ? [player] : [];
  });
  return {
    roster,
    featured: featured.length ? featured : roster.slice(0, 3),
    // Chronological order, without modifying the historical source or calculating new rankings.
    timeline: [...seasonRecords].sort((a, b) => a.id - b.id),
  };
}

export const homeData = createHomeData(players, seasons);
