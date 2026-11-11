import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Trophy,
  Activity,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
} from "lucide-react";
import { newRoster } from "../../lib/new-roster";
import "./CinematicHome.css";
import { useLandingTheme } from "./LandingThemeShell";

type Highlight = {
  label: string;
  headline: string;
  description: string;
  to: "/temporadas" | "/jogadores/$id";
  playerId?: string;
};
type EditorialGroup = { id: string; label: string; items: readonly Highlight[] };
const season2007: readonly EditorialGroup[] = [
  {
    id: "legado",
    label: "Legado",
    items: [
      {
        label: "01 / CAMPEÃO",
        headline: "NEW YORK KNICKS",
        description: "Título da temporada 2006–07.",
        to: "/temporadas",
      },
      {
        label: "02 / NBA FINALS",
        headline: "4 — 0",
        description: "Knicks superam os Timberwolves.",
        to: "/temporadas",
      },
      {
        label: "03 / FINAL DO OESTE",
        headline: "MIN 4 — 3 PHX",
        description: "Minnesota avança à decisão.",
        to: "/temporadas",
      },
      {
        label: "04 / FINAL DO LESTE",
        headline: "NY 4 — 2 DET",
        description: "New York elimina Detroit.",
        to: "/temporadas",
      },
    ],
  },
  {
    id: "campanhas",
    label: "Campanhas",
    items: [
      {
        label: "01 / MELHOR CAMPANHA",
        headline: "63 — 19",
        description: "Phoenix Suns · 2006–07.",
        to: "/temporadas",
      },
      {
        label: "02 / LÍDER DO LESTE",
        headline: "56 — 26",
        description: "Detroit Pistons · temporada regular.",
        to: "/temporadas",
      },
      {
        label: "03 / APROVEITAMENTO",
        headline: "76,8%",
        description: "Phoenix liderou o Oeste.",
        to: "/temporadas",
      },
      {
        label: "04 / CONFERÊNCIAS",
        headline: "30 FRANQUIAS",
        description: "15 no Leste e 15 no Oeste.",
        to: "/temporadas",
      },
    ],
  },
  {
    id: "protagonistas",
    label: "Protagonistas",
    items: [
      {
        label: "01 / NOVA GERAÇÃO",
        headline: "13 JOGADORES",
        description: "Os atletas da Central do Bolão.",
        to: "/jogadores/$id",
        playerId: "nando",
      },
      {
        label: "02 / HOUSTON ROCKETS",
        headline: "NANDO",
        description: "Um dos protagonistas da liga.",
        to: "/jogadores/$id",
        playerId: "nando",
      },
      {
        label: "03 / NEW YORK KNICKS",
        headline: "JONAS",
        description: "Integrante do elenco campeão.",
        to: "/jogadores/$id",
        playerId: "jonas",
      },
      {
        label: "04 / MINNESOTA",
        headline: "TAILAN",
        description: "Finalista da temporada 2006–07.",
        to: "/jogadores/$id",
        playerId: "tailan",
      },
    ],
  },
];
const season2006: readonly EditorialGroup[] = [
  {
    id: "arquivo",
    label: "Arquivo",
    items: [
      {
        label: "01 / TEMPORADA 01",
        headline: "2005 — 06",
        description: "Primeiro capítulo do arquivo da liga.",
        to: "/temporadas",
      },
      {
        label: "02 / HISTÓRICO",
        headline: "13 ATLETAS",
        description: "Consulte os registros dos jogadores.",
        to: "/jogadores/$id",
        playerId: "nando",
      },
      {
        label: "03 / DADOS OFICIAIS",
        headline: "ESTATÍSTICAS",
        description: "Temporada regular e playoffs disponíveis.",
        to: "/temporadas",
      },
      {
        label: "04 / RETROSPECTIVA",
        headline: "EM REVISÃO",
        description: "Destaques editoriais ainda não confirmados.",
        to: "/temporadas",
      },
    ],
  },
];
const seasons = [
  { id: "season-002", name: "2006–07" },
  { id: "season-001", name: "2005–06" },
] as const;

export function CinematicHome() {
  const { playerIndex, setPlayerIndex, firstPlayer } = useLandingTheme()!;
  const [seasonId, setSeasonId] = useState<(typeof seasons)[number]["id"]>("season-002");
  const [groupIndex, setGroupIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [brokenPortraits, setBrokenPortraits] = useState<readonly string[]>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const groups = seasonId === "season-002" ? season2007 : season2006;
  const group = groups[groupIndex % groups.length];
  useEffect(() => {
    if (interacting || reduceMotion || groups.length < 2) return;
    const timer = window.setInterval(
      () => setGroupIndex((current) => (current + 1) % groups.length),
      8500,
    );
    return () => window.clearInterval(timer);
  }, [interacting, reduceMotion, groups.length]);

  // The functional update keeps one interval for the entire carousel lifecycle.
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setPlayerIndex((current) => (current + 1) % newRoster.length);
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, setPlayerIndex]);

  return (
    <section className="arena-home" aria-label="Central do Bolão, página inicial">
      <div className="arena-home__pattern" aria-hidden="true" />
      <div className="arena-home__type" aria-hidden="true">
        <span>CENTRAL DO</span>
        <strong>BOLÃO</strong>
      </div>
      <div className="arena-home__diagonal arena-home__diagonal--left" aria-hidden="true" />
      <div className="arena-home__diagonal arena-home__diagonal--right" aria-hidden="true" />

      {newRoster.map((player, index) => {
        const active = index === playerIndex;
        const landingImage = `/jogadores/landing/${player.id}.png`;
        const portraitSource = brokenPortraits.includes(`${player.id}:landing`)
          ? player.portrait
          : landingImage;
        const missingPortrait = brokenPortraits.includes(`${player.id}:original`);
        return (
          <div
            key={player.id}
            className="arena-home__slide"
            data-active={active}
            aria-hidden={!active}
          >
            <div className="arena-home__figure">
              {missingPortrait ? (
                <span className="arena-home__figure-fallback" role="img" aria-label={player.name}>
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <img
                  src={portraitSource}
                  alt={`${player.name}, atleta do ${player.team}`}
                  width={1024}
                  height={1536}
                  decoding="async"
                  fetchPriority={index === firstPlayer ? "high" : "low"}
                  onError={() =>
                    setBrokenPortraits((current) => [
                      ...current,
                      `${player.id}:${portraitSource === landingImage ? "landing" : "original"}`,
                    ])
                  }
                />
              )}
            </div>
            <div className="arena-home__player-info">
              <span className="arena-home__label">
                PROTAGONISTA / {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{player.name}</strong>
              <span className="arena-home__player-team">{player.team}</span>
            </div>
          </div>
        );
      })}

      <div className="arena-home__archive-controls">
        <label htmlFor="arena-season">TEMPORADA EM DESTAQUE</label>
        <select
          id="arena-season"
          value={seasonId}
          onChange={(event) => {
            setSeasonId(event.target.value as typeof seasonId);
            setGroupIndex(0);
          }}
        >
          {seasons.map((season) => (
            <option value={season.id} key={season.id}>
              {season.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className="arena-home__bottom"
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
        }}
      >
        <div className="arena-home__editorial-head">
          <div className="arena-home__editorial-title">
            <Activity size={15} aria-hidden="true" />
            <span>NA CENTRAL / {group.label.toUpperCase()}</span>
          </div>
        </div>
        <div className="arena-home__cards" key={`${seasonId}-${group.id}`}>
          {group.items.map((item, index) => {
            const Icon = [Trophy, ChartNoAxesColumnIncreasing, Activity, CalendarDays][index];
            const content = (
              <>
                <div className="arena-home__card-top">
                  <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                  <small>{item.label}</small>
                </div>
                <strong>{item.headline}</strong>
                <p>{item.description}</p>
                <ArrowRight className="arena-home__card-arrow" size={18} aria-hidden="true" />
              </>
            );
            return item.to === "/jogadores/$id" && item.playerId ? (
              <Link
                key={item.label}
                className="arena-home__card"
                to="/jogadores/$id"
                params={{ id: item.playerId }}
              >
                {content}
              </Link>
            ) : (
              <Link key={item.label} className="arena-home__card" to="/temporadas">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
