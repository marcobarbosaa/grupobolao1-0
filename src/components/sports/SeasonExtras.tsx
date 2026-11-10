import { useState } from "react";
import "./SeasonExtras.css";

type Team = { code: string; name: string; wins: number; losses: number; pct: number; gb: string; home: string; away: string; conf: string; div: string; ppg: number; opp: number; diff: number; streak: string };
type Matchup = { a: string; b: string; sa: number; sb: number };
const western: Team[] = [
["PHX","Phoenix Suns",63,19,.768,"—","32-9","31-10","39-13","11-5",116.0,103.2,12.8,"L2"],
["SA","San Antonio Spurs",57,25,.695,"6.0","28-13","29-12","35-17","11-5",111.4,102.8,8.6,"W2"],
["MIN","Minnesota Timberwolves",51,31,.622,"12.0","29-12","22-19","36-16","12-4",108.0,103.0,5.0,"W4"],
["LAL","Los Angeles Lakers",53,29,.646,"10.0","30-11","23-18","36-16","11-5",110.6,103.7,6.9,"L1"],
["NO","New Orleans Hornets",46,36,.561,"17.0","25-16","21-20","29-23","7-9",109.6,108.3,1.4,"L2"],
["SEA","Seattle SuperSonics",46,36,.561,"17.0","26-15","20-21","33-19","13-3",110.5,107.0,3.4,"L1"],
["LAC","Los Angeles Clippers",45,37,.549,"18.0","29-12","16-25","28-24","7-9",106.4,104.3,2.1,"W6"],
["POR","Portland Trail Blazers",43,39,.524,"20.0","23-18","20-21","24-28","8-8",103.3,102.9,.4,"W2"],
["MEM","Memphis Grizzlies",42,40,.512,"21.0","23-18","19-22","28-24","9-7",104.0,104.6,-.7,"W3"],
["DAL","Dallas Mavericks",33,49,.402,"30.0","16-25","17-24","22-30","8-8",99.1,105.0,-5.9,"L1"],
["SAC","Sacramento Kings",32,50,.390,"31.0","16-25","16-25","21-31","7-9",103.7,108.9,-5.2,"L2"],
["GS","Golden State Warriors",31,51,.378,"32.0","16-25","15-26","21-31","4-12",100.5,105.8,-5.3,"W2"],
["HOU","Houston Rockets",29,53,.354,"34.0","18-23","11-30","21-31","5-11",100.3,106.2,-5.9,"W1"],
["DEN","Denver Nuggets",18,64,.220,"45.0","12-29","6-35","10-42","3-13",99.2,112.5,-13.3,"L2"],
["UTAH","Utah Jazz",13,69,.159,"50.0","5-36","8-33","7-45","4-12",97.9,109.4,-11.5,"L8"]
].map(row => fromRow(row));
const eastern: Team[] = [
["DET","Detroit Pistons",56,26,.683,"—","26-15","30-11","35-17","11-5",109.4,101.9,7.6,"L3"],
["ORL","Orlando Magic",55,27,.671,"1.0","30-11","25-16","36-16","11-5",113.7,106.7,7.0,"W3"],
["NY","New York Knicks",47,35,.573,"9.0","27-14","20-21","28-24","6-10",106.6,102.5,4.2,"W2"],
["CHI","Chicago Bulls",45,37,.549,"11.0","26-15","19-22","28-24","8-8",108.9,105.2,3.7,"W2"],
["WAS","Washington Wizards",44,38,.537,"12.0","26-15","18-23","28-24","9-7",104.9,104.6,.3,"W1"],
["BOS","Boston Celtics",43,39,.524,"13.0","23-18","20-21","28-24","8-8",106.3,106.1,.1,"W1"],
["TOR","Toronto Raptors",43,39,.524,"13.0","25-16","18-23","27-25","10-6",108.1,107.0,1.1,"L4"],
["MIL","Milwaukee Bucks",43,39,.524,"13.0","27-14","16-25","25-27","9-7",106.2,103.8,2.4,"W1"],
["CLE","Cleveland Cavaliers",43,39,.524,"13.0","23-18","20-21","28-24","8-8",106.6,104.8,1.8,"L1"],
["CHA","Charlotte Bobcats",40,42,.488,"16.0","22-19","18-23","23-29","4-12",104.3,108.2,-3.9,"L4"],
["PHI","Philadelphia 76ers",38,44,.463,"18.0","21-20","17-24","24-28","7-9",102.4,104.1,-1.7,"W2"],
["MIA","Miami Heat",37,45,.451,"19.0","23-18","14-27","25-27","8-8",103.1,103.8,-.6,"L3"],
["NJN","New Jersey Nets",36,46,.439,"20.0","19-22","17-24","24-28","9-7",97.5,100.5,-3.0,"L8"],
["ATL","Atlanta Hawks",35,47,.427,"21.0","22-19","13-28","18-34","8-8",103.5,106.9,-3.4,"W3"],
["IND","Indiana Pacers",23,59,.280,"33.0","11-30","12-29","13-39","4-12",100.7,109.2,-8.5,"L1"]
].map(row => fromRow(row));
function fromRow(row: (string | number)[]): Team { const [code,name,wins,losses,pct,gb,home,away,conf,div,ppg,opp,diff,streak]=row; return {code:String(code),name:String(name),wins:Number(wins),losses:Number(losses),pct:Number(pct),gb:String(gb),home:String(home),away:String(away),conf:String(conf),div:String(div),ppg:Number(ppg),opp:Number(opp),diff:Number(diff),streak:String(streak)}; }
const names = Object.fromEntries([...western,...eastern].map(t=>[t.code,t.name]));
// Historical 2006–07 identity: first year each emblem was in use.
// Source: https://www.logocdn.com/nba/ (era-by-era logo archive).
// Do not reuse modern NBA IDs: relocations/rebrands change the artwork.
const historicalLogos2006: Record<string, { year: number; slug: string }> = {
  ATL: { year: 1995, slug: "atlanta-hawks" },
  BOS: { year: 1996, slug: "boston-celtics" },
  CHA: { year: 2004, slug: "charlotte-bobcats" },
  CHI: { year: 1966, slug: "chicago-bulls" },
  CLE: { year: 2003, slug: "cleveland-cavaliers" },
  DAL: { year: 2001, slug: "dallas-mavericks" },
  DEN: { year: 2003, slug: "denver-nuggets" },
  DET: { year: 2005, slug: "detroit-pistons" },
  GS: { year: 1997, slug: "golden-state-warriors" },
  HOU: { year: 2003, slug: "houston-rockets" },
  IND: { year: 2005, slug: "indiana-pacers" },
  LAC: { year: 1984, slug: "los-angeles-clippers" },
  LAL: { year: 2001, slug: "los-angeles-lakers" },
  MEM: { year: 2004, slug: "memphis-grizzlies" },
  MIA: { year: 1999, slug: "miami-heat" },
  MIL: { year: 2006, slug: "milwaukee-bucks" },
  MIN: { year: 1996, slug: "minnesota-timberwolves" },
  NJN: { year: 1997, slug: "new-jersey-nets" },
  NO: { year: 2005, slug: "new-orleans-oklahoma-city-hornets" },
  NY: { year: 1995, slug: "new-york-knicks" },
  ORL: { year: 2000, slug: "orlando-magic" },
  PHI: { year: 1997, slug: "philadelphia-76ers" },
  PHX: { year: 2000, slug: "phoenix-suns" },
  POR: { year: 2004, slug: "portland-trail-blazers" },
  SAC: { year: 1994, slug: "sacramento-kings" },
  SA: { year: 2002, slug: "san-antonio-spurs" },
  SEA: { year: 2001, slug: "seattle-supersonics" },
  TOR: { year: 1995, slug: "toronto-raptors" },
  UTAH: { year: 2004, slug: "utah-jazz" },
  WAS: { year: 1997, slug: "washington-wizards" },
};
function historicalLogoSrc(code: string): string | undefined {
  const logo = historicalLogos2006[code];
  return logo ? `https://i.logocdn.com/nba/${logo.year}/${logo.slug}@3x.png` : undefined;
}
const west: Matchup[][] = [
[{a:"PHX",b:"POR",sa:4,sb:0},{a:"LAL",b:"NO",sa:4,sb:2},{a:"MIN",b:"SEA",sa:4,sb:1},{a:"SA",b:"LAC",sa:4,sb:3}],
[{a:"PHX",b:"LAL",sa:4,sb:2},{a:"MIN",b:"SA",sa:4,sb:2}],
[{a:"PHX",b:"MIN",sa:3,sb:4}]
];
const east: Matchup[][] = [
[{a:"DET",b:"MIL",sa:4,sb:3},{a:"CHI",b:"WAS",sa:0,sb:4},{a:"NY",b:"BOS",sa:4,sb:3},{a:"ORL",b:"TOR",sa:3,sb:4}],
[{a:"DET",b:"WAS",sa:4,sb:3},{a:"NY",b:"TOR",sa:4,sb:2}],
[{a:"DET",b:"NY",sa:2,sb:4}]
];
function Logo({code}:{code:string}){ const [failed,setFailed]=useState(false); const src=historicalLogoSrc(code);return <span className="seasonextras-logo">{!src||failed?<span aria-hidden="true">{code}</span>:<img loading="lazy" alt="" src={src} onError={()=>setFailed(true)}/>}</span>;}
const columns: {key:keyof Team; label:string}[]=[{key:"wins",label:"V"},{key:"losses",label:"D"},{key:"pct",label:"%"},{key:"gb",label:"GB"},{key:"home",label:"Casa"},{key:"away",label:"Fora"},{key:"conf",label:"Conf."},{key:"div",label:"Div."},{key:"ppg",label:"PPG"},{key:"opp",label:"PAPG"},{key:"diff",label:"Saldo"},{key:"streak",label:"Seq."}];
function Standings(){const [conference,setConference]=useState<"west"|"east">("west");const teams=conference==="west"?western:eastern;return <section className="seasonextras-panel" aria-label="Classificação 2006–07"><div className="seasonextras-header"><div><p className="seasonextras-kicker">2006–07 / temporada regular</p><h2>Classificação da liga</h2><p>As 30 franquias, com os dados registrados na temporada do Bolão.</p></div><div className="seasonextras-toggle" role="group" aria-label="Conferência"><button type="button" aria-pressed={conference==="west"} onClick={()=>setConference("west")}>Oeste</button><button type="button" aria-pressed={conference==="east"} onClick={()=>setConference("east")}>Leste</button></div></div><div className="seasonextras-tablewrap" role="region" tabIndex={0} aria-label="Classificação: deslize para ver todas as estatísticas"><table className="seasonextras-table"><thead><tr><th scope="col">#</th><th scope="col">Time</th>{columns.map(c=><th scope="col" key={c.key}>{c.label}</th>)}</tr></thead><tbody>{teams.map((team,index)=><tr key={team.code} className={index<8?"seasonextras-qualified":""}><td>{index+1}</td><th scope="row"><div className="seasonextras-team"><Logo code={team.code}/><span>{team.name}</span>{index<8&&<span className="seasonextras-playoff-label" title="Classificado aos playoffs">P</span>}</div></th>{columns.map(c=><td key={c.key}>{c.key==="pct"?team.pct.toFixed(3).replace(/^0/,""):["ppg","opp","diff"].includes(c.key)?Number(team[c.key]).toFixed(1):String(team[c.key])}</td>)}</tr>)}</tbody></table></div><p className="seasonextras-note">P = classificado aos playoffs. A ordem segue a classificação oficial do save no NBA 2K (incluindo critérios de divisão), não apenas o número de vitórias. Dados extraídos das capturas do Bolão.</p></section>}
function Series({match}:{match:Matchup}){return <div className="seasonextras-series" aria-label={`${names[match.a]} ${match.sa}, ${names[match.b]} ${match.sb}`}>{([["a","sa"],["b","sb"]] as const).map(([key,score])=>{const code=match[key];const winner=match[score]>match[score==="sa"?"sb":"sa"];return <div className={`seasonextras-side ${winner?"is-winner":""}`} key={code}><Logo code={code}/><span className="seasonextras-side-name">{names[code]}</span><strong>{match[score]}</strong></div>})}</div>}
function Playoffs(){return <section className="seasonextras-panel" aria-label="Chaveamento dos playoffs 2006–07"><div className="seasonextras-header"><div><p className="seasonextras-kicker">2006–07 / pós-temporada</p><h2>O caminho até o título</h2><p>Todos os confrontos e placares das séries.</p></div></div><div className="seasonextras-champion"><span className="seasonextras-kicker">Campeão NBA 2007</span><div><Logo code="NY"/><strong>New York Knicks</strong></div><span>Final: Knicks 4–0 Timberwolves</span></div><div className="seasonextras-bracket" role="region" tabIndex={0} aria-label="Chaveamento completo; deslize horizontalmente"><div className="seasonextras-conference"><h3>Conferência Oeste</h3><div className="seasonextras-rounds">{west.map((round,index)=><div className="seasonextras-round" key={index}><h4>{["First Round","Semifinais","Final do Oeste"][index]}</h4><div className="seasonextras-matches">{round.map((match,j)=><Series match={match} key={j}/>)}</div></div>)}</div></div><div className="seasonextras-final"><h3>NBA FINALS</h3><Series match={{a:"NY",b:"MIN",sa:4,sb:0}}/></div><div className="seasonextras-conference"><h3>Conferência Leste</h3><div className="seasonextras-rounds seasonextras-rounds-east">{east.map((round,index)=><div className="seasonextras-round" key={index}><h4>{["First Round","Semifinais","Final do Leste"][index]}</h4><div className="seasonextras-matches">{round.map((match,j)=><Series match={match} key={j}/>)}</div></div>)}</div></div></div><p className="seasonextras-note">As séries representam os resultados do universo NBA 2K do Grupo Bolão, não os playoffs históricos da NBA real.</p></section>}
export function SeasonExtras(){const [view,setView]=useState<"standings"|"playoffs">("standings");return <div className="seasonextras"><nav className="seasonextras-nav" aria-label="Extras da temporada"><button type="button" aria-pressed={view==="standings"} onClick={()=>setView("standings")}>Classificação 2006–07</button><button type="button" aria-pressed={view==="playoffs"} onClick={()=>setView("playoffs")}>Chaveamento 2006–07</button></nav>{view==="standings"?<Standings/>:<Playoffs/>}</div>}
