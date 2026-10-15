# Grupo Bolão 2.0 — entrega da Etapa 2

Galeria e perfis implementados localmente na branch `redesign/grupo-bolao-2.0`. Sem commit, push ou publicação. A próxima etapa não foi iniciada; esta entrega está pronta para revisão visual.

## Experiência entregue

- Galeria editorial com os 13 jogadores, fotografias em destaque, composição assimétrica, seleção manual do protagonista e acesso a todos os perfis.
- Busca por nome sem distinção de acentos ou maiúsculas; filtros combináveis de equipe e posição; ordenação pelo acervo, A–Z e Z–A. Filtros na URL, retorno pelo navegador e estado vazio com limpeza.
- Perfis com abertura fotográfica e cinco capítulos: identidade/biografia, conquistas, evolução, estatísticas e exploração de outras histórias.
- Conquistas dinâmicas, inclusive categorias desconhecidas pelo catálogo de traduções. Anos confirmados de MVP e MVP das Finais levam à temporada correspondente na trajetória.
- Linha do tempo com seleção direta, anterior/próxima, setas do teclado, Home/End e gráfico de pontos, rebotes ou assistências. A temporada selecionada também atualiza as estatísticas. O gráfico mantém lacunas quando não há registro.
- Estatísticas principais legíveis e tabela detalhada recolhida inicialmente. Seletores de temporada e fase, consulta de uma ou todas as temporadas, médias/totais/aproveitamentos e rolagem horizontal contida no mobile.
- Seis contextos separados: temporada regular, playoffs agregados, primeira rodada, quartas de final, finais de conferência e finais da NBA.
- Navegação por capítulos, controles nomeados, foco visível, avisos acessíveis, carregamento, erro com nova tentativa e jogador inexistente com HTTP 404.
- Transição nativa entre retrato da galeria e perfil quando o navegador oferece suporte. Navegação convencional continua funcionando sem a API; movimento reduzido é respeitado.

## Rotas

| Rota             | Comportamento                                                         |
| ---------------- | --------------------------------------------------------------------- |
| `/jogadores`     | Galeria canônica, com busca e filtros na URL                          |
| `/jogadores/$id` | Perfil, mantendo os 13 identificadores existentes                     |
| `/biografias`    | Redirecionamento HTTP 301 para a galeria, preservando filtros válidos |

Os links da navegação global e os três links da Home que apontavam para a galeria usam `/jogadores`. O layout e o conteúdo visual da Home foram preservados. Hall da Fama, Temporadas, Recordes e Comparar mantêm suas implementações.

## Fotografias

Reutilização do `PlayerPortrait` da Etapa 1 e dos 26 WebPs existentes, em 480 e 960 pixels. `srcset`, `sizes`, carregamento prioritário da abertura e carregamento preguiçoso do restante evitam usar o original em todas as posições. Enquadramentos, iluminação e gradientes mantêm a identidade aprovada. Nenhuma fotografia original foi editada, removida ou substituída; não há novos assets ou imagens geradas.

## Adaptação dos dados

`player-data.ts` concentra o contato com as fontes atuais. `player-adapter.ts` transforma essas fontes em um modelo de apresentação definido em `player-types.ts`, sem executar regras novas de classificação.

- Identidade, equipes e biografias vêm dos registros existentes; as biografias não foram reescritas.
- `players.career` fornece apenas cronologia e equipe. Seus valores estatísticos sintéticos de fallback não entram nos novos perfis.
- Estatísticas vêm de `seasonStatsMap`, importado do acervo por temporada. Exemplo verificado: Nando, temporada 1, 14,5 pontos; temporada 5, 19,9 pontos e 10,6 rebotes na fase regular.
- Ausência não vira zero, eliminação ou rodada não disputada. O contrato distingue `available`, `not-imported`, `not-played`, `not-qualified` e `no-games`; estados de participação dependem de informação explícita. Zero registrado continua sendo zero.
- Títulos usam a quantidade registrada de anéis. Anos de títulos não são deduzidos pela equipe. MVP e MVP das Finais recebem datas apenas dos registros individuais explícitos de `seasons`.
- O modelo aceita médias, totais, percentuais, duplos-duplos e triplos-duplos. Os grupos sem dados mostram indisponibilidade; médias arredondadas não são convertidas em totais.
- Médias agregadas de carreira não foram recalculadas. O perfil informa que dependem da revisão histórica e da ponderação por jogos.

Fontes históricas, JSON/XLSX, `mock-data.ts`, `season-stats.ts`, engine e scripts de importação permanecem sem alterações.

## Arquivos e componentes

| Arquivos                                                               | Responsabilidade                                                                                    |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/lib/player-types.ts`                                              | Contratos de jogador, temporadas, fases, conquistas, métricas e filtros                             |
| `src/lib/player-adapter.ts`                                            | Validação/adaptação dos dados, conquistas e filtros                                                 |
| `src/lib/player-data.ts`                                               | Fronteira com as fontes atuais e consulta por ID                                                    |
| `src/components/players/PlayerGallery.tsx`                             | Abertura, galeria, filtros e estado vazio                                                           |
| `src/components/players/PlayerProfile.tsx`                             | Composição e seleção compartilhada de temporada                                                     |
| `src/components/players/ProfileHero.tsx`                               | Abertura fotográfica e navegação pelos capítulos                                                    |
| `src/components/players/PlayerBiography.tsx`                           | Identidade e biografia existente                                                                    |
| `src/components/players/PlayerAchievements.tsx`                        | Conquistas e links para anos confirmados                                                            |
| `src/components/players/CareerTimeline.tsx`                            | Linha do tempo e gráfico de evolução                                                                |
| `src/components/players/PlayerStatistics.tsx`                          | Estatísticas resumidas e consulta detalhada                                                         |
| `src/components/players/PlayerDiscovery.tsx`                           | Próximo jogador e outros destinos da liga                                                           |
| `src/components/players/StatNotice.tsx`                                | Estados distintos de disponibilidade                                                                |
| `src/components/players/PlayerPageState.tsx`                           | Carregamento, erro e perfil inexistente                                                             |
| `src/components/players/usePlayerMotion.ts`                            | Preferência de movimento reduzido                                                                   |
| `src/styles/players.css`                                               | Estilos responsivos e transições, limitados à experiência de jogadores                              |
| `src/routes/jogadores.tsx`, `jogadores.index.tsx`, `jogadores.$id.tsx` | Hierarquia de rotas, metadados e carregamento dos perfis                                            |
| `src/routes/biografias.tsx`                                            | Compatibilidade da URL antiga                                                                       |
| `src/routeTree.gen.ts`                                                 | Árvore regenerada automaticamente pelo TanStack                                                     |
| `src/routes/__root.tsx`                                                | Espaçamento adequado para a nova experiência                                                        |
| `src/lib/site-navigation.ts`                                           | Destino canônico e identificação da seção ativa                                                     |
| `src/components/home/Hero.tsx`, `Legends.tsx`, `Explore.tsx`           | Apenas atualização dos destinos da galeria                                                          |
| `src/styles.css`                                                       | Importação do CSS de jogadores                                                                      |
| `tests/player-data.test.mjs`                                           | Oito testes da adaptação e integridade dos dados                                                    |
| `tests/players.browser.mjs`                                            | Validação visual e funcional da Etapa 2                                                             |
| `tests/home.browser.mjs`                                               | Teste existente ajustado para permitir conteúdo editorial complementar sem aceitar a sidebar antiga |
| `.gitignore`                                                           | Artefatos locais de revisão excluídos do versionamento                                              |
| `ETAPA-2.md`                                                           | Relatório desta entrega                                                                             |

Nenhuma dependência foi adicionada. TanStack Start, React 19, Tailwind 4 e os ícones já instalados foram preservados. Playwright foi usado a partir da instalação temporária disponível fora do projeto, com Edge instalado.

## Validação

| Verificação                                             | Resultado                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run build`                                         | Passou; avisos de imports não utilizados do TanStack já existiam no baseline                         |
| `npx tsc --noEmit`                                      | Passou                                                                                               |
| ESLint dos arquivos implementados/alterados nesta etapa | Passou                                                                                               |
| `npm run lint` global                                   | Ainda falha: 5.270 erros de formatação preexistentes e 1 aviso; baseline tinha 5.770 erros e 1 aviso |
| `node --test tests/player-data.test.mjs`                | 8 testes passaram                                                                                    |
| `node tests/players.browser.mjs`                        | Passou                                                                                               |
| `node tests/home.browser.mjs`                           | Passou                                                                                               |
| `git diff --check`                                      | Passou                                                                                               |

Os erros globais restantes são `prettier/prettier` em arquivos legados fora do escopo. Não foi aplicado autofix global. Relatórios de antes/depois estão em `artifacts/players-review/lint-before.json` e `lint-after.json`.

Verificação no Edge/Chromium em 360, 390, 768, 1024, 1440 e 1920 pixels: galeria e perfil sem overflow horizontal, fotografias carregadas, 13 perfis com HTTP 200, cinco capítulos e navegação ativa. Também foram verificados busca/filtros combinados, destaque, teclado, toque, retorno com filtros, redirecionamento 301, temporada vinculada às conquistas, valores importados, tabela, dados ausentes, ID inválido com HTTP 404, movimento reduzido e ausência da View Transitions API. Sem erros inesperados de JavaScript ou hidratação na rodada final.

A Home foi comparada com capturas feitas antes da implementação: PNGs idênticos em 390 e 1440 pixels, no primeiro viewport. O teste existente também verificou a Home completa nas seis larguras, seleção de protagonistas, linha do tempo, menu mobile e as demais rotas.

Inspeção visual feita em capturas da galeria e perfil completos, aberturas desktop/mobile e detalhes da tabela mobile. Artefatos e resultados ficam em `artifacts/players-review/`; regressão da Home em `artifacts/home-review/`. Essas pastas são locais e ignoradas pelo Git.

## Problemas encontrados e resolvidos

- O modelo antigo misturava estatísticas importadas e fallbacks sintéticos: a nova apresentação consulta exclusivamente os valores importados.
- Ausência de rodadas detalhadas não comprovava eliminação: a interface agora informa que os dados não estão importados.
- Um fundo de iluminação causava 4 pixels de overflow em 768 pixels: o limite foi corrigido e as seis larguras passaram na nova execução.
- Títulos SVG com múltiplos nós de texto geravam divergência de hidratação: foram convertidos em strings únicas; a execução final ficou limpa.
- A verificação antiga proibia qualquer `aside`, inclusive o novo encerramento editorial: foi ajustada para verificar a ausência de navegação lateral antiga.

## Pendências de dados e backend

Faltam registros por rodada, totais, aproveitamentos, DD/TD, anos de títulos e eventuais premiações ainda não presentes no acervo. A interface tem contrato para receber essas informações, sem preencher lacunas artificialmente.

Na integração futura, substituir a origem concentrada em `player-data.ts`, validar payloads mantendo os IDs, informar participação explicitamente por fase e padronizar percentuais na escala de 0 a 100. O cálculo agregado de carreira continua pendente da revisão histórica e das regras oficiais. Os estados de carregamento/erro estão preparados; a fonte atual é local e síncrona, não uma API remota.

Não houve teste em aparelhos físicos, Safari, Firefox ou leitor de tela. A validação móvel utilizou viewports e emulação de toque no Chromium.

## Revisão local

```powershell
npm run dev
```

Abrir `http://localhost:8080/jogadores`, explorar os filtros e entrar nos perfis. `/jogadores/8` mostra Nando; `/jogadores/3` permite revisar o estado sem conquistas; `/jogadores/10` permite conferir o nome longo no mobile. O servidor temporário de validação foi encerrado ao terminar a entrega.

Para repetir as verificações:

```powershell
npm run build
npm run lint
npx tsc --noEmit
node --test tests/player-data.test.mjs
# Com servidor ativo e Playwright disponível:
node tests/players.browser.mjs
node tests/home.browser.mjs
```

Os testes de navegador aceitam `PLAYWRIGHT_MODULE` (URL de arquivo para uma instalação disponível), `BASE_URL` e `BROWSER_CHANNEL`. A comparação da Home ocorre quando as capturas locais `home-before-390.png` e `home-before-1440.png` estão presentes; essas capturas não são regeneradas sobre o resultado final.
