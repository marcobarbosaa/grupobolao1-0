import {
  createFileRoute,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { PlayerProfile } from "../components/players/PlayerProfile";
import { PlayerPageState } from "../components/players/PlayerPageState";
import { findPlayer, playerRoster } from "../lib/player-data";

export const Route = createFileRoute("/jogadores/$id")({
  loader: ({ params }) => {
    const player = findPlayer(params.id);
    if (!player) throw notFound();
    const index = playerRoster.findIndex((entry) => entry.id === player.id);
    return { player, next: playerRoster[(index + 1) % playerRoster.length] };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.player.name} — A carreira | Central do Bolão`
          : "Jogador não encontrado — Central do Bolão",
      },
      {
        name: "description",
        content: loaderData
          ? `Conheça a trajetória de ${loaderData.player.name}: biografia, conquistas e estatísticas por temporada na Central do Bolão.`
          : "Explore os jogadores da Central do Bolão.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.player.name} — Central do Bolão` : "Central do Bolão",
      },
    ],
  }),
  pendingComponent: () => <PlayerPageState kind="loading" />,
  notFoundComponent: () => <PlayerPageState kind="not-found" />,
  errorComponent: PlayerError,
  component: ProfileRoute,
});

function PlayerError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <PlayerPageState
      kind="error"
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}

function ProfileRoute() {
  const { player, next } = Route.useLoaderData();
  return <PlayerProfile key={player.id} player={player} next={next} />;
}
