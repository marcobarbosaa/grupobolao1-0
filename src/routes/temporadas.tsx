import { createFileRoute } from "@tanstack/react-router";
import { SeasonStatistics } from "../components/sports/PublishedStatistics";

export const Route = createFileRoute("/temporadas")({
  head: () => ({ meta: [{ title: "Temporadas — Central do Bolão" }] }),
  component: SeasonStatistics,
});
