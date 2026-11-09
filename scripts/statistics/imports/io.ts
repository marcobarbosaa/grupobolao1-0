import { createHash } from "node:crypto";
import { readFile, realpath, stat, open, mkdir } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, extname, basename } from "node:path";
import {
  inputPathSchema,
  type CandidateBatch,
} from "../../../src/lib/statistics/import-contracts.ts";
import { manifestSchema } from "../../../src/lib/statistics/schemas.ts";
import { validateStatisticsDirectory, safeDataPath } from "../persistence.ts";
export const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export function contained(base: string, target: string): boolean {
  const rel = relative(base, target);
  return !!rel && rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel);
}
export async function readInput(
  root: string,
  path: string,
  limit = 2 * 1024 * 1024,
): Promise<Buffer> {
  inputPathSchema.parse(path);
  const base = await realpath(root),
    target = await realpath(resolve(base, path));
  if (!contained(base, target)) throw new Error("Input path escapes the authorized directory");
  const info = await stat(target);
  if (!info.isFile() || info.size > limit)
    throw new Error("Input must be a regular file within the size limit");
  const buffer = await readFile(target);
  if (buffer.length > limit) throw new Error("Input exceeds size limit");
  return buffer;
}
export async function readInputJson(root: string, path: string) {
  if (extname(path) !== ".json") throw new Error("Expected JSON input");
  const bytes = await readInput(root, path);
  return { value: JSON.parse(bytes.toString("utf8")) as unknown, hash: sha256(bytes) };
}
export async function verifySources(root: string, batch: CandidateBatch) {
  const verified: { id: string; hash: string; format: string; bytes: number }[] = [];
  for (const { source, path } of batch.sources) {
    const bytes = await readInput(root, path, 25 * 1024 * 1024);
    const hash = sha256(bytes);
    if (hash !== source.contentHash) throw new Error("Original image hash mismatch: " + source.id);
    const extension = extname(path);
    let format: string | undefined;
    if (
      extension === ".png" &&
      bytes.length >= 45 &&
      bytes.subarray(12, 16).toString() === "IHDR" &&
      bytes.readUInt32BE(8) === 13 &&
      bytes.readUInt32BE(16) > 0 &&
      bytes.readUInt32BE(20) > 0 &&
      bytes.subarray(-8, -4).toString() === "IEND" &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      format = "png";
    if (
      [".jpg", ".jpeg"].includes(extension) &&
      bytes.length >= 12 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      bytes.at(-2) === 255 &&
      bytes.at(-1) === 217
    )
      format = "jpeg";
    if (
      extension === ".webp" &&
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP" &&
      bytes.length >= 12 &&
      bytes.readUInt32LE(4) + 8 === bytes.length
    )
      format = "webp";
    if (!format) throw new Error("Unsupported image format or mismatched header: " + source.id);
    verified.push({ id: source.id, hash, format, bytes: bytes.length });
  }
  return verified;
}
async function fingerprint(root: string) {
  const bytes = await readFile(await safeDataPath(root, "manifest.json"));
  const manifest = manifestSchema.parse(JSON.parse(bytes.toString("utf8")));
  const files: { path: string; hash: string }[] = [];
  for (const paths of Object.values(manifest)) {
    if (!Array.isArray(paths)) continue;
    for (const path of paths)
      files.push({ path, hash: sha256(await readFile(await safeDataPath(root, path))) });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    manifest,
    manifestHash: sha256(bytes),
    hash: sha256(JSON.stringify({ manifest: sha256(bytes), files })),
  };
}
export async function readSnapshot(root: string) {
  const before = await fingerprint(root);
  const result = await validateStatisticsDirectory(root);
  if (!result.success)
    throw new Error(result.issues.map((i) => i.path + ": " + i.message).join("\n"));
  if ((await fingerprint(root)).hash !== before.hash)
    throw new Error("Statistics changed during snapshot read; retry");
  return { ...before, data: result.data };
}
export async function writeExclusive(path: string, value: string) {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(value, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
export async function createReportDirectory(path: string, publicRoot: string) {
  const parent = await realpath(resolve(path, ".."));
  const target = resolve(parent, basename(path));
  const published = await realpath(publicRoot);
  if (target === published || contained(published, target))
    throw new Error("Review files must remain outside the published statistics directory");
  await mkdir(target);
  return target;
}
