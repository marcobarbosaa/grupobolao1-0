import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, User, Trophy, Star, TrendingUp } from "lucide-react";
import { players, getArchetypeColor } from "../lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/biografias")({
  head: () => ({
    meta: [
      { title: "Jogadores — Grupo Bolão 2.0" },
      { name: "description", content: "Conheça a história dos maiores jogadores da liga" },
    ],
  }),
  component: Biografias,
});

function Biografias() {
  const sortedPlayers = [...players].sort((a, b) => b.scoreTotal - a.scoreTotal);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl neon-border">
          <BookOpen className="h-6 w-6 text-neon" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Biografias</h1>
          <p className="text-muted-foreground">O legado em fotos. Clique para ler a história.</p>
        </div>
      </div>

      {/* Carrossel de Cartões de Jogador */}
      <div className="flex-1 flex flex-col justify-center max-w-[1400px] w-full mx-auto pb-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {sortedPlayers.map((player, i) => (
              <CarouselItem
                key={player.id}
                className="pl-2 md:pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="glass-elevated cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-neon hover:shadow-xl hover:shadow-neon/20 group h-full flex flex-col">
                      {/* Área da Foto */}
                      <div className="relative aspect-[3/4] w-full bg-muted/30 overflow-hidden flex items-center justify-center border-b border-border/50">
                        {/* Se o jogador tiver imageUrl, renderiza a imagem, senão a silhueta padrão */}
                        {player.imageUrl ? (
                          <img
                            src={player.imageUrl}
                            alt={player.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                        )}

                        {!player.imageUrl && (
                          <User className="h-20 w-20 text-muted-foreground/50" />
                        )}

                        {/* Overlay Gradiente Base */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />

                        {/* Textos em cima da foto */}
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                          <h3 className="text-xl font-black uppercase tracking-wider group-hover:neon-text transition-colors drop-shadow-md">
                            {player.name}
                          </h3>
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 mt-1 text-[9px] uppercase font-black tracking-widest bg-background/80 backdrop-blur-md ${getArchetypeColor(
                              player.archetype,
                            )}`}
                          >
                            {player.archetype}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-3 bg-card/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gold">
                            <Trophy className="h-4 w-4" />
                            <span className="text-xs font-bold">{player.rings} Anéis</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-neon">
                            <Star className="h-4 w-4" />
                            <span className="text-xs font-bold">{player.seasons} Seasons</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[700px] p-0 glass-elevated border-neon/30 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Foto no pop-up (lado esquerdo) */}
                      <div className="w-full md:w-2/5 md:min-h-[400px] bg-muted relative flex justify-center items-center overflow-hidden">
                        {player.imageUrl ? (
                          <img
                            src={player.imageUrl}
                            alt={player.name}
                            className="absolute w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-24 w-24 text-muted-foreground/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent md:bg-gradient-to-r" />
                        <div className="absolute bottom-4 left-6 md:bottom-auto md:top-6 z-10">
                          <DialogTitle className="text-3xl font-black neon-text uppercase tracking-tight">
                            {player.name}
                          </DialogTitle>
                          <DialogDescription className="text-xs font-bold uppercase tracking-widest mt-1 text-foreground/80">
                            {player.teams.join(" • ")}
                          </DialogDescription>
                        </div>
                      </div>

                      {/* Informações no pop-up (lado direito) */}
                      <div className="w-full md:w-3/5 p-6 flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="mb-6">
                          <span
                            className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${getArchetypeColor(player.archetype)}`}
                          >
                            {player.archetype}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-6">
                          <div className="rounded-xl border border-border/50 bg-background/50 p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                              Títulos
                            </p>
                            <p className="text-base font-black text-gold">{player.rings}</p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-background/50 p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                              Pontos
                            </p>
                            <p className="text-base font-black">{player.pts}</p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-background/50 p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                              Nota Reg
                            </p>
                            <p className="text-base font-black">{player.regularSeasonGrade}</p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-background/50 p-2 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                              Nota PO
                            </p>
                            <p className="text-base font-black">{player.playoffsGrade}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neon border-b border-border/50 pb-2">
                              <BookOpen className="h-4 w-4" /> A Jornada
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap italic">
                              "{player.bio}"
                            </p>
                          </div>
                          
                          <Link
                            to="/jogadores/$id"
                            params={{ id: player.id.toString() }}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-neon text-black font-black uppercase tracking-widest text-xs hover:bg-neon/80 transition-colors mt-4 shadow-lg shadow-neon/20"
                          >
                            Ver Perfil Completo <TrendingUp className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12 border-neon/50 text-neon hover:bg-neon hover:text-black" />
            <CarouselNext className="-right-12 border-neon/50 text-neon hover:bg-neon hover:text-black" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
