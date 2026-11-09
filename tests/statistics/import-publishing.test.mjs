import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, readdir, symlink, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { candidate, sandbox, approve, putBatch, imageBytes } from "./import-fixtures.mjs";
import {
  prepareReview,
  authorizeReview,
  writeReview,
} from "../../scripts/statistics/imports/review.ts";
import { publishImport, recoverImport } from "../../scripts/statistics/imports/publish.ts";
import { readSnapshot, sha256, readInput } from "../../scripts/statistics/imports/io.ts";
import { selectCurrentRevisions } from "../../src/lib/statistics/revisions.ts";
const cli = resolve("scripts/statistics/imports/cli.ts");
test("review output is deterministic and writing reports never modifies the published snapshot", async (t) => {
  const env = await sandbox(t);
  await putBatch(env, candidate());
  const before = await readSnapshot(env.root);
  const a = await prepareReview(env.paths),
    b = await prepareReview(env.paths);
  assert.deepEqual(a.review, b.review);
  await writeReview(a, join(env.base, "review"));
  assert.equal(
    JSON.parse(await readFile(join(env.base, "review", "review.json"), "utf8")).reviewHash,
    a.review.reviewHash,
  );
  assert.match(await readFile(join(env.base, "review", "review.md"), "utf8"), /summary-test/);
  assert.equal((await readSnapshot(env.root)).hash, before.hash);
  await assert.rejects(writeReview(a, join(env.base, "review")), /exist/i);
  await assert.rejects(writeReview(a, join(env.root, "review")), /outside/);
});
test("dry-run has no filesystem side effects, and explicit publication creates a validated generation", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  const before = await readSnapshot(env.root),
    names = await readdir(env.root);
  const dry = await publishImport(options);
  assert.equal(dry.committed, false);
  assert.equal(dry.mode, "dry-run");
  assert.deepEqual(await readdir(env.root), names);
  assert.equal((await readSnapshot(env.root)).hash, before.hash);
  const result = await publishImport({ ...options, write: true });
  assert.equal(result.committed, true);
  const next = await readSnapshot(env.root);
  assert.equal(next.data.statistics.length, 1);
  assert.equal(next.data.batches[0].approvedBy, "synthetic-reviewer");
  assert.ok(next.manifest.statistics[0].startsWith(result.generation));
  assert.equal(next.data.statistics[0].stats.averages.ppg, 27.4);
  const receipt = JSON.parse(
    await readFile(join(env.root, result.generation, "receipt.json"), "utf8"),
  );
  assert.equal(receipt.authorization.reviewHash, result.reviewHash);
  assert.deepEqual((await readdir(env.root)).sort(), [result.generation, "manifest.json"].sort());
});
test("publication without authorization, or with a changed batch/base/alias, is refused", async (t) => {
  const env = await sandbox(t),
    batch = candidate();
  const { options, authorization } = await approve(env, batch);
  await assert.rejects(
    publishImport({ ...options, authorizationPath: "missing.json", write: true }),
  );
  await writeFile(join(env.inbox, "authorization.json"), JSON.stringify({ approved: true }));
  await assert.rejects(publishImport({ ...options, write: true }));
  await writeFile(join(env.inbox, "authorization.json"), JSON.stringify(authorization));
  batch.items[0].values[1].value = "99,0";
  await putBatch(env, batch);
  await assert.rejects(publishImport(options), /hash|binding/);
  await putBatch(env, candidate());
  await writeFile(
    join(env.root, "manifest.json"),
    (await readFile(join(env.root, "manifest.json"), "utf8")) + " ",
  );
  await assert.rejects(publishImport(options), /hash|binding/);
});
test("authorization needs the exact scope and separate acceptance of each correction", async (t) => {
  const env = await sandbox(t),
    first = await approve(env, candidate());
  const firstPublication = await publishImport({ ...first.options, write: true });
  const previous = await readSnapshot(env.root);
  const batch = candidate();
  batch.id = "import-correction";
  batch.receivedAt = "2026-02-02T11:00:00Z";
  batch.items[0].values[1].value = "28,40";
  batch.items[0].correction = { expectedRevision: 1, reason: "Reviewed synthetic correction" };
  await putBatch(env, batch);
  const prepared = await prepareReview(env.paths);
  const decision = {
    reviewHash: prepared.review.reviewHash,
    approvedBy: "synthetic-reviewer",
    approvedAt: "2026-02-02T12:00:00Z",
    recordIds: ["summary-test"],
    correctionIds: [],
  };
  assert.throws(() => authorizeReview(prepared, decision), /correction/);
  assert.throws(
    () =>
      authorizeReview(prepared, {
        ...decision,
        correctionIds: ["summary-test"],
        recordIds: ["other"],
      }),
    /exactly/,
  );
  const next = await approve(env, batch);
  await publishImport({ ...next.options, write: true });
  const current = await readSnapshot(env.root);
  assert.equal(current.data.statistics.length, 2);
  assert.deepEqual(current.data.statistics[0], previous.data.statistics[0]);
  assert.equal(selectCurrentRevisions(current.data).records[0].stats.averages.ppg, 28.4);
  assert.ok((await readdir(env.root)).includes(firstPublication.generation));
});
test("image bytes, source hashes, file size and formats are verified before approval", async (t) => {
  const env = await sandbox(t);
  await putBatch(env, candidate());
  await writeFile(join(env.inbox, "image.png"), Buffer.from("not an image"));
  assert.equal((await prepareReview(env.paths)).review.ready, false);
  await writeFile(
    join(env.inbox, "image.png"),
    Buffer.concat([imageBytes, Buffer.from("changed")]),
  );
  assert.match((await prepareReview(env.paths)).review.issues.at(-1).message, /hash/);
  await writeFile(join(env.inbox, "image.png"), imageBytes);
  await assert.rejects(readInput(env.inbox, "image.png", 2), /limit/);
  const wrong = candidate();
  wrong.sources[0].path = "image.jpg";
  await writeFile(join(env.inbox, "image.jpg"), imageBytes);
  await putBatch(env, wrong);
  assert.equal((await prepareReview(env.paths)).review.ready, false);
});
test("traversal, absolute paths and symlink escapes cannot read outside the authorized input root", async (t) => {
  const env = await sandbox(t);
  for (const path of [
    "../outside.json",
    "C:/outside.json",
    "/outside.json",
    "dir/../../outside.json",
  ])
    await assert.rejects(readInput(env.inbox, path));
  const outside = join(env.base, "outside");
  await mkdir(outside);
  await writeFile(join(outside, "secret.json"), "{}");
  await symlink(
    outside,
    join(env.inbox, "escape"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(readInput(env.inbox, "escape/secret.json"), /escapes/);
});
test("failures before the manifest switch preserve the previous public snapshot and permit retry", async (t) => {
  for (const checkpoint of ["after-stage", "after-generation", "before-manifest"]) {
    const env = await sandbox(t),
      { options } = await approve(env, candidate()),
      before = await readSnapshot(env.root);
    await assert.rejects(
      publishImport({
        ...options,
        write: true,
        checkpoint(name) {
          if (name === checkpoint) throw new Error("Simulated I/O failure");
        },
      }),
      /Simulated/,
    );
    assert.equal((await readSnapshot(env.root)).hash, before.hash);
    assert.equal(
      (await readdir(env.root)).some((n) => n.startsWith(".import-")),
      false,
    );
    assert.equal((await publishImport({ ...options, write: true })).committed, true);
  }
});
test("post-commit failures report the committed state instead of pretending to roll it back", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  const result = await publishImport({
    ...options,
    write: true,
    checkpoint(name) {
      if (name === "after-manifest") throw new Error("After commit");
    },
  });
  assert.equal(result.committed, true);
  assert.match(result.warning, /committed/);
  assert.equal((await readSnapshot(env.root)).data.statistics.length, 1);
});
test("an existing lock prevents a second writer without deleting the first writer's lock", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  await writeFile(join(env.root, ".import-lock.json"), "owned by another process");
  await assert.rejects(publishImport({ ...options, write: true }), /exist/i);
  assert.equal(
    await readFile(join(env.root, ".import-lock.json"), "utf8"),
    "owned by another process",
  );
  assert.equal((await readSnapshot(env.root)).data.statistics.length, 0);
});
test("an actual process interruption leaves a recoverable journal and a consistent snapshot", async (t) => {
  for (const stopAt of ["after-stage", "after-manifest"]) {
    const env = await sandbox(t),
      { options } = await approve(env, candidate());
    const script =
      "import {publishImport} from " +
      JSON.stringify(pathToFileURL(resolve("scripts/statistics/imports/publish.ts")).href) +
      ";" +
      "await publishImport({..." +
      JSON.stringify(options) +
      ",write:true,checkpoint(name){if(name===" +
      JSON.stringify(stopAt) +
      ")process.exit(88)}})";
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
    });
    assert.equal(child.status, 88, child.stderr);
    const journal = JSON.parse(await readFile(join(env.root, ".import-lock.json"), "utf8"));
    await assert.rejects(recoverImport(env.root, "wrong-token"), /token/);
    const recovered = await recoverImport(env.root, journal.token);
    assert.equal(recovered.committed, stopAt === "after-manifest");
    const snapshot = await readSnapshot(env.root);
    assert.equal(snapshot.data.statistics.length, stopAt === "after-manifest" ? 1 : 0);
    assert.equal(
      (await readdir(env.root)).some((n) => n.startsWith(".import-")),
      false,
    );
  }
});
test("CLI validates arguments, produces reports, requires explicit approval and defaults to dry-run", async (t) => {
  const env = await sandbox(t),
    { prepared } = await approve(env, candidate());
  const common = ["--input-root", env.inbox, "--batch", "batch.json", "--root", env.root];
  const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  assert.equal(run(["unknown"]).status, 2);
  assert.equal(run(["approve", ...common, "--out", join(env.base, "approval")]).status, 2);
  const review = run(["review", ...common, "--out", join(env.base, "cli-review")]);
  assert.equal(review.status, 0, review.stderr);
  const approval = run([
    "approve",
    ...common,
    "--out",
    join(env.inbox, "approved"),
    "--confirm-reviewed",
    "--review-hash",
    prepared.review.reviewHash,
    "--approver",
    "test-reviewer",
    "--approved-at",
    "2026-02-02T12:00:00Z",
    "--records",
    "summary-test",
  ]);
  assert.equal(approval.status, 0, approval.stderr);
  const dry = run(["publish", ...common, "--authorization", "approved/authorization.json"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(JSON.parse(dry.stdout).committed, false);
  assert.equal((await readSnapshot(env.root)).data.statistics.length, 0);
  const published = run([
    "publish",
    ...common,
    "--authorization",
    "approved/authorization.json",
    "--write",
  ]);
  assert.equal(published.status, 0, published.stderr);
  assert.equal((await readSnapshot(env.root)).data.statistics.length, 1);
});

test("a missing image and post-approval image changes block publication", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  await writeFile(join(env.inbox, "image.png"), Buffer.from("changed"));
  await assert.rejects(publishImport({ ...options, write: true }), /blocking/);
  const batch = candidate();
  batch.sources[0].path = "missing.png";
  await putBatch(env, batch);
  assert.equal((await prepareReview(env.paths)).review.ready, false);
  assert.equal((await readSnapshot(env.root)).data.statistics.length, 0);
});
test("an alias registry change invalidates an otherwise unchanged authorization", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  await writeFile(
    join(env.inbox, "aliases.json"),
    JSON.stringify([
      { name: "AB", playerId: "abel", approvedBy: "reviewer", approvedAt: "2026-01-01T00:00:00Z" },
    ]),
  );
  await assert.rejects(publishImport({ ...options, aliasesPath: "aliases.json" }), /hash|binding/);
});
test("real exclusive-write failure preserves the snapshot and removes owned scratch files", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  const before = await readSnapshot(env.root);
  await assert.rejects(
    publishImport({
      ...options,
      write: true,
      async checkpoint(name) {
        if (name === "after-generation") {
          const journal = JSON.parse(await readFile(join(env.root, ".import-lock.json"), "utf8"));
          await writeFile(
            join(env.root, ".import-manifest-" + journal.token + ".json"),
            "occupied",
          );
        }
      },
    }),
    /exist/i,
  );
  assert.equal((await readSnapshot(env.root)).hash, before.hash);
});
test("a baseline edited during staging is not overwritten", async (t) => {
  const env = await sandbox(t),
    { options } = await approve(env, candidate());
  const original = await readFile(join(env.root, "manifest.json"), "utf8");
  await assert.rejects(
    publishImport({
      ...options,
      write: true,
      async checkpoint(name) {
        if (name === "after-generation")
          await writeFile(join(env.root, "manifest.json"), original + " ");
      },
    }),
    /Baseline changed/,
  );
  assert.equal(await readFile(join(env.root, "manifest.json"), "utf8"), original + " ");
});
test("recovery refuses a live publisher and keeps its journal", async (t) => {
  const env = await sandbox(t),
    snapshot = await readSnapshot(env.root);
  const token = "10000000-0000-4000-8000-000000000001";
  await writeFile(
    join(env.root, ".import-lock.json"),
    JSON.stringify({
      token,
      pid: process.pid,
      oldManifestHash: snapshot.manifestHash,
      newManifestHash: snapshot.manifestHash,
    }),
  );
  await assert.rejects(recoverImport(env.root, token), /still alive/);
  assert.ok((await readdir(env.root)).includes(".import-lock.json"));
});
