import { useState } from "react";
import type { PlayerPresentation } from "../../lib/player-types";
import { ProfileHero } from "./ProfileHero";
import { PlayerBiography } from "./PlayerBiography";
import { PlayerAchievements } from "./PlayerAchievements";
import { CareerTimeline } from "./CareerTimeline";
import { PlayerStatistics } from "./PlayerStatistics";
import { PlayerDiscovery } from "./PlayerDiscovery";

export function PlayerProfile({
  player,
  next,
}: {
  player: PlayerPresentation;
  next?: PlayerPresentation;
}) {
  const [selectedId, setSelectedId] = useState(player.career[0]?.id ?? 1);
  return (
    <div className="players-page player-profile">
      <ProfileHero player={player} />
      <PlayerBiography player={player} />
      <PlayerAchievements awards={player.awards} onSelectSeason={setSelectedId} />
      <CareerTimeline seasons={player.career} selectedId={selectedId} onSelect={setSelectedId} />
      <PlayerStatistics seasons={player.career} selectedId={selectedId} onSelect={setSelectedId} />
      <PlayerDiscovery next={next} />
    </div>
  );
}
