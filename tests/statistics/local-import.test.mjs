import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createServer, request } from "node:http";
import { sandbox, candidate, imageBytes, putBatch, approve } from "./import-fixtures.mjs";
import {
  identifySeason,
  inspectRelativePath,
  composeLocalBatch,
} from "../../src/lib/statistics/local-import.ts";
import { inspectImage } from "../../src/lib/statistics/image-header.ts";
import { extrasContentSchema } from "../../src/lib/statistics/extras.ts";
import { interpretOcr, parseTsv } from "../../scripts/statistics/local/ocr.ts";
import {
  authorizeLocalRequest,
  LOCAL_ORIGIN,
  LOCAL_PORT,
} from "../../scripts/statistics/local/security.ts";
import { privatePath } from "../../scripts/statistics/local/storage.ts";
import { LocalImportService } from "../../scripts/statistics/local/service.ts";
import { createLocalHandler } from "../../scripts/statistics/local/server.ts";
import { createPublishedCatalog } from "../../src/lib/statistics/catalog.ts";
import { catalogModule } from "../../scripts/statistics/catalog-plugin.ts";
import { prepareReview } from "../../scripts/statistics/imports/review.ts";
import { publishImport } from "../../scripts/statistics/imports/publish.ts";
import { readSnapshot } from "../../scripts/statistics/imports/io.ts";

test("folder years identify edition 04, subsequent years and invalid labels", () => {
  for (const name of ["Temporada 2008-2009", "2008/09", "2008–09"])
    assert.equal(identifySeason(name).id, "season-004");
  assert.equal(identifySeason("2009-2010").edition, 5);
  assert.equal(identifySeason("Temporada 04"), undefined);
  assert.equal(identifySeason("2008-2010"), undefined);
});
test("folder inspection preserves relative paths, registered IDs and unknown folders", () => {
  assert.equal(inspectRelativePath("Temporada 2008-2009/Abel/arbitrário.JPG").playerId, "abel");
  assert.equal(inspectRelativePath("Temporada 2008-2009/Extras/x.png").extras, true);
  assert.equal(inspectRelativePath("Temporada 2008-2009/Desconhecido/x.png").unknown, true);
  assert.equal(inspectRelativePath("T/Abel/x.gif").supported, false);
  const aliases = [
    {
      name: "Nome autorizado",
      playerId: "abel",
      approvedBy: "teste",
      approvedAt: "2026-01-01T00:00:00Z",
    },
  ];
  assert.equal(inspectRelativePath("T/Nome autorizado/a.png", aliases).playerId, "abel");
  for (const path of [
    "../a.png",
    "C:/x/a.png",
    "T/../a.png",
    "/T/A/x.png",
    "T\\A\\x.png",
    "T/A./x.png",
  ])
    assert.throws(() => inspectRelativePath(path));
});
test("image headers reject fake types, corrupted images and excessive dimensions", () => {
  assert.deepEqual(inspectImage(imageBytes, "png"), { width: 1, height: 1 });
  assert.throws(() => inspectImage(imageBytes, "jpg"));
  assert.throws(() => inspectImage(Buffer.from("not an image at all"), "png"));
  const huge = Buffer.from(imageBytes);
  huge.writeUInt32BE(100000, 16);
  huge.writeUInt32BE(100000, 20);
  assert.throws(() => inspectImage(huge, "png"));
});
test("OCR never fills absent numbers, infers rounds conservatively and exposes Extras as manual", () => {
  assert.deepEqual(interpretOcr("Regular Season\nAVERAGES\nGP PTS AST\n82 27.4").values, []);
  assert.deepEqual(
    interpretOcr("Regular Season\nAVERAGES\nGP PTS AST\n82 27.4 0").values.map((v) => v.value),
    ["82", "27.4", "0"],
  );
  for (const [name, id] of [
    ["Regular Season", "regular"],
    ["Playoffs", "playoffs"],
    ["First Round", "first-round"],
    ["Conference Semifinals", "quarterfinals"],
    ["Conference Finals", "conference-finals"],
    ["NBA Finals", "nba-finals"],
  ])
    assert.equal(interpretOcr(name).phaseId, id);
  assert.equal(interpretOcr("First Round\nNBA Finals").phaseId, undefined);
  assert.equal(interpretOcr("STANDINGS WEST").type, "standings");
  assert.equal(interpretOcr("BRACKET PLAYOFFS").type, "bracket");
  const parsed = parseTsv(
    "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t0\t0\t20\t20\t91\tPTS\n5\t1\t1\t1\t1\t2\t20\t0\t20\t20\t93\t12",
  );
  assert.equal(parsed.text, "PTS 12");
  assert.equal(parsed.confidence, 92);
});
const series = {
  conference: "west",
  round: "first-round",
  homeTeam: "AAA",
  awayTeam: "BBB",
  homeWins: 4,
  awayWins: 2,
  winner: "AAA",
};
test("Extras accept partial observations but reject standings/bracket and winner conflicts", () => {
  const data = {
    standings: { west: [{ rank: 1, team: "AAA", wins: 60, losses: 22, pct: 0.732 }] },
    playoffs: { matches: [series] },
  };
  assert.equal(extrasContentSchema.safeParse(data).success, true);
  assert.equal(
    extrasContentSchema.safeParse({ ...data, standings: { west: [{ rank: 9, team: "AAA" }] } })
      .success,
    false,
  );
  assert.equal(
    extrasContentSchema.safeParse({
      playoffs: {
        matches: [
          series,
          { ...series, round: "quarterfinals", homeTeam: "BBB", awayTeam: "CCC", winner: "BBB" },
        ],
      },
    }).success,
    false,
  );
  assert.equal(
    extrasContentSchema.safeParse({ playoffs: { matches: [series], champion: "AAA" } }).success,
    false,
  );
  assert.equal(
    extrasContentSchema.safeParse({
      standings: {
        west: [
          { rank: 1, team: "AAA" },
          { rank: 1, team: "BBB" },
        ],
      },
    }).success,
    false,
  );
});
test("local request authorization enforces origin, host, loopback, expiry and session", () => {
  const req = {
    headers: {
      host: `127.0.0.1:${LOCAL_PORT}`,
      origin: LOCAL_ORIGIN,
      authorization: "Bearer secret",
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  assert.doesNotThrow(() => authorizeLocalRequest(req, "secret", 2000, 1000));
  for (const headers of [
    { origin: "https://evil.example" },
    { host: `evil.example:${LOCAL_PORT}` },
    { authorization: "Bearer wrong" },
    { origin: undefined },
    { "sec-fetch-site": "cross-site" },
  ])
    assert.throws(() =>
      authorizeLocalRequest(
        { ...req, headers: { ...req.headers, ...headers } },
        "secret",
        2000,
        1000,
      ),
    );
  assert.throws(() =>
    authorizeLocalRequest(
      { ...req, socket: { remoteAddress: "192.168.0.2" } },
      "secret",
      2000,
      1000,
    ),
  );
  assert.throws(() => authorizeLocalRequest(req, "secret", 2000, 3000));
});
test("private storage rejects traversal, absolute paths and junctions", async (t) => {
  const env = await sandbox(t);
  for (const path of [
    "../secret.json",
    "C:/secret.json",
    "/secret.json",
    "a/../b.json",
    "a\\b.json",
  ])
    await assert.rejects(privatePath(env.base, path));
  await symlink(env.root, join(env.inbox, "linked"), "junction");
  await assert.rejects(privatePath(env.inbox, "linked/manifest.json"), /Links/);
});
async function local(t) {
  const env = await sandbox(t);
  await mkdir(join(env.base, "src/data/statistics"), { recursive: true });
  await writeFile(join(env.base, "src/data/statistics/season-extras.json"), "{}");
  return { ...env, service: new LocalImportService(env.base, env.root) };
}
async function reviewedDraft(service) {
  let draft = await service.create("Temporada 2008-2009");
  draft = await service.upload(
    draft.id,
    draft.revision,
    "Temporada 2008-2009/Abel/qualquer.png",
    imageBytes.toString("base64"),
  );
  draft = await service.configure(draft.id, draft.revision, draft.season, true);
  const row = draft.rows[0];
  return service.edit(
    draft.id,
    draft.revision,
    row.id,
    {
      ...row.item,
      phaseId: "regular",
      values: [
        { label: "ppg", value: "27.40" },
        { label: "gp", value: "82" },
      ],
    },
    true,
    "",
  );
}
test("end-to-end local review, approval, dry-run, publication, recovery of session and season 04 catalog", async (t) => {
  const { service, root, base } = await local(t);
  let draft = await reviewedDraft(service);
  await assert.rejects(
    service.upload(
      draft.id,
      draft.revision,
      "Temporada 2008-2009/Abel/duplicado.png",
      imageBytes.toString("base64"),
    ),
    /duplicada/,
  );
  await assert.rejects(service.publish(draft.id, true, true), /aprovação/);
  const review = await service.review(draft.id);
  assert.equal(review.ready, true, JSON.stringify(review.issues));
  await assert.rejects(
    service.approve(draft.id, review.reviewHash, "test", [], false),
    /explícita/,
  );
  await assert.rejects(service.approve(draft.id, "0".repeat(64), "test", [], true), /hash/);
  await service.approve(draft.id, review.reviewHash, "synthetic reviewer", [], true);
  await assert.rejects(service.publish(draft.id, true, true), /dry-run/);
  const before = await readFile(join(root, "manifest.json"), "utf8");
  assert.equal((await service.publish(draft.id, false, false)).mode, "dry-run");
  assert.equal(await readFile(join(root, "manifest.json"), "utf8"), before);
  const published = await service.publish(draft.id, true, true);
  assert.equal(published.committed, true);
  draft = await new LocalImportService(base, root).draft(draft.id);
  assert.equal(draft.published.generation, published.generation);
  const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
  const files = {};
  for (const paths of Object.values(manifest).filter(Array.isArray))
    for (const path of paths) files[path] = JSON.parse(await readFile(join(root, path), "utf8"));
  const catalog = createPublishedCatalog(manifest, files);
  const generated = catalogModule(manifest);
  assert.ok(generated.code.includes(published.generation + "/seasons.json"));
  assert.equal(generated.code.includes("staging/"), false);
  assert.equal(catalog.seasons[0].id, "season-004");
  assert.equal(catalog.seasons[0].year, "2008/09");
  assert.equal(catalog.records[0].stats.averages.ppg, 27.4);
  assert.equal(catalog.records[0].stats.totals.points, undefined);
});
test("manual edits invalidate approvals and stale sessions cannot overwrite drafts", async (t) => {
  const { service } = await local(t);
  let draft = await reviewedDraft(service);
  const review = await service.review(draft.id);
  await service.approve(draft.id, review.reviewHash, "test", [], true);
  const row = draft.rows[0];
  const next = await service.edit(draft.id, draft.revision, row.id, row.item, false, "");
  await assert.rejects(
    service.edit(draft.id, draft.revision, row.id, row.item, true, ""),
    /desatualizada/,
  );
  await assert.rejects(service.publish(next.id, false, false), /aprovação/);
  await assert.rejects(service.review(next.id), /Revise/);
});

test("unfinished Extras can be saved and resumed but cannot be approved", async (t) => {
  const { service } = await local(t);
  let draft = await reviewedDraft(service);
  const row = draft.rows[0];
  const item = { id: row.item.id, kind: "season-extras", extras: { standings: { west: [{}] } } };
  draft = await service.edit(draft.id, draft.revision, row.id, item, false, "");
  assert.deepEqual((await service.draft(draft.id)).rows[0].item.extras.standings.west, [{}]);
  await assert.rejects(service.review(draft.id), /Revise/);
  await assert.rejects(service.edit(draft.id, draft.revision, row.id, item, true, ""));
});
test("source tampering and invalid statistics block review", async (t) => {
  const { service, base } = await local(t);
  let draft = await reviewedDraft(service),
    row = draft.rows[0];
  draft = await service.edit(
    draft.id,
    draft.revision,
    row.id,
    { ...row.item, values: [{ label: "fgPct", value: "101" }] },
    true,
    "",
  );
  await assert.rejects(service.review(draft.id));
  draft = await service.edit(draft.id, draft.revision, row.id, row.item, true, "");
  await writeFile(
    join(base, "artifacts/statistics-imports/local", draft.id, row.source.path),
    Buffer.from("tampered"),
  );
  assert.equal((await service.review(draft.id)).ready, false);
});
test("complementary screenshots merge without duplicating phases; conflicting metrics are refused", async (t) => {
  const { service } = await local(t);
  const draft = await reviewedDraft(service);
  const other = structuredClone(draft.rows[0]);
  other.item.id = "other";
  other.id = "other";
  other.source.source.id = "other-source";
  other.item.values = [{ label: "points", value: "2247" }];
  draft.rows.push(other);
  assert.equal(composeLocalBatch(draft).items.length, 1);
  other.item.values = [{ label: "ppg", value: "28" }];
  assert.throws(() => composeLocalBatch(draft), /conflitantes/);
});
test("Extras share authorization, manifest transaction and append-only corrections", async (t) => {
  const env = await sandbox(t),
    batch = candidate();
  batch.items = [
    {
      id: "extra-test",
      kind: "season-extras",
      seasonId: "season-003",
      sourceIds: ["source-test"],
      extras: { playoffs: { matches: [series] } },
    },
  ];
  await putBatch(env, batch);
  assert.equal((await prepareReview(env.paths)).review.ready, true);
  const { options } = await approve(env, batch);
  const before = await readFile(join(env.root, "manifest.json"), "utf8");
  await assert.rejects(
    publishImport({
      ...options,
      write: true,
      checkpoint: (name) => {
        if (name === "before-manifest") throw new Error("synthetic failure");
      },
    }),
    /synthetic/,
  );
  assert.equal(await readFile(join(env.root, "manifest.json"), "utf8"), before);
  await publishImport({ ...options, write: true });
  let snapshot = await readSnapshot(env.root);
  assert.equal(snapshot.data.extras.length, 1);
  batch.id = "extras-correction";
  batch.items[0].extras.playoffs.matches[0] = { ...series, awayWins: 3 };
  await putBatch(env, batch);
  assert.equal((await prepareReview(env.paths)).review.ready, false);
  batch.items[0].correction = { expectedRevision: 1, reason: "synthetic correction" };
  const approved = await approve(env, batch);
  await publishImport({ ...approved.options, write: true });
  snapshot = await readSnapshot(env.root);
  assert.deepEqual(
    snapshot.data.extras.map((e) => e.revision),
    [1, 2],
  );
});
test("public route tree and production config never register administrative operations", async () => {
  const config = await readFile(new URL("../../vite.config.ts", import.meta.url), "utf8");
  const routes = await readFile(new URL("../../src/routeTree.gen.ts", import.meta.url), "utf8");
  assert.equal(config.includes("local/server"), false);
  assert.equal(routes.includes("/__bolao"), false);
});
test("HTTP rejects unauthorized writes and supports authenticated same-origin requests", async (t) => {
  const { service } = await local(t);
  const server = createServer(createLocalHandler(service, "secret"));
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  t.after(() => new Promise((ok) => server.close(ok)));
  const url = `http://127.0.0.1:${server.address().port}/__bolao/api/list`;
  assert.equal((await fetch(url, { method: "POST", body: "{}" })).status, 400);
  const response = await new Promise((ok, fail) => {
    const req = request(
      url,
      {
        method: "POST",
        headers: {
          host: `127.0.0.1:${LOCAL_PORT}`,
          origin: LOCAL_ORIGIN,
          authorization: "Bearer secret",
          "content-type": "application/json",
        },
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => ok({ status: res.statusCode, result: JSON.parse(text) }));
      },
    );
    req.on("error", fail);
    req.end("{}");
  });
  assert.equal(response.status, 200, JSON.stringify(response.result));
  assert.ok(Array.isArray(response.result.players));
});
