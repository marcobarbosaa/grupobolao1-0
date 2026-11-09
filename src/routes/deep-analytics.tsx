import { createFileRoute } from "@tanstack/react-router";
import { GenerationPending } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/deep-analytics")({
  head: () => ({ meta: [{ title: "Comparações — Central do Bolão" }] }),
  component: () => <GenerationPending title="COMPARAR" description="A comparação estatística será disponibilizada após a importação dos dados dos novos atletas." />,
});