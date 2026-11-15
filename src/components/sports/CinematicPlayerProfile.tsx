import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { getPlayerAppearance } from "../../lib/player-selection-identity";
import { publishedCatalog, publishedSeasons, latestSeasonId } from "../../lib/published-catalog";
import type { BolaoPlayer } from "../../lib/new-roster";
import { HistoricalPortrait } from "./HistoricalPortrait";
import { ProfileStatistics } from "./PublishedStatistics";
import "../../styles/cinematic-player-profile.css";

const scenes = [
  { id: "overview", label: "Visão geral", eyebrow: "O PROTAGONISTA", title: "O JOGADOR" },
  { id: "regular", label: "Temporadas", eyebrow: "REGULAR SEASON", title: "A TEMPORADA" },
  { id: "playoffs", label: "Playoffs", eyebrow: "PÓS-TEMPORADA", title: "A CAMPANHA" },
  { id: "career", label: "Carreira", eyebrow: "O LEGADO", title: "A CARREIRA" },
] as const;

const number = (value: number | undefined, decimals = 0) =>
  value === undefined || !Number.isFinite(value) ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function CinematicPlayerProfile({ player }: { player: BolaoPlayer }) {
  const [scene, setScene] = useState(0);
  const [seasonId, setSeasonId] = useState(latestSeasonId);
  const [expanded, setExpanded] = useState(false);
  const identity = getPlayerAppearance(player.id, seasonId);
  const team = identity.team;
  const palette = identity.identity;
  const photo = identity.image;

  const all = publishedCatalog.records.filter((record) => record.kind === "phase").filter((record) => record.playerId === player.id);
  const current = all.find((record) => record.seasonId === seasonId && record.phaseId === "regular");
  const currentPlayoffs = all.find((record) => record.seasonId === seasonId && record.phaseId === "playoffs")
    ?? all.find((record) => record.seasonId === seasonId && record.phaseId === "first-round");
  const regularRecords = all.filter((record) => record.phaseId === "regular");
  const career = useMemo(() => {
    const totals = regularRecords.reduce((sum, record) => {
      const t = record.stats.totals;
      sum.gp += t?.gp ?? 0;
      sum.points += t?.points ?? 0;
      sum.rebounds += t?.rebounds ?? 0;
      sum.assists += t?.assists ?? 0;
      sum.steals += t?.steals ?? 0;
      sum.blocks += t?.blocks ?? 0;
      return sum;
    }, { gp: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 });
    return totals;
  }, [regularRecords]);
  const selectedSeason = publishedSeasons.find((s) => s.id === seasonId);
  const show = scene === 1 ? current : scene === 2 ? currentPlayoffs : undefined;
  const stats = scene === 3
    ? [
        ["JOGOS", number(career.gp)],
        ["PONTOS", number(career.points)],
        ["REBOTES", number(career.rebounds)],
        ["ASSIST.", number(career.assists)],
        ["PPG", career.gp ? number(career.points / career.gp, 1) : "—"],
        ["RPG", career.gp ? number(career.rebounds / career.gp, 1) : "—"],
      ]
    : scene === 0
      ? [
          ["TEMPORADAS", number(regularRecords.length)],
          ["JOGOS", number(career.gp)],
          ["PPG", career.gp ? number(career.points / career.gp, 1) : "—"],
          ["RPG", career.gp ? number(career.rebounds / career.gp, 1) : "—"],
          ["APG", career.gp ? number(career.assists / career.gp, 1) : "—"],
          ["PONTOS", number(career.points)],
        ]
      : [
          ["JOGOS", number(show?.stats.totals?.gp)],
          ["PPG", number(show?.stats.averages?.ppg, 1)],
          ["RPG", number(show?.stats.averages?.rpg, 1)],
          ["APG", number(show?.stats.averages?.apg, 1)],
          ["FG%", number(show?.stats.percentages?.fgPct, 1)],
          ["3P%", number(show?.stats.percentages?.threePct, 1)],
        ];
  const theme = {
    ...identity.theme,
    "--profile-primary": palette?.primary ?? "#5a9cb8",
    "--profile-accent": palette?.light ?? "#7dc8db",
    "--profile-deep": palette?.deep ?? "#0a131a",
    "--profile-glow": palette?.base ?? "#183544",
  } as CSSProperties;
  function changeScene(next: number) {
    setScene(Math.max(0, Math.min(scenes.length - 1, next)));
    setExpanded(false);
  }
  return (
    <main className="cinematic-player" style={theme}>
      <div className="cinematic-player-shell">
        <header className="cinematic-player-navigation">
          <Link to="/jogadores" className="cinematic-player-back"><ArrowLeft size={16} /> JOGADORES</Link>
          <nav aria-label="Seções do perfil">
            {scenes.map((item, index) => (
              <button key={item.id} type="button" className={scene === index ? "is-active" : ""}
                aria-current={scene === index ? "page" : undefined} onClick={() => changeScene(index)}>
                {item.label}
              </button>
            ))}
          </nav>
          <span className="cinematic-player-index">{String(scene + 1).padStart(2, "0")} / 04</span>
        </header>
        <section className={`cinematic-player-stage cinematic-player-stage--${scenes[scene].id}`}
          aria-labelledby="cinematic-player-heading">
          <div className="cinematic-player-ghost" aria-hidden="true">
            {photo && <img src={photo} alt="" />}
          </div>
          <div className="cinematic-player-info">
            <span className="cinematic-player-eyebrow">CENTRAL DO BOLÃO / {scenes[scene].eyebrow}</span>
            <p className="cinematic-player-firstname">{player.name.split(" ").slice(0, -1).join(" ") || player.name}</p>
            <h1 id="cinematic-player-heading">{scene === 0 ? (player.name.split(" ").at(-1) ?? player.name) : scenes[scene].title}</h1>
            <div className="cinematic-player-identity">
              {identity?.crest && <img key={identity.crest} src={identity.crest} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              <div>
                <strong>{team}</strong>
                <span>{identity?.number ? `#${identity.number} · ` : ""}{player.name}</span>
              </div>
            </div>
            {scene === 1 || scene === 2 ? (
              <div className="cinematic-player-year">
                <label htmlFor="cinematic-season">TEMPORADA</label>
                <select id="cinematic-season" value={seasonId} onChange={(event) => {setSeasonId(event.target.value);setExpanded(false);}}>
                  {publishedSeasons.map((year) => <option key={year.id} value={year.id}>{year.year}</option>)}
                </select>
                <p>{selectedSeason?.title ?? ""} · {scene === 1 ? "Temporada regular" : "Campanha de playoffs"}</p>
              </div>
            ) : (
              <p className="cinematic-player-description">
                {scene === 0 ? "Uma trajetória. Cada temporada conta uma história." : "O histórico completo de uma carreira."}
              </p>
            )}
          </div>
          <div className="cinematic-player-art" aria-hidden="true">
            <HistoricalPortrait playerId={player.id} image={photo} name={player.name} />
          </div>
          <div className="cinematic-player-scoreboard" aria-label="Indicadores do jogador">
            {stats.map(([label, value]) => <div key={label} className="cinematic-player-stat">
              <span>{label}</span><strong>{value}</strong>
            </div>)}
          </div>
        </section>
        <section className="cinematic-player-content" aria-label="Informações detalhadas">
          {(scene === 1 || scene === 2) && (
            <>
              <button className="cinematic-player-expand" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
                {expanded ? "OCULTAR ESTATÍSTICAS COMPLETAS" : "VER ESTATÍSTICAS COMPLETAS"} {expanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </button>
              {expanded && <div className="cinematic-player-details"><ProfileStatistics key={seasonId} player={player} mode={scene === 1 ? "regular" : "playoffs"} seasonId={seasonId} onSeasonChange={setSeasonId}/></div>}
            </>
          )}
          {scene === 3 && <div className="cinematic-player-career-details">
            <div><span>TEMPORADAS PUBLICADAS</span><strong>{number(regularRecords.length)}</strong></div>
            <div><span>ROUBOS DE BOLA</span><strong>{number(career.steals)}</strong></div>
            <div><span>TOCOS</span><strong>{number(career.blocks)}</strong></div>
            <p>Totais acumulados da temporada regular nas temporadas publicadas. Médias por jogo calculadas a partir dos totais de jogos; playoffs não entram nesta soma.</p>
          </div>}
        </section>
      </div>
    </main>
  );
}
