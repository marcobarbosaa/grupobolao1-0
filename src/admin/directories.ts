import { inspectImage } from "../lib/statistics/image-header";
import { localLimits, inspectRelativePath } from "../lib/statistics/local-import";

export interface SelectedFile {
  path: string;
  file: File;
}
export async function readDroppedEntries(items: DataTransferItemList, signal: AbortSignal) {
  // Capture entries synchronously while the drag data store is readable.
  const roots = Array.from(items)
    .map((item) => item.webkitGetAsEntry())
    .filter((e): e is FileSystemEntry => Boolean(e));
  if (roots.length !== 1 || !roots[0].isDirectory)
    throw new Error("Arraste uma única pasta de temporada");
  const files: SelectedFile[] = [];
  let visited = 0;
  async function visit(entry: FileSystemEntry, parent: string, depth: number) {
    signal.throwIfAborted();
    if (++visited > 5000 || depth > 12 || files.length >= localLimits.files)
      throw new Error("Pasta excede os limites de profundidade ou arquivos");
    const path = parent ? parent + "/" + entry.name : entry.name;
    if (entry.isFile) {
      const file = await new Promise<File>((ok, fail) =>
        (entry as FileSystemFileEntry).file(ok, fail),
      );
      files.push({ path, file });
    } else {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // Chromium returns at most 100 entries per call. Continue until exhausted.
      for (;;) {
        const entries = await new Promise<FileSystemEntry[]>((ok, fail) =>
          reader.readEntries(ok, fail),
        );
        if (!entries.length) break;
        for (const child of entries) await visit(child, path, depth + 1);
      }
    }
  }
  await visit(roots[0], "", 0);
  return files;
}
export function validateSelection(files: SelectedFile[]) {
  if (!files.length || files.length > localLimits.files)
    throw new Error("Selecione de 1 a 500 arquivos");
  const roots = new Set(files.map((f) => inspectRelativePath(f.path).root));
  if (roots.size !== 1) throw new Error("Selecione somente uma pasta de temporada");
  if (files.reduce((total, f) => total + f.file.size, 0) > localLimits.totalBytes)
    throw new Error("Pasta excede 1 GiB");
  return [...roots][0];
}
export async function encodeImage(file: File) {
  if (!file.size || file.size > localLimits.fileBytes)
    throw new Error("Arquivo vazio ou maior que 25 MiB");
  inspectImage(
    new Uint8Array(await file.arrayBuffer()),
    file.name.split(".").at(-1)!.toLowerCase(),
  );
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > localLimits.pixels)
      throw new Error("Imagem excede 32 megapixels");
  } finally {
    bitmap.close();
  }
  return toBase64(file);
}
export function toBase64(blob: Blob): Promise<string> {
  return new Promise((ok, fail) => {
    const reader = new FileReader();
    reader.onload = () => ok(String(reader.result).split(",")[1]);
    reader.onerror = () => fail(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(blob);
  });
}
/** Optional grayscale/contrast crop. Original source bytes never change. */
export async function preprocessImage(blob: Blob, crop: number[]) {
  const bitmap = await createImageBitmap(blob);
  try {
    const [left, top, width, height] = crop;
    if (
      crop.some((v) => !Number.isFinite(v) || v < 0 || v > 100) ||
      width <= 0 ||
      height <= 0 ||
      left + width > 100 ||
      top + height > 100
    )
      throw new Error("Região de interesse inválida (percentuais)");
    const canvas = document.createElement("canvas");
    const scale = Math.min(2, 2400 / bitmap.width);
    canvas.width = Math.max(1, Math.round(((bitmap.width * width) / 100) * scale));
    canvas.height = Math.max(1, Math.round(((bitmap.height * height) / 100) * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.filter = "grayscale(1) contrast(1.4)";
    ctx.drawImage(
      bitmap,
      (bitmap.width * left) / 100,
      (bitmap.height * top) / 100,
      (bitmap.width * width) / 100,
      (bitmap.height * height) / 100,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas.toDataURL("image/png").split(",")[1];
  } finally {
    bitmap.close();
  }
}
