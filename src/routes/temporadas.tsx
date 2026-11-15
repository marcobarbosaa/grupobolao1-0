import { publishedSeasons as seasons, latestSeasonId } from "../lib/published-catalog";
import { createFileRoute } from "@tanstack/react-router";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

type LeagueView = "standings" | "playoffs";
type Conference = "west" | "east";
type LeagueSearch = { season?: string; view?: LeagueView; conference?: Conference };

export const Route = createFileRoute("/temporadas")({
  validateSearch: (search: Record<string, unknown>): LeagueSearch => ({
    season:
      typeof search.season === "string" && seasons.some((season) => season.id === search.season)
        ? search.season
        : undefined,
    view:
      search.view === "playoffs" || search.view === "standings" ? search.view : undefined,
    conference: search.conference === "east" || search.conference === "west"
      ? search.conference
      : undefined,
  }),
  head: () => ({ meta: [{ title: "Liga — Central do Bolão" }] }),
  component: LeagueArchive,
});

function LeagueArchive() {
  const search = Route.useSearch();
  const seasonId = search.season ?? latestSeasonId;
  const view = search.view ?? "standings";
  const conference = search.conference ?? "west";
  const navigate = Route.useNavigate();
  const season = seasons.find((option) => option.id === seasonId)!;
  const updateSearch = (next: Partial<LeagueSearch>) => {
    void navigate({ search: (previous) => ({ ...previous, ...next }) });
  };

  return (
    <main className="league-page">
      <header className="league-section-heading">
        <div>
          <p>LIGA</p>
          <h1>Classificações e Playoffs</h1>
        </div>
        <span>{season.title} · {season.year}</span>
      </header>
      <SeasonExtras
        seasonId={seasonId}
        view={view}
        conference={conference}
        onSeasonChange={(season) => updateSearch({ season })}
        onViewChange={(nextView) => updateSearch({ view: nextView })}
        onConferenceChange={(nextConference) => updateSearch({ conference: nextConference })}
      />
    </main>
  );
}
