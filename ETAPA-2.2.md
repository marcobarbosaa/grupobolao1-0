# Grupo Bolão 2.0 — Etapa 2.2

Sala de seleção reconstruída localmente na branch `redesign/grupo-bolao-2.0`. Sem commit, push ou publicação. Entrega para revisão.

## Experiência

A rota `/jogadores` agora ocupa a área abaixo da navegação com uma cena contínua, sem a moldura e a divisão permanente em duas colunas. Nando permanece central, com aproximadamente **75,5% da altura útil do palco**, corpo inteiro visível nas resoluções verificadas e cores originais.

O ambiente tem piso, marcações circulares, degraus de arena, estruturas de iluminação e uma plataforma com volume, acabamento escuro, aro metálico e pequenos detalhes vermelhos. As extremidades da cena se dissolvem no fundo da página. Sem pós-processamento, partículas ou luz ciano sobre o corpo.

No estado inicial ficam identificação mínima, descoberta e navegação. Hover, foco no atleta ou o botão **Conhecer Nando** revelam nome, posição, arquétipo, equipes e acesso à carreira. Os dados vêm do cadastro existente; nenhuma conquista foi inventada.

**Inspecionar atleta** abre os controles de frente, esquerda, costas e direita. As vistas mudam explicitamente, sem interpolar fotografias para simular rotação corporal.

No mobile, tocar no atleta revela as informações; o botão **Abrir carreira** realiza a navegação. O painel cresce no fluxo da página, permitindo rolagem quando aberto. A cena inicial cabe em 390 × 844; telas curtas podem rolar para preservar controles e conteúdo.

## Arquitetura e movimento

Cada atleta real recebe um `THREE.Group` identificado por ID, contendo plataforma, sombra de contato, figura e camadas discretas de projeção. O estado de apresentação/recursos permanece em React; seleção, posição e destaque são sincronizados com os nós da cena.

`chamberSlot(index, selected)` calcula posições reais: o selecionado fica em `(0, 0, 0)`, os vizinhos ficam a `±4,8` unidades no eixo X e recuam `2,7` unidades no eixo Z. A redução aparente vem da perspectiva, não de escalar imagens em CSS. Ao mudar o índice, os nós interpolam de suas posições atuais até os novos destinos durante 750 ms, com easing cúbico. A câmera acompanha com um pequeno deslocamento lateral. A cena e o renderer permanecem os mesmos.

Com apenas Nando, as duas setas ficam desabilitadas. Não há duplicação do atleta, outros personagens nem placeholders de elenco. A entrada desloca seu grupo de `(0,8, 0, -1,3)` ao centro, acompanhada de uma aproximação de câmera de aproximadamente 1,1 s, executada uma vez.

A câmera usa perspectiva de 34°, deslocamento lateral limitado pelo cursor, pequena variação de altura e aproximação de 220 ms na abertura do perfil. O personagem mantém sua orientação no espaço: foi removido o comportamento que o fazia girar para encarar a câmera. Não existe órbita de 360°, flutuação ou balanço permanente.

## Representação e interação

Foram preservados os quatro PNGs originais, os contornos e o mapeamento UV da etapa anterior. O atleta continua sendo uma silhueta plana texturizada, sobre uma plataforma e em um ambiente tridimensionais. O material principal preserva as cores da captura; luzes da sala não são apresentadas como iluminação física do corpo.

A captura frontal foi inspecionada e as quatro vistas foram verificadas no navegador. Os contornos manuais têm limitações, especialmente nas bordas de mãos, cabelo e acessórios e na ampliação de capturas pequenas. Sem uma segmentação automática validada, substituir esse recorte colocaria detalhes originais em risco. Não foi introduzida geração de imagem, novos pixels de personagem ou pipeline de segmentação.

O hover usa **hit testing do navegador sobre o contorno projetado**. A cada quadro, os vértices da silhueta passam pelas matrizes do ator e da câmera e atualizam o `clip-path` de um link nativo. Assim, o alvo acompanha o movimento e exclui espaços vazios entre braços e pernas. O fallback alinha o mesmo contorno ao tamanho real da imagem renderizada. Não é um retângulo aproximado nem um raycast sobre um painel vazio.

O painel tem transição curta e reversível, uma tolerância de 160 ms para o cursor atravessar até as informações, suporte a foco e uma opção de revelação persistente. Quando oculto, usa `inert` e `aria-hidden`. Escape fecha a apresentação. Setas do teclado e gestos horizontais estão conectados aos limites do carrossel.

O atleta e o CTA mantêm o link real `/jogadores/8`. O clique normal inicia a aproximação e navega pela integração existente do TanStack Router; cliques modificados preservam o comportamento nativo de abertura em outra aba. Movimento reduzido e modo leve dispensam o atraso cinematográfico.

## Reutilização e expansão

Foram reutilizados:

- `usePlayerAssets`: carregamento das capturas, timeout, cancelamento, vistas ausentes e retratos de fallback, sem alteração no arquivo.
- `holographic-player.ts`: tipos, cadastro real, quatro vistas e contornos, sem alteração no arquivo.
- `usePlayerMotion`: preferência reativa de movimento reduzido.
- Inicialização dinâmica do Three.js, tratamento de erro/perda de WebGL, pausa em aba oculta ou fora da tela, limite de 30 fps e pixel ratio, observadores e descarte.
- Rota dos jogadores, links e rota individual, navegação global e testes existentes.

Foram acrescentados `createChamberResources`, `createChamberPlatform` e `createChamberAthlete`, além do cálculo de posições e tempos em `chamber-layout.ts`. `AssetRegistration` reutiliza o loader para cada entrada real sem desmontar o palco ao selecionar outra.

Para adicionar um atleta futuramente, cadastrar suas capturas e contornos validados no mapa de `createHolographicRoster`, usando o ID real. A adaptação traz seus dados, o registro carrega seus recursos e a cena cria seu grupo e plataforma. Controles, limites, posições, seleção, câmera e links já recebem a lista completa. Nenhum segundo atleta foi cadastrado nesta etapa.

## Arquivos

| Arquivo                                                | Alteração                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `src/components/holographic/HolographicSelection.tsx`  | Composição, registro de recursos, seleção, descoberta, controles e transição para perfil |
| `src/components/holographic/HolographicStage.tsx`      | Cena persistente, sincronização do elenco, alvo acessível, toque e fallback alinhado     |
| `src/components/holographic/PlayerOverlay.tsx`         | Identificação contextual e CTA                                                           |
| `src/components/holographic/createHolographicScene.ts` | Ambiente, câmera, posições espaciais, transições e projeção do alvo                      |
| `src/components/holographic/createChamberAthlete.ts`   | Novo: recursos gráficos, plataforma e nó reutilizável do atleta                          |
| `src/lib/chamber-layout.ts`                            | Novo: posições e tempos compartilhados                                                   |
| `src/styles/holographic.css`                           | Cena integrada, interface contextual, mobile e movimento reduzido                        |
| `tests/holographic.browser.mjs`                        | Testes adaptados e medidas objetivas do enquadramento                                    |
| `tests/players.browser.mjs`                            | Adaptação do acesso contextual ao perfil                                                 |
| `tests/chamber-spatial.browser.mjs`                    | Novo: transições 3D, câmera, pausa, descarte e toque                                     |
| `tests/chamber-record.browser.mjs`                     | Novo: gravação da interface real em WebM                                                 |
| `.gitignore`                                           | Artefatos locais de revisão                                                              |
| `ETAPA-2.2.md`                                         | Este relatório                                                                           |

Nenhuma dependência foi adicionada ao projeto. Home, perfis individuais, arquivos de dados, capturas originais e componentes globais não foram modificados. O CSS oculta o rodapé global somente quando a sala está presente, mantendo a composição de uma viewport.

## Validação

| Verificação                                | Resultado                                               |
| ------------------------------------------ | ------------------------------------------------------- |
| `npm run build`                            | Passou: cliente e SSR                                   |
| `npx tsc --noEmit`                         | Passou                                                  |
| ESLint dos componentes e testes envolvidos | Passou                                                  |
| `npm run lint`                             | 5.270 erros e 1 aviso herdados; nenhum diagnóstico novo |
| `node --test tests/player-data.test.mjs`   | 8 testes passaram                                       |
| `node tests/holographic.browser.mjs`       | Passou                                                  |
| `node tests/chamber-spatial.browser.mjs`   | Passou                                                  |
| `node tests/players.browser.mjs`           | Passou: 13 perfis, dados, navegação e toque             |
| `node tests/home.browser.mjs`              | Passou                                                  |
| Comparação visual da Home                  | PNGs idênticos às referências em 390 e 1440 pixels      |
| `git diff --check`                         | Passou                                                  |

O lint foi comparado por arquivo, regra, mensagem, linha, coluna e severidade. `lint-before.json`, `lint-after.json` e `lint-comparison.json` estão em `artifacts/chamber-review/`. Não houve autofix global.

A suíte da sala verifica 360 × 844, **390 × 844**, **768 × 1024**, 1024 × 900, **1440 × 900** e **1920 × 1080**. O contorno ocupa entre 75,4% e 75,6% da altura útil, sem cortar cabeça ou pés e sem overflow no estado inicial. Inclui vistas, hover, área vazia sem hover, foco/Enter, CTA, retorno, modo leve, movimento reduzido em tempo real, perda/ausência de WebGL, dispositivo limitado e recursos ausentes.

O teste espacial usa um host isolado e um segundo **slot vazio apenas de teste**, sem outro jogador ou imagem. Verifica posições intermediárias e finais, deslocamento da câmera, profundidade, manutenção do mesmo canvas, aproximação de perfil, pausa em aba oculta e descarte idempotente. Nenhum fixture entra no elenco da aplicação.

O build mantém o aviso de chunk acima de 500 KB: o módulo 3D tem aproximadamente 558 KB minificado / 143 KB gzip e continua carregado sob demanda.

## Evidências e revisão local

As capturas foram realmente abertas e inspecionadas. Os artefatos estão em [artifacts/chamber-review](artifacts/chamber-review/):

- [Sala desktop](artifacts/chamber-review/selection-1440.png).
- [Hover](artifacts/chamber-review/hover.png).
- [Informações reveladas](artifacts/chamber-review/information-1440.png).
- [Sala mobile](artifacts/chamber-review/selection-390.png).
- [Informações mobile](artifacts/chamber-review/mobile-information.png).
- [Gravação da entrada e interação](artifacts/chamber-review/chamber-interaction.webm).
- [Resultados da sala](artifacts/chamber-review/results.json) e [movimento espacial](artifacts/chamber-review/spatial-results.json).

A gravação usa screencast real do Chromium, incluindo DOM e canvas, codificado em WebM/VP8 pelo próprio navegador. O download do FFmpeg auxiliar falhou por timeout; a entrega usa o encoder nativo e não depende desse download. Foram verificados decodificação, dimensões e quadros representativos do vídeo. A taxa de captura da automação não é um benchmark de desempenho da cena.

```powershell
npm run dev
```

Abrir `http://localhost:8080/jogadores`. Observar a entrada, mover o cursor entre as laterais e sobre a figura, usar **Conhecer Nando**, abrir **Inspecionar atleta**, trocar as quatro vistas e acessar **Abrir carreira**. No celular, tocar primeiro na figura e depois no CTA. Verificar também Tab/Enter, Escape, modo leve e `prefers-reduced-motion`.

Para repetir a automação com a instalação existente:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///D:/Dev/Projetos/visdna/node_modules/playwright-core/index.mjs'
node tests/holographic.browser.mjs
node tests/chamber-spatial.browser.mjs
node tests/chamber-record.browser.mjs
node tests/players.browser.mjs
node tests/home.browser.mjs
```

Os scripts aceitam `BASE_URL`, `PLAYWRIGHT_MODULE` e `BROWSER_CHANNEL`. O teste espacial importa módulos pelo servidor Vite; executá-lo com `npm run dev`.

Limitações: o personagem continua sendo uma projeção plana com quatro vistas discretas; sua nitidez e bordas dependem das capturas originais. Validação em Edge/Chromium com viewports e toque emulado, sem aparelho físico, Safari, Firefox ou leitor de tela. A expansão visual com um segundo atleta real depende de suas capturas aprovadas.

Referências técnicas consultadas: [Three.js Group](https://threejs.org/docs/pages/Group.html) e [Raycaster](https://threejs.org/docs/pages/Raycaster.html). A implementação opta pelo contorno projetado no link nativo para manter interação por ponteiro e acessibilidade no mesmo elemento.
