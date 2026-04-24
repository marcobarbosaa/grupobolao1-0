const fs = require("fs");

let content = fs.readFileSync("src/lib/mock-data.ts", "utf8");

// Add bio to the Player interface
content = content.replace(
  /export interface Player \{([\s\S]+?)\}/,
  "export interface Player {$1  bio: string;\n}",
);

// Add a default bio to all player objects
// We match on `"finalsGrade": <number>`
content = content.replace(
  /("finalsGrade": [\d\.]+)/g,
  '$1,\n    "bio": "Escreva a biografia dupla aqui..."',
);

fs.writeFileSync("src/lib/mock-data.ts", content, "utf8");
console.log("Bio field added successfully!");
