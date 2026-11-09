import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import "../../styles/generation-hero.css";

export function GenerationHero() {
  return (
    <section className="generation-opening" aria-labelledby="generation-title">
      <h1 id="generation-title" className="generation-opening-title">
        <span>NOVA</span> <span>GERAÇÃO</span>
      </h1>
      <div className="generation-opening-scene">
        <img
          src="/jogadores/elenco-junto/Elenco_Unido.webp"
          width={1672}
          height={941}
          alt="Os 13 jogadores do novo elenco reunidos em duas fileiras, com seus uniformes."
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="generation-opening-action">
        <p>13 jogadores. Uma nova história começa agora.</p>
        <Link to="/jogadores" className="sports-button">
          CONHECER O ELENCO <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
