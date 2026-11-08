# Grupo Bolão 2.0 — Etapa 2.1

Protótipo local de seleção holográfica do Nando, pronto para revisão visual. Sem commit, push ou publicação.

## Experiência

`/jogadores` agora apresenta uma sala de seleção com Nando, plataforma circular, iluminação vermelha, fundo obsidian, nome editorial e painel de identidade. A galeria anterior continua no código, mas foi substituída nesta rota durante o protótipo. Os filtros antigos são aceitos na URL para compatibilidade, mas não filtram esta seleção de um atleta.

- Nando começa selecionado. Frente, esquerda, costas e direita são vistas selecionáveis por botões, teclado ou toque.
- Hover ou foco na figura acentua seu contorno, a borda do palco e o CTA. O cursor desloca a câmera suavemente; a plataforma pulsa e o atleta tem uma micro-oscilação em repouso.
- A figura é um link acessível e o botão **Abrir carreira** abre `/jogadores/8`, o identificador real do cadastro.
- Os controles de atleta anterior/próximo estão desabilitados com um único item. A interface informa que outros jogadores virão depois.
- Posição, arquétipo e equipes vêm do cadastro existente, sem estatísticas ou conquistas inventadas.
- A Home, os componentes de perfil, os dados históricos e as outras páginas não foram alterados. `/biografias` mantém o redirecionamento 301 e os parâmetros válidos.

## Representação e referências

A cena usa Three.js com câmera em perspectiva, cilindro da plataforma, aros, marcações, luzes reais e sombra suave. O atleta é um **plano com contorno e textura**, sempre orientado à câmera: não existe uma malha corporal, rig, reconstrução tridimensional ou extração do NBA 2K26.

Os quatro PNGs de corpo inteiro em `public/references/nando/` são as texturas originais. Contornos desenhados em coordenadas dessas capturas delimitam uma `ShapeGeometry`; as coordenadas UV mantêm os pixels originais do cabelo, uniforme 25, acessórios, tatuagens e calçados. A apresentação 2D reutiliza esses contornos com `clip-path`. Nenhum PNG foi editado e nenhuma imagem do atleta foi sintetizada.

As vistas mudam por seleção explícita, sem interpolação inventada de ângulos intermediários. Uma camada de shader acrescenta linhas e varredura de projeção de baixa intensidade; o contorno usa ciano apenas como acento. O personagem mantém as cores e a iluminação registradas no jogo. Os closes de rosto/cabeça permanecem disponíveis, sem carregamento nesta etapa.

## Fallbacks e desempenho

- Movimento reduzido: apresentação estática 2D, sem importar o módulo Three.js. Mudanças da preferência durante a visita também são respeitadas.
- WebGL indisponível, erro de inicialização/importação/renderização ou perda de contexto: fallback 2D com o mesmo painel e links.
- Dispositivos reportando até 2 GB de memória, até 2 processadores lógicos ou economia de dados: apresentação leve. Esses sinais são heurísticos e não substituem testes em aparelhos físicos.
- Botão **Modo leve**: permite desligar o 3D manualmente e voltar à apresentação automática.
- Vista ausente: desabilita o respectivo botão e utiliza outra vista disponível. A interface informa as referências ausentes e a vista exibida.
- Todas as vistas ausentes: usa o WebP existente do Nando e, se necessário, o JPEG original. Sem qualquer imagem, mostra iniciais e mantém o acesso à carreira.
- Os carregamentos têm timeout e proteção contra atualização após desmontagem. As imagens de corpo inteiro somam aproximadamente 1,4 MB e são pequenas o suficiente para evitar texturas gigantes.
- Canvas importado apenas no cliente, limite de 30 quadros por segundo e pixel ratio limitado a 1,25 em canvas estreito e 1,75 no restante. Sem pós-processamento ou sistema de partículas.
- Renderização suspensa com a aba oculta ou palco fora da tela. Geometrias, materiais, texturas, observadores e contexto são liberados ao sair ou ativar o modo leve.
- Estado inicial compatível com SSR; nenhum acesso a `window` durante a renderização inicial.

## Arquivos

| Arquivo                                                | Responsabilidade                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `src/lib/holographic-player.ts`                        | Tipos, adaptação do cadastro, configuração dos quatro ângulos e contornos |
| `src/components/holographic/HolographicSelection.tsx`  | Lista de atletas, índice selecionado, controles e estados da seleção      |
| `src/components/holographic/HolographicStage.tsx`      | Carregamento tardio do 3D, capacidades, fallback e link da figura         |
| `src/components/holographic/createHolographicScene.ts` | Cena Three.js, câmera, iluminação, efeitos e descarte de recursos         |
| `src/components/holographic/PlayerOverlay.tsx`         | Nome, identidade e CTA para a carreira                                    |
| `src/components/holographic/usePlayerAssets.ts`        | Resolução das referências e cadeia de fallback de imagens                 |
| `src/styles/holographic.css`                           | Estilos limitados à seleção, responsividade e movimento reduzido          |
| `src/routes/jogadores.index.tsx`                       | Integração do protótipo e metadados                                       |
| `src/styles.css`                                       | Importação do novo CSS                                                    |
| `package.json`, `package-lock.json`                    | Dependências 3D                                                           |
| `tests/holographic.browser.mjs`                        | Testes do palco, navegação, seis larguras e cenários de falha             |
| `tests/players.browser.mjs`                            | Regressão dos perfis adaptada à substituição da galeria                   |
| `.gitignore`                                           | Exclusão dos artefatos locais de revisão                                  |
| `ETAPA-2.1.md`                                         | Relatório desta entrega                                                   |

As oito referências em `public/references/` já estavam presentes e não versionadas antes do trabalho. Foram preservadas.

## Dependências e expansão

Adicionadas `three@^0.186.1` e `@types/three@^0.186.0` (desenvolvimento). Nenhuma dependência React Three Fiber, Drei, animação ou teste foi adicionada. O navegador foi controlado com a instalação existente de Playwright e Edge.

Para incluir um próximo atleta, cadastrar seu conjunto de `PlayerView` no mapa de capturas de `createHolographicRoster`, usando seu ID real. `adaptHolographicPlayer` deriva a apresentação dos dados existentes; a lista, o índice, os botões de seleção e os limites anterior/próximo já operam com múltiplos itens. O palco e o painel recebem o atleta por props. A seleção reinicia as vistas e o estado do palco ao trocar o atleta. Não há outros atletas fictícios no protótipo.

Referência técnica: [documentação oficial do Three.js](https://threejs.org/docs/).

## Verificação

| Verificação                                                    | Resultado                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run build`                                                | Passou, cliente e SSR                                                                     |
| `npx tsc --noEmit`                                             | Passou                                                                                    |
| ESLint dos arquivos implementados/alterados de código e testes | Passou                                                                                    |
| `npm run lint` global                                          | 5.270 erros e 1 aviso preexistentes; mesma contagem antes/depois, nenhum diagnóstico novo |
| `node --test tests/player-data.test.mjs`                       | 8 testes passaram                                                                         |
| `node tests/holographic.browser.mjs`                           | Passou                                                                                    |
| `node tests/players.browser.mjs`                               | Passou; 13 perfis, dados, fases, teclado, toque e erros esperados                         |
| `node tests/home.browser.mjs`                                  | Passou; Home, navegação, outras rotas e responsividade                                    |
| Home em 390 e 1440 pixels                                      | Capturas PNG idênticas às referências da etapa anterior                                   |
| `git diff --check`                                             | Passou                                                                                    |

O build informa um novo aviso de tamanho no módulo 3D, aproximadamente 554 KB minificado / 141 KB gzip. Ele é separado e carregado sob demanda; não foi ocultado por aumento do limite de aviso.

O lint global foi comparado por arquivo, regra, mensagem, linha e coluna. Os relatórios estão em `artifacts/holographic-review/lint-before.json` e `lint-after.json`. Não foi aplicado autofix no legado.

Navegador verificado em 360, 390, 768, 1024, 1440 e 1920 pixels, sem overflow horizontal ou erros inesperados de JavaScript/hidratação. A suíte cobre quatro ângulos, hover, seleção, foco/Enter, CTA, retorno, modo leve, preferência de movimento em tempo real, perda/ausência de WebGL, dispositivo limitado, ausência da vista frontal, ausência de todas as referências e ausência de todas as imagens. A regressão dos perfis cobre navegação por toque.

Capturas e resultados estão em `artifacts/holographic-review/`. Destaques: `selection-1440.png`, `selection-390.png`, `hover.png`, `reduced-motion.png` e `results.json`. Inspeção visual incluiu desktop, mobile, vistas lateral/traseira e apresentação 2D.

## Limitações

- Um atleta e quatro vistas discretas; não há rotação corporal contínua, animação esquelética ou modelo 3D completo.
- Contornos são específicos das capturas atuais. Substituir os PNGs por imagens com enquadramento diferente exige ajustar os contornos. Pequenas imperfeições de borda e a resolução original podem aparecer em ampliações.
- Os closes não são usados para reconstrução facial ou detalhe adicional.
- A galeria filtrável está temporariamente fora da rota; os outros perfis continuam acessíveis pela Home e pelos próprios perfis.
- Sem testes em aparelhos físicos, Safari, Firefox ou leitor de tela. Mobile foi verificado por viewport e emulação de toque no Chromium/Edge.

## Revisão local

```powershell
npm run dev
```

Abrir `http://localhost:8080/jogadores`. Explorar os quatro ângulos, passar o mouse na figura, usar Tab/Enter e abrir a carreira. Comparar **Modo leve** ativado/desativado. Na emulação de acessibilidade do navegador, ativar `prefers-reduced-motion: reduce` e verificar a apresentação estática. Conferir `/jogadores/8`, `/biografias` e a Home.

Para repetir as verificações de navegador com a instalação disponível nesta máquina:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///D:/Dev/Projetos/visdna/node_modules/playwright-core/index.mjs'
node tests/holographic.browser.mjs
node tests/players.browser.mjs
node tests/home.browser.mjs
```

Os testes aceitam `BASE_URL`, `PLAYWRIGHT_MODULE` e `BROWSER_CHANNEL`. O servidor temporário de validação é encerrado na entrega. A próxima etapa aguarda revisão visual.
