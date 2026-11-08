import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = "artifacts/redesign-review";
await mkdir(output, { recursive: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const report = { viewports: [], routes: [], interactions: [], errors };
async function visit(path) {
  const r = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(r.status() < 400, path);
  await page.locator("main h1").waitFor();
}
async function noOverflow(label) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
    label,
  );
}
try {
  await visit("/");
  const data = await page.evaluate(async () => {
    const { players, seasons } = await import("/src/lib/mock-data.ts");
    return { players, seasons };
  });
  const ranking = [...data.players].sort((a, b) => b.scoreTotal - a.scoreTotal);
  assert.equal(
    await page.locator(".hero-photo-caption a").evaluate((el) => el.textContent.trim()),
    ranking[0].name,
  );
  assert.equal(await page.locator(".sports-table tbody tr").count(), 13);
  assert.deepEqual(
    await page.locator(".sports-table tbody th").allTextContents(),
    ranking.map((p) => p.name),
  );
  for (let i = 0; i < 13; i++)
    assert.equal(
      await page
        .locator(".sports-table tbody tr")
        .nth(i)
        .locator("td")
        .nth(3)
        .evaluate((el) => el.textContent.trim()),
      ranking[i].scoreTotal.toFixed(2),
    );
  report.interactions.push("All 13 legacy grades and ranking positions match unchanged source");
  for (const width of process.env.SKIP_VIEWPORTS ? [] : [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/",
      "/hall-da-fama",
      "/temporadas",
      "/recordes",
      "/biografias",
      "/jogadores",
      "/jogadores/8",
      "/deep-analytics",
    ]) {
      await visit(path);
      await noOverflow(width + path);
      assert.equal(await page.locator("main h1").count(), 1);
      if ([390, 1440].includes(width) && path !== "/hall-da-fama" && path !== "/jogadores") {
        const name = path === "/" ? "home" : path.replaceAll("/", "-").slice(1);
        for (
          let y = 0;
          y < (await page.evaluate(() => document.documentElement.scrollHeight));
          y += 800
        ) {
          await page.evaluate((y) => window.scrollTo(0, y), y);
          await page.waitForTimeout(80);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        await page.screenshot({ path: output + "/" + name + "-" + width + ".png", fullPage: true });
      }
      report.viewports.push({ width, path, overflow: false });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("/temporadas");
  assert.equal(await page.locator(".season-ledger details").count(), 22);
  for (let i = 0; i < data.seasons.length; i++) {
    await page.getByLabel("Escolher temporada").selectOption(String(i));
    assert.equal(
      await page.locator(".season-chapter h2").evaluate((el) => el.textContent.trim()),
      data.seasons[i].champion,
    );
    const text = await page.locator(".season-chapter").evaluate((el) => el.textContent.trim());
    assert.ok(text.includes(data.seasons[i].mvp));
    assert.ok(text.includes(data.seasons[i].finalsMvp));
  }
  await page.locator(".season-ledger summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".season-ledger details").first().getAttribute("open"), "");
  report.interactions.push("22 seasons, winners, MVPs and keyboard disclosure");
  await visit("/recordes");
  const keys = ["pts", "reb", "ast", "stl", "blk", "rings"];
  for (let i = 0; i < keys.length; i++) {
    await page.locator(".record-categories button").nth(i).click();
    const key = keys[i];
    const leaders = data.players
      .map((p) => ({
        name: p.name,
        value: key === "rings" ? p.rings : Math.round(p[key] * p.seasons * 82),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    assert.equal(
      await page.locator(".record-copy h2").evaluate((el) => el.textContent.trim()),
      leaders[0].name,
    );
    assert.ok(
      (await page.locator(".record-value").evaluate((el) => el.textContent.trim())).includes(
        leaders[0].value.toLocaleString("pt-BR"),
      ),
    );
    assert.deepEqual(
      await page.locator(".record-chasers a").allTextContents(),
      leaders.slice(1).map((p) => p.name),
    );
    assert.ok(
      (await page.locator(".sports-data-notice").evaluate((el) => el.textContent.trim())).includes(
        i === 5 ? "Não é uma estimativa" : "Estimativa =",
      ),
    );
  }
  report.interactions.push(
    "All six record categories preserve original top five and disclose estimation",
  );
  await visit("/biografias");
  assert.equal(await page.locator(".athlete-card").count(), 13);
  for (const p of data.players) {
    const card = page.getByRole("button", { name: "Selecionar " + p.name, exact: true });
    await card.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator("#selected-athlete h2").evaluate((el) => el.textContent.trim()),
      p.name,
    );
    assert.equal(
      await page.locator("#selected-athlete .sports-button").getAttribute("href"),
      "/jogadores/" + p.id,
    );
    const image = card.locator("img");
    assert.ok(
      await card.evaluate(
        (el) =>
          Math.abs(
            el.getBoundingClientRect().top - el.querySelector("img").getBoundingClientRect().top,
          ) < 3,
      ),
    );
    const stem = p.imageUrl
      .split("/")
      .pop()
      .replace(/\.[^.]+$/, "");
    assert.ok((await image.getAttribute("src")).includes("/" + stem + "-960.webp"));
  }
  await page.getByLabel("Buscar jogador").fill("Nando");
  assert.equal(await page.locator(".athlete-card").count(), 1);
  await page.getByLabel("Buscar jogador").fill("zzzzzz");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  assert.equal(await page.locator(".athlete-card").count(), 13);
  await page.getByLabel("Equipe", { exact: true }).selectOption("Portland Trail Blazers");
  assert.ok((await page.locator(".athlete-card").count()) >= 1);
  await page.getByLabel("Equipe", { exact: true }).selectOption("");
  await page.getByLabel("Ordem", { exact: true }).selectOption("za");
  const names = await page.locator(".athlete-card h2").allTextContents();
  assert.deepEqual(
    names,
    [...names].sort((a, b) => b.localeCompare(a, "pt-BR")),
  );
  report.interactions.push(
    "13 cards, correct photographs/profile links, keyboard selection, search, empty state, team and sort filters",
  );
  await visit("/deep-analytics");
  const a = page.getByLabel("Jogador A", { exact: true }),
    b = page.getByLabel("Jogador B", { exact: true });
  const av = await a.inputValue(),
    bv = await b.inputValue();
  assert.notEqual(av, bv);
  await page.getByRole("button", { name: "Inverter lados" }).click();
  assert.equal(await a.inputValue(), bv);
  assert.equal(await b.inputValue(), av);
  await page.getByLabel("Temporada final").selectOption("2");
  await page.getByLabel("Temporada inicial").selectOption("10");
  assert.equal(await page.getByLabel("Temporada final").inputValue(), "10");
  await page.getByLabel("Temporada final").selectOption("3");
  assert.equal(await page.getByLabel("Temporada inicial").inputValue(), "3");
  for (const name of ["Regular", "Playoffs", "Finais", "Todas"]) {
    await page.getByRole("button", { name, exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"),
      "true",
    );
  }
  report.interactions.push(
    "VS swap, distinct players, both reversed range directions, all phase toggles",
  );
  for (const p of data.players) {
    await visit("/jogadores/" + p.id);
    assert.ok((await page.locator("h1").evaluate((el) => el.textContent.trim())).includes(p.name));
    assert.equal(
      await page.locator(".legacy-final strong").evaluate((el) => el.textContent.trim()),
      p.scoreTotal.toFixed(2) + "/ 10",
    );
    assert.ok(
      (await page.locator(".profile-hero-image img").getAttribute("src")).includes(
        p.imageUrl
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, ""),
      ),
    );
    report.routes.push("/jogadores/" + p.id);
  }
  await visit("/jogadores/8");
  for (const phase of ["regular", "playoffs", "finals"]) {
    await page.getByLabel("Fase das estatísticas").selectOption(phase);
    assert.ok(
      (await page.locator(".statistics-context").evaluate((el) => el.textContent.trim())).length >
        0,
    );
  }
  await page.locator(".statistics-detail summary").click();
  assert.ok((await page.locator(".statistics-table-scroll table").count()) === 1);
  report.interactions.push(
    "13 profiles, original legacy grades, imported history and regular/playoff/finals controls",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/");
  const trigger = page.getByRole("button", { name: "Abrir menu de navegação" });
  await trigger.click();
  await page.keyboard.press("Escape");
  assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Navegação mobile" })
    .getByRole("link", { name: /Temporadas/ })
    .click();
  await page.waitForURL("**/temporadas");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await trigger.click();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')),
    true,
  );
  await page.keyboard.press("Escape");
  await page.locator(".site-brand").first().focus();
  assert.notEqual(
    await page
      .locator(".site-brand")
      .first()
      .evaluate((el) => getComputedStyle(el).outlineStyle),
    "none",
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    "auto",
  );
  report.interactions.push(
    "Mobile menu navigation, Escape focus return, focus trap, visible focus and reduced motion",
  );
  await visit("/");
  await page.keyboard.press("Control+Home");
  const missing = await page
    .locator("img")
    .evaluateAll((imgs) => imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src));
  assert.deepEqual(missing, []);
  assert.deepEqual(errors, []);
  await writeFile(output + "/results.json", JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        success: true,
        viewports: report.viewports.length,
        profiles: report.routes.length,
        interactions: report.interactions,
      },
      null,
      2,
    ),
  );
} finally {
  await writeFile(output + "/last-run.json", JSON.stringify(report, null, 2));
  await browser.close();
}
