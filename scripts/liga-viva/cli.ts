import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { reconstructSeason } from "../../src/lib/liga-viva/engine.ts";
import { validateReconstruction } from "../../src/lib/liga-viva/validate.ts";
import type { Reconstruction } from "../../src/lib/liga-viva/types.ts";
import { loadPilotSeason } from "./pilot.ts";

const defaultOutput = "src/data/liga-viva/reconstructions/season-002-seed-pilot.json";

async function generate(seed: string, outputPath: string) {
  const { target, rules, inputHash } = await loadPilotSeason();
  const { reconstruction, report } = await reconstructSeason({ target, rules, inputHash, seed });
  const absolutePath = resolve(outputPath);
  await mkdir(resolve(absolutePath, ".."), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(reconstruction, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        path: absolutePath,
        reconstructionId: reconstruction.reconstructionId,
        seed: reconstruction.seed,
        valid: report.valid,
        ...report.totals,
        ...(report.scoring ? { scoring: report.scoring } : {}),
      },
      null,
      2,
    ),
  );
}

async function validate(path: string) {
  const { target, inputHash } = await loadPilotSeason();
  const reconstruction = JSON.parse(await readFile(resolve(path), "utf8")) as Reconstruction;
  const report = validateReconstruction(target, reconstruction, inputHash);
  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) process.exitCode = 1;
}

export async function runCli(args: string[]) {
  const [command = "generate", value = "season-002-stage-2", path = defaultOutput] = args;
  if (command === "generate") return generate(value, path);
  if (command === "validate") return validate(value === "season-002-stage-2" ? path : value);
  throw new Error(
    "Usage: node scripts/liga-viva/cli.ts generate [seed] [output.json] | validate [reconstruction.json]",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
