import { Link } from "@tanstack/react-router";
import rawStatistics from "../../data/statistics/season-001/statistics.json";
import secondBatch from "../../data/statistics/season-001/statistics-02.json";
import { playerPhaseStatsSchema } from "../../lib/statistics/schemas";
import { newRoster, type BolaoPlayer } from "../../lib/new-roster";
import "../../styles/published-statistics.css";

// The approved and audited season-001 snapshot is intentionally independent of
// the old league's season-stats/RankingEngine modules.
const published = playerPhaseStatsSchema.array().parse([...rawStatistics, ...secondBatch]).filter(
  (record) => record.seasonId === "season-001" && record.phaseId === "regular" && record.revision === 1,
);
const byPlayer = new Map(published.map((record) => [record.playerId, record]));
const playoffRecords = playerPhaseStatsSchema.array().parse(secondBatch).filter(
  (record) => record.seasonId === "season-001" && record.phaseId !== "regular" && record.availability === "available",
);
const playoffByPlayer = (playerId: string) => playoffRecords.filter((record) => record.playerId === playerId);

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
      <p className="published-footnote">Médias e porcentagens reproduzem os valores exibidos pelo jogo; totais foram conferidos separadamente. Sem pontuação artificial ou ranking geral. As estatísticas dos playoffs estão exibidas abaixo quando disponíveis.</p>
      <PlayoffStatistics playerId={player.id} />
    </section>
  );
}


const phaseTitle: Record<string, string> = {
  "playoffs": "Playoffs · Consolidado",
  "first-round": "First Round · 1ª rodada",
  "quarterfinals": "Conference Semifinals · 2ª rodada",
};
const playoffsOrder = ["playoffs", "first-round", "quarterfinals"];
function PlayoffStatistics({ playerId }: { playerId: string }) {
  const rounds = playoffByPlayer(playerId).sort((a,b)=>playoffsOrder.indexOf(a.phaseId)-playoffsOrder.indexOf(b.phaseId));
  if (!rounds.length) return null;
  // The consolidated playoffs line is a VIEW. First-round-only players have one
  // stage record. Enzo has a separate 10-game aggregate plus two 5-game stage
  // summaries; these must never be added to each other as independent games.
  const summary = rounds.find(record=>record.phaseId==="playoffs") ?? rounds[0];
  const stages = rounds.filter(record=>record.phaseId!=="playoffs");
  const formatRow=(record: typeof summary) => {
    const a=record.stats.averages ?? {}, t=record.stats.totals ?? {}, p=record.stats.percentages ?? {};
    return [
      ["Jogos (GP)",integer(t.gp)],["Titular (GS)",integer(t.gs)],
      ["Minutos (MIN)",integer(t.minutes)],["Pontos (PTS)",integer(t.points)],
      ["Rebotes (REB)",integer(t.rebounds)],["Assistências (AST)",integer(t.assists)],
      ["Roubos (STL)",integer(t.steals)],["Bloqueios (BLK)",integer(t.blocks)],
      ["Turnovers (TO)",integer(t.turnovers)],["FGM",integer(t.fgm)],
      ["FGA",integer(t.fga)],["3PM",integer(t.threePm)],["3PA",integer(t.threePa)],
      ["FTM",integer(t.ftm)],["FTA",integer(t.fta)],
      ["PPG",avg(a.ppg)],["RPG",avg(a.rpg)],["APG",avg(a.apg)],
      ["SPG",avg(a.spg)],["BPG",avg(a.bpg)],["TOPG",avg(a.topg)],
      ["MPG",avg(a.mpg)],["FG%",percentage(p.fgPct)],
      ["3P%",percentage(p.threePct)],["FT%",percentage(p.ftPct)],
    ] as [string,string][];
  };
  return (
    <div className="published-playoffs" aria-label="Estatísticas dos playoffs">
      <div className="published-stats-head">
        <div>
          <span className="published-eyebrow">TEMPORADA 01 · PÓS-TEMPORADA</span>
          <h2>PLAYOFFS.</h2>
          <p>{integer(summary.stats.totals?.gp)} jogos disputados · {playerId === "enzo" ? "até as semifinais de conferência" : "eliminado na primeira rodada"}</p>
        </div>
      </div>
      <div className="published-key-metrics">
        {([["PONTOS",summary.stats.averages?.ppg,"PPG"],["REBOTES",summary.stats.averages?.rpg,"RPG"],["ASSISTÊNCIAS",summary.stats.averages?.apg,"APG"],["MINUTOS",summary.stats.averages?.mpg,"MPG"]] as const).map(([label,value,unit])=>(
          <div className="published-key-card" key={unit}><span>{label}</span><strong>{avg(value)}</strong><small>{unit}</small></div>
        ))}
      </div>
      <div className="published-stats-card published-playoffs-summary">
        <h3>TOTAIS E MÉDIAS DOS PLAYOFFS</h3>
        <dl className="published-stats-list">
          {formatRow(summary).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>
      <div className="published-rounds">
        <h3>RODADAS DISPUTADAS</h3>
        {stages.map(record=>(
          <section className="published-round-card" key={record.id}>
            <h4>{phaseTitle[record.phaseId] ?? record.phaseId}</h4>
            <p>{integer(record.stats.totals?.gp)} jogos · {avg(record.stats.averages?.ppg)} PPG</p>
            <dl className="published-stats-list">
              {formatRow(record).filter(([label,value])=>value!=="—").map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {record.playerId==="enzo" && <p className="published-note">Totais não exibidos nas capturas específicas desta rodada; médias preservadas como fornecidas pelo NBA 2K26.</p>}
          </section>
        ))}
      </div>
      <p className="published-footnote">Consolidado de playoffs é uma visualização da campanha, não jogos adicionais. No caso do Enzo, 5 + 5 = 10 partidas de playoffs; os totais por rodada não foram inferidos a partir de médias arredondadas.</p>
    </div>
  );
}

export function SeasonStatistics() {
  return (
    <main className="published-season-page sports-page">
      <header className="published-season-heading">
        <span className="published-eyebrow">CENTRAL DO BOLÃO · ARQUIVO ESTATÍSTICO</span>
        <h1>TEMPORADA 01.</h1>
        <p>2005–06 · Temporada regular · 13 jogadores com estatísticas conferidas. Cinco também possuem registros dos playoffs.</p>
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
                {record ? <p>{avg(a?.ppg)} PPG · {avg(a?.rpg)} RPG · {avg(a?.apg)} APG{playoffByPlayer(player.id).length ? " · Playoffs" : ""}</p> : <p>Estatísticas ainda não importadas</p>}
              </div>
              <span className="published-season-player-arrow" aria-hidden="true">↗</span>
            </Link>
          );
        })}
      </div>
      <p className="published-footnote">Os playoffs aparecem nos perfis dos cinco jogadores que disputaram a pós-temporada. Premiações serão exibidas quando importadas.</p>
    </main>
  );
}
