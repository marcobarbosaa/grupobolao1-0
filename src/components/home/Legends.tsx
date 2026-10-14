import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import type { HomePlayer } from "../../lib/home-data";
import { PlayerPortrait } from "./PlayerPortrait";

export function Legends({ players }: { players: HomePlayer[] }) {
  const gallery = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    const element = gallery.current;
    if (element)
      element.scrollBy({
        left: direction * element.clientWidth * 0.75,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <section className="legends-section section-space" id="lendas" aria-labelledby="legends-title">
      <div className="section-heading site-container">
        <div>
          <p className="eyebrow section-kicker">02 / QUEM FAZ O JOGO</p>
          <h2 id="legends-title">
            CONHEÇA AS <span>LENDAS.</span>
          </h2>
        </div>
        <div className="section-heading-aside">
          <p>
            Personalidades diferentes.
            <br />A mesma vontade de fazer história.
          </p>
          <Link to="/biografias" className="text-link">
            Todos os jogadores <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="legends-gallery" ref={gallery} aria-label="Galeria de jogadores">
        {players.map((player, index) => (
          <Link
            key={player.id}
            to="/jogadores/$id"
            params={{ id: player.id }}
            className={`legend-photo legend-photo-${index % 3}`}
          >
            <PlayerPortrait player={player} />
            <span className="legend-position eyebrow">{player.position}</span>
            <div className="legend-caption">
              <span className="eyebrow">{String(index + 1).padStart(2, "0")} / GRUPO BOLÃO</span>
              <h3>{player.name}</h3>
              <span className="legend-profile">
                Explorar trajetória <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="gallery-bottom site-container">
        <span>TRAJETÓRIAS QUE MERECEM SER CONTADAS.</span>
        <div>
          <button
            className="icon-button"
            onClick={() => scroll(-1)}
            aria-label="Ver jogadores anteriores"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            onClick={() => scroll(1)}
            aria-label="Ver próximos jogadores"
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
