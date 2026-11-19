import { ChevronLeft, ChevronRight } from "lucide-react";
import reconstructionData from "../../data/liga-viva/reconstructions/season-002-seed-pilot.json";
import {
  buildSyntheticRounds,
  calculateStandingsThroughRound,
  filterSyntheticRoundGames,
} from "../../lib/liga-viva/presentation";
import type { Reconstruction } from "../../lib/liga-viva/types";
import { LeagueTeamBadge, PlayerMarks, teamNames } from "./SeasonExtras";
import "./SyntheticSeason.css";

const reconstruction = reconstructionData as unknown as Reconstruction;
const rounds = buildSyntheticRounds(reconstruction);
const teamOptions = reconstruction.standings
  .map((team) => team.teamId)
  .sort((first, second) => (teamNames[first] ?? first).localeCompare(teamNames[second] ?? second));
const formatInteger = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));

export default function SyntheticSeason({
  round,
  team,
  onRoundChange,
  onTeamChange,
}: {
  round: number;
  team?: string;
  onRoundChange: (round: number) => void;
  onTeamChange: (team?: string) => void;
}) {
  const activeRoundNumber = Math.max(1, Math.min(rounds.length, Math.trunc(round) || 1));
  const activeRound = rounds[activeRoundNumber - 1];
  const selectedTeam = teamOptions.includes(team ?? "") ? team : undefined;
  const visibleGames = filterSyntheticRoundGames(activeRound, selectedTeam);
  const progress = calculateStandingsThroughRound(
    reconstruction.standings,
    rounds,
    activeRoundNumber,
  );
  const roundDates = [activeRound.games[0].date, activeRound.games.at(-1)!.date];
  const dateLabel =
    roundDates[0] === roundDates[1]
      ? formatDate(roundDates[0])
      : `${formatDate(roundDates[0])}–${formatDate(roundDates[1])}`;

  return (
    <section className="synthetic-season" aria-label="Liga Viva: temporada reconstruída">
      <header className="synthetic-season-header">
        <div>
          <h2>Temporada regular</h2>
        </div>
        <span className="synthetic-season-total">1.230 partidas · 2006–07</span>
      </header>

      <div className="synthetic-round-controls">
        <div className="synthetic-round-navigation" aria-label="Navegação por rodadas">
          <button
            type="button"
            className="synthetic-icon-button"
            aria-label="Rodada anterior"
            title="Rodada anterior"
            disabled={activeRoundNumber === 1}
            onClick={() => onRoundChange(activeRoundNumber - 1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
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
          <button
            type="button"
            className="synthetic-icon-button"
            aria-label="Próxima rodada"
            title="Próxima rodada"
            disabled={activeRoundNumber === rounds.length}
            onClick={() => onRoundChange(activeRoundNumber + 1)}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

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
      </div>

      <div className="synthetic-round-summary" aria-live="polite">
        <strong>Rodada {String(activeRoundNumber).padStart(2, "0")}</strong>
        <span>{dateLabel}</span>
        <span>
          {visibleGames.length} de {activeRound.games.length} jogos
        </span>
      </div>
      {visibleGames.length ? (
        <div className="synthetic-game-list" aria-label={`Partidas da rodada ${activeRoundNumber}`}>
          {visibleGames.map((game) => {
            const homeWon = game.winner === game.homeTeam;
            return (
              <article
                className="synthetic-game-row"
                key={game.id}
                aria-label={`${teamNames[game.homeTeam] ?? game.homeTeam} ${game.homeScore}, ${teamNames[game.awayTeam] ?? game.awayTeam} ${game.awayScore}; vencedor ${teamNames[game.winner] ?? game.winner}`}
              >
                <time dateTime={game.date}>{formatDate(game.date)}</time>
                <LeagueTeamBadge code={game.homeTeam} seasonId={reconstruction.seasonId} showPlayerMarks />
                <strong
                  className={homeWon ? "synthetic-game-score is-winner" : "synthetic-game-score"}
                >
                  {game.homeScore}
                </strong>
                <span className="synthetic-score-separator" aria-hidden="true">
                  –
                </span>
                <strong
                  className={!homeWon ? "synthetic-game-score is-winner" : "synthetic-game-score"}
                >
                  {game.awayScore}
                </strong>
                <LeagueTeamBadge code={game.awayTeam} seasonId={reconstruction.seasonId} showPlayerMarks />
                <span className="synthetic-result-label">{homeWon ? "Mandante" : "Visitante"}</span>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="synthetic-empty-state">Esta equipe não joga nesta rodada.</p>
      )}

      <section
        className="synthetic-standings"
        aria-label={`Classificação acumulada após a rodada ${activeRoundNumber}`}
      >
        <header className="synthetic-standings-header">
          <div>
            <p className="seasonextras-kicker">
              APÓS A RODADA {String(activeRoundNumber).padStart(2, "0")}
            </p>
            <h3>Classificação acumulada</h3>
          </div>
        </header>
        {(
          [
            { id: "east", label: "Conferência Leste" },
            { id: "west", label: "Conferência Oeste" },
          ] as const
        ).map((conference) => (
          <section
            className={`synthetic-conference synthetic-conference-${conference.id}`}
            key={conference.id}
            aria-label={conference.label}
          >
            <h4>{conference.label}</h4>
            <div
              className="synthetic-standings-scroll"
              role="region"
              tabIndex={0}
              aria-label={`${conference.label}; tabela rolável`}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Equipe</th>
                    <th scope="col">J</th>
                    <th scope="col">V</th>
                    <th scope="col">D</th>
                    <th scope="col">%</th>
                    <th scope="col">PF</th>
                    <th scope="col">PA</th>
                    <th scope="col">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {progress
                    .filter((standing) => standing.conference === conference.id)
                    .map((standing, index) => (
                      <tr
                        key={standing.teamId}
                        className={standing.teamId === selectedTeam ? "is-filtered-team" : ""}
                      >
                        <td className="synthetic-standing-rank">{index + 1}º</td>
                        <th scope="row">
                          <div className="synthetic-standing-team">
                            <LeagueTeamBadge
                              code={standing.teamId}
                              seasonId={reconstruction.seasonId}
                            />
                            <PlayerMarks
                              seasonId={reconstruction.seasonId}
                              teamCode={standing.teamId}
                              compact
                            />
                          </div>
                        </th>
                        <td>{standing.gamesPlayed}</td>
                        <td>{standing.wins}</td>
                        <td>{standing.losses}</td>
                        <td>
                          {standing.gamesPlayed ? standing.pct.toFixed(3).replace(/^0/, "") : "—"}
                        </td>
                        <td>{formatInteger(standing.pointsFor)}</td>
                        <td>{formatInteger(standing.pointsAgainst)}</td>
                        <td>
                          {standing.pointDifferential > 0 ? "+" : ""}
                          {formatInteger(standing.pointDifferential)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </section>
    </section>
  );
}
