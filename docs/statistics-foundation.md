# Fundação estatística v1.0

## Auditoria e isolamento

Base auditada: main local/remota `1dce0e7`. As rotas atuais usam GenerationHome, GenerationRoster, GenerationProfile e GenerationPending. A identidade atual está em new-roster.ts, com 13 IDs slug, nomes e equipes. Nenhum deles foi alterado.

Legado identificado, preservado nesta entrega:

- engine.ts: RankingEngine, WEIGHTS, GOLD_STANDARDS, PHASE_MULTIPLIERS, AWARDS_POINTS e cálculos subjetivos.
- mock-data.ts: importa engine e season-stats; contém o elenco/histórico anterior e notas.
- season-stats.ts: consolidados antigos gerados de planilha, por nome e índice de temporada.
- home-data.ts: adapta mock-data para apresentação antiga.
- player-data.ts: combina mock-data e season-stats via player-adapter.
- player-types.ts: contratos de apresentação antigos (incluindo PhaseId camelCase, métricas abreviadas e DataStatus).
- Consumidores antigos: HallExperience, VersusPanel, PlayerSelection, PlayerAnalysis, ProfileHero, SeasonTimeline e componentes de estatísticas/carreira.
- home-portal.ts importa apenas o tipo DataStatus antigo. Não foi migrado, para manter esta entrega exclusivamente estatística.

O novo domínio importa Zod, seus próprios módulos e new-roster.ts. Não importa engine, mock-data, season-stats, tipos de apresentação, React ou módulos de componentes. Não há migração ou cópia do histórico antigo.

## Contratos

Typescript deriva os tipos diretamente dos schemas Zod, sem interfaces divergentes:
Player, Team, Season, PlayerTeamHistory, Game, PlayerGameStats, PlayerPhaseStats, Award, ImportSource, ImportBatch, DataRevision, StatisticsManifest e StatisticsDataset.

Todos os objetos estruturados são strict: campos desconhecidos são rejeitados. Não há coerção numérica, preenchimento de zeros ou arredondamento.

- Player: ID e nome projetados do cadastro existente. O adaptador marca o elenco atual como active; não cria outro cadastro persistido.
- Team: ID opaco estável, independente do nome. Não se gera ID automaticamente a partir de nomes de franquias.
- Season: season-NNN corresponde à edição permanente. Label é apenas apresentação. Não precisa ter estatísticas ou todas as fases.
- PlayerTeamHistory: vários vínculos por temporada permitem transferências e retornos; datas podem ser omitidas.
- Game: ID estável independente da data; permite jogos repetidos entre as mesmas equipes e datas desconhecidas. A partida pertence a uma rodada, nunca ao agregado playoffs.
- PlayerGameStats: identidade lógica é o par gameId/playerId, independentemente de teamId.
- PlayerPhaseStats: identidade lógica é playerId/seasonId/phaseId/scope e, somente em scope=team, teamId. scope=all-teams permite um consolidado de temporada/fase que atravessa transferências.
- Award: destinatário jogador e/ou equipe, tipo e descrição, sem pontos. Acrescenta revision para permitir correções auditáveis.
- DataRevision: acrescenta recordKind e batchId para vincular inequivocamente a versão ao registro e à aprovação.
- Os registros estatísticos acrescentam kind (game/phase) e availability. ImportStatus é uma dimensão separada, no lote.

Consolidados de carreira serão derivados de temporadas numa entrega matemática futura. Esta entrega não inventa uma temporada especial de carreira nem agrega dados.

## Métricas e unidades

stats possui três grupos opcionais:

- totals: gp, gs, minutes, points, rebounds, assists, steals, blocks, turnovers, fgm, fga, threePm, threePa, ftm, fta, offensiveRebounds, defensiveRebounds, fouls, doubleDoubles, tripleDoubles.
- averages: mpg, ppg, rpg, apg, spg, bpg, topg.
- percentages: fgPct, threePct, ftPct, sempre de 0 a 100.

Contagens são inteiros seguros não negativos; minutes admite frações. Médias admitem decimais finitos não negativos. NaN, infinito, números como string e percentuais fora do intervalo são rejeitados. Acertos não podem superar tentativas quando ambos são conhecidos; não se calculam contagens a partir de médias arredondadas.

Campos ausentes ficam omitidos. availability diferente de available não pode carregar valores numéricos. Zero é dado válido com available. Dados aprovados podem ser parciais.

Datas esportivas podem usar YYYY-MM-DD ou timestamp ISO com offset; timestamps de recebimento, aprovação e revisão exigem horário e offset. Não se completa um horário desconhecido automaticamente.

## Fases

Catálogo inicial: regular, playoffs, first-round, quarterfinals, conference-finals e nba-finals. Nomes são configuráveis por temporada. Cada fase tem id, name, order, type e parentId opcional.

playoffs é aggregate. As demais são stage. IDs e ordens não podem repetir; pais configurados precisam ser agregados anteriores aos filhos. Uma final isolada pode omitir parentId se a temporada não configurar o agregado. Nenhum motor de soma foi implementado.

## Rastreabilidade e imutabilidade

IDs se repetem apenas para versões distintas de um mesmo registro lógico. (kind, id, revision) deve ser único, e cada versão requer uma entrada de auditoria única. Um ID estatístico não pode mudar de jogador, jogo ou escopo entre revisões. Em premiações, o destinatário pode ser corrigido por uma nova revisão, mantendo temporada e tipo da conquista.

A revisão deve existir antes da aprovação do lote; correções posteriores exigem um novo lote revisado e aprovado.

O snapshot preserva todas as versões. O consumidor futuro deverá selecionar a revisão vigente explicitamente, não somar versões. O validador verifica continuidade da sequência, fontes, datas, aprovação e referências. validateAppendOnly compara snapshots validados e rejeita edição ou exclusão do histórico aprovado. A CLI expõe essa verificação com --previous-root.

O registro de approvedBy é evidência declarada de uma revisão externa, não autenticação criptográfica nem controle de acesso. O hash registra a identidade do documento; os arquivos de evidência não são enviados nem re-hasheados nesta entrega.

## Execução e compatibilidade

Usar Node 24 LTS (ambiente validado e workflow novo). A execução TypeScript usa o suporte nativo do Node, sem dependência adicional. O typecheck dos scripts é separado porque o tsconfig original inclui apenas src e configuração do frontend.

- npm run stats:typecheck
- npm run stats:validate
- npm run stats:test
- node --test tests/\*.test.mjs
- npx tsc --noEmit
- npm run build

O manifest inicial é vazio. Não há alteração em hero, header, rotas, páginas, fotografias, cadastro ou fórmulas existentes.

## Próximas entregas

Motor matemático com regras de agregação sem duplicar playoffs/rodadas; importador e área de staging para conteúdo ainda não aprovado; procedimento de publicação que sempre forneça baseline; integração de leitura no frontend; remoção auditada do legado. Nenhum desses recursos foi antecipado aqui.
