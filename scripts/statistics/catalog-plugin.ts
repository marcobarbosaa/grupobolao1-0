import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { manifestSchema } from "../../src/lib/statistics/schemas.ts";

const publicId = "virtual:bolao-statistics-files";
const resolvedId = "\0" + publicId;
/** Generate literal imports for the active manifest, not all retained snapshots. */
export function catalogModule(manifestInput: unknown) {
  const manifest = manifestSchema.parse(manifestInput);
  const paths = Object.values(manifest).filter(Array.isArray).flat() as string[];
  if (paths.some((path) => path.startsWith("staging/")))
    throw new Error("Staging cannot enter the published catalog");
  return {
    paths,
    code:
      paths
        .map((path, i) => `import file${i} from ${JSON.stringify("/src/data/statistics/" + path)};`)
        .join("\n") +
      "\nexport default {" +
      paths.map((path, i) => JSON.stringify(path) + ":file" + i).join(",") +
      "};\n",
  };
}
export function statisticsCatalogPlugin(): Plugin {
  let root: string;
  return {
    name: "bolao-approved-statistics-catalog",
    configResolved(config) {
      root = resolve(config.root, "src/data/statistics");
    },
    resolveId(id) {
      if (id === publicId) return resolvedId;
    },
    async load(id) {
      if (id !== resolvedId) return;
      const manifestPath = resolve(root, "manifest.json");
      this.addWatchFile(manifestPath);
      const module = catalogModule(JSON.parse(await readFile(manifestPath, "utf8")));
      module.paths.forEach((path) => this.addWatchFile(resolve(root, path)));
      return module.code;
    },
    handleHotUpdate(ctx) {
      if (ctx.file === resolve(root, "manifest.json")) {
        const module = ctx.server.moduleGraph.getModuleById(resolvedId);
        if (module) ctx.server.moduleGraph.invalidateModule(module);
        ctx.server.ws.send({ type: "full-reload" });
      }
    },
  };
}
