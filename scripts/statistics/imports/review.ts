import { resolve } from "node:path";
import {
  candidateBatchSchema,
  publicationAuthorizationSchema,
  type PublicationAuthorization,
} from "../../../src/lib/statistics/import-contracts.ts";
import { reviewCandidate, canonicalImport } from "../../../src/lib/statistics/import-validation.ts";
import { validateDataset, validateAppendOnly } from "../../../src/lib/statistics/validate.ts";
import {
  readInputJson,
  verifySources,
  readSnapshot,
  sha256,
  writeExclusive,
  createReportDirectory,
} from "./io.ts";
export interface ImportPaths {
  inputRoot: string;
  batchPath: string;
  statisticsRoot: string;
  aliasesPath?: string;
}
export async function prepareReview(paths: ImportPaths) {
  const raw = await readInputJson(paths.inputRoot, paths.batchPath);
  const baseline = await readSnapshot(paths.statisticsRoot);
  const aliases = paths.aliasesPath
    ? await readInputJson(paths.inputRoot, paths.aliasesPath)
    : { value: [], hash: sha256("[]") };
  const plan = reviewCandidate(raw.value, baseline.data, aliases.value);
  const parsed = candidateBatchSchema.safeParse(raw.value);
  let sources: Awaited<ReturnType<typeof verifySources>> = [];
  if (parsed.success) {
    try {
      sources = await verifySources(paths.inputRoot, parsed.data);
    } catch (error) {
      plan.report.issues.push({
        layer: "structural",
        path: "sources",
        message: error instanceof Error ? error.message : String(error),
      });
      plan.report.ready = false;
      plan.proposal = undefined;
    }
  }
  const review = {
    pipelineVersion: "1.0",
    candidateHash: raw.hash,
    baselineHash: baseline.hash,
    aliasesHash: aliases.hash,
    verifiedSources: sources,
    ...plan.report,
  };
  const reviewHash = sha256(canonicalImport(review));
  return { paths, baseline, plan, review: { ...review, reviewHash } };
}
export type PreparedReview = Awaited<ReturnType<typeof prepareReview>>;
export async function writeReview(prepared: PreparedReview, out: string) {
  const directory = await createReportDirectory(out, prepared.paths.statisticsRoot);
  await writeExclusive(
    resolve(directory, "review.json"),
    JSON.stringify(prepared.review, null, 2) + "\n",
  );
  const r = prepared.review;
  const sections: [string, unknown][] = [
    [
      "Fontes verificadas e reutilizadas",
      { verified: r.verifiedSources, mapping: r.sourceMapping },
    ],
    ["Registros e alterações propostas", r.changes],
    ["Conflitos que exigem decisão explícita", r.conflicts],
    ["Pendências impeditivas", r.issues],
    ["Transcrição original, contexto e observações", r.candidate],
  ];
  const markdown =
    "# Conferência do lote " +
    r.batchId +
    "\n\n" +
    (r.ready
      ? "Pronto para decisão humana; ainda não autorizado."
      : "Pendente: publicação bloqueada.") +
    "\n\nHash da revisão: " +
    r.reviewHash +
    "\n\n" +
    sections
      .map(
        ([title, data]) =>
          "## " + title + "\n\n```json\n" + JSON.stringify(data, null, 2) + "\n```\n",
      )
      .join("\n");
  await writeExclusive(resolve(directory, "review.md"), markdown);
}
function sameSet(a: string[], b: string[]) {
  return canonicalImport([...a].sort()) === canonicalImport([...b].sort());
}
export function authorizeReview(
  prepared: PreparedReview,
  decision: {
    reviewHash: string;
    approvedBy: string;
    approvedAt: string;
    recordIds: string[];
    correctionIds: string[];
  },
): PublicationAuthorization {
  if (!prepared.review.ready || !prepared.plan.batch || !prepared.plan.proposal)
    throw new Error("Review has blocking issues");
  if (decision.reviewHash !== prepared.review.reviewHash)
    throw new Error("Review hash does not match reviewed content");
  if (
    !sameSet(
      decision.recordIds,
      prepared.plan.batch.items.map((i) => i.id),
    )
  )
    throw new Error(
      "Authorization must cover exactly all candidate item IDs; split batch for partial approval",
    );
  if (
    !sameSet(
      decision.correctionIds,
      prepared.review.changes.filter((c) => c.action === "correction").map((c) => c.itemId),
    )
  )
    throw new Error("Every correction must be explicitly accepted, without extra IDs");
  if (Date.parse(decision.approvedAt) < Date.parse(prepared.plan.batch.receivedAt))
    throw new Error("Approval precedes batch receipt");
  return publicationAuthorizationSchema.parse({
    schemaVersion: "1.0",
    batchId: prepared.plan.batch.id,
    candidateHash: prepared.review.candidateHash,
    baselineHash: prepared.review.baselineHash,
    reviewHash: decision.reviewHash,
    approvedBy: decision.approvedBy,
    approvedAt: decision.approvedAt,
    recordIds: decision.recordIds,
    correctionIds: decision.correctionIds,
  });
}
export function authorizedProposal(prepared: PreparedReview, input: unknown) {
  const auth = publicationAuthorizationSchema.parse(input);
  const expected = authorizeReview(prepared, auth);
  if (canonicalImport(expected) !== canonicalImport(auth))
    throw new Error("Authorization binding does not match candidate, batch or baseline");
  const next = structuredClone(prepared.plan.proposal!);
  const batch = next.batches.find((b) => b.id === auth.batchId)!;
  batch.approvedAt = auth.approvedAt;
  batch.approvedBy = auth.approvedBy;
  const validated = validateDataset(next);
  if (!validated.success) throw new Error(JSON.stringify(validated.issues));
  const issues = validateAppendOnly(prepared.baseline.data, validated.data);
  if (issues.length) throw new Error(JSON.stringify(issues));
  return { authorization: auth, data: validated.data };
}
