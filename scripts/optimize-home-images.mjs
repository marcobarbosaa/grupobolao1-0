// Uses the sharp installation already available in the development environment.
// Generates derivatives only; never replaces the original player images.
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../public/jogadores/", import.meta.url));
const destination = path.join(source, "optimized");
await mkdir(destination, { recursive: true });
for (const file of await readdir(source)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  for (const width of [480, 960]) {
    await sharp(path.join(source, file))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(destination, `${path.parse(file).name}-${width}.webp`));
  }
}
console.log("Retratos WebP atualizados. Fotografias originais preservadas.");
