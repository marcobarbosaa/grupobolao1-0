import { manifestSchema, datasetSchema } from "./schemas.ts";
import { selectCurrentRevisions } from "./revisions.ts";

/** The manifest alone selects approved files; unreferenced staging never participates. */
export function createPublishedCatalog(manifestInput: unknown, files: Record<string, unknown>) {
  const manifest = manifestSchema.parse(manifestInput);
  const data: Record<string, unknown[]> = {};
  for (const category of Object.keys(datasetSchema.shape)) {
    const paths = manifest[category as keyof typeof manifest];
    data[category] = (Array.isArray(paths) ? paths : []).flatMap((path) => {
      const rows = files[path];
      if (!Array.isArray(rows)) throw new Error("Published file missing from bundle: " + path);
      return rows;
    });
  }
  const { dataset, records } = selectCurrentRevisions(data);
  const seasons = [...dataset.seasons]
    .sort((a, b) => a.edition - b.edition)
    .map((season) => ({
      ...season,
      title: "Temporada " + String(season.edition).padStart(2, "0"),
      year: `${2004 + season.edition}/${String(2005 + season.edition).slice(-2)}`,
    }));
  const extras = Object.fromEntries(
    dataset.extras
      .map((e) => e.seasonId)
      .map((id) => {
        const current = dataset.extras
          .filter((e) => e.seasonId === id)
          .sort((a, b) => b.revision - a.revision)[0];
        return [id, current.data];
      }),
  );
  return { seasons, records, extras };
}
