import { createFileRoute } from "@tanstack/react-router";
import { Brain, Crosshair, Lightbulb, BarChart3, Users } from "lucide-react";
import { players, getArchetypeColor } from "../lib/mock-data";
import { useState, useEffect } from "react";
import { RankingEngine } from "../lib/engine";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export const Route = createFileRoute("/deep-analytics")({
  head: () => ({
    meta: [
      { title: "Comparar — Grupo Bolão 2.0" },
      { name: "description", content: "Análise avançada de performance e métricas dos jogadores" },
    ],
  }),
  component: DeepAnalytics,
});

function PerformanceBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Generate season-by-season evolution data for a player based on actual career stats
function getSeasonEvolution(player: (typeof players)[0]) {
  return player.career.map((year) => {
    const getGrade = (stats: any) => {
      if (!stats) return 0;
      // Map CareerStats to PhaseStats format expected by RankingEngine
      const phaseStats = {
        GP: stats.gp,
        PPG: stats.pts,
        RPG: stats.reb,
        APG: stats.ast,
        SPG: stats.stl,
        BPG: stats.blk,
        TOPG: stats.topg,
        MPG: 36, // Default
      };
      return RankingEngine.calculatePhaseGrade(phaseStats, player.archetype);
    };

    return {
      name: `T${year.season}`,
      fullName: year.year,
      Regular: getGrade(year.stats.Regular),
      Playoffs: getGrade(year.stats.Playoffs),
      Finals: getGrade(year.stats.Finals),
    };
  });
}

// Build radar data comparing two players
function getRadarData(p1: (typeof players)[0], p2: (typeof players)[0]) {
  const maxPts = 35,
    maxReb = 18,
    maxAst = 13,
    maxStl = 3.5,
    maxBlk = 5;
  return [
    {
      stat: "PTS",
      A: +((p1.pts / maxPts) * 100).toFixed(0),
      B: +((p2.pts / maxPts) * 100).toFixed(0),
    },
    {
      stat: "REB",
      A: +((p1.reb / maxReb) * 100).toFixed(0),
      B: +((p2.reb / maxReb) * 100).toFixed(0),
    },
    {
      stat: "AST",
      A: +((p1.ast / maxAst) * 100).toFixed(0),
      B: +((p2.ast / maxAst) * 100).toFixed(0),
    },
    {
      stat: "STL",
      A: +((p1.stl / maxStl) * 100).toFixed(0),
      B: +((p2.stl / maxStl) * 100).toFixed(0),
    },
    {
      stat: "BLK",
      A: +((p1.blk / maxBlk) * 100).toFixed(0),
      B: +((p2.blk / maxBlk) * 100).toFixed(0),
    },
    { stat: "Clutch", A: p1.clutchIndex, B: p2.clutchIndex },
    {
      stat: "QI",
      A: +((p1.basketballIQ / 5) * 100).toFixed(0),
      B: +((p2.basketballIQ / 5) * 100).toFixed(0),
    },
  ];
}

const NEON_RED = "#ef4444";
const CHART_BLUE = "#3b82f6";
const CHART_GOLD = "#eab308";
const CHART_EMERALD = "#10b981";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elevated rounded-xl border border-border px-4 py-3 text-xs shadow-lg">
      <p className="mb-1.5 font-bold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function DeepAnalytics() {
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]);
  const [comparePlayer, setComparePlayer] = useState(players[1]);
  const [evolutionPhase, setEvolutionPhase] = useState<string>("all");
  const [startSeason, setStartSeason] = useState(1);
  const [endSeason, setEndSeason] = useState(players[0].seasons);

  useEffect(() => {
    setStartSeason(1);
    setEndSeason(selectedPlayer.seasons);
  }, [selectedPlayer]);

  const sorted = [...players].sort((a, b) => b.clutchIndex - a.clutchIndex);

  const radarData = getRadarData(selectedPlayer, comparePlayer);
  const allEvolutionData = getSeasonEvolution(selectedPlayer);
  
  const evolutionData = allEvolutionData
    .filter((d) => {
      const sNum = parseInt(d.name.replace('T', ''));
      return sNum >= startSeason && sNum <= endSeason;
    })
    .map(d => {
      // If a specific phase is selected, we might want to hide others, 
      // but the Bar components already handle this. 
      // However, we ensure the data exists.
      return d;
    });

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl neon-border">
          <Brain className="h-5 w-5 text-neon" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Deep Analytics</h1>
          <p className="text-sm text-muted-foreground">Métricas avançadas de performance</p>
        </div>
      </div>

      {/* Player selectors */}
      <div className="glass rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Jogador Principal
            </label>
            <select
              value={selectedPlayer.id}
              onChange={(e) =>
                setSelectedPlayer(players.find((p) => p.id === Number(e.target.value))!)
              }
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.archetype}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="mr-1 inline h-3 w-3" /> Comparar com
            </label>
            <select
              value={comparePlayer.id}
              onChange={(e) =>
                setComparePlayer(players.find((p) => p.id === Number(e.target.value))!)
              }
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.archetype}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Radar comparison */}
        <div className="glass-elevated rounded-2xl p-6">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Comparação Radar
          </h3>
          <p className="mb-4 text-[11px] text-muted-foreground">
            <span style={{ color: NEON_RED }} className="font-semibold">
              {selectedPlayer.name}
            </span>
            {" vs "}
            <span style={{ color: CHART_BLUE }} className="font-semibold">
              {comparePlayer.name}
            </span>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar
                name={selectedPlayer.name}
                dataKey="A"
                stroke={NEON_RED}
                fill={NEON_RED}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name={comparePlayer.name}
                dataKey="B"
                stroke={CHART_BLUE}
                fill={CHART_BLUE}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart - season evolution */}
        <div className="glass-elevated rounded-2xl p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Evolução por Temporada
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Notas de <span className="font-semibold text-foreground">{selectedPlayer.name}</span> ao
                longo das temporadas selecionadas
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Phase Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fase</label>
                <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'Regular', label: 'Regular' },
                    { id: 'Playoffs', label: 'Playoffs' },
                    { id: 'Finals', label: 'Finais' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setEvolutionPhase(p.id)}
                      className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                        evolutionPhase === p.id 
                          ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season Range Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intervalo</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={startSeason} 
                    onChange={(e) => setStartSeason(Number(e.target.value))}
                    className="rounded-lg border border-border bg-background/50 px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-neon"
                  >
                    {Array.from({ length: selectedPlayer.seasons }, (_, i) => (
                      <option key={i+1} value={i+1}>T{i+1}</option>
                    ))}
                  </select>
                  <span className="text-[10px] font-bold text-muted-foreground">/</span>
                  <select 
                    value={endSeason} 
                    onChange={(e) => setEndSeason(Number(e.target.value))}
                    className="rounded-lg border border-border bg-background/50 px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-neon"
                  >
                    {Array.from({ length: selectedPlayer.seasons }, (_, i) => (
                      <option key={i+1} value={i+1}>T{i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
              />
              {(evolutionPhase === 'all' || evolutionPhase === 'Regular') && (
                <Bar
                  dataKey="Regular"
                  fill={CHART_BLUE}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
              )}
              {(evolutionPhase === 'all' || evolutionPhase === 'Playoffs') && (
                <Bar
                  dataKey="Playoffs"
                  fill={CHART_GOLD}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
              )}
              {(evolutionPhase === 'all' || evolutionPhase === 'Finals') && (
                <Bar
                  dataKey="Finals"
                  fill={NEON_RED}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1000}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Player detail */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Boletim */}
        <div className="glass-elevated rounded-2xl p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Boletim de Performance
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                label: "Regular Season",
                grade: selectedPlayer.regularSeasonGrade,
                icon: BarChart3,
              },
              { label: "Playoffs", grade: selectedPlayer.playoffsGrade, icon: Crosshair },
              { label: "Finals", grade: selectedPlayer.finalsGrade, icon: Lightbulb },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-background/40 p-4 text-center">
                <item.icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className={`mt-1 text-3xl font-black ${item.grade >= 9 ? "neon-text" : ""}`}>
                  {item.grade.toFixed(1)}
                </p>
                <PerformanceBar
                  value={item.grade}
                  max={10}
                  color={item.grade >= 9 ? "bg-neon" : "bg-muted-foreground"}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "PTS", value: selectedPlayer.pts },
              { label: "REB", value: selectedPlayer.reb },
              { label: "AST", value: selectedPlayer.ast },
              { label: "STL", value: selectedPlayer.stl },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-background/40 px-3 py-2 text-center">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-extrabold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced metrics */}
        <div className="space-y-4">
          <div className="neon-border animate-pulse-neon rounded-2xl p-6 text-center">
            <Crosshair className="mx-auto mb-2 h-6 w-6 text-neon" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Índice Clutch
            </p>
            <p className="mt-1 text-4xl font-black neon-text">{selectedPlayer.clutchIndex}</p>
            <PerformanceBar value={selectedPlayer.clutchIndex} max={100} color="bg-neon" />
          </div>

          <div className="glass-elevated rounded-2xl p-6 text-center">
            <Lightbulb className="mx-auto mb-2 h-6 w-6 text-gold" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              QI de Basquetebol
            </p>
            <p className="mt-1 text-4xl font-black text-gold">
              {selectedPlayer.basketballIQ.toFixed(1)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">AST/TO Ratio</p>
            <PerformanceBar value={selectedPlayer.basketballIQ} max={5} color="bg-gold" />
          </div>
        </div>
      </div>

      {/* Clutch ranking */}
      <div className="glass rounded-2xl p-1">
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Ranking Clutch Comparativo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3">Arquétipo</th>
                <th className="px-4 py-3">Clutch</th>
                <th className="px-4 py-3">QI</th>
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, i) => (
                <tr
                  key={player.id}
                  className={`border-b border-border/50 transition-colors hover:bg-accent/50 ${
                    player.id === selectedPlayer.id ? "bg-neon/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">{player.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getArchetypeColor(player.archetype)}`}
                    >
                      {player.archetype}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-neon"
                          style={{ width: `${player.clutchIndex}%` }}
                        />
                      </div>
                      <span className="font-bold">{player.clutchIndex}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gold">
                    {player.basketballIQ.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 font-bold">{player.scoreTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
