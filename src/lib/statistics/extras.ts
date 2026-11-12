import { z } from "zod";
import { identifierSchema, seasonIdSchema } from "./identifiers.ts";

const count = z.number().int().nonnegative().safe();
const finite = z.number().finite();
const code = z.string().regex(/^[A-Z0-9]{2,5}$/);
const campaign = z.string().regex(/^\d+-\d+$/);
export const standingSchema = z
  .object({
    rank: count.min(1).max(30),
    team: code,
    wins: count.optional(),
    losses: count.optional(),
    pct: finite.min(0).max(1).optional(),
    ppg: finite.nonnegative().optional(),
    papg: finite.nonnegative().optional(),
    diff: finite.optional(),
    gb: z.string().max(20).optional(),
    home: campaign.optional(),
    away: campaign.optional(),
    conference: campaign.optional(),
    division: campaign.optional(),
    streak: z.string().max(20).optional(),
  })
  .strict();
export const seriesSchema = z
  .object({
    conference: z.enum(["west", "east", "finals"]),
    round: z.enum(["first-round", "quarterfinals", "conference-finals", "nba-finals"]),
    homeTeam: code,
    awayTeam: code,
    homeWins: count.max(4),
    awayWins: count.max(4),
    winner: code,
  })
  .strict()
  .superRefine((m, ctx) => {
    if (
      m.homeTeam === m.awayTeam ||
      Math.max(m.homeWins, m.awayWins) !== 4 ||
      m.homeWins === m.awayWins ||
      m.winner !== (m.homeWins > m.awayWins ? m.homeTeam : m.awayTeam)
    )
      ctx.addIssue({ code: "custom", message: "Resultado ou vencedor da série inconsistente" });
    if ((m.round === "nba-finals") !== (m.conference === "finals"))
      ctx.addIssue({ code: "custom", message: "Conferência incompatível com a rodada" });
  });
export const extrasContentSchema = z
  .object({
    logos: z
      .record(
        code,
        z
          .object({
            year: z.number().int().min(1940).max(2200),
            slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          })
          .strict(),
      )
      .optional(),
    standings: z
      .object({
        west: z.array(standingSchema).max(30).optional(),
        east: z.array(standingSchema).max(30).optional(),
      })
      .strict()
      .optional(),
    playoffs: z
      .object({ matches: z.array(seriesSchema).max(15), champion: code.optional() })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (
      !Object.values(data.standings ?? {}).some((rows) => rows?.length) &&
      !data.playoffs?.matches.length
    )
      fail("Extras sem dados observados");
    const teams = new Set<string>();
    for (const rows of Object.values(data.standings ?? {})) {
      const ranks = new Set<number>();
      for (const row of rows ?? []) {
        if (ranks.has(row.rank) || teams.has(row.team))
          fail("Equipe ou posição duplicada na classificação");
        ranks.add(row.rank);
        teams.add(row.team);
        if (row.wins !== undefined && row.losses !== undefined) {
          const games = row.wins + row.losses;
          if (row.pct !== undefined && games > 0 && Math.abs(row.wins / games - row.pct) > 0.00051)
            fail("Aproveitamento diverge da campanha: " + row.team);
          if (row.home && row.away) {
            const h = row.home.split("-").map(Number),
              a = row.away.split("-").map(Number);
            if (h[0] + a[0] !== row.wins || h[1] + a[1] !== row.losses)
              fail("Casa/fora divergem da campanha: " + row.team);
          }
        }
        if (
          row.ppg !== undefined &&
          row.papg !== undefined &&
          row.diff !== undefined &&
          Math.abs(row.ppg - row.papg - row.diff) > 0.151
        )
          fail("Saldo divergente: " + row.team);
      }
    }
    const matches = data.playoffs?.matches ?? [];
    const order = ["first-round", "quarterfinals", "conference-finals", "nba-finals"];
    for (const round of order) {
      const used = new Set<string>();
      for (const match of matches.filter((m) => m.round === round)) {
        for (const team of [match.homeTeam, match.awayTeam]) {
          if (used.has(team)) fail("Equipe repetida na rodada: " + team);
          used.add(team);
          const rows =
            match.conference === "finals" ? undefined : data.standings?.[match.conference];
          const standing = rows?.find((r) => r.team === team);
          if (standing && standing.rank > 8) fail("Chave diverge dos classificados: " + team);
          if (rows && rows.length === 15 && !standing)
            fail("Equipe ausente da conferência: " + team);
          const previous = matches.filter(
            (m) =>
              m.round === order[order.indexOf(round) - 1] &&
              (round === "nba-finals" || m.conference === match.conference),
          );
          const occurrence = previous.find((m) => m.homeTeam === team || m.awayTeam === team);
          if (
            (occurrence && occurrence.winner !== team) ||
            (previous.length === (round === "quarterfinals" ? 4 : 2) && !occurrence)
          )
            fail("Progressão inválida do vencedor: " + team);
        }
      }
    }
    const finals = matches.filter((m) => m.round === "nba-finals");
    if (finals.length > 1) fail("Mais de uma NBA Finals");
    if (data.playoffs?.champion && (!finals.length || finals[0].winner !== data.playoffs.champion))
      fail("Campeão diverge da final");
  });
export const seasonExtrasSchema = z
  .object({
    id: identifierSchema,
    seasonId: seasonIdSchema,
    revision: count.min(1),
    sourceIds: z
      .array(identifierSchema)
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length),
    data: extrasContentSchema,
  })
  .strict();
export type ExtrasContent = z.infer<typeof extrasContentSchema>;
