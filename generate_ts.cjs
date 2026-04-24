const fs = require('fs');

const playerStats = JSON.parse(fs.readFileSync('player_season_stats.json', 'utf8'));

const tsCode = `// Generated automatically from nba_carreira.xlsx
export const seasonStatsMap: Record<string, any> = ${JSON.stringify(playerStats, null, 2)};
`;

fs.writeFileSync('src/lib/season-stats.ts', tsCode);
console.log('Created src/lib/season-stats.ts');
