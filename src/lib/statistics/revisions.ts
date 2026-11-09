import { validateDataset } from "./validate.ts";
import type { StatisticalRecord } from "./derived-types.ts";
import type { StatisticsDataset } from "./types.ts";

export class StatisticalInputError extends Error {
  readonly issues: readonly { path: string; message: string }[];
  constructor(issues: readonly { path: string; message: string }[]) {
    super(issues.map((issue) => issue.path + ": " + issue.message).join("\n"));
    this.name = "StatisticalInputError";
    this.issues = issues;
  }
}
/** Validate the entire audit chain before selecting, including records outside a query. */
export function selectCurrentRevisions(input: unknown): {
  dataset: StatisticsDataset;
  records: StatisticalRecord[];
} {
  const validation = validateDataset(input);
  if (!validation.success) throw new StatisticalInputError(validation.issues);
  const current = new Map<string, StatisticalRecord>();
  for (const record of validation.data.statistics) {
    const previous = current.get(record.id);
    if (!previous || record.revision > previous.revision) current.set(record.id, record);
  }
  for (const record of current.values()) {
    if (
      record.stats.totals?.gp === 0 &&
      Object.values(record.stats.totals).some((value) => value !== undefined && value > 0)
    )
      throw new StatisticalInputError([
        { path: "statistics." + record.id, message: "Positive totals contradict zero appearances" },
      ]);
  }
  return {
    dataset: validation.data,
    records: [...current.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}
