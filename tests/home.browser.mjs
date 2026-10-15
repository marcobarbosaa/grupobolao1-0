// Run against `npm run dev`. Playwright may be supplied from a temporary install
// with PLAYWRIGHT_MODULE=file:///absolute/path/to/playwright/index.mjs.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
const consoleErrors = [];
const result = { viewports: [], routes: [], interactions: [] };
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
const output = "artifacts/home-review";
await mkdir(output, { recursive: true });

try {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    const response = await page.goto(baseURL, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".home-page > section").count(), 5);
    assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Overflow at ${width}px`,
    );
    assert.equal(await page.locator(".hero-player h2").textContent(), "Nando");
    await page.screenshot({ path: `${output}/hero-${width}.png`, animations: "disabled" });
    // Load below-fold portraits before capturing the whole composition.
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await page.locator(".immortal-portrait img").first().waitFor();
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images]
          .filter((img) => img.loading !== "lazy" || img.complete)
          .map((img) => img.decode().catch(() => {})),
      );
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: `${output}/home-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    result.viewports.push({ width, horizontalOverflow: false });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  for (const [name, id] of [
    ["Gam", "4"],
    ["Medeiros", "7"],
    ["Nando", "8"],
  ]) {
    const button = page
      .getByRole("group", { name: "Escolher protagonista" })
      .getByRole("button", { name: new RegExp(name) });
    await button.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (name) => document.querySelector(".hero-player h2")?.textContent === name,
      name,
    );
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator(".hero-player a").getAttribute("href"), `/jogadores/${id}`);
    assert.equal(
      await page
        .locator(".portrait-center img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
  }
  result.interactions.push(
    "Hero: three players, keyboard selection, matching portraits and profile URLs",
  );
  await page.getByRole("button", { name: "Próxima temporada", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".season-result h3")?.textContent === "Washington Wizards",
  );
  await page.getByRole("button", { name: "2024-25", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".season-result h3")?.textContent === "LA Clippers",
  );
  assert.equal(
    await page.getByRole("button", { name: "Próxima temporada", exact: true }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "2003-04", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "Temporada anterior", exact: true }).isDisabled(),
    true,
  );
  result.interactions.push(
    "Timeline: next, direct selection, historical content, first/last bounds",
  );

  const gallery = page.locator(".legends-gallery");
  await page.getByRole("button", { name: "Ver próximos jogadores" }).click();
  await page.waitForFunction(() => document.querySelector(".legends-gallery").scrollLeft > 0);
  const profileURLs = await gallery
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  assert.equal(new Set(profileURLs).size, 13);
  result.interactions.push("Gallery: horizontal navigation and 13 unique profile links");

  for (const route of [
    "/hall-da-fama",
    "/biografias",
    "/temporadas",
    "/recordes",
    "/deep-analytics",
    ...profileURLs,
  ]) {
    const response = await page.goto(baseURL + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator(".site-header").count(), 1);
    // Editorial complementary content is allowed; the legacy sidebar is not.
    assert.equal(await page.locator("aside nav").count(), 0);
    assert.equal(await page.getByText("Algo deu errado", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Jogador não encontrado", { exact: true }).count(), 0);
    const active = page.locator('.desktop-navigation [aria-current="page"]');
    assert.equal(await active.count(), 1, `Active navigation: ${route}`);
    result.routes.push({ route, status: response.status() });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Abrir menu de navegação" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
  await dialog.getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.querySelector('[role="dialog"]').contains(document.activeElement),
    ),
    true,
  );
  await page.screenshot({ path: `${output}/mobile-menu.png`, animations: "disabled" });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate((button) => document.activeElement === button), true);
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
  await trigger.click();
  await dialog.getByRole("link", { name: /Recordes/ }).click();
  await page.waitForURL("**/recordes");
  await dialog.waitFor({ state: "hidden" });
  result.interactions.push(
    "Mobile menu: focus trap, Escape, focus restoration, scroll lock, navigation closes menu",
  );

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("group", { name: "Escolher protagonista" })
    .getByRole("button", { name: /Gam/ })
    .click();
  assert.equal(await page.locator(".hero-player h2").textContent(), "Gam");
  const duration = await page
    .locator(".hero-portrait")
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  assert.ok(duration.split(",").every((value) => parseFloat(value) <= 0.001));
  result.interactions.push("Reduced motion: hero works with effectively disabled transitions");

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const touchPage = await touch.newPage();
  await touchPage.goto(baseURL, { waitUntil: "networkidle" });
  await touchPage
    .getByRole("group", { name: "Escolher protagonista" })
    .getByRole("button", { name: /Medeiros/ })
    .tap();
  assert.equal(await touchPage.locator(".hero-player h2").textContent(), "Medeiros");
  await touch.close();
  result.interactions.push("Mobile touch: protagonist selection");

  assert.deepEqual(errors, [], "Browser runtime errors");
  assert.deepEqual(consoleErrors, [], "Browser console errors, including hydration");
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ ...result, errors, consoleErrors }, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
