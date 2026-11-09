import { createFileRoute } from "@tanstack/react-router";
import { GenerationPending } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/recordes")({
  head: () => ({ meta: [{ title: "Recordes — Central do Bolão" }] }),
  component: () => <GenerationPending title="RECORDES" description="Os recordistas serão definidos exclusivamente pelas estatísticas da nova geração." />,
});