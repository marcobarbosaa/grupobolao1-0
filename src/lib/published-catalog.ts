import manifest from "../data/statistics/manifest.json";
import { createPublishedCatalog } from "./statistics/catalog";

import files from "virtual:bolao-statistics-files";
export const publishedCatalog = createPublishedCatalog(manifest, files);
export const publishedSeasons = publishedCatalog.seasons;
export const latestSeasonId = publishedSeasons.at(-1)?.id ?? "";
