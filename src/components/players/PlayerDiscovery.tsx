import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { PlayerPresentation } from "../../lib/player-types";
import { PlayerPortrait } from "../home/PlayerPortrait";
import { usePlayerMotion } from "./usePlayerMotion";

export function PlayerDiscovery({ next }: { next?: PlayerPresentation }) {
  const motion = usePlayerMotion();
  return (
    <section
      id="a-trajetoria-continua"
      className="profile-discovery section-space site-container"
      aria-labelledby="discovery-title"
    >
      <div>
        <p className="eyebrow section-kicker">05 / A TRAJETÓRIA CONTINUA</p>
        <h2 id="discovery-title">
          OUTRO NOME.
          <br />
          <span>OUTRA HISTÓRIA.</span>
        </h2>
        <p>
          O acervo não termina aqui.
          <br />
          Continue conhecendo os protagonistas da liga.
        </p>
        <div className="discovery-links">
          <Link to="/jogadores" className="text-link">
            Voltar à galeria <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/temporadas" className="text-link">
            Explorar temporadas <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/deep-analytics" className="text-link">
            Abrir comparações <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {next && (
        <Link
          to="/jogadores/$id"
          params={{ id: next.id }}
          viewTransition={motion}
          className="discovery-next"
        >
          <PlayerPortrait player={next} sizes="(max-width: 767px) 90vw, 45vw" />
          <div>
            <span className="eyebrow">MAIS UM PROTAGONISTA</span>
            <h3>{next.name}</h3>
            <span>
              Conhecer a carreira <ArrowUpRight size={19} aria-hidden="true" />
            </span>
          </div>
        </Link>
      )}
    </section>
  );
}
