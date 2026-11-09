import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { newRoster, type BolaoPlayer } from "../../lib/new-roster";

import { GenerationHero } from "../home/GenerationHero";
import { SeasonSpotlight } from "../home/SeasonSpotlight";
import { ExploreUniverse } from "../home/ExploreUniverse";
import { VersusShowcase } from "../home/VersusShowcase";
import { LeagueJourney } from "../home/LeagueJourney";
import "../../styles/home-portal.css";

type PortraitVariant = "card" | "profile";

export function NewPortrait({
  player,
  priority = false,
  variant = "card",
}: {
  player: BolaoPlayer;
  priority?: boolean;
  variant?: PortraitVariant;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`generation-portrait generation-portrait--${variant}`}>
      {failed ? (
        <span className="generation-initials" role="img" aria-label={player.name}>
          {player.name
            .split(" ")
            .map((word) => word[0])
            .slice(0, 2)
            .join("")}
        </span>
      ) : (
        <img
          src={player.portrait}
          srcSet={player.portraitSet}
          sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 28vw"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          alt={player.name}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function GenerationHome() {
  return (
    <div className="generation-page">
      <GenerationHero />
      <SeasonSpotlight />
      <ExploreUniverse />
      <VersusShowcase />
      <LeagueJourney />
    </div>
  );
}

export function GenerationRoster({ compact = false }: { compact?: boolean }) {
  const Heading = compact ? "h2" : "h1";
  return (
    <section
      id="novo-elenco"
      className="generation-roster site-container"
      aria-labelledby="roster-heading"
    >
      <header className="generation-heading">
        <div>
          <Heading id="roster-heading">
            {compact ? "CONHEÇA O ELENCO." : "OS NOVOS PROTAGONISTAS."}
          </Heading>
          <p>Os 13 jogadores da nova geração da Central do Bolão.</p>
        </div>
      </header>
      <div className="generation-grid">
        {newRoster.map((player) => (
          <Link
            key={player.id}
            to="/jogadores/$id"
            params={{ id: player.id }}
            className="generation-card"
          >
            <NewPortrait player={player} variant="card" />
            <div className="generation-card-info">
              <h2>{player.name}</h2>
              <p>{player.team}</p>
            </div>
            <ArrowUpRight className="generation-card-arrow" size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function GenerationProfile({ player }: { player: BolaoPlayer }) {
  return (
    <div className="generation-profile">
      <Link to="/jogadores" className="text-link">
        ← Voltar aos jogadores
      </Link>
      <section className="generation-profile-hero">
        <NewPortrait player={player} priority variant="profile" />
        <div className="generation-profile-copy">
          <h1>{player.name}</h1>
          <p className="generation-team">{player.team}</p>
          <p>Nova geração da Central do Bolão.</p>
        </div>
      </section>
      <section className="generation-empty">
        <h2>TRAJETÓRIA EM CONSTRUÇÃO.</h2>
        <p>
          As informações de carreira, estatísticas por fase e premiações ainda não foram importadas.
        </p>
      </section>
    </div>
  );
}

export function GenerationPending({ title, description }: { title: string; description: string }) {
  return (
    <main className="generation-pending sports-page">
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="generation-empty">
        <h2>DADOS AINDA NÃO IMPORTADOS.</h2>
        <p>
          Esta área receberá informações verificadas da nova geração. Nenhum registro da liga
          anterior é utilizado.
        </p>
        <Link to="/jogadores" className="sports-button">
          Conhecer os jogadores <ArrowUpRight size={17} />
        </Link>
      </div>
    </main>
  );
}
