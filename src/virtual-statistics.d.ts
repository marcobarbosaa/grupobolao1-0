declare module "virtual:bolao-statistics-files" {
  const files: Record<string, unknown>;
  export default files;
}

declare module "virtual:bolao-player-history" {
  const manifest: { records: import("./lib/player-history").AppearanceRecord[] };
  export const localCrests: string[];
  export default manifest;
}
