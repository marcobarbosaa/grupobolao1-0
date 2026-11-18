import type { Reconstruction, ReconstructedStanding, SyntheticGame } from "./types.ts";

export type SyntheticRound = {
  number: number;
  startDayIndex: number;
  endDayIndex: number;
  games: SyntheticGame[];
};

export type ProgressStanding = {
  teamId: string;
  conference: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
};

export const SYNTHETIC_DAYS_PER_ROUND = 2;

export function buildSyntheticRounds(
  reconstruction: Reconstruction,
  daysPerRound = SYNTHETIC_DAYS_PER_ROUND,
): SyntheticRound[] {
  if (!Number.isSafeInteger(daysPerRound) || daysPerRound < 1)
    throw new RangeError("daysPerRound must be a positive integer");

  const rounds = new Map<number, SyntheticRound>();
  for (const game of reconstruction.games) {
    const roundNumber = Math.floor(game.dayIndex / daysPerRound) + 1;
    const startDayIndex = (roundNumber - 1) * daysPerRound;
    const endDayIndex = Math.min(
      startDayIndex + daysPerRound - 1,
      reconstruction.rules.calendar.days - 1,
    );
    const round = rounds.get(roundNumber) ?? {
      number: roundNumber,
      startDayIndex,
      endDayIndex,
      games: [],
    };
    round.games.push(game);
    rounds.set(roundNumber, round);
  }

  return [...rounds.values()]
    .sort((first, second) => first.number - second.number)
    .map((round) => ({
      ...round,
      games: round.games.sort(
        (first, second) =>
          first.dayIndex - second.dayIndex ||
          first.homeTeam.localeCompare(second.homeTeam) ||
          first.id.localeCompare(second.id),
      ),
    }));
}

export function filterSyntheticRoundGames(round: SyntheticRound, teamId?: string): SyntheticGame[] {
  return teamId
    ? round.games.filter((game) => game.homeTeam === teamId || game.awayTeam === teamId)
    : round.games;
}

export function calculateStandingsThroughRound(
  standings: ReconstructedStanding[],
  rounds: SyntheticRound[],
  throughRound: number,
): ProgressStanding[] {
  const progress = new Map<string, ProgressStanding>(
    standings.map((standing) => [
      standing.teamId,
      {
        teamId: standing.teamId,
        conference: standing.conference,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pct: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      },
    ]),
  );

  for (const round of rounds) {
    if (round.number > throughRound) break;
    for (const game of round.games) {
      const home = progress.get(game.homeTeam);
      const away = progress.get(game.awayTeam);
      if (!home || !away) continue;
      home.gamesPlayed += 1;
      away.gamesPlayed += 1;
      if (game.winner === game.homeTeam) {
        home.wins += 1;
        away.losses += 1;
      } else if (game.winner === game.awayTeam) {
        away.wins += 1;
        home.losses += 1;
      }
      if (Number.isSafeInteger(game.homeScore) && Number.isSafeInteger(game.awayScore)) {
        home.pointsFor += game.homeScore!;
        home.pointsAgainst += game.awayScore!;
        away.pointsFor += game.awayScore!;
        away.pointsAgainst += game.homeScore!;
      }
    }
  }

  return [...progress.values()]
    .map((team) => ({
      ...team,
      pct: team.gamesPlayed ? team.wins / team.gamesPlayed : 0,
      pointDifferential: team.pointsFor - team.pointsAgainst,
    }))
    .sort(
      (first, second) =>
        second.pct - first.pct ||
        second.wins - first.wins ||
        first.teamId.localeCompare(second.teamId),
    );
}
