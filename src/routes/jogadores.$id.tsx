import { createFileRoute, notFound } from "@tanstack/react-router";
import { findNewPlayer } from "../lib/new-roster";
import { GenerationProfile } from "../components/sports/NewGeneration";
export const Route = createFileRoute("/jogadores/$id")({
  loader: ({ params }) => {
    const player = findNewPlayer(params.id);
    if (!player) throw notFound();
    return { player };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.player.name} — Central do Bolão` : "Jogador não encontrado — Central do Bolão" }] }),
  component: NewProfileRoute,
});

function NewProfileRoute() {
  const { player } = Route.useLoaderData();
  return <GenerationProfile player={player} />;
}
