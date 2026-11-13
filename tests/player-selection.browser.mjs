// Start npm run dev -- --port 8080. PLAYWRIGHT_MODULE may be an absolute file URL.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const output = "artifacts/players-review";
await mkdir(output, { recursive: true });
const expected = {
  "fabio-carvalho": ["New Orleans Hornets", "44"],
  abel: ["Phoenix Suns", "0"],
  "gam-mori": ["Atlanta Hawks", "24"],
  "marco-barbosa": ["Denver Nuggets", "46"],
  "cristiano-ronaldo": ["Denver Nuggets", "22"],
  dias: ["Dallas Mavericks", "31"],
  russo: ["Toronto Raptors", "7"],
  jonas: ["New York Knicks", "13"],
  enzo: ["San Antonio Spurs", "43"],
  tailan: ["New York Knicks", "6"],
  "matheus-medeiros": ["Philadelphia 76ers", "35"],
  nando: ["Houston Rockets", "28"],
  guilherme: ["Chicago Bulls", "39"],
};
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/jogadores", { waitUntil: "networkidle" });
  const center = page.locator('[data-position="center"]');
  const panel = page.locator(".player-select__content");
  const opacity = () => panel.evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(await opacity(), "0");
  await center.locator("a").hover();
  await page.waitForTimeout(400);
  assert.equal(await opacity(), "1");
  await panel.locator("a").hover();
  await page.waitForTimeout(400);
  assert.equal(await opacity(), "1", "panel remains open across player-to-CTA movement");
  await page.screenshot({ path: `${output}/cinematic-hover.png` });
  await page.mouse.move(5, 80);
  await page.waitForTimeout(400);
  assert.equal(await opacity(), "0");
  await center.locator("a").focus();
  await page.waitForTimeout(400);
  assert.equal(await opacity(), "1");
  await panel.locator("a").focus();
  assert.equal(await opacity(), "1");
  await page.getByRole("button", { name: "Jogador anterior", exact: true }).focus();
  const seen = new Set();
  for (let i = 0; i < 13; i++) {
    const id = await center.getAttribute("data-player");
    seen.add(id);
    assert.equal(
      await page.locator(".site-shell").getAttribute("data-landing-team"),
      expected[id][0],
    );
    assert.equal(
      (await panel.locator(".player-select__details").textContent()).trim(),
      "#" + expected[id][1],
    );
    assert.equal(await center.locator("a").getAttribute("href"), `/jogadores/${id}`);
    assert.equal(await panel.locator("a").getAttribute("href"), `/jogadores/${id}`);
    await center.locator("img").evaluate((img) => img.decode());
    await page
      .locator('.player-select__crests [data-active="true"]')
      .evaluate((img) => img.decode());
    if (id === "matheus-medeiros")
      assert.match(await center.locator("img").getAttribute("src"), /\/medeiros.png$/);
    if (["abel", "guilherme", "gam-mori"].includes(id)) {
      await page.screenshot({ path: `${output}/palette-${id}.png` });
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(600);
  }
  assert.equal(seen.size, 13);
  assert.equal(await center.getAttribute("data-player"), "nando");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await center.getAttribute("data-player"), "matheus-medeiros");
  await page.locator('[data-position="right"] a').click();
  assert.equal(await center.getAttribute("data-player"), "nando");
  await center.locator("a").click();
  await page.waitForURL("**/jogadores/nando");
  for (const [width, height] of [
    [360, 640],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base + "/jogadores", { waitUntil: "networkidle" });
    const dimensions = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    assert.ok(dimensions.w <= width, `horizontal overflow at ${width}`);
    if (height > 480) assert.ok(dimensions.h <= height, `vertical overflow at ${width}`);
    await page.screenshot({ path: `${output}/selection-${width}.png`, fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await center.evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
  await page.goto(base + "/", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".player-select").count(), 0);
  assert.equal(await page.locator(".arena-home").count(), 1);
  assert.equal(
    await page.locator(".site-shell").getAttribute("data-landing-team"),
    "Houston Rockets",
  );

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await touch.newPage();
  await mobile.goto(base + "/jogadores", { waitUntil: "networkidle" });
  assert.equal(
    await mobile.locator(".player-select__content").evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
  const cdp = await touch.newCDPSession(mobile);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 280, y: 400 }],
  });
  // A real drag has multiple frames; a zero-duration jump can start native fling suppression.
  for (let x = 260; x >= 100; x -= 20) {
    await mobile.waitForTimeout(30);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: 400 }],
    });
  }
  await mobile.waitForTimeout(100);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await mobile.waitForTimeout(600);
  assert.equal(
    await mobile.locator('[data-position="center"]').getAttribute("data-player"),
    "guilherme",
  );
  assert.match(mobile.url(), /\/jogadores$/);
  await mobile.locator(".player-select__profile").tap();
  await mobile.waitForURL("**/jogadores/guilherme");
  await touch.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 13 identities/images/crests/profile links; wraparound, hover, focus, arrows, side click, touch swipe/CTA, 7 viewports, reduced motion and home smoke check.",
  );
} finally {
  await browser.close();
}
