import { createFileRoute } from "@tanstack/react-router";
import { GenerationPending } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/hall-da-fama")({
  head: () => ({ meta: [{ title: "Hall da Fama — Central do Bolão" }] }),
  component: () => <GenerationPending title="HALL DA FAMA" description="As conquistas da nova geração serão registradas aqui." />,
});