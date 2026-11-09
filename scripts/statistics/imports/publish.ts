import { randomUUID } from "node:crypto";
import { mkdir, rename, readFile, realpath, lstat, readdir, rm, open } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { manifestSchema } from "../../../src/lib/statistics/schemas.ts";
import { canonicalImport } from "../../../src/lib/statistics/import-validation.ts";
import { validateAppendOnly } from "../../../src/lib/statistics/validate.ts";
import { validateStatisticsDirectory } from "../persistence.ts";
import { prepareReview, authorizedProposal, type ImportPaths } from "./review.ts";
import { readSnapshot, readInputJson, writeExclusive, sha256, contained } from "./io.ts";
const journalSchema = z
  .object({
    token: z.string().uuid(),
    pid: z.number().int().positive(),
    oldManifestHash: z.string().regex(/^[a-f0-9]{64}$/),
    newManifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const stringify = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
async function syncDirectory(path: string) {
  try {
    const handle = await open(path, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (
      !["EISDIR", "EPERM", "EINVAL", "EACCES", "ENOTSUP"].includes(
        (error as NodeJS.ErrnoException).code ?? "",
      )
    )
      throw error;
  }
}
async function removeScratch(root: string, name: string) {
  const target = resolve(root, name);
  if (!contained(root, target) || !/^\.import-(?:stage|manifest)-[a-f0-9-]+(?:\.json)?$/.test(name))
    throw new Error("Unsafe scratch cleanup target");
  try {
    const actual = await realpath(target);
    if (!contained(root, actual) || (await lstat(target)).isSymbolicLink())
      throw new Error("Unsafe scratch symlink");
    await rm(target, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
export interface PublishOptions extends ImportPaths {
  authorizationPath: string;
  write?: boolean;
  /** Trusted test hook only; never loaded from input or exposed by the CLI. */
  checkpoint?: (
    name: "after-stage" | "after-generation" | "before-manifest" | "after-manifest",
  ) => void | Promise<void>;
}
export async function publishImport(options: PublishOptions) {
  const root = await realpath(options.statisticsRoot);
  const prepared = await prepareReview(options);
  const authInput = await readInputJson(options.inputRoot, options.authorizationPath);
  const { authorization, data } = authorizedProposal(prepared, authInput.value);
  const generation = "import-" + sha256(canonicalImport(authorization));
  const files: Record<string, string> = {};
  const local: Record<string, unknown> = {
    schemaVersion: "1.0",
    generatedAt: authorization.approvedAt,
  };
  const manifest: Record<string, unknown> = { ...local };
  for (const [category, rows] of Object.entries(data)) {
    files[category + ".json"] = stringify(rows);
    local[category] = [category + ".json"];
    manifest[category] = [generation + "/" + category + ".json"];
  }
  files["manifest.json"] = stringify(manifestSchema.parse(local));
  files["receipt.json"] = stringify({
    authorization,
    sourceMapping: prepared.review.sourceMapping,
    verifiedSources: prepared.review.verifiedSources,
    changes: prepared.review.changes,
    aliasesHash: prepared.review.aliasesHash,
  });
  const nextManifest = stringify(manifestSchema.parse(manifest));
  const summary = {
    batchId: authorization.batchId,
    reviewHash: authorization.reviewHash,
    generation,
    changes: prepared.review.changes,
    files: Object.keys(files)
      .map((name) => generation + "/" + name)
      .concat("manifest.json"),
    committed: false,
    warning: undefined as string | undefined,
  };
  if (!options.write) return { ...summary, mode: "dry-run" as const };
  const token = randomUUID(),
    stageName = ".import-stage-" + token,
    tempName = ".import-manifest-" + token + ".json";
  const stage = resolve(root, stageName),
    destination = resolve(root, generation),
    lock = resolve(root, ".import-lock.json");
  const journal = {
    token,
    pid: process.pid,
    oldManifestHash: prepared.baseline.manifestHash,
    newManifestHash: sha256(nextManifest),
  };
  // Exclusive lock is only ever released by its owner. A crash leaves a recoverable journal.
  await writeExclusive(lock, stringify(journal));
  let committed = false;
  let failure: unknown;
  let cleanupFailure: unknown;
  try {
    if ((await readSnapshot(root)).hash !== prepared.baseline.hash)
      throw new Error("Baseline changed before write");
    await mkdir(stage, { mode: 0o700 });
    for (const [name, content] of Object.entries(files))
      await writeExclusive(resolve(stage, name), content);
    const checked = await validateStatisticsDirectory(stage);
    if (!checked.success) throw new Error(JSON.stringify(checked.issues));
    const issues = validateAppendOnly(prepared.baseline.data, checked.data);
    if (issues.length || canonicalImport(checked.data) !== canonicalImport(data))
      throw new Error("Staged snapshot failed integrity comparison");
    await syncDirectory(stage);
    await options.checkpoint?.("after-stage");
    try {
      const info = await lstat(destination);
      if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error("Generation path is unsafe");
      if (
        canonicalImport((await readdir(destination)).sort()) !==
        canonicalImport(Object.keys(files).sort())
      )
        throw new Error("Existing generation differs; refusing overwrite");
      for (const [name, content] of Object.entries(files)) {
        const target = resolve(destination, name);
        if ((await lstat(target)).isSymbolicLink() || (await readFile(target, "utf8")) !== content)
          throw new Error("Existing generation differs; refusing overwrite");
      }
      await removeScratch(root, stageName);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await rename(stage, destination);
    }
    await syncDirectory(root);
    await options.checkpoint?.("after-generation");
    await writeExclusive(resolve(root, tempName), nextManifest);
    if ((await readSnapshot(root)).hash !== prepared.baseline.hash)
      throw new Error("Baseline changed during preparation");
    await options.checkpoint?.("before-manifest");
    await rename(resolve(root, tempName), resolve(root, "manifest.json"));
    committed = true;
    await syncDirectory(root);
    await options.checkpoint?.("after-manifest");
  } catch (error) {
    failure = error;
  }
  try {
    await removeScratch(root, stageName);
    await removeScratch(root, tempName);
    const owner = journalSchema.parse(JSON.parse(await readFile(lock, "utf8")));
    if (owner.token !== token) throw new Error("Import lock ownership changed; inspect manually");
    await rm(lock);
  } catch (error) {
    cleanupFailure = error;
  }
  if (committed)
    return {
      ...summary,
      committed: true,
      mode: "write" as const,
      warning:
        failure || cleanupFailure
          ? "Manifest committed; post-commit cleanup/action needs inspection: " +
            String(failure ?? cleanupFailure)
          : undefined,
    };
  if (failure) throw failure;
  if (cleanupFailure) throw cleanupFailure;
  throw new Error("Publication did not reach its commit point");
}
export async function recoverImport(rootInput: string, expectedToken: string) {
  const root = await realpath(rootInput),
    lock = resolve(root, ".import-lock.json");
  if ((await lstat(lock)).isSymbolicLink()) throw new Error("Unsafe lock symlink");
  const journal = journalSchema.parse(JSON.parse(await readFile(lock, "utf8")));
  if (journal.token !== expectedToken) throw new Error("Recovery token does not match journal");
  try {
    process.kill(journal.pid, 0);
    throw new Error("Publisher process is still alive; recovery refused");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
  const snapshot = await readSnapshot(root);
  if (![journal.oldManifestHash, journal.newManifestHash].includes(snapshot.manifestHash))
    throw new Error("Manifest differs from both transaction states; inspect manually");
  await removeScratch(root, ".import-stage-" + journal.token);
  await removeScratch(root, ".import-manifest-" + journal.token + ".json");
  await rm(lock);
  return {
    recovered: true,
    committed: snapshot.manifestHash === journal.newManifestHash,
    retainedGenerations: true,
  };
}
