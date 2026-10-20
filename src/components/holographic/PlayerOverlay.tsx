import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { MouseEvent } from "react";
import type { HolographicPlayer } from "../../lib/holographic-player";

export function PlayerOverlay({
  player,
  revealed,
  onOpen,
}: {
  player: HolographicPlayer;
  revealed: boolean;
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <div
      id="athlete-information"
      className="holo-player-info"
      inert={!revealed}
      aria-hidden={!revealed}
    >
      <p className="eyebrow holo-selected-label">
        <span /> A carreira começa aqui
      </p>
      <h2 id="selected-athlete">
        {player.name}
        <span>.</span>
      </h2>
      <div className="holo-identity">
        {player.position && <span>{player.position}</span>}
        {player.archetype && <p>{player.archetype}</p>}
      </div>
      {player.teams && <p className="holo-teams">{player.teams}</p>}
      <Link
        to="/jogadores/$id"
        params={{ id: player.id }}
        onClick={onOpen}
        className="holo-career-cta"
      >
        Abrir carreira <ArrowUpRight size={19} aria-hidden="true" />
      </Link>
    </div>
  );
}
