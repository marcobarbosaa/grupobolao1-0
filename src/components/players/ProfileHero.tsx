import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft } from "lucide-react";
import type { PlayerPresentation } from "../../lib/player-types";
import { PlayerPortrait } from "../home/PlayerPortrait";

export function ProfileHero({ player }: { player: PlayerPresentation }) {
  return (
    <>
      <div className="profile-breadcrumb site-container">
        <Link to="/jogadores" className="text-link">
          <ArrowLeft size={16} aria-hidden="true" /> Todos os protagonistas
        </Link>
        <span className="eyebrow">O ACERVO / PERFIL {player.id.padStart(2, "0")}</span>
      </div>
      <section
        className={`profile-hero site-container tone-${player.tone}`}
        aria-labelledby="profile-name"
      >
        <div
          className="profile-hero-image"
          style={{ viewTransitionName: `player-portrait-${player.id}` }}
        >
          <PlayerPortrait player={player} priority sizes="(max-width: 767px) 100vw, 55vw" />
          <span className="profile-photo-stamp eyebrow">GRUPO BOLÃO / ACERVO DA LIGA</span>
        </div>
        <div className="profile-hero-copy">
          <p className="eyebrow section-kicker">
            {player.position} <span>/</span> {player.archetype}
          </p>
          <h1 id="profile-name" className={player.name.length > 12 ? "long-name" : undefined}>
            {player.name}
            <span aria-hidden="true">.</span>
          </h1>
          <p className="profile-teams">{player.teams}</p>
          <div className="profile-headline-facts">
            <div>
              <strong>{String(player.seasons).padStart(2, "0")}</strong>
              <span>TEMPORADAS</span>
            </div>
            {player.rings > 0 && (
              <div className="fact-gold">
                <strong>{String(player.rings).padStart(2, "0")}</strong>
                <span>{player.rings === 1 ? "TÍTULO DA NBA" : "TÍTULOS DA NBA"}</span>
              </div>
            )}
          </div>
          <p className="profile-hero-invitation">
            O nome você conhece.
            <br />
            Agora, descubra a trajetória.
          </p>
          <a href="#o-atleta" className="text-link">
            Entre na história <ArrowDown size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
      <nav className="profile-chapters" aria-label="Capítulos da carreira">
        <div className="site-container">
          {[
            { id: "o-atleta", label: "O atleta" },
            { id: "o-legado", label: "O legado" },
            { id: "evolucao", label: "Evolução" },
            { id: "estatisticas", label: "Estatísticas" },
            { id: "a-trajetoria-continua", label: "Continue explorando" },
          ].map((chapter, index) => (
            <a href={`#${chapter.id}`} key={chapter.id}>
              <span>0{index + 1}</span>
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
