import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge" });
const base = process.env.BASE_URL || "http://127.0.0.1:8082";
const out = "artifacts/hero-refinement";
await mkdir(out, { recursive: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const results = [];
try {
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ]) {
    await page.setViewportSize({ width, height });
    let photoRequests = 0;
    const count = (request) => {
      if (request.url().includes("Elenco_Unido")) photoRequests++;
    };
    page.on("request", count);
    await page.goto(base, { waitUntil: "networkidle" });
    const hero = page.locator(".generation-opening");
    const photo = hero.locator("img");
    await photo.evaluate((img) => img.decode());
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("main h1").count(), 1);
    assert.match(await hero.locator("h1").innerText(), /NOVA\s+GERAÇÃO/);
    assert.equal(await hero.locator("a").count(), 1);
    assert.equal(await hero.locator("a").getAttribute("href"), "/jogadores");
    assert.equal(await page.locator(".generation-hero-carousel").count(), 0);
    const image = await photo.evaluate((img) => {
      const box = img.getBoundingClientRect();
      return {
        loaded: img.complete,
        w: img.naturalWidth,
        h: img.naturalHeight,
        x: box.x,
        right: box.right,
        y: box.y,
        bottom: box.bottom,
        ratio: box.width / box.height,
        fit: getComputedStyle(img).objectFit,
      };
    });
    assert.equal(image.loaded, true);
    assert.equal(image.w, 1672);
    assert.equal(image.h, 941);
    assert.ok(Math.abs(image.ratio - 1672 / 941) < 0.001);
    assert.equal(image.fit, "contain");
    assert.ok(image.x >= 0 && image.right <= width + 1);
    const action = await hero.locator("a").boundingBox();
    assert.ok(action.y >= image.bottom, "CTA must not cover athletes");
    const heroBox = await hero.boundingBox();
    assert.ok(
      action.y + action.height <= heroBox.y + heroBox.height,
      "CTA remains inside the composition",
    );
    const title = await hero.locator("h1").boundingBox();
    assert.ok(image.y >= title.y + title.height, "opaque photo must not cover the title");
    if (width >= 768) {
      assert.ok(title.width / (image.right - image.x) < 0.76, "title is subordinate to the photo");
      assert.ok(image.right - image.x >= width * 0.82, "roster occupies the useful width");
    }
    assert.equal(photoRequests, 1, "single collective photo request");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(
      await hero.locator("h1").evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await hero.screenshot({ path: out + "/after-" + width + ".png" });
    await hero.locator("a").focus();
    assert.equal(await hero.locator("a").evaluate((el) => el === document.activeElement), true);

    await hero.locator("a").press("Enter");
    await page.waitForURL("**/jogadores");
    const cards = page.locator(".generation-card");
    assert.equal(await cards.count(), 13);
    const links = await cards.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    assert.equal(new Set(links).size, 13);
    for (const img of await cards.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el) => el.decode());
    }
    results.push({ width, height, image, photoRequests, gallery: 13, cta: true });
    page.off("request", count);
  }
  const links = await page
    .locator(".generation-card")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  for (const link of links) {
    const response = await page.goto(base + link, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.locator(".generation-portrait--profile img").evaluate((img) => img.decode());
  }
  for (const route of [
    "/hall-da-fama",
    "/temporadas",
    "/recordes",
    "/deep-analytics",
    "/biografias",
  ]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  assert.equal(
    await page
      .locator(".generation-opening")
      .evaluate((el) => el.getAnimations({ subtree: true }).some((a) => a.playState === "running")),
    false,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/validation.json",
    JSON.stringify({ results, profiles: 13, errors }, null, 2),
  );
  console.log(
    "PASS: six viewports, full photo, one request, CTA keyboard navigation, reduced motion, finite animation, 13 gallery photos/profiles, secondary routes.",
  );
} finally {
  await browser.close();
}
