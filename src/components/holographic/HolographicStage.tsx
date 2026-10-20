import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { HolographicPlayer } from "../../lib/holographic-player";
import { viewClipPath } from "../../lib/holographic-player";
import { usePlayerMotion } from "../players/usePlayerMotion";
import type { HolographicScene } from "./createHolographicScene";
import type { LoadedPlayerAsset } from "./usePlayerAssets";
import type { ChamberAssets } from "./HolographicSelection";

export function HolographicStage({
  players,
  library,
  selectedIndex,
  player,
  asset,
  ready,
  flat,
  hovered,
  opening,
  onHover,
  onFocus,
  onInspect,
  onOpen,
  onStep,
}: {
  players: HolographicPlayer[];
  library: Record<string, ChamberAssets>;
  selectedIndex: number;
  player: HolographicPlayer;
  asset?: LoadedPlayerAsset;
  ready: boolean;
  flat: boolean;
  hovered: boolean;
  opening: boolean;
  onHover: (value: boolean) => void;
  onFocus: (value: boolean) => void;
  onInspect: () => void;
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
  onStep: (direction: number) => void;
}) {
  const motion = usePlayerMotion();
  const host = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLAnchorElement>(null);
  const flatImage = useRef<HTMLImageElement>(null);
  const controller = useRef<HolographicScene | null>(null);
  const touch = useRef({ x: 0, y: 0, active: false, swiped: false });
  const snapshot = useRef({ players, library, selectedIndex, asset, hovered, opening });
  const [status, setStatus] = useState<"loading" | "3d" | "unavailable" | "limited">("loading");
  const [failure, setFailure] = useState(false);
  const hasViews = Object.values(library).some((entry) => entry.assets.some((item) => item.view));
  const canRender = motion && !flat && hasViews && !failure;

  useEffect(() => {
    snapshot.current = { players, library, selectedIndex, asset, hovered, opening };
    const scene = controller.current;
    if (!scene) return;
    scene.setRoster(
      players.map((entry) => entry.id),
      selectedIndex,
    );
    for (const entry of players) {
      const view = entry.id === player.id ? asset : library[entry.id]?.assets[0];
      if (view) scene.setAsset(entry.id, view);
    }
    scene.setHovered(hovered);
    scene.setOpening(opening);
  }, [players, library, selectedIndex, player.id, asset, hovered, opening]);

  useEffect(() => {
    if (!canRender) return;
    let cancelled = false;
    let instance: HolographicScene | undefined;
    const capabilities = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (
      (capabilities.deviceMemory && capabilities.deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      capabilities.connection?.saveData
    ) {
      setStatus("limited");
      return;
    }
    setStatus("loading");
    void import("./createHolographicScene")
      .then(({ createHolographicScene }) => {
        if (cancelled || !host.current || !target.current) return;
        instance = createHolographicScene(
          host.current,
          () => {
            if (!cancelled) {
              setFailure(true);
              setStatus("unavailable");
            }
          },
          target.current,
        );
        controller.current = instance;
        const current = snapshot.current;
        instance.setRoster(
          current.players.map((entry) => entry.id),
          current.selectedIndex,
        );
        current.players.forEach((entry, i) => {
          const view =
            i === current.selectedIndex ? current.asset : current.library[entry.id]?.assets[0];
          if (view) instance?.setAsset(entry.id, view);
        });
        instance.setHovered(current.hovered);
        instance.setOpening(current.opening);
        setStatus("3d");
      })
      .catch(() => {
        instance?.dispose();
        controller.current = null;
        if (!cancelled) {
          setFailure(true);
          setStatus("unavailable");
        }
      });
    return () => {
      cancelled = true;
      instance?.dispose();
      controller.current = null;
    };
  }, [canRender]);

  const is3d = canRender && status === "3d" && Boolean(asset?.view);
  // The fallback uses the same silhouette, mapped from the actual rendered image.
  useEffect(() => {
    if (is3d || !host.current || !target.current) return;
    const align = () => {
      const link = target.current;
      const image = flatImage.current;
      const container = host.current?.getBoundingClientRect();
      if (!link || !container) return;
      link.style.inset = "0";
      link.style.width = "";
      link.style.height = "";
      if (!image || !asset?.view) {
        link.style.clipPath = "inset(15% 30% 20%)";
        return;
      }
      const rect = image.getBoundingClientRect();
      const view = asset.view;
      link.style.clipPath = `polygon(${view.outline
        .map(
          ([x, y]) =>
            `${rect.left - container.left + (x / view.width) * rect.width}px ${rect.top - container.top + (y / view.height) * rect.height}px`,
        )
        .join(",")})`;
    };
    const observer = new ResizeObserver(align);
    observer.observe(host.current);
    if (flatImage.current) observer.observe(flatImage.current);
    align();
    return () => observer.disconnect();
  }, [is3d, asset]);
  const reason = !ready
    ? "Preparando apresentação"
    : flat
      ? "Apresentação 2D"
      : !motion
        ? "Apresentação sem movimento"
        : !asset?.view
          ? "Retrato do acervo"
          : status === "limited"
            ? "Apresentação leve"
            : failure
              ? "Apresentação 2D · 3D indisponível"
              : is3d
                ? "Sala de atletas / Grupo Bolão"
                : "Preparando palco 3D";
  return (
    <div
      className="holo-visual"
      data-render-mode={is3d ? "3d" : "2d"}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        controller.current?.setPointer(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * 2 - 1,
        );
      }}
      onPointerLeave={() => {
        controller.current?.setPointer(0, 0);
        onHover(false);
      }}
      onPointerDown={(event) => {
        touch.current = {
          x: event.clientX,
          y: event.clientY,
          active: event.pointerType !== "mouse",
          swiped: false,
        };
      }}
      onPointerUp={(event) => {
        const gesture = touch.current;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (gesture.active && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          gesture.swiped = true;
          onStep(dx < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => {
        touch.current.swiped = true;
      }}
    >
      <div className="holo-room-word" aria-hidden="true">
        THE PLAYERS CHAMBER
      </div>
      <div
        ref={host}
        className="holo-canvas"
        aria-hidden="true"
        style={{ visibility: is3d ? "visible" : "hidden" }}
      />
      {!is3d && (
        <div className="holo-flat" aria-hidden="true">
          <div className="holo-flat-platform" />
          {asset ? (
            <div
              className={`holo-flat-figure ${asset.view ? "" : "is-portrait"}`}
              style={
                asset.view
                  ? {
                      height: `${(74 * asset.view.height) / (asset.view.bottom - asset.view.top)}%`,
                      bottom: `${15 - (74 * (asset.view.height - asset.view.bottom)) / (asset.view.bottom - asset.view.top)}%`,
                    }
                  : undefined
              }
            >
              <img
                ref={flatImage}
                src={asset.src}
                alt=""
                width={asset.view?.width ?? 896}
                height={asset.view?.height ?? 1200}
                style={asset.view ? { clipPath: viewClipPath(asset.view) } : undefined}
              />
            </div>
          ) : (
            <div className="holo-initials">{player.name.slice(0, 2).toUpperCase()}</div>
          )}
        </div>
      )}
      <Link
        ref={target}
        to="/jogadores/$id"
        params={{ id: player.id }}
        className="holo-player-target"
        aria-label={`Abrir carreira de ${player.name}`}
        aria-describedby="holo-interaction-hint"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") onHover(true);
        }}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onFocus(true)}
        onBlur={() => onFocus(false)}
        onClick={(event) => {
          if (touch.current.swiped) {
            event.preventDefault();
            touch.current.swiped = false;
            return;
          }
          if (touch.current.active && event.detail !== 0) {
            event.preventDefault();
            onInspect();
            return;
          }
          onOpen(event);
        }}
      />
      <p className="sr-only" id="holo-interaction-hint">
        Enter abre a carreira. No toque, selecione o atleta e use Abrir carreira. Use as setas para
        navegar entre atletas disponíveis.
      </p>
      <span className="holo-focus-label" aria-hidden="true">
        Explorar carreira ↗
      </span>
      <p className="holo-render-label" role="status">
        <span />
        {reason}
      </p>
    </div>
  );
}
