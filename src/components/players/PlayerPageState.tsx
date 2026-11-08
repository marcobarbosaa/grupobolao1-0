import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function PlayerPageState({
  kind,
  onRetry,
}: {
  kind: "loading" | "error" | "not-found";
  onRetry?: () => void;
}) {
  return (
    <div
      className="players-page player-page-state site-container"
      role={kind === "error" ? "alert" : "status"}
      aria-busy={kind === "loading"}
    >
      <p className="eyebrow section-kicker">GRUPO BOLÃO / JOGADORES</p>
      <h1>
        {kind === "loading"
          ? "A HISTÓRIA JÁ VAI COMEÇAR."
          : kind === "not-found"
            ? "JOGADOR NÃO ENCONTRADO."
            : "PAUSA NO JOGO."}
      </h1>
      <p>
        {kind === "loading"
          ? "Carregando o acervo da liga…"
          : kind === "not-found"
            ? "Este perfil não está no elenco. Conheça os outros protagonistas da liga."
            : "Não foi possível carregar esta página. Tente novamente."}
      </p>
      {onRetry && (
        <button className="editorial-button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
      {kind !== "loading" && (
        <Link to="/jogadores" className="text-link">
          Explorar jogadores <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
