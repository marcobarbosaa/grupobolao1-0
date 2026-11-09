import { Link } from "@tanstack/react-router";
import rawStatistics from "../../data/statistics/season-001/statistics.json";
import { playerPhaseStatsSchema } from "../../lib/statistics/schemas";
import { newRoster, type BolaoPlayer } from "../../lib/new-roster";
import "../../styles/published-statistics.css";

// The approved and audited season-001 snapshot is intentionally independent of
// the old league's season-stats/RankingEngine modules.
const published = playerPhaseStatsSchema.array().parse(rawStatistics).filter(
  (record) => record.seasonId === "season-001" && record.phaseId === "regular" && record.revision === 1,
);
const byPlayer = new Map(published.map((record) => [record.playerId, record]));
const avg = (value: number | undefined) => value === undefined ? "—" : value.toFixed(1).replace(".", ",");
const integer = (value: number | undefined) => value === undefined ? "—" : new Intl.NumberFormat("pt-BR").format(value);
const percentage = (value: number | undefined) => value === undefined ? "—" : avg(value) + "%";

export function ProfileStatistics({ player }: { player: BolaoPlayer }) {
  const record = byPlayer.get(player.id);
  if (!record) {
    return (
      <section className="generation-empty">
        <h2>ESTATÍSTICAS EM BREVE.</h2>
        <p>Os dados da temporada regular deste jogador ainda não foram importados. As fases de playoffs serão cadastradas separadamente.</p>
      </section>
    );
  }
  const a = record.stats.averages ?? {};
  const t = record.stats.totals ?? {};
  const p = record.stats.percentages ?? {};
  const top = [
    ["PONTOS", avg(a.ppg), "PPG"],
    ["REBOTES", avg(a.rpg), "RPG"],
    ["ASSISTÊNCIAS", avg(a.apg), "APG"],
    ["MINUTOS", avg(a.mpg), "MPG"],
  ];
  const rows: [string, string][] = [
    ["Jogos disputados (GP)", integer(t.gp)], ["Jogos como titular (GS)", integer(t.gs)],
    ["Minutos (MIN)", integer(t.minutes)], ["Pontos (PTS)", integer(t.points)],
    ["Rebotes (REB)", integer(t.rebounds)], ["Assistências (AST)", integer(t.assists)],
    ["Roubos (STL)", integer(t.steals)], ["Bloqueios (BLK)", integer(t.blocks)],
    ["Turnovers (TO)", integer(t.turnovers)], ["Cestas convertidas (FGM)", integer(t.fgm)],
    ["Arremessos tentados (FGA)", integer(t.fga)], ["3 pontos convertidos (3PM)", integer(t.threePm)],
    ["3 pontos tentados (3PA)", integer(t.threePa)], ["Lances livres convertidos (FTM)", integer(t.ftm)],
    ["Lances livres tentados (FTA)", integer(t.fta)],
  ];
  return (
    <section className="published-stats" aria-labelledby="published-stats-heading">
      <div className="published-stats-head">
        <div>
          <span className="published-eyebrow">TEMPORADA 01 · 2005–06</span>
          <h2 id="published-stats-heading">TEMPORADA REGULAR.</h2>
          <p>Estatísticas conferidas no NBA 2K26 · {integer(t.gp)} jogos</p>
        </div>
        <Link to="/temporadas" className="published-season-link">Ver temporada completa ↗</Link>
      </div>
      <div className="published-key-metrics">
        {top.map(([label, value, unit]) => (
          <div className="published-key-card" key={unit}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{unit}</small>
          </div>
        ))}
      </div>
      <div className="published-stats-sections">
        <div className="published-stats-card">
          <h3>EFICIÊNCIA E DEFESA</h3>
          <dl className="published-stats-list">
            {([
              ["Roubos por jogo", avg(a.spg)], ["Bloqueios por jogo", avg(a.bpg)],
              ["Turnovers por jogo", avg(a.topg)], ["FG%", percentage(p.fgPct)],
              ["3P%", percentage(p.threePct)], ["FT%", percentage(p.ftPct)],
            ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {t.threePa === 0 && <p className="published-note">3P%: o jogo exibe 0,0% sem tentativas; a razão matemática é indefinida.</p>}
        </div>
        <div className="published-stats-card">
          <h3>TOTAIS DA TEMPORADA</h3>
          <dl className="published-stats-list">
            {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      </div>
      <p className="published-footnote">Médias e porcentagens reproduzem os valores exibidos pelo jogo; totais foram conferidos separadamente. Sem pontuação artificial ou ranking geral. Playoffs ainda não importados.</p>
    </section>
  );
}

export function SeasonStatistics() {
  return (
    <main className="published-season-page sports-page">
      <header className="published-season-heading">
        <span className="published-eyebrow">CENTRAL DO BOLÃO · ARQUIVO ESTATÍSTICO</span>
        <h1>TEMPORADA 01.</h1>
        <p>2005–06 · Temporada regular · 8 jogadores com estatísticas conferidas. Os demais ainda aguardam importação.</p>
      </header>
      <div className="published-season-grid">
        {newRoster.map((player) => {
          const record = byPlayer.get(player.id);
          const a = record?.stats.averages;
          return (
            <Link to="/jogadores/$id" params={{ id: player.id }} key={player.id} className={"published-season-player" + (record ? "" : " published-season-player--pending")}>
              <img src={player.portrait} alt="" loading="lazy" />
              <div className="published-season-player-copy">
                <span>{player.team}</span>
                <h2>{player.name}</h2>
                {record ? <p>{avg(a?.ppg)} PPG · {avg(a?.rpg)} RPG · {avg(a?.apg)} APG</p> : <p>Estatísticas ainda não importadas</p>}
              </div>
              <span className="published-season-player-arrow" aria-hidden="true">↗</span>
            </Link>
          );
        })}
      </div>
      <p className="published-footnote">A temporada reúne apenas os registros aprovados da nova geração. Playoffs e premiações serão exibidos quando importados.</p>
    </main>
  );
}
