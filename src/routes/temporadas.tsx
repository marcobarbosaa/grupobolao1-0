import { publishedSeasons as seasons, latestSeasonId } from "../lib/published-catalog";
import { createFileRoute } from "@tanstack/react-router";
import { SeasonExtras } from "../components/sports/SeasonExtras";
import "../components/sports/SeasonExtras.css";

type LeagueView = "standings" | "playoffs" | "rounds";
type Conference = "west" | "east";
type LeagueSearch = {
  season?: string;
  view?: LeagueView;
  conference?: Conference;
  round?: number;
  day?: number;
  team?: string;
};

export const Route = createFileRoute("/temporadas")({
  validateSearch: (search: Record<string, unknown>): LeagueSearch => {
    const season =
      typeof search.season === "string" && seasons.some((option) => option.id === search.season)
        ? search.season
        : undefined;
    const requestedView =
      search.view === "playoffs" || search.view === "rounds" || search.view === "standings"
        ? search.view
        : search.view === "reconstruction"
          ? "rounds"
          : undefined;
    return {
      season,
      view: requestedView === "rounds" && season !== "season-002" ? undefined : requestedView,
      conference:
        search.conference === "east" || search.conference === "west"
          ? search.conference
          : undefined,
      round:
        Number.isSafeInteger(Number(search.round)) && Number(search.round) >= 1
          ? Number(search.round)
          : undefined,
      day:
        Number.isSafeInteger(Number(search.day)) &&
        Number(search.day) >= 0 &&
        Number(search.day) < 170
          ? Number(search.day)
          : undefined,
      team:
        typeof search.team === "string" && /^[A-Z]{2,3}$/.test(search.team)
          ? search.team
          : undefined,
    };
  },
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
          <h1>{view === "rounds" ? "Rodadas" : "Classificações e Playoffs"}</h1>
        </div>
        <span>
          {season.title} · {season.year}
        </span>
      </header>
      <SeasonExtras
        seasonId={seasonId}
        view={view}
        conference={conference}
        round={search.round ?? 1}
        dayIndex={search.day}
        onRoundChange={(round) => updateSearch({ round, day: undefined })}
        onDayChange={(day) => updateSearch({ day, round: Math.floor(day / 2) + 1 })}
        onSeasonChange={(season) =>
          updateSearch({
            season,
            view: "standings",
            round: undefined,
            day: undefined,
            team: undefined,
          })
        }
        onViewChange={(nextView) => updateSearch({ view: nextView })}
        onConferenceChange={(nextConference) => updateSearch({ conference: nextConference })}
        team={search.team}
        onTeamChange={(team) => updateSearch({ team })}
      />
    </main>
  );
}
