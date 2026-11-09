import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareReview, writeReview, authorizeReview } from "./review.ts";
import { publishImport, recoverImport } from "./publish.ts";
import { writeExclusive, createReportDirectory } from "./io.ts";
const help =
  "Commands: prepare|review|approve|publish|recover. Inputs: --input-root DIR --batch FILE --root STATISTICS [--aliases FILE]. Reports: --out NEW_DIR. Approval: --confirm-reviewed --review-hash HASH --approver NAME --approved-at ISO --records ID,ID [--corrections ID,ID]. Publish: --authorization FILE [--dry-run|--write]. Recovery: --token TOKEN --confirm-recovery.";
try {
  const [command, ...args] = process.argv.slice(2);
  if (!["prepare", "review", "approve", "publish", "recover"].includes(command))
    throw new SyntaxError(help);
  const values = new Map<string, string>(),
    flags = new Set<string>();
  const known = [
    "--input-root",
    "--batch",
    "--root",
    "--aliases",
    "--out",
    "--review-hash",
    "--approver",
    "--approved-at",
    "--records",
    "--corrections",
    "--authorization",
    "--token",
  ];
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (values.has(key) || flags.has(key)) throw new SyntaxError("Duplicate option: " + key);
    if (["--confirm-reviewed", "--dry-run", "--write", "--confirm-recovery"].includes(key))
      flags.add(key);
    else {
      if (!known.includes(key) || !args[i + 1] || args[i + 1].startsWith("--"))
        throw new SyntaxError(help);
      values.set(key, args[++i]);
    }
  }
  const required = (key: string) => {
    const value = values.get(key);
    if (!value) throw new SyntaxError("Missing " + key);
    return value;
  };
  const root = resolve(
    values.get("--root") ??
      fileURLToPath(new URL("../../../src/data/statistics/", import.meta.url)),
  );
  if (command === "recover") {
    if (!flags.has("--confirm-recovery"))
      throw new SyntaxError("Recovery requires --confirm-recovery");
    console.log(JSON.stringify(await recoverImport(root, required("--token")), null, 2));
  } else {
    const paths = {
      inputRoot: resolve(required("--input-root")),
      batchPath: required("--batch"),
      statisticsRoot: root,
      aliasesPath: values.get("--aliases"),
    };
    if (command === "publish") {
      if (flags.has("--write") && flags.has("--dry-run"))
        throw new SyntaxError("Choose write or dry-run");
      console.log(
        JSON.stringify(
          await publishImport({
            ...paths,
            authorizationPath: required("--authorization"),
            write: flags.has("--write"),
          }),
          null,
          2,
        ),
      );
    } else {
      if (flags.has("--write") || flags.has("--dry-run"))
        throw new SyntaxError("Only publish accepts write/dry-run");
      const prepared = await prepareReview(paths);
      if (command === "approve") {
        if (!flags.has("--confirm-reviewed"))
          throw new SyntaxError(
            "Approval requires --confirm-reviewed after explicit human approval",
          );
        const authorization = authorizeReview(prepared, {
          reviewHash: required("--review-hash"),
          approvedBy: required("--approver"),
          approvedAt: required("--approved-at"),
          recordIds: required("--records").split(","),
          correctionIds: values.get("--corrections")?.split(",") ?? [],
        });
        const out = await createReportDirectory(resolve(required("--out")), root);
        await writeExclusive(
          resolve(out, "authorization.json"),
          JSON.stringify(authorization, null, 2) + "\n",
        );
        console.log("Operational authorization saved; no statistics were published.");
      } else {
        await writeReview(prepared, resolve(required("--out")));
        console.log(
          JSON.stringify(
            {
              ready: prepared.review.ready,
              reviewHash: prepared.review.reviewHash,
              issues: prepared.review.issues,
            },
            null,
            2,
          ),
        );
        if (!prepared.review.ready) process.exitCode = 1;
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof SyntaxError ? 2 : 1;
}
