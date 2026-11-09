import { createFileRoute } from "@tanstack/react-router";
import { GenerationRoster } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/biografias")({
  head: () => ({ meta: [{ title: "Jogadores — Central do Bolão" }] }),
  component: GenerationRoster,
});