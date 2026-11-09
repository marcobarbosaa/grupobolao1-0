import { createFileRoute } from "@tanstack/react-router";
import { GenerationPending } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central do Bolão" }] }),
  component: () => <GenerationPending title="TEMPORADAS" description="O novo calendário e os resultados ainda não foram importados." />,
});