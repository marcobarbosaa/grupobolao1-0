import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { HolographicPlayer } from "../../lib/holographic-player";

export function PlayerOverlay({ player }: { player: HolographicPlayer }) {
  return (
    <div className="holo-player-info">
      <p className="eyebrow holo-selected-label">
        <span /> Atleta selecionado
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
      <p className="holo-invitation">
        O atleta em cena.
        <br />A história vai além.
      </p>
      <Link
        to="/jogadores/$id"
        params={{ id: player.id }}
        className="editorial-button holo-career-cta"
      >
        Abrir carreira <ArrowUpRight size={19} aria-hidden="true" />
      </Link>
      <p className="holo-profile-caption">Trajetória, conquistas e identidade.</p>
    </div>
  );
}
