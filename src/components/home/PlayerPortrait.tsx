import { useState } from "react";
import type { HomePlayer } from "../../lib/home-data";

export function PlayerPortrait({
  player,
  priority = false,
  sizes = "(max-width: 767px) 80vw, 30vw",
  decorative = false,
}: {
  player: HomePlayer;
  priority?: boolean;
  sizes?: string;
  decorative?: boolean;
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
      alt={decorative ? "" : `${player.name}, jogador do Grupo Bolão`}
      width={896}
      height={1200}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={{ objectPosition: player.focalPoint }}
      onError={() => (failed ? setUnavailable(true) : setFailed(true))}
    />
  );
}
