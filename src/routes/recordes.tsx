import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { players } from "../lib/mock-data";
import { adaptPlayer } from "../lib/home-data";
import { PlayerPortrait } from "../components/home/PlayerPortrait";
import { SectionHeader } from "../components/sports/SectionHeader";
export const Route = createFileRoute("/recordes")({
  head: () => ({ meta: [{ title: "Recordes — Central da Liga" }] }),
  component: Recordes,
});
const categories = [
  { key: "pts", label: "Pontos", abbr: "PTS" },
  { key: "reb", label: "Rebotes", abbr: "REB" },
  { key: "ast", label: "Assistências", abbr: "AST" },
  { key: "stl", label: "Roubos", abbr: "STL" },
  { key: "blk", label: "Tocos", abbr: "BLK" },
  { key: "rings", label: "Campeonatos", abbr: "TÍTULOS" },
] as const;
function Recordes() {
  const [active, setActive] = useState(0);
  const category = categories[active];
  // Preserve the existing ranking exactly. Career totals are estimates, not observed counts.
  const leaders = players
    .map((player) => ({
      player,
      value:
        category.key === "rings"
          ? player.rings
          : Math.round(player[category.key] * player.seasons * 82),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const leader = leaders[0];
  const observed = category.key === "rings";
  return (
    <div className="sports-page record-museum">
      <SectionHeader
        eyebrow="O MUSEU / MARCAS DA LIGA"
        title="O LIMITE É HISTÓRIA."
        description="Os nomes que levaram os números mais longe. Explore os líderes de cada categoria."
      />
      <div className="record-categories" role="group" aria-label="Categoria de recordes">
        {categories.map((cat, i) => (
          <button
            key={cat.key}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-controls="record-display"
          >
            <strong>{cat.abbr}</strong>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
      <section id="record-display" className="record-display" key={category.key} aria-live="polite">
        <div className="record-photo">
          <PlayerPortrait player={adaptPlayer(leader.player)} priority />
          <span className="record-stamp">
            01 <small>LÍDER / {category.abbr}</small>
          </span>
        </div>
        <div className="record-copy">
          <p className="eyebrow sports-kicker">
            {observed ? "CONQUISTAS REGISTRADAS" : "TOTAL ESTIMADO DE CARREIRA"}
          </p>
          <h2>{leader.player.name}</h2>
          <div className="record-value">
            {leader.value.toLocaleString("pt-BR")}
            <span>{category.label}</span>
          </div>
          <p>{leader.player.archetype}</p>
          <Link className="text-link" to="/jogadores/$id" params={{ id: String(leader.player.id) }}>
            Conheça a trajetória <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="record-chasers">
          <p className="eyebrow">NA DISPUTA / TOP 5</p>
          <ol start={2}>
            {leaders.slice(1).map(({ player, value }, i) => (
              <li key={player.id}>
                <span>0{i + 2}</span>
                <Link to="/jogadores/$id" params={{ id: String(player.id) }}>
                  {player.name}
                  <ArrowUpRight size={12} />
                </Link>
                <strong>{value.toLocaleString("pt-BR")}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <aside className="sports-data-notice">
        <strong>{observed ? "Títulos registrados no acervo" : "Como ler estes números"}</strong>
        <p>
          {observed
            ? "A quantidade de campeonatos vem dos registros individuais dos atletas. Não é uma estimativa."
            : "Estimativa = média de carreira × 82 jogos × temporadas, arredondada ao inteiro mais próximo. Não representa a soma de partidas observadas. O critério e a ordem do ranking original foram preservados; empates mantém a ordem do acervo."}
        </p>
      </aside>
    </div>
  );
}
