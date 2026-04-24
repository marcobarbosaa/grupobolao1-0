const fs = require("fs");

let content = fs.readFileSync("src/lib/mock-data.ts", "utf8");

const imageMap = {
  Nando: "Nando.jpeg",
  Gam: "Gam.jpeg",
  Medeiros: "Medeiros.png",
  Dias: "Dias.jpeg",
  Guilherme: "Guilherme.jpeg",
  Binho: "Binho.jpeg",
  Enzo: "Enzo.jpeg",
  Abel: "Abel.jpeg",
  Marco: "Marco.jpeg",
  Tailan: "Tailan.jpeg",
  Cerrote: "Cerrote.jpeg",
  "Cristiano Ronaldo": "Cerrote.jpeg",
  Thug: "Thug.jpeg",
  "Matheus Germano": "Thug.jpeg",
  Jonas: "Jonas.png",
};

const renameMap = {
  Cerrote: "Cristiano Ronaldo",
  Thug: "Matheus Germano",
};

// Loop over each player and update
Object.keys(imageMap).forEach((key) => {
  const blockRegex = new RegExp(
    `(name: "${key}",[\\s\\S]*?)(finalsGrade: [\\d\\.]+)(,)?(\\s+bio:.*)?(\\s+imageUrl:.*)?(\\s*})`,
    "gm",
  );

  content = content.replace(blockRegex, (match, p1, p2) => {
    let newNameStr = p1;
    if (renameMap[key]) {
      newNameStr = newNameStr.replace(`name: "${key}"`, `name: "${renameMap[key]}"`);
    }

    return `${newNameStr}${p2},\n    bio: "Escreva a biografia aqui para ${renameMap[key] || key}...",\n    imageUrl: "/jogadores/${imageMap[key]}"\n  }`;
  });
});

fs.writeFileSync("src/lib/mock-data.ts", content, "utf8");
console.log("Images and names synced successfully!");
