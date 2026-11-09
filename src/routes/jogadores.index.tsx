import { createFileRoute } from "@tanstack/react-router";
import { GenerationRoster } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/jogadores/")({
  head: () => ({ meta: [{ title: "Elenco — Central do Bolão" }] }),
  component: GenerationRoster,
});