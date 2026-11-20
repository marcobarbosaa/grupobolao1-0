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
  gamesBehind: number;
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  conferenceRecord: { wins: number; losses: number };
  divisionRecord: { wins: number; losses: number };
  streak: string;
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
  divisions: { id: string; teams: string[] }[] = [],
): ProgressStanding[] {
  const divisionByTeam = new Map<string, string>();
  for (const division of divisions)
    for (const teamId of division.teams) divisionByTeam.set(teamId, division.id);

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
        gamesBehind: 0,
        homeRecord: { wins: 0, losses: 0 },
        awayRecord: { wins: 0, losses: 0 },
        conferenceRecord: { wins: 0, losses: 0 },
        divisionRecord: { wins: 0, losses: 0 },
        streak: "—",
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      },
    ]),
  );
  const streaks = new Map<string, { result: "W" | "L"; count: number }>();

  const addStreakResult = (teamId: string, result: "W" | "L") => {
    const previous = streaks.get(teamId);
    const count = previous?.result === result ? previous.count + 1 : 1;
    streaks.set(teamId, { result, count });
  };

  for (const round of rounds) {
    if (round.number > throughRound) break;
    for (const game of round.games) {
      const home = progress.get(game.homeTeam);
      const away = progress.get(game.awayTeam);
      if (!home || !away) continue;
      home.gamesPlayed += 1;
      away.gamesPlayed += 1;
      const homeWon = game.winner === game.homeTeam;
      if (homeWon) {
        home.wins += 1;
        away.losses += 1;
      } else if (game.winner === game.awayTeam) {
        away.wins += 1;
        home.losses += 1;
      }
      if (homeWon) {
        home.homeRecord.wins += 1;
        away.awayRecord.losses += 1;
      } else {
        home.homeRecord.losses += 1;
        away.awayRecord.wins += 1;
      }
      if (home.conference === away.conference) {
        if (homeWon) {
          home.conferenceRecord.wins += 1;
          away.conferenceRecord.losses += 1;
        } else {
          home.conferenceRecord.losses += 1;
          away.conferenceRecord.wins += 1;
        }
      }
      if (
        divisionByTeam.get(game.homeTeam) &&
        divisionByTeam.get(game.homeTeam) === divisionByTeam.get(game.awayTeam)
      ) {
        if (homeWon) {
          home.divisionRecord.wins += 1;
          away.divisionRecord.losses += 1;
        } else {
          home.divisionRecord.losses += 1;
          away.divisionRecord.wins += 1;
        }
      }
      addStreakResult(game.homeTeam, homeWon ? "W" : "L");
      addStreakResult(game.awayTeam, homeWon ? "L" : "W");
      if (Number.isSafeInteger(game.homeScore) && Number.isSafeInteger(game.awayScore)) {
        home.pointsFor += game.homeScore!;
        home.pointsAgainst += game.awayScore!;
        away.pointsFor += game.awayScore!;
        away.pointsAgainst += game.homeScore!;
      }
    }
  }

  const standingsThroughRound = [...progress.values()].map((team) => ({
      ...team,
      pct: team.gamesPlayed ? team.wins / team.gamesPlayed : 0,
      streak: streaks.has(team.teamId)
        ? `${streaks.get(team.teamId)!.result}${streaks.get(team.teamId)!.count}`
        : "—",
      pointDifferential: team.pointsFor - team.pointsAgainst,
  }));
  const conferenceLeaders = new Map<string, ProgressStanding>();
  for (const team of standingsThroughRound) {
    const currentLeader = conferenceLeaders.get(team.conference);
    if (
      !currentLeader ||
      team.pct > currentLeader.pct ||
      (team.pct === currentLeader.pct && team.wins > currentLeader.wins)
    )
      conferenceLeaders.set(team.conference, team);
  }
  for (const team of standingsThroughRound) {
    const leader = conferenceLeaders.get(team.conference)!;
    team.gamesBehind =
      (leader.wins - team.wins + team.losses - leader.losses) / 2;
  }

  return standingsThroughRound.sort(
    (first, second) =>
      second.pct - first.pct ||
      second.wins - first.wins ||
      first.teamId.localeCompare(second.teamId),
  );
}
