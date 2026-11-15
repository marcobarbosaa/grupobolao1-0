export type AppearanceRecord = {
  player: string;
  period: string;
  team: string | null;
  asset: string;
};
export type AppearanceSeason = { id: string; year: string };
const aliases: Record<string, string> = {
  "fabio-carvalho": "binho",
  "gam-mori": "gam",
  "marco-barbosa": "marco",
  "matheus-medeiros": "medeiros",
  cerrote: "cristiano-ronaldo",
};
export function normalizePlayerId(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return aliases[slug] ?? slug;
}
export function seasonStart(value: string): number | undefined {
  const match = /^(\d{4})[-–/](\d{2}|\d{4})$/.exec(value);
  if (!match) return undefined;
  const start = Number(match[1]);
  return Number(match[2]) === (match[2].length === 2 ? (start + 1) % 100 : start + 1)
    ? start
    : undefined;
}
export function parseSeasonPeriod(period: string) {
  const [first, last] = period.split("_a_");
  const start = seasonStart(first.replace(/_em_diante$/, ""));
  const end = period.endsWith("_em_diante") ? Infinity : seasonStart(last ?? first);
  return start === undefined || end === undefined || end < start ? undefined : { start, end };
}
export function latestAppearanceSeason(seasons: readonly AppearanceSeason[]) {
  return [...seasons]
    .filter((s) => seasonStart(s.year) !== undefined)
    .sort((a, b) => seasonStart(a.year)! - seasonStart(b.year)!)
    .at(-1);
}
/** Unknown seasons never inherit an open-ended uniform or an unrelated current team. */
export function resolvePlayerAppearance(
  records: readonly AppearanceRecord[],
  seasons: readonly AppearanceSeason[],
  playerId: string,
  season: string,
) {
  const selected = seasons.find(
    (s) =>
      s.id === season ||
      (seasonStart(season) !== undefined && seasonStart(s.year) === seasonStart(season)),
  );
  const start = selected ? seasonStart(selected.year) : undefined;
  const matches =
    start === undefined
      ? []
      : records.filter((record) => {
          const period = parseSeasonPeriod(record.period);
          return (
            normalizePlayerId(record.player) === normalizePlayerId(playerId) &&
            period &&
            start >= period.start &&
            start <= period.end
          );
        });
  const record = matches.length === 1 ? matches[0] : undefined;
  return {
    playerId,
    season: start === undefined ? season : `${start}-${start + 1}`,
    seasonId: selected?.id,
    team: record?.team ?? "Equipe não confirmada",
    image: record?.asset,
    matched: !!record?.team,
  };
}
