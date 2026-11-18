export type RecordTarget = { wins: number; losses: number };
export type ScoringTarget = { pointsForPerGame: number; pointsAgainstPerGame: number };

export type LeagueTeamTarget = {
  teamId: string;
  conference: string;
  rank: number;
  wins: number;
  losses: number;
  pct: number;
  home: RecordTarget;
  away: RecordTarget;
  conferenceRecord: RecordTarget;
  divisionRecord: RecordTarget;
  scoring?: ScoringTarget;
};

export type SeasonTarget = {
  seasonId: string;
  label: string;
  teams: LeagueTeamTarget[];
};

export type Division = { id: string; conference: string; teams: string[] };

export type SeasonRules = {
  version: string;
  provenance: "synthetic-constrained";
  calendar: { startDate: string; days: number };
  schedule: {
    gamesPerTeam: number;
    homeGamesPerTeam: number;
    conferenceGamesPerTeam: number;
    divisionGamesPerTeam: number;
    gamesPerDivisionOpponent: number;
    conferenceNonDivisionBaseGames: number;
    conferenceNonDivisionExtraGamesPerTeam: number;
    interConferenceGamesPerOpponent: number;
  };
  scoring?: {
    displayPrecision: number;
    minPointsPerTeam: number;
    maxPointsPerTeam: number;
    maxDeviationFromPairedAverage: number;
    minCombinedPoints: number;
    maxCombinedPoints: number;
    maxMargin: number;
  };
  divisions: Division[];
};

export type SyntheticGame = {
  id: string;
  seasonId: string;
  phase: "regular";
  date: string;
  dayIndex: number;
  homeTeam: string;
  awayTeam: string;
  winner: string;
  loser: string;
  homeScore?: number;
  awayScore?: number;
  scoreProvenance?: "synthetic-constrained";
  provenance: "synthetic-constrained";
};

export type ReconstructedStanding = {
  conference: string;
  rank: number;
  teamId: string;
  wins: number;
  losses: number;
  pct: number;
};

export type Reconstruction = {
  schemaVersion: "1.1";
  seasonId: string;
  reconstructionId: string;
  algorithmVersion: string;
  seed: string;
  provenance: "synthetic-constrained";
  generatedAt: string;
  inputHash: string;
  rules: SeasonRules;
  schedulePlan: { teamA: string; teamB: string; games: number }[];
  games: SyntheticGame[];
  standings: ReconstructedStanding[];
  optimization: { method: string; objective: number; optimal: boolean };
  scoreAssignment?: {
    method: string;
    status: "feasible";
    displayPrecision: number;
  };
  validation: {
    status: "validated";
    checkedAt: string;
    rankingCriterion: "observed-order-preserved-not-derived";
    errors: string[];
  };
};
