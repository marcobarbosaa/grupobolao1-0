import { createFileRoute, redirect } from "@tanstack/react-router";
import { validatePlayerFilters } from "../lib/player-adapter";

export const Route = createFileRoute("/biografias")({
  validateSearch: validatePlayerFilters,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/jogadores", search, replace: true, statusCode: 301 });
  },
});
