import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Season } from "../../lib/mock-data";

export function SeasonTimeline({ seasons }: { seasons: Season[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const season = seasons[activeIndex];
  if (!season) return null;

  const select = (index: number) => {
    setActiveIndex(index);
    const button = rail.current?.querySelector<HTMLButtonElement>(`[data-season-index="${index}"]`);
    // Keep the chosen year visible without moving the document scroll position.
    if (button && rail.current) {
      rail.current.scrollTo({
        left:
          button.offsetLeft -
          rail.current.offsetLeft -
          rail.current.clientWidth / 2 +
          button.clientWidth / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  };

  return (
    <section className="timeline-section section-space" aria-labelledby="timeline-title">
      <div className="site-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-kicker">03 / O TEMPO CONTA</p>
            <h2 id="timeline-title">
              UMA HISTÓRIA
              <br />
              DE <span>TEMPORADAS.</span>
            </h2>
          </div>
          <p className="section-intro">
            Cada temporada, um novo capítulo.
            <br />
            Revisite os anos que construíram a liga.
          </p>
        </div>
        <div className="season-rail" ref={rail} role="group" aria-label="Selecionar temporada">
          {seasons.map((entry, index) => (
            <button
              key={entry.id}
              data-season-index={index}
              onClick={() => select(index)}
              aria-pressed={index === activeIndex}
              aria-controls="season-story"
            >
              <span className="season-dot" />
              {entry.year}
            </button>
          ))}
        </div>
        <div className="season-story" id="season-story" aria-live="polite" aria-atomic="true">
          <div className="season-year" key={`year-${season.id}`}>
            <span className="eyebrow">TEMPORADA {String(season.id).padStart(2, "0")}</span>
            <p>
              {season.year.split("-")[0]}
              <span>— {season.year.split("-")[1]}</span>
            </p>
          </div>
          <div className="season-result" key={season.id}>
            <span className="eyebrow">O TÍTULO TEM DONO</span>
            <h3>{season.champion}</h3>
            <dl>
              <div>
                <dt>MVP da temporada</dt>
                <dd>{season.mvp}</dd>
              </div>
              <div>
                <dt>MVP das Finais</dt>
                <dd>{season.finalsMvp}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="timeline-bottom">
          <Link to="/temporadas" className="text-link">
            Explorar todas as temporadas <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <div className="timeline-controls">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} / {seasons.length}
            </span>
            <button
              className="icon-button"
              onClick={() => select(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Temporada anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              onClick={() => select(activeIndex + 1)}
              disabled={activeIndex === seasons.length - 1}
              aria-label="Próxima temporada"
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
