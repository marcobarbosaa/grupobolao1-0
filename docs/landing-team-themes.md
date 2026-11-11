# Temas dinâmicos da landing — Central do Bolão

## Resultado

Antes, a home mantinha fundo, iluminação, marca, cartões e estados de interação vermelhos para todos os protagonistas. Agora a composição inteira acompanha a equipe do jogador ativo. As páginas internas conservam os estilos anteriores. Dados estatísticos, conteúdo editorial, rotas e imagens originais não foram alterados.

## Paletas

Cores de referência das equipes; fundos e superfícies são derivados escuros para leitura. Hornets mantém a identidade histórica de New Orleans, não a dos Pelicans.

| Equipe | Primária | Secundária | Acento |
| --- | --- | --- | --- |
| New Orleans Hornets | #008CA8 | #1D1160 | #FDBB30 |
| Sacramento Kings | #5A2D81 | #63727A | #A7A9AC |
| Atlanta Hawks | #E03A3E | #FDB927 | #FDB927 |
| Denver Nuggets | #0E2240 | #FEC524 | #1D428A |
| Indiana Pacers | #002D62 | #FDBB30 | #FDBB30 |
| Detroit Pistons | #C8102E | #1D42BA | #BEC0C2 |
| Toronto Raptors | #CE1141 | #000000 | #A1A1A4 |
| New York Knicks | #006BB6 | #F58426 | #F58426 |
| San Antonio Spurs | #C4CED4 | #000000 | #9FA7AD |
| Minnesota Timberwolves | #0C2340 | #236192 | #78BE20 |
| Philadelphia 76ers | #006BB6 | #ED174C | #FFFFFF |
| Houston Rockets | #CE1141 | #000000 | #C4CED4 |
| Chicago Bulls | #CE1141 | #000000 | #FFFFFF |

Referências: [paletas NBA](https://teamcolorcodes.com/nba-team-color-codes/), [marca Kings](https://www.nba.com/kings/brand-kings), [marca histórica Hornets](https://www.sportslogos.net/logos/view/811/New-Orleans-Hornets-Logo/2003/Primary-Logo). A aplicação adapta essas cores para interface; não pretende reproduzir cada uniforme ou atualização histórica. Celtics não pertence ao elenco atual.

## Mecanismo

O estado existente `playerIndex` passou para um contexto da home, compartilhado pelo cabeçalho e pela composição. O intervalo original de 6 segundos permanece único, com atualização funcional; a troca de paleta não recria esse intervalo. O seletor de temporada e a rotação editorial continuam independentes.

Treze propriedades semânticas registradas com `@property` interpolam cores no ancestral `[data-landing-team]`, durante 1200 ms. Descendentes herdam o mesmo quadro interpolado; retratos usam a mesma duração. O portal Radix do menu mobile é montado nesse ancestral, evitando diferenças de tema. Sair de "/" desmonta esse estado e limpa o intervalo, sem escrever estilos em body ou documentElement.

O modo de movimento reduzido desativa transições e a rotação automática conforme o comportamento existente. Navegadores sem suporte a propriedades registradas recebem as cores finais, mas podem trocar sem interpolação.

## Arquivos

| Arquivo | Mudança e motivo |
| --- | --- |
| src/lib/landing-team-themes.ts (novo) | Paletas dos 13 times, tokens derivados e fallback neutro. |
| src/components/home/LandingThemeShell.tsx (novo) | Estado compartilhado e isolamento da home. |
| src/components/home/LandingTheme.css (novo) | Interpolação, foco, seleção, menu mobile e aliases locais. |
| src/components/home/CinematicHome.tsx | Consome o índice compartilhado mantendo os intervalos existentes. |
| src/components/home/CinematicHome.css | Substitui cores fixas por tokens em toda a composição. |
| src/components/site/BrandLogo.tsx | Versão SVG tematizável preservando o símbolo CB existente. |
| src/components/site/Brand.tsx | Ativa marca tematizada na home. |
| src/components/site/MobileMenu.tsx | Portal e marca herdam o tema da home. |
| src/routes/__root.tsx | Integra o shell que delimita o tema. |
| tests/landing-team-themes.test.mjs (novo) | Cobertura do elenco, contraste e auditoria de cores. |
| tests/landing-team-themes.browser.mjs (novo) | Ciclo completo, interpolação, timer, mobile, foco e isolamento. |
| docs/landing-team-themes.md (novo) | Relatório e instruções de validação. |

## Auditoria de cores

Removidos vermelhos, rosas e vinhos fixos de gradientes, sombras, pseudo-elementos, texto gigante, bordas, diagonais, halo, seletor, cartões e estados hover/focus. A marca inline utiliza os tokens do tema. Os valores hexadecimais restantes no CSS da composição são brancos neutros, inclusive transparências, usados para contraste e textura.

Os tokens antigos consumidos pelo header são sobrescritos somente no ancestral da home. A navegação ativa, foco, seleção de texto, botões e portal mobile também foram auditados. As cores pertencentes às fotografias e uniformes são preservadas.

## Validação

- Build de cliente e servidor: aprovado.
- Typecheck (`npx tsc --noEmit`): aprovado.
- Testes da aplicação (`node --test tests/*.test.mjs`): 19 aprovados.
- Lint dos sete arquivos TypeScript/TSX alterados: aprovado sem avisos.
- Lint geral executado excluindo a cópia local preexistente `grupobolao1-0/`: 10.169 erros e 2 avisos, principalmente formatação e CRLF em arquivos preexistentes. Não foi feita reformatação em massa fora do escopo.
- Contraste: textos principal, secundário e foco >= 4,5:1 sobre os quatro tokens de fundo/superfície de cada equipe. A intensidade dos gradientes foi limitada para preservar a leitura na paleta prata.
- Edge/Chromium: 13 protagonistas e equipes, apenas um temporizador com identidade estável, interpolação intermediária real, quatro cartões, foco, seletor, portal mobile, Escape e restauração de foco.
- Desktop 1440×900 e mobile 390×844 / 360×800, sem overflow horizontal; revisão das capturas de Spurs, Nuggets e Kings/mobile.
- Movimento reduzido: protagonista permanece Rockets após mais de um ciclo, sem transição perceptível.
- Navegação da home para jogadores: tema e intervalo removidos; cabeçalho comparado com carregamento direto. Rotas internas principais verificadas no teste de navegador.
- Nenhuma dependência de produção adicionada. Playwright foi instalado em diretório temporário para a execução.

Evidências locais (ignoradas pelo Git): `artifacts/home-review/team-themes/`, incluindo capturas e `results.json`. Para reproduzir, configure `PLAYWRIGHT_MODULE` com um módulo Playwright disponível, `BASE_URL` com o servidor local e execute `node tests/landing-team-themes.browser.mjs`.

Limitações: inspeção visual feita em Edge/Chromium; Safari e Firefox não foram executados. O teste numérico de contraste cobre tokens de superfícies, não cada pixel de fotografias ou sobreposições. O lint geral continua com a dívida de formatação existente.
