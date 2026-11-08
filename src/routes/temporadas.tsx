import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { players, seasons } from "../lib/mock-data";
import { SectionHeader } from "../components/sports/SectionHeader";
import { PlayerPortrait } from "../components/home/PlayerPortrait";
import { adaptPlayer } from "../lib/home-data";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central da Liga" }] }),
  component: Temporadas,
});
function AwardName({ name }: { name: string }) {
  const player = players.find((p) => p.name === name);
  return player ? (
    <Link to="/jogadores/$id" params={{ id: String(player.id) }}>
      {name} <ArrowUpRight size={14} />
    </Link>
  ) : (
    <span>{name}</span>
  );
}
function Temporadas() {
  const [index, setIndex] = useState(0);
  const season = seasons[index];
  const mvp = players.find((p) => p.name === season.finalsMvp);
  return (
    <div className="sports-page season-archive">
      <SectionHeader
        eyebrow="O ACERVO / 22 CAPÍTULOS"
        title="O TEMPO. OS TÍTULOS."
        description="Cada temporada deixa uma marca. Percorra os capítulos da nossa liga."
      />
      <div className="season-browser">
        <label className="sports-select">
          Escolher temporada
          <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
            {seasons.map((s, i) => (
              <option key={s.id} value={i}>
                {s.name} · {s.year}
              </option>
            ))}
          </select>
        </label>
        <div className="sports-actions">
          <button
            className="icon-button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            aria-label="Temporada anterior"
          >
            <ArrowLeft />
          </button>
          <span>
            {String(index + 1).padStart(2, "0")} / {seasons.length}
          </span>
          <button
            className="icon-button"
            disabled={index === seasons.length - 1}
            onClick={() => setIndex(index + 1)}
            aria-label="Próxima temporada"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      <section
        className="season-chapter"
        key={season.id}
        aria-label={`Capítulo ${season.id}`}
        aria-live="polite"
      >
        <div className="season-chapter-year">
          <p className="eyebrow">{season.name} / CAMPEÕES</p>
          <strong>
            {season.year.split("-")[0]}
            <span>— {season.year.split("-")[1]}</span>
          </strong>
        </div>
        <div className="season-chapter-story">
          <p className="eyebrow sports-kicker">O TÍTULO TEM DONO</p>
          <h2>{season.champion}</h2>
          <dl>
            <div>
              <dt>MVP da temporada</dt>
              <dd>
                <AwardName name={season.mvp} />
              </dd>
            </div>
            <div>
              <dt>MVP das Finais</dt>
              <dd>
                <AwardName name={season.finalsMvp} />
              </dd>
            </div>
          </dl>
        </div>
        {mvp && (
          <div className="season-chapter-photo">
            <PlayerPortrait player={adaptPlayer(mvp)} priority />
            <span className="eyebrow">{mvp.name} / MVP DAS FINAIS</span>
          </div>
        )}
      </section>
      <div className="sports-section-title archive-title">
        <div>
          <p className="eyebrow">LINHA DO TEMPO COMPLETA</p>
          <h2>22 ANOS DE HISTÓRIA.</h2>
        </div>
        <p>Abra um capítulo para consultar os prêmios.</p>
      </div>
      <div className="season-ledger">
        {seasons.map((s) => (
          <details key={s.id} className={s.id === season.id ? "is-current" : ""}>
            <summary>
              <span className="chapter-number">{String(s.id).padStart(2, "0")}</span>
              <span>{s.year}</span>
              <strong>{s.champion}</strong>
              <span className="chapter-expand" aria-hidden="true">
                +
              </span>
            </summary>
            <dl>
              <div>
                <dt>Temporada</dt>
                <dd>{s.name}</dd>
              </div>
              <div>
                <dt>MVP</dt>
                <dd>
                  <AwardName name={s.mvp} />
                </dd>
              </div>
              <div>
                <dt>MVP das Finais</dt>
                <dd>
                  <AwardName name={s.finalsMvp} />
                </dd>
              </div>
            </dl>
          </details>
        ))}
      </div>
    </div>
  );
}
