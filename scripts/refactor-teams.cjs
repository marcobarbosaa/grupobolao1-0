const fs = require("fs");
const path = require("path");

// 1. Update mock-data.ts
const mockDataPath = path.join(process.cwd(), "src", "lib", "mock-data.ts");
let mockDataContent = fs.readFileSync(mockDataPath, "utf8");

// Replace interface team: string with teams: string[]
mockDataContent = mockDataContent.replace(/team: string;/g, "teams: string[];");

// Replace team: "Free Agent" or similar with teams: ["Draft"]
mockDataContent = mockDataContent.replace(/team: "[^"]+",/g, 'teams: ["Inserir times aqui"],');

fs.writeFileSync(mockDataPath, mockDataContent);
console.log("mock-data.ts updated!");

// 2. Update index.tsx
const indexPath = path.join(process.cwd(), "src", "routes", "index.tsx");
let indexContent = fs.readFileSync(indexPath, "utf8");
indexContent = indexContent.replace(/\{player\.team\}/g, '{player.teams.join(", ")}');
fs.writeFileSync(indexPath, indexContent);
console.log("index.tsx updated!");

// 3. Update biografias.tsx
const bioPath = path.join(process.cwd(), "src", "routes", "biografias.tsx");
let bioContent = fs.readFileSync(bioPath, "utf8");
bioContent = bioContent.replace(/\{player\.team\}/g, '{player.teams.join(" • ")}');
fs.writeFileSync(bioPath, bioContent);
console.log("biografias.tsx updated!");
