import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarRange, Trophy, ChartNoAxesColumnIncreasing } from "lucide-react";

const portals = [
  {
    to: "/temporadas",
    title: "TEMPORADAS",
    description: "A história de cada edição.",
    icon: CalendarRange,
    className: "seasons",
  },
  {
    to: "/hall-da-fama",
    title: "HALL DA FAMA",
    description: "Os jogadores e conquistas que marcarão a competição.",
    icon: Trophy,
    className: "hall",
  },
  {
    to: "/recordes",
    title: "RECORDES",
    description: "Os números e desempenhos históricos.",
    icon: ChartNoAxesColumnIncreasing,
    className: "records",
  },
] as const;

export function ExploreUniverse() {
  return (
    <section
      className="portal-explore portal-section site-container"
      aria-labelledby="universe-title"
    >
      <h2 id="universe-title">
        EXPLORE O <span>UNIVERSO.</span>
      </h2>
      <div className="universe-grid">
        {portals.map(({ to, title, description, icon: Icon, className }) => (
          <Link key={to} to={to} className={`universe-door universe-door--${className}`}>
            <Icon className="universe-symbol" aria-hidden="true" strokeWidth={0.7} />
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowUpRight className="universe-arrow" size={26} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
