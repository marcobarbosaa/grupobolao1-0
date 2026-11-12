// Runs only against a synthetic temporary statistics root, never the historical dataset.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute, sep } from "node:path";
import { startLocalImporter } from "../scripts/statistics/local/server.ts";
import { LocalImportService } from "../scripts/statistics/local/service.ts";
import { emptyManifest } from "./statistics/fixtures.mjs";
import { imageBytes } from "./statistics/import-fixtures.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = await mkdtemp(join(tmpdir(), "bolao-browser-"));
const statistics = join(base, "src/data/statistics");
await mkdir(statistics, { recursive: true });
await writeFile(join(statistics, "manifest.json"), JSON.stringify(emptyManifest()));
await writeFile(join(statistics, "season-extras.json"), "{}");
const folder = join(base, "Temporada 2008-2009");
await mkdir(join(folder, "Abel"), { recursive: true });
await writeFile(join(folder, "Abel", "nome-arbitrario.png"), imageBytes);
const output = "artifacts/statistics-imports/browser-review";
await mkdir(output, { recursive: true });
const service = new LocalImportService(base, statistics);
const server = await startLocalImporter({ service, token: "synthetic-browser-token" });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  const response = await page.goto("http://127.0.0.1:5179/__bolao/importador", {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  await page.getByLabel("Código da sessão").fill("synthetic-browser-token");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("Arraste a pasta completa da temporada").waitFor();
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b1526";
    ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    [
      "SYNTHETIC TEST - NOT OFFICIAL",
      "Abel / 2008-2009 / Regular Season",
      "AVERAGES",
      "PTS 27.40",
    ].forEach((text, i) => ctx.fillText(text, 30, 80 + i * 80));
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await writeFile(join(folder, "Abel", "nome-arbitrario.png"), Buffer.from(encoded, "base64"));
  await page.locator('input[type="file"]').setInputFiles(folder);
  await page.getByRole("button", { name: "Confirmar temporada", exact: true }).waitFor();
  await page.getByRole("button", { name: "Confirmar temporada", exact: true }).click();
  await page.getByRole("button", { name: "Temporada confirmada", exact: true }).waitFor();
  await page.getByLabel("Fase", { exact: true }).selectOption("regular");
  await page.getByLabel("ppg", { exact: true }).fill("27.40");
  await page.getByRole("button", { name: "Conferi este print · salvar" }).click();
  await page.getByText("Processado · revisado", { exact: true }).waitFor();
  await page.screenshot({ path: output + "/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Gerar relatório e validar" }).click();
  await page.getByText("Validação concluída. Aguardando aprovação explícita.").waitFor();
  await page.getByLabel("Nome do responsável", { exact: true }).fill("Synthetic browser reviewer");
  await page
    .getByLabel("Conferi o relatório e aprovo explicitamente estes registros e suas fontes.")
    .check();
  await page.getByRole("button", { name: "Aprovar revisão", exact: true }).click();
  await page.getByRole("button", { name: "Executar dry-run" }).click();
  await page.getByText("Simulação — arquivos propostos").waitFor();
  await page.getByRole("button", { name: "Publicar localmente", exact: true }).click();
  await page.getByText("Publicado e validado", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Entrar" }).click();
  const saved = (await service.list()).drafts[0];
  await page.getByLabel("Retomar revisão").selectOption(saved.id);
  await page.getByText("Lote publicado. Execute npm run build", { exact: false }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: output + "/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
    "No mobile horizontal overflow",
  );
  // Vite must not expose the private inbox through /@fs or root URLs.
  assert.equal(
    (
      await page.request.get(
        "http://127.0.0.1:5179/artifacts/statistics-imports/local/anything.json",
      )
    ).ok(),
    false,
  );
  assert.deepEqual(errors, []);
  const entries = await page.evaluate(async () => {
    const { readDroppedEntries } = await import("/src/admin/directories.ts");
    let calls = 0;
    const files = Array.from({ length: 101 }, (_, i) => ({
      name: `print-${i}.png`,
      isFile: true,
      file(ok) {
        ok(new File(["synthetic"], `print-${i}.png`));
      },
    }));
    const player = {
      name: "Abel",
      isFile: false,
      createReader() {
        return {
          readEntries(ok) {
            const chunk = calls++ === 0 ? files.slice(0, 100) : calls === 2 ? files.slice(100) : [];
            ok(chunk);
          },
        };
      },
    };
    const root = {
      name: "Temporada 2008-2009",
      isDirectory: true,
      isFile: false,
      createReader() {
        let first = true;
        return {
          readEntries(ok) {
            ok(first ? [player] : []);
            first = false;
          },
        };
      },
    };
    const result = await readDroppedEntries(
      [
        {
          webkitGetAsEntry() {
            return root;
          },
        },
      ],
      new AbortController().signal,
    );
    return { count: result.length, last: result.at(-1).path, calls };
  });
  assert.equal(entries.count, 101);
  assert.equal(entries.calls, 3);
  assert.equal(entries.last, "Temporada 2008-2009/Abel/print-100.png");
  console.log(
    "Browser: login, directory selection, manual review, approval, dry-run, synthetic publication, resume and mobile passed.",
  );
} catch (error) {
  await page.screenshot({ path: output + "/failure.png", fullPage: true });
  console.error(await page.locator("body").innerText());
  throw error;
} finally {
  await browser.close();
  await server.close();
  const actual = await realpath(base),
    temp = await realpath(tmpdir()),
    rel = relative(temp, actual);
  if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith(".." + sep))
    throw new Error("Unsafe test cleanup");
  await rm(actual, { recursive: true, force: true });
}
