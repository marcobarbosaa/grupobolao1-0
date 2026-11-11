import archive from "../../data/statistics/season-extras.json";
import "../../styles/season-extras.css";

type SeasonKey = "season-001" | "season-002" | "season-003";
type Conference = "east" | "west";
type BracketMatch = {conference:string;round:string;homeTeam:string;homeWins:number;awayTeam:string;awayWins:number;winner:string};
const teams: Record<string,string> = {
ATL:"Atlanta Hawks",BOS:"Boston Celtics",CHA:"Charlotte Bobcats",CHI:"Chicago Bulls",CLE:"Cleveland Cavaliers",DAL:"Dallas Mavericks",
DEN:"Denver Nuggets",DET:"Detroit Pistons",GS:"Golden State Warriors",HOU:"Houston Rockets",IND:"Indiana Pacers",LAC:"Los Angeles Clippers",
LAL:"Los Angeles Lakers",MEM:"Memphis Grizzlies",MIA:"Miami Heat",MIL:"Milwaukee Bucks",MIN:"Minnesota Timberwolves",NJN:"New Jersey Nets",
NO:"New Orleans Hornets",NY:"New York Knicks",ORL:"Orlando Magic",PHI:"Philadelphia 76ers",PHX:"Phoenix Suns",
POR:"Portland Trail Blazers",SA:"San Antonio Spurs",SAC:"Sacramento Kings",SEA:"Seattle SuperSonics",TOR:"Toronto Raptors",
UTA:"Utah Jazz",WAS:"Washington Wizards"
};
const rounds = [
{id:"first-round",name:"Primeira rodada"},
{id:"quarterfinals",name:"Semifinais de conferência"},
{id:"conference-finals",name:"Finais de conferência"}
] as const;
function score(match:BracketMatch) {
return <div className="extras-match" key={match.conference+match.round+match.homeTeam+match.awayTeam}>
{([{team:match.homeTeam,wins:match.homeWins},{team:match.awayTeam,wins:match.awayWins}]).map(side=><div className={"extras-match-team"+(match.winner===side.team?" is-winner":"")} key={side.team}>
<span className="extras-team-code">{side.team}</span><span className="extras-team-name">{teams[side.team]??side.team}</span><strong>{side.wins}</strong>
</div>)}
</div>;
}
export function SeasonExtras({seasonId}:{seasonId:SeasonKey}) {
const data=seasonId==="season-001"?archive["season-001"]:seasonId==="season-003"?archive["season-003"]:null;
if(!data)return <section className="season-extras" aria-label="Classificação e playoffs"><h2>CLASSIFICAÇÃO E PLAYOFFS.</h2><p className="extras-muted">Os dados coletivos da Temporada 02 ainda não foram enviados para publicação.</p></section>;
const finals=data.playoffs.matches.filter(m=>m.round==="nba-finals");
return <section className="season-extras" aria-label={"Classificação e playoffs de "+data.year}>
<div className="extras-heading"><span className="published-eyebrow">ARQUIVO DA LIGA · {data.year}</span><h2>CLASSIFICAÇÃO & PLAYOFFS.</h2><p className="extras-muted">Resultados extraídos dos prints do NBA 2K. As classificações são exibidas na ordem do jogo, incluindo posições de divisão que podem diferir da ordem por vitórias.</p></div>
{data.integrity.status!=="consistent"&&<div className="extras-integrity" role="note"><strong>FONTES COM DIVERGÊNCIA.</strong> {data.integrity.description}</div>}
<div className="extras-standings-grid">{(["east","west"] as Conference[]).map(conf=><div className="extras-standings-card" key={conf}>
<h3>CONFERÊNCIA {conf==="east"?"LESTE":"OESTE"}</h3>
<div className="extras-table-scroll"><table><thead><tr><th scope="col">#</th><th scope="col">EQUIPE</th><th scope="col">V</th><th scope="col">D</th><th scope="col">APROV.</th><th scope="col">PPG</th><th scope="col">PAPG</th><th scope="col">SALDO</th></tr></thead>
<tbody>{data.standings[conf].map(row=><tr key={row.team} className={row.rank<=8?"extras-qualified":""}>
<td>{row.rank}</td><td title={teams[row.team]??row.team}><span className="extras-team-code">{row.team}</span><span className="extras-team-name">{teams[row.team]??row.team}</span></td><td>{row.wins}</td><td>{row.losses}</td><td>{(row.pct*100).toFixed(1).replace(".",",")}%</td><td>{row.ppg.toFixed(1).replace(".",",")}</td><td>{row.papg.toFixed(1).replace(".",",")}</td><td>{row.diff>0?"+":""}{row.diff.toFixed(1).replace(".",",")}</td>
</tr>)}</tbody></table></div><p className="extras-key">Posições 1–8 destacadas · classificados pelos prints da temporada regular</p></div>)}</div>
<div className="extras-bracket-heading"><span className="published-eyebrow">MATA-MATA · {data.year}</span><h3>CAMINHO ATÉ O TÍTULO.</h3><p className="extras-muted">Cada confronto apresenta as vitórias nas séries, não o placar de uma partida.</p></div>
{(["west","east"] as Conference[]).map(conf=><div className="extras-conference-bracket" key={conf}><h4>{conf==="east"?"LESTE":"OESTE"}</h4><div className="extras-round-grid">{rounds.map(round=><div className="extras-round" key={round.id}><h5>{round.name}</h5>{data.playoffs.matches.filter(m=>m.conference===conf&&m.round===round.id).map(score)}</div>)}</div></div>)}
<div className="extras-finals"><span>NBA FINALS</span>{finals.map(score)}<p><strong>CAMPEÃO: {teams[data.playoffs.champion]??data.playoffs.champion}</strong></p></div>
<p className="extras-muted extras-source-note">Fontes: {seasonId==="season-001"?"cinco imagens anexadas na conversa":"cinco imagens da pasta Extras no Google Drive"}. Os resultados permanecem identificados por temporada; não foram alteradas as estatísticas individuais.</p>
</section>;
}
