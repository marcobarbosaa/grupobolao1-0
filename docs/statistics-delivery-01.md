# Backend Estatístico v1.0 — Entrega 01

Data: 09/11/2026. Base: main `1dce0e7`. Branch: `feat/statistics-foundation-v1`.

## Resultado

Domínio estatístico independente de React, contratos derivados de schemas Zod, validação estrutural e referencial, armazenamento JSON inicial vazio e CLI offline. Nenhuma estatística da antiga liga foi migrada. Os 13 IDs e nomes do cadastro atual foram reutilizados.

## Arquivos criados

| Arquivo                               | Responsabilidade                                                    |
| ------------------------------------- | ------------------------------------------------------------------- |
| src/lib/statistics/types.ts           | Contratos TypeScript derivados dos schemas.                         |
| src/lib/statistics/schemas.ts         | Entidades, auditoria, manifest e snapshot.                          |
| src/lib/statistics/identifiers.ts     | IDs válidos, identidade do elenco e chaves lógicas.                 |
| src/lib/statistics/phases.ts          | Fases por temporada e distinção entre rodada e agregado.            |
| src/lib/statistics/metrics.ts         | Catálogo e validação de totais, médias e percentuais.               |
| src/lib/statistics/statuses.ts        | Estados esportivos/de disponibilidade separados dos de importação.  |
| src/lib/statistics/validate.ts        | Referências, duplicatas, aprovação, revisões e comparação imutável. |
| src/lib/statistics/index.ts           | Exportações públicas do domínio.                                    |
| src/data/statistics/manifest.json     | Manifest v1.0 vazio, sem dados fictícios.                           |
| src/data/statistics/README.md         | Organização de arquivos e procedimento de publicação.               |
| scripts/statistics/persistence.ts     | Leitura de JSON com confinamento de caminhos e erros por arquivo.   |
| scripts/statistics/validate-data.ts   | CLI com códigos de saída e comparação opcional com baseline.        |
| scripts/statistics/tsconfig.json      | Typecheck dos scripts Node, sem alterar configuração do frontend.   |
| tests/statistics/fixtures.mjs         | Dados sintéticos restritos aos testes.                              |
| tests/statistics/schemas.test.mjs     | Métricas, estados, fontes e contratos.                              |
| tests/statistics/identifiers.test.mjs | Cadastro, referências, chaves lógicas e imutabilidade.              |
| tests/statistics/phases.test.mjs      | Configurações de fases e agregado playoffs.                         |
| tests/statistics/persistence.test.mjs | Arquivos temporários reais, paths, symlinks e subprocesso CLI.      |
| tests/statistics/additional.test.mjs  | Precisão das datas, transferências, escopos e correções.            |
| .github/workflows/statistics.yml      | CI com Node 24, lint novo, typecheck, validador, testes e build.    |
| docs/statistics-foundation.md         | Auditoria do legado, arquitetura, contratos e limites.              |
| docs/statistics-delivery-01.md        | Este relatório.                                                     |
| docs/statistics-pr.md                 | Descrição do Pull Request.                                          |

## Arquivo modificado

Somente package.json, para acrescentar:

- stats:validate
- stats:typecheck
- stats:test

Nenhuma dependência adicionada. package-lock.json não foi alterado.

## Contratos e validações

Entidades: Player, Team, Season, PlayerTeamHistory, Game, PlayerGameStats, PlayerPhaseStats, Award, ImportSource, ImportBatch e DataRevision. Manifest e snapshot também têm validação Zod.

- Contagens inteiras seguras; minutos e médias decimais; percentuais entre 0 e 100.
- NaN, infinito, negativos inválidos, strings numéricas e acertos superiores às tentativas são rejeitados.
- Ausentes não são preenchidos com zero; nenhuma precisão é arredondada.
- Fases configuráveis por temporada, sem IDs/ordens duplicadas. Playoffs agregado não pode receber uma partida individual.
- Partidas com os mesmos times e sem datas são permitidas com IDs distintos.
- Consolidados all-teams e por equipe coexistem sem obrigar equipe na identidade do consolidado geral.
- Fontes, lotes, registros e revisões precisam ter referências consistentes.
- Persistência de estatísticas exige lote published com revisão manual identificada.
- Uma revisão posterior à aprovação do lote precisa de nova revisão/aprovação.
- Correções preservam as versões anteriores; destinatários de premiações podem ser corrigidos por nova versão.
- Caminhos relativos são validados antes da leitura, incluindo resolução real de symlinks/junctions. URLs, caminhos absolutos, ../ e escapes são rejeitados.
- CLI não executa conteúdo JSON e não acessa a internet.

## Validação executada

| Verificação                                                         | Resultado                                                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| npm run stats:typecheck                                             | Passou                                                                                  |
| npx tsc --noEmit                                                    | Passou                                                                                  |
| ESLint em src/lib/statistics, scripts/statistics e tests/statistics | Passou                                                                                  |
| Testes existentes                                                   | 16 aprovados                                                                            |
| Testes estatísticos                                                 | 32 aprovados                                                                            |
| Execução conjunta                                                   | 48 aprovados, sem testes ignorados                                                      |
| npm run stats:validate                                              | Passou: zero temporadas, partidas, estatísticas e premiações                            |
| npm run build                                                       | Passou, cliente e SSR                                                                   |
| git diff --check                                                    | Passou                                                                                  |
| ESLint global                                                       | Falha preexistente: 9.063 erros e 1 aviso antes e depois; nenhuma regressão por arquivo |

O lint global foi executado integralmente e comparado com um baseline da main antes das alterações. Nenhuma regra foi desabilitada ou relaxada. Os resultados brutos e o resumo local estão em artifacts/redesign-review/statistics/, diretório de artefatos já ignorado pelo projeto.

A comparação com a base confirmou que componentes, rotas, estilos, fotografias, cadastro dos jogadores, engine, mock-data e season-stats permanecem sem alterações. Não foi declarada uma nova inspeção visual: esta entrega não modifica a interface.

## Legado

engine → mock-data → home-data/player-data e consumidores antigos continuam presentes. season-stats ainda alimenta mock-data e player-data. player-types contém contratos de apresentação anteriores, e home-portal importa apenas DataStatus como tipo. O novo domínio não importa nenhum desses módulos; reutiliza somente new-roster.

O inventário detalhado e os consumidores estão em [statistics-foundation.md](statistics-foundation.md).

## Limites e próximas entregas

- Sem OCR, upload, endpoints de escrita, banco SQL, backend externo ou importador.
- Sem motor matemático, soma de playoffs ou integração de leitura com o frontend.
- Fontes registram o SHA-256 e a revisão declarada; os arquivos de evidência e a identidade do aprovador não são autenticados por um serviço nesta entrega.
- Detectar alteração de um snapshot anterior exige fornecê-lo via --previous-root. O procedimento de publicação de correções deve usar esse modo; a CLI sem baseline valida apenas a coerência interna atual.
- O snapshot guarda todas as revisões. Um consumidor futuro deve selecionar a versão vigente, sem somar versões.
- Equipes e dados oficiais continuam vazios até a primeira aprovação real.
- A remoção do código legado será feita em entrega própria, após migração auditada dos consumidores.

Implementação preparada em branch separada, com PR em rascunho. Nenhum merge automático.
