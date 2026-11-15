import { createFileRoute } from "@tanstack/react-router";
import { RivalsArenaPage } from "../components/sports/RivalsArenaPage";
export const Route = createFileRoute("/deep-analytics")({
  head: () => ({ meta: [{ title: "Arena dos Rivais — Central do Bolão" }] }),
  component: RivalsArenaPage,
});
