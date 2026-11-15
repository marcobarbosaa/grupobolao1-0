import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Bundle the public source of truth without importing a public URL as JavaScript. */
export function playerHistoryPlugin(): Plugin {
  const id = "virtual:bolao-player-history";
  let root: string;
  let manifest: string;
  return {
    name: "bolao-player-history",
    configResolved(config) {
      root = config.publicDir;
      manifest = resolve(root, "jogadores/rotas/manifest.json");
    },
    resolveId(source) {
      if (source === id) return "\0" + id;
    },
    async load(source) {
      if (source !== "\0" + id) return;
      this.addWatchFile(manifest);
      const data = JSON.parse(await readFile(manifest, "utf8"));
      const files = await readdir(resolve(root, "jogadores/escudos/historicos"), {
        recursive: true,
      });
      const crests = files
        .filter((file) => /\.(png|svg)$/.test(file))
        .map((file) => "/jogadores/escudos/historicos/" + file.replaceAll("\\", "/"));
      return `export default ${JSON.stringify(data)}; export const localCrests = ${JSON.stringify(crests)};`;
    },
    handleHotUpdate(ctx) {
      if (ctx.file !== manifest) return;
      const module = ctx.server.moduleGraph.getModuleById("\0" + id);
      if (module) ctx.server.moduleGraph.invalidateModule(module);
      ctx.server.ws.send({ type: "full-reload" });
    },
  };
}
