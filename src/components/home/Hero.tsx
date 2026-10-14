import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { HomePlayer } from "../../lib/home-data";
import { PlayerPortrait } from "./PlayerPortrait";

export function Hero({
  players,
  playerCount,
  seasonCount,
}: {
  players: HomePlayer[];
  playerCount: number;
  seasonCount: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = players[activeIndex];
  if (!active) return null;

  return (
    <section className={`home-hero tone-${active.tone}`} aria-labelledby="hero-title">
      <div className="hero-arena-lines" aria-hidden="true" />
      <div className="hero-layout site-container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="signal-line" /> NOSSA QUADRA. NOSSO LEGADO.
          </p>
          <h1 id="hero-title">
            A LIGA É <br />
            NOSSA.
            <br />
            <span>A HISTÓRIA</span>
            <br />
            <span>TAMBÉM.</span>
          </h1>
          <p className="hero-description">
            Lendas são construídas. Recordes são quebrados. Histórias permanecem.
          </p>
          <Link className="editorial-button" to="/biografias">
            Conheça os jogadores <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-stage">
          <span className="stage-caption eyebrow">OS NOMES POR TRÁS DA HISTÓRIA</span>
          <div className="hero-portraits">
            {players.map((player, index) => {
              const offset = (index - activeIndex + players.length) % players.length;
              const slot = offset === 0 ? "center" : offset === 1 ? "right" : "left";
              return (
                <div
                  key={player.id}
                  className={`hero-portrait portrait-${slot}`}
                  aria-hidden={index !== activeIndex}
                >
                  <PlayerPortrait
                    player={player}
                    priority={index === 0}
                    decorative
                    sizes="(max-width: 767px) 90vw, 42vw"
                  />
                  <span className="portrait-side-label">{player.name}</span>
                </div>
              );
            })}
          </div>
          <div className="hero-player" id="hero-player" aria-live="polite" aria-atomic="true">
            <div key={active.id} className="player-introduction">
              <span className="eyebrow">
                EM DESTAQUE <span>/</span> {active.position}
              </span>
              <h2>{active.name}</h2>
              <p>{active.teams}</p>
              <Link to="/jogadores/$id" params={{ id: active.id }} className="text-link">
                Conheça a história de {active.name} <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="hero-selector" role="group" aria-label="Escolher protagonista">
            {players.map((player, index) => (
              <button
                key={player.id}
                type="button"
                aria-pressed={index === activeIndex}
                aria-controls="hero-player"
                onClick={() => setActiveIndex(index)}
              >
                <span>0{index + 1}</span>
                {player.name}
                <span className="selector-line" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-bottom site-container">
        <a href="#lendas" className="explore-cue">
          <ArrowDown size={16} aria-hidden="true" /> CONTINUE EXPLORANDO
        </a>
        <p>
          <b>{String(playerCount).padStart(2, "0")}</b> JOGADORES <span>/</span>{" "}
          <b>{String(seasonCount).padStart(2, "0")}</b> TEMPORADAS <span>/</span> UM LEGADO
        </p>
        <span className="hero-index">01 — 05</span>
      </div>
    </section>
  );
}
