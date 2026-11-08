import { useState } from "react";
import {
  dataStatusLabels,
  formatStat,
  metrics,
  phases,
  type MetricGroup,
  type PhaseId,
  type PlayerSeason,
} from "../../lib/player-types";
import { StatNotice } from "./StatNotice";

export function PlayerStatistics({
  seasons,
  selectedId,
  onSelect,
}: {
  seasons: PlayerSeason[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const [phase, setPhase] = useState<PhaseId>("regular");
  const [group, setGroup] = useState<MetricGroup>("averages");
  const [allSeasons, setAllSeasons] = useState(true);
  const selected = seasons.find((season) => season.id === selectedId);
  if (!selected) return null;
  const current = selected.phases[phase];
  const rows = allSeasons ? seasons : [selected];
  const groupMetrics = metrics.filter((metric) => metric.group === group);
  const hasGroupData = rows.some(
    (season) =>
      season.phases[phase].status === "available" &&
      groupMetrics.some((metric) => season.phases[phase].values[metric.id] !== undefined),
  );
  const tableMetrics = metrics.filter(
    (metric) =>
      metric.group === "all" ||
      (metric.group === group &&
        (group === "averages" ||
          rows.some((season) => season.phases[phase].values[metric.id] !== undefined))),
  );

  return (
    <section
      id="estatisticas"
      className="profile-statistics section-space site-container"
      aria-labelledby="statistics-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow section-kicker">04 / ESTATÍSTICAS COMPLETAS</p>
          <h2 id="statistics-title">
            A HISTÓRIA
            <br />
            <span>EM NÚMEROS.</span>
          </h2>
        </div>
        <p className="section-intro">
          Cada número tem um contexto.
          <br />
          Escolha a temporada e a fase.
        </p>
      </div>
      <div className="statistics-controls">
        <label className="player-select">
          Temporada das estatísticas
          <select value={selectedId} onChange={(event) => onSelect(Number(event.target.value))}>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.year} · {season.team}
              </option>
            ))}
          </select>
        </label>
        <label className="player-select">
          Fase das estatísticas
          <select value={phase} onChange={(event) => setPhase(event.target.value as PhaseId)}>
            {phases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="statistics-summary"
        aria-live="polite"
        aria-atomic="true"
        key={`${selectedId}-${phase}`}
      >
        <p className="eyebrow statistics-context">
          {selected.year} / {selected.team} / {phases.find((item) => item.id === phase)?.label}
        </p>
        {current.status === "available" ? (
          <>
            <dl className="broadcast-stats">
              {metrics
                .filter((metric) => ["pts", "reb", "ast", "stl", "blk", "topg"].includes(metric.id))
                .map((metric) => (
                  <div key={metric.id}>
                    <dt>{metric.label}</dt>
                    <dd
                      aria-label={
                        current.values[metric.id] === undefined ? "Não informado" : undefined
                      }
                    >
                      {formatStat(current.values[metric.id])}
                    </dd>
                    <span>POR JOGO</span>
                  </div>
                ))}
            </dl>
            <p className="stats-caption">
              {current.values.gp === undefined
                ? "Número de jogos não informado."
                : `${current.values.gp} jogos disputados.`}{" "}
              <span>— indica informação ausente.</span>
            </p>
          </>
        ) : (
          <StatNotice status={current.status} />
        )}
      </div>
      <details className="statistics-detail">
        <summary>
          Consultar estatísticas detalhadas <span aria-hidden="true">+</span>
        </summary>
        <div className="statistics-table-controls">
          <div className="metric-selector" role="group" aria-label="Tipo de estatística">
            {[
              { id: "averages", label: "Médias" },
              { id: "totals", label: "Totais" },
              { id: "percentages", label: "Aproveitamentos" },
            ].map((item) => (
              <button
                key={item.id}
                aria-pressed={group === item.id}
                onClick={() => setGroup(item.id as MetricGroup)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="season-scope">
            <input
              type="checkbox"
              checked={allSeasons}
              onChange={(event) => setAllSeasons(event.target.checked)}
            />{" "}
            Todas as temporadas
          </label>
        </div>
        {hasGroupData ? (
          <div
            className="statistics-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabela de estatísticas com rolagem horizontal"
          >
            <table>
              <caption>
                {group === "averages"
                  ? "Médias por jogo"
                  : group === "totals"
                    ? "Totais registrados"
                    : "Aproveitamentos registrados"}{" "}
                · {phases.find((item) => item.id === phase)?.label}. Traço significa informação
                ausente.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Temporada</th>
                  <th scope="col">Equipe</th>
                  {tableMetrics.map((metric) => (
                    <th scope="col" key={metric.id}>
                      <abbr title={metric.label}>{metric.short}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((season) => {
                  const stats = season.phases[phase];
                  return (
                    <tr
                      key={season.id}
                      className={season.id === selectedId ? "is-current" : undefined}
                    >
                      <th scope="row">{season.year}</th>
                      <td>{season.team}</td>
                      {stats.status === "available" ? (
                        tableMetrics.map((metric) => (
                          <td key={metric.id}>
                            {formatStat(stats.values[metric.id], metric.decimals)}
                            {metric.group === "percentages" && stats.values[metric.id] !== undefined
                              ? "%"
                              : ""}
                          </td>
                        ))
                      ) : (
                        <td colSpan={tableMetrics.length} className="table-missing">
                          {dataStatusLabels[stats.status]}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="statistics-group-empty" role="status">
            <h3>
              {group === "averages"
                ? "Nenhuma média disponível nesta seleção."
                : group === "totals"
                  ? "Totais ainda não disponíveis."
                  : "Aproveitamentos ainda não disponíveis."}
            </h3>
            <p>
              {group === "totals"
                ? "Os totais, duplos-duplos e triplos-duplos serão apresentados quando forem registrados. Médias arredondadas não são convertidas em totais."
                : group === "percentages"
                  ? "Os percentuais de arremessos, três pontos e lances livres serão exibidos quando houver registros."
                  : "Escolha outra fase ou temporada. A falta de estatísticas não confirma que o jogador deixou de disputar esta fase."}
            </p>
          </div>
        )}
      </details>
      <p className="statistics-source">
        Fonte: acervo importado por temporada. Médias agregadas de carreira aguardam revisão do
        histórico e da ponderação por jogos. Nenhuma média simples entre temporadas é apresentada.
      </p>
    </section>
  );
}
