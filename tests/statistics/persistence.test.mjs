import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { validateStatisticsDirectory, safeDataPath } from "../../scripts/statistics/persistence.ts";
import { emptyManifest, publishedDataset, correctedDataset } from "./fixtures.mjs";

async function fixture(t, data) {
  const root = await mkdtemp(join(tmpdir(), "bolao-stats-"));
  t.after(async () => {
    const rel = relative(resolve(tmpdir()), resolve(root));
    assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
    await rm(root, { recursive: true, force: true });
  });
  const manifest = emptyManifest();
  if (data) {
    for (const [category, records] of Object.entries(data)) {
      if (!records.length) continue;
      await mkdir(join(root, category));
      const path = category + "/records.json";
      await writeFile(join(root, path), JSON.stringify(records));
      manifest[category] = [path];
    }
  }
  await writeFile(join(root, "manifest.json"), JSON.stringify(manifest));
  return { root, manifest };
}
test("empty and fully linked manifests read actual JSON files successfully", async (t) => {
  const empty = await fixture(t);
  assert.equal((await validateStatisticsDirectory(empty.root)).success, true);
  const populated = await fixture(t, publishedDataset());
  assert.equal((await validateStatisticsDirectory(populated.root)).success, true);
});
test("unsafe paths are rejected before opening referenced JSON", async (t) => {
  const { root, manifest } = await fixture(t);
  for (const path of [
    "../outside.json",
    "seasons/../../outside.json",
    "/tmp/a.json",
    "C:/a.json",
    "C:\\a.json",
    "https://example.com/a.json",
    "%2e%2e/a.json",
    "./a.json",
  ]) {
    await writeFile(join(root, "manifest.json"), JSON.stringify({ ...manifest, seasons: [path] }));
    const result = await validateStatisticsDirectory(root);
    assert.equal(result.success, false, path);
    assert.match(result.issues[0].path, /manifest.json/);
  }
});
test("symlinked directories cannot escape the allowed root", async (t) => {
  const base = await fixture(t);
  const outside = await fixture(t);
  await writeFile(join(outside.root, "records.json"), "[]");
  await symlink(
    outside.root,
    join(base.root, "linked"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(safeDataPath(base.root, "linked/records.json"), /escapes/);
});
test("missing files, invalid JSON and unresolved records produce useful file locations", async (t) => {
  const { root, manifest } = await fixture(t);
  await writeFile(
    join(root, "manifest.json"),
    JSON.stringify({ ...manifest, games: ["missing.json"] }),
  );
  assert.equal((await validateStatisticsDirectory(root)).success, false);
  await writeFile(join(root, "missing.json"), "{ invalid JSON");
  assert.equal((await validateStatisticsDirectory(root)).success, false);
  const data = publishedDataset();
  data.statistics[0].gameId = "missing-game";
  const populated = await fixture(t, data);
  const result = await validateStatisticsDirectory(populated.root);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((issue) => issue.path.includes("statistics/records.json:0.gameId")));
});
test("CLI returns nonzero on malformed data and enforces the optional immutable baseline", async (t) => {
  const previous = await fixture(t, publishedDataset());
  const next = await fixture(t, correctedDataset());
  const run = (...args) =>
    spawnSync(process.execPath, ["scripts/statistics/validate-data.ts", ...args], {
      encoding: "utf8",
    });
  assert.equal(run("--root", next.root, "--previous-root", previous.root).status, 0);
  const data = publishedDataset();
  data.statistics[0].stats.totals.blocks = 7;
  const altered = await fixture(t, data);
  const overwrite = run("--root", altered.root, "--previous-root", previous.root);
  assert.equal(overwrite.status, 1);
  assert.match(overwrite.stderr, /overwritten/);
  await writeFile(join(altered.root, "manifest.json"), "{}");
  assert.equal(run("--root", altered.root).status, 1);
  assert.equal(run("--unsupported").status, 2);
});
