import { publishedSeasons as seasons, latestSeasonId } from "../lib/published-catalog";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SeasonStatistics } from "../components/sports/PublishedStatistics";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central do Bolão" }] }),
  component: SeasonArchive,
});

type SeasonId = string;

function SeasonArchive() {
  const [section, setSection] = useState<"players" | "extras">("players");
  const [seasonId, setSeasonId] = useState<SeasonId>(latestSeasonId);

  return (
    <main>
      <div className="season-archive-controls">
        <nav className="seasonextras-nav" aria-label="Seções de temporadas">
          <button
            type="button"
            aria-pressed={section === "players"}
            onClick={() => setSection("players")}
          >
            Estatísticas dos jogadores
          </button>
          <button
            type="button"
            aria-pressed={section === "extras"}
            onClick={() => setSection("extras")}
          >
            Classificação e playoffs
          </button>
        </nav>
        <div className="seasonextras-toggle" role="group" aria-label="Selecionar temporada">
          {seasons.map((season) => (
            <button
              key={season.id}
              type="button"
              aria-pressed={seasonId === season.id}
              onClick={() => setSeasonId(season.id)}
            >
              {season.title} <span>{season.year}</span>
            </button>
          ))}
        </div>
      </div>
      {section === "players" ? (
        <SeasonStatistics seasonId={seasonId} onSeasonChange={setSeasonId} />
      ) : (
        <SeasonExtras seasonId={seasonId} />
      )}
    </main>
  );
}
