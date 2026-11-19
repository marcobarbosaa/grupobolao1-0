import { CalendarDays, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import reconstructionData from "../../data/liga-viva/reconstructions/season-002-seed-pilot.json";
import { buildSyntheticRounds, filterSyntheticRoundGames } from "../../lib/liga-viva/presentation";
import type { Reconstruction } from "../../lib/liga-viva/types";
import { LeagueTeamBadge, teamNames } from "./SeasonExtras";
import "./SyntheticSeason.css";

const reconstruction = reconstructionData as unknown as Reconstruction;
const rounds = buildSyntheticRounds(reconstruction);
const calendarDays = Array.from({ length: reconstruction.rules.calendar.days }, (_, dayIndex) => {
  const date = new Date(
    new Date(`${reconstruction.rules.calendar.startDate}T00:00:00.000Z`).getTime() +
      dayIndex * 86_400_000,
  );
  return {
    dayIndex,
    date,
    isoDate: date.toISOString().slice(0, 10),
    gameCount: reconstruction.games.filter((game) => game.dayIndex === dayIndex).length,
  };
});
const teamOptions = reconstruction.standings
  .map((team) => team.teamId)
  .sort((first, second) => (teamNames[first] ?? first).localeCompare(teamNames[second] ?? second));
const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(typeof value === "string" ? new Date(`${value}T12:00:00.000Z`) : value);
const formatWeekday = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    date,
  );

export default function SyntheticSeason({
  round,
  dayIndex,
  team,
  onRoundChange,
  onDayChange,
  onTeamChange,
}: {
  round: number;
  dayIndex?: number;
  team?: string;
  onRoundChange: (round: number) => void;
  onDayChange: (dayIndex: number) => void;
  onTeamChange: (team?: string) => void;
}) {
  const activeRoundNumber =
    dayIndex === undefined
      ? Math.max(1, Math.min(rounds.length, Math.trunc(round) || 1))
      : Math.floor(dayIndex / 2) + 1;
  const activeRound = rounds[activeRoundNumber - 1];
  const activeDayIndex = Math.max(
    0,
    Math.min(calendarDays.length - 1, dayIndex ?? activeRound.startDayIndex),
  );
  const activeDay = calendarDays[activeDayIndex];
  const visibleDayStart = Math.min(
    Math.max(0, activeDayIndex - 3),
    Math.max(0, calendarDays.length - 7),
  );
  const visibleDays = calendarDays.slice(visibleDayStart, visibleDayStart + 7);
  const selectedTeam = teamOptions.includes(team ?? "") ? team : undefined;
  const visibleGames = filterSyntheticRoundGames(
    { ...activeRound, games: activeRound.games.filter((game) => game.dayIndex === activeDayIndex) },
    selectedTeam,
  );
  const [scoresHidden, setScoresHidden] = useState(false);

  return (
    <section className="synthetic-season" aria-label="Rodadas da temporada reconstruída">
      <header className="synthetic-calendar-bar">
        <div className="synthetic-calendar-month">
          <button
            type="button"
            className="synthetic-calendar-arrow"
            aria-label="Dia anterior"
            title="Dia anterior"
            disabled={activeDayIndex === 0}
            onClick={() => onDayChange(activeDayIndex - 1)}
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <div className="synthetic-calendar-month-label">
            <CalendarDays size={17} aria-hidden="true" />
            <span>{formatMonth(activeDay.date)}</span>
          </div>
          <button
            type="button"
            className="synthetic-calendar-arrow"
            aria-label="Próximo dia"
            title="Próximo dia"
            disabled={activeDayIndex === calendarDays.length - 1}
            onClick={() => onDayChange(activeDayIndex + 1)}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>

        <nav className="synthetic-day-strip" aria-label="Calendário de jogos">
          {visibleDays.map((day) => (
            <button
              key={day.dayIndex}
              type="button"
              className={
                day.dayIndex === activeDayIndex
                  ? "synthetic-day-button is-selected"
                  : "synthetic-day-button"
              }
              aria-pressed={day.dayIndex === activeDayIndex}
              aria-label={`${formatWeekday(day.date)}, ${formatDate(day.date)}, ${day.gameCount} jogos`}
              onClick={() => onDayChange(day.dayIndex)}
            >
              <span>{formatWeekday(day.date)}</span>
              <strong>{day.date.getUTCDate()}</strong>
              <small>{day.gameCount ? `${day.gameCount} jogos` : "—"}</small>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={scoresHidden ? "synthetic-score-toggle is-on" : "synthetic-score-toggle"}
          aria-pressed={scoresHidden}
          onClick={() => setScoresHidden((hidden) => !hidden)}
        >
          {scoresHidden ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
          <span>{scoresHidden ? "Mostrar placares" : "Esconder placares"}</span>
          <span className="synthetic-switch" aria-hidden="true">
            <span />
          </span>
        </button>
      </header>

      <div className="synthetic-round-tools">
        <label className="synthetic-round-select">
          <span>Rodada</span>
          <select
            value={activeRoundNumber}
            onChange={(event) => onRoundChange(Number(event.target.value))}
            aria-label="Selecionar rodada"
          >
            {rounds.map((option) => (
              <option key={option.number} value={option.number}>
                {String(option.number).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span>de {rounds.length}</span>
        </label>
        <label className="synthetic-team-filter">
          <span>Equipe</span>
          <select
            value={selectedTeam ?? "all"}
            onChange={(event) =>
              onTeamChange(event.target.value === "all" ? undefined : event.target.value)
            }
            aria-label="Filtrar partidas por equipe"
          >
            <option value="all">Todas as equipes</option>
            {teamOptions.map((teamId) => (
              <option key={teamId} value={teamId}>
                {teamNames[teamId] ?? teamId}
              </option>
            ))}
          </select>
        </label>
        <p className="synthetic-day-summary" aria-live="polite">
          {formatDate(activeDay.date)} · {visibleGames.length}{" "}
          {visibleGames.length === 1 ? "jogo" : "jogos"}
        </p>
      </div>

      {visibleGames.length ? (
        <div
          className="synthetic-game-list"
          aria-label={`Partidas de ${formatDate(activeDay.date)}`}
        >
          {visibleGames.map((game) => {
            const homeWon = game.winner === game.homeTeam;
            return (
              <article
                className="synthetic-game-card"
                key={game.id}
                aria-label={`${teamNames[game.homeTeam] ?? game.homeTeam} ${game.homeScore}, ${teamNames[game.awayTeam] ?? game.awayTeam} ${game.awayScore}; vencedor ${teamNames[game.winner] ?? game.winner}`}
              >
                <section className="synthetic-card-scores" aria-label="Game Scores">
                  <div className="synthetic-card-heading">
                    <h3>GAME SCORES</h3>
                    <span>PLACAR SINTÉTICO</span>
                  </div>
                  <div className="synthetic-scoreboard">
                    <div className="synthetic-score-team is-away">
                      <LeagueTeamBadge
                        code={game.awayTeam}
                        seasonId={reconstruction.seasonId}
                        showPlayerMarks
                        showCode={false}
                        venueLabel="Visitante"
                      />
                      <strong
                        className={
                          scoresHidden
                            ? "synthetic-game-score is-hidden"
                            : !homeWon
                              ? "synthetic-game-score is-winner"
                              : "synthetic-game-score"
                        }
                      >
                        {scoresHidden ? "•••" : game.awayScore}
                      </strong>
                    </div>
                    <span className="synthetic-game-final">Final</span>
                    <div className="synthetic-score-team is-home">
                      <strong
                        className={
                          scoresHidden
                            ? "synthetic-game-score is-hidden"
                            : homeWon
                              ? "synthetic-game-score is-winner"
                              : "synthetic-game-score"
                        }
                      >
                        {scoresHidden ? "•••" : game.homeScore}
                      </strong>
                      <LeagueTeamBadge
                        code={game.homeTeam}
                        seasonId={reconstruction.seasonId}
                        showPlayerMarks
                        showCode={false}
                        venueLabel="Mandante"
                      />
                    </div>
                  </div>
                </section>
                <section className="synthetic-card-leaders" aria-label="Game Leaders">
                  <div className="synthetic-card-heading">
                    <h3>GAME LEADERS</h3>
                    <span>EM BREVE</span>
                  </div>
                  <div className="synthetic-future-content">
                    <span className="synthetic-future-icon">+</span>
                    <p>Líderes de pontos, rebotes e assistências serão adicionados aqui.</p>
                  </div>
                </section>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="synthetic-empty-state">Não há partidas para esta data e equipe.</p>
      )}
    </section>
  );
}
