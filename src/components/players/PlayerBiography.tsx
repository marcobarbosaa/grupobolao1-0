import type { PlayerPresentation } from "../../lib/player-types";

export function PlayerBiography({ player }: { player: PlayerPresentation }) {
  const firstSentence = player.biography.match(/^.*?[.!?](?:\s|$)/)?.[0] ?? "";
  const remaining = player.biography.slice(firstSentence.length).trim();
  return (
    <section
      id="o-atleta"
      className="profile-biography section-space site-container"
      aria-labelledby="athlete-title"
    >
      <div className="chapter-heading">
        <p className="eyebrow section-kicker">01 / O ATLETA</p>
        <h2 id="athlete-title">
          POR TRÁS
          <br />
          DO <span>NOME.</span>
        </h2>
        <dl className="athlete-details">
          <div>
            <dt>Posição</dt>
            <dd>{player.position}</dd>
          </div>
          <div>
            <dt>Estilo de jogo</dt>
            <dd>{player.archetype}</dd>
          </div>
          <div>
            <dt>Equipes na carreira</dt>
            <dd>
              {player.teamNames.map((team) => (
                <span key={team}>{team}</span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Temporadas no acervo</dt>
            <dd>{player.seasons}</dd>
          </div>
        </dl>
      </div>
      <div className="biography-text">
        {player.biography ? (
          <>
            <p className="biography-lead">{firstSentence}</p>
            {remaining.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <span className="biography-source eyebrow">BIOGRAFIA / ACERVO DO GRUPO BOLÃO</span>
          </>
        ) : (
          <>
            <p className="biography-lead">Uma história a ser contada.</p>
            <p>A biografia deste jogador ainda não foi adicionada ao acervo.</p>
          </>
        )}
      </div>
    </section>
  );
}
