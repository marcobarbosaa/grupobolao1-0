// Integration test for the real scene controller. Temporary empty slots are test fixtures only.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = "artifacts/chamber-review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(`${baseURL}/jogadores`, { waitUntil: "networkidle" });
  const spatial = await page.evaluate(async () => {
    const { createHolographicScene } =
      await import("/src/components/holographic/createHolographicScene.ts");
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;inset:90px 0 0;width:100%;height:650px;z-index:100;background:#0b0d11";
    const link = document.createElement("a");
    document.body.append(host);
    const failures = [];
    const controller = createHolographicScene(host, () => failures.push("WebGL failure"), link);
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    controller.setRoster(["8", "test-empty-slot"], 0);
    const initial = controller.inspect();
    await wait(1700);
    const settled = controller.inspect();
    const canvas = host.querySelector("canvas");
    controller.setRoster(["8", "test-empty-slot"], 1);
    await wait(230);
    const during = controller.inspect();
    await wait(1000);
    const after = controller.inspect();
    const sameCanvas = canvas === host.querySelector("canvas");
    controller.setPointer(1, -1);
    await wait(850);
    const pointer = controller.inspect();
    controller.setOpening(true);
    await wait(220);
    const opening = controller.inspect();
    const nativeHidden = Object.getOwnPropertyDescriptor(document, "hidden");
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    const paused = controller.inspect();
    controller.setPointer(-1, 1);
    await wait(300);
    const stillPaused = controller.inspect();
    if (nativeHidden) Object.defineProperty(document, "hidden", nativeHidden);
    else delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
    controller.dispose();
    controller.dispose();
    const disposed = host.querySelectorAll("canvas").length === 0;
    host.remove();
    return {
      initial,
      settled,
      during,
      after,
      pointer,
      opening,
      sameCanvas,
      paused,
      stillPaused,
      disposed,
      failures,
    };
  });
  assert.notDeepEqual(
    spatial.initial.nodes[0].position,
    spatial.settled.nodes[0].position,
    "entrance moves actual podium",
  );
  assert.deepEqual(spatial.settled.nodes[0].position, [0, 0, 0]);
  assert.deepEqual(spatial.settled.nodes[1].position, [4.8, 0, -2.7]);
  assert.ok(spatial.during.nodes[0].position[0] < 0 && spatial.during.nodes[0].position[0] > -4.8);
  assert.deepEqual(spatial.after.nodes[0].position, [-4.8, 0, -2.7]);
  assert.deepEqual(spatial.after.nodes[1].position, [0, 0, 0]);
  assert.ok(Math.abs(spatial.during.camera[0] - spatial.settled.camera[0]) > 0.05);
  assert.ok(spatial.pointer.camera[0] > 0.35);
  assert.ok(spatial.opening.camera[2] < spatial.pointer.camera[2] - 0.3);
  assert.deepEqual(
    spatial.paused,
    spatial.stillPaused,
    "hidden tab pauses renderer and animation clock",
  );
  assert.equal(spatial.sameCanvas, true);
  assert.equal(spatial.disposed, true);
  assert.deepEqual(spatial.failures, []);
  await writeFile(`${output}/spatial-results.json`, JSON.stringify(spatial, null, 2));
  await page.close();

  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const touch = await touchContext.newPage();
  await touch.goto(`${baseURL}/jogadores`, { waitUntil: "networkidle" });
  await touch.waitForSelector('[data-render-mode="3d"]');
  await touch.waitForTimeout(1400);
  await touch.locator(".holo-player-target").tap();
  assert.equal(new URL(touch.url()).pathname, "/jogadores");
  assert.equal(await touch.locator("#athlete-information").getAttribute("aria-hidden"), "false");
  await touch.waitForTimeout(350);
  await touch.screenshot({ path: `${output}/mobile-information.png`, fullPage: true });
  await touch.locator(".holo-career-cta").tap();
  await touch.waitForURL("**/jogadores/8");
  await touchContext.close();
  console.log(
    "PASS: spatial entrance, intermediate carousel travel, depth slots, camera travel, hover camera, profile zoom, hidden-tab pause, same renderer, idempotent disposal, touch reveal and career navigation",
  );
} finally {
  await browser.close();
}
