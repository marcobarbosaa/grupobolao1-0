# Backend Estatístico v1.0 — Entrega 02

Data: 09/11/2026. Base: main `25db46d`. Branch: `feat/statistics-engine-v1`.

## Resultado

Motor matemático independente do frontend, com seleção de revisões, médias, aproveitamentos, totais disjuntos, cobertura por métrica, procedência e conflitos explícitos. O PR #6 já estava integrado na base; os 32 testes da fundação passaram antes da implementação.

## Arquivos criados

| Arquivo                                | Responsabilidade                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| src/lib/statistics/calculations.ts     | Fórmulas puras, divisão por zero, somas seguras e tolerância de exibição.            |
| src/lib/statistics/derived-types.ts    | Contratos de resultados, cobertura, referências de versões, conflitos e comparações. |
| src/lib/statistics/coverage.ts         | Schemas opcionais de evidência/precisão e avaliação de cobertura.                    |
| src/lib/statistics/revisions.ts        | Validação da cadeia e seleção somente da revisão vigente, sem escrita.               |
| src/lib/statistics/aggregation.ts      | Partidas, rodadas, equipes, alternativas separadas e consistência por registro.      |
| src/lib/statistics/selectors.ts        | Prioridade de fontes, conflitos e métricas lado a lado.                              |
| tests/statistics/engine-fixtures.mjs   | Dados sintéticos exclusivos dos testes.                                              |
| tests/statistics/calculations.test.mjs | 6 testes de fórmulas e limites numéricos.                                            |
| tests/statistics/aggregation.test.mjs  | 35 testes de agregação, cobertura, revisões, fontes e comparação.                    |
| docs/statistics-engine.md              | API, fórmulas, decisões, exemplos sintéticos e limitações.                           |
| docs/statistics-engine-pr.md           | Descrição revisável do PR.                                                           |
| docs/statistics-delivery-02.md         | Este relatório de entrega e validação.                                               |

## Arquivos modificados

| Arquivo                          | Mudança                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| src/lib/statistics/schemas.ts    | coverage opcional em consolidados, displayPrecision opcional nos registros e verificações de compatibilidade. |
| src/lib/statistics/validate.ts   | Conferência do período/equipe dos jogos já conhecidos citados pela evidência de cobertura.                    |
| src/lib/statistics/index.ts      | Exportação dos novos contratos e funções.                                                                     |
| .github/workflows/statistics.yml | Nome do domínio e execução também em pushes da branch da Entrega 02; mesmas verificações obrigatórias.        |

A normalização local de quebras de linha exigida pelo Prettier não altera o conteúdo versionado dos módulos anteriores. Nenhuma dependência, script npm ou configuração de regra foi adicionada/desabilitada.

## Funções e fórmulas

calculateAverage, calculatePercentage, sumCounts, roundingTolerance, selectCurrentRevisions, aggregateGames, aggregatePlayoffs, collectRepresentations, selectSeasonStats e compareStatistics.

PPG/RPG/APG/SPG/BPG/TOPG/MPG usam totais correspondentes divididos por GP. FG%/3P%/FT% usam acertos/tentativas × 100. Não existe pontuação geral, média de percentuais, soma de médias ou reconstrução de totais a partir de médias arredondadas.

## Duplicações, cobertura e revisões

- Snapshot validado antes dos cálculos. IDs duplicados, identidade conflitante, cadeia incompleta ou procedência inválida são recusados.
- Uma revisão vigente por registro, independentemente da ordem de chegada; histórico preservado.
- Jogador/temporada/fase/equipe filtrados explicitamente.
- Consolidados, partidas, rodadas e equipes são representações alternativas; não se somam fontes sobrepostas.
- O aggregate playoffs nunca entra como rodada. Listas de jogos compartilhadas indevidamente por somandos de equipes/rodadas são recusadas.
- Completude de período exige declaração com fontes revisadas. GP isolado não é prova. Para histórico de partidas completo, exige-se o conjunto exato de IDs esperado.
- Cada métrica tem cobertura própria; razões usam numerador e denominador do mesmo subconjunto.
- Fontes completas incompatíveis geram conflito e value=null; não se escolhe silenciosamente a maior ou a mais recente.
- O valor observado com casas decimais declaradas usa tolerância de meia unidade exibida. Arredondamento para interface permanece separado.

## Validação

| Verificação                                                   | Resultado                              |
| ------------------------------------------------------------- | -------------------------------------- |
| Testes anteriores da fundação antes das mudanças              | 32 aprovados                           |
| npm run stats:validate                                        | Manifest vazio válido                  |
| npm run stats:typecheck                                       | Aprovado                               |
| npx tsc --noEmit                                              | Aprovado                               |
| ESLint do domínio, scripts estatísticos e testes estatísticos | Aprovado, sem regras desabilitadas     |
| Testes estatísticos finais                                    | 73 aprovados: 32 existentes + 41 novos |
| Testes existentes fora do domínio                             | 16 aprovados                           |
| Total                                                         | 89 testes, zero falhas e zero skips    |
| npm run build                                                 | Cliente e SSR aprovados                |
| git diff --check                                              | Aprovado                               |
| Comparação dos arquivos preservados com main                  | Sem alterações                         |

O lint global legado não foi usado como bloqueio nem submetido a uma limpeza geral; executou-se o lint de todo o escopo estatístico solicitado. Um erro local inicial de quebras CRLF foi corrigido pela formatação, e a execução final passou.

A compatibilidade visual é comprovada pelo escopo do diff e build: não houve alteração de componentes, rotas, estilos, imagens ou consumidores de dados. Não foi realizada uma nova inspeção visual de páginas, pois esta entrega não integra o motor à interface.

## Preservações e pendências da Entrega 03

O cadastro dos 13 jogadores continua íntegro e validado pelos testes existentes. Manifest, estatísticas de produção, dados antigos, engine legado e dependências não mudaram. Nenhuma estatística de teste foi publicada como dado real.

A evidência de completude continua sendo uma declaração de revisão externa, sem autenticação ou leitura automática de prints. A resolução decimal precisa ser informada quando conhecida. Sem lista completa de equipes, uma soma por equipes não certifica cobertura integral; sem totais suficientes, médias de rodadas não são agregadas.

Permanecem fora desta entrega: importador/OCR, dados reais, armazenamento SQL, endpoints, autenticação, integração visual, agregação de carreira e eliminação do legado. A publicação futura de correções deve continuar usando novas revisões e comparação com baseline.
