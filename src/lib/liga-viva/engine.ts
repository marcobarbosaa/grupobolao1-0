import { createHash } from "node:crypto";
import GLPK from "glpk.js/node";
import { validateReconstruction, validateSeasonTarget } from "./validate.ts";
import type {
  LeagueTeamTarget,
  Reconstruction,
  SeasonRules,
  SeasonTarget,
  SyntheticGame,
} from "./types.ts";

export const ALGORITHM_VERSION = "liga-viva-milp-1.1.0";

export class ReconstructionInputError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid reconstruction input: ${issues.join("; ")}`);
    this.name = "ReconstructionInputError";
    this.issues = issues;
  }
}

export class ReconstructionInfeasibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReconstructionInfeasibleError";
  }
}

function createRandom(seed: string) {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pairKey(first: string, second: string) {
  return [first, second].sort().join("::");
}

function fixedConstraint(
  name: string,
  vars: { name: string; coef: number }[],
  value: number,
  glpk: Awaited<ReturnType<typeof GLPK>>,
) {
  return { name, vars, bnds: { type: glpk.GLP_FX, lb: value, ub: value } };
}

function boundedConstraint(
  name: string,
  vars: { name: string; coef: number }[],
  lower: number,
  upper: number,
  glpk: Awaited<ReturnType<typeof GLPK>>,
) {
  if (lower === upper) return { name, vars, bnds: { type: glpk.GLP_FX, lb: lower, ub: upper } };
  return { name, vars, bnds: { type: glpk.GLP_DB, lb: lower, ub: upper } };
}

function upperConstraint(
  name: string,
  vars: { name: string; coef: number }[],
  upper: number,
  glpk: Awaited<ReturnType<typeof GLPK>>,
) {
  return { name, vars, bnds: { type: glpk.GLP_UP, lb: 0, ub: upper } };
}

function pointTotalBounds(average: number, games: number, precision: number) {
  const scale = 10 ** precision;
  const roundedAverage = Math.round(average * scale);
  return {
    min: Math.ceil((games * (2 * roundedAverage - 1)) / (2 * scale)),
    max: Math.ceil((games * (2 * roundedAverage + 1)) / (2 * scale)) - 1,
  };
}

type Matchup = { teamA: string; teamB: string; games: number; homeGamesA: number };

async function createSchedulePlan(
  target: SeasonTarget,
  rules: SeasonRules,
  seed: string,
): Promise<Matchup[]> {
  const glpk = await GLPK();
  const random = createRandom(`${seed}:schedule`);
  const divisions = new Map<string, string>();
  for (const division of rules.divisions)
    for (const team of division.teams) divisions.set(team, division.id);
  const pairs: {
    teamA: LeagueTeamTarget;
    teamB: LeagueTeamTarget;
    sameConference: boolean;
    sameDivision: boolean;
  }[] = [];
  for (let i = 0; i < target.teams.length; i += 1) {
    for (let j = i + 1; j < target.teams.length; j += 1) {
      const teamA = target.teams[i];
      const teamB = target.teams[j];
      pairs.push({
        teamA,
        teamB,
        sameConference: teamA.conference === teamB.conference,
        sameDivision: divisions.get(teamA.teamId) === divisions.get(teamB.teamId),
      });
    }
  }

  const binaries: string[] = [];
  const generals: string[] = [];
  const bounds: { name: string; type: number; ub: number; lb: number }[] = [];
  const objective: { name: string; coef: number }[] = [];
  const subjectTo: ReturnType<typeof fixedConstraint>[] = [];
  const extrasByTeam = new Map(target.teams.map((team) => [team.teamId, [] as string[]]));
  const homeByTeam = new Map(
    target.teams.map((team) => [team.teamId, [] as { name: string; coef: number }[]]),
  );

  pairs.forEach((pair, index) => {
    if (!pair.sameConference || pair.sameDivision) return;
    const extra = `extra_${index}`;
    const homeA = `homea_${index}`;
    const homeB = `homeb_${index}`;
    binaries.push(extra);
    generals.push(homeA, homeB);
    bounds.push(
      {
        name: homeA,
        type: glpk.GLP_DB,
        lb: 0,
        ub: rules.schedule.conferenceNonDivisionBaseGames + 1,
      },
      {
        name: homeB,
        type: glpk.GLP_DB,
        lb: 0,
        ub: rules.schedule.conferenceNonDivisionBaseGames + 1,
      },
    );
    objective.push({ name: extra, coef: random() });
    extrasByTeam.get(pair.teamA.teamId)!.push(extra);
    extrasByTeam.get(pair.teamB.teamId)!.push(extra);
    homeByTeam.get(pair.teamA.teamId)!.push({ name: homeA, coef: 1 });
    homeByTeam.get(pair.teamB.teamId)!.push({ name: homeB, coef: 1 });
    subjectTo.push(
      fixedConstraint(
        `home_total_${index}`,
        [
          { name: homeA, coef: 1 },
          { name: homeB, coef: 1 },
          { name: extra, coef: -1 },
        ],
        rules.schedule.conferenceNonDivisionBaseGames,
        glpk,
      ),
    );
  });

  for (const team of target.teams) {
    const extras = extrasByTeam.get(team.teamId)!;
    const configuredExtras = rules.schedule.conferenceNonDivisionExtraGamesPerTeam;
    if (configuredExtras > extras.length)
      throw new ReconstructionInfeasibleError(
        `${team.teamId}: too many extra conference games for its opponents`,
      );
    subjectTo.push(
      fixedConstraint(
        `extra_degree_${team.teamId}`,
        extras.map((name) => ({ name, coef: 1 })),
        configuredExtras,
        glpk,
      ),
    );
    const divisionOpponentCount =
      (rules.divisions.find((division) => division.teams.includes(team.teamId))?.teams.length ??
        1) - 1;
    const divisionHome = (rules.schedule.gamesPerDivisionOpponent * divisionOpponentCount) / 2;
    const interConferenceHome =
      (target.teams.filter((opponent) => opponent.conference !== team.conference).length *
        rules.schedule.interConferenceGamesPerOpponent) /
      2;
    const requiredConferenceHome =
      rules.schedule.homeGamesPerTeam - divisionHome - interConferenceHome;
    subjectTo.push(
      fixedConstraint(
        `conference_home_${team.teamId}`,
        homeByTeam.get(team.teamId)!,
        requiredConferenceHome,
        glpk,
      ),
    );
  }

  if (binaries.length + generals.length === 0) {
    return pairs.map((pair) => ({
      teamA: pair.teamA.teamId,
      teamB: pair.teamB.teamId,
      games: pair.sameDivision
        ? rules.schedule.gamesPerDivisionOpponent
        : rules.schedule.interConferenceGamesPerOpponent,
      homeGamesA: pair.sameDivision
        ? rules.schedule.gamesPerDivisionOpponent / 2
        : rules.schedule.interConferenceGamesPerOpponent / 2,
    }));
  }

  const result = await glpk.solve(
    {
      name: "synthetic_schedule",
      objective: { direction: glpk.GLP_MIN, name: "seeded_schedule_tie_break", vars: objective },
      subjectTo,
      bounds,
      binaries,
      generals,
    },
    { msglev: glpk.GLP_MSG_OFF, presol: true, tmlim: 120 },
  );
  if (![glpk.GLP_OPT, glpk.GLP_FEAS].includes(result.result.status))
    throw new ReconstructionInfeasibleError(
      `Synthetic schedule constraints are infeasible (GLPK status ${result.result.status})`,
    );

  return pairs.map((pair, index) => {
    if (!pair.sameConference)
      return {
        teamA: pair.teamA.teamId,
        teamB: pair.teamB.teamId,
        games: rules.schedule.interConferenceGamesPerOpponent,
        homeGamesA: rules.schedule.interConferenceGamesPerOpponent / 2,
      };
    if (pair.sameDivision)
      return {
        teamA: pair.teamA.teamId,
        teamB: pair.teamB.teamId,
        games: rules.schedule.gamesPerDivisionOpponent,
        homeGamesA: rules.schedule.gamesPerDivisionOpponent / 2,
      };
    const extra = Math.round(result.result.vars[`extra_${index}`] ?? 0);
    return {
      teamA: pair.teamA.teamId,
      teamB: pair.teamB.teamId,
      games: rules.schedule.conferenceNonDivisionBaseGames + extra,
      homeGamesA: Math.round(result.result.vars[`homea_${index}`] ?? 0),
    };
  });
}

function seededShuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function createFixtures(plan: Matchup[], seed: string) {
  const random = createRandom(`${seed}:calendar`);
  return seededShuffle(
    plan.flatMap((matchup) => {
      const games: { homeTeam: string; awayTeam: string }[] = [];
      for (let index = 0; index < matchup.games; index += 1) {
        const homeTeam = index < matchup.homeGamesA ? matchup.teamA : matchup.teamB;
        const awayTeam = homeTeam === matchup.teamA ? matchup.teamB : matchup.teamA;
        games.push({ homeTeam, awayTeam });
      }
      return games;
    }),
    random,
  );
}

function resultExpression(
  teamId: string,
  game: { homeTeam: string; awayTeam: string },
  variable: string,
) {
  return game.homeTeam === teamId
    ? { name: variable, coef: 1, constant: 0 }
    : { name: variable, coef: -1, constant: 1 };
}

async function solveResults(
  target: SeasonTarget,
  rules: SeasonRules,
  games: { homeTeam: string; awayTeam: string }[],
  seed: string,
) {
  const glpk = await GLPK();
  const random = createRandom(`${seed}:results`);
  const variables = games.map((_, index) => `win_${index}`);
  const binaries = [...variables];
  const objective = variables.map((name) => ({ name, coef: random() }));
  const subjectTo: ReturnType<typeof fixedConstraint>[] = [];
  const observedTeams = new Map(target.teams.map((team) => [team.teamId, team]));
  const divisionByTeam = new Map<string, string>();
  for (const division of rules.divisions)
    for (const team of division.teams) divisionByTeam.set(team, division.id);

  for (const team of target.teams) {
    const total = games.flatMap((game, index) =>
      game.homeTeam === team.teamId || game.awayTeam === team.teamId
        ? [resultExpression(team.teamId, game, variables[index])]
        : [],
    );
    const totalConstant = total.reduce((sum, item) => sum + item.constant, 0);
    subjectTo.push(
      fixedConstraint(
        `wins_${team.teamId}`,
        total.map(({ name, coef }) => ({ name, coef })),
        team.wins - totalConstant,
        glpk,
      ),
    );

    const home = games.flatMap((game, index) =>
      game.homeTeam === team.teamId ? [{ name: variables[index], coef: 1 }] : [],
    );
    subjectTo.push(fixedConstraint(`home_wins_${team.teamId}`, home, team.home.wins, glpk));

    const conferenceGames = games.flatMap((game, index) => {
      const opponentId =
        game.homeTeam === team.teamId
          ? game.awayTeam
          : game.awayTeam === team.teamId
            ? game.homeTeam
            : null;
      if (!opponentId || observedTeams.get(opponentId)?.conference !== team.conference) return [];
      return [resultExpression(team.teamId, game, variables[index])];
    });
    const conferenceConstant = conferenceGames.reduce((sum, item) => sum + item.constant, 0);
    subjectTo.push(
      fixedConstraint(
        `conference_wins_${team.teamId}`,
        conferenceGames.map(({ name, coef }) => ({ name, coef })),
        team.conferenceRecord.wins - conferenceConstant,
        glpk,
      ),
    );

    const divisionId = divisionByTeam.get(team.teamId);
    if (rules.unconstrainedDivisionRecords?.some((entry) => entry.divisionId === divisionId))
      continue;
    const divisionGames = games.flatMap((game, index) => {
      const opponentId =
        game.homeTeam === team.teamId
          ? game.awayTeam
          : game.awayTeam === team.teamId
            ? game.homeTeam
            : null;
      if (!opponentId || divisionByTeam.get(opponentId) !== divisionByTeam.get(team.teamId))
        return [];
      return [resultExpression(team.teamId, game, variables[index])];
    });
    const divisionConstant = divisionGames.reduce((sum, item) => sum + item.constant, 0);
    subjectTo.push(
      fixedConstraint(
        `division_wins_${team.teamId}`,
        divisionGames.map(({ name, coef }) => ({ name, coef })),
        team.divisionRecord.wins - divisionConstant,
        glpk,
      ),
    );
  }

  const result = await glpk.solve(
    {
      name: "conditioned_season_results",
      objective: {
        direction: glpk.GLP_MIN,
        name: "seeded_deterministic_tie_break",
        vars: objective,
      },
      subjectTo,
      binaries,
    },
    { msglev: glpk.GLP_MSG_OFF, presol: true, tmlim: 240 },
  );
  if (![glpk.GLP_OPT, glpk.GLP_FEAS].includes(result.result.status))
    throw new ReconstructionInfeasibleError(
      `Observed records have no compatible game-result assignment (GLPK status ${result.result.status})`,
    );
  return {
    winners: variables.map((name, index) =>
      Math.round(result.result.vars[name] ?? 0) ? games[index].homeTeam : games[index].awayTeam,
    ),
    objective: result.result.z,
    optimal: result.result.status === glpk.GLP_OPT,
  };
}

async function solveScores(
  target: SeasonTarget,
  rules: SeasonRules,
  games: { homeTeam: string; awayTeam: string; winner: string }[],
) {
  const scoreRules = rules.scoring!;
  const glpk = await GLPK();
  const generals: string[] = [];
  const bounds: { name: string; type: number; ub: number; lb: number }[] = [];
  const objective: { name: string; coef: number }[] = [];
  const subjectTo: ReturnType<typeof fixedConstraint>[] = [];
  const teamById = new Map(target.teams.map((team) => [team.teamId, team]));
  const pointFor = new Map(
    target.teams.map((team) => [team.teamId, [] as { name: string; coef: number }[]]),
  );
  const pointAgainst = new Map(
    target.teams.map((team) => [team.teamId, [] as { name: string; coef: number }[]]),
  );

  games.forEach((game, index) => {
    const homeScore = `home_score_${index}`;
    const awayScore = `away_score_${index}`;
    const homeTarget = teamById.get(game.homeTeam)!.scoring!;
    const awayTarget = teamById.get(game.awayTeam)!.scoring!;
    const expectedHome = (homeTarget.pointsForPerGame + awayTarget.pointsAgainstPerGame) / 2;
    const expectedAway = (awayTarget.pointsForPerGame + homeTarget.pointsAgainstPerGame) / 2;
    const homeMinimum = Math.max(
      scoreRules.minPointsPerTeam,
      Math.ceil(expectedHome - scoreRules.maxDeviationFromPairedAverage),
    );
    const homeMaximum = Math.min(
      scoreRules.maxPointsPerTeam,
      Math.floor(expectedHome + scoreRules.maxDeviationFromPairedAverage),
    );
    const awayMinimum = Math.max(
      scoreRules.minPointsPerTeam,
      Math.ceil(expectedAway - scoreRules.maxDeviationFromPairedAverage),
    );
    const awayMaximum = Math.min(
      scoreRules.maxPointsPerTeam,
      Math.floor(expectedAway + scoreRules.maxDeviationFromPairedAverage),
    );
    generals.push(homeScore, awayScore);
    bounds.push(
      {
        name: homeScore,
        type: glpk.GLP_DB,
        lb: homeMinimum,
        ub: homeMaximum,
      },
      {
        name: awayScore,
        type: glpk.GLP_DB,
        lb: awayMinimum,
        ub: awayMaximum,
      },
    );
    objective.push({ name: homeScore, coef: 0 }, { name: awayScore, coef: 0 });
    subjectTo.push(
      boundedConstraint(
        `combined_score_${index}`,
        [
          { name: homeScore, coef: 1 },
          { name: awayScore, coef: 1 },
        ],
        scoreRules.minCombinedPoints,
        scoreRules.maxCombinedPoints,
        glpk,
      ),
    );
    const winnerScore = game.winner === game.homeTeam ? homeScore : awayScore;
    const loserScore = game.winner === game.homeTeam ? awayScore : homeScore;
    subjectTo.push(
      boundedConstraint(
        `winner_margin_${index}`,
        [
          { name: winnerScore, coef: 1 },
          { name: loserScore, coef: -1 },
        ],
        1,
        scoreRules.maxMargin,
        glpk,
      ),
    );
    pointFor.get(game.homeTeam)!.push({ name: homeScore, coef: 1 });
    pointAgainst.get(game.homeTeam)!.push({ name: awayScore, coef: 1 });
    pointFor.get(game.awayTeam)!.push({ name: awayScore, coef: 1 });
    pointAgainst.get(game.awayTeam)!.push({ name: homeScore, coef: 1 });
  });

  for (const team of target.teams) {
    const points = team.scoring!;
    const scored = pointTotalBounds(
      points.pointsForPerGame,
      rules.schedule.gamesPerTeam,
      scoreRules.displayPrecision,
    );
    const allowed = pointTotalBounds(
      points.pointsAgainstPerGame,
      rules.schedule.gamesPerTeam,
      scoreRules.displayPrecision,
    );
    subjectTo.push(
      boundedConstraint(
        `points_for_${team.teamId}`,
        pointFor.get(team.teamId)!,
        scored.min,
        scored.max,
        glpk,
      ),
      boundedConstraint(
        `points_against_${team.teamId}`,
        pointAgainst.get(team.teamId)!,
        allowed.min,
        allowed.max,
        glpk,
      ),
    );
  }

  const result = await glpk.solve(
    {
      name: "conditioned_synthetic_scores",
      objective: { direction: glpk.GLP_MIN, name: "feasibility_only", vars: objective },
      subjectTo,
      bounds,
      generals,
    },
    { msglev: glpk.GLP_MSG_OFF, presol: true, tmlim: 60 },
  );
  if (![glpk.GLP_OPT, glpk.GLP_FEAS].includes(result.result.status))
    throw new ReconstructionInfeasibleError(
      result.result.status === glpk.GLP_NOFEAS
        ? "Observed scoring averages have no compatible integer scores (GLPK proved infeasibility)"
        : `Score solver did not find a validated incumbent before stopping (GLPK status ${result.result.status})`,
    );
  return {
    homeScores: games.map((_, index) => Math.round(result.result.vars[`home_score_${index}`] ?? 0)),
    awayScores: games.map((_, index) => Math.round(result.result.vars[`away_score_${index}`] ?? 0)),
    solverStatus:
      result.result.status === glpk.GLP_OPT ? ("optimal" as const) : ("feasible" as const),
  };
}

function assignCalendar(
  fixtures: { homeTeam: string; awayTeam: string; winner: string }[],
  rules: SeasonRules,
  seed: string,
) {
  const random = createRandom(`${seed}:calendar`);
  const days = Array.from({ length: rules.calendar.days }, () => ({
    teams: new Set<string>(),
    games: [] as number[],
  }));
  const assigned = fixtures.map((fixture, index) => ({ ...fixture, dayIndex: -1 }));
  for (const [gameIndex, fixture] of fixtures.entries()) {
    const availableDays = days
      .map((day, dayIndex) => ({ day, dayIndex }))
      .filter(({ day }) => !day.teams.has(fixture.homeTeam) && !day.teams.has(fixture.awayTeam));
    if (!availableDays.length)
      throw new ReconstructionInfeasibleError(
        "Could not place a game without a same-day team conflict",
      );
    const lowestLoad = Math.min(...availableDays.map(({ day }) => day.games.length));
    const tied = availableDays.filter(({ day }) => day.games.length === lowestLoad);
    const selected = tied[Math.floor(random() * tied.length)];
    selected.day.teams.add(fixture.homeTeam);
    selected.day.teams.add(fixture.awayTeam);
    selected.day.games.push(gameIndex);
    assigned[gameIndex].dayIndex = selected.dayIndex;
  }

  const byTeam = new Map<string, number[]>();
  assigned.forEach((game, index) => {
    for (const teamId of [game.homeTeam, game.awayTeam]) {
      const games = byTeam.get(teamId) ?? [];
      games.push(index);
      byTeam.set(teamId, games);
    }
  });
  const teamPenalty = (teamId: string) => {
    const ordered = byTeam
      .get(teamId)!
      .map((index) => ({ game: assigned[index], index }))
      .sort((first, second) => first.game.dayIndex - second.game.dayIndex);
    let penalty = 0;
    let priorOutcome = "";
    let resultRun = 0;
    let priorVenue: boolean | undefined;
    let venueRun = 0;
    for (const { game } of ordered) {
      const home = game.homeTeam === teamId;
      const outcome = game.winner === teamId ? "W" : "L";
      resultRun = outcome === priorOutcome ? resultRun + 1 : 1;
      venueRun = home === priorVenue ? venueRun + 1 : 1;
      if (resultRun > 1) penalty += resultRun * resultRun * 20;
      if (venueRun > 1) penalty += venueRun * venueRun * 3;
      priorOutcome = outcome;
      priorVenue = home;
    }
    return penalty;
  };
  const penalties = new Map([...byTeam.keys()].map((teamId) => [teamId, teamPenalty(teamId)]));
  const swapDates = (firstIndex: number, secondIndex: number) => {
    const first = assigned[firstIndex];
    const second = assigned[secondIndex];
    const firstDayIndex = first.dayIndex;
    const secondDayIndex = second.dayIndex;
    const firstDay = days[firstDayIndex];
    const secondDay = days[secondDayIndex];
    firstDay.games.splice(firstDay.games.indexOf(firstIndex), 1);
    secondDay.games.splice(secondDay.games.indexOf(secondIndex), 1);
    for (const teamId of [first.homeTeam, first.awayTeam]) firstDay.teams.delete(teamId);
    for (const teamId of [second.homeTeam, second.awayTeam]) secondDay.teams.delete(teamId);
    firstDay.games.push(secondIndex);
    secondDay.games.push(firstIndex);
    firstDay.teams.add(second.homeTeam);
    firstDay.teams.add(second.awayTeam);
    secondDay.teams.add(first.homeTeam);
    secondDay.teams.add(first.awayTeam);
    first.dayIndex = secondDayIndex;
    second.dayIndex = firstDayIndex;
  };
  const attempts = Math.min(150_000, assigned.length * 120);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const firstIndex = Math.floor(random() * assigned.length);
    const secondIndex = Math.floor(random() * assigned.length);
    if (firstIndex === secondIndex) continue;
    const first = assigned[firstIndex];
    const second = assigned[secondIndex];
    if (first.dayIndex === second.dayIndex) continue;
    const firstDay = days[first.dayIndex];
    const secondDay = days[second.dayIndex];
    const firstTeams = [first.homeTeam, first.awayTeam];
    const secondTeams = [second.homeTeam, second.awayTeam];
    const firstDayOthers = new Set(firstDay.teams);
    const secondDayOthers = new Set(secondDay.teams);
    for (const teamId of firstTeams) firstDayOthers.delete(teamId);
    for (const teamId of secondTeams) secondDayOthers.delete(teamId);
    if (
      secondTeams.some((teamId) => firstDayOthers.has(teamId)) ||
      firstTeams.some((teamId) => secondDayOthers.has(teamId))
    )
      continue;

    const affected = new Set([...firstTeams, ...secondTeams]);
    const previousPenalty = [...affected].reduce((sum, teamId) => sum + penalties.get(teamId)!, 0);
    swapDates(firstIndex, secondIndex);
    const nextPenalties = new Map([...affected].map((teamId) => [teamId, teamPenalty(teamId)]));
    const nextPenalty = [...nextPenalties.values()].reduce((sum, value) => sum + value, 0);
    if (nextPenalty < previousPenalty) {
      for (const [teamId, penalty] of nextPenalties) penalties.set(teamId, penalty);
    } else {
      swapDates(firstIndex, secondIndex);
    }
  }
  return assigned;
}

export async function reconstructSeason(options: {
  target: SeasonTarget;
  rules: SeasonRules;
  seed: string | number;
  inputHash: string;
  generatedAt?: string;
}) {
  const { target, rules, inputHash } = options;
  const seed = String(options.seed);
  const inputIssues = validateSeasonTarget(target, rules);
  if (inputIssues.length) throw new ReconstructionInputError(inputIssues);
  if (!/^[a-f0-9]{64}$/.test(inputHash))
    throw new ReconstructionInputError(["inputHash must be a SHA-256 digest"]);

  const schedulePlan = await createSchedulePlan(target, rules, seed);
  const fixtures = createFixtures(schedulePlan, seed);
  const solved = await solveResults(target, rules, fixtures, seed);
  const calendar = assignCalendar(
    fixtures.map((fixture, index) => ({ ...fixture, winner: solved.winners[index] })),
    rules,
    seed,
  );
  const hasScoringTargets = target.teams.some((team) => team.scoring !== undefined);
  const solvedScores = hasScoringTargets ? await solveScores(target, rules, calendar) : undefined;
  const start = new Date(`${rules.calendar.startDate}T00:00:00.000Z`);
  const games: SyntheticGame[] = calendar.map((fixture, index) => {
    const date = new Date(start.getTime() + fixture.dayIndex * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return {
      id: `${target.seasonId}-synthetic-${String(index + 1).padStart(4, "0")}`,
      seasonId: target.seasonId,
      phase: "regular",
      date,
      dayIndex: fixture.dayIndex,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      winner: fixture.winner,
      loser: fixture.winner === fixture.homeTeam ? fixture.awayTeam : fixture.homeTeam,
      ...(solvedScores
        ? {
            homeScore: solvedScores.homeScores[index],
            awayScore: solvedScores.awayScores[index],
            scoreProvenance: "synthetic-constrained" as const,
          }
        : {}),
      provenance: "synthetic-constrained",
    };
  });
  const standings = [...target.teams]
    .sort(
      (first, second) =>
        first.conference.localeCompare(second.conference) || first.rank - second.rank,
    )
    .map((team) => ({
      conference: team.conference,
      rank: team.rank,
      teamId: team.teamId,
      wins: team.wins,
      losses: team.losses,
      pct: team.pct,
    }));
  const reconstructionKey = `${target.seasonId}:${seed}:${inputHash}:${ALGORITHM_VERSION}:${JSON.stringify(rules)}`;
  const reconstructionId = `lv-${createHash("sha256").update(reconstructionKey).digest("hex").slice(0, 16)}`;
  const reconstruction: Reconstruction = {
    schemaVersion: "1.1",
    seasonId: target.seasonId,
    reconstructionId,
    algorithmVersion: ALGORITHM_VERSION,
    seed,
    provenance: "synthetic-constrained",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    inputHash,
    rules,
    schedulePlan: schedulePlan.map(({ teamA, teamB, games: count }) => ({
      teamA,
      teamB,
      games: count,
    })),
    games,
    standings,
    optimization: {
      method:
        "GLPK MILP hard record constraints with seeded tie-break; deterministic date-swap local search for result and venue alternation",
      objective: solved.objective,
      optimal: solved.optimal,
    },
    ...(solvedScores
      ? {
          scoreAssignment: {
            method:
              "GLPK integer feasibility model with fixed winners, rounded team scoring bands, and paired-average score limits",
            status: "feasible",
            displayPrecision: rules.scoring!.displayPrecision,
          },
        }
      : {}),
    validation: {
      status: "validated",
      checkedAt: options.generatedAt ?? new Date().toISOString(),
      rankingCriterion: "observed-order-preserved-not-derived",
      errors: [],
    },
  };
  const report = validateReconstruction(target, reconstruction, inputHash);
  if (!report.valid)
    throw new ReconstructionInfeasibleError(
      `Generated solution failed independent validation: ${report.errors.join("; ")}`,
    );
  return { reconstruction, report };
}
