import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { 
  Trophy, 
  Star, 
  History, 
  User as UserIcon, 
  ArrowLeft, 
  Target, 
  Shield, 
  Zap,
  TrendingUp,
  Award,
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { players, getArchetypeColor, getYearFromSeason } from "../lib/mock-data";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/jogadores/$id")({
  component: PlayerProfile,
});

function PlayerProfile() {
  const { id } = Route.useParams();
  const player = players.find((p) => p.id === Number(id));
  const [activePhase, setActivePhase] = useState<"Regular" | "Playoffs" | "Finals">("Regular");

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold text-muted-foreground">Jogador não encontrado</p>
        <Link to="/" className="text-neon flex items-center gap-2 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Início
        </Link>
      </div>
    );
  }

  // Dados para o Radar de Atributos (Simulados com base nas notas e stats)
  const radarData = [
    { subject: "Pontuação", A: Math.min(player.pts * 4, 100) },
    { subject: "Rebotes", A: Math.min(player.reb * 6, 100) },
    { subject: "Assistências", A: Math.min(player.ast * 8, 100) },
    { subject: "Defesa", A: Math.min((player.stl + player.blk) * 20, 100) },
    { subject: "Clutch", A: player.clutchIndex },
    { subject: "QI", A: player.basketballIQ * 20 },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      {/* Botão Voltar */}
      <div className="p-4 lg:px-8">
        <Link 
          to="/biografias" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-neon transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Biografias
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-y border-border/50 bg-card/20 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-10 blur-3xl">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Foto Principal */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon to-gold rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative w-64 h-80 lg:w-80 lg:h-[450px] rounded-2xl overflow-hidden glass-elevated border-neon/20">
                {player.imageUrl ? (
                  <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <UserIcon className="h-32 w-32 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              {/* Badge de Score Total */}
              <div className="absolute -bottom-6 -right-6 glass-elevated rounded-2xl p-4 border-neon/50 animate-bounce-slow">
                <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Score Total</p>
                <p className="text-3xl font-black neon-text">{player.scoreTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-background/50 backdrop-blur-md mb-4 ${getArchetypeColor(player.archetype)}`}>
                  <Target className="h-3 w-3" /> {player.archetype}
                </span>
                <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter text-foreground italic">
                  {player.name}
                </h1>
                <p className="text-lg text-muted-foreground font-medium mt-2">
                  {player.teams.join(" • ")}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto lg:mx-0">
                <div className="glass rounded-2xl p-4 border-gold/30">
                  <Trophy className="h-5 w-5 text-gold mb-1 mx-auto lg:mx-0" />
                  <p className="text-2xl font-black text-gold">{player.rings}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Títulos</p>
                </div>
                <div className="glass rounded-2xl p-4 border-neon/30">
                  <Star className="h-5 w-5 text-neon mb-1 mx-auto lg:mx-0" />
                  <p className="text-2xl font-black text-neon">{player.seasons}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Seasons</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <Zap className="h-5 w-5 text-blue-400 mb-1 mx-auto lg:mx-0" />
                  <p className="text-2xl font-black text-blue-400">{player.clutchIndex}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Clutch</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <Award className="h-5 w-5 text-emerald-400 mb-1 mx-auto lg:mx-0" />
                  <p className="text-2xl font-black text-emerald-400">{player.basketballIQ.toFixed(1)}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">QI Basket</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid gap-8 lg:grid-cols-3">
        {/* Lado Esquerdo: Bio e Tabela */}
        <div className="lg:col-span-2 space-y-8">
          {/* Biografia */}
          <div className="glass-elevated rounded-3xl p-8 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-neon">
              <BookOpen className="h-5 w-5" /> A História do Jogador
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap italic font-serif">
              "{player.bio}"
            </p>
          </div>

          {/* Histórico de Temporadas com Filtro */}
          <div className="glass-elevated rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between bg-muted/20 gap-4">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <History className="h-5 w-5 text-neon" /> Médias por Temporada
              </h3>
              
              <Tabs defaultValue="Regular" onValueChange={(v) => setActivePhase(v as any)} className="w-full sm:w-auto">
                <TabsList className="bg-background/50 border border-border/50">
                  <TabsTrigger value="Regular" className="text-[10px] font-black uppercase">Regular</TabsTrigger>
                  <TabsTrigger value="Playoffs" className="text-[10px] font-black uppercase">Playoffs</TabsTrigger>
                  <TabsTrigger value="Finals" className="text-[10px] font-black uppercase">Finais</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <th className="px-4 py-4 text-left">Ano</th>
                    <th className="px-4 py-4 text-left">Equipa</th>
                    <th className="px-2 py-4">GP</th>
                    <th className="px-2 py-4">PTS</th>
                    <th className="px-2 py-4">REB</th>
                    <th className="px-2 py-4">AST</th>
                    <th className="px-2 py-4">STL</th>
                    <th className="px-2 py-4">BLK</th>
                    <th className="px-2 py-4">TO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {player.career.map((year) => {
                    const stats = year.stats[activePhase];
                    return (
                      <tr key={year.season} className="hover:bg-muted/20 transition-colors text-center">
                        <td className="px-4 py-4 text-left">
                          <p className="font-bold text-neon text-xs">{year.year}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black">S{year.season}</p>
                        </td>
                        <td className="px-4 py-4 text-left font-semibold">{year.team}</td>
                        {stats ? (
                          <>
                            <td className="px-2 py-4 font-black text-muted-foreground/60">{stats.gp}</td>
                            <td className="px-2 py-4 font-black">{stats.pts.toFixed(1)}</td>
                            <td className="px-2 py-4 text-muted-foreground">{stats.reb.toFixed(1)}</td>
                            <td className="px-2 py-4 text-muted-foreground">{stats.ast.toFixed(1)}</td>
                            <td className="px-2 py-4 text-muted-foreground">{stats.stl.toFixed(1)}</td>
                            <td className="px-2 py-4 text-muted-foreground">{stats.blk.toFixed(1)}</td>
                            <td className="px-2 py-4 text-muted-foreground/50 text-[11px]">{stats.topg.toFixed(1)}</td>
                          </>
                        ) : (
                          <td colSpan={7} className="px-2 py-4 text-[10px] uppercase font-black text-white italic tracking-widest">
                            {(() => {
                              if (activePhase === "Playoffs") return "Não se classificou";
                              
                              // Lógica para aba de Finais
                              const poStats = year.stats.Playoffs;
                              if (!poStats) return "Não se classificou";
                              
                              if (poStats.gp <= 7) return "Eliminado no 1º Round";
                              if (poStats.gp <= 13) return "Eliminado nas Semifinais de Conf.";
                              return "Eliminado nas Finais de Conf.";
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito: Radar e Boletim */}
        <div className="space-y-8">
          {/* Radar Chart */}
          <div className="glass-elevated rounded-3xl p-6">
            <h3 className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Gráfico de Atributos</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 700 }} />
                  <Radar
                    name={player.name}
                    dataKey="A"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Boletim de Performance */}
          <div className="glass-elevated rounded-3xl p-6 space-y-6">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <TrendingUp className="h-5 w-5 text-neon" /> Boletim de Performance
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-muted-foreground">Regular Season</span>
                  <span className="text-foreground">{player.regularSeasonGrade.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${player.regularSeasonGrade * 10}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-muted-foreground">Playoffs</span>
                  <span className="text-foreground">{player.playoffsGrade.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gold shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${player.playoffsGrade * 10}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-muted-foreground">Finais</span>
                  <span className="text-foreground">{player.finalsGrade.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-neon shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${player.finalsGrade * 10}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="bg-neon/10 border border-neon/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black uppercase text-neon tracking-widest mb-1">Nota Final de Legado</p>
                <p className="text-4xl font-black neon-text">{player.scoreTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
