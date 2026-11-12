import { inspectImage } from "../../../src/lib/statistics/image-header.ts";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, readdir, lstat, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import {
  candidateItemSchema,
  aliasRegistrySchema,
  type CandidateBatch,
} from "../../../src/lib/statistics/import-contracts.ts";
import { getRegisteredPlayers, seasonSchema } from "../../../src/lib/statistics/schemas.ts";
import {
  composeLocalBatch,
  identifySeason,
  inspectRelativePath,
  localLimits,
  type LocalDraft,
} from "../../../src/lib/statistics/local-import.ts";
import { normalizeImportStatistics } from "../../../src/lib/statistics/import-normalization.ts";
import { prepareReview, authorizeReview, writeReview } from "../imports/review.ts";
import { publishImport } from "../imports/publish.ts";
import { readSnapshot, sha256, verifySources, writeExclusive } from "../imports/io.ts";
import { privatePath, atomicJson, readPrivateJson } from "./storage.ts";
import { runOcr } from "./ocr.ts";

const prefix = "artifacts/statistics-imports/local";
const uuid = z.string().uuid();
const text = z.string().trim().min(1).max(200);
interface SavedDraft extends LocalDraft {
  approvalPath?: string;
  dryHash?: string;
}
export class LocalImportService {
  readonly workspace: string;
  readonly statisticsRoot: string;
  constructor(workspace: string, statisticsRoot = resolve(workspace, "src/data/statistics")) {
    this.workspace = workspace;
    this.statisticsRoot = statisticsRoot;
  }
  async draft(id: string) {
    return readPrivateJson<SavedDraft>(this.workspace, `${prefix}/${uuid.parse(id)}/draft.json`);
  }
  async save(draft: SavedDraft) {
    await atomicJson(this.workspace, `${prefix}/${draft.id}/draft.json`, draft);
    return draft;
  }
  async aliases() {
    try {
      return aliasRegistrySchema.parse(
        await readPrivateJson(this.workspace, `${prefix}/aliases.json`),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }
  async list() {
    const marker = await privatePath(this.workspace, `${prefix}/index.json`, true);
    const names = await readdir(resolve(marker, ".."));
    const drafts = [];
    for (const name of names.filter((n) => uuid.safeParse(n).success)) {
      const draft = await this.draft(name);
      drafts.push({
        id: draft.id,
        folder: draft.folder,
        files: draft.rows.length,
        published: Boolean(draft.published),
        createdAt: draft.createdAt,
      });
    }
    return {
      drafts,
      players: getRegisteredPlayers(),
      seasons: (await readSnapshot(this.statisticsRoot)).data.seasons,
      limits: localLimits,
      ocrAvailable: Boolean(process.env.BOLAO_TESSERACT),
    };
  }
  async create(folder: string) {
    if (/[\\/:]/.test(text.parse(folder)) || Array.from(folder).some((c) => c.charCodeAt(0) < 32))
      throw new Error("Nome de pasta inválido");
    const inferred = identifySeason(folder),
      existing = (await readSnapshot(this.statisticsRoot)).data.seasons.find(
        (s) => s.id === inferred?.id,
      );
    return this.save({
      id: randomUUID(),
      folder,
      season: existing ?? inferred,
      seasonConfirmed: false,
      rows: [],
      createdAt: new Date().toISOString(),
      revision: 1,
    });
  }
  async mutate(id: string, revision: number, fn: (draft: SavedDraft) => Promise<void> | void) {
    const draft = await this.draft(id);
    if (draft.published)
      throw new Error("Lote publicado. Crie outra importação para complementos.");
    if (draft.revision !== revision) throw new Error("Revisão desatualizada. Reabra o lote.");
    await fn(draft);
    draft.revision++;
    delete draft.approvalPath;
    delete draft.dryHash;
    return this.save(draft);
  }
  async upload(id: string, revision: number, relativePath: string, base64: string) {
    return this.mutate(id, revision, async (draft) => {
      const info = inspectRelativePath(relativePath, await this.aliases());
      if (info.root !== draft.folder || !info.supported)
        throw new Error("Arquivo fora da pasta ou formato não suportado");
      if (draft.rows.length >= localLimits.files) throw new Error("Limite de imagens atingido");
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
        throw new Error("Imagem codificada incorretamente");
      const bytes = Buffer.from(base64, "base64");
      if (!bytes.length || bytes.length > localLimits.fileBytes)
        throw new Error("Imagem excede limite de 25 MiB");
      inspectImage(bytes, info.extension);
      const hash = sha256(bytes);
      if (draft.rows.some((r) => r.source.source.contentHash === hash))
        throw new Error("Fonte duplicada por SHA-256: " + relativePath);
      if (draft.rows.some((r) => r.relativePath === relativePath))
        throw new Error("Caminho já importado com outro conteúdo");
      const inputRoot = await privatePath(this.workspace, `${prefix}/${id}`);
      let total = 0;
      for (const row of draft.rows)
        total += (await lstat(await privatePath(inputRoot, row.source.path))).size;
      if (total + bytes.length > localLimits.totalBytes) throw new Error("Lote excede 1 GiB");
      const rowId = randomUUID(),
        path = `images/${rowId}.${info.extension}`;
      const imagePath = await privatePath(inputRoot, path, true);
      await writeFile(imagePath, bytes, { flag: "wx", mode: 0o600 });
      const source: CandidateBatch["sources"][number] = {
        path,
        source: {
          id: "src-" + rowId,
          kind: "screenshot",
          fileName: relativePath,
          contentHash: hash,
          receivedAt: new Date().toISOString(),
          metadata: { relativePath },
        },
      };
      // Reuse exactly the source validator used immediately before official publication.
      try {
        await verifySources(inputRoot, { sources: [source] } as CandidateBatch);
      } catch (error) {
        await unlink(await privatePath(inputRoot, path));
        throw error;
      }
      draft.rows.push({
        id: rowId,
        relativePath,
        source,
        reviewed: false,
        excludedReason: "",
        item: candidateItemSchema.parse({
          id: "item-" + rowId.replace(/-/g, ""),
          kind: info.extras ? "season-extras" : "phase-summary",
          ...(!info.extras
            ? {
                player: info.playerId ? { id: info.playerId } : undefined,
                scope: "all-teams",
                availability: "available",
                values: [],
              }
            : {}),
          sourceIds: [source.source.id],
          seasonId: draft.season?.id,
        }),
      });
    });
  }
  async configure(id: string, revision: number, season: unknown, confirmed: boolean) {
    return this.mutate(id, revision, (draft) => {
      draft.season = seasonSchema.parse(season);
      draft.seasonConfirmed = confirmed;
    });
  }
  async edit(
    id: string,
    revision: number,
    rowId: string,
    itemInput: unknown,
    reviewed: boolean,
    excludedReason: string,
  ) {
    return this.mutate(id, revision, (draft) => {
      const row = draft.rows.find((r) => r.id === uuid.parse(rowId));
      if (!row) throw new Error("Arquivo não encontrado");
      const item = (
        reviewed
          ? candidateItemSchema.parse(itemInput)
          : candidateItemSchema
              .omit({ extras: true })
              .extend({ extras: z.unknown().optional() })
              .parse(itemInput)
      ) as z.infer<typeof candidateItemSchema>;
      if (item.id !== row.item.id) throw new Error("ID do candidato é permanente");
      row.item = { ...item, sourceIds: [row.source.source.id], seasonId: draft.season?.id };
      row.reviewed = reviewed;
      row.excludedReason = z.string().max(1000).parse(excludedReason);
    });
  }
  async image(id: string, rowId: string) {
    const draft = await this.draft(id),
      row = draft.rows.find((r) => r.id === uuid.parse(rowId));
    if (!row) throw new Error("Arquivo não encontrado");
    const path = await privatePath(this.workspace, `${prefix}/${id}/${row.source.path}`);
    if ((await lstat(path)).size > localLimits.fileBytes) throw new Error("Fonte excede limite");
    const bytes = await readFile(path);
    if (sha256(bytes) !== row.source.source.contentHash)
      throw new Error("A fonte foi alterada desde a importação");
    return {
      bytes,
      extension: row.source.path.split(".").at(-1),
    };
  }
  async ocr(id: string, revision: number, rowId: string, signal?: AbortSignal, processed?: string) {
    return this.mutate(id, revision, async (draft) => {
      const row = draft.rows.find((r) => r.id === uuid.parse(rowId));
      if (!row) throw new Error("Arquivo não encontrado");
      let path = await privatePath(this.workspace, `${prefix}/${id}/${row.source.path}`);
      const inputRoot = await privatePath(this.workspace, `${prefix}/${id}`);
      await verifySources(inputRoot, { sources: [row.source] } as CandidateBatch);
      if (processed) {
        const bytes = Buffer.from(processed, "base64");
        if (
          bytes.length > localLimits.fileBytes ||
          !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        )
          throw new Error("Recorte inválido");
        inspectImage(bytes, "png");
        path = await privatePath(this.workspace, `${prefix}/${id}/ocr/${randomUUID()}.png`, true);
        await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
      }
      let result: Awaited<ReturnType<typeof runOcr>>;
      try {
        result = await runOcr(path, signal);
      } finally {
        if (processed) await unlink(path);
      }
      row.ocr = {
        text: result.text.slice(0, 12000),
        confidence: result.confidence,
        warnings: result.warnings,
      };
      row.reviewed = false;
      if (row.item.kind !== "season-extras") {
        if (result.player && row.item.player && result.player.id !== row.item.player.id)
          row.ocr.warnings.push("Nome no print diverge da pasta. Confira a identidade.");
        if (result.season && identifySeason(result.season)?.id !== draft.season?.id)
          row.ocr.warnings.push("Temporada do print diverge da pasta.");
        // Never overwrite manual values. Explicitly replace them in the editor if needed.
        if (!row.item.values?.length) {
          row.item.phaseId = result.phaseId;
          row.item.screen = result.screen;
          try {
            const normalized = normalizeImportStatistics({ ...row.item, values: result.values });
            row.item.values = Object.values(normalized.stats).flatMap((group) =>
              Object.entries(group ?? {}).map(([label, value]) => {
                const precision =
                  normalized.displayPrecision[label as keyof typeof normalized.displayPrecision];
                return {
                  label,
                  value: precision === undefined ? String(value) : Number(value).toFixed(precision),
                };
              }),
            );
          } catch {
            row.ocr.warnings.push(
              "Valores OCR ambíguos. Confira o texto reconhecido e transcreva manualmente.",
            );
          }
        }
      }
    });
  }
  async paths(draft: SavedDraft) {
    const inputRoot = await privatePath(this.workspace, `${prefix}/${draft.id}`);
    return {
      inputRoot,
      batchPath: `batch-${draft.revision}.json`,
      statisticsRoot: this.statisticsRoot,
    };
  }
  async review(id: string) {
    const draft = await this.draft(id),
      paths = await this.paths(draft);
    const batch = composeLocalBatch(draft);
    const legacy = JSON.parse(
      await readFile(resolve(this.workspace, "src/data/statistics/season-extras.json"), "utf8"),
    );
    if (legacy[draft.season!.id] && batch.items.some((i) => i.kind === "season-extras"))
      throw new Error(
        "Extras históricos preservados. Sua migração requer revisão específica; este fluxo aceita Extras das novas temporadas.",
      );
    const target = await privatePath(paths.inputRoot, paths.batchPath);
    try {
      await writeExclusive(target, JSON.stringify(batch, null, 2) + "\n");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
    const prepared = await prepareReview(paths);
    await writeReview(prepared, await privatePath(paths.inputRoot, "review-" + randomUUID()));
    return prepared.review;
  }
  async approve(
    id: string,
    reviewHash: string,
    approvedBy: string,
    correctionIds: string[],
    confirmed: boolean,
  ) {
    if (confirmed !== true) throw new Error("Aprovação explícita obrigatória");
    const draft = await this.draft(id),
      paths = await this.paths(draft);
    composeLocalBatch(draft); // Recheck human review states, not only the statistical candidate.
    const prepared = await prepareReview(paths);
    const authorization = authorizeReview(prepared, {
      reviewHash,
      approvedBy: text.parse(approvedBy),
      approvedAt: new Date().toISOString(),
      recordIds: prepared.plan.batch?.items.map((i) => i.id) ?? [],
      correctionIds,
    });
    const name = "authorization-" + randomUUID() + ".json";
    await writeExclusive(
      await privatePath(paths.inputRoot, name),
      JSON.stringify(authorization, null, 2) + "\n",
    );
    draft.approvalPath = name;
    delete draft.dryHash;
    await this.save(draft);
    return { approved: true, reviewHash };
  }
  async publish(id: string, write: boolean, confirmed: boolean) {
    const draft = await this.draft(id);
    if (!draft.approvalPath) throw new Error("Lote sem aprovação");
    const paths = await this.paths(draft);
    const authBytes = await readFile(await privatePath(paths.inputRoot, draft.approvalPath));
    const hash = sha256(authBytes);
    if (write && (confirmed !== true || draft.dryHash !== hash))
      throw new Error("Confirme a publicação após um dry-run aprovado");
    const result = await publishImport({ ...paths, authorizationPath: draft.approvalPath, write });
    if (write && result.committed) {
      draft.published = { generation: result.generation, files: result.files };
      try {
        await readSnapshot(this.statisticsRoot);
        await this.save(draft);
      } catch (error) {
        return {
          ...result,
          warning:
            "Manifest publicado; verifique a validação final e o estado local antes de repetir: " +
            String(error),
        };
      }
    } else {
      draft.dryHash = hash;
      await this.save(draft);
    }
    return result;
  }
  async addAlias(name: string, playerId: string, approvedBy: string, confirmed: boolean) {
    if (confirmed !== true) throw new Error("Confirme a correspondência de nomes");
    const aliases = await this.aliases();
    const result = aliasRegistrySchema.parse([
      ...aliases,
      { name, playerId, approvedBy: text.parse(approvedBy), approvedAt: new Date().toISOString() },
    ]);
    await atomicJson(this.workspace, `${prefix}/aliases.json`, result);
    return { saved: true };
  }
}
