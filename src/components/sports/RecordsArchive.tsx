import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { publishedCatalog, publishedSeasons, latestSeasonId } from "../../lib/published-catalog";
import { getPlayerAppearance } from "../../lib/player-selection-identity";
import { newRoster } from "../../lib/new-roster";
import {
  getHistoricalLeaderboard,
  recordCategories,
  recordMetrics,
  type RankedRecord,
  type RecordCategory,
  type RecordsMode,
  type RecordsPerspective,
} from "../../lib/historical-records";
import "../../styles/recordes.css";

const playerById = new Map(newRoster.map((player) => [player.id, player]));
const seasonById = new Map(publishedSeasons.map((season) => [season.id, season]));
const phaseLabels: Record<string, string> = {
  "first-round": "First Round",
  quarterfinals: "Quarterfinals",
  "conference-finals": "Conference Finals",
  "nba-finals": "NBA Finals",
};
const playoffPhases = ["first-round", "quarterfinals", "conference-finals", "nba-finals"].filter(
  (phase) =>
    publishedCatalog.records.some((record) => record.kind === "phase" && record.phaseId === phase),
);
const appearanceCache = new Map<string, ReturnType<typeof getPlayerAppearance>>();
const historicalPlayerCount = new Set(
  publishedCatalog.records
    .filter((record) => record.kind === "phase")
    .map((record) => record.playerId),
).size;
const fictionalRecordCount = publishedCatalog.records.filter(
  (record) =>
    record.kind === "phase" &&
    record.coverage?.note.toLocaleLowerCase().includes("dados fictícios"),
).length;

const perspectives: { id: RecordsPerspective; label: string }[] = [
  { id: "career", label: "Carreira" },
  { id: "regular", label: "Temporada regular" },
  { id: "playoffs", label: "Playoffs" },
];

function appearanceFor(entry: RankedRecord) {
  const seasonId = entry.seasonId ?? entry.seasonIds.at(-1) ?? latestSeasonId;
  const key = `${entry.playerId}|${seasonId}`;
  if (!appearanceCache.has(key))
    appearanceCache.set(key, getPlayerAppearance(entry.playerId, seasonId));
  return appearanceCache.get(key)!;
}

function teamSlug(team: string) {
  return team
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function teamName(teamId: string) {
  return teamId
    .split("-")
    .map((part) => (part === "76ers" ? part : part.charAt(0).toLocaleUpperCase() + part.slice(1)))
    .join(" ");
}

function playerDetails(entry: RankedRecord) {
  const player = playerById.get(entry.playerId);
  const appearance = appearanceFor(entry);
  const matchingTeam = entry.teamIds.length === 1 && teamSlug(appearance.team) === entry.teamIds[0];
  return {
    name: player?.name ?? entry.playerId,
    image: appearance.image,
    crest: matchingTeam ? appearance.crest : undefined,
    team:
      entry.teamIds.length > 1
        ? "Múltiplas equipes"
        : entry.teamIds.length === 1
          ? matchingTeam
            ? appearance.team
            : teamName(entry.teamIds[0])
          : appearance.matched
            ? appearance.team
            : "Equipe não confirmada",
  };
}

function formatValue(value: number, metricId: string, mode: RecordsMode) {
  const metric = recordMetrics.find((item) => item.id === metricId);
  const isPercentage = Boolean(metric?.percentageKey);
  const isAverage = mode === "average" && metricId !== "games" && metricId !== "starts";
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: isPercentage || isAverage ? 1 : 0,
    maximumFractionDigits: isPercentage || isAverage ? 1 : 0,
  }).format(value);
  return isPercentage ? `${formatted}%` : formatted;
}

function seasonLabel(entry: RankedRecord, metricId?: string, perspective?: RecordsPerspective) {
  if (metricId === "scoring-leads") {
    const count = entry.seasonIds.length;
    return `${count} temporada${count === 1 ? "" : "s"} na liderança`;
  }
  const season = entry.seasonId ? seasonById.get(entry.seasonId) : undefined;
  if (season) return `${season.title} · ${season.year}`;
  if (entry.seasonIds.length > 1)
    return `${perspective === "playoffs" ? "Playoffs" : "Carreira"} · ${entry.seasonIds.length} temporadas`;
  return entry.seasonIds[0]
    ? (seasonById.get(entry.seasonIds[0])?.title ?? "Temporada")
    : "Carreira";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

function PlayerPortrait({ entry, large = false }: { entry: RankedRecord; large?: boolean }) {
  const details = playerDetails(entry);
  return (
    <span
      className={[
        "records-portrait",
        details.image && "records-portrait--with-image",
        large && "records-portrait--large",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {details.image ? (
        <img src={details.image} alt="" loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden="true">{initials(details.name)}</span>
      )}
    </span>
  );
}

function PlayerLink({ entry, children }: { entry: RankedRecord; children: React.ReactNode }) {
  const details = playerDetails(entry);
  return (
    <Link
      to="/jogadores/$id"
      params={{ id: entry.playerId }}
      className="records-player-link"
      aria-label={`Abrir perfil de ${details.name}`}
    >
      {children}
    </Link>
  );
}

export function RecordsArchive() {
  const [perspective, setPerspective] = useState<RecordsPerspective>("career");
  const [category, setCategory] = useState<RecordCategory>("scoring");
  const [metricId, setMetricId] = useState("points");
  const [mode, setMode] = useState<RecordsMode>("total");
  const [aggregateSeasons, setAggregateSeasons] = useState(false);
  const [seasonId, setSeasonId] = useState("all");
  const [phaseId, setPhaseId] = useState("playoffs");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const metric = recordMetrics.find((item) => item.id === metricId) ?? recordMetrics[0];
  const canAverage = Boolean(metric.totalKey && metric.id !== "games" && metric.id !== "starts");
  const activeMode: RecordsMode = canAverage ? mode : "total";
  const ranking = useMemo(
    () =>
      getHistoricalLeaderboard(publishedCatalog.records, {
        perspective,
        metricId,
        mode: activeMode,
        seasonId: seasonId === "all" ? undefined : seasonId,
        phaseId: perspective === "playoffs" ? phaseId : undefined,
        aggregateSeasons: activeMode === "average" && aggregateSeasons,
      }),
    [perspective, metricId, activeMode, seasonId, phaseId, aggregateSeasons],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return ranking;
    return ranking.filter((entry) => {
      const player = playerById.get(entry.playerId);
      return `${player?.name ?? entry.playerId} ${entry.playerId}`
        .toLocaleLowerCase()
        .includes(term);
    });
  }, [ranking, search]);

  const visibleCount = (() => {
    if (expanded) return filtered.length;
    let count = Math.min(5, filtered.length);
    while (count < filtered.length && filtered[count]?.rank === filtered[count - 1]?.rank) count++;
    return count;
  })();
  const visible = filtered.slice(0, visibleCount);
  const topRank = filtered[0]?.rank;
  const coLeaders = filtered.filter(
    (entry) => entry.rank === topRank && entry.value === filtered[0]?.value,
  );
  const categoryMetrics = recordMetrics.filter(
    (item) =>
      item.category === category &&
      (item.id !== "scoring-leads" || perspective === "career") &&
      (item.id !== "seasons" || (perspective === "career" && seasonId === "all")) &&
      (item.id !== "playoff-seasons" ||
        (perspective === "playoffs" && phaseId === "playoffs" && seasonId === "all")),
  );
  const seasonText =
    seasonId === "all" ? "Todas as temporadas" : (seasonById.get(seasonId)?.title ?? "Temporada");
  const perspectiveLabel =
    perspectives.find((item) => item.id === perspective)?.label ?? "Carreira";
  const isPercent = Boolean(metric.percentageKey);
  const metricCaption = isPercent
    ? "Aproveitamento"
    : activeMode === "average"
      ? `${metric.shortLabel} por jogo`
      : `${metric.shortLabel} · total`;
  const isPlayoffCareer =
    perspective === "playoffs" && phaseId === "playoffs" && seasonId === "all";
  const isRegularCareer = perspective === "career" && seasonId === "all";
  const minimumGames = isPlayoffCareer
    ? 20
    : isRegularCareer
      ? 82
      : perspective === "playoffs"
        ? phaseId === "playoffs"
          ? 10
          : 5
        : 25;
  const minimumAttempts =
    metricId === "fgPct"
      ? isPlayoffCareer
        ? 100
        : isRegularCareer
          ? 500
          : perspective === "playoffs"
            ? 50
            : 100
      : isPlayoffCareer
        ? 50
        : isRegularCareer
          ? metricId === "threePct"
            ? 100
            : 200
          : perspective === "playoffs"
            ? 25
            : 50;
  const percentThreshold = `${minimumGames} jogos e ${minimumAttempts} tentativas`;

  function chooseCategory(value: RecordCategory) {
    setCategory(value);
    const first = recordMetrics.find((item) => item.category === value);
    if (first) setMetricId(first.id);
    setExpanded(false);
  }

  return (
    <div className="records-archive">
      <header className="records-heading">
        <div>
          <p className="records-eyebrow">
            CENTRAL DO BOLÃO <span>·</span> ARQUIVO ESTATÍSTICO
          </p>
          <h1>
            RECORDES<span> DA LIGA</span>
          </h1>
          <p className="records-deck">
            As marcas individuais que atravessam {publishedSeasons.length} temporadas publicadas.
          </p>
        </div>
        <div
          className="records-archive-count"
          aria-label={`${historicalPlayerCount} jogadores com registros publicados`}
        >
          <strong>{String(historicalPlayerCount).padStart(2, "0")}</strong>
          <span>
            JOGADORES
            <br />
            NO ARQUIVO
          </span>
        </div>
      </header>

      <nav className="records-perspectives" aria-label="Perspectiva estatística">
        {perspectives.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={perspective === item.id}
            className={perspective === item.id ? "is-active" : ""}
            onClick={() => {
              setPerspective(item.id);
              if (metricId === "scoring-leads" && item.id !== "career") setMetricId("points");
              if (metricId === "seasons" && item.id !== "career") setMetricId("games");
              if (metricId === "playoff-seasons" && item.id !== "playoffs") setMetricId("games");
              setExpanded(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="records-controls" aria-label="Filtros do ranking">
        <label className="records-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Buscar jogador</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Buscar jogador"
          />
        </label>
        <label className="records-select">
          <span>Temporada</span>
          <select
            value={seasonId}
            onChange={(event) => {
              const value = event.target.value;
              setSeasonId(value);
              if (value !== "all" && (metricId === "seasons" || metricId === "playoff-seasons"))
                setMetricId("games");
            }}
          >
            <option value="all">Todas as temporadas</option>
            {publishedSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.title} · {season.year}
              </option>
            ))}
          </select>
        </label>
        <label className="records-select">
          <span>Categoria</span>
          <select
            value={category}
            onChange={(event) => chooseCategory(event.target.value as RecordCategory)}
          >
            {recordCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="records-select">
          <span>Estatística</span>
          <select value={metricId} onChange={(event) => setMetricId(event.target.value)}>
            {categoryMetrics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {perspective === "playoffs" && (
          <label className="records-select">
            <span>Fase</span>
            <select
              value={phaseId}
              onChange={(event) => {
                const value = event.target.value;
                setPhaseId(value);
                if (value !== "playoffs" && metricId === "playoff-seasons") setMetricId("games");
              }}
            >
              <option value="playoffs">Playoffs · consolidado</option>
              {playoffPhases.map((phase) => (
                <option key={phase} value={phase}>
                  {phaseLabels[phase] ?? phase}
                </option>
              ))}
            </select>
          </label>
        )}
        {canAverage && (
          <div className="records-mode" role="group" aria-label="Tipo de estatística">
            <button
              type="button"
              aria-pressed={activeMode === "total"}
              onClick={() => setMode("total")}
            >
              Totais
            </button>
            <button
              type="button"
              aria-pressed={activeMode === "average"}
              onClick={() => setMode("average")}
            >
              Médias
            </button>
          </div>
        )}
        {canAverage &&
          activeMode === "average" &&
          (perspective === "regular" || perspective === "playoffs") &&
          seasonId === "all" && (
            <div className="records-mode" role="group" aria-label="Agrupamento das médias">
              <button
                type="button"
                aria-pressed={!aggregateSeasons}
                onClick={() => setAggregateSeasons(false)}
              >
                Por temporada
              </button>
              <button
                type="button"
                aria-pressed={aggregateSeasons}
                onClick={() => setAggregateSeasons(true)}
              >
                Geral
              </button>
            </div>
          )}
      </section>

      <div className="records-results-meta">
        <span>
          {perspectiveLabel} <i>·</i> {seasonText}
        </span>
        <span>
          {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
        </span>
      </div>
      {filtered.some((entry) => entry.approximate) && (
        <p className="records-approximation">
          Média geral aproximada: ponderada pelos jogos a partir das médias arredondadas publicadas.
        </p>
      )}

      {coLeaders.length > 0 ? (
        <section
          className={
            coLeaders.length > 1 ? "records-feature records-feature--shared" : "records-feature"
          }
          aria-label="Líder do ranking"
        >
          <div className="records-feature-copy">
            <p className="records-eyebrow">
              {topRank && topRank > 1
                ? `POSIÇÃO ${String(topRank).padStart(2, "0")}`
                : coLeaders.length > 1
                  ? "LIDERANÇA COMPARTILHADA"
                  : "LÍDER DO ARQUIVO"}
              <span> · </span>
              {metricCaption.toLocaleUpperCase()}
            </p>
            <strong className="records-feature-value">
              {formatValue(filtered[0].value, metricId, activeMode)}
            </strong>
            <span className="records-feature-label">{metric.label}</span>
            {coLeaders.length === 1 ? (
              <>
                <PlayerLink entry={coLeaders[0]}>
                  <h2>{playerDetails(coLeaders[0]).name}</h2>
                </PlayerLink>
                <p className="records-feature-subtitle">
                  {playerDetails(coLeaders[0]).team} <span>·</span>{" "}
                  {seasonLabel(coLeaders[0], metricId, perspective)}
                </p>
              </>
            ) : (
              <ul className="records-coleaders">
                {coLeaders.map((entry) => (
                  <li key={entry.key}>
                    <PlayerLink entry={entry}>
                      <PlayerPortrait entry={entry} />
                      {playerDetails(entry).name}
                    </PlayerLink>
                    <span>{seasonLabel(entry, metricId, perspective)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="records-feature-facts">
              <span>
                {coLeaders.length > 1
                  ? `${coLeaders.length} recordistas empatados`
                  : `Posição ${String(coLeaders[0].rank).padStart(2, "0")}`}
              </span>
              {coLeaders.length === 1 && coLeaders[0].games !== undefined && (
                <span>{coLeaders[0].games} jogos</span>
              )}
            </div>
          </div>
          {coLeaders.length === 1 && (
            <PlayerLink entry={coLeaders[0]}>
              <PlayerPortrait entry={coLeaders[0]} large />
            </PlayerLink>
          )}
          <span className="records-feature-mark" aria-hidden="true">
            01
          </span>
        </section>
      ) : (
        <div className="records-empty">
          <span className="records-empty-mark" aria-hidden="true">
            —
          </span>
          <h2>Sem registros suficientes.</h2>
          <p>Esta combinação de filtros não possui dados publicados com a amostra necessária.</p>
        </div>
      )}

      <section className="records-ranking" aria-labelledby="records-ranking-title">
        <div className="records-section-heading">
          <div>
            <p className="records-eyebrow">RANKING HISTÓRICO</p>
            <h2 id="records-ranking-title">
              {metric.label}
              <span>
                {" "}
                · {activeMode === "average" ? "MÉDIAS" : isPercent ? "APROVEITAMENTO" : "TOTAIS"}
              </span>
            </h2>
          </div>
          <span>
            {filtered.length} {filtered.length === 1 ? "posição" : "posições"}
          </span>
        </div>
        <ol className="records-list">
          {visible.map((entry) => {
            const details = playerDetails(entry);
            return (
              <li
                key={entry.key}
                className={entry.rank === 1 ? "records-row records-row--leader" : "records-row"}
              >
                <span className="records-rank">{String(entry.rank).padStart(2, "0")}</span>
                <PlayerLink entry={entry}>
                  <PlayerPortrait entry={entry} />
                </PlayerLink>
                <div className="records-row-player">
                  <PlayerLink entry={entry}>
                    <strong>{details.name}</strong>
                  </PlayerLink>
                  <span className="records-row-team">
                    {details.crest && (
                      <img
                        src={details.crest}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    )}
                    {details.team}
                  </span>
                </div>
                <span className="records-row-season">
                  {seasonLabel(entry, metricId, perspective)}
                </span>
                <span className="records-row-games">
                  {entry.games === undefined ? "—" : `${entry.games} J`}
                </span>
                <strong className="records-row-value">
                  {formatValue(entry.value, metricId, activeMode)}
                </strong>
              </li>
            );
          })}
        </ol>
        {filtered.length > 5 && (
          <button className="records-expand" type="button" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Mostrar menos" : `Ver ranking completo · ${filtered.length}`}
            {expanded ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </section>

      <footer className="records-methodology">
        <span>BASE DE DADOS</span>
        <p>
          Temporada regular e playoffs são mantidos separados. Médias de carreira usam totais
          divididos pelos jogos;{" "}
          {isPercent
            ? `este aproveitamento exige ao menos ${percentThreshold}`
            : "aproveitamentos têm amostras mínimas por jogos e tentativas"}
          . Linhas sem os campos necessários e rodadas marcadas como reconstrução fictícia são
          omitidas. Jogos individuais não estão publicados.
          {fictionalRecordCount > 0 &&
            ` ${fictionalRecordCount} ${fictionalRecordCount === 1 ? "registro marcado" : "registros marcados"} como reconstrução fictícia ${fictionalRecordCount === 1 ? "foi excluído" : "foram excluídos"}.`}
        </p>
      </footer>
    </div>
  );
}
