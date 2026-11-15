const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});
await mkdir("artifacts/players-review", { recursive: true });
try {
  for (const [id, scenarios] of [
    [
      "marco-barbosa",
      [
        ["season-004", "Denver Nuggets"],
        ["season-007", "Miami Heat"],
      ],
    ],
    [
      "nando",
      [
        ["season-006", "Houston Rockets"],
        ["season-008", "Denver Nuggets"],
      ],
    ],
    [
      "tailan",
      [
        ["season-004", "Minnesota Timberwolves"],
        ["season-005", "New York Knicks"],
      ],
    ],
    [
      "cristiano-ronaldo",
      [
        ["season-004", "Indiana Pacers"],
        ["season-005", "Phoenix Suns"],
        ["season-006", "Denver Nuggets"],
      ],
    ],
  ]) {
    await page.goto((process.env.BASE_URL || "http://localhost:8080") + "/jogadores/" + id, {
      waitUntil: "networkidle",
    });
    await page.getByRole("button", { name: "Temporadas", exact: true }).click();
    let previous;
    for (const [season, team] of scenarios) {
      await page.locator("#cinematic-season").selectOption(season);
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".cinematic-player-identity strong").innerText(), team);
      const state = await page.evaluate(() => ({
        image: document
          .querySelector('.historical-portrait[data-active="true"]')
          .getAttribute("src"),
        crest: document.querySelector(".cinematic-player-identity img").getAttribute("src"),
        color: document
          .querySelector(".cinematic-player")
          .style.getPropertyValue("--profile-primary"),
      }));
      if (previous) {
        assert.notEqual(state.image, previous.image);
        assert.notEqual(state.crest, previous.crest);
        assert.notEqual(state.color, previous.color);
      }
      previous = state;
      assert.equal(
        await page
          .locator('.historical-portrait[data-active="true"]')
          .evaluate((el) => el.complete && el.naturalWidth > 0),
        true,
      );
      assert.equal(
        await page
          .locator(".cinematic-player-identity img")
          .evaluate((el) => el.complete && el.naturalWidth > 0),
        true,
      );
    }
  }
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ["/", "/jogadores", "/jogadores/marco-barbosa"]) {
      await page.goto((process.env.BASE_URL || "http://localhost:8080") + route, {
        waitUntil: "networkidle",
      });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route + " horizontal overflow",
      );
      if (width >= 1366 && route != "/jogadores/marco-barbosa")
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
          route + " vertical overflow",
        );
      await page.screenshot({
        path: `artifacts/players-review/history-${width}-${route.replaceAll("/", "_") || "home"}.png`,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto((process.env.BASE_URL || "http://localhost:8080") + "/jogadores", {
    waitUntil: "networkidle",
  });
  for (let i = 0; i < 13; i++) {
    const active = page.locator('[data-position="center"] img');
    await active.scrollIntoViewIfNeeded();
    assert.ok(await active.evaluate((el) => el.complete && el.naturalWidth > 0));
    await page.keyboard.press("ArrowRight");
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: transfers, images, crests, themes, 13-player carousel, 4 viewports, console and HTTP",
  );
} finally {
  await browser.close();
}
