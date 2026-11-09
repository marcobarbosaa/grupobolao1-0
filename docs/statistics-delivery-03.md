# Backend Estatístico v1.0 — Entrega 03

Data: 09/11/2026. Base: main f129e01. Branch: feat/statistics-import-pipeline.

## Resultado

Pipeline offline para preparação, revisão, autorização separada e publicação de transcrições estruturadas. Aprovação vinculada ao conteúdo e à base; dry-run padrão; escrita explícita por geração imutável e troca atômica de manifest; recuperação de interrupções sem apagar histórico.

As Entregas 01 e 02 foram confirmadas na main. O PR #7 está integrado em 0ac8789. A correção f129e01 teve [CI estatístico aprovado](https://github.com/marcobarbosaa/grupobolao1-0/actions/runs/42675264396). Os 89 testes existentes passaram antes das alterações.

## Arquivos criados

| Arquivo                                     | Motivo                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| src/lib/statistics/import-contracts.ts      | Schemas strict para candidatos, aliases autorizados e autorização de publicação.    |
| src/lib/statistics/import-normalization.ts  | Identificação exata, semântica por tela, decimais e preservação da precisão.        |
| src/lib/statistics/import-validation.ts     | Propostas, diagnósticos por camada, duplicatas, conflitos e novas revisões.         |
| scripts/statistics/imports/io.ts            | Leitura confinada, limites, verificação de originais e fingerprints da base.        |
| scripts/statistics/imports/review.ts        | Relatórios determinísticos, autorização vinculada e validação do conjunto aprovado. |
| scripts/statistics/imports/publish.ts       | Dry-run, staging, lock/journal, publicação e recuperação.                           |
| scripts/statistics/imports/cli.ts           | Comandos explícitos com mensagens e códigos de saída.                               |
| tests/statistics/import-fixtures.mjs        | Candidatos/imagem sintéticos e ambientes temporários de teste.                      |
| tests/statistics/import-contracts.test.mjs  | 8 testes de contratos, precisão, identificação e normalização.                      |
| tests/statistics/import-validation.test.mjs | 8 testes de propostas, referências, duplicatas, conflitos e matemática.             |
| tests/statistics/import-publishing.test.mjs | 16 testes de I/O, autorização, publicação, falhas, recuperação e CLI.               |
| docs/statistics-import-guide.md             | Guia técnico e operacional em português.                                            |
| docs/statistics-import-pr.md                | Descrição do Pull Request.                                                          |
| docs/statistics-delivery-03.md              | Este relatório.                                                                     |

## Arquivos alterados

| Arquivo                          | Motivo                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ |
| package.json                     | Comandos stats:import:prepare/review/approve/publish/recover.                  |
| scripts/statistics/tsconfig.json | Incluir scripts em subdiretórios no typecheck existente.                       |
| .gitignore                       | Excluir área privada sugerida de revisão e arquivos temporários de transações. |

Nenhum schema aprovado, identificador, regra de cobertura, fórmula, seletor ou workflow anterior foi alterado. A normalização local de quebras de linha exigida pelo lint não produz alteração de conteúdo versionado nos arquivos anteriores. Nenhuma dependência foi adicionada.

## Contratos e processo

Candidatos suportam consolidados regulares, fases, partidas, premiações e transferências, inclusive várias pessoas e temporadas fora de ordem. Fonte tem SHA-256, nome original descritivo, recebimento, metadados e caminho local relativo autorizado.

prepare/review verificam fontes e base e geram JSON/Markdown. Campos ambíguos ficam pendentes. approve exige hash da revisão, aprovador declarado, instante e escopo exato; correções precisam de aceitação separada. Não aceita approved=true no candidato.

publish refaz as verificações. Sem --write, mostra mudanças sem gravar. Com --write, instala uma geração validada e somente então troca o manifest. Mantém versões e arquivos anteriores. O recibo conserva autorização, fontes e alterações, inclusive a procedência de entidades sem revisão própria.

## Duplicatas e conflitos

Imagem repetida reutiliza a fonte por hash. Identidades estatísticas seguem a Fundação. Observações idênticas não criam versões. Diferenças são mostradas campo a campo; correções exigem revisão anterior exata, justificativa e aprovação. O motor matemático continua selecionando somente a versão vigente.

Metadados existentes não são sobrescritos. Correções estatísticas são substituições completas auditadas, com remoções de campos explicitadas no relatório. Fontes completas matematicamente incompatíveis bloqueiam publicação até resolução.

## Segurança

Candidatos e autorizações separados; hashes de candidato, relatório, aliases, fontes e base; validação strict e referencial; paths confinados; arquivos regulares; extensões/cabeçalhos; limites de tamanho; escritas exclusivas; lock e journal; snapshots append-only. Não há eval, shell baseado no conteúdo, upload público, binários em JSON ou credenciais.

A aprovação é operacional, não assinatura de identidade. O diretório local é controlado pelo operador. A recuperação recusa processos ativos e estados inesperados. O guia documenta limites do filesystem e recuperação manual para journal truncado.

## Validação executada

| Verificação                                             | Resultado                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Testes anteriores antes da implementação                | 89 aprovados                                                    |
| Testes estatísticos finais                              | 105 aprovados: 73 anteriores + 32 de importação                 |
| Testes existentes fora do domínio                       | 16 aprovados                                                    |
| Total final                                             | 121 testes, zero falhas, zero skips                             |
| npm run stats:validate                                  | Manifest de produção vazio e válido                             |
| npm run stats:typecheck                                 | Aprovado                                                        |
| npx tsc --noEmit                                        | Aprovado                                                        |
| ESLint de todo o domínio, scripts e testes estatísticos | Aprovado                                                        |
| npm run build                                           | Cliente e SSR aprovados                                         |
| Comparação com a base                                   | Frontend, elenco, dados, motor, schemas e workflows preservados |

Os testes exercitam arquivos reais temporários, falha exclusiva de escrita, alteração da base durante staging, duas fases de encerramento abrupto em processo separado, recuperação e comandos CLI. Todas as imagens e estatísticas usadas nesses testes são sintéticas.

O CI existente já inclui os novos testes pelo glob e os scripts pelo tsconfig atualizado. O resultado remoto da branch e do PR é registrado na descrição do PR e em sua aba Checks; não se desabilitaram verificações.

## Pendências e limitações

- Nenhuma estatística real foi importada: isso exige prints, transcrição e aprovação futura do usuário.
- Metadados de entidades sem contrato de revisão continuam imutáveis; mudanças exigem migração revisada específica.
- Não há autenticação da identidade do aprovador nem verificação semântica automática de imagens.
- Formatos são verificados por estrutura/cabeçalho e hash, sem decodificação completa.
- Snapshot completo por geração respeita 10 MiB por arquivo; bases maiores poderão exigir particionamento.
- OCR, interface administrativa, integração visual, banco e eliminação do legado ficam fora desta entrega.

Não houve nova inspeção visual: a compatibilidade foi verificada pelo diff preservado, testes existentes e build. A aplicação não passou a consumir dados de teste.
