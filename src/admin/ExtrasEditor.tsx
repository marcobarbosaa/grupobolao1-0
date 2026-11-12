import type { ExtrasContent } from "../lib/statistics/extras";

const standingFields = [
  "rank",
  "team",
  "wins",
  "losses",
  "pct",
  "gb",
  "home",
  "away",
  "conference",
  "division",
  "ppg",
  "papg",
  "diff",
  "streak",
];
const numeric = new Set([
  "rank",
  "wins",
  "losses",
  "pct",
  "ppg",
  "papg",
  "diff",
  "homeWins",
  "awayWins",
]);
export function ExtrasEditor({
  value,
  onChange,
}: {
  value: ExtrasContent;
  onChange: (v: ExtrasContent) => void;
}) {
  function updateStanding(conference: "east" | "west", index: number, key: string, raw: string) {
    const rows = [...(value.standings?.[conference] ?? [])];
    const row = {
      ...rows[index],
      [key]: raw === "" ? undefined : numeric.has(key) ? Number(raw.replace(",", ".")) : raw,
    };
    rows[index] = row;
    onChange({ ...value, standings: { ...value.standings, [conference]: rows } });
  }
  return (
    <div className="extras-editor">
      <p>
        Transcreva apenas o que está visível. Posição é a exibida pelo jogo. Aproveitamento: fração
        de 0 a 1. Campos vazios permanecem ausentes.
      </p>
      {(["west", "east"] as const).map((conference) => (
        <details key={conference} open>
          <summary>Classificação · {conference === "west" ? "Oeste" : "Leste"}</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {standingFields.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                  <th>Remover</th>
                </tr>
              </thead>
              <tbody>
                {(value.standings?.[conference] ?? []).map((row, i) => (
                  <tr key={i}>
                    {standingFields.map((k) => (
                      <td key={k}>
                        <input
                          aria-label={`${conference} ${i + 1} ${k}`}
                          value={String((row as unknown as Record<string, unknown>)[k] ?? "")}
                          onChange={(e) => updateStanding(conference, i, k, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...value,
                            standings: {
                              ...value.standings,
                              [conference]: value.standings![conference]!.filter((_, n) => n !== i),
                            },
                          })
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                standings: {
                  ...value.standings,
                  [conference]: [
                    ...(value.standings?.[conference] ?? []),
                    {} as NonNullable<ExtrasContent["standings"]>["west"] extends
                      | (infer R)[]
                      | undefined
                      ? R
                      : never,
                  ],
                },
              })
            }
          >
            Adicionar equipe
          </button>
        </details>
      ))}
      <details open>
        <summary>Playoffs · séries concluídas</summary>
        {(value.playoffs?.matches ?? []).map((match, i) => (
          <div className="series-edit" key={i}>
            {(
              [
                "conference",
                "round",
                "homeTeam",
                "homeWins",
                "awayTeam",
                "awayWins",
                "winner",
              ] as const
            ).map((key) => (
              <label key={key}>
                {key}
                {key === "conference" || key === "round" ? (
                  <select
                    value={match[key] ?? ""}
                    onChange={(e) => {
                      const matches = [...value.playoffs!.matches];
                      matches[i] = { ...match, [key]: e.target.value };
                      onChange({ ...value, playoffs: { ...value.playoffs!, matches } });
                    }}
                  >
                    <option value="">Selecionar</option>
                    {(key === "conference"
                      ? ["west", "east", "finals"]
                      : ["first-round", "quarterfinals", "conference-finals", "nba-finals"]
                    ).map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={match[key] ?? ""}
                    onChange={(e) => {
                      const matches = [...value.playoffs!.matches];
                      matches[i] = {
                        ...match,
                        [key]:
                          e.target.value === ""
                            ? undefined
                            : numeric.has(key)
                              ? Number(e.target.value)
                              : e.target.value,
                      };
                      onChange({ ...value, playoffs: { ...value.playoffs!, matches } });
                    }}
                  />
                )}
              </label>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  playoffs: {
                    ...value.playoffs!,
                    matches: value.playoffs!.matches.filter((_, n) => n !== i),
                  },
                })
              }
            >
              Remover série
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              playoffs: {
                ...value.playoffs,
                matches: [
                  ...(value.playoffs?.matches ?? []),
                  {} as NonNullable<ExtrasContent["playoffs"]>["matches"][number],
                ],
              },
            })
          }
        >
          Adicionar série
        </button>
        <label>
          Campeão (opcional)
          <input
            value={value.playoffs?.champion ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                playoffs: {
                  matches: value.playoffs?.matches ?? [],
                  champion: e.target.value || undefined,
                },
              })
            }
          />
        </label>
      </details>
    </div>
  );
}
