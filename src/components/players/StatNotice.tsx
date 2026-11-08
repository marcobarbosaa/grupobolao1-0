import { dataStatusLabels, type DataStatus } from "../../lib/player-types";

const explanations: Record<Exclude<DataStatus, "available">, string> = {
  "not-imported":
    "As estatísticas desta fase ainda não estão no acervo. Isso não confirma uma eliminação ou ausência de participação.",
  "not-played": "O registro informa que esta rodada não foi disputada.",
  "not-qualified": "O registro informa que o jogador não se classificou para esta fase.",
  "no-games": "Não há partidas disputadas pelo jogador nesta fase. Médias não se aplicam.",
};

export function StatNotice({ status }: { status: Exclude<DataStatus, "available"> }) {
  return (
    <div className="stat-notice" role="status">
      <span className="eyebrow">ACERVO ESTATÍSTICO</span>
      <h3>{dataStatusLabels[status]}</h3>
      <p>{explanations[status]}</p>
    </div>
  );
}
