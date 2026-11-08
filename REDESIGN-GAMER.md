# Redesign gamer — Central da Liga

Entrega local em 26/10/2026. Identidade: **Central da Liga — Sports Gaming Experience / NBA dos Crias**.

## A. Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `src/styles.css` | Tokens semânticos da paleta, aliases para estilos existentes e importação do tema esportivo; retirada do CSS holográfico sem uso nas rotas. |
| `src/styles/sports.css` (novo) | Composições próprias para Hall, pódio, capítulos, recordistas, cartas e confronto; responsividade e redução de movimento. |
| `src/routes/__root.tsx` | Identidade nos títulos e espaçamento do layout compartilhado, sem dependência de sidebar. |
| `src/components/site/Brand.tsx` | Marca tipográfica Central da Liga e monograma CL. |
| `src/components/site/SiteHeader.tsx` | Identificação do menu mobile atualizada; mantém o diálogo Radix com foco e fechamento. |
| `src/components/site/SiteFooter.tsx` | Assinatura NBA dos Crias. |
| `src/lib/site-navigation.ts` | Hall, Temporadas, Recordes, Comparar e Biografias; estados ativos também para aliases e perfis. |
| `src/routes/index.tsx` | Abertura, Hall e classificação compartilhados, seguidos pelo histórico navegável existente. |
| `src/routes/hall-da-fama.tsx` | Preserva a rota e utiliza a experiência completa do Hall. |
| `src/components/sports/HallExperience.tsx` (novo) | Hero assimétrica, pódio com fotos, gráfico Top 10 e tabela com todos os 13 jogadores. |
| `src/routes/temporadas.tsx` | Capítulo selecionado, anterior/próximo, seletor e linha do tempo com 22 registros expansíveis. |
| `src/routes/recordes.tsx` | Seis categorias, líder fotografado, valor em destaque, próximos quatro e links para perfis. |
| `src/routes/biografias.tsx` | Deixa de apenas redirecionar e passa a oferecer a seleção de atletas, preservando filtros de URL. |
| `src/routes/jogadores.index.tsx` | Reutiliza a seleção por cartas; mantém a rota do elenco e os filtros existentes. |
| `src/components/sports/PlayerSelection.tsx` (novo) | Carrossel Embla, cartas verticais, foco no selecionado, busca e filtros, conquistas e abertura do perfil. |
| `src/routes/deep-analytics.tsx` | Arena VS, inversão de lados, intervalo corrigido, rótulos acessíveis, cores semânticas e animações compatíveis com movimento reduzido. |
| `src/components/sports/VersusPanel.tsx` (novo) | Retratos, seletores, arquétipos, notas e títulos; impede escolher o mesmo atleta dos dois lados. |
| `src/components/sports/SectionHeader.tsx` (novo) | Hierarquia de abertura consistente entre as páginas. |
| `src/components/players/ProfileHero.tsx` | Nota de legado na apresentação e acesso à análise pelos capítulos. |
| `src/components/players/PlayerProfile.tsx` | Ordem: apresentação, conquistas, biografia, evolução, estatísticas, análise e descoberta. |
| `src/components/players/PlayerAchievements.tsx` | Numeração coerente com a nova ordem dos capítulos. |
| `src/components/players/PlayerBiography.tsx` | Numeração coerente com a nova ordem dos capítulos. |
| `src/components/sports/PlayerAnalysis.tsx` (novo) | Radar, boletim por fase e nota final a partir dos valores existentes; metodologia identificada. |
| `src/routes/jogadores.$id.tsx` | Títulos de página atualizados; loader, IDs e tratamento de jogador ausente mantidos. |
| `tests/redesign.browser.mjs` (novo) | Regressão de rotas, conteúdo, imagens, seleção, comparação, responsividade e teclado, com capturas. |
| `.gitignore` | Exclui os artefatos locais de revisão do versionamento. |
| `REDESIGN-GAMER.md` (novo) | Este relatório. |

Os componentes antigos `AppSidebar.tsx` e `MobileNav.tsx` já estavam fora da árvore renderizada. A aplicação continua usando apenas o cabeçalho compartilhado; nenhum selo Beta ou margem de sidebar é exibido. Os componentes de experiências anteriores foram preservados no repositório, mas o fluxo de seleção não importa a cena Three.js.

## B. Resumo visual

O estado encontrado já possuía cabeçalho horizontal, fontes locais e perfis editoriais. Hall, Temporadas, Recordes e Comparar ainda tinham painéis antigos; Biografias redirecionava para uma experiência holográfica. O trabalho partiu desse estado real, sem reconstruir o projeto.

| Página | Antes | Agora |
| --- | --- | --- |
| Início / Hall | Home editorial e Hall separado, com pódio textual sem retratos. | Hero com atleta, pódio de três alturas e hierarquia explícita, depois gráfico e classificação completa. |
| Temporadas | Grade de cards repetidos. | Capítulo histórico selecionado e arquivo cronológico com expansão progressiva. |
| Recordes | Seis painéis numéricos semelhantes. | Museu com navegação por categoria, retrato do líder e ranking secundário. |
| Biografias / Jogadores | Redirecionamento e seleção 3D. | Cartas fotográficas em carrossel, filtros funcionais e detalhe inline do selecionado. |
| Perfil | Biografia, conquistas e registros importados. | Conquistas antes da história, legado no hero e análise ao final; trajetória e dados importados preservados. |
| Comparar | Dois selects acima de painéis. | Confronto visual A × B, troca de lados, retratos e análise abaixo. |

A paleta principal usa `#090C12`, `#11151D`, `#191F2B`, `#F04B35` e `#F2C365`, com Barlow Condensed e Inter locais. As fotos usam as versões WebP de 480/960 já existentes, com dimensões reservadas, prioridade na abertura e carregamento adiado para conteúdo secundário. Os originais permanecem intactos.

**Regra do destaque:** ordem decrescente de `scoreTotal`, mantendo a ordem do acervo em caso de empate. Nando permanece em primeiro, seguido por Gam e Medeiros. A regra está documentada no componente e na interface. Nenhuma nota é recalculada pelo redesign.

## C. Funcionalidades preservadas e verificadas

- Os 13 jogadores continuam acessíveis por seus IDs originais.
- A ordem e as 13 notas da classificação renderizada correspondem aos valores originais.
- Todas as 22 temporadas foram selecionadas no navegador e comparadas com os campeões, MVPs e MVPs das Finais do acervo.
- As seis categorias de recordes preservam os cinco primeiros colocados e valores do cálculo anterior.
- Todas as cartas foram selecionadas por teclado; seus caminhos de foto e links de perfil foram conferidos. O teste também verifica a posição das imagens dentro das cartas.
- Busca, estado vazio, limpeza, filtro de equipe e ordenação foram exercitados. O teste de dados existente cobre a combinação com o filtro de posição.
- Inversão do VS, jogadores distintos, fases e correção do intervalo nas duas direções foram exercitados.
- Os 13 perfis foram abertos, com conferência de nomes, imagens e notas. Regular, Playoffs e Finais, além da tabela detalhada, foram exercitados no perfil de Nando.
- Menu mobile: navegação e fechamento, Escape, retorno de foco, contenção do foco e indicação visual de foco.
- Preferência de movimento reduzido, carregamento de imagens e ausência de exceções JavaScript na execução de navegador.
- O código dos seis módulos de dados/adaptação listados em `validation.json` permanece sem diferenças em relação ao HEAD inicial.

## D. Limitações e próximos passos

**Totais estimados preservados.** Pontos, rebotes, assistências, roubos e tocos ainda usam `round(média × 82 × temporadas)`. A interface identifica isso como estimativa. Títulos são identificados separadamente como conquistas registradas. Não houve troca por uma soma supostamente exata de médias arredondadas.

**Motor legado preservado.** O comparador continua usando o histórico montado em `mock-data.ts`, que possui preenchimentos e estimativas preexistentes. Uma fase ausente continua produzindo zero no cálculo original de evolução; essa limitação agora aparece na interface. O perfil mantém a distinção entre dados importados, ausências e zeros nos registros por temporada. As notas, Clutch e radar são métricas da liga, não atributos oficiais do jogo.

**Biografias preservadas.** Textos históricos podem conter afirmações que não coincidem integralmente com o ranking calculado ou prêmios estruturados. Não foram reescritos nem usados para inventar estatísticas.

**Lint global preexistente.** O estado inicial tinha 5.270 erros e um aviso, principalmente de formatação e finais de linha. O resultado final tem 4.753 erros e um aviso, todos fora dos arquivos desta entrega. Uma normalização ampla deve ser feita separadamente.

**Escopo da revisão.** Navegador usado: Microsoft Edge headless no Windows. Não foi executada auditoria com leitor de tela, Safari ou dispositivo físico. Os testes visuais de etapas anteriores, específicos das cenas 3D e layouts substituídos, não foram executados; a nova suíte cobre os fluxos atuais.

Sugestões futuras: revisão estatística isolada com dados completos de partidas, reconciliação entre biografias e conquistas estruturadas, ampliação da matriz de navegadores e limpeza dos componentes antigos sem uso. Rivalidades, badges avançados e cartas especiais continuam fora desta entrega.

## E. Validação

| Verificação | Inicial | Final |
| --- | --- | --- |
| `npm run build` | Aprovado; aviso de chunk acima de 500 kB. | Aprovado para cliente e SSR; sem o aviso de chunk acima de 500 kB. |
| `npx tsc --noEmit` | Aprovado. | Aprovado. |
| `npm run lint` | 5.270 erros, um aviso. | 4.753 erros, um aviso preexistentes. Nenhum erro/aviso nos arquivos alterados ou novos. |
| `node --test tests/player-data.test.mjs` | — | 8 testes aprovados. |
| `node tests/redesign.browser.mjs` | — | Aprovado: 40 combinações de rota/largura e 13 perfis, sem exceções JavaScript. |

Larguras verificadas: **360, 390, 768, 1024 e 1440 px**. Rotas: `/`, `/hall-da-fama`, `/temporadas`, `/recordes`, `/biografias`, `/jogadores`, `/jogadores/8` e `/deep-analytics`, mais os demais perfis durante os testes funcionais. Não foi detectado overflow horizontal da página nessas combinações; tabelas e carrosséis usam rolagem própria.

A revisão visual das capturas identificou e corrigiu o posicionamento das fotos nas cartas. Capturas finais foram geradas após a correção, com rolagem para carregar imagens secundárias.

Evidências locais:
- [Resultados do navegador](artifacts/redesign-review/results.json)
- [Comparação de validação e preservação de dados](artifacts/redesign-review/validation.json)
- [Saída detalhada do lint](artifacts/redesign-review/lint.json)

| Página | Desktop | Mobile |
| --- | --- | --- |
| Hall | [Captura](artifacts/redesign-review/home-1440.png) | [Captura](artifacts/redesign-review/home-390.png) |
| Temporadas | [Captura](artifacts/redesign-review/temporadas-1440.png) | [Captura](artifacts/redesign-review/temporadas-390.png) |
| Recordes | [Captura](artifacts/redesign-review/recordes-1440.png) | [Captura](artifacts/redesign-review/recordes-390.png) |
| Biografias | [Captura](artifacts/redesign-review/biografias-1440.png) | [Captura](artifacts/redesign-review/biografias-390.png) |
| Perfil | [Captura](artifacts/redesign-review/jogadores-8-1440.png) | [Captura](artifacts/redesign-review/jogadores-8-390.png) |
| Comparar | [Captura](artifacts/redesign-review/deep-analytics-1440.png) | [Captura](artifacts/redesign-review/deep-analytics-390.png) |

Reprodução no ambiente atual:

```powershell
npm run dev -- --host 127.0.0.1 --port 8080
# Em outro terminal:
$env:PLAYWRIGHT_MODULE = 'file:///D:/Dev/Projetos/visdna/node_modules/playwright-core/index.mjs'
node tests/redesign.browser.mjs
node --test tests/player-data.test.mjs
npx tsc --noEmit
npm run build
npm run lint
```

A suíte aceita `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL` e `BASE_URL`. Playwright foi reutilizado de uma instalação local existente, sem alterar dependências, lockfile, Vite ou backend. A entrega não inclui publicação nem commit automático.
