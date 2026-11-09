import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  portalStatusLabels,
  seasonSpotlight,
  type SeasonSpotlightData,
} from "../../lib/home-portal";

export function SeasonSpotlight({ data = seasonSpotlight }: { data?: SeasonSpotlightData }) {
  return (
    <section
      className="portal-season portal-section site-container"
      aria-labelledby="season-spotlight-title"
    >
      <div className="portal-editorial">
        <h2 id="season-spotlight-title">
          O PRÓXIMO
          <br />
          <span>CAPÍTULO.</span>
        </h2>
        <p>Cada temporada escreve uma nova parte da nossa história.</p>
        <Link to="/temporadas" className="text-link">
          EXPLORAR TEMPORADAS <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="season-broadcast" data-status={data.season.status}>
        <p className="season-status">
          {data.season.status === "available"
            ? "Temporada registrada"
            : "Histórico competitivo em preparação"}
        </p>
        <h3>
          {data.season.status === "available"
            ? data.season.data.name
            : "A COMPETIÇÃO COMEÇA COM UMA HISTÓRIA."}
        </h3>
        <dl>
          <div>
            <dt>Temporada</dt>
            <dd>
              {data.season.status === "available"
                ? data.season.data.name
                : portalStatusLabels[data.season.status]}
            </dd>
          </div>
          <div>
            <dt>Próxima partida</dt>
            <dd>
              {data.nextMatch.status === "available" ? (
                <>
                  {data.nextMatch.data.label}
                  {data.nextMatch.data.scheduledAt && (
                    <time dateTime={data.nextMatch.data.scheduledAt}>
                      {data.nextMatch.data.scheduledAt}
                    </time>
                  )}
                </>
              ) : (
                portalStatusLabels[data.nextMatch.status]
              )}
            </dd>
          </div>
        </dl>
        {data.recentResults.status === "available" && data.recentResults.data.length > 0 && (
          <div className="season-records">
            <h4>Resultados recentes</h4>
            <ul>
              {data.recentResults.data.map((result) => (
                <li key={result.id}>{result.label}</li>
              ))}
            </ul>
          </div>
        )}
        {data.highlights.status === "available" && data.highlights.data.length > 0 && (
          <div className="season-records">
            <h4>Destaques oficiais</h4>
            <ul>
              {data.highlights.data.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
