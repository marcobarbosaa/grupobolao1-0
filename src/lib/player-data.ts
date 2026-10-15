import { players, seasons } from "./mock-data";
import { seasonStatsMap } from "./season-stats";
import { adaptPlayer } from "./home-data";
import { adaptPlayerProfile } from "./player-adapter";

// This is the single legacy data boundary for the new gallery and profiles.
export const playerRoster = players.map((player) =>
  adaptPlayerProfile(player, adaptPlayer(player), seasonStatsMap[player.name], seasons),
);
export const findPlayer = (id: string) => playerRoster.find((player) => player.id === id);
