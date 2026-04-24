const fs = require("fs");

let content = fs.readFileSync("src/lib/mock-data.ts", "utf8");

// Add imageUrl to the Player interface
if (!content.includes("imageUrl?: string;")) {
  content = content.replace(
    /export interface Player \{([\s\S]+?)\}/,
    "export interface Player {$1  imageUrl?: string;\n}",
  );
}

fs.writeFileSync("src/lib/mock-data.ts", content, "utf8");
console.log("imageUrl added successfully!");
