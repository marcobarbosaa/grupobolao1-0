import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { newRoster } from "../../lib/new-roster";
import { useLandingTheme } from "../home/LandingThemeShell";
import "./PlayerSelection.css";

const image = (id: string) => `/jogadores/selecao/${id}.png`;
const wrapped = (n: number) => (n + newRoster.length) % newRoster.length;

export function PlayerSelection() {
  const theme = useLandingTheme();
  const [fallback, setFallback] = useState<string[]>([]);
  const [motionReduced, setMotionReduced] = useState(false);
  const startX = useRef<number | null>(null);
  const playerIndex = theme?.playerIndex ?? 0;
  const setPlayerIndex = theme?.setPlayerIndex;
  const active = newRoster[playerIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setMotionReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const move = (delta: number) => setPlayerIndex?.((current) => wrapped(current + delta));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="player-select" aria-label="Selecionar jogador" style={{ "--selection-duration": motionReduced ? "0ms" : "550ms" } as CSSProperties}>
      <div className="player-select__texture" aria-hidden="true" />
      <div className="player-select__orbit" aria-hidden="true" />
      <div className="player-select__header">
        <p>CENTRAL DO BOLÃO / ELENCO</p>
        <span>ESCOLHA SEU PROTAGONISTA</span>
      </div>
      <div className="player-select__backdrop" aria-hidden="true">JOGADORES</div>
      <div className="player-select__stage"
        onTouchStart={(event) => { startX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (startX.current === null) return;
          const delta = event.changedTouches[0]?.clientX - startX.current;
          if (typeof delta === "number" && Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
          startX.current = null;
        }}>
        {newRoster.map((player, index) => {
          const offset = (index - playerIndex + newRoster.length) % newRoster.length;
          const position = offset === 0 ? "center" : offset === 1 ? "right" : offset === newRoster.length - 1 ? "left" : "hidden";
          const portrait = fallback.includes(player.id) ? player.portrait : image(player.id);
          const figure = <img src={portrait} alt={player.name} draggable={false} decoding="async"
            loading={position === "hidden" ? "lazy" : "eager"}
            onError={() => setFallback((current) => current.includes(player.id) ? current : [...current, player.id])} />;
          return (
            <div key={player.id} className="player-select__figure" data-position={position} aria-hidden={position === "hidden"}>
              {position === "center" ? (
                <Link to="/jogadores/$id" params={{ id: player.id }} aria-label={`Abrir perfil de ${player.name}`} tabIndex={0}>
                  {figure}
                </Link>
              ) : position === "left" || position === "right" ? (
                <button type="button" onClick={() => move(position === "left" ? -1 : 1)}
                  aria-label={`Selecionar ${player.name}`}>{figure}</button>
              ) : figure}
            </div>
          );
        })}
      </div>
      <div className="player-select__content" aria-live="polite" aria-atomic="true">
        <span className="player-select__eyebrow">ATLETA {String(playerIndex + 1).padStart(2, "0")} / {newRoster.length}</span>
        <h1 key={active.id}>{active.name}</h1>
        <p>{active.team}</p>
        <Link className="player-select__profile" to="/jogadores/$id" params={{ id: active.id }}>
          ACESSAR PERFIL <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <nav className="player-select__controls" aria-label="Controles do carrossel">
        <button type="button" onClick={() => move(-1)} aria-label="Jogador anterior"><ArrowLeft size={23} /></button>
        <span>{String(playerIndex + 1).padStart(2, "0")} <i /> {String(newRoster.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Próximo jogador"><ArrowRight size={23} /></button>
      </nav>
      <div className="player-select__instruction">USE AS SETAS OU ARRASTE PARA ESCOLHER</div>
    </section>
  );
}
