const fs = require('fs');

// Precisamos ler os players para saber os times deles em cada season
// Como o mock-data é TS, vamos ler o JSON gerado anteriormente ou o excel_data
const excelData = JSON.parse(fs.readFileSync('excel_data.json', 'utf8'));

// Mapa de times por jogador/season (simulado a partir do que sabemos do mock-data)
// Na vdd, o excel_data não tem a coluna Team, mas o mock-data tem o teamHistory manual.
// Vou usar os dados do mock-data.ts

const champions = {};

// Temporadas de 1 a 22
for (let i = 1; i <= 22; i++) {
  const seasonKey = `Season ${i}`;
  if (!excelData[seasonKey]) continue;

  excelData[seasonKey].forEach(row => {
    if (row.Awards && row.Awards.includes("NBA Champion")) {
      let playerName = row.Name;
      if (playerName === "Cerrote") playerName = "Cristiano Ronaldo";
      if (playerName === "Thug") playerName = "Matheus Germano";

      // Encontrar o MVP das finais e MVP da temporada regular se houver
      const isFinalsMVP = row.Awards.includes("Finals MVP");
      const isMVP = row.Awards.includes("Regular Season MVP") || row.Awards.includes("MVP");

      if (!champions[i]) {
        champions[i] = {
          winner: "Desconhecido", // Vamos preencher depois com o time
          finalsMVP: "",
          regularMVP: ""
        };
      }

      if (isFinalsMVP) champions[i].finalsMVP = playerName;
      if (isMVP) champions[i].regularMVP = playerName;
      
      // Armazenamos o nome do jogador campeão para buscar o time dele
      champions[i].championPlayer = playerName;
    }
    
    // Buscar MVP mesmo se não for campeão
    if (row.Awards && (row.Awards.includes("MVP") && !row.Awards.includes("Finals"))) {
        let playerName = row.Name;
        if (playerName === "Cerrote") playerName = "Cristiano Ronaldo";
        if (playerName === "Thug") playerName = "Matheus Germano";
        if (!champions[i]) champions[i] = { winner: "TBD", finalsMVP: "", regularMVP: "" };
        champions[i].regularMVP = playerName;
    }
  });
}

fs.writeFileSync('champions_data.json', JSON.stringify(champions, null, 2));
console.log('Done');
