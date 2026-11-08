import { createFileRoute } from "@tanstack/react-router";
import { validatePlayerFilters } from "../lib/player-adapter";
import { PlayerSelection } from "../components/sports/PlayerSelection";
export const Route = createFileRoute("/jogadores/")({
  validateSearch: validatePlayerFilters,
  head: () => ({ meta: [{ title: "Jogadores — Central do Bolão" }] }),
  component: Jogadores,
});
function Jogadores() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PlayerSelection
      filters={filters}
      onFilterChange={(search) => navigate({ search, replace: true, resetScroll: false })}
    />
  );
}
