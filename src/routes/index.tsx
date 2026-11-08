import { createFileRoute } from "@tanstack/react-router";
import { HallExperience } from "../components/sports/HallExperience";
import { SeasonTimeline } from "../components/home/SeasonTimeline";
import { seasons } from "../lib/mock-data";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Central da Liga — O jogo passa. O legado fica." }] }),
  component: () => (
    <>
      <HallExperience />
      <SeasonTimeline seasons={seasons} />
    </>
  ),
});
