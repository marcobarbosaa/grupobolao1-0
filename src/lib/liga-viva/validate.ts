import type {
  LeagueTeamTarget,
  Reconstruction,
  SeasonRules,
  SeasonTarget,
  SyntheticGame,
} from "./types.ts";

export type ValidationReport = {
  valid: boolean;
  errors: string[];
  totals: { teams: number; games: number; wins: number; losses: number };
  coverage: {
    overall: boolean;
    homeAway: boolean;
    conference: boolean;
    division: boolean;
    observedRankOrder: "preserved-not-derived";
  };
};

const integer = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;

export function validateSeasonTarget(target: SeasonTarget, rules: SeasonRules): string[] {
  const errors: string[] = [];
  if (!target || typeof target.seasonId !== "string" || !target.seasonId)
    return ["Target seasonId is missing"];
  if (!Array.isArray(target.teams) || target.teams.length < 2)
    return ["Target teams are incomplete"];
  if (!rules || rules.provenance !== "synthetic-constrained" || !rules.schedule || !rules.calendar)
    return ["Synthetic season rules are incomplete"];
  if (!Array.isArray(rules.divisions)) return ["Synthetic division rules are missing"];
  for (const [field, value] of Object.entries(rules.schedule)) {
    if (!integer(value)) errors.push(`Schedule rule ${field} must be a nonnegative integer`);
  }
  if (
    !Number.isSafeInteger(rules.calendar.days) ||
    rules.calendar.days < 1 ||
    !Number.isFinite(new Date(`${rules.calendar.startDate}T00:00:00.000Z`).getTime())
  )
    errors.push("Calendar start date and day count are invalid");
  if (
    rules.schedule.gamesPerDivisionOpponent % 2 !== 0 ||
    rules.schedule.interConferenceGamesPerOpponent % 2 !== 0
  )
    errors.push(
      "Fixed division and interconference series must allow equal home games for both teams",
    );

  const teamIds = target.teams.map((team) => team?.teamId);
  if (teamIds.some((id) => typeof id !== "string" || !id))
    errors.push("Target contains a team without an ID");
  if (new Set(teamIds).size !== teamIds.length) errors.push("Target contains duplicate team IDs");

  const divisions = new Map<string, string>();
  const divisionTeams = new Set<string>();
  for (const division of rules.divisions ?? []) {
    if (!division.id || !division.conference || !Array.isArray(division.teams)) {
      errors.push("Division configuration is incomplete");
      continue;
    }
    for (const teamId of division.teams) {
      if (divisionTeams.has(teamId))
        errors.push(`Team ${teamId} belongs to more than one synthetic division`);
      divisionTeams.add(teamId);
      divisions.set(teamId, division.id);
    }
  }

  for (const team of target.teams) {
    if (!team || !team.teamId) continue;
    if (!team.conference || !integer(team.rank) || team.rank < 1)
      errors.push(`${team.teamId}: invalid conference or rank`);
    for (const [field, value] of Object.entries({
      wins: team.wins,
      losses: team.losses,
      homeWins: team.home?.wins,
      homeLosses: team.home?.losses,
      awayWins: team.away?.wins,
      awayLosses: team.away?.losses,
      conferenceWins: team.conferenceRecord?.wins,
      conferenceLosses: team.conferenceRecord?.losses,
      divisionWins: team.divisionRecord?.wins,
      divisionLosses: team.divisionRecord?.losses,
    })) {
      if (!integer(value)) errors.push(`${team.teamId}: ${field} is missing or invalid`);
    }
    if (
      ![team.home, team.away, team.conferenceRecord, team.divisionRecord].every(
        (value) => value && integer(value.wins) && integer(value.losses),
      )
    )
      continue;
    const games = team.wins + team.losses;
    if (games !== rules.schedule.gamesPerTeam)
      errors.push(`${team.teamId}: W-L totals ${games}, expected ${rules.schedule.gamesPerTeam}`);
    if (
      team.home.wins + team.away.wins !== team.wins ||
      team.home.losses + team.away.losses !== team.losses
    )
      errors.push(`${team.teamId}: home/away records do not close to overall W-L`);
    if (team.home.wins + team.home.losses !== rules.schedule.homeGamesPerTeam)
      errors.push(`${team.teamId}: home games do not match configured total`);
    if (
      team.away.wins + team.away.losses !==
      rules.schedule.gamesPerTeam - rules.schedule.homeGamesPerTeam
    )
      errors.push(`${team.teamId}: away games do not match configured total`);
    if (
      team.conferenceRecord.wins + team.conferenceRecord.losses !==
      rules.schedule.conferenceGamesPerTeam
    )
      errors.push(`${team.teamId}: conference games do not match configured total`);
    if (
      team.divisionRecord.wins + team.divisionRecord.losses !==
      rules.schedule.divisionGamesPerTeam
    )
      errors.push(`${team.teamId}: division games do not match configured total`);
    if (Math.round((team.wins / games) * 1000) / 1000 !== team.pct)
      errors.push(`${team.teamId}: displayed winning percentage does not match W-L`);
    if (!divisions.has(team.teamId))
      errors.push(`${team.teamId}: missing synthetic division assignment`);
    else {
      const assigned = rules.divisions.find(
        (division) => division.id === divisions.get(team.teamId),
      );
      if (assigned?.conference !== team.conference)
        errors.push(`${team.teamId}: synthetic division conference mismatch`);
    }
  }

  if (divisionTeams.size !== teamIds.length || teamIds.some((id) => !divisionTeams.has(id)))
    errors.push("Synthetic divisions must cover every target team exactly once");
  for (const division of rules.divisions ?? []) {
    const members = target.teams.filter((team) => division.teams.includes(team.teamId));
    if (members.some((team) => team.conference !== division.conference))
      errors.push(`${division.id}: assigned teams do not match its conference`);
    const expectedDivisionWins =
      ((members.length * (members.length - 1)) / 2) * rules.schedule.gamesPerDivisionOpponent;
    const actualDivisionWins = members.reduce(
      (sum, team) =>
        sum + (Number.isSafeInteger(team.divisionRecord?.wins) ? team.divisionRecord.wins : 0),
      0,
    );
    if (actualDivisionWins !== expectedDivisionWins)
      errors.push(
        `${division.id}: division wins total ${actualDivisionWins}, expected ${expectedDivisionWins} from reciprocal games`,
      );
  }
  for (const conference of new Set(target.teams.map((team) => team.conference))) {
    const members = target.teams.filter((team) => team.conference === conference);
    const expectedConferenceWins = (members.length * rules.schedule.conferenceGamesPerTeam) / 2;
    const actualConferenceWins = members.reduce(
      (sum, team) =>
        sum + (Number.isSafeInteger(team.conferenceRecord?.wins) ? team.conferenceRecord.wins : 0),
      0,
    );
    if (actualConferenceWins !== expectedConferenceWins)
      errors.push(
        `${conference}: conference wins total ${actualConferenceWins}, expected ${expectedConferenceWins} from reciprocal games`,
      );
    for (const team of members) {
      const divisionSize =
        rules.divisions.find((division) => division.teams.includes(team.teamId))?.teams.length ?? 0;
      const conferenceOpponentsOutsideDivision = members.length - divisionSize;
      const expectedConferenceGames =
        (divisionSize - 1) * rules.schedule.gamesPerDivisionOpponent +
        conferenceOpponentsOutsideDivision * rules.schedule.conferenceNonDivisionBaseGames +
        rules.schedule.conferenceNonDivisionExtraGamesPerTeam;
      const expectedTotalGames =
        expectedConferenceGames +
        target.teams.filter((opponent) => opponent.conference !== conference).length *
          rules.schedule.interConferenceGamesPerOpponent;
      if (expectedConferenceGames !== rules.schedule.conferenceGamesPerTeam)
        errors.push(
          `${team.teamId}: configured pairings imply ${expectedConferenceGames} conference games, expected ${rules.schedule.conferenceGamesPerTeam}`,
        );
      if (expectedTotalGames !== rules.schedule.gamesPerTeam)
        errors.push(
          `${team.teamId}: configured pairings imply ${expectedTotalGames} total games, expected ${rules.schedule.gamesPerTeam}`,
        );
    }
  }
  const wins = target.teams.reduce(
    (sum, team) => sum + (Number.isSafeInteger(team?.wins) ? team.wins : 0),
    0,
  );
  const losses = target.teams.reduce(
    (sum, team) => sum + (Number.isSafeInteger(team?.losses) ? team.losses : 0),
    0,
  );
  if (wins !== losses)
    errors.push(`League wins (${wins}) and losses (${losses}) are not reciprocal`);
  if (wins * 2 !== target.teams.length * rules.schedule.gamesPerTeam)
    errors.push("League total games do not reconcile with team game targets");
  const expectedLeagueGames = (target.teams.length * rules.schedule.gamesPerTeam) / 2;
  const homeGames = target.teams.reduce(
    (sum, team) => sum + (team.home?.wins ?? 0) + (team.home?.losses ?? 0),
    0,
  );
  const awayGames = target.teams.reduce(
    (sum, team) => sum + (team.away?.wins ?? 0) + (team.away?.losses ?? 0),
    0,
  );
  if (homeGames !== expectedLeagueGames)
    errors.push(`Home game targets total ${homeGames}, expected ${expectedLeagueGames}`);
  if (awayGames !== expectedLeagueGames)
    errors.push(`Away game targets total ${awayGames}, expected ${expectedLeagueGames}`);
  return [...new Set(errors)];
}

type TeamTally = {
  games: number;
  wins: number;
  losses: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  divisionWins: number;
  divisionLosses: number;
};

function emptyTally(): TeamTally {
  return {
    games: 0,
    wins: 0,
    losses: 0,
    homeWins: 0,
    homeLosses: 0,
    awayWins: 0,
    awayLosses: 0,
    conferenceWins: 0,
    conferenceLosses: 0,
    divisionWins: 0,
    divisionLosses: 0,
  };
}

function pairKey(first: string, second: string) {
  return [first, second].sort().join("::");
}

export function validateReconstruction(
  target: SeasonTarget,
  reconstruction: Reconstruction,
  expectedInputHash?: string,
): ValidationReport {
  const errors = [...validateSeasonTarget(target, reconstruction.rules)];
  const teams = new Map(target.teams.map((team) => [team.teamId, team]));
  const divisions = new Map<string, string>();
  for (const division of reconstruction.rules.divisions) {
    for (const teamId of division.teams) divisions.set(teamId, division.id);
  }
  const tallies = new Map(target.teams.map((team) => [team.teamId, emptyTally()]));
  const scheduledDays = new Map<number, Set<string>>();
  const datedPairs = new Set<string>();
  const gameIds = new Set<string>();
  const matchupCounts = new Map<string, number>();
  const matchupHomeCounts = new Map<string, Map<string, number>>();
  const planCounts = new Map<string, number>();
  const start = new Date(`${reconstruction.rules.calendar.startDate}T00:00:00.000Z`);
  const games = Array.isArray(reconstruction.games) ? reconstruction.games : [];
  const totalLeagueGames = games.length;

  if (reconstruction.seasonId !== target.seasonId)
    errors.push("Reconstruction seasonId does not match target");
  if (expectedInputHash && reconstruction.inputHash !== expectedInputHash)
    errors.push("Input hash does not match the current source files");
  if (reconstruction.provenance !== "synthetic-constrained")
    errors.push("Reconstruction provenance must identify synthetic results");
  if (!Array.isArray(reconstruction.games)) errors.push("Reconstruction games are missing");
  if (!Array.isArray(reconstruction.schedulePlan)) errors.push("Schedule plan is missing");
  else {
    for (const pairing of reconstruction.schedulePlan) {
      if (
        !pairing ||
        !teams.has(pairing.teamA) ||
        !teams.has(pairing.teamB) ||
        pairing.teamA === pairing.teamB
      ) {
        errors.push("Schedule plan contains an invalid or unknown matchup");
        continue;
      }
      const key = pairKey(pairing.teamA, pairing.teamB);
      if (planCounts.has(key)) errors.push(`${key}: duplicate matchup in schedule plan`);
      if (!integer(pairing.games)) errors.push(`${key}: invalid planned game count`);
      planCounts.set(key, pairing.games);
    }
  }

  for (const game of games) {
    if (!game || typeof game !== "object") {
      errors.push("Calendar contains a malformed game");
      continue;
    }
    if (!game.id || gameIds.has(game.id))
      errors.push(`Duplicate or missing game ID: ${game.id ?? "(missing)"}`);
    gameIds.add(game.id);
    if (game.seasonId !== target.seasonId || game.phase !== "regular")
      errors.push(`${game.id}: wrong season or phase`);
    if (game.homeTeam === game.awayTeam) errors.push(`${game.id}: a team cannot play itself`);
    const home = teams.get(game.homeTeam);
    const away = teams.get(game.awayTeam);
    if (!home || !away) {
      errors.push(`${game.id}: contains an unknown team`);
      continue;
    }
    if (game.winner !== game.homeTeam && game.winner !== game.awayTeam)
      errors.push(`${game.id}: winner is not a participant`);
    const expectedLoser = game.winner === game.homeTeam ? game.awayTeam : game.homeTeam;
    if (game.loser !== expectedLoser) errors.push(`${game.id}: result is not reciprocal`);
    if (game.provenance !== "synthetic-constrained")
      errors.push(`${game.id}: missing synthetic provenance`);

    const day = new Date(`${game.date}T00:00:00.000Z`);
    const dayIndex = Math.floor((day.getTime() - start.getTime()) / 86_400_000);
    if (
      !Number.isFinite(day.getTime()) ||
      day.toISOString?.().slice(0, 10) !== game.date ||
      dayIndex !== game.dayIndex ||
      dayIndex < 0 ||
      dayIndex >= reconstruction.rules.calendar.days
    )
      errors.push(`${game.id}: date is outside or inconsistent with the generated calendar`);
    if (!scheduledDays.has(game.dayIndex)) scheduledDays.set(game.dayIndex, new Set());
    const dayTeams = scheduledDays.get(game.dayIndex)!;
    if (dayTeams.has(game.homeTeam) || dayTeams.has(game.awayTeam))
      errors.push(`${game.id}: team has multiple games on one day`);
    dayTeams.add(game.homeTeam);
    dayTeams.add(game.awayTeam);
    const datedPair = `${game.dayIndex}:${pairKey(game.homeTeam, game.awayTeam)}`;
    if (datedPairs.has(datedPair)) errors.push(`${game.id}: duplicate matchup on the same day`);
    datedPairs.add(datedPair);
    const pair = pairKey(game.homeTeam, game.awayTeam);
    matchupCounts.set(pair, (matchupCounts.get(pair) ?? 0) + 1);
    const homeCounts = matchupHomeCounts.get(pair) ?? new Map<string, number>();
    homeCounts.set(game.homeTeam, (homeCounts.get(game.homeTeam) ?? 0) + 1);
    matchupHomeCounts.set(pair, homeCounts);

    const homeTally = tallies.get(game.homeTeam)!;
    const awayTally = tallies.get(game.awayTeam)!;
    homeTally.games += 1;
    awayTally.games += 1;
    if (game.winner === game.homeTeam) {
      homeTally.wins += 1;
      homeTally.homeWins += 1;
      awayTally.losses += 1;
      awayTally.awayLosses += 1;
    } else if (game.winner === game.awayTeam) {
      awayTally.wins += 1;
      awayTally.awayWins += 1;
      homeTally.losses += 1;
      homeTally.homeLosses += 1;
    }
    if (home.conference === away.conference) {
      const homeWon = game.winner === game.homeTeam;
      homeTally.conferenceWins += Number(homeWon);
      homeTally.conferenceLosses += Number(!homeWon);
      awayTally.conferenceWins += Number(!homeWon);
      awayTally.conferenceLosses += Number(homeWon);
    }
    if (divisions.get(game.homeTeam) === divisions.get(game.awayTeam)) {
      const homeWon = game.winner === game.homeTeam;
      homeTally.divisionWins += Number(homeWon);
      homeTally.divisionLosses += Number(!homeWon);
      awayTally.divisionWins += Number(!homeWon);
      awayTally.divisionLosses += Number(homeWon);
    }
  }

  const rules = reconstruction.rules.schedule;
  for (let firstIndex = 0; firstIndex < target.teams.length; firstIndex += 1) {
    const first = target.teams[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < target.teams.length; secondIndex += 1) {
      const second = target.teams[secondIndex];
      const sameConference = first.conference === second.conference;
      const sameDivision = divisions.get(first.teamId) === divisions.get(second.teamId);
      const games = matchupCounts.get(pairKey(first.teamId, second.teamId)) ?? 0;
      let minimum: number;
      let maximum: number;
      if (!sameConference) {
        minimum = maximum = rules.interConferenceGamesPerOpponent;
      } else if (sameDivision) {
        minimum = maximum = rules.gamesPerDivisionOpponent;
      } else {
        minimum = rules.conferenceNonDivisionBaseGames;
        maximum = minimum + 1;
      }
      if (games < minimum || games > maximum)
        errors.push(
          `${first.teamId}/${second.teamId}: ${games} games; expected ${minimum}${maximum === minimum ? "" : ` or ${maximum}`}`,
        );
      if ((planCounts.get(pairKey(first.teamId, second.teamId)) ?? 0) !== games)
        errors.push(
          `${first.teamId}/${second.teamId}: schedule plan and calendar game counts differ`,
        );
      const pairHomeCounts = matchupHomeCounts.get(pairKey(first.teamId, second.teamId));
      const firstHomeGames = pairHomeCounts?.get(first.teamId) ?? 0;
      if (sameDivision && firstHomeGames !== rules.gamesPerDivisionOpponent / 2)
        errors.push(`${first.teamId}/${second.teamId}: division home games are not balanced`);
      if (!sameConference && firstHomeGames !== rules.interConferenceGamesPerOpponent / 2)
        errors.push(
          `${first.teamId}/${second.teamId}: interconference home games are not balanced`,
        );
    }
  }
  const plannedGames = [...planCounts.values()].reduce((sum, games) => sum + games, 0);
  if (plannedGames !== totalLeagueGames)
    errors.push(
      `Schedule plan totals ${plannedGames} games, calendar contains ${totalLeagueGames}`,
    );
  for (const team of target.teams) {
    const tally = tallies.get(team.teamId)!;
    const expected: [string, number, number][] = [
      ["games", tally.games, team.wins + team.losses],
      ["wins", tally.wins, team.wins],
      ["losses", tally.losses, team.losses],
      ["home wins", tally.homeWins, team.home.wins],
      ["home losses", tally.homeLosses, team.home.losses],
      ["away wins", tally.awayWins, team.away.wins],
      ["away losses", tally.awayLosses, team.away.losses],
      ["conference wins", tally.conferenceWins, team.conferenceRecord.wins],
      ["conference losses", tally.conferenceLosses, team.conferenceRecord.losses],
      ["division wins", tally.divisionWins, team.divisionRecord.wins],
      ["division losses", tally.divisionLosses, team.divisionRecord.losses],
    ];
    for (const [label, actual, expectedValue] of expected) {
      if (actual !== expectedValue)
        errors.push(`${team.teamId}: ${label} ${actual}, expected ${expectedValue}`);
    }
    const pct = tally.games ? Math.round((tally.wins / tally.games) * 1000) / 1000 : 0;
    if (pct !== team.pct) errors.push(`${team.teamId}: percentage ${pct}, expected ${team.pct}`);
  }

  const totalWins = [...tallies.values()].reduce((sum, tally) => sum + tally.wins, 0);
  const totalLosses = [...tallies.values()].reduce((sum, tally) => sum + tally.losses, 0);
  if (totalWins !== totalLosses)
    errors.push(`League results are not reciprocal (${totalWins} wins, ${totalLosses} losses)`);
  if (totalWins !== totalLeagueGames || totalLosses !== totalLeagueGames)
    errors.push("League game totals do not match recalculated wins and losses");

  const observedStandings = new Map(
    (Array.isArray(reconstruction.standings) ? reconstruction.standings : []).map((standing) => [
      standing.teamId,
      standing,
    ]),
  );
  if (observedStandings.size !== target.teams.length)
    errors.push("Reconstructed standings do not cover every target team exactly once");
  for (const team of target.teams) {
    const standing = observedStandings.get(team.teamId);
    const tally = tallies.get(team.teamId)!;
    if (
      !standing ||
      standing.conference !== team.conference ||
      standing.rank !== team.rank ||
      standing.wins !== tally.wins ||
      standing.losses !== tally.losses ||
      standing.pct !== team.pct
    )
      errors.push(
        `${team.teamId}: final standings classification differs from the observed target`,
      );
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    totals: {
      teams: target.teams.length,
      games: totalLeagueGames,
      wins: totalWins,
      losses: totalLosses,
    },
    coverage: {
      overall: errors.every(
        (error) => !/overall|wins|losses|games|percentage|classification/.test(error),
      ),
      homeAway: errors.every((error) => !/home|away|mando/i.test(error)),
      conference: errors.every((error) => !/conference/i.test(error)),
      division: errors.every((error) => !/division/i.test(error)),
      observedRankOrder: "preserved-not-derived",
    },
  };
}
