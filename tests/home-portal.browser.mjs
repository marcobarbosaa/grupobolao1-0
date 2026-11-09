import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8082";
const out = "artifacts/home-portal";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
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
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator("main h1").count(), 1);
    assert.equal(await page.locator(".generation-page > section").count(), 5);
    assert.equal(await page.locator(".generation-card").count(), 0);
    assert.equal(await page.locator(".site-header").getAttribute("data-integrated"), "true");
    const headerBefore = await page.locator(".site-header").boundingBox();
    const heroBefore = await page.locator(".generation-opening").boundingBox();
    if (width >= 1024) {
      const brand = await page.locator(".site-header .site-brand").boundingBox();
      const nav = await page.locator(".desktop-navigation").boundingBox();
      assert.ok(brand.x + brand.width <= nav.x, "header overlap at " + width);
      assert.equal(await page.locator(".desktop-navigation [aria-current]").innerText(), "Início");
    } else {
      await page.locator(".mobile-menu-trigger").click();
      assert.equal(await page.locator(".mobile-navigation [aria-current]").innerText(), "Início");
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator(".mobile-menu-trigger").evaluate((el) => el === document.activeElement),
        true,
      );
    }
    await page.evaluate(() => scrollTo(0, 500));
    await page.waitForTimeout(220);
    assert.equal(await page.locator(".site-header").getAttribute("data-integrated"), "false");
    assert.deepEqual(await page.locator(".site-header").boundingBox(), headerBefore);
    const heroY = await page
      .locator(".generation-opening")
      .evaluate((el) => el.getBoundingClientRect().y + scrollY);
    assert.equal(heroY, heroBefore.y, "scroll header must not move content");
    for (const img of await page.locator(".portal-versus img").all()) {
      assert.equal(await img.getAttribute("loading"), "lazy");
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el) => el.decode());
      assert.equal(await img.evaluate((el) => getComputedStyle(el).objectFit), "contain");
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(220);
    await page.screenshot({ path: out + "/home-" + width + ".png", fullPage: true });
    await page.screenshot({ path: out + "/header-" + width + ".png" });
    for (const selector of [
      ".generation-opening a",
      ".portal-season a",
      ".universe-door--seasons",
      ".universe-door--hall",
      ".universe-door--records",
      ".versus-action a",
    ]) {
      const link = page.locator(selector);
      const href = await link.getAttribute("href");
      await link.focus();
      await link.press("Enter");
      await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === href.replace(/\/$/, ""));
      assert.equal(await page.locator(".site-header").getAttribute("data-integrated"), "false");
      const nav =
        width >= 1024 ? page.locator(".desktop-navigation") : page.locator(".mobile-navigation");
      if (width < 1024) await page.locator(".mobile-menu-trigger").click();
      assert.equal(await nav.locator("[aria-current]").count(), 1);
      assert.equal(await nav.locator("[aria-current]").getAttribute("href"), href);
      if (width < 1024) {
        await nav.getByRole("link", { name: "Início", exact: true }).click();
        await page.waitForURL(base + "/");
        assert.equal(await page.locator(".mobile-menu").count(), 0);
      } else {
        await page.goto(base, { waitUntil: "networkidle" });
      }
    }
    results.push({
      width,
      height,
      sections: 5,
      galleryDuplicated: false,
      headerStable: true,
      links: 6,
    });
  }
  await page.goto(base + "/jogadores", { waitUntil: "networkidle" });
  const cards = page.locator(".generation-card");
  assert.equal(await cards.count(), 13);
  const links = await cards.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  for (const link of links) {
    const response = await page.goto(base + link, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.locator(".generation-portrait--profile img").evaluate((el) => el.decode());
  }
  await page.goto(base + "/biografias", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".generation-card").count(), 13);
  await page.locator(".mobile-menu-trigger").click();
  assert.equal(await page.locator(".mobile-navigation [aria-current]").innerText(), "Jogadores");
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  // Compare the approved hero and roster against the commit at the start of this stage.
  execFileSync("git", [
    "diff",
    "--exit-code",
    "c0a06bb",
    "--",
    "src/components/home/GenerationHero.tsx",
    "src/styles/generation-hero.css",
    "src/lib/new-roster.ts",
    "public/jogadores",
    "src/routes",
  ]);
  await writeFile(
    out + "/validation.json",
    JSON.stringify({ results, profiles: 13, heroPreserved: true, errors }, null, 2),
  );
  console.log(
    "PASS: six widths, five home sections, no duplicate gallery, header states, 36 CTA navigations, mobile menu, aliases, 13 profiles and preserved hero.",
  );
} finally {
  await browser.close();
}
