import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ranking Engine Logic
const WEIGHTS = {
  "PG-SG Armador criativo explosivo": {
    PPG: 1.2,
    RPG: 0.4,
    APG: 1.4,
    SPG: 1.0,
    BPG: 0.2,
    TOPG: -1.0,
  },
  "PG-SG Floor general pontuador": { PPG: 1.1, RPG: 0.5, APG: 1.6, SPG: 1.2, BPG: 0.2, TOPG: -1.2 },
  "SG-PG Combo scorer agressivo": { PPG: 1.4, RPG: 0.5, APG: 0.9, SPG: 0.9, BPG: 0.2, TOPG: -0.9 },
  "SG-PG Off-ball sniper secundário": {
    PPG: 1.3,
    RPG: 0.4,
    APG: 0.6,
    SPG: 0.8,
    BPG: 0.3,
    TOPG: -0.5,
  },
  "SG-SF Wing slasher atlético": { PPG: 1.2, RPG: 0.7, APG: 0.7, SPG: 1.1, BPG: 0.5, TOPG: -0.9 },
  "SF-SG 3-and-D técnico": { PPG: 1.0, RPG: 0.6, APG: 0.6, SPG: 1.5, BPG: 1.0, TOPG: -0.5 },
  "SF-PF Stretch forward moderno": { PPG: 1.2, RPG: 0.8, APG: 0.6, SPG: 0.7, BPG: 0.6, TOPG: -0.7 },
  "SF-PF Point forward físico": { PPG: 1.0, RPG: 0.9, APG: 1.4, SPG: 0.9, BPG: 0.6, TOPG: -1.1 },
  "PF-SF Slashing 4 móvel": { PPG: 1.2, RPG: 1.0, APG: 0.6, SPG: 0.8, BPG: 0.8, TOPG: -0.9 },
  "PF-SF Defender versátil": { PPG: 0.8, RPG: 1.1, APG: 0.6, SPG: 1.4, BPG: 1.4, TOPG: -0.7 },
  "PF-C Interior dominante moderno": {
    PPG: 1.2,
    RPG: 1.3,
    APG: 0.4,
    SPG: 0.6,
    BPG: 1.4,
    TOPG: -1.0,
  },
  "C-PF Stretch 5 técnico": { PPG: 1.2, RPG: 1.1, APG: 0.6, SPG: 0.5, BPG: 1.0, TOPG: -0.8 },
  "C-PF Post scorer clássico": { PPG: 1.3, RPG: 1.4, APG: 0.3, SPG: 0.4, BPG: 1.2, TOPG: -1.1 },
};

const GOLD_STANDARDS = {
  "PG-SG Armador criativo explosivo": {
    PPG: 25.0,
    RPG: 6.0,
    APG: 10.0,
    SPG: 2.0,
    BPG: 0.5,
    TOPG: 2.5,
  },
  "PG-SG Floor general pontuador": {
    PPG: 28.0,
    RPG: 7.0,
    APG: 12.0,
    SPG: 2.0,
    BPG: 0.5,
    TOPG: 2.5,
  },
  "SG-PG Combo scorer agressivo": { PPG: 34.0, RPG: 6.0, APG: 6.0, SPG: 1.5, BPG: 0.5, TOPG: 2.0 },
  "SG-PG Off-ball sniper secundário": {
    PPG: 26.0,
    RPG: 8.0,
    APG: 10.0,
    SPG: 1.5,
    BPG: 1.0,
    TOPG: 1.0,
  },
  "SG-SF Wing slasher atlético": { PPG: 28.0, RPG: 8.0, APG: 6.0, SPG: 2.0, BPG: 1.2, TOPG: 2.0 },
  "SF-SG 3-and-D técnico": { PPG: 22.0, RPG: 6.0, APG: 4.0, SPG: 2.5, BPG: 1.5, TOPG: 1.0 },
  "SF-PF Stretch forward moderno": {
    PPG: 26.0,
    RPG: 10.0,
    APG: 4.0,
    SPG: 1.0,
    BPG: 1.2,
    TOPG: 1.5,
  },
  "SF-PF Point forward físico": { PPG: 26.0, RPG: 10.0, APG: 9.0, SPG: 1.5, BPG: 1.0, TOPG: 2.5 },
  "PF-SF Slashing 4 móvel": { PPG: 28.0, RPG: 11.0, APG: 5.0, SPG: 1.5, BPG: 1.5, TOPG: 1.8 },
  "PF-SF Defender versátil": { PPG: 16.0, RPG: 13.0, APG: 7.0, SPG: 2.5, BPG: 2.5, TOPG: 1.5 },
  "PF-C Interior dominante moderno": {
    PPG: 30.0,
    RPG: 14.0,
    APG: 5.0,
    SPG: 1.0,
    BPG: 2.5,
    TOPG: 2.0,
  },
  "C-PF Stretch 5 técnico": { PPG: 26.0, RPG: 12.0, APG: 5.0, SPG: 1.0, BPG: 2.0, TOPG: 1.5 },
  "C-PF Post scorer clássico": { PPG: 32.0, RPG: 13.0, APG: 4.0, SPG: 0.8, BPG: 2.0, TOPG: 2.0 },
};

const PHASE_MULTIPLIERS = { Regular: 1.0, Playoffs: 1.5, Finals: 2.0 };

const AWARDS_POINTS = {
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

function resolveArchetype(archetype) {
  if (!archetype) return Object.keys(WEIGHTS)[0];
  if (WEIGHTS[archetype]) return archetype;
  const lower = archetype.toLowerCase();
  for (const key of Object.keys(WEIGHTS)) {
    if (key.toLowerCase().includes(lower)) return key;
  }
  return Object.keys(WEIGHTS)[0];
}

function getAwardPoints(awardName) {
  if (!awardName) return 0;
  const clean = awardName.trim().toLowerCase();
  for (const [key, points] of Object.entries(AWARDS_POINTS)) {
    if (key.toLowerCase() === clean) return points;
  }
  return 0;
}

function getImpact(stats, archetype) {
  if (!stats) return 0.0;
  const key = resolveArchetype(archetype);
  const weights = WEIGHTS[key];
  const impact =
    (stats.PPG || 0) * (weights.PPG || 0) +
    (stats.RPG || 0) * (weights.RPG || 0) +
    (stats.APG || 0) * (weights.APG || 0) +
    (stats.SPG || 0) * (weights.SPG || 0) +
    (stats.BPG || 0) * (weights.BPG || 0) +
    (stats.TOPG || 0) * (weights.TOPG || 0);
  return Math.max(0.0, impact);
}

function calculatePhaseGrade(stats, archetype) {
  if (!stats || (stats.GP || 0) === 0) return 0.0;
  const key = resolveArchetype(archetype);
  const goldStats = GOLD_STANDARDS[key];
  const playerImpact = getImpact(stats, archetype);
  const goldImpact = getImpact(goldStats, archetype);
  if (goldImpact <= 0) return 0.0;
  const grade = (playerImpact / goldImpact) * 10.0;
  return Math.max(0.0, Math.min(Number(grade.toFixed(2)), 10.0));
}

function calculatePhaseScore(stats, archetype, phase) {
  if (!stats) return 0.0;
  const impact = getImpact(stats, archetype);
  const multiplier = PHASE_MULTIPLIERS[phase] || 1.0;
  return impact * stats.GP * multiplier;
}

// Data parser
function toFloat(val) {
  if (!val) return 0.0;
  if (typeof val === "string") val = val.replace(",", ".");
  const num = parseFloat(val);
  return isNaN(num) ? 0.0 : num;
}

function toInt(val) {
  return Math.floor(toFloat(val));
}

async function run() {
  const excelPath = path.join(__dirname, "../legacy_python_code/data/nba_carreira.xlsx");
  const workbook = XLSX.readFile(excelPath);

  const careerData = {};
  const seasonList = [];

  let seasonIdCounter = 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Process season details roughly
    seasonList.push({
      id: seasonIdCounter++,
      name: sheetName,
      year: "Histórico", // Fallback, could extract from name
      champion: "N/A", // This could be parsed from team awards if present
      mvp: "N/A",
      finalsMvp: "N/A",
      gamesPlayed: 82,
    });

    for (const row of Object.keys(data).map((k) => {
      const lowRow = {};
      for (const key of Object.keys(data[k])) {
        lowRow[key.toString().trim().toUpperCase()] = data[k][key];
      }
      return lowRow;
    })) {
      const name = row["NAME"]?.toString().trim();
      if (!name || name.toLowerCase() === "nan") continue;

      let archetype = row["ARCHETYPE"]?.toString().trim().replace(/\s+/g, " ");
      const phase =
        row["PHASE"]?.toString().trim().toLowerCase() === "playoffs"
          ? "Playoffs"
          : row["PHASE"]?.toString().trim().toLowerCase() === "finals"
            ? "Finals"
            : "Regular";

      if (!careerData[name]) {
        careerData[name] = {
          name,
          archetype,
          phases: { Regular: [], Playoffs: [], Finals: [] },
          awards: [],
          seasons: new Set(),
        };
      }

      careerData[name].seasons.add(sheetName);

      if (archetype) careerData[name].archetype = archetype;

      const statsObj = {
        GP: toInt(row["GP"]),
        PPG: toFloat(row["PPG"]),
        RPG: toFloat(row["RPG"]),
        APG: toFloat(row["APG"]),
        SPG: toFloat(row["SPG"]),
        BPG: toFloat(row["BPG"]),
        TOPG: toFloat(row["TOPG"]),
        MPG: toFloat(row["MPG"]),
      };

      careerData[name].phases[phase].push(statsObj);

      const awardsStr = row["AWARDS"]?.toString().trim();
      if (awardsStr && awardsStr.toLowerCase() !== "nan") {
        awardsStr.split("|").forEach((aw) => {
          const award = aw.trim();
          if (award) careerData[name].awards.push(award);
        });
      }
    }
  }

  // Aggregate Players
  const players = [];
  let playerIdCounter = 1;
  const finalSeasons = seasonList; // we will guess MVP / Champion later

  for (const name of Object.keys(careerData)) {
    const cd = careerData[name];

    let totalScore = 0;

    // Calculate total score exactly like Python
    const aggStats = { Regular: { GP: 0 }, Playoffs: { GP: 0 }, Finals: { GP: 0 } };

    ["Regular", "Playoffs", "Finals"].forEach((ph) => {
      for (const st of cd.phases[ph]) {
        totalScore += calculatePhaseScore(st, cd.archetype, ph);
        // sum up for average
        Object.keys(st).forEach((k) => {
          aggStats[ph][k] = (aggStats[ph][k] || 0) + st[k];
        });
      }
    });

    for (const award of cd.awards) {
      totalScore += getAwardPoints(award);
    }

    // Average regular season stats for display
    const regCount = cd.phases.Regular.length || 1;
    let avgPPS = 0,
      avgREB = 0,
      avgAST = 0,
      avgSTL = 0,
      avgBLK = 0,
      avgTO = 0;
    cd.phases.Regular.forEach((st) => {
      avgPPS += st.PPG;
      avgREB += st.RPG;
      avgAST += st.APG;
      avgSTL += st.SPG;
      avgBLK += st.BPG;
      avgTO += st.TOPG;
    });
    avgPPS /= regCount;
    avgREB /= regCount;
    avgAST /= regCount;
    avgSTL /= regCount;
    avgBLK /= regCount;
    avgTO /= regCount;

    const regGrade = calculatePhaseGrade(
      {
        GP: aggStats.Regular.GP,
        PPG: avgPPS,
        RPG: avgREB,
        APG: avgAST,
        SPG: avgSTL,
        BPG: avgBLK,
        TOPG: avgTO,
      },
      cd.archetype,
    );

    const poCount = cd.phases.Playoffs.length || 1;
    const finCount = cd.phases.Finals.length || 1;

    let popAvg = {};
    let finAvg = {};
    const phases = [
      { name: "Playoffs", count: poCount, target: popAvg },
      { name: "Finals", count: finCount, target: finAvg },
    ];

    phases.forEach((p) => {
      ["PPG", "RPG", "APG", "SPG", "BPG", "TOPG"].forEach((k) => (p.target[k] = 0));
      cd.phases[p.name].forEach((st) => {
        ["PPG", "RPG", "APG", "SPG", "BPG", "TOPG"].forEach((k) => (p.target[k] += st[k]));
      });
      ["PPG", "RPG", "APG", "SPG", "BPG", "TOPG"].forEach((k) => (p.target[k] /= p.count));
      p.target.GP = aggStats[p.name].GP / p.count;
    });

    const poGrade = calculatePhaseGrade(popAvg, cd.archetype);
    const finGrade = calculatePhaseGrade(finAvg, cd.archetype);

    const rings = cd.awards.filter((a) => a.toLowerCase() === "nba champion").length;

    players.push({
      id: playerIdCounter++,
      name: cd.name,
      archetype: cd.archetype,
      team: "Free Agent", // Not mapped in excel, will default
      rings: rings,
      scoreTotal: Number(totalScore.toFixed(2)),
      pts: Number(avgPPS.toFixed(1)),
      reb: Number(avgREB.toFixed(1)),
      ast: Number(avgAST.toFixed(1)),
      stl: Number(avgSTL.toFixed(1)),
      blk: Number(avgBLK.toFixed(1)),
      seasons: cd.seasons.size,
      clutchIndex: finGrade > regGrade ? 95 : 85, // Fake clutch logic
      basketballIQ: avgTO > 0 ? Number((avgAST / avgTO).toFixed(1)) : 5.0,
      regularSeasonGrade: regGrade,
      playoffsGrade: poGrade,
      finalsGrade: finGrade,
      bio: "Nenhuma biografia disponível ainda para " + cd.name + ". Edite em src/lib/mock-data.ts",
    });
  }

  // Sort players by total score
  players.sort((a, b) => b.scoreTotal - a.scoreTotal);

  // Fix up seasons
  // For each season, figure out who won MVP etc based on awards
  // but if it's too complex, just use strings.
  for (let i = 0; i < seasonList.length; i++) {
    const sName = seasonList[i].name;
    // Just simple lookup in the raw careerData - MVP
    // Excel structure: multiple sheets, player gets MVP in that sheet.
    // However, awards are concatenated over the career.
    // We cannot easily tell which season they got MVP.
    // We will leave season table somewhat generic if parsing is impossible,
    // or just let the front-end handle it.
  }

  const outPath = path.join(__dirname, "../src/lib/mock-data.ts");
  let content = fs.readFileSync(outPath, "utf-8");

  content = content.replace(
    /export const players: Player\[\] = \[[\s\S]*?\];/,
    `export const players: Player[] = ${JSON.stringify(players, null, 2)};`,
  );

  content = content.replace(
    /export const seasons: Season\[\] = \[[\s\S]*?\];/,
    `export const seasons: Season[] = ${JSON.stringify(finalSeasons, null, 2)};`,
  );

  fs.writeFileSync(outPath, content, "utf-8");
  console.log("Migration complete!");
}

run();
