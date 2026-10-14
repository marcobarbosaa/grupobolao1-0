import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const destinations = [
  { to: "/biografias", title: "Jogadores", caption: "Os rostos da nossa liga" },
  { to: "/temporadas", title: "Temporadas", caption: "Cada ano, um capítulo" },
  { to: "/recordes", title: "Recordes", caption: "Os números que ficam" },
  { to: "/deep-analytics", title: "Comparações", caption: "O jogo por outros ângulos" },
] as const;

export function Explore() {
  return (
    <section
      className="explore-section section-space site-container"
      aria-labelledby="explore-title"
    >
      <div className="explore-heading">
        <p className="eyebrow section-kicker">05 / O JOGO CONTINUA</p>
        <h2 id="explore-title">
          EXPLORE
          <br />O <span>UNIVERSO.</span>
        </h2>
        <p>
          Há sempre mais uma história
          <br />
          para descobrir.
        </p>
        <span className="explore-monogram" aria-hidden="true">
          GB.
        </span>
      </div>
      <div className="explore-links">
        {destinations.map((destination, index) => (
          <Link to={destination.to} key={destination.to}>
            <span className="explore-number">0{index + 1}</span>
            <div>
              <h3>{destination.title}</h3>
              <p>{destination.caption}</p>
            </div>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
