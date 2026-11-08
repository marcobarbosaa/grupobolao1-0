// Start npm run dev. PLAYWRIGHT_MODULE can point to an existing playwright installation.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = "artifacts/chamber-review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
const result = { viewports: [], checks: [], errors };
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
async function visit(target = page) {
  const response = await target.goto(`${baseURL}/jogadores`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await target.locator(".holo-angle-controls").waitFor();
  await target.waitForFunction(
    () => !document.querySelector(".holo-render-label")?.textContent.includes("Preparando"),
  );
  await target.evaluate(() => document.fonts.ready);
  await target.waitForTimeout(1400);
}
async function flatCase(name, options, setup, expectation) {
  const fallbackContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ...options,
  });
  const target = await fallbackContext.newPage();
  const failures = [];
  target.on("pageerror", (error) => failures.push(error.message));
  if (setup) await setup(target);
  await visit(target);
  assert.equal(await target.locator(".holo-visual").getAttribute("data-render-mode"), "2d", name);
  await target.locator(".holo-angle-controls summary").click();
  if (expectation) await expectation(target);
  await target.locator(".holo-discover-button").click();
  assert.equal(await target.locator(".holo-career-cta").getAttribute("href"), "/jogadores/8");
  assert.deepEqual(failures, []);
  await target.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  await fallbackContext.close();
  result.checks.push(name);
}
try {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({
      width,
      height: width < 768 ? 844 : width === 768 ? 1024 : width === 1920 ? 1080 : 900,
    });
    await visit();
    assert.equal(await page.locator(".holo-visual").getAttribute("data-render-mode"), "3d");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${width}px overflow`,
    );
    assert.equal(await page.locator(".holo-angle-buttons button:disabled").count(), 0);
    await page.screenshot({ path: `${output}/selection-${width}.png`, fullPage: true });
    const metrics = await page.evaluate(() => {
      const room = document.querySelector(".holo-visual").getBoundingClientRect();
      const athlete = document.querySelector(".holo-player-target").getBoundingClientRect();
      return {
        ratio: athlete.height / room.height,
        top: athlete.top - room.top,
        bottom: room.bottom - athlete.bottom,
        scroll: document.documentElement.scrollHeight > innerHeight,
      };
    });
    assert.ok(metrics.ratio >= 0.65 && metrics.ratio <= 0.8, JSON.stringify({ width, ...metrics }));
    assert.ok(metrics.top >= 0 && metrics.bottom >= 0);
    if (width >= 768) assert.equal(metrics.scroll, false);
    assert.equal(await page.locator("#athlete-information").getAttribute("aria-hidden"), "true");
    result.viewports.push({ width, ...metrics });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(".holo-angle-controls summary").click();
  for (const label of ["Esquerda", "Costas", "Direita", "Frente"]) {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.click();
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${output}/angle-${label}.png` });
  }
  await page.locator(".holo-angle-controls summary").click();
  await page.mouse.move(30, 300);
  await page.waitForTimeout(450);
  assert.equal(
    await page.locator(".holo-chamber.is-engaged").count(),
    0,
    "empty room does not hover",
  );
  await page.locator(".holo-player-target").hover();
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".holo-chamber.is-engaged").count(), 1);
  await page.screenshot({ path: `${output}/hover.png` });
  assert.equal(await page.getByRole("button", { name: "Atleta anterior" }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Próximo atleta" }).isDisabled(), true);
  assert.equal(
    await page.getByRole("button", { name: "Selecionar Nando" }).getAttribute("aria-pressed"),
    "true",
  );
  await page.locator(".holo-player-target").focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/jogadores/8");
  assert.match(await page.locator("#profile-name").textContent(), /^Nando\.?$/);
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator(".holo-discover-button").click();
  await page.locator(".holo-career-cta").click();
  await page.waitForURL("**/jogadores/8");
  result.checks.push(
    "four views; hover; selection; disabled carousel; keyboard figure link; career CTA; back navigation",
  );
  await visit();
  await page.getByRole("button", { name: "Modo leve" }).click();
  assert.equal(await page.locator(".holo-canvas canvas").count(), 0);
  assert.equal(await page.locator(".holo-visual").getAttribute("data-render-mode"), "2d");
  await page.locator(".holo-angle-controls summary").click();
  await page.getByRole("button", { name: "Costas", exact: true }).click();
  assert.match(await page.locator(".holo-flat img").getAttribute("src"), /back-full/);
  await page.screenshot({ path: `${output}/manual-2d.png` });
  await page.getByRole("button", { name: "Modo leve" }).click();
  await page.waitForSelector('[data-render-mode="3d"]');
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForSelector('[data-render-mode="2d"]');
  assert.equal(await page.locator(".holo-canvas canvas").count(), 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForSelector('[data-render-mode="3d"]');
  await page.evaluate(() => {
    const canvas = document.querySelector(".holo-canvas canvas");
    canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext();
  });
  await page.waitForSelector('[data-render-mode="2d"]');
  assert.match(await page.locator(".holo-render-label").textContent(), /indisponível/);
  result.checks.push("manual 2D and angle switching; live reduced motion; WebGL context loss");
  await flatCase("reduced-motion", { reducedMotion: "reduce" }, null, async (target) => {
    assert.equal(await target.locator("canvas").count(), 0);
    assert.equal(
      await target.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => entry.name.includes("createHolographicScene")),
      ),
      false,
    );
  });
  await flatCase("no-webgl", {}, (target) =>
    target.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return /webgl/.test(kind) ? null : original.call(this, kind, ...args);
      };
    }),
  );
  await flatCase("limited-device", {}, (target) =>
    target.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 });
    }),
  );
  await flatCase(
    "missing-front",
    { reducedMotion: "reduce" },
    (target) =>
      target.route("**/references/nando/front-full.png", (route) =>
        route.fulfill({ status: 404, body: "" }),
      ),
    async (target) => {
      assert.equal(
        await target.getByRole("button", { name: "Frente", exact: true }).isDisabled(),
        true,
      );
      assert.match(await target.locator(".holo-flat img").getAttribute("src"), /left-full/);
      assert.match(await target.locator(".holo-asset-notice").textContent(), /Frente/);
    },
  );
  await flatCase(
    "portrait-fallback",
    {},
    (target) =>
      target.route("**/references/nando/**", (route) => route.fulfill({ status: 404, body: "" })),
    async (target) => {
      assert.match(await target.locator(".holo-flat img").getAttribute("src"), /Nando-960.webp/);
      assert.equal(await target.locator(".holo-angle-buttons button:disabled").count(), 4);
    },
  );
  await flatCase(
    "all-images-missing",
    {},
    async (target) => {
      await target.route("**/references/nando/**", (route) =>
        route.fulfill({ status: 404, body: "" }),
      );
      await target.route("**/jogadores/**Nando*", (route) =>
        route.fulfill({ status: 404, body: "" }),
      );
    },
    async (target) => {
      assert.match(
        await target.locator(".holo-asset-notice").textContent(),
        /Imagens indisponíveis/,
      );
    },
  );
  const legacy = await page.request.get(`${baseURL}/biografias?q=Nando`, { maxRedirects: 0 });
  assert.equal(legacy.status(), 301);
  assert.match(legacy.headers().location, /jogadores\?q=Nando/);
  assert.deepEqual(errors, []);
  result.checks.push(
    "legacy 301 with search preserved; no unexpected JavaScript or hydration errors",
  );
  await writeFile(`${output}/results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
