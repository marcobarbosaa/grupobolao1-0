import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SeasonStatistics } from "../components/sports/PublishedStatistics";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central do Bolão" }] }),
  component: SeasonArchive,
});

function SeasonArchive() {
  const [section, setSection] = useState<"players" | "extras">("players");
  return (
    <main>
      <nav className="seasonextras-nav" aria-label="Seções de temporadas" style={{ maxWidth: 1480, margin: "28px auto 0", padding: "0 20px" }}>
        <button type="button" aria-pressed={section === "players"} onClick={() => setSection("players")}>Estatísticas dos jogadores</button>
        <button type="button" aria-pressed={section === "extras"} onClick={() => setSection("extras")}>Classificação e playoffs</button>
      </nav>
      {section === "players" ? <SeasonStatistics /> : <SeasonExtras />}
    </main>
  );
}
