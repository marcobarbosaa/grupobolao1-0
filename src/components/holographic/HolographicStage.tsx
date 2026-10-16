import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { HolographicPlayer } from "../../lib/holographic-player";
import { viewClipPath } from "../../lib/holographic-player";
import { usePlayerMotion } from "../players/usePlayerMotion";
import type { HolographicScene } from "./createHolographicScene";
import type { LoadedPlayerAsset } from "./usePlayerAssets";

export function HolographicStage({
  player,
  asset,
  ready,
  flat,
  hovered,
  onHover,
}: {
  player: HolographicPlayer;
  asset?: LoadedPlayerAsset;
  ready: boolean;
  flat: boolean;
  hovered: boolean;
  onHover: (value: boolean) => void;
}) {
  const motion = usePlayerMotion();
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<HolographicScene | null>(null);
  const currentAsset = useRef(asset);
  const currentHover = useRef(hovered);
  const [status, setStatus] = useState<"loading" | "3d" | "unavailable" | "limited">("loading");
  const [failure, setFailure] = useState(false);
  const canRender = motion && !flat && Boolean(asset?.view) && !failure;

  useEffect(() => {
    currentAsset.current = asset;
    if (asset) controller.current?.setAsset(asset);
  }, [asset]);
  useEffect(() => {
    currentHover.current = hovered;
    controller.current?.setHovered(hovered);
  }, [hovered]);
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
        if (cancelled || !host.current) return;
        instance = createHolographicScene(host.current, () => {
          if (!cancelled) {
            setFailure(true);
            setStatus("unavailable");
          }
        });
        controller.current = instance;
        if (currentAsset.current) instance.setAsset(currentAsset.current);
        instance.setHovered(currentHover.current);
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

  const is3d = canRender && status === "3d";
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
                ? "Palco 3D · vistas do atleta"
                : "Preparando palco 3D";

  return (
    <div
      className="holo-visual"
      data-render-mode={is3d ? "3d" : "2d"}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        controller.current?.setPointer(
          ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        );
      }}
      onPointerLeave={() => controller.current?.setPointer(0, 0)}
    >
      <div className="holo-backdrop-word" aria-hidden="true">
        {player.name}
      </div>
      <div ref={host} className="holo-canvas" aria-hidden="true" />
      {!is3d && (
        <div className="holo-flat" aria-hidden="true">
          <div className="holo-flat-platform" />
          {asset ? (
            <div className={`holo-flat-figure ${asset.view ? "" : "is-portrait"}`}>
              <img
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
        to="/jogadores/$id"
        params={{ id: player.id }}
        className="holo-player-target"
        aria-label={`Abrir carreira de ${player.name}`}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
      >
        <span className="holo-target-label">
          Explorar carreira <span aria-hidden="true">↗</span>
        </span>
      </Link>
      <p className="holo-render-label" role="status">
        <span />
        {reason}
      </p>
    </div>
  );
}
