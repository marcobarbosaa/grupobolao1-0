import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { players } from "../../lib/mock-data";
import { usePlayerMotion } from "../players/usePlayerMotion";
export function PlayerAnalysis({ id }: { id: string }) {
  const motion = usePlayerMotion();
  const p = players.find((player) => String(player.id) === id);
  if (!p) return null;
  const data = [
    { stat: "PTS", value: (p.pts / 35) * 100 },
    { stat: "REB", value: (p.reb / 18) * 100 },
    { stat: "AST", value: (p.ast / 13) * 100 },
    { stat: "STL", value: (p.stl / 3.5) * 100 },
    { stat: "BLK", value: (p.blk / 5) * 100 },
    { stat: "Clutch", value: p.clutchIndex },
    { stat: "QI", value: (p.basketballIQ / 5) * 100 },
  ];
  return (
    <section
      id="analise"
      className="sports-section profile-analysis"
      aria-labelledby="analysis-title"
    >
      <div className="sports-section-title">
        <div>
          <p className="eyebrow sports-kicker">Análise</p>
          <h2 id="analysis-title">ALÉM DO PLACAR.</h2>
        </div>
        <p>
          Métricas derivadas da liga.
          <br />
          Não são atributos oficiais do NBA 2K.
        </p>
      </div>
      <div className="profile-analysis-grid">
        <div className="sports-chart">
          <h3>Perfil estatístico · Escala normalizada</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} accessibilityLayer>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={p.name}
                dataKey="value"
                stroke="var(--gold)"
                fill="var(--gold)"
                fillOpacity={0.18}
                isAnimationActive={motion}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface)", borderColor: "var(--border)" }}
                formatter={(value) => Number(value).toFixed(1)}
              />
            </RadarChart>
          </ResponsiveContainer>
          <p className="sports-note">
            Referências: PTS 35 · REB 18 · AST 13 · STL 3,5 · BLK 5 · QI 5. Clutch usa o índice da
            liga.
          </p>
        </div>
        <div className="performance-report">
          <h3>Boletim de performance</h3>
          {[
            { name: "Temporada regular", value: p.regularSeasonGrade },
            { name: "Playoffs", value: p.playoffsGrade },
            { name: "Finais", value: p.finalsGrade },
          ].map((phase) => (
            <div className="performance-row" key={phase.name}>
              <span>{phase.name}</span>
              <strong>{phase.value.toFixed(2)}</strong>
              <meter min={0} max={10} value={phase.value} aria-label={phase.name} />
            </div>
          ))}
          <div className="legacy-final">
            <span>NOTA FINAL DE LEGADO</span>
            <strong>
              {p.scoreTotal.toFixed(2)}
              <small>/ 10</small>
            </strong>
          </div>
          <p className="sports-note">
            Notas do motor original, com médias de carreira e estimativas preexistentes. O histórico
            por temporada acima apresenta os registros importados.
          </p>
        </div>
      </div>
    </section>
  );
}
