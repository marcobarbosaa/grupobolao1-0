import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { selectionRoster as newRoster } from "../../lib/player-selection-identity";
import { useLandingTheme } from "../home/LandingThemeShell";
import "./PlayerSelection.css";

const wrapped = (n: number) => (n + newRoster.length) % newRoster.length;

export function PlayerSelection() {
  const theme = useLandingTheme();
  const [fallback, setFallback] = useState<string[]>([]);
  const suppressClick = useRef(false);
  const startX = useRef<number | null>(null);
  const playerIndex = theme?.playerIndex ?? 0;
  const setPlayerIndex = theme?.setPlayerIndex;
  const active = newRoster[playerIndex];

  const move = useCallback(
    (delta: number) => setPlayerIndex?.((current) => wrapped(current + delta)),
    [setPlayerIndex],
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
        return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  return (
    <section className="player-select" aria-label="Selecionar jogador">
      <div className="player-select__texture" aria-hidden="true" />
      <h1 className="sr-only">Jogadores</h1>
      <div className="player-select__crests" aria-hidden="true">
        {newRoster.map((player, index) => (
          <img
            key={player.id}
            src={player.crest}
            alt=""
            data-active={index === playerIndex}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        ))}
      </div>
      <div className="player-select__backdrop" aria-hidden="true">
        JOGADORES
      </div>
      <div
        className="player-select__stage"
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          startX.current = event.isPrimary && event.pointerType !== "mouse" ? event.clientX : null;
        }}
        onPointerMove={(event) => {
          if (startX.current !== null && Math.abs(event.clientX - startX.current) > 45) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          startX.current = null;
        }}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          if (Math.abs(delta) > 45) {
            suppressClick.current = true;
            move(delta < 0 ? 1 : -1);
          }
          startX.current = null;
        }}
      >
        {newRoster.map((player, index) => {
          const offset = (index - playerIndex + newRoster.length) % newRoster.length;
          const position =
            offset === 0
              ? "center"
              : offset === 1
                ? "right"
                : offset === newRoster.length - 1
                  ? "left"
                  : "hidden";
          const portrait = fallback.includes(player.id) ? player.crest : player.selectionPortrait;
          const figure = (
            <img
              src={portrait}
              alt={player.name}
              draggable={false}
              decoding="async"
              loading={position === "hidden" ? "lazy" : "eager"}
              onError={(event) => {
                if (fallback.includes(player.id)) event.currentTarget.style.visibility = "hidden";
                else setFallback((current) => [...current, player.id]);
              }}
            />
          );
          return (
            <div
              key={player.id}
              className="player-select__figure"
              data-position={position}
              data-player={player.id}
              aria-hidden={position === "hidden"}
            >
              <Link
                to="/jogadores/$id"
                params={{ id: player.id }}
                tabIndex={position === "hidden" ? -1 : 0}
                aria-label={`${position === "center" ? "Abrir perfil de" : "Selecionar"} ${player.name}`}
                onClick={(event) => {
                  if (position !== "center") {
                    event.preventDefault();
                    move(position === "left" ? -1 : 1);
                  }
                }}
              >
                {figure}
              </Link>
            </div>
          );
        })}
      </div>
      <div className="player-select__content" key={active.id}>
        <h2>{active.name}</h2>
        <p className="player-select__details">
          {active.number !== undefined && <span>#{active.number}</span>}
          {active.positions.length > 0 && <span> — {active.positions.join(" / ")}</span>}
        </p>
        <p className="player-select__team">
          <img
            src={active.crest}
            alt=""
            width={32}
            height={32}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
          {active.team}
        </p>
        <Link className="player-select__profile" to="/jogadores/$id" params={{ id: active.id }}>
          VER PERFIL <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {active.name}, {active.team}. Jogador {playerIndex + 1} de {newRoster.length}.
      </p>
      <nav className="player-select__controls" aria-label="Controles do carrossel">
        <button type="button" onClick={() => move(-1)} aria-label="Jogador anterior">
          <ArrowLeft size={23} />
        </button>
        <span>
          <b key={active.id}>{String(playerIndex + 1).padStart(2, "0")}</b> <i />{" "}
          {String(newRoster.length).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => move(1)} aria-label="Próximo jogador">
          <ArrowRight size={23} />
        </button>
      </nav>
      <div className="player-select__instruction">USE AS SETAS OU ARRASTE PARA ESCOLHER</div>
    </section>
  );
}
