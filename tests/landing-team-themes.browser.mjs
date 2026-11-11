import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { newRoster } from "../src/lib/new-roster.ts";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const out = "artifacts/home-review/team-themes";
await mkdir(out, { recursive: true });
const results = [];
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  // Instrument existing timers, without adding a production carousel control.
  await page.addInitScript(() => {
    const original = window.setInterval.bind(window),
      clear = window.clearInterval.bind(window);
    window.__carouselTimers = new Map();
    window.setInterval = (callback, delay, ...args) => {
      const id = original(callback, delay === 6000 ? 600000 : delay, ...args);
      if (delay === 6000) window.__carouselTimers.set(id, () => callback(...args));
      return id;
    };
    window.clearInterval = (id) => {
      window.__carouselTimers.delete(id);
      clear(id);
    };
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__carouselTimers.size === 1);
  const settle = async () => {
    await page.waitForTimeout(30);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  };
  const advance = async () => {
    await page.evaluate(() => [...window.__carouselTimers.values()][0]());
    await page.waitForTimeout(30);
  };
  const owner = page.locator("[data-landing-team]");
  const seen = new Set();
  const timerId = await page.evaluate(() => [...window.__carouselTimers.keys()][0]);
  for (let i = 0; i < 13; i++) {
    await settle();
    const team = await owner.getAttribute("data-landing-team");
    seen.add(team);
    assert.equal(await page.evaluate(() => [...window.__carouselTimers.keys()][0]), timerId);
    assert.equal(await page.locator('.arena-home__slide[data-active="true"]').count(), 1);
    assert.equal(
      await page
        .locator('.arena-home__slide[data-active="true"] .arena-home__player-team')
        .innerText(),
      team,
    );
    assert.equal(await page.evaluate(() => window.__carouselTimers.size), 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const colors = await page.evaluate(() => {
      const o = document.querySelector("[data-landing-team]");
      return ["--team-primary", "--team-background", "--team-focus"].map((p) =>
        getComputedStyle(o).getPropertyValue(p),
      );
    });
    if (
      [
        "Houston Rockets",
        "Denver Nuggets",
        "Sacramento Kings",
        "San Antonio Spurs",
        "Minnesota Timberwolves",
      ].includes(team)
    )
      await page.screenshot({
        path: out + "/" + team.replaceAll(" ", "-") + ".png",
        fullPage: true,
      });
    results.push({ team, colors });
    await advance();
  }
  assert.deepEqual(seen, new Set(newRoster.map((p) => p.team)));
  // Capture an actual interpolated frame (Bulls -> historic Hornets).
  await settle();
  await advance();
  await settle();
  const before = await owner.evaluate((e) =>
    getComputedStyle(e).getPropertyValue("--team-primary"),
  );
  await advance();
  await page.waitForTimeout(350);
  const middle = await owner.evaluate((e) =>
    getComputedStyle(e).getPropertyValue("--team-primary"),
  );
  assert.notEqual(middle, before);
  await page.waitForTimeout(1000);
  const after = await owner.evaluate((e) => getComputedStyle(e).getPropertyValue("--team-primary"));
  assert.notEqual(middle, after);
  const cards = page.locator(".arena-home__card");
  assert.equal(await cards.count(), 4);
  for (const card of await cards.all()) {
    await card.hover();
    await card.focus();
    assert.equal(
      await card.evaluate((e) => getComputedStyle(e).getPropertyValue("--team-primary")),
      after,
    );
    assert.equal(
      await card.evaluate((e) => getComputedStyle(e).outlineColor),
      await owner.evaluate((e) => getComputedStyle(e).getPropertyValue("--team-focus")),
    );
  }
  await page.locator(".arena-home__archive-controls select").selectOption("season-001");
  assert.equal(await owner.getAttribute("data-landing-team"), "New Orleans Hornets");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-menu-trigger").click();
  await advance();
  await settle();
  assert.equal(
    await page.locator(".mobile-menu").evaluate((e) => !!e.closest("[data-landing-team]")),
    true,
  );
  assert.equal(
    await page
      .locator(".mobile-menu")
      .evaluate((e) => getComputedStyle(e).getPropertyValue("--team-primary")),
    await owner.evaluate((e) => getComputedStyle(e).getPropertyValue("--team-primary")),
  );
  await page.screenshot({ path: out + "/mobile-menu.png", fullPage: true });
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(".mobile-menu-trigger").evaluate((e) => e === document.activeElement),
    true,
  );
  await page.screenshot({ path: out + "/mobile-home.png", fullPage: true });
  await page.locator(".mobile-menu-trigger").click();
  const link = page.locator('.mobile-navigation a[href="/jogadores"]');
  await link.click();
  await page.waitForURL("**/jogadores");
  assert.equal(await owner.count(), 0);
  assert.equal(await page.evaluate(() => window.__carouselTimers.size), 0);
  const header = await page
    .locator(".site-header")
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".site-header").evaluate((e) => getComputedStyle(e).backgroundColor),
    header,
  );
  for (const route of [
    "/temporadas",
    "/hall-da-fama",
    "/recordes",
    "/deep-analytics",
    "/biografias",
    "/jogadores/nando",
  ]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.ok(response.ok(), route);
    assert.equal(await owner.count(), 0, route);
    assert.equal(
      await page.locator(".site-header").evaluate((e) => getComputedStyle(e).backgroundColor),
      header,
      route,
    );
  }
  const reduced = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 360, height: 800 },
  });
  await reduced.goto(base, { waitUntil: "networkidle" });
  assert.ok(
    await reduced
      .locator("[data-landing-team]")
      .evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration) <= 0.001),
  );
  await reduced.waitForTimeout(6200);
  assert.equal(
    await reduced.locator("[data-landing-team]").getAttribute("data-landing-team"),
    "Houston Rockets",
  );
  assert.equal(
    await reduced.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await reduced.screenshot({ path: out + "/mobile-reduced-motion.png", fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/results.json",
    JSON.stringify(
      {
        teams: results,
        interpolation: { before, middle, after },
        mobile: true,
        routeIsolation: true,
        reducedMotion: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 13 palettes, interpolation, single timer, mobile portal, focus, route cleanup and reduced motion.",
  );
} finally {
  await browser.close();
}
