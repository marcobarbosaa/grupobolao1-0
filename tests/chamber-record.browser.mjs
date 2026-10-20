// Record actual browser screenshots with Chromium's native video encoder (no FFmpeg dependency).
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = "artifacts/chamber-review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
let capturing = false;
try {
  const encoder = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await encoder.setContent('<canvas width="1440" height="900"></canvas>');
  await encoder.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const chunks = [];
    const recorder = new MediaRecorder(canvas.captureStream(30), {
      mimeType: "video/webm;codecs=vp8",
      videoBitsPerSecond: 6000000,
    });
    window.capture = { canvas, chunks, recorder };
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.start();
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/jogadores`, { waitUntil: "domcontentloaded" });
  capturing = true;
  let frames = 0;
  let busy = false;
  let pending = Promise.resolve();
  const session = await page.context().newCDPSession(page);
  session.on("Page.screencastFrame", ({ data, sessionId }) => {
    void session.send("Page.screencastFrameAck", { sessionId });
    if (busy || !capturing) return;
    busy = true;
    pending = encoder
      .evaluate(
        (data) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              window.capture.canvas.getContext("2d").drawImage(img, 0, 0);
              resolve();
            };
            img.src = `data:image/jpeg;base64,${data}`;
          }),
        data,
      )
      .then(() => {
        frames++;
        busy = false;
      });
  });
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    maxWidth: 1440,
    maxHeight: 900,
    everyNthFrame: 2,
  });
  try {
    await page.waitForSelector('[data-render-mode="3d"]');
    await page.waitForTimeout(1500);
    await page.mouse.move(220, 360, { steps: 20 });
    await page.waitForTimeout(500);
    await page.mouse.move(1180, 380, { steps: 30 });
    await page.waitForTimeout(700);
    await page.locator(".holo-player-target").hover();
    await page.waitForTimeout(1200);
    await page.mouse.move(350, 410, { steps: 20 });
    await page.waitForTimeout(700);
    await page.locator(".holo-discover-button").click();
    await page.waitForTimeout(600);
    await page.locator(".holo-angle-controls summary").click();
    await page.getByRole("button", { name: "Costas", exact: true }).click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Frente", exact: true }).click();
    await page.waitForTimeout(700);
    await page.locator(".holo-career-cta").click();
    await page.waitForURL("**/jogadores/8");
    await page.waitForTimeout(700);
  } finally {
    capturing = false;
    await session.send("Page.stopScreencast");
    await pending;
  }
  const dataURL = await encoder.evaluate(
    () =>
      new Promise((resolve) => {
        window.capture.recorder.onstop = () => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(new Blob(window.capture.chunks, { type: "video/webm" }));
        };
        window.capture.recorder.stop();
      }),
  );
  await writeFile(
    `${output}/chamber-interaction.webm`,
    Buffer.from(dataURL.split(",")[1], "base64"),
  );
  console.log(
    JSON.stringify({
      file: `${output}/chamber-interaction.webm`,
      frames,
      format: "WebM / VP8",
      source: "actual browser screenshots, including DOM and canvas",
    }),
  );
} finally {
  capturing = false;
  await browser.close();
}
