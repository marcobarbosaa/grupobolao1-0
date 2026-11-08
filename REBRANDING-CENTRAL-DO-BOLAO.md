# Central do Bolão — fundação de marca e interface

Entrega de 08/11/2026. O projeto passa a usar **Central do Bolão** como identidade institucional, com monograma CB, logo horizontal, favicon, navegação compartilhada e shell global unificado.

## A. Arquivos da entrega

| Arquivo | Situação | Motivo |
| --- | --- | --- |
| `public/favicon.svg` | Modificado | Novo símbolo CB para a aba do navegador. |
| `src/components/AppSidebar.tsx` | Removido | Removido: sidebar administrativa sem consumidores. |
| `src/components/MobileNav.tsx` | Removido | Removido: navegação mobile antiga sem consumidores. |
| `src/components/holographic/HolographicSelection.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/holographic/HolographicStage.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/home/Immortals.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/home/Legends.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/home/PlayerPortrait.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/home/SeasonTimeline.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/CareerTimeline.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerAchievements.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerBiography.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerDiscovery.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerGallery.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerPageState.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/PlayerStatistics.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/players/ProfileHero.tsx` | Modificado | Retirada de carimbo, código de perfil e convite redundante. |
| `src/components/site/Brand.tsx` | Modificado | Link de marca com o novo SVG e nome acessível. |
| `src/components/site/SiteFooter.tsx` | Modificado | Marca e links úteis, sem assinaturas redundantes. |
| `src/components/site/SiteHeader.tsx` | Modificado | Composição única de logo, navegação e menu. |
| `src/components/sports/HallExperience.tsx` | Modificado | Hero direta e retirada de etiquetas e assinaturas decorativas. |
| `src/components/sports/PlayerAnalysis.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/sports/PlayerSelection.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/components/sports/SectionHeader.tsx` | Modificado | Compatibilidade com o novo PageHeader, sem eyebrow obrigatório. |
| `src/components/ui/badge.tsx` | Modificado | Badges contidos e variante de conquista. |
| `src/components/ui/button.tsx` | Modificado | Foco, altura de toque, contraste e geometria alinhados à marca. |
| `src/lib/mock-data.ts` | Modificado | Substituição institucional na biografia de Binho, sem alteração estatística. |
| `src/routes/__root.tsx` | Modificado | Shell uniforme, metadados da marca e apresentação 404. |
| `src/routes/biografias.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/deep-analytics.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/hall-da-fama.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/index.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/jogadores.$id.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/jogadores.index.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/recordes.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/routes/temporadas.tsx` | Modificado | Atualização institucional e/ou simplificação de rótulos auxiliares. |
| `src/styles.css` | Modificado | Fonte central de tokens semânticos e utilidades de superfície. |
| `src/styles/players.css` | Modificado | Retirada do afastamento próprio do header; passa a vir do shell. |
| `src/styles/site.css` | Modificado | Retirada de tokens duplicados e estilos antigos do header. |
| `src/styles/sports.css` | Modificado | Larguras e ritmo vertical pelos tokens compartilhados. |
| `public/brand/central-do-bolao.svg` | Criado | Logo horizontal SVG independente com fonte incorporada. |
| `public/brand/cb-symbol.svg` | Criado | Monograma CB vetorial para uso reduzido. |
| `src/lib/brand.ts` | Criado | Configuração central da marca. |
| `src/components/site/BrandLogo.tsx` | Criado | Componente da logo com duas variantes. |
| `src/components/site/MainNavigation.tsx` | Criado | Links e estado ativo compartilhados. |
| `src/components/site/MobileMenu.tsx` | Criado | Menu acessível com fechamento e gerenciamento de foco. |
| `src/components/site/PageHeader.tsx` | Criado | Cabeçalho de página com contexto funcional opcional. |
| `src/styles/foundation.css` | Criado | Shell, navegação e fundação visual responsiva. |
| `tests/rebrand.browser.mjs` | Criado | Testes de metadados, layout, menu, assets e preservação. |
| `REBRANDING-CENTRAL-DO-BOLAO.md` | Criado | Relatório e orientação para a próxima fase. |

## B. Resumo visual

**Antes:** monograma CL, nome Central da Liga e referências ao Grupo Bolão misturadas em títulos e textos; assinatura esportiva sob a marca; plataforma no canto do header; etiquetas institucionais na hero; espaçamento do conteúdo condicionado à rota; componentes antigos de sidebar ainda presentes.

**Agora:** símbolo CB angular em vermelho, nome completo em uma linha e navegação clara. A marca não contém bola, equipe ou referência a um esporte específico. A hero mantém o título e os jogadores reais, com uma descrição funcional e CTAs. O rodapé oferece links úteis. Todas as páginas usam o mesmo afastamento do header, largura máxima e base de superfícies.

Foram retirados do fluxo atual:
- “NBA 2K26 / PC”, “NBA dos Crias / Sports Gaming” e o breadcrumb institucional da hero.
- Faixa de assinaturas abaixo da hero e número gigante decorativo.
- Código de perfil sem função de navegação, carimbo institucional sobre a foto e frase de convite redundante no perfil.
- Numeração cenográfica dos cabeçalhos de seção e do menu principal mobile.
- Marca repetida em etiquetas de origem de biografia e em estados de carregamento.
- Os componentes obsoletos de sidebar e navegação mobile, que não tinham consumidores.

Rótulos úteis foram preservados: fase, temporada, posição, arquétipo, nota de legado, títulos e avisos de estimativa. O novo `PageHeader` admite um contexto curto, como “Recordes”, quando o título expressivo sozinho não identifica a seção.

### Logo e assets

- [Logo horizontal SVG](public/brand/central-do-bolao.svg)
- [Símbolo CB SVG](public/brand/cb-symbol.svg)
- [Favicon SVG](public/favicon.svg)
- [Prancha de tamanhos](artifacts/redesign-review/rebrand/brand-assets.png)

O símbolo usa geometria vetorial própria com cantos recortados e letras CB em espaço negativo. A versão horizontal incorpora Barlow Condensed no próprio SVG para funcionar de forma independente, sem chamadas externas de fonte. A licença já está em `public/fonts/BarlowCondensed-OFL.txt`. As fotos dos atletas não foram alteradas.

### Base reutilizável

- `brand.ts`: nome, descrição e caminhos oficiais.
- `BrandLogo`: variantes horizontal e símbolo, com alternativa textual ou uso decorativo.
- `Brand`: marca com link para o início.
- `MainNavigation`: única lista de links para desktop e mobile, com seção ativa.
- `MobileMenu`: diálogo Radix com foco, Escape, fechamento após navegação e ao mudar para desktop.
- `SiteHeader`: composição única da marca e navegação.
- `PageHeader`: título, descrição, contexto opcional e ações opcionais.
- `SectionHeader`: compatibilidade para consumidores anteriores, sem etiquetas decorativas obrigatórias.
- Componentes existentes `Button` e `Badge`: alinhados aos tokens; badge de conquista disponível sem criar uma nova família de cards.

Tokens de marca, espaçamento, largura, altura do header, títulos, bordas, superfícies, foco, sombras e movimento estão em `src/styles.css`. A fundação compartilhada está em `src/styles/foundation.css`; composições específicas continuam nos estilos das páginas. Vidro e brilho contínuo das utilidades legadas foram substituídos por superfícies opacas e sombras contidas.

Para próximas páginas, usar o shell existente e `PageHeader` dentro de `sports-page`; não acrescentar padding de header por rota. Contexto auxiliar deve identificar algo útil, sem repetir a marca.

## C. Validação executada

| Verificação | Resultado |
| --- | --- |
| Build inicial | Aprovado, cliente e SSR. |
| Build após alterações | Aprovado, cliente e SSR. |
| Typecheck inicial e final | `npx tsc --noEmit` aprovado. |
| Lint inicial desta sessão | 11.631 erros e um aviso. |
| Lint final | 7.983 erros e um aviso, sem aumento por arquivo. |
| Lint dos novos componentes e teste | Aprovado. |
| Testes de dados | 8 aprovados. |
| Nova suíte de rebranding | 40 combinações de rota/largura, dois estados 404, assets SVG e navegação aprovados. |
| Regressão funcional existente | 13 perfis, 22 temporadas, seis categorias de recordes, filtros e arena VS aprovados. |
| Diff | `git diff --check` aprovado. |

O lint global permanece com problemas de formatação preexistentes. Entre os arquivos modificados, somente `mock-data.ts` mantém erros: 558 antes e 558 depois. Esse arquivo recebeu apenas a substituição do nome da marca no texto de Binho; não foi reformatado amplamente para evitar misturar a alteração institucional com uma revisão dos dados. Os demais arquivos de código alterados e os novos componentes estão sem erros de lint.

A nova suíte verificou `/`, `/hall-da-fama`, `/temporadas`, `/recordes`, `/biografias`, `/jogadores`, `/jogadores/8` e `/deep-analytics` em **320, 390, 768, 1024 e 1440 px**. Conferiu títulos, metadados, logo carregada, ausência de etiquetas removidas, ausência de overflow de página e títulos sem cobertura pelo header.

Também foram verificados:
- Menu aberto por teclado, contenção de foco, Escape e retorno ao botão.
- Fechamento ao navegar, ao escolher a rota atual, pelo botão de fechar e ao mudar para desktop.
- Respostas HTTP 404 para rota inexistente e jogador inexistente.
- Servimento dos três SVGs com sucesso.
- Ausência de exceções JavaScript nas duas suítes.
- Preservação exata do motor, dados de temporadas, adaptadores, árvore de rotas, dependências e lockfile.
- Comparação de `mock-data.ts` com o HEAD: a única diferença de conteúdo é “Central da Liga” → “Central do Bolão”.

A revisão visual foi feita nas capturas desktop/mobile da home, Recordes, Biografias, perfil, menu e estados 404. O símbolo foi conferido de 16 a 96 px.

### Evidências

- [Validação do rebranding](artifacts/redesign-review/rebrand/validation.json)
- [Regressão funcional](artifacts/redesign-review/results.json)
- [Lint inicial](artifacts/redesign-review/rebrand-lint-before.json)
- [Lint final](artifacts/redesign-review/rebrand-lint-after.json)

| Tela | Desktop | Mobile |
| --- | --- | --- |
| Home | [Captura](artifacts/redesign-review/rebrand/home-1440.png) | [Captura](artifacts/redesign-review/rebrand/home-390.png) |
| Recordes | [Captura](artifacts/redesign-review/rebrand/recordes-1440.png) | [Captura](artifacts/redesign-review/rebrand/recordes-390.png) |
| Biografias | [Captura](artifacts/redesign-review/rebrand/biografias-1440.png) | [Captura](artifacts/redesign-review/rebrand/biografias-390.png) |
| Perfil | [Captura](artifacts/redesign-review/rebrand/perfil-1440.png) | [Captura](artifacts/redesign-review/rebrand/perfil-390.png) |
| Menu | — | [Captura](artifacts/redesign-review/rebrand/menu-390.png) |

Com o Vite em `http://127.0.0.1:8080`, as suítes aceitam `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL` e `BASE_URL`. Nesta máquina foi reutilizado `file:///D:/Dev/Projetos/visdna/node_modules/playwright-core/index.mjs`, com Edge headless, sem instalar dependências no projeto.

Comandos executados:

```powershell
npm run build
npx tsc --noEmit
npm run lint -- --format json --output-file artifacts/redesign-review/rebrand-lint-after.json
node --test tests/player-data.test.mjs
node tests/rebrand.browser.mjs
# Regressão funcional, sem repetir sua matriz visual:
$env:SKIP_VIEWPORTS = '1'
node tests/redesign.browser.mjs
```

## D. Pendências e próxima fase

- O lint global precisa de uma etapa própria de normalização, especialmente finais de linha e formatação.
- A revisão visual foi feita no Edge headless, sem auditoria com leitor de tela ou testes em Safari/dispositivos físicos.
- Rankings, totais estimados e fórmulas existentes continuam com suas limitações anteriores; esta etapa não altera critérios estatísticos.
- O refinamento de composições e conteúdo de Hall, Biografias, perfis, Recordes, Temporadas e Deep Analytics pode agora usar a fundação compartilhada.
- Documentos de etapas anteriores mantêm seus nomes históricos; eles não são conteúdo servido pela aplicação.
- Alterações implementadas localmente, sem commit ou publicação automática.
