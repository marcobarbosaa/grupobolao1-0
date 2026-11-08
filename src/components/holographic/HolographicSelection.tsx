import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { HolographicPlayer, PlayerAngle } from "../../lib/holographic-player";
import { CHAMBER_MOTION } from "../../lib/chamber-layout";
import { usePlayerMotion } from "../players/usePlayerMotion";
import { usePlayerAssets } from "./usePlayerAssets";
import type { LoadedPlayerAsset } from "./usePlayerAssets";
import { HolographicStage } from "./HolographicStage";
import { PlayerOverlay } from "./PlayerOverlay";

export interface ChamberAssets {
  assets: LoadedPlayerAsset[];
  missing: string[];
  ready: boolean;
}

/** Keep the proven timeout/cancellation/fallback loader for each real roster entry. */
function AssetRegistration({
  player,
  register,
}: {
  player: HolographicPlayer;
  register: (id: string, result: ChamberAssets) => void;
}) {
  const result = usePlayerAssets(player);
  useEffect(() => {
    if (result.ready) register(player.id, result);
  }, [player.id, result, register]);
  return null;
}

export function HolographicSelection({ players }: { players: HolographicPlayer[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [angle, setAngle] = useState<PlayerAngle>("front");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inspected, setInspected] = useState(false);
  const [flat, setFlat] = useState(false);
  const [opening, setOpening] = useState(false);
  const [library, setLibrary] = useState<Record<string, ChamberAssets>>({});
  const exitTimer = useRef<number | undefined>(undefined);
  const hoverTimer = useRef<number | undefined>(undefined);
  const navigate = useNavigate();
  const motion = usePlayerMotion();
  const index = Math.min(selectedIndex, Math.max(0, players.length - 1));
  const player = players[index];
  const result = player ? library[player.id] : undefined;
  const asset = result?.assets.find((item) => item.view?.angle === angle) ?? result?.assets[0];
  const revealed = hovered || focused || inspected;
  const register = useCallback((id: string, assets: ChamberAssets) => {
    setLibrary((previous) => ({ ...previous, [id]: assets }));
  }, []);
  useEffect(
    () => () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(hoverTimer.current);
    },
    [],
  );
  const onHover = useCallback((value: boolean) => {
    window.clearTimeout(hoverTimer.current);
    if (value) setHovered(true);
    else hoverTimer.current = window.setTimeout(() => setHovered(false), 160);
  }, []);
  const select = (next: number) => {
    if (opening || next < 0 || next >= players.length || next === index) return;
    setSelectedIndex(next);
    setAngle("front");
    setHovered(false);
    setInspected(false);
  };
  const openProfile = (event: MouseEvent<HTMLAnchorElement>) => {
    // Preserve native modified links, history and copyable URLs.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (opening || !player) return;
    setOpening(true);
    exitTimer.current = window.setTimeout(
      () => void navigate({ to: "/jogadores/$id", params: { id: player.id } }),
      motion && !flat ? CHAMBER_MOTION.profile : 0,
    );
  };
  if (!player)
    return <p className="holo-empty">A seleção de atletas estará disponível em breve.</p>;
  return (
    <div className="holo-page">
      {players.map((entry) => (
        <AssetRegistration key={entry.id} player={entry} register={register} />
      ))}
      <section
        className={`holo-chamber ${revealed ? "is-engaged" : ""} ${opening ? "is-opening" : ""}`}
        aria-label="Sala de seleção de atletas"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "Escape") {
            setInspected(false);
            setFocused(false);
            setHovered(false);
          }
          if ((event.target as HTMLElement).closest(".holo-angle-controls")) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <header className="holo-chamber-top">
          <div className="holo-heading">
            <p className="eyebrow">
              <span /> Grupo Bolão / NBA 2K26
            </p>
            <h1>
              OS PROTAGONISTAS<span>.</span>
            </h1>
          </div>
          <button
            type="button"
            className="holo-mode-button"
            aria-pressed={flat}
            onClick={() => setFlat(!flat)}
          >
            Modo leve <span>{flat ? "Ativado" : "Desativado"}</span>
          </button>
        </header>
        <HolographicStage
          players={players}
          library={library}
          selectedIndex={index}
          player={player}
          asset={asset}
          ready={Boolean(result?.ready)}
          flat={flat}
          hovered={revealed}
          opening={opening}
          onHover={onHover}
          onFocus={setFocused}
          onInspect={() => setInspected(true)}
          onOpen={openProfile}
          onStep={(direction) => select(index + direction)}
        />
        <div
          className="holo-context"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") onHover(true);
          }}
          onPointerLeave={() => onHover(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
          }}
        >
          <PlayerOverlay player={player} revealed={revealed} onOpen={openProfile} />
        </div>
        <div className="holo-discovery">
          <span className="holo-discovery-index">
            {String(index + 1).padStart(2, "0")} / EM CENA
          </span>
          <button
            type="button"
            aria-expanded={revealed}
            aria-controls="athlete-information"
            className="holo-discover-button"
            onClick={() => {
              setInspected(!revealed);
              setFocused(false);
              setHovered(false);
            }}
          >
            {revealed ? "Fechar apresentação" : `Conhecer ${player.name}`}
            {revealed ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          </button>
          <span className="holo-discovery-hint">Aproxime-se. Cada carreira tem uma história.</span>
        </div>
        <details className="holo-angle-controls">
          <summary>
            Inspecionar atleta <span aria-hidden="true">＋</span>
          </summary>
          <div className="holo-angle-buttons" role="group" aria-label="Ângulo do atleta">
            {player.views.map((view) => {
              const available = result?.assets.some(
                (candidate) => candidate.view?.angle === view.angle,
              );
              return (
                <button
                  key={view.angle}
                  type="button"
                  disabled={!available}
                  aria-pressed={asset?.view?.angle === view.angle}
                  title={!available ? `${view.label}: referência indisponível` : view.label}
                  onClick={() => setAngle(view.angle)}
                >
                  {view.angle === "left"
                    ? "Esquerda"
                    : view.angle === "right"
                      ? "Direita"
                      : view.label}
                </button>
              );
            })}
          </div>
          <p>Frente, perfis e costas.</p>
        </details>
        {result?.ready && result.missing.length > 0 && (
          <p className="holo-asset-notice" role="status">
            {!asset
              ? "Imagens indisponíveis. A carreira continua disponível."
              : !asset.view
                ? "Referências indisponíveis. Exibindo retrato do acervo."
                : `Vista exibida: ${asset.view.label.toLocaleLowerCase("pt-BR")}. Referências indisponíveis: ${result.missing.join(", ")}.`}
          </p>
        )}
        <footer className="holo-selector" aria-label="Seleção de atletas">
          <div className="holo-counter">
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span>/ {String(players.length).padStart(2, "0")}</span>
          </div>
          <div className="holo-roster" role="group" aria-label="Atletas disponíveis">
            {players.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={index === i}
                aria-label={`Selecionar ${entry.name}`}
                onClick={() => select(i)}
              >
                <span />
                {entry.name}
              </button>
            ))}
          </div>
          <span className="holo-coming-soon">O próximo capítulo está por vir.</span>
          <div className="holo-arrows">
            <button
              type="button"
              className="icon-button"
              aria-label="Atleta anterior"
              disabled={index === 0 || opening}
              onClick={() => select(index - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Próximo atleta"
              disabled={index >= players.length - 1 || opening}
              onClick={() => select(index + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
