import { localLimits } from "./local-import.ts";

/** Bounded header inspection before handing bytes to a decoder. Not a full decoder. */
export function inspectImage(bytes: Uint8Array, extension: string) {
  if (bytes.length < 12 || bytes.length > localLimits.fileBytes)
    throw new Error("Tamanho de imagem inválido");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  let width = 0,
    height = 0;
  if (
    extension === "png" &&
    bytes.length >= 45 &&
    bytes[0] === 137 &&
    ascii(1, 3) === "PNG" &&
    ascii(12, 4) === "IHDR" &&
    ascii(bytes.length - 8, 4) === "IEND"
  ) {
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (
    ["jpg", "jpeg"].includes(extension) &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  ) {
    let pos = 2;
    while (pos + 4 < bytes.length) {
      if (bytes[pos++] !== 255) break;
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 0xda || marker === 0xd9) break;
      if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
      if (pos + 2 > bytes.length) break;
      const length = view.getUint16(pos);
      if (length < 2 || pos + length > bytes.length) break;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        ) &&
        length >= 8
      ) {
        height = view.getUint16(pos + 3);
        width = view.getUint16(pos + 5);
        break;
      }
      pos += length;
    }
  } else if (
    extension === "webp" &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 4) === "WEBP" &&
    view.getUint32(4, true) + 8 === bytes.length
  ) {
    const kind = ascii(12, 4);
    if (kind === "VP8X" && bytes.length >= 30) {
      if (bytes[20] & 2) throw new Error("WebP animado não suportado");
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (
      kind === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    ) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    } else if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1;
      height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height || width * height > localLimits.pixels)
    throw new Error(
      "Formato real incompatível, imagem corrompida ou dimensões acima de 32 megapixels",
    );
  return { width, height };
}
