export interface PhaseStats {
  GP: number;
  PPG: number;
  RPG: number;
  APG: number;
  SPG: number;
  BPG: number;
  TOPG: number;
  MPG: number;
}

export interface PlayerStatsConfig {
  Regular?: PhaseStats;
  Playoffs?: PhaseStats;
  Finals?: PhaseStats;
}

export class PlayerData {
  name: string;
  archetype: string;
  stats: PlayerStatsConfig = {};
  awards: string[] = [];

  constructor(name: string, archetype: string) {
    this.name = name;
    this.archetype = archetype;
  }

  setStats(
    phase: "Regular" | "Playoffs" | "Finals",
    gp: number,
    ppg: number,
    rpg: number,
    apg: number,
    spg: number,
    bpg: number,
    topg: number,
    mpg: number,
  ) {
    this.stats[phase] = {
      GP: gp,
      PPG: ppg,
      RPG: rpg,
      APG: apg,
      SPG: spg,
      BPG: bpg,
      TOPG: topg,
      MPG: mpg,
    };
  }

  addAward(awardName: string) {
    this.awards.push(awardName);
  }
}

export class RankingEngine {
  static WEIGHTS: Record<string, Partial<PhaseStats>> = {
    "PG-SG Armador criativo explosivo": { PPG: 1.25, RPG: 0.5, APG: 1.2, SPG: 1.1, BPG: 0.3, TOPG: -1.1},
    "PG-SG Floor general pontuador": { PPG: 1.2, RPG: 0.5, APG: 1.3, SPG: 1.0, BPG: 0.2, TOPG: -1.0 },
    "SG-PG Combo scorer agressivo": { PPG: 1.4, RPG: 0.5, APG: 0.9, SPG: 0.9, BPG: 0.2, TOPG: -0.9},
    "SG-PG Off-ball sniper secundário": { PPG: 1.4, RPG: 0.5, APG: 0.7, SPG: 0.9, BPG: 0.4, TOPG: -0.7 },
    "SG-SF Wing slasher atlético": {   PPG: 1.25, RPG: 0.8, APG: 0.7, SPG: 1.2, BPG: 0.4, TOPG: -1.0 },
    "SF-SG 3-and-D técnico": { PPG: 1.1, RPG: 0.6, APG: 0.5, SPG: 1.2, BPG: 0.8, TOPG: -0.7 },
    "SF-PF Stretch forward moderno": { PPG: 1.25, RPG: 1.0, APG: 0.7, SPG: 0.8, BPG: 0.9, TOPG: -0.8 },
    "SF-PF Point forward físico": { PPG: 1.1, RPG: 1.0, APG: 1.1, SPG: 1.0, BPG: 0.8, TOPG: -0.9 },
    "PF-SF Slashing 4 móvel": { PPG: 1.3, RPG: 1.1, APG: 0.7, SPG: 0.9, BPG: 0.7, TOPG: -0.9 },
    "PF-SF Defender versátil": { PPG: 0.9, RPG: 1.1, APG: 0.6, SPG: 1.2, BPG: 1.1, TOPG: -0.8 },
    "PF-C Interior dominante moderno": { PPG: 1.25, RPG: 1.2, APG: 0.5, SPG: 0.7, BPG: 1.2, TOPG: -1.1 },
    "C-PF Stretch 5 técnico": { PPG: 1.2, RPG: 1.05, APG: 0.9, SPG: 0.6, BPG: 1.0, TOPG: -1.1 },
    "C-PF Post scorer clássico": { PPG: 1.35, RPG: 1.25, APG: 0.3, SPG: 0.5, BPG: 1.0, TOPG: -1.2 },
  };

  static GOLD_STANDARDS: Record<string, Partial<PhaseStats>> = {
  "PG-SG Armador criativo explosivo": { PPG: 23.0, RPG: 5.5, APG: 8.5, SPG: 1.8, BPG: 0.4, TOPG: 2.8 },
  "PG-SG Floor general pontuador": { PPG: 23.0, RPG: 6.0, APG: 9.0, SPG: 1.6, BPG: 0.3, TOPG: 2.6 },
  "SG-PG Combo scorer agressivo": { PPG: 25.0, RPG: 5.5, APG: 5.5, SPG: 1.4, BPG: 0.4, TOPG: 2.3 },
  "SG-PG Off-ball sniper secundário": { PPG: 25.2, RPG: 8.0, APG: 9.5, SPG: 2.0, BPG: 1.0, TOPG: 1.4 },
  "SG-SF Wing slasher atlético": { PPG: 20.0, RPG: 6.5, APG: 4.0, SPG: 1.6, BPG: 0.9, TOPG: 2.2 },
  "SF-SG 3-and-D técnico": { PPG: 20.0, RPG: 5.0, APG: 3.5, SPG: 2.2, BPG: 1.2, TOPG: 1.2 },
  "SF-PF Stretch forward moderno": { PPG: 24.0, RPG: 9.0, APG: 3.5, SPG: 1.0, BPG: 1.1, TOPG: 1.8 },
  "SF-PF Point forward físico": { PPG: 22.5, RPG: 9.0, APG: 8.0, SPG: 1.7, BPG: 1.2, TOPG: 1.9 },
  "PF-SF Slashing 4 móvel": { PPG: 20.0, RPG: 10.5, APG: 3.5, SPG: 1.3, BPG: 1.6, TOPG: 2.0 },
  "PF-SF Defender versátil": { PPG: 13.5, RPG: 11.0, APG: 6.5, SPG: 2.2, BPG: 2.2, TOPG: 1.8 },
  "PF-C Interior dominante moderno": { PPG: 23.0, RPG: 10.7, APG: 6.0, SPG: 1.3, BPG: 2.3, TOPG: 1.5 },
  "C-PF Stretch 5 técnico": { PPG: 20.0, RPG: 10.0, APG: 6.5, SPG: 1.0, BPG: 1.6, TOPG: 2.0 },
  "C-PF Post scorer clássico": { PPG: 23.0, RPG: 10.5, APG: 3.5, SPG: 0.7, BPG: 2.0, TOPG: 2.3 },
  };

  static PHASE_MULTIPLIERS: Record<string, number> = {
    Regular: 1.0,
    Playoffs: 1.5,
    Finals: 2.0,
  };

  static AWARDS_POINTS: Record<string, number> = {
    MVP: 1000,
    "NBA Champion": 700,
    "Finals MVP": 800,
    DPOY: 600,
    "All-NBA 1st Team": 500,
    "All-NBA 2nd Team": 200,
    "All-NBA 3rd Team": 100,
    "All-Defensive 1st Team": 300,
    "All-Defensive 2nd Team": 150,
    "All-Star": 150,
    ROTY: 300,
    MIP: 200,
  };

  static resolveArchetype(archetype: string): string {
    if (!archetype) return Object.keys(this.WEIGHTS)[0];
    if (this.WEIGHTS[archetype]) return archetype;
    const lower = archetype.toLowerCase();
    for (const key of Object.keys(this.WEIGHTS)) {
      if (key.toLowerCase().includes(lower)) {
        return key;
      }
    }
    return Object.keys(this.WEIGHTS)[0];
  }

  static getAwardPoints(awardName: string): number {
    if (!awardName) return 0;
    const clean = awardName.trim().toLowerCase();
    for (const [key, points] of Object.entries(this.AWARDS_POINTS)) {
      if (key.toLowerCase() === clean) return points;
    }
    return 0;
  }

  static getImpact(stats: Partial<PhaseStats> | undefined, archetype: string): number {
    if (!stats) return 0.0;
    const key = this.resolveArchetype(archetype);
    const weights = this.WEIGHTS[key] as any; // Safe due to resolveArchetype

    const impact =
      (stats.PPG || 0) * (weights.PPG || 0) +
      (stats.RPG || 0) * (weights.RPG || 0) +
      (stats.APG || 0) * (weights.APG || 0) +
      (stats.SPG || 0) * (weights.SPG || 0) +
      (stats.BPG || 0) * (weights.BPG || 0) +
      (stats.TOPG || 0) * (weights.TOPG || 0);

    return Math.max(0.0, impact);
  }

  static calculatePhaseGrade(stats: Partial<PhaseStats> | undefined, archetype: string): number {
    if (!stats || (stats.GP || 0) === 0) return 0.0;
    const key = this.resolveArchetype(archetype);
    const goldStats = this.GOLD_STANDARDS[key];

    const playerImpact = this.getImpact(stats, archetype);
    const goldImpact = this.getImpact(goldStats, archetype);

    if (goldImpact <= 0) return 0.0;

    const ratio = playerImpact / goldImpact;
    const adjusted = Math.pow(ratio, 1.25);
    const grade = adjusted * 10.0;
    const clamped = Math.max(0.0, Math.min(Number(grade.toFixed(2)), 10.0));
    return clamped;
  }

  static calculateSeasonFinalGrade(regGrade: number, poGrade: number, finGrade: number): number {
    if (regGrade > 0 && poGrade > 0 && finGrade > 0) {
      return Number((regGrade * 0.5 + poGrade * 0.3 + finGrade * 0.2).toFixed(2));
    } else if (regGrade > 0 && poGrade > 0) {
      return Number((regGrade * 0.6 + poGrade * 0.4).toFixed(2));
    } else if (regGrade > 0) {
      return Number(regGrade.toFixed(2));
    }
    return 0.0;
  }

  static calculatePhaseScore(player: PlayerData, phase: "Regular" | "Playoffs" | "Finals"): number {
    const stats = player.stats[phase];
    if (!stats) return 0.0;

    const impact = this.getImpact(stats, player.archetype);
    const multiplier = this.PHASE_MULTIPLIERS[phase] || 1.0;
    return impact * stats.GP * multiplier;
  }

  static calculateTotalScore(player: PlayerData): number {
    let totalScore =
      this.calculatePhaseScore(player, "Regular") +
      this.calculatePhaseScore(player, "Playoffs") +
      this.calculatePhaseScore(player, "Finals");

    for (const award of player.awards) {
      totalScore += this.getAwardPoints(award);
    }
    return Number(totalScore.toFixed(2));
  }
}
