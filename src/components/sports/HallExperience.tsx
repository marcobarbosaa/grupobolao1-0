import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { players, seasons } from "../../lib/mock-data";
import { adaptPlayer } from "../../lib/home-data";
import { PlayerPortrait } from "../home/PlayerPortrait";
import { usePlayerMotion } from "../players/usePlayerMotion";

// Existing legacy grade descending; stable source order breaks ties. No recalculation.
const ranking = [...players].sort((a, b) => b.scoreTotal - a.scoreTotal);

export function HallExperience() {
  const leader = ranking[0];
  const motion = usePlayerMotion();
  return (
    <div className="sports-hall">
      <section className="league-hero" aria-labelledby="hall-title">
        <div className="league-hero-copy">
          <h1 id="hall-title">
            O JOGO PASSA.
            <br />
            <span>O LEGADO</span>
            <br />
            FICA.
          </h1>
          <p className="hero-intro">
            Conheça os jogadores, revisite as conquistas e compare as trajetórias que construíram a
            nossa liga.
          </p>
          <div className="sports-actions">
            <a href="#lendas" className="sports-button">
              Entrar no Hall <ArrowDown size={16} />
            </a>
            <Link to="/biografias" className="text-link">
              Conheça o elenco <ArrowUpRight size={16} />
            </Link>
          </div>
          <dl className="league-facts">
            <div>
              <dt>Temporadas</dt>
              <dd>{seasons.length}</dd>
            </div>
            <div>
              <dt>Protagonistas</dt>
              <dd>{players.length}</dd>
            </div>
            <div>
              <dt>História da liga</dt>
              <dd>
                {seasons[0].year.split("-")[0]}
                <span>—{seasons.at(-1)?.year.split("-")[1]}</span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="league-hero-portrait">
          <PlayerPortrait
            player={adaptPlayer(leader)}
            priority
            sizes="(max-width: 700px) 100vw, 55vw"
          />
          <div className="hero-photo-caption">
            <p className="eyebrow">LÍDER DA NOTA DE LEGADO / {leader.scoreTotal.toFixed(2)}</p>
            <Link to="/jogadores/$id" params={{ id: String(leader.id) }}>
              {leader.name}
              <ArrowUpRight />
            </Link>
            <p>
              {leader.rings} títulos · {leader.seasons} temporadas
            </p>
          </div>
        </div>
      </section>
      <section id="lendas" className="sports-section" aria-labelledby="legends-title">
        <div className="sports-section-title">
          <div>
            <p className="eyebrow sports-kicker">Hall da Fama</p>
            <h2 id="legends-title">
              CONSTRUÍDOS PARA
              <br />
              <span>FICAR NA HISTÓRIA.</span>
            </h2>
          </div>
          <p>
            Três trajetórias no topo.
            <br />O legado de uma liga inteira.
          </p>
        </div>
        <div className="ranking-podium">
          {ranking.slice(0, 3).map((player, index) => (
            <Link
              className={`podium-player podium-${index + 1}`}
              key={player.id}
              to="/jogadores/$id"
              params={{ id: String(player.id) }}
            >
              <PlayerPortrait player={adaptPlayer(player)} />
              <span className="podium-rank">
                0{index + 1}
                <small>{index === 0 ? "LÍDER DO LEGADO" : "NO HALL DA FAMA"}</small>
              </span>
              <div className="podium-caption">
                <p className="eyebrow">{player.archetype}</p>
                <h3>{player.name}</h3>
                <div>
                  <span>
                    <strong>{player.scoreTotal.toFixed(2)}</strong> LEGADO / 10
                  </span>
                  <span>{player.rings} TÍTULOS</span>
                </div>
                <p className="podium-profile">
                  Explorar carreira <ArrowUpRight size={17} />
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="sports-note">
          Classificação pela nota de legado já calculada pela liga. Empates mantêm a ordem do
          acervo. Métrica derivada, sem vínculo com atributos oficiais do NBA 2K.
        </p>
      </section>
      <section className="sports-section league-ranking" aria-labelledby="ranking-title">
        <div className="sports-section-title">
          <div>
            <p className="eyebrow sports-kicker">Classificação</p>
            <h2 id="ranking-title">
              CADA NOME.
              <br />
              <span>SEU LEGADO.</span>
            </h2>
          </div>
          <Link to="/deep-analytics" className="text-link">
            Abrir arena de comparação <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="sports-chart">
          <h3>Nota de legado · Top 10</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={ranking.slice(0, 10)}
              margin={{ left: -25, right: 8 }}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis domain={[0, 10]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
              <Bar
                name="Legado"
                dataKey="scoreTotal"
                fill="var(--gold)"
                maxBarSize={48}
                isAnimationActive={motion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          className="sports-table-scroll"
          role="region"
          aria-label="Classificação completa com rolagem horizontal"
          tabIndex={0}
        >
          <table className="sports-table">
            <caption>Classificação completa · Médias de carreira do acervo original</caption>
            <thead>
              <tr>
                {[
                  "#",
                  "Jogador",
                  "Arquétipo",
                  "Equipes",
                  "Legado",
                  "Títulos",
                  "PTS",
                  "REB",
                  "AST",
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => (
                <tr key={p.id}>
                  <td>{String(i + 1).padStart(2, "0")}</td>
                  <th scope="row">
                    <Link to="/jogadores/$id" params={{ id: String(p.id) }}>
                      {p.name}
                      <ArrowUpRight size={13} />
                    </Link>
                  </th>
                  <td>{p.archetype}</td>
                  <td>{p.teams.join(" / ")}</td>
                  <td className="score-cell">{p.scoreTotal.toFixed(2)}</td>
                  <td>{p.rings}</td>
                  <td>{p.pts}</td>
                  <td>{p.reb}</td>
                  <td>{p.ast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
