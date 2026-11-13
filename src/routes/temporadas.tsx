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
      <div className="season-archive-controls">
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
