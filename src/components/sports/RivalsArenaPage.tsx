import { useState, type CSSProperties } from "react";
import { ArrowLeftRight, RotateCcw, Swords, UserRound } from "lucide-react";
import { newRoster } from "../../lib/new-roster";
import { latestSeasonId, publishedCatalog, publishedSeasons } from "../../lib/published-catalog";
import { getPlayerAppearance } from "../../lib/player-selection-identity";
import {
  comparisonModes,
  comparisonMetrics,
  compareMetric,
  formatMetric,
  getSeasonRecord,
  metricValue,
  summarizeComparison,
  type ComparisonMetric,
} from "../../lib/rivals-arena";
import type { StatisticalRecord } from "../../lib/statistics/derived-types";
import "../../styles/rivals-arena.css";

function RivalSelector({
  side,
  value,
  excluded,
  onChange,
}: {
  side: string;
  value: string;
  excluded: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const options = newRoster.filter(
    (p) => normalize(p.name).includes(normalize(query)) || p.id === value,
  );
  return (
    <fieldset className="rival-selector">
      <legend>Jogador {side}</legend>
      <input
        type="search"
        aria-label={`Buscar jogador ${side}`}
        placeholder="Buscar por nome…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={`Selecionar jogador ${side}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery("");
        }}
      >
        <option value="">Escolha um protagonista</option>
        {options.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === excluded}>
            {p.name}
            {p.id === excluded ? " · já selecionado" : ""}
          </option>
        ))}
      </select>
      {!options.some((p) => p.id !== value && p.id !== excluded) && query && (
        <small>Nenhum outro jogador encontrado.</small>
      )}
    </fieldset>
  );
}
function PlayerVersusCard({
  playerId,
  seasonId,
  side,
}: {
  playerId: string;
  seasonId: string;
  side: string;
}) {
  const player = newRoster.find((p) => p.id === playerId);
  const appearance = getPlayerAppearance(playerId, seasonId);
  const [failedImage, setFailedImage] = useState<string>();
  const [failedCrest, setFailedCrest] = useState<string>();
  const season = publishedSeasons.find((s) => s.id === seasonId);
  return (
    <article
      className="rival-card"
      style={
        {
          "--rival-primary": appearance.identity.primary,
          "--rival-surface": appearance.identity.surface,
        } as CSSProperties
      }
    >
      <span className="rival-card__side">DESAFIANTE {side}</span>
      <div className="rival-card__portrait">
        {player && appearance.image && failedImage !== appearance.image ? (
          <img
            src={appearance.image}
            alt={`${player.name} · ${appearance.team}`}
            onError={() => setFailedImage(appearance.image)}
          />
        ) : (
          <UserRound aria-hidden="true" size={96} />
        )}
      </div>
      <div className="rival-card__identity">
        {player && appearance.crest && failedCrest !== appearance.crest && (
          <img
            className="rival-card__crest"
            src={appearance.crest}
            alt={`Escudo ${appearance.team}`}
            onError={() => setFailedCrest(appearance.crest)}
          />
        )}
        <div>
          <h2>{player?.name ?? `Jogador ${side}`}</h2>
          <p>{player ? appearance.team : "Escolha quem entra na Arena"}</p>
          <small>
            {season?.title} · {season?.year}
          </small>
        </div>
      </div>
    </article>
  );
}
function ComparisonMetricRow({
  metric,
  a,
  b,
}: {
  metric: ComparisonMetric;
  a?: StatisticalRecord;
  b?: StatisticalRecord;
}) {
  const left = metricValue(a, metric),
    right = metricValue(b, metric);
  const winner = compareMetric(left, right, metric.key === "topg");
  const max = Math.max(left ?? 0, right ?? 0, 1);
  return (
    <div className="arena-metric" role="listitem">
      <div className="arena-metric__value" data-winner={winner === "a"}>
        <strong>{formatMetric(left, metric)}</strong>
        <small>{winner === "a" ? "Vantagem" : "\u00a0"}</small>
        <div className="arena-bar" aria-hidden="true">
          <i style={{ width: `${((left ?? 0) / max) * 100}%`, background: "var(--color-a)" }} />
        </div>
      </div>
      <div className="arena-metric__label">
        <b>{metric.label}</b>
        <span>{metric.name}</span>
        <small>
          {winner === "tie" ? "Empate" : winner === "unavailable" ? "Sem comparação" : ""}
        </small>
      </div>
      <div className="arena-metric__value" data-winner={winner === "b"}>
        <strong>{formatMetric(right, metric)}</strong>
        <small>{winner === "b" ? "Vantagem" : "\u00a0"}</small>
        <div className="arena-bar" aria-hidden="true">
          <i style={{ width: `${((right ?? 0) / max) * 100}%`, background: "var(--color-b)" }} />
        </div>
      </div>
    </div>
  );
}
export function RivalsArenaPage() {
  const [playerA, setPlayerA] = useState("marco-barbosa");
  const [playerB, setPlayerB] = useState("nando");
  const [seasonId, setSeasonId] = useState(latestSeasonId);
  const a = getSeasonRecord(publishedCatalog.records, playerA, seasonId);
  const b = getSeasonRecord(publishedCatalog.records, playerB, seasonId);
  const nameA = newRoster.find((p) => p.id === playerA)?.name ?? "Jogador A";
  const nameB = newRoster.find((p) => p.id === playerB)?.name ?? "Jogador B";
  const summary = summarizeComparison(a, b);
  const season = publishedSeasons.find((s) => s.id === seasonId);
  const ready = !!playerA && !!playerB;
  return (
    <div
      className="rivals-arena"
      style={
        {
          "--color-a": getPlayerAppearance(playerA, seasonId).identity.primary,
          "--color-b": getPlayerAppearance(playerB, seasonId).identity.primary,
        } as CSSProperties
      }
    >
      <header className="arena-heading">
        <div>
          <p className="arena-eyebrow">COMPARAR · DOIS PROTAGONISTAS, UMA ARENA</p>
          <h1>
            ARENA DOS <em>RIVAIS</em>
          </h1>
          <p>Compare temporadas, carreiras e campanhas entre os protagonistas da liga.</p>
          <small>
            Escolha os rivais e a temporada. Descubra quem se destaca em cada categoria.
          </small>
        </div>
        <Swords aria-hidden="true" />
      </header>
      <section className="arena-controls" aria-label="Configurar comparação">
        <RivalSelector side="A" value={playerA} excluded={playerB} onChange={setPlayerA} />
        <RivalSelector side="B" value={playerB} excluded={playerA} onChange={setPlayerB} />
        <div className="arena-context">
          <label>
            Modo
            <select aria-label="Modo" value="season" onChange={() => {}}>
              {comparisonModes.map((mode) => (
                <option key={mode.id} value={mode.id} disabled={!mode.enabled}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Temporada
            <select
              aria-label="Temporada"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
            >
              {publishedSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} · {s.year}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="arena-actions">
          <button
            disabled={!playerA && !playerB}
            onClick={() => {
              setPlayerA(playerB);
              setPlayerB(playerA);
            }}
          >
            <ArrowLeftRight size={16} />
            Inverter lados
          </button>
          <button
            onClick={() => {
              setPlayerA("");
              setPlayerB("");
            }}
          >
            <RotateCcw size={16} />
            Limpar
          </button>
        </div>
      </section>
      <section className="arena-versus" aria-label="Confronto da temporada">
        <PlayerVersusCard key={`a-${playerA}`} playerId={playerA} seasonId={seasonId} side="A" />
        <div className="arena-versus__center">
          <span>TEMPORADA</span>
          <strong>VS</strong>
          <span>{season?.year}</span>
          <small>Regular</small>
        </div>
        <PlayerVersusCard key={`b-${playerB}`} playerId={playerB} seasonId={seasonId} side="B" />
      </section>
      {!ready ? (
        <div className="arena-empty" role="status">
          <Swords aria-hidden="true" />
          <h2>Monte o próximo confronto</h2>
          <p>Selecione dois jogadores para comparar suas temporadas.</p>
        </div>
      ) : (
        <>
          <section className="arena-statistics" aria-labelledby="arena-stats-title">
            <header>
              <p className="arena-eyebrow">O CONFRONTO EM NÚMEROS</p>
              <h2 id="arena-stats-title">Categoria por categoria</h2>
              <p>
                Temporada regular · {season?.title} · {season?.year}
              </p>
            </header>
            {(!a || !b) && (
              <p className="arena-notice" role="status">
                Sem estatísticas publicadas nesta temporada para{" "}
                {!a && !b ? `${nameA} e ${nameB}` : !a ? nameA : nameB}. Dados ausentes não contam
                como empate.
              </p>
            )}
            <div className="arena-stat-names">
              <b>{nameA}</b>
              <span>PRINCIPAIS</span>
              <b>{nameB}</b>
            </div>
            <div role="list" aria-label="Métricas principais">
              {comparisonMetrics.slice(0, 9).map((metric) => (
                <ComparisonMetricRow key={metric.key} metric={metric} a={a} b={b} />
              ))}
            </div>
            <details className="arena-secondary">
              <summary>Mais da temporada · jogos e turnovers</summary>
              <div role="list" aria-label="Métricas complementares">
                {comparisonMetrics.slice(9).map((metric) => (
                  <ComparisonMetricRow key={metric.key} metric={metric} a={a} b={b} />
                ))}
              </div>
            </details>
          </section>
          <section className="arena-summary" aria-label="Resumo do confronto" aria-live="polite">
            <p className="arena-eyebrow">RESUMO DO CONFRONTO</p>
            <h2>
              {summary.a + summary.b + summary.tie === 0
                ? "Aguardando dados para o confronto"
                : summary.a === summary.b
                  ? "Equilíbrio na Arena"
                  : `${summary.a > summary.b ? nameA : nameB} lidera nas categorias`}
            </h2>
            <div className="arena-score">
              <p>
                <strong>{summary.a}</strong>
                <span>
                  {nameA}
                  <small>categorias vencidas</small>
                </span>
              </p>
              <p>
                <strong>{summary.tie}</strong>
                <span>Empates</span>
              </p>
              <p>
                <strong>{summary.b}</strong>
                <span>
                  {nameB}
                  <small>categorias vencidas</small>
                </span>
              </p>
            </div>
            <p>
              Contagem das 9 métricas principais, com o mesmo peso. MPG indica tempo em quadra; a
              contagem não define o melhor jogador.
              {summary.unavailable > 0 &&
                ` ${summary.unavailable} categoria(s) sem dados comparáveis.`}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
