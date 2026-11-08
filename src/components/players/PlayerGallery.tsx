import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { PlayerFilters, PlayerPresentation } from "../../lib/player-types";
import { filterPlayers } from "../../lib/player-adapter";
import { PlayerPortrait } from "../home/PlayerPortrait";
import { usePlayerMotion } from "./usePlayerMotion";

export function PlayerGallery({
  players,
  filters,
  onFilterChange,
}: {
  players: PlayerPresentation[];
  filters: PlayerFilters;
  onFilterChange: (filters: PlayerFilters) => void;
}) {
  const [featuredId, setFeaturedId] = useState(players[0]?.id);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const motion = usePlayerMotion();
  const filtered = filterPlayers(players, filters);
  const featured = players.find((player) => player.id === featuredId) ?? players[0];
  const teams = [...new Set(players.flatMap((player) => player.teamNames))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const positions = [...new Set(players.flatMap((player) => player.positions))].sort();
  const activeFilters = Boolean(filters.q || filters.team || filters.position || filters.order);
  const change = (update: Partial<PlayerFilters>) => onFilterChange({ ...filters, ...update });

  return (
    <div className="players-page player-gallery">
      <section className="gallery-opening site-container" aria-labelledby="gallery-title">
        <div className="gallery-opening-copy">
          <p className="eyebrow section-kicker">O ELENCO / GRUPO BOLÃO</p>
          <h1 id="gallery-title">
            OS
            <br />
            <span>PROTAGONISTAS.</span>
          </h1>
          <p>Cada jogador tem uma história. Conheça aqueles que construíram o legado da liga.</p>
          <a href="#elenco" className="text-link">
            Encontre sua próxima história <ArrowDown size={17} aria-hidden="true" />
          </a>
          <div className="roster-edition">
            <strong>{String(players.length).padStart(2, "0")}</strong>
            <span>
              JOGADORES.
              <br />
              INÚMERAS HISTÓRIAS.
            </span>
          </div>
        </div>
        {featured && (
          <div className={`gallery-feature tone-${featured.tone}`} key={featured.id}>
            <PlayerPortrait player={featured} priority sizes="(max-width: 767px) 90vw, 40vw" />
            <span className="gallery-feature-label eyebrow">EM DESTAQUE / {featured.position}</span>
            <div className="gallery-feature-caption" aria-live="polite">
              <span className="eyebrow">{featured.seasons} TEMPORADAS NO ACERVO</span>
              <h2>{featured.name}</h2>
              <p>{featured.teams}</p>
              <Link
                to="/jogadores/$id"
                params={{ id: featured.id }}
                className="text-link"
                viewTransition={motion}
              >
                Explorar a carreira <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </section>
      <section id="elenco" className="roster-section site-container" aria-label="Elenco da liga">
        <div className="roster-filter-bar">
          <label className="roster-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar jogador por nome</span>
            <input
              type="search"
              value={filters.q ?? ""}
              onChange={(event) => change({ q: event.target.value || undefined })}
              placeholder="Quem você quer conhecer?"
              autoComplete="off"
            />
          </label>
          <button
            className="roster-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="roster-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" /> Filtros
            {(filters.team || filters.position || filters.order) && (
              <span className="filter-indicator" />
            )}
          </button>
          <div id="roster-filters" className={`roster-filters ${filtersOpen ? "is-open" : ""}`}>
            <label>
              Equipe
              <select
                value={filters.team ?? ""}
                onChange={(event) => change({ team: event.target.value || undefined })}
              >
                <option value="">Todas as equipes</option>
                {teams.map((team) => (
                  <option key={team}>{team}</option>
                ))}
              </select>
            </label>
            <label>
              Posição
              <select
                value={filters.position ?? ""}
                onChange={(event) => change({ position: event.target.value || undefined })}
              >
                <option value="">Todas as posições</option>
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <label>
              Ordenação
              <select
                value={filters.order ?? ""}
                onChange={(event) =>
                  change({ order: (event.target.value || undefined) as PlayerFilters["order"] })
                }
              >
                <option value="">Ordem do acervo</option>
                <option value="az">Nome: A–Z</option>
                <option value="za">Nome: Z–A</option>
              </select>
            </label>
          </div>
        </div>
        <div className="roster-results">
          <p role="status" aria-live="polite">
            <b>{String(filtered.length).padStart(2, "0")}</b> de {players.length} jogadores
          </p>
          {activeFilters ? (
            <button className="text-link" onClick={() => onFilterChange({})}>
              Limpar filtros <X size={14} aria-hidden="true" />
            </button>
          ) : (
            <span>ESCOLHA UM NOME. DESCUBRA UM LEGADO.</span>
          )}
        </div>
        {filtered.length ? (
          <div className="roster-list" key={JSON.stringify(filters)}>
            {filtered.map((player, index) => (
              <article
                key={player.id}
                className={`roster-player ${player.id === featuredId ? "is-featured" : ""}`}
              >
                <Link
                  to="/jogadores/$id"
                  params={{ id: player.id }}
                  viewTransition={motion}
                  className="roster-player-link"
                  aria-label={`Conhecer ${player.name}`}
                >
                  <div
                    className="roster-player-image"
                    style={{ viewTransitionName: `player-portrait-${player.id}` }}
                  >
                    <PlayerPortrait
                      player={player}
                      sizes="(max-width: 559px) 90vw, (max-width: 1023px) 45vw, 34vw"
                    />
                  </div>
                  <div className="roster-player-caption">
                    <span className="eyebrow">
                      {player.position} <span>/</span> {player.archetype}
                    </span>
                    <h2>{player.name}</h2>
                    <p>{player.teams}</p>
                    <span className="roster-player-cta">
                      Conhecer a história <ArrowUpRight size={20} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
                <span className="roster-player-index">{String(index + 1).padStart(2, "0")}</span>
                <button
                  className="roster-highlight"
                  aria-label={`Destacar ${player.name}`}
                  aria-pressed={player.id === featuredId}
                  onClick={() => setFeaturedId(player.id)}
                >
                  {player.id === featuredId ? "EM DESTAQUE" : "DESTACAR"}
                </button>
              </article>
            ))}
            <aside className="roster-outro">
              <p className="eyebrow">MAIS QUE UM ELENCO</p>
              <p>
                O JOGO
                <br />
                NOS REÚNE.
                <br />
                <span>
                  A HISTÓRIA
                  <br />
                  NOS CONECTA.
                </span>
              </p>
              <Link to="/temporadas" className="text-link">
                Revisite as temporadas <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        ) : (
          <div className="roster-empty">
            <span className="eyebrow">NENHUM RESULTADO</span>
            <h2>
              OUTRO NOME.
              <br />
              UMA NOVA BUSCA.
            </h2>
            <p>Nenhum jogador corresponde a estes filtros. Tente outro nome, equipe ou posição.</p>
            <button className="editorial-button" onClick={() => onFilterChange({})}>
              Ver todos os jogadores <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
