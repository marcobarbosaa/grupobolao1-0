import { ChevronLeft, ChevronRight, Rotate3D } from "lucide-react";
import { useState } from "react";
import type { HolographicPlayer, PlayerAngle } from "../../lib/holographic-player";
import { usePlayerAssets } from "./usePlayerAssets";
import { HolographicStage } from "./HolographicStage";
import { PlayerOverlay } from "./PlayerOverlay";

function SelectedPlayer({ player }: { player: HolographicPlayer }) {
  const [angle, setAngle] = useState<PlayerAngle>("front");
  const [hovered, setHovered] = useState(false);
  const [flat, setFlat] = useState(false);
  const { assets, missing, ready } = usePlayerAssets(player);
  const asset = assets.find((candidate) => candidate.view?.angle === angle) ?? assets[0];
  return (
    <section
      className={`holo-chamber ${hovered ? "is-engaged" : ""}`}
      aria-labelledby="selected-athlete"
    >
      <div className="holo-chamber-top">
        <span className="eyebrow">
          Sala de apresentação <span className="holo-slash">/</span> NBA 2K26
        </span>
        <button
          type="button"
          className="holo-mode-button"
          aria-pressed={flat}
          onClick={() => setFlat(!flat)}
        >
          Modo leve <span>{flat ? "Ativado" : "Desativado"}</span>
        </button>
      </div>
      <HolographicStage
        player={player}
        asset={asset}
        ready={ready}
        flat={flat}
        hovered={hovered}
        onHover={setHovered}
      />
      <PlayerOverlay player={player} />
      <div className="holo-angle-controls">
        <p className="eyebrow">
          <Rotate3D size={15} aria-hidden="true" /> Explore os ângulos
        </p>
        <div className="holo-angle-buttons" role="group" aria-label="Ângulo do atleta">
          {player.views.map((view) => {
            const available = assets.some((candidate) => candidate.view?.angle === view.angle);
            return (
              <button
                key={view.angle}
                type="button"
                disabled={!available}
                aria-pressed={asset?.view?.angle === view.angle}
                title={ready && !available ? `${view.label}: referência indisponível` : view.label}
                onClick={() => setAngle(view.angle)}
              >
                {view.angle === "left"
                  ? "Esquerda"
                  : view.angle === "right"
                    ? "Direita"
                    : view.label}
              </button>
            );
          })}
        </div>
      </div>
      {ready && missing.length > 0 && (
        <p className="holo-asset-notice" role="status">
          {!asset
            ? "Imagens indisponíveis. A carreira continua disponível."
            : !asset.view
              ? "Referências indisponíveis. Exibindo retrato do acervo."
              : `Vista exibida: ${asset.view.label.toLocaleLowerCase("pt-BR")}. Referências indisponíveis: ${missing.join(", ")}.`}
        </p>
      )}
    </section>
  );
}

export function HolographicSelection({ players }: { players: HolographicPlayer[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const index = Math.min(selectedIndex, Math.max(0, players.length - 1));
  const selected = players[index];
  return (
    <div className="holo-page site-container">
      <header className="holo-heading">
        <div>
          <p className="eyebrow">
            <span /> O elenco / Grupo Bolão
          </p>
          <h1>
            OS PROTAGONISTAS<span>.</span>
          </h1>
        </div>
        <p>
          Cada carreira, uma marca na liga. <br />
          Escolha o atleta. Entre na história.
        </p>
      </header>
      {selected ? (
        <SelectedPlayer key={selected.id} player={selected} />
      ) : (
        <p className="holo-empty" role="status">
          A seleção de atletas estará disponível em breve.
        </p>
      )}
      <footer className="holo-selector" aria-label="Seleção de atletas">
        <div className="holo-counter">
          <strong>{String(players.length ? index + 1 : 0).padStart(2, "0")}</strong>
          <span>/ {String(players.length).padStart(2, "0")}</span>
        </div>
        <div className="holo-roster" role="group" aria-label="Atletas disponíveis">
          {players.map((player, playerIndex) => (
            <button
              key={player.id}
              type="button"
              aria-pressed={index === playerIndex}
              aria-label={`Selecionar ${player.name}`}
              onClick={() => setSelectedIndex(playerIndex)}
            >
              <span />
              {player.name}
            </button>
          ))}
          <span className="holo-coming-soon">Mais jogadores em breve</span>
        </div>
        <div className="holo-arrows">
          <button
            type="button"
            className="icon-button"
            aria-label="Atleta anterior"
            disabled={index === 0}
            onClick={() => setSelectedIndex(index - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Próximo atleta"
            disabled={index >= players.length - 1}
            onClick={() => setSelectedIndex(index + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </footer>
      <p className="holo-edition-note">
        SELEÇÃO DE ATLETAS{" "}
        <span>
          Experiência em desenvolvimento · {String(players.length).padStart(2, "0")}{" "}
          {players.length === 1 ? "atleta disponível" : "atletas disponíveis"}
        </span>
      </p>
    </div>
  );
}
