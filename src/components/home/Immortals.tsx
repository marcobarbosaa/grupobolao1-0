import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { HomePlayer } from "../../lib/home-data";
import { PlayerPortrait } from "./PlayerPortrait";

export function Immortals({ players }: { players: HomePlayer[] }) {
  return (
    <section className="immortals-section section-space" aria-labelledby="immortals-title">
      <div className="site-container immortals-layout">
        <div className="immortals-copy">
          <p className="eyebrow section-kicker">04 / ALÉM DO JOGO</p>
          <span className="hall-wordmark">HALL DA FAMA</span>
          <h2 id="immortals-title">
            OS
            <br />
            <span>IMORTAIS.</span>
          </h2>
          <p>
            O apito final encerra uma partida.
            <br />
            Nunca uma história.
          </p>
          <p className="immortals-description">
            As conquistas, os nomes e as trajetórias que fazem parte da memória do Grupo Bolão.
          </p>
          <Link to="/hall-da-fama" className="editorial-button button-gold">
            Entre no Hall da Fama <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="immortal-portraits">
          {players.map((player) => (
            <Link
              key={player.id}
              to="/jogadores/$id"
              params={{ id: player.id }}
              className="immortal-portrait"
            >
              <PlayerPortrait player={player} sizes="(max-width: 767px) 40vw, 22vw" />
              <div>
                <span className="championship-count">
                  {String(player.rings).padStart(2, "0")}{" "}
                  <small>{player.rings === 1 ? "ANEL" : "ANÉIS"}</small>
                </span>
                <h3>{player.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
