import { createFileRoute } from "@tanstack/react-router";
import { Crown, TrendingUp } from "lucide-react";
import { players } from "../lib/mock-data";

export const Route = createFileRoute("/recordes")({
  head: () => ({
    meta: [
      { title: "Recordes — Central da Liga" },
      { name: "description", content: "Líderes históricos em todas as categorias estatísticas" },
    ],
  }),
  component: Recordes,
});

interface LeaderCardProps {
  category: string;
  abbreviation: string;
  players: { name: string; value: number }[];
  unit?: string;
}

function LeaderCard({ category, abbreviation, players: leaders, unit = "" }: LeaderCardProps) {
  return (
    <div className="glass-elevated rounded-2xl p-5 transition-transform hover:scale-[1.01]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">{abbreviation}</h3>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {category}
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-neon" />
      </div>
      <div className="space-y-2.5">
        {leaders.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                i === 0 ? "bg-neon/20 text-neon" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`flex-1 text-sm ${i === 0 ? "font-bold" : "font-medium text-muted-foreground"}`}
            >
              {p.name}
            </span>
            <span className={`text-sm font-extrabold ${i === 0 ? "neon-text" : ""}`}>
              {p.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Recordes() {
  const categories = [
    { key: "pts" as const, label: "Pontos Totais", abbr: "PTS" },
    { key: "reb" as const, label: "Ressaltos Totais", abbr: "REB" },
    { key: "ast" as const, label: "Assistências Totais", abbr: "AST" },
    { key: "stl" as const, label: "Roubos Totais", abbr: "STL" },
    { key: "blk" as const, label: "Tocos Totais", abbr: "BLK" },
    { key: "rings" as const, label: "Campeonatos", abbr: "RINGS" },
  ];

  const calculateTotal = (player: (typeof players)[0], key: string) => {
    if (key === "rings") return player.rings;
    // Assuming 82 games per season to calculate the career total based on per-game averages
    const total = (player[key as keyof typeof player] as number) * player.seasons * 82;
    return Math.round(total);
  };

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl neon-border">
          <Crown className="h-5 w-5 text-neon" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Recordes</h1>
          <p className="text-sm text-muted-foreground">Líderes históricos em números absolutos</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat, i) => {
          const sorted = [...players]
            .map((p) => ({ name: p.name, value: calculateTotal(p, cat.key) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

          return (
            <div
              key={cat.key}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <LeaderCard category={cat.label} abbreviation={cat.abbr} players={sorted} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
