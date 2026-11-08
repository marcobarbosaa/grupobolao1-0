import { createFileRoute } from "@tanstack/react-router";
import { validatePlayerFilters } from "../lib/player-adapter";
import { PlayerSelection } from "../components/sports/PlayerSelection";
export const Route = createFileRoute("/biografias")({
  validateSearch: validatePlayerFilters,
  head: () => ({ meta: [{ title: "Biografias — Central da Liga" }] }),
  component: Biografias,
});
function Biografias() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PlayerSelection
      filters={filters}
      onFilterChange={(search) => navigate({ search, replace: true, resetScroll: false })}
    />
  );
}
