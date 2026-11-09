import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { newRoster } from "../../lib/new-roster";

// Editorial pairing, not a ranking or a match result.
const featuredPlayers = newRoster.filter((player) => ["abel", "marco-barbosa"].includes(player.id));

export function VersusShowcase() {
  return (
    <section className="portal-versus portal-section" aria-labelledby="versus-title">
      <div className="site-container">
        <h2 id="versus-title">
          DUAS HISTÓRIAS.
          <br />
          <span>UM CONFRONTO.</span>
        </h2>
        <div className="versus-stage">
          {featuredPlayers.map((player, index) => (
            <figure className={`versus-player versus-player--${index + 1}`} key={player.id}>
              <img
                src={player.portrait}
                srcSet={player.portraitSet}
                sizes="(max-width: 700px) 46vw, 38vw"
                alt={player.name}
                width={1024}
                height={1536}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <h3>{player.name}</h3>
                <p>{player.team}</p>
              </figcaption>
            </figure>
          ))}
          <span className="versus-mark" aria-hidden="true">
            VS
          </span>
        </div>
        <div className="versus-action">
          <p>Prévia editorial de comparação. Estatísticas ainda não importadas.</p>
          <Link to="/deep-analytics" className="sports-button">
            EXPLORAR COMPARAÇÕES <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
