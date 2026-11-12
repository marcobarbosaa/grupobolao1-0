import { publishedCatalog } from "../../lib/published-catalog";
import { useState } from "react";
import archive from "../../data/statistics/season-extras.json";
import historicalLogoData from "../../data/statistics/historical-logos.json";
import details2006 from "../../data/statistics/season-002/standings-details.json";
import details2007 from "../../data/statistics/season-003/standings-details.json";
import details2008 from "../../data/statistics/season-004/standings-details.json";
import details2009 from "../../data/statistics/season-005/standings-details.json";
import "./SeasonExtras.css";

type SeasonId = string;
type Conference = "west" | "east";
type View = "standings" | "playoffs";
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
};
const baseLogos: Record<string, LogoDefinition> = historicalLogoData.base;
const logoOverrides: Record<
  SeasonId,
  Record<string, LogoDefinition>
> = historicalLogoData.seasonOverrides;
const teamNames: Record<string, string> = Object.fromEntries(
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

teamNames.OKC = "Oklahoma City Thunder";

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
    publishedCatalog.extras[seasonId]?.logos?.[code] ??
    logoOverrides[seasonId]?.[code] ??
    (Number(seasonId.slice(-3)) <= 5 ? baseLogos[code] : undefined);
  if (!logo) return undefined;
  const extension = ["BOS", "CHI", "MIA"].includes(code) ? ".svg" : "@3x.png";
  return `https://i.logocdn.com/nba/${logo.year}/${logo.slug}${extension}`;
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
      aria-label={`${teamNames[match.homeTeam] ?? match.homeTeam} ${match.homeWins}, ${teamNames[match.awayTeam] ?? match.awayTeam} ${match.awayWins}`}
    >
      {teams.map((team) => (
        <div
          key={team.code}
          className={`seasonextras-side${team.code === match.winner ? " is-winner" : ""}`}
        >
          <Logo code={team.code} seasonId={seasonId} />
          <span className="seasonextras-side-name">{teamNames[team.code] ?? team.code}</span>
          <strong>{team.wins}</strong>
        </div>
      ))}
    </article>
  );
}

function Standings({ seasonId, season }: { seasonId: SeasonId; season: SeasonRecord }) {
  const [conference, setConference] = useState<Conference>("west");
  const rows = season.standings?.[conference] ?? [];
  const details = fullStandings[seasonId] ?? {};

  return (
    <section className="seasonextras-panel" aria-label={`Classificação ${season.year}`}>
      <div className="seasonextras-header">
        <div>
          <p className="seasonextras-kicker">{season.year} / TEMPORADA REGULAR</p>
          <h2>Classificação da liga</h2>
          <p>30 franquias, suas campanhas completas e seus escudos da época.</p>
        </div>
        <div className="seasonextras-toggle" role="group" aria-label="Conferência">
          {conferences.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={conference === option.id}
              onClick={() => setConference(option.id)}
            >
              {option.label}
            </button>
          ))}
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
              <th scope="col">V</th>
              <th scope="col">D</th>
              <th scope="col">%</th>
              <th scope="col">GB</th>
              <th scope="col">Casa</th>
              <th scope="col">Fora</th>
              <th scope="col">Conf.</th>
              <th scope="col">Div.</th>
              <th scope="col">PPG</th>
              <th scope="col">PAPG</th>
              <th scope="col">Saldo</th>
              <th scope="col">Seq.</th>
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
                      <span>{teamNames[row.team] ?? row.team}</span>
                      {row.rank <= 8 && (
                        <span
                          className="seasonextras-playoff-label"
                          title="Classificado aos playoffs"
                        >
                          P
                        </span>
                      )}
                    </div>
                  </th>
                  <td>{row.wins}</td>
                  <td>{row.losses}</td>
                  <td>{row.pct?.toFixed(3).replace(/^0/, "") ?? "—"}</td>
                  <td>{extra?.gb ?? "—"}</td>
                  <td>{extra?.home ?? "—"}</td>
                  <td>{extra?.away ?? "—"}</td>
                  <td>{extra?.conference ?? "—"}</td>
                  <td>{extra?.division ?? "—"}</td>
                  <td>{row.ppg?.toFixed(1) ?? "—"}</td>
                  <td>{row.papg?.toFixed(1) ?? "—"}</td>
                  <td>{row.diff?.toFixed(1) ?? "—"}</td>
                  <td>{extra?.streak ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="seasonextras-note">
        P = classificado aos playoffs. Ordem da classificação preservada conforme o NBA 2K,
        incluindo critérios de divisão. Os dados são do universo do Grupo Bolão, não dos resultados
        históricos da NBA real.
      </p>
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
          <h2>O caminho até o título</h2>
          <p>Conferências lado a lado, com a NBA Finals no centro.</p>
        </div>
      </div>

      {winner && (
        <div className="seasonextras-champion">
          <span className="seasonextras-kicker">CAMPEÃO NBA {season.year}</span>
          <div>
            <Logo code={winner} seasonId={seasonId} />
            <strong>{teamNames[winner] ?? winner}</strong>
          </div>
          {final && runnerUp && (
            <span>
              Final: {teamNames[winner] ?? winner} {championScore}–{runnerScore}{" "}
              {teamNames[runnerUp] ?? runnerUp}
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
        Os números ao lado das equipes indicam vitórias na série. Os escudos correspondem à
        identidade histórica das franquias no período selecionado. Em telas menores, deslize
        horizontalmente pelo chaveamento.
      </p>
    </section>
  );
}

export function SeasonExtras({ seasonId }: { seasonId: SeasonId }) {
  const [view, setView] = useState<View>("standings");
  const season = seasons[seasonId];
  if (!season)
    return (
      <div className="seasonextras">
        <p>Dados coletivos ainda não importados para esta temporada.</p>
      </div>
    );
  const hasStandings = season.standings !== undefined;
  const activeView: View = hasStandings ? view : "playoffs";

  return (
    <div className="seasonextras">
      <nav className="seasonextras-nav" aria-label="Classificação e playoffs">
        {hasStandings && (
          <button
            type="button"
            aria-pressed={activeView === "standings"}
            onClick={() => setView("standings")}
          >
            Classificação {season.year}
          </button>
        )}
        <button
          type="button"
          aria-pressed={activeView === "playoffs"}
          onClick={() => setView("playoffs")}
        >
          Chaveamento {season.year}
        </button>
      </nav>
      {activeView === "standings" ? (
        <Standings key={seasonId} seasonId={seasonId} season={season} />
      ) : (
        <Playoffs seasonId={seasonId} season={season} />
      )}
    </div>
  );
}
