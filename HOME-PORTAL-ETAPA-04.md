# Etapa 04 — Home esportiva e header integrado

Entrega: 09/11/2026. Branch: `feat/immersive-home-portal`.

## Base preservada

A main remota consultada estava em `7cb1119`, com o carrossel anterior. A versão local aprovada estava em `c0a06bb` (“hero modificada 1.0”). Esta etapa parte de c0a06bb para preservar a hero coletiva.

O fluxo ativo é `routes/index.tsx → GenerationHome → GenerationHero`. O componente `GenerationHero.tsx`, seu CSS `generation-hero.css`, o PNG e o WebP do elenco não foram alterados. A comparação automatizada com c0a06bb confirmou também a preservação das rotas, do cadastro e das fotografias.

A URL de homepage cadastrada no GitHub, `https://grupobolao1-0.vercel.app`, respondeu HTTP 404 (página da Vercel). Portanto, não foi possível comparar uma versão publicada funcional. Nenhuma configuração de hospedagem foi alterada.

## Resultado visual

Antes, a home repetia os 13 jogadores abaixo da hero e encerrava com um aviso de ausência de estatísticas. O menu apresentava a home como Hall da Fama.

Agora, a hero preservada inicia uma sequência de quatro composições distintas:

1. **O próximo capítulo:** texto editorial ao lado de uma superfície inspirada em transmissão esportiva. Temporada e próxima partida permanecem explicitamente sem registros.
2. **Explore o universo:** três links amplos, com composição assimétrica, para Temporadas, Hall da Fama e Recordes.
3. **Duas histórias. Um confronto:** Abel e Marco Barbosa, escolhidos editorialmente, com suas fotografias e equipes reais. O texto esclarece que é uma prévia sem estatísticas; não há resultado, classificação ou pontuação.
4. **O legado começa agora:** trajetória horizontal no desktop e vertical no mobile, separando o elenco já apresentado dos registros ainda pendentes.

A galeria foi retirada exclusivamente da home. O botão da hero segue para /jogadores, e /biografias continua funcionando como alias da mesma galeria.

O header fica sem separação forte no topo da home; após 48 px de rolagem assume superfície grafite mais sólida, sem mudar de altura. Nas páginas internas ele já começa sólido. A navegação usa a fonte esportiva existente, com “Início” independente de “Hall da Fama”. O footer mantém a estrutura enxuta e aponta para a rota canônica de jogadores.

## Arquivos alterados nesta etapa

| Arquivo | Finalidade |
| --- | --- |
| src/components/home/SeasonSpotlight.tsx | Seção editorial de temporada, preparada para informações oficiais. |
| src/components/home/ExploreUniverse.tsx | Portais inteiramente clicáveis com links do TanStack Router. |
| src/components/home/VersusShowcase.tsx | Apresentação editorial de comparação, usando cadastro e fotos existentes. |
| src/components/home/LeagueJourney.tsx | Marcos reais e estados pendentes, sem datas inventadas. |
| src/components/sports/NewGeneration.tsx | Organização das cinco seções; retirada da galeria e aviso duplicados da home. |
| src/components/site/SiteHeader.tsx | Superfície dependente da rota e da rolagem, com listener passivo e cleanup. |
| src/components/site/SiteFooter.tsx | Link de jogadores alinhado à rota canônica. |
| src/lib/site-navigation.ts | Menu e correspondência correta de rotas, perfis e alias. |
| src/lib/home-portal.ts | Contratos tipados e estados iniciais sem importações. |
| src/styles/home-portal.css | Composições, transições, foco e responsividade das novas seções. |
| src/styles/foundation.css | Integração do header, navegação e movimento reduzido. |
| tests/home-portal.test.mjs | Testes de renderização de estados e correspondência de navegação. |
| tests/home-portal.browser.mjs | Testes de navegação, header, responsividade, perfis e preservação da hero. |
| HOME-PORTAL-ETAPA-04.md | Relatório da entrega. |
| PR-HOME-PORTAL.md | Descrição preparada para o Pull Request. |
| artifacts/home-portal/ | Capturas e resultados. |

## Preparação para dados

`OfficialContent<T>` reutiliza `DataStatus` existente. Apenas `available` permite carregar dados; `not-imported`, `not-played`, `not-qualified` e `no-games` permanecem distintos.

`SeasonSpotlightData` aceita temporada, próxima partida, resultados recentes e destaques. Resultados e destaques só aparecem quando disponíveis e não vazios. `LeagueJourney` aceita marcos tipados. As configurações de estado não importam registros da liga antiga.

Não foi adicionado backend, dependência, fórmula ou dado estatístico. A dupla do VS é uma escolha editorial explícita, independente de desempenho.

## Validação

- Dependências: npm ls --depth=0 confirmou a instalação; npm ci --no-audit --no-fund executado conforme lockfile.
- TypeScript: npx tsc --noEmit.
- Build: npm run build, cliente e SSR.
- ESLint: componentes, tipos, navegação e testes alterados.
- Testes existentes e novos: 16 aprovados com node --test tests/*.test.mjs.
- Navegador: seis larguras — 1920, 1440, 1024, 768, 390 e 360 px.
- Confirmados cinco momentos na home, um único h1 e nenhuma grade de jogadores duplicada.
- Header integrado/sólido, altura constante e nenhum deslocamento de conteúdo após scroll.
- 36 navegações de CTAs por teclado; estado ativo correto nos destinos.
- Mobile: abertura, Escape com retorno de foco, fechamento após navegação e menu acima da hero.
- 13 perfis e alias /biografias preservados.
- Fotografias secundárias com lazy loading, decodificação válida e contain.
- Sem overflow horizontal ou erros JavaScript.
- Inspeção visual das capturas desktop/mobile, das quatro seções e do header nas larguras intermediárias.
- Comparação automatizada: hero, cadastro, rotas e fotografias idênticos a c0a06bb.

A suíte de renderização também verificou os estados não importado, não disputado e não classificado, além de conteúdo disponível com fixtures restritas aos testes. Nenhuma fixture é usada pela aplicação.

## Capturas

- [Home desktop 1440](artifacts/home-portal/home-1440.png)
- [Home desktop 1920](artifacts/home-portal/home-1920.png)
- [Home tablet 768](artifacts/home-portal/home-768.png)
- [Home mobile 390](artifacts/home-portal/home-390.png)
- [Header 1024](artifacts/home-portal/header-1024.png)
- [Resultados do navegador](artifacts/home-portal/validation.json)
- [Consulta à URL publicada](artifacts/home-portal/published-comparison.json)

## Limitações e integração

Os dados oficiais continuam pendentes; as páginas de destino mantêm seus estados atuais. O VS é uma apresentação, sem comparação estatística disponível nesta etapa. Safari e Firefox não foram executados.

O PR para main precisa incluir o commit c0a06bb da hero aprovada, pois ele ainda não estava na main remota consultada. Não foi feito merge automático nem alteração de produção.
