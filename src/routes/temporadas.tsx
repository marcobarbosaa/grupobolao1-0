import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SeasonStatistics } from "../components/sports/PublishedStatistics";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central do Bolão" }] }),
  component: SeasonArchive,
});

const seasons = [
  { id: "season-001", label: "Temporada 01", year: "2005/06" },
  { id: "season-002", label: "Temporada 02", year: "2006/07" },
  { id: "season-003", label: "Temporada 03", year: "2007/08" },
] as const;

type SeasonId = (typeof seasons)[number]["id"];

function SeasonArchive() {
  const [section, setSection] = useState<"players" | "extras">("players");
  const [seasonId, setSeasonId] = useState<SeasonId>("season-003");

  return (
    <main>
      <div className="season-archive-controls">
        <nav className="seasonextras-nav" aria-label="Seções de temporadas">
          <button type="button" aria-pressed={section === "players"} onClick={() => setSection("players")}>Estatísticas dos jogadores</button>
          <button type="button" aria-pressed={section === "extras"} onClick={() => setSection("extras")}>Classificação e playoffs</button>
        </nav>
        <div className="seasonextras-toggle" role="group" aria-label="Selecionar temporada">
          {seasons.map(season => (
            <button key={season.id} type="button" aria-pressed={seasonId === season.id} onClick={() => setSeasonId(season.id)}>
              {season.label} <span>{season.year}</span>
            </button>
          ))}
        </div>
      </div>
      {section === "players"
        ? <SeasonStatistics seasonId={seasonId} onSeasonChange={setSeasonId}/>
        : <SeasonExtras seasonId={seasonId}/>}
    </main>
  );
}
