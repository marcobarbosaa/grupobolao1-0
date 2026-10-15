import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { formatStat, phases, type PhaseId, type PlayerSeason } from "../../lib/player-types";
import { StatNotice } from "./StatNotice";

type EvolutionMetric = "pts" | "reb" | "ast";
const evolutionMetrics: { id: EvolutionMetric; label: string }[] = [
  { id: "pts", label: "Pontos" },
  { id: "reb", label: "Rebotes" },
  { id: "ast", label: "Assistências" },
];

function EvolutionChart({
  seasons,
  selectedId,
  phase,
  metric,
}: {
  seasons: PlayerSeason[];
  selectedId: number;
  phase: PhaseId;
  metric: EvolutionMetric;
}) {
  const titleId = useId();
  const points = seasons.map((season) =>
    season.phases[phase].status === "available" ? season.phases[phase].values[metric] : undefined,
  );
  const maximum = Math.max(
    5,
    Math.ceil(Math.max(...points.filter((point): point is number => point !== undefined), 0) / 5) *
      5,
  );
  if (!points.some((point) => point !== undefined))
    return (
      <p className="chart-empty">
        A evolução será exibida quando houver números desta fase no acervo.
      </p>
    );
  const x = (index: number) => 42 + (index * 738) / Math.max(1, seasons.length - 1);
  const y = (value: number) => 185 - (value / maximum) * 155;
  const line = points
    .map((value, index) =>
      value === undefined
        ? ""
        : `${index === 0 || points[index - 1] === undefined ? "M" : "L"}${x(index)},${y(value)}`,
    )
    .join(" ");
  return (
    <svg className="career-chart" viewBox="0 0 810 225" role="img" aria-labelledby={titleId}>
      <title id={titleId}>
        {`${evolutionMetrics.find((item) => item.id === metric)?.label} por jogo ao longo da carreira. Selecione uma temporada na linha do tempo para consultar o valor. Lacunas indicam dados ausentes.`}
      </title>
      {[0, maximum / 2, maximum].map((tick) => (
        <g key={tick}>
          <line x1="42" x2="780" y1={y(tick)} y2={y(tick)} className="chart-gridline" />
          <text x="24" y={y(tick) + 4} textAnchor="end">
            {formatStat(tick, 0)}
          </text>
        </g>
      ))}
      <path d={line} className="chart-line" />
      {points.map((value, index) =>
        value === undefined ? null : (
          <g key={seasons[index].id}>
            <circle
              cx={x(index)}
              cy={y(value)}
              r={seasons[index].id === selectedId ? 6 : 2.5}
              className={seasons[index].id === selectedId ? "chart-point-selected" : "chart-point"}
            >
              <title>{`${seasons[index].year}: ${formatStat(value)}`}</title>
            </circle>
            {seasons[index].id === selectedId && (
              <line
                x1={x(index)}
                x2={x(index)}
                y1={y(value) + 10}
                y2="185"
                className="chart-selection"
              />
            )}
          </g>
        ),
      )}
      <text x="42" y="215">
        {seasons[0]?.year}
      </text>
      <text x="780" y="215" textAnchor="end">
        {seasons.at(-1)?.year}
      </text>
    </svg>
  );
}

export function CareerTimeline({
  seasons,
  selectedId,
  onSelect,
}: {
  seasons: PlayerSeason[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const [phase, setPhase] = useState<PhaseId>("regular");
  const [metric, setMetric] = useState<EvolutionMetric>("pts");
  const rail = useRef<HTMLDivElement>(null);
  const selectedIndex = seasons.findIndex((season) => season.id === selectedId);
  const selected = seasons[selectedIndex];
  if (!selected)
    return (
      <section id="evolucao" className="site-container section-space">
        <h2>Evolução da carreira</h2>
        <p>As temporadas deste jogador ainda não estão disponíveis.</p>
      </section>
    );
  const stats = selected.phases[phase];
  const current = stats.values[metric];
  const previous = seasons[selectedIndex - 1];
  const prior = previous?.phases[phase];
  const previousValue = prior?.status === "available" ? prior.values[metric] : undefined;
  const delta =
    stats.status === "available" &&
    current !== undefined &&
    previousValue !== undefined &&
    previous?.id === selected.id - 1
      ? current - previousValue
      : undefined;
  const select = (index: number, focus = false) => {
    const season = seasons[index];
    if (!season) return;
    onSelect(season.id);
    const button = rail.current?.querySelector<HTMLButtonElement>(`[data-year="${season.id}"]`);
    if (button && rail.current) {
      rail.current.scrollTo({
        left: button.offsetLeft - rail.current.clientWidth / 2 + button.clientWidth / 2,
        behavior: "instant",
      });
      if (focus) button.focus({ preventScroll: true });
    }
  };
  return (
    <section
      id="evolucao"
      className="profile-evolution section-space"
      aria-labelledby="evolution-title"
    >
      <div className="site-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-kicker">03 / EVOLUÇÃO DA CARREIRA</p>
            <h2 id="evolution-title">
              ANO A ANO.
              <br />
              <span>LANCE A LANCE.</span>
            </h2>
          </div>
          <label className="player-select">
            Fase da trajetória
            <select value={phase} onChange={(event) => setPhase(event.target.value as PhaseId)}>
              {phases.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="career-season-rail"
          role="group"
          aria-label="Temporadas da carreira"
          ref={rail}
        >
          {seasons.map((season, index) => (
            <button
              key={season.id}
              data-year={season.id}
              aria-pressed={season.id === selectedId}
              aria-controls="career-context"
              onClick={() => select(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? Math.min(index + 1, seasons.length - 1)
                    : event.key === "ArrowLeft"
                      ? Math.max(0, index - 1)
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? seasons.length - 1
                          : undefined;
                if (next !== undefined) {
                  event.preventDefault();
                  select(next, true);
                }
              }}
            >
              <span />
              {season.year}
              <small>{String(season.id).padStart(2, "0")}</small>
            </button>
          ))}
        </div>
        <div className="career-evolution-layout">
          <div
            className="career-context"
            id="career-context"
            aria-live="polite"
            aria-atomic="true"
            key={`${selectedId}-${phase}-${metric}`}
          >
            <span className="eyebrow">TEMPORADA {String(selected.id).padStart(2, "0")}</span>
            <h3>{selected.year}</h3>
            <p className="career-team">{selected.team}</p>
            {stats.status === "available" ? (
              <>
                <div className="career-main-stat">
                  <strong>{formatStat(current)}</strong>
                  <span>
                    {evolutionMetrics.find((item) => item.id === metric)?.label}
                    <br />
                    por jogo
                  </span>
                </div>
                <p className="career-delta">
                  {delta === undefined
                    ? "Sem base disponível para comparar com a temporada anterior."
                    : `${delta > 0 ? "+" : ""}${formatStat(delta)} em relação a ${previous.year}`}
                </p>
                <p className="career-games">
                  {stats.values.gp === undefined
                    ? "Jogos não informados"
                    : `${stats.values.gp} jogos nesta fase`}
                </p>
              </>
            ) : (
              <StatNotice status={stats.status} />
            )}
            {selected.awards.length > 0 && (
              <div className="career-awards">
                {selected.awards.map((award) => (
                  <span key={award.id}>{award.label}</span>
                ))}
              </div>
            )}
          </div>
          <div className="career-chart-panel">
            <div className="metric-selector" role="group" aria-label="Métrica de evolução">
              {evolutionMetrics.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={metric === item.id}
                  onClick={() => setMetric(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <EvolutionChart
              seasons={seasons}
              selectedId={selectedId}
              phase={phase}
              metric={metric}
            />
            <p className="chart-source">
              Médias por jogo · {phases.find((item) => item.id === phase)?.label}
              <br />
              Somente temporadas com estatísticas disponíveis. Lacunas não são zeros.
            </p>
          </div>
        </div>
        <div className="career-timeline-bottom">
          <a href="#estatisticas" className="text-link">
            Ver os números desta temporada <ArrowDown size={16} aria-hidden="true" />
          </a>
          <div>
            <button
              className="icon-button"
              disabled={selectedIndex <= 0}
              onClick={() => select(selectedIndex - 1)}
              aria-label="Temporada anterior da carreira"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              disabled={selectedIndex >= seasons.length - 1}
              onClick={() => select(selectedIndex + 1)}
              aria-label="Próxima temporada da carreira"
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
