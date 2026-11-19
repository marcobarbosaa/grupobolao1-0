import { publishedCatalog } from "../../lib/published-catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import { newRoster } from "../../lib/new-roster";
import history001 from "../../data/statistics/season-001/teamHistory.json";
import history002 from "../../data/statistics/season-002/teamHistory.json";
import history003 from "../../data/statistics/season-003/teamHistory.json";
import history004 from "../../data/statistics/season-004/teamHistory.json";
import history005 from "../../data/statistics/season-005/teamHistory.json";
import history006 from "../../data/statistics/season-006/teamHistory.json";
import history007 from "../../data/statistics/season-007/teamHistory.json";
import history008 from "../../data/statistics/season-008/teamHistory.json";
import history009 from "../../data/statistics/season-009/teamHistory.json";
import history010 from "../../data/statistics/season-010/teamHistory.json";
import history011 from "../../data/statistics/season-011/teamHistory.json";
import archive from "../../data/statistics/season-extras.json";
import reconstructionData from "../../data/liga-viva/reconstructions/season-002-seed-pilot.json";
import historicalLogoData from "../../data/statistics/historical-logos.json";
import details2006 from "../../data/statistics/season-002/standings-details.json";
import details2007 from "../../data/statistics/season-003/standings-details.json";
import details2008 from "../../data/statistics/season-004/standings-details.json";
import details2009 from "../../data/statistics/season-005/standings-details.json";
import details2010 from "../../data/statistics/season-006/standings-details.json";
import details2011 from "../../data/statistics/season-007/standings-details.json";
import details2013 from "../../data/statistics/season-008/standings-details.json";
import {
  buildSyntheticRounds,
  calculateStandingsThroughRound,
} from "../../lib/liga-viva/presentation";
import type { Reconstruction } from "../../lib/liga-viva/types";
import "./SeasonExtras.css";

type SeasonId = string;
type Conference = "west" | "east";
type View = "standings" | "playoffs" | "rounds";
type RoundId = "first-round" | "quarterfinals" | "conference-finals" | "nba-finals";

type Standing = {
  rank: number;
  team: string;
  wins?: number;
  losses?: number;
  pct?: number;
  ppg?: number;
  papg?: number;
  diff?: number;
};
type StandingDetails = {
  gb: string;
  home: string;
  away: string;
  conference: string;
  division: string;
  streak: string;
};
type Match = {
  conference: string;
  round: string;
  homeTeam: string;
  homeWins: number;
  awayTeam: string;
  awayWins: number;
  winner: string;
};
type SeasonRecord = {
  seasonId: string;
  year: string;
  standings?: Partial<Record<Conference, Standing[]>>;
  playoffs?: { matches: Match[]; champion?: string };
};
type LogoDefinition = { year: number; slug: string };

const seasons: Record<SeasonId, SeasonRecord> = { ...archive };
const reconstruction = reconstructionData as unknown as Reconstruction;
const reconstructionRounds = buildSyntheticRounds(reconstruction);

// Historical affiliation is season-scoped; never infer it from a player's current uniform.
const histories: Record<string, { playerId: string; teamId: string }[]> = {
  "season-001": history001,
  "season-002": history002,
  "season-003": history003,
  "season-004": history004,
  "season-005": history005,
  "season-006": history006,
  "season-007": history007,
  "season-008": history008,
  "season-009": history009,
  "season-010": history010,
  "season-011": history011,
};
const historicalTeamCodes: Record<string, string> = {
  "new-orleans-hornets": "NO",
  "sacramento-kings": "SAC",
  "atlanta-hawks": "ATL",
  "denver-nuggets": "DEN",
  "indiana-pacers": "IND",
  "phoenix-suns": "PHX",
  "detroit-pistons": "DET",
  "dallas-mavericks": "DAL",
  "toronto-raptors": "TOR",
  "new-york-knicks": "NY",
  "san-antonio-spurs": "SA",
  "minnesota-timberwolves": "MIN",
  "philadelphia-76ers": "PHI",
  "houston-rockets": "HOU",
  "chicago-bulls": "CHI",
  "orlando-magic": "ORL",
  "milwaukee-bucks": "MIL",
  "brooklyn-nets": "BKN",
  "new-orleans-pelicans": "NO",
};
function bolaoPlayers(seasonId: SeasonId, teamCode: string) {
  return (histories[seasonId] ?? [])
    .filter((row) => historicalTeamCodes[row.teamId] === teamCode)
    .map((row) => newRoster.find((player) => player.id === row.playerId))
    .filter((player): player is (typeof newRoster)[number] => Boolean(player));
}
const syntheticPlayerNames: Record<string, string> = {
  "matheus-medeiros": "Medeiros",
  "marco-barbosa": "Marco",
  "cristiano-ronaldo": "Cerrote",
  "fabio-carvalho": "Binho",
};

export function PlayerMarks({
  seasonId,
  teamCode,
  compact = false,
}: {
  seasonId: SeasonId;
  teamCode: string;
  compact?: boolean;
}) {
  const players = bolaoPlayers(seasonId, teamCode);
  if (!players.length) return null;
  return (
    <span className={compact ? "league-player-marks is-compact" : "league-player-marks"}>
      {players.map((player) => {
        const displayName = syntheticPlayerNames[player.id] ?? player.name;
        return (
          <Link
            key={player.id}
            to="/jogadores/$id"
            params={{ id: player.id }}
            className="league-player-chip"
            title={`Grupo Bolão · ${player.name} · ${teamCode} · ${seasonId}`}
            aria-label={`Abrir perfil de ${player.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <span aria-hidden="true">★</span>
            <span className="league-player-name">{displayName}</span>
          </Link>
        );
      })}
    </span>
  );
}
for (const [seasonId, data] of Object.entries(publishedCatalog.extras)) {
  seasons[seasonId] = {
    ...data,
    seasonId,
    year: publishedCatalog.seasons.find((s) => s.id === seasonId)?.year ?? seasonId,
  };
}
const fullStandings: Record<string, Record<string, StandingDetails>> = {
  "season-002": details2006,
  "season-003": details2007,
  "season-004": details2008,
  "season-005": details2009,
  "season-006": details2010,
  "season-007": details2011,
  "season-008": details2013,
};
const detailFieldLabels: { key: keyof StandingDetails; label: string }[] = [
  { key: "gb", label: "GB" },
  { key: "home", label: "Casa" },
  { key: "away", label: "Fora" },
  { key: "conference", label: "Conferência" },
  { key: "division", label: "Divisão" },
  { key: "streak", label: "Sequência" },
];
function hasStandingsDetailValue(key: keyof StandingDetails, value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  if (key === "conference" || key === "division") return /^\d+-\d+$/.test(value);
  return true;
}
const baseLogos: Record<string, LogoDefinition> = historicalLogoData.base;
const logoOverrides: Record<
  SeasonId,
  Record<string, LogoDefinition>
> = historicalLogoData.seasonOverrides;
// A single 2015-era visual reference for the league archive; franchise names
// that no longer existed in 2015 retain the last relevant historical emblem.
const logos2015: Record<string, LogoDefinition> = historicalLogoData.logos2015;
export const teamNames: Record<string, string> = Object.fromEntries(
  Object.values(seasons["season-002"].standings ?? {})
    .flat()
    .map((team) => [
      team.team,
      (
        {
          ATL: "Atlanta Hawks",
          BOS: "Boston Celtics",
          CHA: "Charlotte Bobcats",
          CHI: "Chicago Bulls",
          CLE: "Cleveland Cavaliers",
          DAL: "Dallas Mavericks",
          DEN: "Denver Nuggets",
          DET: "Detroit Pistons",
          GS: "Golden State Warriors",
          HOU: "Houston Rockets",
          IND: "Indiana Pacers",
          LAC: "Los Angeles Clippers",
          LAL: "Los Angeles Lakers",
          MEM: "Memphis Grizzlies",
          MIA: "Miami Heat",
          MIL: "Milwaukee Bucks",
          MIN: "Minnesota Timberwolves",
          NJN: "New Jersey Nets",
          OKC: "Oklahoma City Thunder",
          NO: "New Orleans Hornets",
          NY: "New York Knicks",
          ORL: "Orlando Magic",
          PHI: "Philadelphia 76ers",
          PHX: "Phoenix Suns",
          POR: "Portland Trail Blazers",
          SA: "San Antonio Spurs",
          SAC: "Sacramento Kings",
          SEA: "Seattle SuperSonics",
          TOR: "Toronto Raptors",
          UTA: "Utah Jazz",
          WAS: "Washington Wizards",
        } as Record<string, string>
      )[team.team] ?? team.team,
    ]),
);

export function LeagueTeamBadge({
  code,
  seasonId,
  showPlayerMarks = false,
  showCode = true,
  isAway = false,
  venueLabel,
}: {
  code: string;
  seasonId: SeasonId;
  showPlayerMarks?: boolean;
  showCode?: boolean;
  isAway?: boolean;
  venueLabel?: string;
}) {
  const playerMarks = showPlayerMarks ? (
    <PlayerMarks seasonId={seasonId} teamCode={code} compact />
  ) : null;

  return (
    <span className={isAway ? "league-round-team is-away" : "league-round-team"}>
      <span className="league-round-team-identity">
        <Logo code={code} seasonId={seasonId} />
        <span>{teamDisplayName(code, seasonId)}</span>
        {showCode && <small>{code}</small>}
      </span>
      {playerMarks}
      {venueLabel && <small className="synthetic-team-role">{venueLabel}</small>}
    </span>
  );
}

const SyntheticSeason = lazy(() => import("./SyntheticSeason"));

teamNames.OKC = "Oklahoma City Thunder";
teamNames.BKN = "Brooklyn Nets";

function teamDisplayName(code: string, seasonId: SeasonId) {
  if ((seasonId === "season-010" || seasonId === "season-011") && code === "CHA")
    return "Charlotte Hornets";
  if (
    (seasonId === "season-009" || seasonId === "season-010" || seasonId === "season-011") &&
    code === "NO"
  )
    return "New Orleans Pelicans";
  return teamNames[code] ?? code;
}

const conferences: { id: Conference; label: string }[] = [
  { id: "west", label: "Oeste" },
  { id: "east", label: "Leste" },
];
const rounds: { id: RoundId; label: string }[] = [
  { id: "first-round", label: "First Round" },
  { id: "quarterfinals", label: "Semifinais" },
  { id: "conference-finals", label: "Final de conferência" },
];

function historicalLogoSrc(code: string, seasonId: SeasonId): string | undefined {
  const logo =
    logos2015[code] ??
    publishedCatalog.extras[seasonId]?.logos?.[code] ??
    logoOverrides[seasonId]?.[code] ??
    baseLogos[code];
  if (!logo) return undefined;
  // logoCDN's actual image host/path (the old i.logocdn.com/nba path fails).
  // The year is when the emblem version started, not the season on screen.
  const extension = ["BOS", "CHI", "MIA"].includes(code) ? ".svg" : "@3x.png";
  return `https://assets.logocdn.com/images/sports/nba/${logo.year}/${logo.slug}${extension}`;
}

function Logo({ code, seasonId }: { code: string; seasonId: SeasonId }) {
  const src = historicalLogoSrc(code, seasonId);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <span className="seasonextras-logo" aria-hidden="true">
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span>{code}</span>
      )}
    </span>
  );
}

function Series({ match, seasonId }: { match: Match; seasonId: SeasonId }) {
  const teams = [
    { code: match.homeTeam, wins: match.homeWins },
    { code: match.awayTeam, wins: match.awayWins },
  ];

  return (
    <article
      className="seasonextras-series"
      aria-label={`${teamDisplayName(match.homeTeam, seasonId)} ${match.homeWins}, ${teamDisplayName(match.awayTeam, seasonId)} ${match.awayWins}`}
    >
      {teams.map((team) => (
        <div
          key={team.code}
          className={`seasonextras-side${team.code === match.winner ? " is-winner" : ""}`}
        >
          <Logo code={team.code} seasonId={seasonId} />
          <span className="seasonextras-side-name">{teamDisplayName(team.code, seasonId)}</span>
          <PlayerMarks seasonId={seasonId} teamCode={team.code} compact />
          <strong>{team.wins}</strong>
        </div>
      ))}
    </article>
  );
}

function Standings({
  seasonId,
  season,
  conference,
  onConferenceChange,
  round,
  onRoundChange,
}: {
  seasonId: SeasonId;
  season: SeasonRecord;
  conference: Conference;
  onConferenceChange: (conference: Conference) => void;
  round: number;
  onRoundChange: (round: number) => void;
}) {
  const [trackingMode, setTrackingMode] = useState<"final" | "round">("final");
  const canTrackRounds = seasonId === reconstruction.seasonId;
  const isRoundMode = trackingMode === "round" && canTrackRounds;
  const activeRound = Math.max(1, Math.min(reconstructionRounds.length, round));
  const progress = canTrackRounds
    ? calculateStandingsThroughRound(reconstruction.standings, reconstructionRounds, activeRound)
    : [];
  const clinchedTeams = new Set<string>();
  if (isRoundMode) {
    const gamesPerTeam = reconstruction.rules.schedule.gamesPerTeam;
    for (const conferenceId of ["east", "west"] as const) {
      const conferenceStandings = progress.filter(
        (standing) => standing.conference === conferenceId,
      );
      const bestPossibleOutsideWins = Math.max(
        ...conferenceStandings
          .slice(8)
          .map((standing) => standing.wins + Math.max(0, gamesPerTeam - standing.gamesPlayed)),
      );
      conferenceStandings.slice(0, 8).forEach((standing) => {
        if (standing.wins > bestPossibleOutsideWins) clinchedTeams.add(standing.teamId);
      });
    }
  }
  const rows = isRoundMode
    ? progress
        .filter((standing) => standing.conference === conference)
        .map((standing, index) => ({
          rank: index + 1,
          team: standing.teamId,
          wins: standing.wins,
          losses: standing.losses,
          pct: standing.pct,
          ppg: standing.gamesPlayed ? standing.pointsFor / standing.gamesPlayed : undefined,
          papg: standing.gamesPlayed ? standing.pointsAgainst / standing.gamesPlayed : undefined,
          diff: standing.gamesPlayed
            ? (standing.pointsFor - standing.pointsAgainst) / standing.gamesPlayed
            : undefined,
          gamesPlayed: standing.gamesPlayed,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
        }))
    : (season.standings?.[conference] ?? []);
  const details = fullStandings[seasonId] ?? {};
  const missingDetailLabels = isRoundMode
    ? []
    : detailFieldLabels
        .filter(({ key }) =>
          rows.some((row) => {
            const extra = details[row.team] ?? (row as unknown as Partial<StandingDetails>);
            return !hasStandingsDetailValue(key, extra[key]);
          }),
        )
        .map(({ label }) => label);

  return (
    <section className="seasonextras-panel" aria-label={`Classificação ${season.year}`}>
      <div className="seasonextras-header">
        <div>
          <p className="seasonextras-kicker">
            {season.year} / {isRoundMode ? `APÓS A RODADA ${activeRound}` : "TEMPORADA REGULAR"}
          </p>
        </div>
        <div className="seasonextras-standings-controls">
          {canTrackRounds && (
            <div className="seasonextras-toggle" role="group" aria-label="Período da classificação">
              <button
                type="button"
                aria-pressed={trackingMode === "final"}
                onClick={() => setTrackingMode("final")}
              >
                Final
              </button>
              <button
                type="button"
                aria-pressed={trackingMode === "round"}
                onClick={() => setTrackingMode("round")}
              >
                Por rodada
              </button>
            </div>
          )}
          {isRoundMode && (
            <div
              className="seasonextras-round-picker"
              aria-label="Selecionar rodada da classificação"
            >
              <button
                type="button"
                aria-label="Rodada anterior"
                title="Rodada anterior"
                disabled={activeRound === 1}
                onClick={() => onRoundChange(activeRound - 1)}
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <label>
                <span>Rodada</span>
                <select
                  value={activeRound}
                  onChange={(event) => onRoundChange(Number(event.target.value))}
                  aria-label="Selecionar rodada da classificação"
                >
                  {reconstructionRounds.map((option) => (
                    <option key={option.number} value={option.number}>
                      {String(option.number).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span>de {reconstructionRounds.length}</span>
              </label>
              <button
                type="button"
                aria-label="Próxima rodada"
                title="Próxima rodada"
                disabled={activeRound === reconstructionRounds.length}
                onClick={() => onRoundChange(activeRound + 1)}
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="seasonextras-toggle" role="group" aria-label="Conferência">
            {conferences.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={conference === option.id}
                onClick={() => onConferenceChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="seasonextras-tablewrap"
        role="region"
        tabIndex={0}
        aria-label="Tabela de classificação; deslize horizontalmente para ver todas as estatísticas"
      >
        <table className="seasonextras-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Time</th>
              {isRoundMode && <th scope="col">J</th>}
              <th scope="col">V</th>
              <th scope="col">D</th>
              <th scope="col">%</th>
              {isRoundMode ? (
                <>
                  <th scope="col">PF</th>
                  <th scope="col">PA</th>
                  <th scope="col">Saldo</th>
                </>
              ) : (
                <>
                  <th scope="col">GB</th>
                  <th scope="col">Casa</th>
                  <th scope="col">Fora</th>
                  <th scope="col">Conf.</th>
                  <th scope="col">Div.</th>
                  <th scope="col">PPG</th>
                  <th scope="col">PAPG</th>
                  <th scope="col">Saldo</th>
                  <th scope="col">Seq.</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const extra = details[row.team] ?? (row as unknown as Partial<StandingDetails>);
              return (
                <tr key={row.team} className={row.rank <= 8 ? "seasonextras-qualified" : ""}>
                  <td>{row.rank}</td>
                  <th scope="row">
                    <div className="seasonextras-team">
                      <Logo code={row.team} seasonId={seasonId} />
                      <span className="league-standing-name">
                        {teamDisplayName(row.team, seasonId)}
                        <PlayerMarks seasonId={seasonId} teamCode={row.team} />
                      </span>
                      {isRoundMode ? (
                        clinchedTeams.has(row.team) && (
                          <span
                            className="seasonextras-playoff-label"
                            title="Classificado matematicamente para os playoffs"
                            aria-label="Classificado matematicamente para os playoffs"
                          >
                            P
                          </span>
                        )
                      ) : row.rank <= 8 ? (
                        <span
                          className="seasonextras-playoff-label"
                          title="Classificado aos playoffs"
                        >
                          P
                        </span>
                      ) : null}
                    </div>
                  </th>
                  {isRoundMode && <td>{row.gamesPlayed}</td>}
                  <td>{row.wins}</td>
                  <td>{row.losses}</td>
                  <td>{row.pct?.toFixed(3).replace(/^0/, "") ?? "—"}</td>
                  {isRoundMode ? (
                    <>
                      <td>{row.pointsFor}</td>
                      <td>{row.pointsAgainst}</td>
                      <td>{row.gamesPlayed ? row.pointsFor - row.pointsAgainst : "—"}</td>
                    </>
                  ) : (
                    <>
                      <td>{extra?.gb ?? "—"}</td>
                      <td>{extra?.home ?? "—"}</td>
                      <td>{extra?.away ?? "—"}</td>
                      <td>
                        {hasStandingsDetailValue("conference", extra?.conference)
                          ? extra?.conference
                          : "—"}
                      </td>
                      <td>
                        {hasStandingsDetailValue("division", extra?.division)
                          ? extra?.division
                          : "—"}
                      </td>
                      <td>{row.ppg?.toFixed(1) ?? "—"}</td>
                      <td>{row.papg?.toFixed(1) ?? "—"}</td>
                      <td>{row.diff?.toFixed(1) ?? "—"}</td>
                      <td>{extra?.streak ?? "—"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="seasonextras-note">
        {isRoundMode
          ? "Classificação calculada pelos resultados sintéticos até a rodada selecionada. ★ identifica atletas do Grupo Bolão."
          : "P = classificado aos playoffs. ★ = atleta do Grupo Bolão (clique no nome para abrir o perfil). Ordem preservada conforme o NBA 2K, incluindo critérios de divisão. Os dados são do universo do Grupo Bolão, não dos resultados históricos da NBA real."}
      </p>
      {missingDetailLabels.length > 0 && (
        <p className="seasonextras-note seasonextras-data-warning" role="status">
          <strong>Dados complementares pendentes:</strong> {missingDetailLabels.join(", ")}. Os
          campos indicados ainda não foram publicados para esta temporada; os traços na tabela não
          representam zero.
        </p>
      )}
    </section>
  );
}

function Playoffs({ seasonId, season }: { seasonId: SeasonId; season: SeasonRecord }) {
  const final = (season.playoffs?.matches ?? []).find((match) => match.round === "nba-finals");
  const winner = season.playoffs?.champion;
  const runnerUp = final
    ? final.winner === final.homeTeam
      ? final.awayTeam
      : final.homeTeam
    : undefined;
  const championScore = final
    ? final.winner === final.homeTeam
      ? final.homeWins
      : final.awayWins
    : null;
  const runnerScore = final
    ? final.winner === final.homeTeam
      ? final.awayWins
      : final.homeWins
    : null;

  return (
    <section className="seasonextras-panel" aria-label={`Chaveamento dos playoffs ${season.year}`}>
      <div className="seasonextras-header">
        <div>
          <p className="seasonextras-kicker">{season.year} / PÓS-TEMPORADA</p>
          <h2>CHAVEAMENTO</h2>
        </div>
      </div>

      {winner && (
        <div className="seasonextras-champion">
          <span className="seasonextras-kicker">CAMPEÃO NBA {season.year}</span>
          <div>
            <Logo code={winner} seasonId={seasonId} />
            <strong>{teamDisplayName(winner, seasonId)}</strong>
            <PlayerMarks seasonId={seasonId} teamCode={winner} />
          </div>
          {final && runnerUp && (
            <span>
              Final: {teamDisplayName(winner, seasonId)} {championScore}–{runnerScore}{" "}
              {teamDisplayName(runnerUp, seasonId)}
            </span>
          )}
        </div>
      )}
      <div
        className="seasonextras-bracket"
        role="region"
        tabIndex={0}
        aria-label="Chaveamento completo dos playoffs; deslize horizontalmente"
      >
        {(["west", "finals", "east"] as const).map((side) => {
          if (side === "finals") {
            return (
              <div className="seasonextras-final" key="finals">
                <h3>NBA FINALS</h3>
                {final && <Series match={final} seasonId={seasonId} />}
              </div>
            );
          }

          return (
            <div className="seasonextras-conference" key={side}>
              <h3>Conferência {side === "west" ? "Oeste" : "Leste"}</h3>
              <div
                className={`seasonextras-rounds${side === "east" ? " seasonextras-rounds-east" : ""}`}
              >
                {rounds.map((round) => (
                  <div className="seasonextras-round" key={round.id}>
                    <h4>{round.label}</h4>
                    <div className="seasonextras-matches">
                      {(season.playoffs?.matches ?? [])
                        .filter((match) => match.conference === side && match.round === round.id)
                        .map((match) => (
                          <Series
                            key={`${match.homeTeam}-${match.awayTeam}`}
                            match={match}
                            seasonId={seasonId}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="seasonextras-note">
        Os números ao lado das equipes indicam vitórias na série. ★ identifica atletas do Grupo
        Bolão naquela temporada. Os escudos correspondem à identidade histórica das franquias no
        período selecionado. Em telas menores, deslize horizontalmente pelo chaveamento.
      </p>
    </section>
  );
}

export function SeasonExtras({
  seasonId,
  view,
  conference,
  round,
  onRoundChange,
  onSeasonChange,
  onViewChange,
  onConferenceChange,
  team,
  onTeamChange,
}: {
  seasonId: SeasonId;
  view: View;
  conference: Conference;
  round: number;
  onRoundChange: (round: number) => void;
  onSeasonChange: (seasonId: SeasonId) => void;
  onViewChange: (view: View) => void;
  onConferenceChange: (conference: Conference) => void;
  round: number;
  team?: string;
  onRoundChange: (round: number) => void;
  onTeamChange: (team?: string) => void;
}) {
  const season = seasons[seasonId];
  if (!season)
    return (
      <div className="seasonextras">
        <p>Dados coletivos ainda não importados para esta temporada.</p>
      </div>
    );
  const hasStandings = season.standings !== undefined;
  const hasPlayoffs = (season.playoffs?.matches?.length ?? 0) > 0;
  const hasCollectiveData = hasStandings || hasPlayoffs;
  const hasReconstruction = seasonId === "season-002";
  const activeView: View =
    view === "rounds" && !hasReconstruction
      ? hasStandings
        ? "standings"
        : "playoffs"
      : hasStandings
        ? view
        : "playoffs";

  return (
    <div className="seasonextras">
      <div className="seasonextras-controlbar">
        <nav className="seasonextras-nav" aria-label="Visualizações da temporada">
          {hasStandings && (
            <button
              type="button"
              aria-pressed={activeView === "standings"}
              onClick={() => onViewChange("standings")}
            >
              Classificação
            </button>
          )}
          {hasPlayoffs && (
            <button
              type="button"
              aria-pressed={activeView === "playoffs"}
              onClick={() => onViewChange("playoffs")}
            >
              Playoffs
            </button>
          )}
          {hasReconstruction && (
            <button
              type="button"
              aria-pressed={activeView === "rounds"}
              onClick={() => onViewChange("rounds")}
            >
              Rodadas
            </button>
          )}
        </nav>
        <label className="league-season-select">
          <span>Temporada</span>
          <select value={seasonId} onChange={(event) => onSeasonChange(event.target.value)}>
            {publishedCatalog.seasons.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title} · {option.year}
              </option>
            ))}
          </select>
        </label>
      </div>
      {activeView === "rounds" ? (
        <Suspense
          fallback={<p className="seasonextras-note">Carregando reconstrução sintética…</p>}
        >
          <SyntheticSeason
            round={round}
            team={team}
            onRoundChange={onRoundChange}
            onTeamChange={onTeamChange}
          />
        </Suspense>
      ) : !hasCollectiveData ? (
        <section className="seasonextras-panel" aria-live="polite">
          <p className="seasonextras-note">
            Classificação e chaveamento ainda não foram publicados para {season.year}. As
            estatísticas individuais desta temporada podem estar disponíveis em outras áreas.
          </p>
        </section>
      ) : activeView === "standings" ? (
        <Standings
          seasonId={seasonId}
          season={season}
          conference={conference}
          onConferenceChange={onConferenceChange}
          round={round}
          onRoundChange={onRoundChange}
        />
      ) : (
        <Playoffs seasonId={seasonId} season={season} />
      )}
    </div>
  );
}
