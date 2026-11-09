import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { validateStatisticsDirectory } from "./persistence.ts";
import { validateAppendOnly } from "../../src/lib/statistics/validate.ts";

// Roots are trusted CLI inputs; JSON paths are always confined to each chosen root.
const defaultRoot = fileURLToPath(new URL("../../src/data/statistics/", import.meta.url));
const args = process.argv.slice(2);
let root = defaultRoot;
let previousRoot: string | undefined;
for (let i = 0; i < args.length; i += 2) {
  const option = args[i];
  const value = args[i + 1];
  if (!value || !["--root", "--previous-root"].includes(option)) {
    console.error(
      "Usage: npm run stats:validate -- [--root <directory>] [--previous-root <directory>]",
    );
    process.exit(2);
  }
  if (option === "--root") root = resolve(value);
  else previousRoot = resolve(value);
}
const current = await validateStatisticsDirectory(root);
if (!current.success) {
  for (const issue of current.issues) console.error(issue.path + ": " + issue.message);
  process.exitCode = 1;
} else {
  if (previousRoot) {
    const previous = await validateStatisticsDirectory(previousRoot);
    if (!previous.success) {
      for (const issue of previous.issues)
        console.error("baseline/" + issue.path + ": " + issue.message);
      process.exitCode = 1;
    } else {
      const issues = validateAppendOnly(previous.data, current.data);
      for (const issue of issues) console.error(issue.path + ": " + issue.message);
      if (issues.length) process.exitCode = 1;
    }
  }
  if (!process.exitCode)
    console.log(
      "Statistics v1.0 valid: " +
        current.data.seasons.length +
        " seasons, " +
        current.data.statistics.length +
        " statistical revisions, " +
        current.data.games.length +
        " games, " +
        current.data.awards.length +
        " award revisions.",
    );
}
