import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { players, type Player } from "../../lib/mock-data";
import { adaptPlayer } from "../../lib/home-data";
import { PlayerPortrait } from "../home/PlayerPortrait";
function Contender({
  player,
  other,
  label,
  onChange,
}: {
  player: Player;
  other: Player;
  label: string;
  onChange: (player: Player) => void;
}) {
  return (
    <div className="vs-contender">
      <div className="vs-photo">
        <PlayerPortrait key={player.id} player={adaptPlayer(player)} priority />
        <span className="eyebrow">{label}</span>
      </div>
      <div className="vs-copy">
        <label className="sports-select">
          {label}
          <select
            aria-label={label}
            value={player.id}
            onChange={(e) => onChange(players.find((p) => p.id === Number(e.target.value))!)}
          >
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === other.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Link to="/jogadores/$id" params={{ id: String(player.id) }}>
          <h2>{player.name}</h2>
          <ArrowUpRight size={18} />
        </Link>
        <p>{player.archetype}</p>
        <dl>
          <div>
            <dt>Legado</dt>
            <dd>{player.scoreTotal.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Títulos</dt>
            <dd>{player.rings}</dd>
          </div>
          <div>
            <dt>PTS / jogo</dt>
            <dd>{player.pts}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
export function VersusPanel({
  left,
  right,
  onLeft,
  onRight,
  onSwap,
}: {
  left: Player;
  right: Player;
  onLeft: (p: Player) => void;
  onRight: (p: Player) => void;
  onSwap: () => void;
}) {
  return (
    <section className="versus-arena" aria-label="Confronto estatístico">
      <Contender player={left} other={right} label="Jogador A" onChange={onLeft} />
      <div className="vs-center">
        <strong>VS</strong>
        <button onClick={onSwap} aria-label="Inverter lados">
          <ArrowLeftRight size={20} />
          <span>INVERTER</span>
        </button>
      </div>
      <Contender player={right} other={left} label="Jogador B" onChange={onRight} />
    </section>
  );
}
