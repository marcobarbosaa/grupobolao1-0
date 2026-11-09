import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/new-roster.ts", import.meta.url), "utf8");
const names = ["Fábio Carvalho","Abel","Gam Mori","Marco Barbosa","Cristiano Ronaldo","Dias","Russo","Jonas","Enzo","Tailan","Matheus Medeiros","Nando","Guilherme"];
test("a nova geração tem exatamente 13 jogadores únicos", () => {
  assert.equal(names.length, 13);
  assert.equal(new Set(names).size, 13);
  for (const name of names) assert.ok(source.includes(JSON.stringify(name)), name);
});
test("as páginas principais não importam dados legados", () => {
  for (const path of ["index", "hall-da-fama", "temporadas", "recordes", "deep-analytics", "biografias", "jogadores.index", "jogadores.$id"]) {
    const content = readFileSync(new URL(`../src/routes/${path}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(content, /from ["']\.\.\/lib\/mock-data/);
    assert.doesNotMatch(content, /from ["']\.\.\/lib\/season-stats/);
  }
});

test("new-generation gallery actually uses the card framing variant", () => {
  const component = readFileSync(new URL("../src/components/sports/NewGeneration.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles/new-generation.css", import.meta.url), "utf8");
  assert.match(component, /<NewPortrait player=\{player\} variant="card"\s*\/>/);
  assert.match(component, /<NewPortrait player=\{feature\} priority variant="hero"\s*\/>/);
  assert.match(component, /<NewPortrait player=\{player\} priority variant="profile"\s*\/>/);
  assert.match(styles, /\.generation-portrait--card img\s*\{[^}]*object-fit:\s*contain/);
  assert.match(styles, /\.generation-portrait--hero img:not\(\.generation-portrait-backdrop\)\s*\{[^}]*object-fit:\s*contain/);
  assert.match(styles, /\.generation-portrait--profile img\s*\{[^}]*object-fit:\s*contain/);
});

test("hero switches through the real new-generation roster with accessible controls", () => {
  const component = readFileSync(new URL("../src/components/sports/NewGeneration.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles/new-generation.css", import.meta.url), "utf8");
  assert.match(component, /const feature = newRoster\[activeIndex\]/);
  assert.match(component, /setInterval\(\(\) => \{/);
  assert.match(component, /window.clearInterval\(timer\)/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /onMouseEnter=\{\(\) => setIsHovering\(true\)\}/);
  assert.match(component, /aria-label="Jogador anterior"/);
  assert.match(component, /aria-label="Próximo jogador"/);
  assert.match(component, /Pausar troca automática/);
  assert.match(component, /key=\{feature.id\}/);
  assert.match(styles, /\.generation-hero-controls/);
});
