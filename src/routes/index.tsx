import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Award, BarChart3 } from "lucide-react";
import { players, getArchetypeColor } from "../lib/mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/")({
  component: HallDaFama,
});

function PodiumCard({ player, rank }: { player: (typeof players)[0]; rank: number }) {
  const sizes = {
    1: {
      height: "h-64",
      glow: "gold-glow",
      color: "text-gold",
      border: "border-gold/40",
      label: "🥇",
    },
    2: {
      height: "h-52",
      glow: "silver-glow",
      color: "text-silver",
      border: "border-silver/40",
      label: "🥈",
    },
    3: {
      height: "h-44",
      glow: "bronze-glow",
      color: "text-bronze",
      border: "border-bronze/40",
      label: "🥉",
    },
  };
  const s = sizes[rank as keyof typeof sizes];

  return (
    <div className={`animate-fade-in-up`} style={{ animationDelay: `${rank * 150}ms` }}>
      <div
        className={`glass-elevated rounded-2xl border ${s.border} p-6 ${s.glow} transition-transform hover:scale-[1.02]`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-3xl">{s.label}</span>
          <span
            className={`rounded-full border ${getArchetypeColor(player.archetype)} px-2.5 py-0.5 text-[11px] font-semibold`}
          >
            {player.archetype}
          </span>
        </div>
        <Link to="/jogadores/$id" params={{ id: player.id.toString() }} className="hover:underline">
          <h3 className={`text-xl font-extrabold tracking-tight ${s.color}`}>{player.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{player.teams.join(", ")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Score
            </p>
            <p className="text-lg font-extrabold neon-text">{player.scoreTotal}</p>
          </div>
          <div className="rounded-xl bg-background/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Anéis
            </p>
            <p className="text-lg font-extrabold text-gold">{"💍".repeat(player.rings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HallDaFama() {
  const sorted = [...players].sort((a, b) => b.scoreTotal - a.scoreTotal);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl neon-border">
          <Trophy className="h-5 w-5 text-neon" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hall da Fama</h1>
          <p className="text-sm text-muted-foreground">Os maiores de sempre da Central da Liga</p>
        </div>
      </div>

      {/* Podium */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:order-2">
          <PodiumCard player={top3[0]} rank={1} />
        </div>
        <div className="md:order-1 md:mt-8">
          <PodiumCard player={top3[1]} rank={2} />
        </div>
        <div className="md:order-3 md:mt-12">
          <PodiumCard player={top3[2]} rank={3} />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-elevated rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-neon" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Score Total — Top 10
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={sorted
              .slice(0, 10)
              .map((p) => ({ name: p.name.split(" ").pop(), score: p.scoreTotal, full: p.name }))}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { full: string; score: number };
                return (
                  <div className="glass-elevated rounded-xl border border-border px-4 py-3 text-xs shadow-lg">
                    <p className="font-bold text-foreground">{d.full}</p>
                    <p className="mt-1 font-semibold neon-text">Score: {d.score}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {sorted.slice(0, 10).map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i === 0
                      ? "#ef4444"
                      : i === 1
                        ? "#f59e0b"
                        : i === 2
                          ? "#9ca3af"
                          : "rgba(239,68,68,0.3)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl p-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3">Arquétipo</th>
                <th className="px-4 py-3">Equipa</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Anéis</th>
                <th className="px-4 py-3">PTS</th>
                <th className="px-4 py-3">REB</th>
                <th className="px-4 py-3">AST</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((player, i) => (
                <tr
                  key={player.id}
                  className="border-b border-border/50 transition-colors hover:bg-accent/50"
                >
                  <td className="px-4 py-3 font-bold text-muted-foreground">{i + 4}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link to="/jogadores/$id" params={{ id: player.id.toString() }} className="hover:text-neon transition-colors">
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getArchetypeColor(player.archetype)}`}
                    >
                      {player.archetype}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{player.teams.join(", ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-neon"
                          style={{ width: `${player.scoreTotal * 10}%` }}
                        />
                      </div>
                      <span className="font-bold">{player.scoreTotal}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gold">{"💍".repeat(player.rings)}</td>
                  <td className="px-4 py-3">{player.pts}</td>
                  <td className="px-4 py-3">{player.reb}</td>
                  <td className="px-4 py-3">{player.ast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
