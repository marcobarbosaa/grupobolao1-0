import { useState } from "react";
import manifest from "virtual:bolao-player-history";
import { normalizePlayerId } from "../../lib/player-history";

/** Keep this player's period images mounted so rapid changes cannot revive stale callbacks. */
export function HistoricalPortrait({
  playerId,
  image,
  name,
}: {
  playerId: string;
  image?: string;
  name: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  return (
    <>
      {manifest.records
        .filter((record) => record.player === normalizePlayerId(playerId))
        .map((record) => (
          <img
            key={record.asset}
            src={record.asset}
            alt=""
            decoding="async"
            className="historical-portrait"
            data-active={record.asset === image && !failed.includes(record.asset)}
            onError={() => setFailed((previous) => [...previous, record.asset])}
          />
        ))}
      {(!image || failed.includes(image)) && <span>{name}</span>}
    </>
  );
}
