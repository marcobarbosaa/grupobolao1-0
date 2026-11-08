import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const out = "artifacts/redesign-review/rebrand";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const report = { routes: [], menu: [], assets: [], dataPreserved: false, errors };
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/hall-da-fama",
      "/temporadas",
      "/recordes",
      "/biografias",
      "/jogadores",
      "/jogadores/8",
      "/deep-analytics",
    ]) {
      const response = await page.goto(base + route, { waitUntil: "networkidle" });
      assert.ok(response.status() < 400);
      assert.match(await page.title(), /Central do Bolão/);
      const body = await page.locator("body").innerText();
      assert.doesNotMatch(body, /Central da Liga|sports gaming|NBA DOS CRIAS|NBA 2K26\s*\/\s*PC/i);
      assert.doesNotMatch(await page.locator("head").innerHTML(), /Central da Liga|Grupo Bolão/);
      assert.equal(await page.locator("main h1").count(), 1);
      assert.equal(await page.locator(".site-header").count(), 1);
      assert.equal(
        await page
          .locator(".site-header .brand-logo")
          .evaluate((i) => i.complete && i.naturalWidth > 0),
        true,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        route + " " + width,
      );
      const box = await page.locator("main").boundingBox();
      const first = await page.locator("main h1").boundingBox();
      const bottom = await page
        .locator(".site-header")
        .evaluate((e) => e.getBoundingClientRect().bottom);
      assert.ok(first.y >= bottom - 1, route + " title covered by header");
      assert.equal(
        await page
          .locator(
            ".hero-bottom-line,.header-edition,.footer-edition,.profile-photo-stamp,.mobile-menu-signoff",
          )
          .count(),
        0,
      );
      report.routes.push({ route, width, title: await page.title() });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Abrir menu de navegação" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await trigger.evaluate((e) => e === document.activeElement), true);
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Navegação mobile" })
    .getByRole("link", { name: "Hall da Fama" })
    .click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Navegação mobile" })
    .getByRole("link", { name: "Temporadas" })
    .click();
  await page.waitForURL("**/temporadas");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await trigger.click();
  await page.mouse.move(5, 200);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out + "/menu-390.png" });
  await page.getByRole("button", { name: "Fechar menu" }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await trigger.click();
  await page.setViewportSize({ width: 1200, height: 800 });
  assert.equal(await page.getByRole("dialog").count(), 0);
  report.menu.push(
    "Keyboard open, focus trap, Escape and focus return, same-route close, navigation close, close button, desktop resize",
  );
  for (const route of ["/rota-inexistente", "/jogadores/9999"]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 404);
    assert.match(await page.title(), /Central do Bolão/);
    assert.ok((await page.locator('a[href="/"],a[href="/jogadores"]').count()) > 0);
    await page.screenshot({
      path: out + (route.includes("9999") ? "/player-404.png" : "/404.png"),
    });
  }
  for (const path of ["/brand/central-do-bolao.svg", "/brand/cb-symbol.svg", "/favicon.svg"]) {
    const response = await page.request.get(base + path);
    assert.equal(response.status(), 200);
    assert.match(response.headers()["content-type"], /svg/);
    assert.match(await response.text(), /Central do Bolão/);
    report.assets.push(path);
  }
  const original = execFileSync("git", ["show", "HEAD:src/lib/mock-data.ts"], { encoding: "utf8" });
  const current = await readFile("src/lib/mock-data.ts", "utf8");
  assert.equal(
    current.replaceAll("Central do Bolão", "Central da Liga").replaceAll("\r\n", "\n"),
    original.replaceAll("\r\n", "\n"),
  );
  for (const file of [
    "src/lib/engine.ts",
    "src/lib/season-stats.ts",
    "src/lib/player-data.ts",
    "src/lib/player-adapter.ts",
    "src/lib/home-data.ts",
    "src/routeTree.gen.ts",
    "package.json",
    "package-lock.json",
  ])
    assert.equal(execFileSync("git", ["diff", "HEAD", "--", file], { encoding: "utf8" }), "");
  report.dataPreserved = true;
  assert.deepEqual(errors, []);
  await writeFile(out + "/validation.json", JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        success: true,
        routes: report.routes.length,
        assets: report.assets,
        menu: report.menu,
        dataPreserved: true,
      },
      null,
      2,
    ),
  );
} finally {
  await writeFile(out + "/last-run.json", JSON.stringify(report, null, 2));
  await browser.close();
}
