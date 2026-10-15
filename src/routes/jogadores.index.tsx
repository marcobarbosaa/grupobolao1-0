import { createFileRoute } from "@tanstack/react-router";
import { PlayerGallery } from "../components/players/PlayerGallery";
import { PlayerPageState } from "../components/players/PlayerPageState";
import { playerRoster } from "../lib/player-data";
import { validatePlayerFilters } from "../lib/player-adapter";

export const Route = createFileRoute("/jogadores/")({
  validateSearch: validatePlayerFilters,
  head: () => ({
    meta: [
      { title: "Os protagonistas — Jogadores | Grupo Bolão 2.0" },
      {
        name: "description",
        content:
          "Cada jogador tem uma história. Explore o elenco, filtre por nome, equipe ou posição e conheça as carreiras do Grupo Bolão.",
      },
      { property: "og:title", content: "Os protagonistas — Grupo Bolão 2.0" },
    ],
  }),
  pendingComponent: () => <PlayerPageState kind="loading" />,
  component: PlayersRoute,
});

function PlayersRoute() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PlayerGallery
      players={playerRoster}
      filters={filters}
      onFilterChange={(search) => {
        void navigate({ search, replace: true, resetScroll: false });
      }}
    />
  );
}
