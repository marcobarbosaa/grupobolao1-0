import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { reconstructSeason } from "../../src/lib/liga-viva/engine.ts";
import { validateReconstruction } from "../../src/lib/liga-viva/validate.ts";
import type { Reconstruction } from "../../src/lib/liga-viva/types.ts";
import { loadPilotSeason } from "./pilot.ts";

const defaultOutput = "src/data/liga-viva/reconstructions/season-002-seed-pilot.json";
const defaultSeason3Output = "src/data/liga-viva/reconstructions/season-003-seed-pilot.json";
const defaultSeason4Output = "src/data/liga-viva/reconstructions/season-004-seed-pilot.json";
const defaultSeason5Output = "src/data/liga-viva/reconstructions/season-005-seed-pilot.json";
const defaultSeason6Output = "src/data/liga-viva/reconstructions/season-006-seed-pilot.json";
const defaultSeason7Output = "src/data/liga-viva/reconstructions/season-007-seed-pilot.json";
const defaultSeason8Output = "src/data/liga-viva/reconstructions/season-008-seed-pilot.json";
const defaultSeason9Output = "src/data/liga-viva/reconstructions/season-009-seed-pilot.json";
const defaultSeason10Output = "src/data/liga-viva/reconstructions/season-010-seed-pilot.json";
const defaultSeason11Output = "src/data/liga-viva/reconstructions/season-011-seed-pilot.json";
const defaultSeason12Output = "src/data/liga-viva/reconstructions/season-012-seed-pilot.json";

async function generate(seasonId: string, seed: string, outputPath: string) {
  const { target, rules, inputHash } = await loadPilotSeason(seasonId);
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
  const reconstruction = JSON.parse(await readFile(resolve(path), "utf8")) as Reconstruction;
  const { target, inputHash } = await loadPilotSeason(reconstruction.seasonId);
  const report = validateReconstruction(target, reconstruction, inputHash);
  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) process.exitCode = 1;
}

export async function runCli(args: string[]) {
  const [command = "generate", value = "season-002-stage-2", path = defaultOutput] = args;
  if (command === "generate") return generate("season-002", value, path);
  if (command === "generate-season") {
    const [seasonId, seed, requestedOutputPath] = args.slice(1);
    if (!seasonId || !seed) throw new Error("Usage: generate-season <season-id> <seed> [output.json]");
    const outputPath =
      requestedOutputPath ??
      (seasonId === "season-003"
        ? defaultSeason3Output
        : seasonId === "season-004"
          ? defaultSeason4Output
          : seasonId === "season-005"
            ? defaultSeason5Output
            : seasonId === "season-006"
              ? defaultSeason6Output
              : seasonId === "season-007"
                ? defaultSeason7Output
                  : seasonId === "season-008"
                    ? defaultSeason8Output
                      : seasonId === "season-009"
                        ? defaultSeason9Output
                        : seasonId === "season-010"
                          ? defaultSeason10Output
                          : seasonId === "season-011"
                            ? defaultSeason11Output
                            : seasonId === "season-012"
                              ? defaultSeason12Output
                              : defaultOutput);
    return generate(seasonId, seed, outputPath);
  }
  if (command === "validate") return validate(value === "season-002-stage-2" ? path : value);
  throw new Error(
    "Usage: node scripts/liga-viva/cli.ts generate [seed] [output.json] | generate-season <season-id> <seed> [output.json] | validate <reconstruction.json>",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
