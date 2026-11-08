import { useEffect, useState } from "react";
import type { HolographicPlayer, PlayerView } from "../../lib/holographic-player";

export interface LoadedPlayerAsset {
  src: string;
  image: HTMLImageElement;
  view?: PlayerView;
}
export function usePlayerAssets(player: HolographicPlayer) {
  const [result, setResult] = useState<{
    playerId?: string;
    assets: LoadedPlayerAsset[];
    missing: string[];
    ready: boolean;
  }>({ assets: [], missing: [], ready: false });
  useEffect(() => {
    let cancelled = false;
    const pending = new Set<() => void>();
    const load = (src: string, view?: PlayerView): Promise<LoadedPlayerAsset | null> =>
      new Promise((resolve) => {
        const image = new Image();
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          pending.delete(abort);
          resolve(ok ? { src, image, view } : null);
        };
        const abort = () => finish(false);
        const timer = window.setTimeout(abort, 8000);
        pending.add(abort);
        image.onload = () => finish(image.naturalWidth > 0);
        image.onerror = abort;
        image.src = src;
      });
    void (async () => {
      const loaded = await Promise.all(player.views.map((view) => load(view.src, view)));
      if (cancelled) return;
      const assets = loaded.filter((asset): asset is LoadedPlayerAsset => asset !== null);
      const missing = player.views.filter((_, index) => !loaded[index]).map((view) => view.label);
      if (!assets.length) {
        for (const src of [player.portrait, player.originalPortrait]) {
          if (!src || cancelled) continue;
          const portrait = await load(src);
          if (portrait) {
            assets.push(portrait);
            break;
          }
        }
      }
      if (!cancelled) setResult({ playerId: player.id, assets, missing, ready: true });
    })();
    return () => {
      cancelled = true;
      pending.forEach((abort) => abort());
    };
  }, [player]);
  return result.playerId === player.id ? result : { assets: [], missing: [], ready: false };
}
