import { publishedSeasons as seasons, latestSeasonId } from "../lib/published-catalog";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Liga — Central do Bolão" }] }),
  component: LeagueArchive,
});

function LeagueArchive() {
  const [seasonId, setSeasonId] = useState(latestSeasonId);
  return (
    <main className="league-page">
      <header className="league-hero">
        <div className="league-hero-copy">
          <p className="league-eyebrow">CENTRAL DO BOLÃO / LIGA</p>
          <h1>A CORRIDA <span>PELO TÍTULO.</span></h1>
          <p>As campanhas, os confrontos e os protagonistas de cada temporada.</p>
        </div>
        <div className="league-hero-mark" aria-hidden="true">LIGA</div>
      </header>
      <div className="season-archive-controls">
        <div className="league-season-label">
          <span>ARQUIVO DE TEMPORADAS</span>
          <strong>Selecione o campeonato</strong>
        </div>
        <div className="seasonextras-toggle" role="group" aria-label="Selecionar temporada">
          {seasons.map((season) => (
            <button key={season.id} type="button"
              aria-pressed={seasonId === season.id}
              onClick={() => setSeasonId(season.id)}>
              {season.title} <span>{season.year}</span>
            </button>
          ))}
        </div>
      </div>
      <SeasonExtras seasonId={seasonId} />
    </main>
  );
}
