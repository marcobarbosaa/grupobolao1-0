import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { players as records } from "../../lib/mock-data";
import { playerRoster } from "../../lib/player-data";
import { filterPlayers } from "../../lib/player-adapter";
import type { PlayerFilters } from "../../lib/player-types";
import { PlayerPortrait } from "../home/PlayerPortrait";
import { SectionHeader } from "./SectionHeader";

export function PlayerSelection({
  filters,
  onFilterChange,
}: {
  filters: PlayerFilters;
  onFilterChange: (next: PlayerFilters) => void;
}) {
  const filtered = filterPlayers(playerRoster, filters);
  const [selected, setSelected] = useState(playerRoster[0].id);
  const [viewport, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const sync = useCallback(() => {
    setCanPrev(api?.canScrollPrev() ?? false);
    setCanNext(api?.canScrollNext() ?? false);
  }, [api]);
  useEffect(() => {
    if (!api) return;
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api, sync]);
  const player = filtered.find((p) => p.id === selected) ?? filtered[0];
  const raw = records.find((p) => String(p.id) === player?.id);
  const change = (update: Partial<PlayerFilters>) => onFilterChange({ ...filters, ...update });
  const teams = [...new Set(playerRoster.flatMap((p) => p.teamNames))].sort();
  const positions = [...new Set(playerRoster.flatMap((p) => p.positions))].sort();
  return (
    <div className="sports-page player-selection">
      <SectionHeader
        eyebrow="O ELENCO / NBA DOS CRIAS"
        title="ESCOLHA SUA LENDA."
        description="Treze protagonistas. Nenhuma trajetória igual. Entre na história de quem fez a liga."
      />
      <div className="selection-filters">
        <label className="sports-select selection-search">
          Buscar jogador
          <input
            type="search"
            value={filters.q ?? ""}
            placeholder="Encontre um nome…"
            onChange={(e) => change({ q: e.target.value || undefined })}
          />
        </label>
        <label className="sports-select">
          Equipe
          <select
            aria-label="Equipe"
            value={filters.team ?? ""}
            onChange={(e) => change({ team: e.target.value || undefined })}
          >
            <option value="">Todas as equipes</option>
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="sports-select">
          Posição registrada
          <select
            aria-label="Posição registrada"
            value={filters.position ?? ""}
            onChange={(e) => change({ position: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {positions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="sports-select">
          Ordem
          <select
            aria-label="Ordem"
            value={filters.order ?? ""}
            onChange={(e) =>
              change({ order: (e.target.value || undefined) as "az" | "za" | undefined })
            }
          >
            <option value="">Ordem do acervo</option>
            <option value="az">Nome A–Z</option>
            <option value="za">Nome Z–A</option>
          </select>
        </label>
      </div>
      <div className="selection-toolbar">
        <p className="eyebrow" role="status">
          {filtered.length} JOGADORES / SELECIONE UMA CARTA
        </p>
        <div className="sports-actions">
          <button
            className="icon-button"
            disabled={!canPrev}
            onClick={() =>
              api?.scrollPrev(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            }
            aria-label="Jogadores anteriores"
          >
            <ArrowLeft />
          </button>
          <button
            className="icon-button"
            disabled={!canNext}
            onClick={() =>
              api?.scrollNext(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            }
            aria-label="Próximos jogadores"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      {player && raw ? (
        <>
          <div className="selection-viewport" ref={viewport}>
            <div className="selection-track">
              {filtered.map((p, i) => {
                const record = records.find((r) => String(r.id) === p.id)!;
                return (
                  <button
                    key={p.id}
                    className={`athlete-card ${p.id === player.id ? "is-selected" : ""}`}
                    aria-pressed={p.id === player.id}
                    aria-controls="selected-athlete"
                    aria-label={`Selecionar ${p.name}`}
                    onFocus={() =>
                      api?.scrollTo(
                        i,
                        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                      )
                    }
                    onClick={() => {
                      setSelected(p.id);
                      api?.scrollTo(
                        i,
                        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                      );
                    }}
                  >
                    <PlayerPortrait
                      player={p}
                      priority={i === 0}
                      sizes="(max-width: 700px) 75vw, 25vw"
                      decorative
                    />
                    <span className="athlete-grade">
                      {record.scoreTotal.toFixed(2)}
                      <small>LEGADO</small>
                    </span>
                    <div className="athlete-card-copy">
                      <span className="eyebrow">{p.position}</span>
                      <h2>{p.name}</h2>
                      <p>{p.archetype}</p>
                      <span className="athlete-card-award">
                        {p.rings} TÍTULOS · {p.seasons} TEMPORADAS
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <section
            id="selected-athlete"
            className="selected-athlete"
            key={player.id}
            aria-live="polite"
          >
            <div>
              <p className="eyebrow sports-kicker">JOGADOR SELECIONADO / {player.archetype}</p>
              <h2>{player.name}</h2>
              <p>{player.teams}</p>
              <dl className="selection-facts">
                <div>
                  <dt>Legado / 10</dt>
                  <dd>{raw.scoreTotal.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Títulos</dt>
                  <dd>{player.rings}</dd>
                </div>
                <div>
                  <dt>Temporadas</dt>
                  <dd>{player.seasons}</dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="selection-bio">
                {player.biography.match(/^.*?[.!?](?:\s|$)/)?.[0] ?? player.biography}
              </p>
              <ul className="selection-awards">
                {player.awards.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    {a.count}× {a.label}
                  </li>
                ))}
              </ul>
              <Link className="sports-button" to="/jogadores/$id" params={{ id: player.id }}>
                Abrir perfil completo <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
          <p className="sports-note">
            A nota de legado é uma métrica da liga. As cartas exibem conquistas registradas, sem
            categorias artificiais de raridade.
          </p>
        </>
      ) : (
        <div className="selection-empty">
          <h2>Nenhum jogador nesta seleção.</h2>
          <button className="sports-button" onClick={() => onFilterChange({})}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
