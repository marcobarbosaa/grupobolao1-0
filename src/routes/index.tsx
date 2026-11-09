import { createFileRoute } from "@tanstack/react-router";
import { GenerationHome } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Central do Bolão — Nova geração" }] }),
  component: GenerationHome,
});