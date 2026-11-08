import { createFileRoute } from "@tanstack/react-router";
import { HallExperience } from "../components/sports/HallExperience";
export const Route = createFileRoute("/hall-da-fama")({
  head: () => ({ meta: [{ title: "Hall da Fama — Central do Bolão" }] }),
  component: HallExperience,
});
