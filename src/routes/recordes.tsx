import { createFileRoute } from "@tanstack/react-router";
import { RecordsArchive } from "../components/sports/RecordsArchive";
export const Route = createFileRoute("/recordes")({
  head: () => ({ meta: [{ title: "Recordes — Central do Bolão" }] }),
  component: RecordsArchive,
});
