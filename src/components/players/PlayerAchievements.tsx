import { Trophy, Award, ArrowDown } from "lucide-react";
import type { PlayerAward } from "../../lib/player-types";

export function PlayerAchievements({
  awards,
  onSelectSeason,
}: {
  awards: PlayerAward[];
  onSelectSeason: (id: number) => void;
}) {
  return (
    <section
      id="o-legado"
      className="profile-achievements section-space"
      aria-labelledby="legacy-title"
    >
      <div className="site-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-kicker">02 / O LEGADO</p>
            <h2 id="legacy-title">
              O QUE O TEMPO
              <br />
              <span>NÃO APAGA.</span>
            </h2>
          </div>
          <p className="section-intro">
            As conquistas registradas.
            <br />
            Os momentos que permanecem.
          </p>
        </div>
        {awards.length ? (
          <div className="achievement-list">
            {awards.map((award) => (
              <article className={`achievement achievement-${award.kind}`} key={award.id}>
                {award.kind === "title" ? (
                  <Trophy aria-hidden="true" size={26} strokeWidth={1.1} />
                ) : (
                  <Award aria-hidden="true" size={25} strokeWidth={1.1} />
                )}
                <strong>{String(award.count).padStart(2, "0")}</strong>
                <h3>{award.label}</h3>
                {award.years.length ? (
                  <div className="achievement-years">
                    {award.years.map((year) => (
                      <a
                        key={year.seasonId}
                        href="#evolucao"
                        onClick={() => onSelectSeason(year.seasonId)}
                        aria-label={`${award.label}, temporada ${year.year}: explorar`}
                      >
                        {year.year}
                        <ArrowDown size={12} aria-hidden="true" />
                      </a>
                    ))}
                    {award.years.length < award.count && <span>Demais anos não informados</span>}
                  </div>
                ) : (
                  <p>Anos não informados no acervo.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="achievement-empty">
            <p className="eyebrow">SEM PREMIAÇÕES REGISTRADAS</p>
            <p>
              O legado também está na trajetória.
              <br />
              Explore as temporadas e os números deste jogador.
            </p>
            <a href="#evolucao" className="text-link">
              Continue a história <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
