import { useState } from "react";
import archive from "../../data/statistics/season-extras.json";
import "../../styles/season-extras.css";

type SeasonKey = "season-001" | "season-002" | "season-003";
type Conference = "east" | "west";
type StandingRow = {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pct: number;
  ppg: number;
  papg: number;
  diff: number;
};
type BracketMatch = {
  conference: string;
  round: string;
  homeTeam: string;
  homeWins: number;
  awayTeam: string;
  awayWins: number;
  winner: string;
};
type ExtrasData = {
  seasonId: string;
  year: string;
  standings?: Record<Conference, StandingRow[]>;
  playoffs: { matches: BracketMatch[]; champion: string };
  integrity: { status: string; description: string };
};

const seasonArchive: Record<SeasonKey, ExtrasData> = archive;

const teamNames: Record<string, string> = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", CHA: "Charlotte Bobcats",
  CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks",
  DEN: "Denver Nuggets", DET: "Detroit Pistons", GS: "Golden State Warriors",
  HOU: "Houston Rockets", IND: "Indiana Pacers", LAC: "Los Angeles Clippers",
  LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
  MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NJN: "New Jersey Nets",
  NO: "New Orleans Hornets", NY: "New York Knicks", ORL: "Orlando Magic",
  PHI: "Philadelphia 76ers", PHX: "Phoenix Suns", POR: "Portland Trail Blazers",
  SA: "San Antonio Spurs", SAC: "Sacramento Kings", SEA: "Seattle SuperSonics",
  TOR: "Toronto Raptors", UTA: "Utah Jazz", WAS: "Washington Wizards",
};

const rounds = [
  { id: "first-round", title: "Primeira rodada", label: "ROUND 01" },
  { id: "quarterfinals", title: "Semifinais de conferência", label: "ROUND 02" },
  { id: "conference-finals", title: "Final de conferência", label: "ROUND 03" },
] as const;

const number = (value: number) => value.toFixed(1).replace(".", ",");

function TeamName({ code }: { code: string }) {
  return (
    <span className="extras-team">
      <span className="extras-team-icon" aria-hidden="true">{code}</span>
      <span className="extras-team-full">{teamNames[code] ?? code}</span>
    </span>
  );
}

function SeriesCard({ match }: { match: BracketMatch }) {
  const sides = [
    { code: match.homeTeam, wins: match.homeWins },
    { code: match.awayTeam, wins: match.awayWins },
  ];

  return (
    <article className="extras-series" aria-label={`${teamNames[match.homeTeam]} ${match.homeWins} a ${match.awayWins} ${teamNames[match.awayTeam]}`}>
      {sides.map((side) => (
        <div key={side.code} className={`extras-series-side${side.code === match.winner ? " is-winner" : ""}`}>
          <TeamName code={side.code} />
          <strong aria-label={`${side.wins} vitórias`}>{side.wins}</strong>
        </div>
      ))}
    </article>
  );
}

export function SeasonExtras({ seasonId }: { seasonId: SeasonKey }) {
  const [conference, setConference] = useState<Conference>("east");
  const data = seasonArchive[seasonId];
  const standings = data.standings?.[conference];
  const finals = data.playoffs.matches.find((match) => match.round === "nba-finals");
  const hasStandings = !!data.standings;

  return (
    <section className="season-extras" aria-label={`Classificação e playoffs ${data.year}`}>
      <div className="extras-hero">
        <div className="extras-hero-copy">
          <span className="extras-kicker">CENTRAL DO BOLÃO <span aria-hidden="true">/</span> ARQUIVO DA LIGA</span>
          <span className="extras-year">TEMPORADA {seasonId === "season-001" ? "01" : seasonId === "season-002" ? "02" : "03"} · {data.year}</span>
          <h2>{hasStandings ? "CLASSIFICAÇÃO" : "PLAYOFFS"}<span className="extras-head-accent">.</span></h2>
          <p>{hasStandings
            ? "A temporada inteira, do desempenho das equipes à caminhada pelo título."
            : "O caminho até o título, rodada por rodada. Classificação regular não disponível para esta edição."}</p>
        </div>
        <div className="extras-hero-champion">
          <span>CAMPEÃO DA TEMPORADA</span>
          <div className="extras-champion-badge">{data.playoffs.champion}</div>
          <strong>{teamNames[data.playoffs.champion] ?? data.playoffs.champion}</strong>
          <small>Campeão das NBA Finals</small>
        </div>
      </div>

      {hasStandings && (
        <div className="extras-standings-section">
          <div className="extras-section-heading">
            <div><span className="extras-section-index">01 / TEMPORADA REGULAR</span><h3>CLASSIFICAÇÃO GERAL</h3></div>
            <span className="extras-section-meta">30 EQUIPES · 2 CONFERÊNCIAS</span>
          </div>
          <div className="extras-standings-panel">
            <div className="extras-standings-toolbar">
              <div className="extras-conference-tabs" role="group" aria-label="Selecionar conferência">
                {(["east", "west"] as const).map((value) => (
                  <button type="button" key={value} aria-pressed={conference === value} onClick={() => setConference(value)}>
                    {value === "east" ? "Conferência Leste" : "Conferência Oeste"}
                  </button>
                ))}
              </div>
              <p><span className="extras-qualification-dot" /> 1º ao 8º lugar: classificados aos playoffs</p>
            </div>
            <div className="extras-table-scroll" tabIndex={0} role="region" aria-label={`Tabela da Conferência ${conference === "east" ? "Leste" : "Oeste"}`}>
              <table className="extras-table">
                <thead><tr>
                  <th scope="col">POS.</th><th scope="col">EQUIPE</th>
                  <th scope="col">V</th><th scope="col">D</th><th scope="col">APROV.</th>
                  <th scope="col">PPG</th><th scope="col">PAPG</th><th scope="col">SALDO</th>
                </tr></thead>
                <tbody>
                  {standings?.map((team) => (
                    <tr key={team.team} className={team.rank <= 8 ? "extras-playoff-qualified" : ""}>
                      <td className="extras-position"><span>{String(team.rank).padStart(2, "0")}</span></td>
                      <th scope="row"><TeamName code={team.team} /></th>
                      <td>{team.wins}</td><td>{team.losses}</td>
                      <td>{number(team.pct * 100)}%</td>
                      <td>{number(team.ppg)}</td><td>{number(team.papg)}</td>
                      <td className={team.diff >= 0 ? "extras-positive" : "extras-negative"}>{team.diff > 0 ? "+" : ""}{number(team.diff)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="extras-data-caption">As posições seguem a ordem exibida pelo NBA 2K, que considera os critérios de classificação da conferência. PPG: pontos marcados por jogo; PAPG: pontos sofridos por jogo.</p>
        </div>
      )}

      <div className="extras-bracket-section">
        <div className="extras-section-heading">
          <div><span className="extras-section-index">{hasStandings ? "02" : "01"} / PÓS-TEMPORADA</span><h3>CAMINHO ATÉ O TÍTULO</h3></div>
          <span className="extras-section-meta">16 EQUIPES · 4 RODADAS</span>
        </div>
        <p className="extras-bracket-intro">Placar final de cada série. A equipe destacada avançou para a próxima rodada.</p>
        {(["west", "east"] as const).map((side) => (
          <div key={side} className="extras-bracket-conference">
            <div className="extras-bracket-label">
              <span className="extras-bracket-dot" />
              <h4>CONFERÊNCIA {side === "west" ? "OESTE" : "LESTE"}</h4>
            </div>
            <div className="extras-bracket-grid">
              {rounds.map((round) => (
                <div className="extras-bracket-round" key={round.id}>
                  <div className="extras-round-heading"><span>{round.label}</span><h5>{round.title}</h5></div>
                  <div className="extras-round-matches">
                    {data.playoffs.matches
                      .filter((match) => match.conference === side && match.round === round.id)
                      .map((match) => <SeriesCard key={`${match.homeTeam}-${match.awayTeam}`} match={match} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {finals && (
          <div className="extras-finals-card">
            <span className="extras-finals-overline">THE FINALS · {data.year}</span>
            <h4>NBA FINALS</h4>
            <div className="extras-finals-match"><SeriesCard match={finals} /></div>
            <p><span>CAMPEÃO</span><strong>{teamNames[data.playoffs.champion] ?? data.playoffs.champion}</strong></p>
          </div>
        )}
      </div>
      <footer className="extras-provenance">
        {seasonId === "season-001"
          ? "Playoffs conforme print enviado para 2005/06. A tabela de classificação anteriormente associada a esta temporada foi retirada."
          : seasonId === "season-002"
            ? "Classificação e playoffs extraídos da pasta Extras da Temporada 2006–2007 no Google Drive."
            : "Classificação e playoffs extraídos da pasta Extras da Temporada 2007–2008 no Google Drive."}
      </footer>
    </section>
  );
}
