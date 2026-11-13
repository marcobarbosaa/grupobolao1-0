import { createFileRoute } from "@tanstack/react-router";
import { PlayerSelection } from "../components/sports/PlayerSelection";
export const Route = createFileRoute("/jogadores/")({
  head: () => ({ meta: [{ title: "Elenco — Central do Bolão" }] }),
  component: PlayerSelection,
});