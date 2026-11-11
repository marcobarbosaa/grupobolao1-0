import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/new-roster.ts", import.meta.url), "utf8");
const names = [
  "Fábio Carvalho",
  "Abel",
  "Gam Mori",
  "Marco Barbosa",
  "Cristiano Ronaldo",
  "Dias",
  "Russo",
  "Jonas",
  "Enzo",
  "Tailan",
  "Matheus Medeiros",
  "Nando",
  "Guilherme",
];
test("a nova geração tem exatamente 13 jogadores únicos", () => {
  assert.equal(names.length, 13);
  assert.equal(new Set(names).size, 13);
  for (const name of names) assert.ok(source.includes(JSON.stringify(name)), name);
});
test("as páginas principais não importam dados legados", () => {
  for (const path of [
    "index",
    "hall-da-fama",
    "temporadas",
    "recordes",
    "deep-analytics",
    "biografias",
    "jogadores.index",
    "jogadores.$id",
  ]) {
    const content = readFileSync(new URL(`../src/routes/${path}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(content, /from ["']\.\.\/lib\/mock-data/);
    assert.doesNotMatch(content, /from ["']\.\.\/lib\/season-stats/);
  }
});

test("new-generation gallery actually uses the card framing variant", () => {
  const component = readFileSync(
    new URL("../src/components/sports/NewGeneration.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(new URL("../src/styles/new-generation.css", import.meta.url), "utf8");
  assert.match(component, /<NewPortrait player=\{player\} variant="card"\s*\/>/);
  assert.match(component, /<NewPortrait player=\{player\} priority variant="profile"\s*\/>/);
  assert.match(styles, /\.generation-portrait--card img\s*\{[^}]*object-fit:\s*contain/);
  assert.match(styles, /\.generation-portrait--profile img\s*\{[^}]*object-fit:\s*contain/);
});

test("home uses the cinematic viewport rather than stacked portal sections", () => {
  const component = readFileSync(
    new URL("../src/components/sports/NewGeneration.tsx", import.meta.url),
    "utf8",
  );
  const home = readFileSync(
    new URL("../src/components/home/CinematicHome.tsx", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../src/components/home/CinematicHome.css", import.meta.url),
    "utf8",
  );
  assert.match(component, /<CinematicHome \/>/);
  assert.doesNotMatch(component, /<GenerationHero|<SeasonSpotlight|<ExploreUniverse|<VersusShowcase|<LeagueJourney/);
  assert.match(home, /newRoster/);
  assert.match(home, /prefers-reduced-motion/);
  assert.match(home, /setSeasonId/);
  assert.match(home, /setGroupIndex/);
  assert.match(home, /onMouseEnter/);
  assert.match(home, /aria-pressed/);
  assert.match(css, /height:\s*calc\(100dvh - var\(--header-height\)\)/);
  assert.match(css, /\.site-shell:has\(\.arena-home\) \.site-footer \{ display: none; \}/);
});

test("all thirteen landing portraits are packaged and the old side copy is removed", () => {
  const landing = readFileSync(new URL("../src/components/home/CinematicHome.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/home/CinematicHome.css", import.meta.url), "utf8");
  const ids = [
    "fabio-carvalho", "abel", "gam-mori", "marco-barbosa", "cristiano-ronaldo",
    "dias", "russo", "jonas", "enzo", "tailan", "matheus-medeiros", "nando", "guilherme",
  ];
  for (const id of ids) {
    assert.ok(existsSync(new URL(`../public/jogadores/landing/${id}.png`, import.meta.url)), id);
  }
  assert.match(landing, /\/jogadores\/landing\/\$\{player\.id\}\.png/);
  assert.doesNotMatch(landing, /arena-home__side-copy|BASQUETE<\/span>|ESTATÍSTICAS<\/span>|LEGADO<\/span>/);
  assert.doesNotMatch(css, /arena-home__side-copy/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /\.site-shell:has\(\.arena-home\) \.site-header/);
});
