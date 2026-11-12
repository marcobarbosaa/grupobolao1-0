import { z } from "zod";
import { resolveImportPlayer, normalizeImportStatistics } from "./import-normalization.ts";
import {
  candidateItemSchema,
  type AliasRegistry,
  type CandidateBatch,
  type CandidateItem,
} from "./import-contracts.ts";
import { phaseCatalog } from "./phases.ts";
import { seasonSchema } from "./schemas.ts";
import { extrasContentSchema } from "./extras.ts";

export const localLimits = {
  files: 500,
  fileBytes: 25 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
  pixels: 32_000_000,
};
export function inspectRelativePath(path: string, aliases: AliasRegistry = []) {
  if (
    path.length > 500 ||
    /[\\:]/.test(path) ||
    Array.from(path).some((c) => c.charCodeAt(0) < 32) ||
    path.split("/").some((p) => !p || p === "." || p === ".." || /[. ]$/.test(p))
  )
    throw new Error("Caminho relativo inválido");
  const parts = path.split("/");
  const extension = parts.at(-1)!.split(".").at(-1)!.toLowerCase();
  const folder = parts[1];
  let playerId: string | undefined;
  if (folder && folder.toLowerCase() !== "extras") {
    try {
      playerId = resolveImportPlayer({ name: folder }, aliases);
    } catch {
      /* explicit review */
    }
  }
  return {
    root: parts[0],
    folder,
    extension,
    playerId,
    extras: folder?.toLowerCase() === "extras",
    supported: parts.length >= 3 && ["jpg", "jpeg", "png", "webp"].includes(extension),
    unknown: !playerId && folder?.toLowerCase() !== "extras",
  };
}
export function identifySeason(name: string) {
  const match = /^(?:Temporada\s+)?(20\d{2})\s*[-–/]\s*(20\d{2}|\d{2})$/i.exec(name.trim());
  if (!match) return undefined;
  const start = Number(match[1]),
    end = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  if (end !== start + 1 || start < 2005) return undefined;
  const edition = start - 2004;
  return seasonSchema.parse({
    id: `season-${String(edition).padStart(3, "0")}`,
    edition,
    label: `${start}–${String(end).slice(-2)} · Temporada ${String(edition).padStart(2, "0")}`,
    sport: "basquete",
    status: "completed",
    phases: phaseCatalog,
  });
}
export const localRowSchema = z.object({
  id: z.string().uuid(),
  relativePath: z.string().max(500),
  source: z.custom<CandidateBatch["sources"][number]>(),
  item: candidateItemSchema,
  reviewed: z.boolean(),
  excludedReason: z.string().max(1000),
  ocr: z
    .object({ text: z.string(), confidence: z.number().optional(), warnings: z.array(z.string()) })
    .optional(),
});
export type LocalRow = z.infer<typeof localRowSchema>;
export interface LocalDraft {
  id: string;
  folder: string;
  season?: z.infer<typeof seasonSchema>;
  seasonConfirmed: boolean;
  rows: LocalRow[];
  createdAt: string;
  revision: number;
  published?: { generation: string; files: string[] };
}

/** Merge complementary screenshots, never prefer one conflicting observation silently. */
export function composeLocalBatch(draft: LocalDraft): CandidateBatch {
  if (!draft.season || !draft.seasonConfirmed)
    throw new Error("Confirme os metadados da temporada");
  const rows = draft.rows.filter((r) => !r.excludedReason.trim());
  if (!rows.length || rows.some((r) => !r.reviewed))
    throw new Error("Revise todos os arquivos incluídos");
  const groups = new Map<string, CandidateItem>();
  for (const row of rows) {
    const item = candidateItemSchema.parse({
      ...row.item,
      seasonId: draft.season.id,
      sourceIds: [row.source.source.id],
    });
    if (item.unrecognizedFields.length)
      throw new Error("Resolva os campos não reconhecidos: " + row.relativePath);
    if (item.kind === "season-extras") {
      const existing = groups.get("extras");
      if (!existing) groups.set("extras", item);
      else {
        const a = existing.extras ?? {},
          b = item.extras ?? {};
        const standings = { ...a.standings };
        for (const c of ["east", "west"] as const) {
          const merged = [...(a.standings?.[c] ?? [])];
          for (const value of b.standings?.[c] ?? []) {
            const previous = merged.find((r) => r.team === value.team);
            if (previous && JSON.stringify(previous) !== JSON.stringify(value))
              throw new Error("Classificações conflitantes: " + value.team);
            if (!previous) merged.push(value);
          }
          if (merged.length) standings[c] = merged.sort((x, y) => x.rank - y.rank);
        }
        const matches = [...(a.playoffs?.matches ?? [])];
        for (const match of b.playoffs?.matches ?? []) {
          const previous = matches.find(
            (m) =>
              m.round === match.round &&
              [m.homeTeam, m.awayTeam].some((t) => [match.homeTeam, match.awayTeam].includes(t)),
          );
          if (previous && JSON.stringify(previous) !== JSON.stringify(match))
            throw new Error("Séries conflitantes");
          if (!previous) matches.push(match);
        }
        if (
          a.playoffs?.champion &&
          b.playoffs?.champion &&
          a.playoffs.champion !== b.playoffs.champion
        )
          throw new Error("Campeões conflitantes");
        const logos = { ...a.logos };
        for (const [team, logo] of Object.entries(b.logos ?? {})) {
          if (logos[team] && JSON.stringify(logos[team]) !== JSON.stringify(logo))
            throw new Error("Escudos conflitantes: " + team);
          logos[team] = logo;
        }
        existing.extras = extrasContentSchema.parse({
          ...(Object.keys(logos).length ? { logos } : {}),
          ...(Object.keys(standings).length ? { standings } : {}),
          ...(matches.length
            ? { playoffs: { matches, champion: a.playoffs?.champion ?? b.playoffs?.champion } }
            : {}),
        });
        existing.sourceIds!.push(...item.sourceIds!);
      }
      continue;
    }
    if (!["season-summary", "phase-summary"].includes(item.kind))
      throw new Error("Tipo de tela não suportado na interface local");
    if (!item.player?.id || !item.phaseId)
      throw new Error("Identifique jogador e fase: " + row.relativePath);
    const normalized = normalizeImportStatistics(item);
    const values = Object.values(normalized.stats).flatMap((group) =>
      Object.entries(group ?? {}).map(([label, value]) => {
        const precision =
          normalized.displayPrecision[label as keyof typeof normalized.displayPrecision];
        return {
          label,
          value: precision === undefined ? String(value) : Number(value).toFixed(precision),
        };
      }),
    );
    if (!values.length) throw new Error("Nenhum número observado: " + row.relativePath);
    const key = [item.player.id, item.phaseId, item.scope, item.teamId].join(":");
    const existing = groups.get(key);
    if (!existing) groups.set(key, { ...item, values, screen: undefined });
    else {
      if (JSON.stringify(existing.correction) !== JSON.stringify(item.correction))
        throw new Error("Correções incompatíveis entre screenshots");
      for (const value of values) {
        const previous = existing.values!.find((v) => v.label === value.label);
        if (previous && Number(previous.value) !== Number(value.value))
          throw new Error("Valores conflitantes: " + key + " / " + value.label);
        if (!previous) existing.values!.push(value);
      }
      existing.sourceIds!.push(...item.sourceIds!);
    }
  }
  return {
    schemaVersion: "1.0",
    id: draft.id.replace(/-/g, "") + "-" + draft.revision,
    receivedAt: new Date().toISOString(),
    sources: rows.map((r) => r.source),
    entities: {
      seasons: [{ value: draft.season, sourceIds: [rows[0].source.source.id] }],
      teams: [],
      games: [],
    },
    items: [...groups.values()],
    notes: draft.rows
      .filter((r) => r.excludedReason.trim())
      .map((r) => `Excluído ${r.relativePath}: ${r.excludedReason}`),
  };
}
