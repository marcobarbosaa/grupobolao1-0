import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Trophy, Award, Star } from "lucide-react";
import { seasons } from "../lib/mock-data";

export const Route = createFileRoute("/temporadas")({
  head: () => ({
    meta: [
      { title: "Temporadas — Grupo Bolão 2.0" },
      { name: "description", content: "Histórico de todas as temporadas da liga NBA 2K" },
    ],
  }),
  component: Temporadas,
});

function Temporadas() {
  return (
    <div className="space-y-8 p-4 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl neon-border">
          <Calendar className="h-5 w-5 text-neon" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Temporadas</h1>
          <p className="text-sm text-muted-foreground">Histórico completo da Central da Liga</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {seasons.map((season, i) => (
          <div
            key={season.id}
            className="glass-elevated animate-fade-in-up rounded-2xl p-5 transition-transform hover:scale-[1.02]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {season.year}
              </span>
              <span className="rounded-full bg-neon/10 px-2.5 py-0.5 text-xs font-semibold text-neon">
                {season.name}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Campeão
                  </p>
                  <p className="text-sm font-bold">{season.champion}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-neon" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    MVP
                  </p>
                  <p className="text-sm font-semibold">{season.mvp}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Finals MVP
                  </p>
                  <p className="text-sm font-semibold">{season.finalsMvp}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
