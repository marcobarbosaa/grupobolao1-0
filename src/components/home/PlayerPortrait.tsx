import { useState } from "react";
import type { HomePlayer } from "../../lib/home-data";

export type PortraitVariant = "card" | "hero" | "profile";

export function PlayerPortrait({
  player,
  priority = false,
  sizes = "(max-width: 767px) 80vw, 30vw",
  decorative = false,
  variant,
}: {
  player: HomePlayer;
  priority?: boolean;
  sizes?: string;
  decorative?: boolean;
  variant?: PortraitVariant;
}) {
  const [failed, setFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable || !player.portrait) {
    return (
      <span
        className="portrait-fallback"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : player.name}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={failed ? player.originalPortrait : player.portrait}
      srcSet={failed ? undefined : player.portraitSet}
      sizes={sizes}
      alt={decorative ? "" : `${player.name}, jogador da Central do Bolão`}
      width={896}
      height={1200}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      data-portrait-variant={variant}
      style={{
        objectFit: variant === "hero" ? "cover" : variant ? "contain" : undefined,
        objectPosition:
          variant === "hero" ? "center 18%" : variant ? "center bottom" : player.focalPoint,
      }}
      onError={() => (failed ? setUnavailable(true) : setFailed(true))}
    />
  );
}
