import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "../components/home/Hero";
import { Legends } from "../components/home/Legends";
import { SeasonTimeline } from "../components/home/SeasonTimeline";
import { Immortals } from "../components/home/Immortals";
import { Explore } from "../components/home/Explore";
import { homeData } from "../lib/home-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Grupo Bolão 2.0 — A liga é nossa. A história também." }] }),
  component: Home,
});

function Home() {
  return (
    <div className="home-page">
      <Hero
        players={homeData.featured}
        playerCount={homeData.roster.length}
        seasonCount={homeData.timeline.length}
      />
      <Legends players={homeData.roster} />
      <SeasonTimeline seasons={homeData.timeline} />
      <Immortals players={homeData.featured} />
      <Explore />
    </div>
  );
}
