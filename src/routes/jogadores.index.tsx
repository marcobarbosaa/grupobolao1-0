import { createFileRoute } from "@tanstack/react-router";
import { HolographicSelection } from "../components/holographic/HolographicSelection";
import { PlayerPageState } from "../components/players/PlayerPageState";
import { playerRoster } from "../lib/player-data";
import { validatePlayerFilters } from "../lib/player-adapter";
import { createHolographicRoster } from "../lib/holographic-player";

const holographicRoster = createHolographicRoster(playerRoster);

export const Route = createFileRoute("/jogadores/")({
  validateSearch: validatePlayerFilters,
  head: () => ({
    meta: [
      { title: "Os protagonistas — Jogadores | Grupo Bolão 2.0" },
      {
        name: "description",
        content:
          "Os protagonistas da nossa liga. Explore Nando na sala de seleção de atletas e entre na sua carreira no Grupo Bolão.",
      },
      { property: "og:title", content: "Os protagonistas — Grupo Bolão 2.0" },
    ],
  }),
  pendingComponent: () => <PlayerPageState kind="loading" />,
  component: PlayersRoute,
});

function PlayersRoute() {
  return <HolographicSelection players={holographicRoster} />;
}
