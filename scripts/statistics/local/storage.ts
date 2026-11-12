import { lstat, mkdir, realpath, readFile, rename, open } from "node:fs/promises";
import { resolve, relative, sep, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";

/** Reject every symlink/junction, including ancestors inside the authorized checkout. */
export async function privatePath(base: string, relativePath: string, createParents = false) {
  if (
    !/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(relativePath) ||
    relativePath.split("/").some((p) => p === ".." || p === ".")
  )
    throw new Error("Caminho privado inválido");
  const root = await realpath(base);
  const parts = relativePath.split("/");
  let cursor = root;
  for (let i = 0; i < parts.length; i++) {
    cursor = resolve(cursor, parts[i]);
    try {
      const info = await lstat(cursor);
      if (info.isSymbolicLink() || (i < parts.length - 1 && !info.isDirectory()))
        throw new Error("Links e caminhos não regulares recusados");
      const actual = await realpath(cursor),
        rel = relative(root, actual);
      if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith(".." + sep))
        throw new Error("Caminho escapou da área autorizada");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      if (i < parts.length - 1) {
        if (!createParents) throw error;
        await mkdir(cursor, { mode: 0o700 });
      }
    }
  }
  return cursor;
}
export async function atomicJson(base: string, path: string, value: unknown) {
  const target = await privatePath(base, path, true);
  const temporary = await privatePath(base, path + "." + randomUUID() + ".tmp");
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, target);
}
export async function readPrivateJson<T>(base: string, path: string): Promise<T> {
  const target = await privatePath(base, path);
  if ((await lstat(target)).size > 8 * 1024 * 1024) throw new Error("JSON privado excedeu limite");
  return JSON.parse(await readFile(target, "utf8")) as T;
}
