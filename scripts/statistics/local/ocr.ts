import { spawn } from "node:child_process";
import { isAbsolute } from "node:path";
import { getRegisteredPlayers } from "../../../src/lib/statistics/schemas.ts";
import type { CandidateItem } from "../../../src/lib/statistics/import-contracts.ts";

export function interpretOcr(text: string) {
  const normalized = text.toUpperCase();
  const phases: [RegExp, CandidateItem["phaseId"]][] = [
    [/NBA FINALS/, "nba-finals"],
    [/CONFERENCE FINALS/, "conference-finals"],
    [/CONFERENCE SEMIFINALS|SEMIFINAIS/, "quarterfinals"],
    [/FIRST ROUND|PRIMEIRA RODADA/, "first-round"],
    [/REGULAR SEASON|TEMPORADA REGULAR/, "regular"],
    [/PLAYOFFS/, "playoffs"],
  ];
  const explicit = phases.slice(0, -1).filter(([re]) => re.test(normalized));
  const phaseId =
    explicit.length === 1
      ? explicit[0][1]
      : explicit.length === 0 && /PLAYOFFS/.test(normalized)
        ? "playoffs"
        : undefined;
  const totals = /\bTOTALS?\b|TOTAIS/.test(normalized),
    averages = /AVERAGES|PER GAME|MÉDIAS/.test(normalized);
  const screen =
    totals !== averages ? (totals ? ("totals" as const) : ("averages" as const)) : undefined;
  const labels = new Set([
    "GP",
    "GS",
    "PTS",
    "REB",
    "AST",
    "STL",
    "BLK",
    "TO",
    "TOV",
    "MIN",
    "FG%",
    "3P%",
    "FT%",
    "FGM",
    "FGA",
    "3PM",
    "3PA",
    "FTM",
    "FTA",
    "OREB",
    "DREB",
    "PF",
  ]);
  const number = /^(?:0|[1-9]\d*)(?:[.,]\d+)?%?$/;
  const values: NonNullable<CandidateItem["values"]> = [];
  const warnings = ["OCR é uma sugestão: confira todos os campos no original."];
  const lines = normalized.split(/\r?\n/).map((l) => l.trim().split(/\s+/));
  for (let i = 0; i < lines.length; i++) {
    const tokens = lines[i];
    if (tokens.length === 2 && labels.has(tokens[0]) && number.test(tokens[1]))
      values.push({ label: tokens[0], value: tokens[1] });
    // Conservative single-row table. Multiple rows require manual selection/transcription.
    if (tokens.length >= 3 && tokens.every((t) => labels.has(t))) {
      const next = lines[i + 1],
        following = lines[i + 2];
      if (
        next?.length === tokens.length &&
        next.every((t) => number.test(t)) &&
        !following?.every((t) => number.test(t))
      )
        tokens.forEach((label, n) => values.push({ label, value: next[n] }));
      else
        warnings.push(
          "Tabela com linhas ambíguas ou números ausentes: transcrição manual necessária.",
        );
    }
  }
  if (!phaseId) warnings.push("Fase não identificada de forma inequívoca.");
  if (!screen) warnings.push("Selecione totais ou médias antes de normalizar abreviações.");
  if (!values.length) warnings.push("Layout não reconhecido. Use a edição manual.");
  const players = getRegisteredPlayers().filter((p) => normalized.includes(p.name.toUpperCase()));
  const season = text.match(/20\d{2}\s*[-–/]\s*(?:20\d{2}|\d{2})/)?.[0];
  const type = /STANDINGS|CLASSIFICAÇÃO/.test(normalized)
    ? "standings"
    : /BRACKET|CHAVEAMENTO/.test(normalized)
      ? "bracket"
      : "player";
  if (type !== "player")
    warnings.push(
      "Extras: OCR de texto disponível; transcreva classificação e séries nos campos de revisão.",
    );
  return {
    phaseId,
    screen,
    values,
    player: players.length === 1 ? { id: players[0].id } : undefined,
    season,
    type,
    warnings,
  };
}
export function parseTsv(tsv: string) {
  const groups = new Map<string, string[]>();
  const confidences: number[] = [];
  for (const line of tsv.split(/\r?\n/).slice(1)) {
    const cells = line.split("\t");
    if (cells[0] !== "5" || cells.length < 12 || !cells[11].trim()) continue;
    const key = cells.slice(1, 5).join(":");
    const words = groups.get(key) ?? [];
    words.push(cells.slice(11).join("\t"));
    groups.set(key, words);
    const confidence = Number(cells[10]);
    if (Number.isFinite(confidence) && confidence >= 0) confidences.push(confidence);
  }
  return {
    text: [...groups.values()].map((words) => words.join(" ")).join("\n"),
    confidence: confidences.length
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : undefined,
  };
}
export async function runOcr(path: string, signal?: AbortSignal) {
  const executable = process.env.BOLAO_TESSERACT;
  if (!executable || !isAbsolute(executable))
    throw new Error(
      "OCR indisponível. Configure BOLAO_TESSERACT com o caminho absoluto do Tesseract já instalado, ou transcreva manualmente.",
    );
  const tsv = await new Promise<string>((resolve, reject) => {
    const child = spawn(executable, [path, "stdout", "-l", "eng", "--psm", "6", "tsv"], {
      shell: false,
      windowsHide: true,
      signal,
    });
    let output = "",
      error = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("OCR excedeu 60 segundos"));
    }, 60_000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 2 * 1024 * 1024) {
        child.kill();
        reject(new Error("Saída OCR excedeu limite"));
      }
    });
    child.stderr.on("data", (chunk) => {
      error = (error + chunk).slice(-4000);
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error("Tesseract: " + error));
    });
  });
  const parsed = parseTsv(tsv);
  return { ...parsed, ...interpretOcr(parsed.text) };
}
