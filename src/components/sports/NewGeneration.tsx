import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Trophy } from "lucide-react";
import { newRoster, type BolaoPlayer } from "../../lib/new-roster";

type PortraitVariant = "card" | "hero" | "profile";

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
          {player.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
        </span>
      ) : (
        <>
          {variant === "hero" && (
            <img
              className="generation-portrait-backdrop"
              src={player.portrait}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
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
        </>
      )}
    </div>
  );
}

export function GenerationHome() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (manualPause || isHovering || hasFocus || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % newRoster.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [manualPause, isHovering, hasFocus, reducedMotion]);

  const feature = newRoster[activeIndex];
  const goTo = (offset: number) => {
    setActiveIndex((index) => (index + offset + newRoster.length) % newRoster.length);
  };
  const running = !manualPause && !reducedMotion;

  return (
    <div className="generation-page">
      <section className="generation-hero">
        <div className="generation-hero-copy">
          <h1>UMA NOVA <span>GERAÇÃO.</span></h1>
          <p>Treze jogadores. Novas equipes. Uma história que começa agora.</p>
          <div className="sports-actions">
            <Link to="/jogadores" className="sports-button">Conhecer o elenco <ArrowUpRight size={17} /></Link>
            <a href="#novo-elenco" className="text-link">Explorar jogadores <ArrowDown size={17} /></a>
          </div>
        </div>
        <div
          className="generation-hero-carousel"
          role="region"
          aria-roledescription="carrossel"
          aria-label="Jogadores em destaque"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onFocusCapture={() => setHasFocus(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setHasFocus(false);
            }
          }}
        >
          <Link
            to="/jogadores/$id"
            params={{ id: feature.id }}
            className="generation-hero-feature"
            aria-label={`Ver perfil de ${feature.name}, ${feature.team}`}
          >
            <NewPortrait key={feature.id} player={feature} priority={activeIndex === 0} variant="hero" />
            <div className="generation-hero-caption" aria-live="off">
              <strong>{feature.name}</strong>
              <span>{feature.team}</span>
            </div>
          </Link>
          <div className="generation-hero-controls" aria-label="Controles dos jogadores em destaque">
            <span className="generation-hero-count" aria-live="off">
              {String(activeIndex + 1).padStart(2, "0")} / {String(newRoster.length).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => goTo(-1)} aria-label="Jogador anterior">
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => goTo(1)} aria-label="Próximo jogador">
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setManualPause((paused) => !paused)}
              aria-label={running ? "Pausar troca automática" : "Ativar troca automática"}
              aria-pressed={!manualPause}
            >
              {running ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </section>
      <GenerationRoster compact />
      <section className="generation-empty" aria-label="Estatísticas da nova geração">
        <Trophy size={28} aria-hidden="true" />
        <h2>O LEGADO AINDA SERÁ ESCRITO.</h2>
        <p>Estatísticas, temporadas, recordes e conquistas serão exibidos quando forem importados oficialmente.</p>
      </section>
    </div>
  );
}

export function GenerationRoster({ compact = false }: { compact?: boolean }) {
  return (
    <section id="novo-elenco" className="generation-roster site-container" aria-labelledby="roster-heading">
      <header className="generation-heading">
        <div><h1 id="roster-heading">{compact ? "CONHEÇA O ELENCO." : "OS NOVOS PROTAGONISTAS."}</h1>
        <p>Os 13 jogadores da nova geração da Central do Bolão.</p></div>
      </header>
      <div className="generation-grid">
        {newRoster.map((player) => (
          <Link key={player.id} to="/jogadores/$id" params={{ id: player.id }} className="generation-card">
            <NewPortrait player={player} variant="card" />
            <div className="generation-card-info"><h2>{player.name}</h2><p>{player.team}</p></div>
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
      <Link to="/jogadores" className="text-link">← Voltar aos jogadores</Link>
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
        <p>As informações de carreira, estatísticas por fase e premiações ainda não foram importadas.</p>
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
        <p>Esta área receberá informações verificadas da nova geração. Nenhum registro da liga anterior é utilizado.</p>
        <Link to="/jogadores" className="sports-button">Conhecer os jogadores <ArrowUpRight size={17} /></Link>
      </div>
    </main>
  );
}
