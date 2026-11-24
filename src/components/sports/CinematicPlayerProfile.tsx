import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { getPlayerAppearance } from "../../lib/player-selection-identity";
import { publishedCatalog, publishedSeasons, latestSeasonId } from "../../lib/published-catalog";
import type { BolaoPlayer } from "../../lib/new-roster";
import { HistoricalPortrait } from "./HistoricalPortrait";
import { ProfileStatistics } from "./PublishedStatistics";
import "../../styles/cinematic-player-profile.css";

const scenes = [
  { id: "overview", label: "Visão geral", eyebrow: "O PROTAGONISTA", title: "O JOGADOR" },
  { id: "regular", label: "Temporadas", eyebrow: "REGULAR SEASON", title: "A TEMPORADA" },
  { id: "playoffs", label: "Playoffs", eyebrow: "PÓS-TEMPORADA", title: "A CAMPANHA" },
  { id: "career", label: "Carreira", eyebrow: "O LEGADO", title: "A CARREIRA" },
  { id: "biography", label: "Biografia", eyebrow: "CAPÍTULOS DE UMA VIDA", title: "A HISTÓRIA" },
] as const;

const number = (value: number | undefined, decimals = 0) =>
  value === undefined || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

export function CinematicPlayerProfile({ player }: { player: BolaoPlayer }) {
  const [scene, setScene] = useState(0);
  const [seasonId, setSeasonId] = useState(latestSeasonId);
  const [expanded, setExpanded] = useState(false);
  const identity = getPlayerAppearance(player.id, seasonId);
  const team = identity.team;
  const palette = identity.identity;
  const photo = identity.image;

  const all = publishedCatalog.records
    .filter((record) => record.kind === "phase")
    .filter((record) => record.playerId === player.id);
  const current = all.find(
    (record) => record.seasonId === seasonId && record.phaseId === "regular",
  );
  const currentPlayoffs =
    all.find((record) => record.seasonId === seasonId && record.phaseId === "playoffs") ??
    all.find((record) => record.seasonId === seasonId && record.phaseId === "first-round");
  const regularRecords = all.filter((record) => record.phaseId === "regular");
  const career = useMemo(() => {
    const totals = regularRecords.reduce(
      (sum, record) => {
        const t = record.stats.totals;
        sum.gp += t?.gp ?? 0;
        sum.points += t?.points ?? 0;
        sum.rebounds += t?.rebounds ?? 0;
        sum.assists += t?.assists ?? 0;
        sum.steals += t?.steals ?? 0;
        sum.blocks += t?.blocks ?? 0;
        return sum;
      },
      { gp: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 },
    );
    return totals;
  }, [regularRecords]);
  const selectedSeason = publishedSeasons.find((s) => s.id === seasonId);
  const show = scene === 1 ? current : scene === 2 ? currentPlayoffs : undefined;
  const biography =
    player.id === "dias"
      ? {
          title: "O armador que aprendeu a comandar",
          introduction:
            "De Detroit a Philadelphia e Dallas, Dias ampliou seu jogo sem perder o controle da quadra.",
          coverCaption: "PRIMEIRO, A LEITURA",
          chapters: [
            {
              number: "01",
              title: "A bola nas mãos",
              paragraphs: [
                "A história de Dias começa com a responsabilidade de um armador: receber a bola, ler o que a defesa oferece e escolher o tempo da jogada. Na Temporada 01, os registros mostram apenas quatro partidas em Detroit. Ainda não há ali uma estrela pronta; há o primeiro capítulo de uma carreira que seria construída conduzindo o jogo.",
                "Na temporada seguinte, a mudança já é concreta: 77 jogos, 12 como titular e 4,6 assistências por partida. Dias deixa de ser apenas uma presença ocasional e começa a ganhar espaço como organizador. A quadra passa a se abrir a partir das decisões dele.",
              ],
            },
            {
              number: "02",
              title: "Conduzir também é crescer",
              paragraphs: [
                "Em Detroit, a evolução não acontece de uma vez. Na Temporada 03, Dias chega a 82 partidas e 5,2 assistências por jogo, mantendo a bola em movimento enquanto passa a produzir mais no ataque. É o tipo de crescimento que não troca a função de armador por outra: acrescenta recursos a ela.",
                "Com o tempo, a responsabilidade de organizar se transforma também em responsabilidade de decidir. Na Temporada 09, já pelo Philadelphia 76ers, Dias registra 22,2 pontos e 7,9 assistências por partida na temporada regular. O armador que fazia a equipe jogar agora também assume o peso de definir partidas.",
              ],
            },
            {
              number: "03",
              title: "A temporada que confirmou o líder",
              paragraphs: [
                "O auge chega nas Finais da Temporada 09: Dias é reconhecido como MVP. O prêmio não inaugura sua liderança; dá consequência a uma construção que começou muito antes, posse após posse, passe após passe. O armador de Detroit chega ao maior palco como protagonista.",
                "E a história não para no troféu. Na Temporada 12, em Dallas, Dias disputa 80 jogos e alcança 25,4 pontos e 9,0 assistências por partida. Já não apenas prepara a vantagem: também a cria e a converte. Seu jogo amadurece sem abandonar o princípio que o definiu desde o início: fazer a leitura certa e colocar a equipe em movimento.",
              ],
            },
          ],
          quote:
            "Um armador não controla a quadra porque segura a bola; controla porque entende o que pode acontecer a seguir.",
          quoteCaption: "A IDEIA QUE ATRAVESSA A TRAJETÓRIA",
          portraitCaption: "TEMPORADA 09 · MVP DAS FINAIS",
          closingTitle: "O que permanece",
          closingText:
            "A trajetória de Dias não é a de alguém que deixou de ser armador para se tornar outra coisa. É a de um armador que aprendeu a carregar mais responsabilidades: primeiro organizar, depois decidir, por fim fazer as duas coisas no mesmo lance. O MVP das Finais marca o reconhecimento; os números de Dallas mostram até onde seu jogo ainda podia crescer. No fim, sua assinatura continua sendo a mesma: enxergar a jogada antes que ela termine.",
          closingCaption: "TEMPORADA 12 · DALLAS MAVERICKS",
        }
      : {
          title: "Uma vida em movimento",
          introduction: "De onde tudo começou até o nome que ficou na história.",
          coverCaption: "FOTO DE ABERTURA",
          chapters: [
            {
              number: "01",
              title: "Antes da arena",
              paragraphs: [
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vitae sem vel augue posuere consequat. Integer at lectus non justo feugiat ullamcorper. A primeira quadra, os primeiros treinos e a vontade de descobrir até onde aquele jogo poderia levar.",
                "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; cada passo guardava o começo de uma história maior.",
              ],
            },
            {
              number: "02",
              title: "O primeiro grande palco",
              paragraphs: [
                "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. O talento encontrou espaço, o ritmo mudou e cada partida passou a abrir uma nova porta.",
              ],
            },
          ],
          quote: "Lorem ipsum dolor sit amet; uma frase que resume o jeito de jogar e de viver.",
          quoteCaption: "MEMÓRIA DE CARREIRA",
          portraitCaption: "RETRATO DE ÉPOCA",
          closingTitle: "O que permanece",
          closingText:
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. No fim, ficam as pessoas, os lugares e os momentos que continuam vivos muito depois do último apito.",
          closingCaption: "UMA IMAGEM PARA GUARDAR",
        };
  const stats =
    scene === 4
      ? []
      : scene === 3
        ? [
            ["JOGOS", number(career.gp)],
            ["PONTOS", number(career.points)],
            ["REBOTES", number(career.rebounds)],
            ["ASSIST.", number(career.assists)],
            ["PPG", career.gp ? number(career.points / career.gp, 1) : "—"],
            ["RPG", career.gp ? number(career.rebounds / career.gp, 1) : "—"],
          ]
        : scene === 0
          ? [
              ["TEMPORADAS", number(regularRecords.length)],
              ["JOGOS", number(career.gp)],
              ["PPG", career.gp ? number(career.points / career.gp, 1) : "—"],
              ["RPG", career.gp ? number(career.rebounds / career.gp, 1) : "—"],
              ["APG", career.gp ? number(career.assists / career.gp, 1) : "—"],
              ["PONTOS", number(career.points)],
            ]
          : [
              ["JOGOS", number(show?.stats.totals?.gp)],
              ["PPG", number(show?.stats.averages?.ppg, 1)],
              ["RPG", number(show?.stats.averages?.rpg, 1)],
              ["APG", number(show?.stats.averages?.apg, 1)],
              ["FG%", number(show?.stats.percentages?.fgPct, 1)],
              ["3P%", number(show?.stats.percentages?.threePct, 1)],
            ];
  const theme = {
    ...identity.theme,
    "--profile-primary": palette?.primary ?? "#5a9cb8",
    "--profile-secondary": palette?.secondary ?? "#334155",
    "--profile-accent": palette?.accent ?? "#7dc8db",
    "--profile-deep": palette?.background ?? "#0a131a",
    "--profile-surface": palette?.surface ?? "#183544",
    "--profile-glow": palette?.accent ?? "#7dc8db",
    "--profile-text-on-primary": identity.theme["--team-text-on-primary"] ?? "#101418",
  } as CSSProperties;
  function changeScene(next: number) {
    setScene(Math.max(0, Math.min(scenes.length - 1, next)));
    setExpanded(false);
  }
  return (
    <main className="cinematic-player" style={theme}>
      <div className="cinematic-player-shell">
        <header className="cinematic-player-navigation">
          <Link to="/jogadores" className="cinematic-player-back">
            <ArrowLeft size={16} /> JOGADORES
          </Link>
          <nav aria-label="Seções do perfil">
            {scenes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={scene === index ? "is-active" : ""}
                aria-current={scene === index ? "page" : undefined}
                onClick={() => changeScene(index)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <span className="cinematic-player-index">
            {String(scene + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}
          </span>
        </header>
        <section
          className={`cinematic-player-stage cinematic-player-stage--${scenes[scene].id}`}
          aria-labelledby="cinematic-player-heading"
        >
          <div className="cinematic-player-ghost" aria-hidden="true">
            {photo && <img src={photo} alt="" />}
          </div>
          <div className="cinematic-player-info">
            <span className="cinematic-player-eyebrow">
              CENTRAL DO BOLÃO / {scenes[scene].eyebrow}
            </span>
            <p className="cinematic-player-firstname">
              {player.name.split(" ").slice(0, -1).join(" ") || player.name}
            </p>
            <h1 id="cinematic-player-heading">
              {scene === 0 ? (player.name.split(" ").at(-1) ?? player.name) : scenes[scene].title}
            </h1>
            <div className="cinematic-player-identity">
              {identity?.crest && (
                <img
                  key={identity.crest}
                  src={identity.crest}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <strong>{team}</strong>
                <span>
                  {identity?.number ? `#${identity.number} · ` : ""}
                  {player.name}
                </span>
              </div>
            </div>
            {scene === 1 || scene === 2 ? (
              <div className="cinematic-player-year">
                <label htmlFor="cinematic-season">TEMPORADA</label>
                <select
                  id="cinematic-season"
                  value={seasonId}
                  onChange={(event) => {
                    setSeasonId(event.target.value);
                    setExpanded(false);
                  }}
                >
                  {publishedSeasons.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year}
                    </option>
                  ))}
                </select>
                <p>
                  {selectedSeason?.title ?? ""} ·{" "}
                  {scene === 1 ? "Temporada regular" : "Campanha de playoffs"}
                </p>
              </div>
            ) : (
              <p className="cinematic-player-description">
                {scene === 0
                  ? "Uma trajetória. Cada temporada conta uma história."
                  : scene === 4
                    ? biography.introduction
                    : "O histórico completo de uma carreira."}
              </p>
            )}
          </div>
          <div className="cinematic-player-art" aria-hidden="true">
            <HistoricalPortrait playerId={player.id} image={photo} name={player.name} />
          </div>
          {stats.length > 0 && (
            <div className="cinematic-player-scoreboard" aria-label="Indicadores do jogador">
              {stats.map(([label, value]) => (
                <div key={label} className="cinematic-player-stat">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="cinematic-player-content" aria-label="Informações detalhadas">
          {(scene === 1 || scene === 2) && (
            <>
              <button
                className="cinematic-player-expand"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "OCULTAR ESTATÍSTICAS COMPLETAS" : "VER ESTATÍSTICAS COMPLETAS"}{" "}
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expanded && (
                <div className="cinematic-player-details">
                  <ProfileStatistics
                    key={seasonId}
                    player={player}
                    mode={scene === 1 ? "regular" : "playoffs"}
                    seasonId={seasonId}
                    onSeasonChange={setSeasonId}
                  />
                </div>
              )}
            </>
          )}
          {scene === 3 && (
            <div className="cinematic-player-career-details">
              <div>
                <span>TEMPORADAS PUBLICADAS</span>
                <strong>{number(regularRecords.length)}</strong>
              </div>
              <div>
                <span>ROUBOS DE BOLA</span>
                <strong>{number(career.steals)}</strong>
              </div>
              <div>
                <span>TOCOS</span>
                <strong>{number(career.blocks)}</strong>
              </div>
              <p>
                Totais acumulados da temporada regular nas temporadas publicadas. Médias por jogo
                calculadas a partir dos totais de jogos; playoffs não entram nesta soma.
              </p>
            </div>
          )}
          {scene === 4 && (
            <article className="player-biography" aria-labelledby="player-biography-title">
              <header className="player-biography-heading">
                <div>
                  <span className="player-biography-kicker">ARQUIVO PESSOAL · 01</span>
                  <h2 id="player-biography-title">{biography.title}</h2>
                </div>
                <p>{biography.introduction}</p>
              </header>

              <figure className="player-biography-photo player-biography-photo--cover">
                <div className="player-biography-photo-placeholder" aria-hidden="true">
                  <span>01</span>
                  <b>ESPAÇO PARA FOTOGRAFIA</b>
                  <i />
                  <i />
                </div>
                <figcaption>
                  {biography.coverCaption} <span>· ADICIONAR IMAGEM</span>
                </figcaption>
              </figure>

              <div className="player-biography-chapter">
                <span className="player-biography-chapter-number">
                  {biography.chapters[0].number}
                </span>
                <div>
                  <h3>{biography.chapters[0].title}</h3>
                  {biography.chapters[0].paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <blockquote className="player-biography-quote">
                <span>“</span>
                <p>{biography.quote}</p>
                <cite>— {biography.quoteCaption}</cite>
              </blockquote>

              <div className="player-biography-photo-row">
                <figure className="player-biography-photo player-biography-photo--portrait">
                  <div className="player-biography-photo-placeholder" aria-hidden="true">
                    <span>02</span>
                    <b>ESPAÇO PARA FOTOGRAFIA</b>
                    <i />
                    <i />
                  </div>
                  <figcaption>
                    {biography.portraitCaption} <span>· ADICIONAR IMAGEM</span>
                  </figcaption>
                </figure>
                <div className="player-biography-chapter player-biography-chapter--compact">
                  <span className="player-biography-chapter-number">
                    {biography.chapters[1].number}
                  </span>
                  <div>
                    <h3>{biography.chapters[1].title}</h3>
                    {biography.chapters[1].paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              {biography.chapters[2] && (
                <div className="player-biography-chapter">
                  <span className="player-biography-chapter-number">
                    {biography.chapters[2].number}
                  </span>
                  <div>
                    <h3>{biography.chapters[2].title}</h3>
                    {biography.chapters[2].paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="player-biography-chapter player-biography-chapter--final">
                <span className="player-biography-chapter-number">04</span>
                <div>
                  <h3>{biography.closingTitle}</h3>
                  <p>{biography.closingText}</p>
                </div>
              </div>

              <figure className="player-biography-photo player-biography-photo--closing">
                <div className="player-biography-photo-placeholder" aria-hidden="true">
                  <span>03</span>
                  <b>ESPAÇO PARA FOTOGRAFIA</b>
                  <i />
                  <i />
                </div>
                <figcaption>
                  {biography.closingCaption} <span>· ADICIONAR IMAGEM</span>
                </figcaption>
              </figure>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
