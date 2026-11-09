import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";
import {
  dataPathSchema,
  manifestSchema,
  teamSchema,
  seasonSchema,
  gameSchema,
  playerTeamHistorySchema,
  statisticalRecordSchema,
  awardSchema,
  importSourceSchema,
  importBatchSchema,
  dataRevisionSchema,
} from "../../src/lib/statistics/schemas.ts";
import {
  validateDataset,
  type ValidationResult,
  type ValidationIssue,
} from "../../src/lib/statistics/validate.ts";
import type { StatisticsDataset } from "../../src/lib/statistics/types.ts";

const fileSchemas = {
  teams: z.array(teamSchema),
  seasons: z.array(seasonSchema),
  games: z.array(gameSchema),
  teamHistory: z.array(playerTeamHistorySchema),
  statistics: z.array(statisticalRecordSchema),
  awards: z.array(awardSchema),
  sources: z.array(importSourceSchema),
  batches: z.array(importBatchSchema),
  revisions: z.array(dataRevisionSchema),
} as const;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
export async function safeDataPath(root: string, path: string): Promise<string> {
  dataPathSchema.parse(path);
  const base = await realpath(root);
  const target = await realpath(resolve(base, path));
  const rel = relative(base, target);
  if (!rel || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel))
    throw new Error("Referenced path escapes the statistics directory (including symlinks)");
  const info = await stat(target);
  if (!info.isFile()) throw new Error("Referenced path is not a regular file");
  if (info.size > MAX_FILE_BYTES)
    throw new Error("JSON file exceeds the 10 MiB safety limit; split the dataset");
  return target;
}
async function readJson(root: string, path: string): Promise<unknown> {
  return JSON.parse(await readFile(await safeDataPath(root, path), "utf8"));
}
export async function validateStatisticsDirectory(root: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let manifest;
  try {
    const parsed = manifestSchema.safeParse(await readJson(root, "manifest.json"));
    if (!parsed.success)
      return {
        success: false,
        issues: parsed.error.issues.map((issue) => ({
          path: "manifest.json:" + issue.path.join("."),
          message: issue.message,
        })),
      };
    manifest = parsed.data;
  } catch (error) {
    return {
      success: false,
      issues: [
        {
          path: "manifest.json",
          message: error instanceof Error ? error.message : "Could not read manifest",
        },
      ],
    };
  }
  const collections: Record<keyof typeof fileSchemas, unknown[]> = {
    teams: [],
    seasons: [],
    games: [],
    teamHistory: [],
    statistics: [],
    awards: [],
    sources: [],
    batches: [],
    revisions: [],
  };
  const locations: Record<string, string> = {};
  const physicalPaths = new Set<string>();
  for (const category of Object.keys(fileSchemas) as (keyof typeof fileSchemas)[]) {
    for (const path of manifest[category] ?? []) {
      try {
        const physicalPath = await safeDataPath(root, path);
        if (physicalPaths.has(physicalPath))
          throw new Error("The same physical file is referenced twice");
        physicalPaths.add(physicalPath);
        const parsed = fileSchemas[category].safeParse(await readJson(root, path));
        if (!parsed.success) {
          issues.push(
            ...parsed.error.issues.map((issue) => ({
              path: path + ":" + issue.path.join("."),
              message: issue.message,
            })),
          );
          continue;
        }
        parsed.data.forEach((record, i) => {
          locations[category + "." + collections[category].length] = path + ":" + i;
          collections[category].push(record);
        });
      } catch (error) {
        issues.push({
          path,
          message: error instanceof Error ? error.message : "Could not read JSON data",
        });
      }
    }
  }
  if (issues.length) return { success: false, issues };
  const result = validateDataset(collections);
  if (!result.success)
    return {
      success: false,
      issues: result.issues.map((issue) => {
        const [category, index, ...rest] = issue.path.split(".");
        const location = locations[category + "." + index];
        return {
          ...issue,
          path: location ? location + (rest.length ? "." + rest.join(".") : "") : issue.path,
        };
      }),
    };
  return result;
}
