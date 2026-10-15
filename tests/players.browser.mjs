// Start npm run dev first. Optional PLAYWRIGHT_MODULE accepts an absolute file URL.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = "artifacts/players-review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
const result = { viewports: [], profiles: [], checks: [], homeComparison: [] };
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

async function visit(route) {
  const response = await page.goto(baseURL + route, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200, route);
  await page.evaluate(() => document.fonts.ready);
  return response;
}
async function noOverflow(label) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    label,
  );
}
async function fullCapture(file) {
  for (const img of await page.locator("main img").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((image) => image.decode());
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `${output}/${file}`, fullPage: true, animations: "disabled" });
}

try {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const [name, route] of [
      ["gallery", "/jogadores"],
      ["profile", "/jogadores/8"],
    ]) {
      await visit(route);
      await noOverflow(`${route} at ${width}`);
      await page.screenshot({
        path: `${output}/${name}-hero-${width}.png`,
        animations: "disabled",
      });
      if (width === 390 || width === 1440) await fullCapture(`${name}-${width}.png`);
      result.viewports.push({ route, width, horizontalOverflow: false });
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("/jogadores");
  assert.equal(await page.locator(".roster-player").count(), 13);
  const profileURLs = await page
    .locator(".roster-player-link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  assert.equal(new Set(profileURLs).size, 13);
  const search = page.getByRole("searchbox", { name: "Buscar jogador por nome" });
  await search.fill("nÁnDo");
  await page.waitForFunction(() => document.querySelectorAll(".roster-player").length === 1);
  assert.match(await page.locator(".roster-player-caption h2").textContent(), /Nando/);
  await page.getByRole("combobox", { name: "Equipe", exact: true }).selectOption("Orlando Magic");
  await page.locator(".roster-empty").waitFor();
  await page.getByRole("button", { name: "Ver todos os jogadores" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".roster-player").length === 13);
  await page.getByRole("combobox", { name: "Posição", exact: true }).selectOption("PG");
  assert.equal(await page.locator(".roster-player").count(), 4);
  await page.getByRole("combobox", { name: "Ordenação", exact: true }).selectOption("az");
  assert.equal(await page.locator(".roster-player-caption h2").first().textContent(), "Abel");
  await page.getByRole("combobox", { name: "Ordenação", exact: true }).selectOption("za");
  assert.equal(await page.locator(".roster-player-caption h2").first().textContent(), "Tailan");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("button", { name: "Destacar Gam", exact: true }).click();
  assert.equal(await page.locator(".gallery-feature-caption h2").textContent(), "Gam");
  assert.equal(
    await page
      .getByRole("button", { name: "Destacar Gam", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  result.checks.push(
    "13 profiles; accent-insensitive search; combined filters; empty/reset; position; A–Z/Z–A; player highlighting",
  );

  await page.evaluate(() => {
    window.playerTransitionCount = 0;
    if (document.startViewTransition) {
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (...args) => {
        window.playerTransitionCount++;
        return original(...args);
      };
    }
  });
  await search.fill("Gam");
  const profileLink = page.getByRole("link", { name: "Conhecer Gam", exact: true });
  await profileLink.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/jogadores/4");
  await page.locator("#profile-name").waitFor();
  assert.match(await page.locator("#profile-name").textContent(), /Gam/);
  assert.equal(await page.evaluate(() => window.playerTransitionCount), 1);
  await page.goBack({ waitUntil: "networkidle" });
  assert.equal(await page.getByRole("searchbox").inputValue(), "Gam");
  assert.equal(await page.locator(".roster-player").count(), 1);
  result.checks.push("Keyboard gallery-to-profile native transition; browser back retains search");

  await visit("/biografias?q=Medeiros");
  assert.match(page.url(), /\/jogadores\/?\?q=Medeiros/);
  assert.equal(await page.locator(".roster-player").count(), 1);
  const redirect = await context.request.get(baseURL + "/biografias", { maxRedirects: 0 });
  assert.equal(redirect.status(), 301);
  result.checks.push(
    "Legacy gallery HTTP 301 redirects to canonical gallery and preserves filters",
  );

  await visit("/jogadores/8");
  assert.equal(await page.locator(".career-main-stat strong").textContent(), "14,5");
  const seasonButtons = page
    .getByRole("group", { name: "Temporadas da carreira" })
    .getByRole("button");
  await seasonButtons.first().focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await seasonButtons.nth(1).getAttribute("aria-pressed"), "true");
  assert.equal(
    await page
      .getByRole("combobox", { name: "Temporada das estatísticas", exact: true })
      .inputValue(),
    "2",
  );
  await page
    .getByRole("link", { name: "MVP das Finais, temporada 2007-08: explorar", exact: true })
    .click();
  assert.equal(await page.locator(".career-context > h3").textContent(), "2007-08");
  assert.equal(await page.locator(".career-main-stat strong").textContent(), "19,9");
  await page
    .getByRole("group", { name: "Métrica de evolução" })
    .getByRole("button", { name: "Rebotes" })
    .click();
  assert.equal(await page.locator(".career-main-stat strong").textContent(), "10,6");
  await page
    .getByRole("combobox", { name: "Fase da trajetória", exact: true })
    .selectOption("firstRound");
  assert.equal(
    await page.locator(".career-context .stat-notice h3").textContent(),
    "Dados ainda não importados",
  );
  await page
    .getByRole("combobox", { name: "Fase da trajetória", exact: true })
    .selectOption("regular");
  result.checks.push(
    "Career keyboard navigation, award-year links, imported values, metric switching and missing-round state",
  );

  await page
    .getByRole("combobox", { name: "Fase das estatísticas", exact: true })
    .selectOption("conferenceFinals");
  assert.equal(
    await page.locator(".statistics-summary .stat-notice h3").textContent(),
    "Dados ainda não importados",
  );
  assert.equal(await page.locator(".broadcast-stats dd").count(), 0);
  await page
    .getByRole("combobox", { name: "Fase das estatísticas", exact: true })
    .selectOption("regular");
  await page.locator(".statistics-detail summary").click();
  assert.equal(await page.locator(".statistics-table-scroll tbody tr").count(), 22);
  await page.getByLabel("Todas as temporadas", { exact: true }).uncheck();
  assert.equal(await page.locator(".statistics-table-scroll tbody tr").count(), 1);
  await page.getByLabel("Todas as temporadas", { exact: true }).check();
  await page.getByRole("button", { name: "Totais", exact: true }).click();
  assert.match(
    await page.locator(".statistics-group-empty h3").textContent(),
    /Totais ainda não disponíveis/,
  );
  await page.getByRole("button", { name: "Aproveitamentos", exact: true }).click();
  assert.match(
    await page.locator(".statistics-group-empty h3").textContent(),
    /Aproveitamentos ainda não disponíveis/,
  );
  await page.getByRole("button", { name: "Médias", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Fase das estatísticas", exact: true })
    .selectOption("finals");
  assert.ok((await page.locator(".table-missing").count()) > 0);
  assert.ok(
    (await page.locator(".table-missing").allTextContents()).every(
      (value) => value === "Dados ainda não importados",
    ),
  );
  result.checks.push(
    "Stats: six phases, missing data without zeros, season filtering, table and unavailable totals/percentages",
  );

  for (const route of profileURLs) {
    await visit(route);
    assert.equal(await page.locator(".profile-chapters a").count(), 5);
    assert.equal(await page.locator(".player-profile > section[id]").count(), 5);
    assert.equal(
      await page.locator(".desktop-navigation [aria-current='page']").textContent(),
      "Jogadores",
    );
    assert.equal(
      await page
        .locator(".profile-hero-image img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await noOverflow(route);
    result.profiles.push({ route, title: await page.title() });
  }
  await visit("/jogadores/3");
  assert.equal(await page.locator(".achievement-empty").count(), 1);
  assert.equal(await page.locator(".achievement").count(), 0);
  const missing = await page.goto(baseURL + "/jogadores/9999", { waitUntil: "networkidle" });
  assert.equal(missing.status(), 404);
  assert.match(await page.locator("h1").textContent(), /JOGADOR NÃO ENCONTRADO/);
  // The expected 404 is a browser resource message, not a runtime/hydration error.
  const expected404 = errors.findIndex((message) => message.includes("404"));
  if (expected404 !== -1) errors.splice(expected404, 1);
  result.checks.push(
    "All 13 profiles, five chapters, portraits; no fabricated awards for Tailan; real 404 for unknown ID",
  );

  await page.setViewportSize({ width: 360, height: 844 });
  await visit("/jogadores/10");
  await noOverflow("Long player name at 360px");
  await page.locator(".statistics-detail summary").click();
  assert.equal(
    await page
      .locator(".statistics-table-scroll")
      .evaluate((element) => element.scrollWidth > element.clientWidth),
    true,
  );
  await noOverflow("Scrollable statistics do not widen the document");
  await page.screenshot({ path: `${output}/mobile-statistics.png`, animations: "disabled" });
  await visit("/jogadores");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("combobox", { name: "Equipe", exact: true }).selectOption("Orlando Magic");
  assert.equal(await page.locator(".roster-player").count(), 1);
  await page.screenshot({ path: `${output}/mobile-filters.png`, animations: "disabled" });
  result.checks.push(
    "Mobile filter disclosure, long names and contained horizontal statistics scrolling",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "Conhecer Medeiros", exact: true }).click();
  await page.waitForURL("**/jogadores/7");
  assert.equal(
    await page
      .locator(".profile-hero-image")
      .evaluate((element) => getComputedStyle(element).viewTransitionName),
    "none",
  );
  const reducedDuration = await page
    .locator(".career-context")
    .evaluate((element) => getComputedStyle(element).animationDuration);
  assert.ok(parseFloat(reducedDuration) < 0.001);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await visit("/jogadores?q=Nando");
  await page.evaluate(() =>
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("link", { name: "Conhecer Nando", exact: true }).click();
  await page.waitForURL("**/jogadores/8");
  result.checks.push("Reduced motion and navigation without View Transitions API");

  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touch = await touchContext.newPage();
  await touch.goto(baseURL + "/jogadores?q=Gam", { waitUntil: "networkidle" });
  await touch.getByRole("link", { name: "Conhecer Gam", exact: true }).tap();
  await touch.waitForURL("**/jogadores/4");
  assert.match(await touch.locator("#profile-name").textContent(), /Gam/);
  await touchContext.close();
  result.checks.push("Touch gallery-to-profile navigation");

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await visit("/");
    const after = await page.screenshot({
      path: `${output}/home-after-${width}.png`,
      animations: "disabled",
    });
    try {
      const before = await readFile(`${output}/home-before-${width}.png`);
      const equal = before.equals(after);
      result.homeComparison.push({ width, identicalPNG: equal });
      assert.equal(equal, true, `Home visual regression at ${width}px`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  assert.deepEqual(errors, [], "Unexpected browser or hydration errors");
  await writeFile(`${output}/results.json`, JSON.stringify({ ...result, errors }, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
