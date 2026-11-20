import { useState } from "react";
import { Link } from "@tanstack/react-router";
import phaseProgression from "../../data/statistics/season-002/progression.json";
import { publishedCatalog, publishedSeasons, latestSeasonId } from "../../lib/published-catalog";
import { newRoster, type BolaoPlayer } from "../../lib/new-roster";
import { getPlayerAppearance } from "../../lib/player-selection-identity";
import "../../styles/published-statistics.css";

const approved = publishedCatalog.records.filter((record) => record.kind === "phase");
const years = publishedSeasons;
type SeasonId = string;
type PhaseRecord = (typeof approved)[number];
const phaseOrder = ["playoffs", "first-round", "quarterfinals", "conference-finals", "nba-finals"];
const phaseName: Record<string, string> = {
  playoffs: "Playoffs · Consolidado",
  "first-round": "First Round",
  quarterfinals: "Conference Semifinals",
  "conference-finals": "Conference Finals",
  "nba-finals": "NBA Finals",
};
const averages = (value: number | undefined) =>
  value === undefined ? "—" : value.toFixed(1).replace(".", ",");
const integers = (value: number | undefined) =>
  value === undefined ? "—" : new Intl.NumberFormat("pt-BR").format(value);
const percents = (value: number | undefined) => (value === undefined ? "—" : averages(value) + "%");

function recordsFor(playerId: string, seasonId: SeasonId) {
  return approved.filter((record) => record.playerId === playerId && record.seasonId === seasonId);
}
function reachedStages(playerId: string, seasonId: SeasonId): string[] {
  if (seasonId === "season-002") {
    return (
      phaseProgression.stagesByPlayer[playerId as keyof typeof phaseProgression.stagesByPlayer] ??
      []
    );
  }
  return recordsFor(playerId, seasonId)
    .filter((record) => record.phaseId !== "regular" && record.phaseId !== "playoffs")
    .map((record) => record.phaseId);
}
function ChooseSeason({ value, onChange }: { value: SeasonId; onChange: (id: SeasonId) => void }) {
  return (
    <div className="published-season-toggle" role="group" aria-label="Selecionar temporada">
      {years.map((year) => (
        <button
          key={year.id}
          type="button"
          aria-pressed={value === year.id}
          className={value === year.id ? "is-active" : ""}
          onClick={() => onChange(year.id)}
        >
          {year.title} <span>{year.year}</span>
        </button>
      ))}
    </div>
  );
}
function StatList({
  record,
  includeAverages = false,
}: {
  record: PhaseRecord;
  includeAverages?: boolean;
}) {
  const a = record.stats.averages ?? {};
  const t = record.stats.totals ?? {};
  const p = record.stats.percentages ?? {};
  const entries: [string, string][] = [
    ["Jogos disputados (GP)", integers(t.gp)],
    ["Jogos como titular (GS)", integers(t.gs)],
    ["Minutos (MIN)", integers(t.minutes)],
    ["Pontos (PTS)", integers(t.points)],
    ["Rebotes (REB)", integers(t.rebounds)],
    ["Assistências (AST)", integers(t.assists)],
    ["Roubos (STL)", integers(t.steals)],
    ["Bloqueios (BLK)", integers(t.blocks)],
    ["Turnovers (TO)", integers(t.turnovers)],
    ["Arremessos convertidos (FGM)", integers(t.fgm)],
    ["Arremessos tentados (FGA)", integers(t.fga)],
    ["Três pontos convertidos (3PM)", integers(t.threePm)],
    ["Três pontos tentados (3PA)", integers(t.threePa)],
    ["Lances livres convertidos (FTM)", integers(t.ftm)],
    ["Lances livres tentados (FTA)", integers(t.fta)],
  ];
  if (includeAverages)
    entries.push(
      ["PPG", averages(a.ppg)],
      ["RPG", averages(a.rpg)],
      ["APG", averages(a.apg)],
      ["SPG", averages(a.spg)],
      ["BPG", averages(a.bpg)],
      ["TOPG", averages(a.topg)],
      ["MPG", averages(a.mpg)],
      ["FG%", percents(p.fgPct)],
      ["3P%", percents(p.threePct)],
      ["FT%", percents(p.ftPct)],
    );
  return (
    <dl className="published-stats-list published-totals-list">
      {entries
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}
function KeyMetrics({ record }: { record: PhaseRecord }) {
  const a = record.stats.averages ?? {};
  const cards = [
    ["PONTOS", a.ppg, "PPG"],
    ["REBOTES", a.rpg, "RPG"],
    ["ASSISTÊNCIAS", a.apg, "APG"],
    ["MINUTOS", a.mpg, "MPG"],
  ] as const;
  return (
    <div className="published-key-metrics">
      {cards.map(([title, value, abbr]) => (
        <div className="published-key-card" key={abbr}>
          <span>{title}</span>
          <strong>{averages(value)}</strong>
          <small>{abbr}</small>
        </div>
      ))}
    </div>
  );
}
function PlayoffPhaseStrip({ phase, record }: { phase: string; record?: PhaseRecord }) {
  const averagesForPhase = record?.stats.averages ?? {};
  const percentages = record?.stats.percentages ?? {};
  const primaryMetrics = [
    ["MPG", "MINUTOS", averages(averagesForPhase.mpg)],
    ["PPG", "PONTOS", averages(averagesForPhase.ppg)],
    ["RPG", "REBOTES", averages(averagesForPhase.rpg)],
    ["APG", "ASSISTÊNCIAS", averages(averagesForPhase.apg)],
  ] as const;
  const efficiencyMetrics = [
    ["SPG", "ROUBOS", averages(averagesForPhase.spg)],
    ["BPG", "BLOQUEIOS", averages(averagesForPhase.bpg)],
    ["TOPG", "TURNOVERS", averages(averagesForPhase.topg)],
    ["FG%", "ARREMESSOS", percents(percentages.fgPct)],
    ["3P%", "TRÊS PONTOS", percents(percentages.threePct)],
    ["FT%", "LANCES LIVRES", percents(percentages.ftPct)],
  ] as const;
  return (
    <article className="published-round-strip" data-phase={phase}>
      <header className="published-round-strip__phase">
        <h4>{phaseName[phase] ?? phase}</h4>
        <p>{integers(record?.stats.totals?.gp)} jogos disputados</p>
      </header>
      <dl className="published-round-strip__metrics published-round-strip__metrics--primary" aria-label="Médias principais">
        {primaryMetrics.map(([metric, label, value]) => (
          <div key={metric} data-metric={metric}>
            <dt>{metric}<span>{label}</span></dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <dl className="published-round-strip__metrics published-round-strip__metrics--efficiency" aria-label="Eficiência e defesa">
        {efficiencyMetrics.map(([metric, label, value]) => (
          <div key={metric} data-metric={metric}>
            <dt>{metric}<span>{label}</span></dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {record?.coverage?.note.startsWith("DADOS FICTÍCIOS") && (
        <p className="published-note">
          <strong>RECONSTRUÇÃO FICTÍCIA:</strong> médias e percentuais estimados, não correspondem a
          boxescores observados.
        </p>
      )}
    </article>
  );
}
export function ProfileStatistics({ player, mode = "all", initialSeasonId = latestSeasonId, seasonId: controlledSeasonId, onSeasonChange }: { player: BolaoPlayer; mode?: "all" | "regular" | "playoffs"; initialSeasonId?: SeasonId; seasonId?: SeasonId; onSeasonChange?: (id: SeasonId) => void }) {
  const [localSeasonId, setLocalSeasonId] = useState<SeasonId>(initialSeasonId);
  const seasonId = controlledSeasonId ?? localSeasonId;
  const setSeasonId = onSeasonChange ?? setLocalSeasonId;
  const year = years.find((y) => y.id === seasonId)!;
  const records = recordsFor(player.id, seasonId);
  const regular = records.find((record) => record.phaseId === "regular");
  const rounds = records
    .filter((record) => record.phaseId !== "regular")
    .sort((a, b) => phaseOrder.indexOf(a.phaseId) - phaseOrder.indexOf(b.phaseId));
  const summary =
    rounds.find((record) => record.phaseId === "playoffs") ??
    rounds.find((record) => record.phaseId === "first-round");
  const stages = reachedStages(player.id, seasonId)
    .filter((phase) => phaseOrder.includes(phase) && phase !== "playoffs")
    .sort((a, b) => phaseOrder.indexOf(a) - phaseOrder.indexOf(b));
  const stageEntries = stages.map((phase) => ({
    phase,
    record: rounds.find((record) => record.phaseId === phase),
  }));
  return (
    <section className="published-stats" aria-label="Estatísticas do jogador">
      <ChooseSeason value={seasonId} onChange={setSeasonId} />
      {mode !== "playoffs" && (!regular ? (
        <div className="generation-empty">
          <h2>ESTATÍSTICAS EM BREVE.</h2>
          <p>Os registros dessa temporada ainda não foram importados.</p>
        </div>
      ) : (
        <>
          <div className="published-stats-head">
            <div>
              <span className="published-eyebrow">
                {year.title.toUpperCase()} · {year.year}
              </span>
              <h2>TEMPORADA REGULAR.</h2>
              <p>
                {integers(regular.stats.totals?.gp)} jogos · Estatísticas conferidas no NBA 2K26
              </p>
            </div>
            <Link to="/temporadas" className="published-season-link">
              Ver temporada completa ↗
            </Link>
          </div>
          <KeyMetrics record={regular} />
          <div className="published-stats-sections">
            <div className="published-stats-card">
              <h3>EFICIÊNCIA E DEFESA</h3>
              <dl className="published-stats-list published-efficiency-list">
                {(
                  [
                    ["Roubos por jogo", averages(regular.stats.averages?.spg)],
                    ["Bloqueios por jogo", averages(regular.stats.averages?.bpg)],
                    ["Turnovers por jogo", averages(regular.stats.averages?.topg)],
                    ["FG%", percents(regular.stats.percentages?.fgPct)],
                    ["3P%", percents(regular.stats.percentages?.threePct)],
                    ["FT%", percents(regular.stats.percentages?.ftPct)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {regular.stats.totals?.threePa === 0 && (
                <p className="published-note">
                  3P% exibido pelo jogo como 0,0% com zero tentativas; matematicamente, a razão é
                  indefinida.
                </p>
              )}
            </div>
            <div className="published-stats-card">
              <h3>TOTAIS DA TEMPORADA</h3>
              <StatList record={regular} />
            </div>
          </div>
          <p className="published-footnote">
            Médias e percentuais apresentados pelo jogo, totais conferidos separadamente. Sem
            rankings ou pontuações artificiais.
          </p>
        </>
      ))}
      {mode !== "regular" && (summary || stageEntries.length > 0) && (
        <div className="published-playoffs" aria-label="Campanha de playoffs">
          <div className="published-stats-head">
            <div>
              <span className="published-eyebrow">{year.title.toUpperCase()} · PÓS-TEMPORADA</span>
              <h2>PLAYOFFS.</h2>
              {summary && <p>{integers(summary.stats.totals?.gp)} jogos disputados no total</p>}
            </div>
          </div>
          {summary && (
            <>
              <KeyMetrics record={summary} />
              <section className="published-stats-card published-playoffs-summary">
                <h3>TOTAIS E MÉDIAS DOS PLAYOFFS</h3>
                <StatList record={summary} includeAverages />
              </section>
            </>
          )}
          <section className="published-rounds">
            <h3>RODADAS DISPUTADAS</h3>
            <div className="published-round-strips">
              {stageEntries.map(({ phase, record }) => (
                <PlayoffPhaseStrip key={phase} phase={phase} record={record} />
              ))}
            </div>
            <p className="published-footnote">
              O consolidado de playoffs representa a campanha inteira: não deve ser somado novamente
              às rodadas. Não são estimados totais por rodada a partir de médias arredondadas.
            </p>
          </section>
        </div>
      )}
    </section>
  );
}
export function SeasonStatistics({
  seasonId: selectedSeasonId,
  onSeasonChange,
}: { seasonId?: SeasonId; onSeasonChange?: (id: SeasonId) => void } = {}) {
  const [localSeasonId, setLocalSeasonId] = useState<SeasonId>(latestSeasonId);
  const seasonId = selectedSeasonId ?? localSeasonId;
  const setSeasonId = onSeasonChange ?? setLocalSeasonId;
  const year = years.find((y) => y.id === seasonId)!;
  const regularRecords = approved.filter(
    (record) => record.seasonId === seasonId && record.phaseId === "regular",
  );
  const playoffPlayerCount = new Set(
    approved
      .filter((record) => record.seasonId === seasonId && record.phaseId === "playoffs")
      .map((record) => record.playerId),
  );
  // For season 01, four First-Round-only players have no additional
  // aggregate record. Count them once; each campaign is one postseason.
  const playoffSet = new Set([
    ...playoffPlayerCount,
    ...approved
      .filter((record) => record.seasonId === seasonId && record.phaseId === "first-round")
      .map((record) => record.playerId),
  ]);
  const byPlayer = new Map(regularRecords.map((record) => [record.playerId, record]));
  return (
    <main className="published-season-page sports-page">
      <header className="published-season-heading">
        <span className="published-eyebrow">CENTRAL DO BOLÃO · ARQUIVO ESTATÍSTICO</span>
        <h1>{year.title.toUpperCase()}.</h1>
        <p>
          {year.year} · Temporada regular · {regularRecords.length} jogadores com estatísticas
          conferidas. {playoffSet.size} jogadores com campanha de playoffs registrada.
        </p>
      </header>
      {selectedSeasonId === undefined && <ChooseSeason value={seasonId} onChange={setSeasonId} />}
      <div className="published-season-grid">
        {newRoster.map((player) => {
          const record = byPlayer.get(player.id);
          const a = record?.stats.averages;
          const historicalTeam = getPlayerAppearance(player.id, seasonId).team;
          return (
            <Link
              to="/jogadores/$id"
              params={{ id: player.id }}
              key={player.id}
              className={
                "published-season-player" + (record ? "" : " published-season-player--pending")
              }
            >
              <img src={player.portrait} alt="" loading="lazy" />
              <div className="published-season-player-copy">
                <span>{historicalTeam}</span>
                <h2>{player.name}</h2>
                {record ? (
                  <p>
                    {averages(a?.ppg)} PPG · {averages(a?.rpg)} RPG · {averages(a?.apg)} APG
                    {playoffSet.has(player.id) ? " · Playoffs" : ""}
                  </p>
                ) : (
                  <p>Dados não importados</p>
                )}
              </div>
              <span className="published-season-player-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          );
        })}
      </div>
      <p className="published-footnote">
        Arquivo estatístico histórico · Classificações e chave dos playoffs separadas por temporada.
        Dados individuais e coletivos preservados sem extrapolações.
      </p>
    </main>
  );
}
