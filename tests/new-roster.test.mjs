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
