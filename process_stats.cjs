const fs = require('fs');

const excelData = JSON.parse(fs.readFileSync('excel_data.json', 'utf8'));
const playerStats = {};

Object.keys(excelData).forEach(seasonKey => {
  const seasonMatch = seasonKey.match(/Season (\d+)/);
  if (!seasonMatch) return;
  const seasonNum = parseInt(seasonMatch[1], 10);
  
  excelData[seasonKey].forEach(row => {
    let name = row.Name;
    if (name === "Cerrote") name = "Cristiano Ronaldo";
    if (name === "Thug") name = "Matheus Germano";
    
    if (!playerStats[name]) {
      playerStats[name] = {};
    }
    if (!playerStats[name][seasonNum]) {
      playerStats[name][seasonNum] = {};
    }
    
    const phaseKey = row.Phase.toLowerCase();
    playerStats[name][seasonNum][phaseKey] = {
      gp: parseInt(row.GP || 0, 10),
      pts: parseFloat(row.PPG || 0),
      reb: parseFloat(row.RPG || 0),
      ast: parseFloat(row.APG || 0),
      stl: parseFloat(row.SPG || 0),
      blk: parseFloat(row.BPG || 0),
      topg: parseFloat(row.TOPG || 0),
    };
  });
});

fs.writeFileSync('player_season_stats.json', JSON.stringify(playerStats, null, 2));
console.log('Done');
