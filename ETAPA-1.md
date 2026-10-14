# Grupo Bolão 2.0 — entrega da Etapa 1

Implementação local na branch `redesign/grupo-bolao-2.0`. Sem commit, push ou publicação.
Escopo: fundação visual, navegação global e Home. As etapas seguintes não foram iniciadas.

## Experiência implementada

- Nova Home editorial em cinco momentos: abertura, galeria de lendas, temporadas, imortais e exploração.
- Hero com Nando, Gam e Medeiros, composição de três retratos no desktop e um protagonista no mobile.
- Seleção manual por botão, teclado e toque: muda fotografia, posição, iluminação, nome e perfil. Sem alternância automática.
- Galeria com os 13 jogadores, fotografias de proporções diferentes, navegação horizontal nativa e botões de avanço/retorno.
- Linha do tempo com as 22 temporadas existentes, seleção direta, avanço/retorno, campeões e MVPs dos registros originais.
- Prévia dourada do Hall com conquistas cadastradas. Não calcula classificação nova.
- Encerramento editorial com acessos reais a jogadores, temporadas, recordes e comparações.
- Cabeçalho horizontal, indicação da página ativa, superfície sólida após rolar e menu mobile em tela inteira.
- Menu baseado no Radix Dialog já instalado: foco contido, retorno ao acionador, Escape, bloqueio de scroll, fechamento após navegar ou mudar para desktop.
- Link para pular ao conteúdo, controles nomeados, estados anunciados e respeito a `prefers-reduced-motion`.
- Barlow Condensed e Inter locais, tokens Obsidian/Graphite/Ivory/Signal Red/Champagne, favicon próprio, idioma `pt-BR`, metadados e estados de erro traduzidos.

## Rotas

| Destino               | Rota              |
| --------------------- | ----------------- |
| Início                | `/`               |
| Jogadores             | `/biografias`     |
| Temporadas            | `/temporadas`     |
| Hall da Fama original | `/hall-da-fama`   |
| Recordes              | `/recordes`       |
| Comparar              | `/deep-analytics` |
| Perfil                | `/jogadores/$id`  |

O Hall original foi reaproveitado integralmente em sua nova rota, com formatação e título atualizados.
`src/routeTree.gen.ts` foi atualizado pelo gerador do TanStack durante desenvolvimento/build, sem edição manual.

## Arquivos criados

- `src/components/site/Brand.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`.
- `src/components/home/Hero.tsx`, `Legends.tsx`, `SeasonTimeline.tsx`, `Immortals.tsx`, `Explore.tsx`, `PlayerPortrait.tsx`.
- `src/lib/home-data.ts`: adaptador entre os registros existentes e a apresentação. Centraliza seleção editorial, tons e enquadramentos.
- `src/lib/site-navigation.ts`: destinos e regras de navegação ativa.
- `src/routes/hall-da-fama.tsx`.
- `src/styles/site.css` e `src/fonts.css`.
- `public/favicon.svg`.
- `public/fonts/`: três pesos de Barlow Condensed, Inter variável e as duas licenças OFL.
- `public/jogadores/optimized/`: 26 derivados WebP, dois tamanhos para cada uma das 13 fotos.
- `scripts/optimize-home-images.mjs`: regeneração opcional dos derivados, usando Sharp disponível no ambiente de desenvolvimento.
- `tests/home.browser.mjs`: teste de navegador reproduzível.
- `ETAPA-1.md`: este relatório.

## Arquivos alterados

- `src/routes/index.tsx`: nova Home.
- `src/routes/__root.tsx`: layout global, fontes locais, favicon, idioma e metadados.
- `src/router.tsx`: mensagens de erro em português brasileiro.
- `src/styles.css`: tokens e importação dos estilos novos; utilitários antigos preservados.
- `src/routes/biografias.tsx`, `temporadas.tsx`, `recordes.tsx`, `deep-analytics.tsx`: somente títulos dos metadados.
- `src/routeTree.gen.ts`: gerado automaticamente pelo TanStack.
- `.gitignore`: capturas temporárias e resultados locais de QA.

Nenhum arquivo original foi removido. `AppSidebar.tsx` e `MobileNav.tsx` permanecem no repositório, mas não são montados no layout público.

## Recursos visuais e desempenho

As fotografias foram inspecionadas antes da composição. Seus fundos de arena foram mantidos; recortes editoriais, sobreposição e máscaras CSS produzem profundidade sem modificar a identidade dos jogadores.

Os 13 originais somam 24.604.654 bytes. Os 26 derivados em 480/960 px somam 2.196.096 bytes, aproximadamente 91% menos mesmo incluindo as duas versões. `srcSet`, dimensões explícitas, carregamento prioritário do protagonista inicial e carregamento tardio das demais imagens orientam a entrega. Se um derivado falhar, o componente tenta o original e depois exibe as iniciais.

As quatro fontes WOFF2 somam aproximadamente 115 KB e são servidas pelo próprio site, com `font-display: swap` e fontes alternativas. Não há dependência visual obrigatória de URLs externas na Home.

Nenhuma dependência foi adicionada a `package.json` ou `package-lock.json`. As animações usam CSS; o menu reutiliza Radix. Playwright foi obtido temporariamente para QA e executado no Edge local, sem alterar as dependências do projeto.

## Verificações

| Verificação                                                       | Resultado                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `npm run build` original                                          | Passou                                                                 |
| `npm run build` após implementação                                | Passou: cliente e servidor                                             |
| `npx tsc --noEmit`                                                | Passou                                                                 |
| ESLint do código novo, layout, Home, Hall migrado e scripts novos | Passou                                                                 |
| `git diff --check`                                                | Passou                                                                 |
| Lint global original                                              | 6.003 erros e 1 aviso                                                  |
| Lint global após implementação                                    | 5.770 erros e 1 aviso, em arquivos legados                             |
| Home em 360, 390, 768, 1024, 1440 e 1920 px                       | Sem overflow horizontal                                                |
| Rotas legadas, Hall e 13 perfis                                   | HTTP 200, cabeçalho presente, sidebar ausente, navegação ativa correta |
| Seleção de protagonistas                                          | Teclado e toque; nome, imagem e link correspondentes                   |
| Linha do tempo                                                    | Seleção, avanço, retorno e limites inicial/final                       |
| Galeria                                                           | Rolagem e 13 perfis únicos                                             |
| Menu mobile                                                       | Foco, Escape, restauração de foco, scroll e fechamento ao navegar      |
| Movimento reduzido                                                | Interação funcional com transições desativadas                         |
| Console do navegador na rodada estável                            | Sem erros de execução ou hidratação                                    |

O lint global continua falhando por formatação preexistente, principalmente CRLF e Prettier, em scripts históricos, dados, engine e páginas internas. Não foi aplicado um `--fix` global que alteraria esses arquivos fora do escopo. O relatório detalhado fica em `artifacts/home-review/lint.json`.

O build mantém avisos de imports não utilizados dentro de dependências TanStack, também presentes no build inicial. O servidor pode emitir avisos de dimensões do Recharts durante SSR das páginas antigas; os gráficos renderizam no navegador e não foram reformulados nesta etapa.

Durante desenvolvimento, as fontes adicionadas depois da inicialização exigiram reiniciar o Vite para atualizar o inventário público. A rodada inicial também coincidiu com HMR. Após reiniciar e estabilizar os arquivos, a rodada completa passou sem erros de console. Não foi usada supressão de avisos de hidratação.

## Preservação e limites

- TanStack Start, React, Tailwind 4, configurações de build e dependências preservados.
- `mock-data.ts`, `engine.ts`, `season-stats.ts`, JSON, XLSX, scripts históricos e fotos originais sem alteração.
- Fórmulas, resultados e classificação do Hall permanecem como no projeto original.
- Páginas internas mantêm seus componentes e funcionalidades, dentro do novo layout global.
- Não foram implementados banco, autenticação, OCR, importadores, APIs de estatísticas ou regras novas.
- A Home continua dependente dos registros atuais, por meio de um adaptador preparado para futura troca da fonte.
- A validação automatizada foi feita em Edge/Chromium. Não houve teste físico em iPhone/Android, Safari, Firefox ou auditoria com leitor de tela.
- Redesign interno, revisão de dados e demais etapas aguardam a revisão visual desta entrega.

## Testar localmente

Na raiz do repositório:

```powershell
npm run dev
```

Abra a URL mostrada pelo Vite; neste ambiente, `http://localhost:8080/`.
Selecione os três protagonistas, abra seus perfis, explore a galeria e a linha do tempo, acesse o Hall e teste o menu em uma janela estreita.

Para compilar e conferir tipos:

```powershell
npm run build
npx tsc --noEmit
npm run lint
```

O teste de navegador precisa de Playwright disponível e um servidor de desenvolvimento em execução. Por padrão usa Edge instalado, porta 8080. Uma instalação temporária pode ser indicada sem modificar o projeto:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///CAMINHO/ABSOLUTO/node_modules/playwright/index.mjs'
node tests/home.browser.mjs
```

`BASE_URL` e `BROWSER_CHANNEL` permitem apontar para outra prévia/navegador compatível instalado.

Capturas de cada resolução, menu mobile e resultados ficam em `artifacts/home-review/` (ignorados pelo Git). As imagens de página inteira foram revisadas junto das capturas da primeira tela. O servidor usado pelo agente é encerrado após o QA; inicie `npm run dev` para sua revisão.
