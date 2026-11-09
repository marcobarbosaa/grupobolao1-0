import { getRegisteredPlayers } from "./schemas.ts";
import { metricCatalog, statisticsSchema, type Statistics } from "./metrics.ts";
import type { AliasRegistry, CandidateItem } from "./import-contracts.ts";
import type { displayPrecisionSchema } from "./coverage.ts";
import type { z } from "zod";
const nameKey = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
export function resolveImportPlayer(
  player: CandidateItem["player"],
  aliases: AliasRegistry,
): string {
  if (!player) throw new Error("Player identification is missing");
  const registry = getRegisteredPlayers();
  let named: string | undefined;
  if (player.name) {
    const key = nameKey(player.name);
    const matches = new Set([
      ...registry.filter((p) => nameKey(p.name) === key).map((p) => p.id),
      ...aliases.filter((p) => nameKey(p.name) === key).map((p) => p.playerId),
    ]);
    if (matches.size !== 1)
      throw new Error(
        matches.size
          ? "Ambiguous player name"
          : "Unknown player name; an authorized alias is required",
      );
    named = [...matches][0];
  }
  if (player.id && !registry.some((p) => p.id === player.id))
    throw new Error("Unknown permanent player ID");
  if (player.id && named && player.id !== named) throw new Error("Player ID and name disagree");
  const result = player.id ?? named;
  if (!result) throw new Error("Player identification is missing");
  return result;
}
function decimalText(input: string): string {
  const [mantissa, exponentText] = input.toLowerCase().split("e");
  const exponent = Number(exponentText ?? 0);
  const [whole, fraction = ""] = mantissa.split(".");
  const digits = whole + fraction,
    point = whole.length + exponent;
  const expanded =
    point <= 0
      ? "0." + "0".repeat(-point) + digits
      : point >= digits.length
        ? digits + "0".repeat(point - digits.length)
        : digits.slice(0, point) + "." + digits.slice(point);
  const [integer, decimals = ""] = expanded.split(".");
  const tail = decimals.replace(/0+$/, "");
  return (integer.replace(/^0+(?=.)/, "") || "0") + (tail ? "." + tail : "");
}
export function normalizeImportNumber(
  raw: string | number,
  percentage: boolean,
  separator?: "." | ",",
) {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) throw new Error("Expected finite nonnegative number");
    if (Number.isInteger(raw) && !Number.isSafeInteger(raw))
      throw new Error("Numeric value exceeds safe precision");
    return { value: raw, decimals: undefined };
  }
  const token = raw.trim();
  if (!/^(?:0|[1-9][0-9]*)(?:[.,][0-9]+)?%?$/.test(token))
    throw new Error("Unrecognized numeric format");
  if (token.endsWith("%") && !percentage)
    throw new Error("Percent sign on a non-percentage metric");
  const numeric = token.replace(/%$/, "");
  const delimiter = numeric.includes(",") ? "," : numeric.includes(".") ? "." : undefined;
  if (delimiter && separator && delimiter !== separator)
    throw new Error("Decimal separator differs from declared format");
  const fractional = delimiter ? numeric.split(delimiter)[1] : undefined;
  if (!separator && fractional?.length === 3 && numeric.split(delimiter!)[0].length <= 3)
    throw new Error("Ambiguous decimal/grouping separator; declare decimalSeparator");
  const value = Number(numeric.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) throw new Error("Invalid numeric value");
  if (
    (Number.isInteger(value) && !Number.isSafeInteger(value)) ||
    decimalText(numeric.replace(",", ".")) !== decimalText(String(value))
  )
    throw new Error("Normalization would lose displayed precision");
  return { value, decimals: fractional?.length ?? 0 };
}
const ambiguous = {
  PTS: ["points", "ppg"],
  REB: ["rebounds", "rpg"],
  AST: ["assists", "apg"],
  STL: ["steals", "spg"],
  BLK: ["blocks", "bpg"],
  TO: ["turnovers", "topg"],
  TOV: ["turnovers", "topg"],
  MIN: ["minutes", "mpg"],
} as const;
const fixed: Record<string, string> = {
  GP: "gp",
  GS: "gs",
  "FG%": "fgPct",
  "3P%": "threePct",
  "FT%": "ftPct",
};
const shots: Record<string, string> = {
  FGM: "fgm",
  FGA: "fga",
  "3PM": "threePm",
  "3PA": "threePa",
  FTM: "ftm",
  FTA: "fta",
  OREB: "offensiveRebounds",
  DREB: "defensiveRebounds",
  PF: "fouls",
};
export function normalizeImportStatistics(item: CandidateItem, separator?: "." | ",") {
  const stats: Statistics = {};
  const displayPrecision: z.infer<typeof displayPrecisionSchema> = {};
  const missing: string[] = [],
    seen = new Set<string>();
  for (const entry of item.values ?? []) {
    let metric = entry.label;
    if (Object.hasOwn(ambiguous, metric)) {
      if (!item.screen) throw new Error("Screen semantics required for " + metric);
      metric = ambiguous[metric as keyof typeof ambiguous][item.screen === "totals" ? 0 : 1];
    } else if (Object.hasOwn(fixed, metric)) metric = fixed[metric];
    else if (Object.hasOwn(shots, metric)) {
      if (item.screen !== "totals")
        throw new Error("Counts require an identified totals screen: " + metric);
      metric = shots[metric];
    }
    const group = (Object.keys(metricCatalog) as (keyof Statistics)[]).find((key) =>
      Object.hasOwn(metricCatalog[key], metric),
    );
    if (!group) throw new Error("Unknown metric: " + entry.label);
    if (seen.has(metric)) throw new Error("Metric appears more than once: " + metric);
    seen.add(metric);
    if (entry.value === null) {
      missing.push(metric);
      continue;
    }
    const parsed = normalizeImportNumber(entry.value, group === "percentages", separator);
    (metricCatalog[group] as Record<string, z.ZodTypeAny>)[metric].parse(parsed.value);
    stats[group] ??= {};
    Object.assign(stats[group]!, { [metric]: parsed.value });
    if (group !== "totals" && parsed.decimals !== undefined) {
      if (parsed.decimals > 8) throw new Error("Displayed precision exceeds supported 8 decimals");
      Object.assign(displayPrecision, { [metric]: parsed.decimals });
    }
  }
  return { stats: statisticsSchema.parse(stats), displayPrecision, missing };
}
