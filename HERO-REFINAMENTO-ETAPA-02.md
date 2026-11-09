# Refinamento da hero — etapa 02

Data: 09/11/2026  
Branch: `refactor/cinematic-roster-composition`

## Arquivos desta etapa

- `src/styles/generation-hero.css`: composição, proporções, integração ambiental e responsividade.
- `tests/cinematic-hero.browser.mjs`: verificações das novas proporções, título desobstruído, CTA dentro da hero e capturas da composição completa.
- `HERO-REFINAMENTO-ETAPA-02.md`: este relatório.
- `artifacts/hero-refinement/`: capturas antes/depois, medidas e resultados.

Nenhum componente React nem asset foi modificado nesta etapa. A home continua renderizando `GenerationHome → GenerationHero`. O WebP criado na etapa anterior foi reutilizado, sem adicionar dependências ou arquivos de imagem. As alterações da etapa anterior continuam presentes na branch e ainda não foram commitadas.

## Antes e depois

Antes, a foto opaca encobria parte do título e simulava uma profundidade que o asset não sustentava. A restrição de altura diminuía o elenco; o título e as margens laterais dominavam a composição.

Agora:
- O título fica acima da foto, integralmente legível, com escala controlada por clamp. Sua largura fica próxima de dois terços da largura da fotografia no desktop.
- A fotografia ocupa 96% da largura disponível, limitada a 1600 px. Em 1440 px, passou de aproximadamente 960 para 1382 px.
- A hero tem altura natural. Não se reduz o elenco para obrigar a CTA a caber na primeira viewport; em notebooks e desktops baixos, há rolagem vertical normal.
- Texto de apoio e CTA estão centralizados em um único grupo inferior, próximo ao piso da cena.
- Em smartphones, o título tem duas linhas, menor que antes; a foto usa a largura completa e preserva todos os participantes.
- A camada principal não recebe blur, distorção, saturação ou alteração das cores dos uniformes.

## Integração e limites da fotografia

O PNG foi aberto e inspecionado: 1672 × 941 px, proporção aproximada de 1,777:1, sem pixels transparentes. Há seis atletas na fileira de trás e sete à frente. A imagem tem cenário incorporado e pouco espaço abaixo dos calçados.

Foi utilizada a alternativa segura autorizada pelo briefing, sem segmentação:
1. A foto completa permanece como camada principal, com contain e proporção original.
2. Uma camada decorativa desfocada e escurecida, usando a mesma URL, prolonga discretamente a iluminação do ambiente.
3. Máscaras atuam nas margens externas: topo até 5,5%, laterais até 3%, e último 1% inferior. Cabelos, mãos e calçados ficam na região opaca.
4. A última linha de pixels do piso, abaixo dos calçados, alimenta uma curta transição ambiental via CSS. Isso suaviza a borda inferior sem esticar os jogadores.
5. O título não fica mais atrás do retângulo da fotografia.

Não existe um recorte transparente individual dos 13 atletas. O cenário e suas linhas originais continuam reconhecíveis. A integração suaviza os limites da foto; não tenta apresentar os jogadores como silhuetas isoladas.

O PNG original permanece intacto (2.684.897 bytes). O WebP reutilizado tem 461.880 bytes. O teste confirmou uma única requisição da imagem, mesmo com seu uso nas camadas CSS.

## Validação

- TypeScript: `npx tsc --noEmit` passou.
- Build: `npm run build` passou, cliente e SSR.
- ESLint do componente da hero e do teste de navegador: passou. O componente não precisou de alterações.
- CSS: Prettier passou; não há lint de CSS configurado no projeto.
- Testes existentes: `node --test tests/*.test.mjs`, 12 aprovados.
- Navegador Edge/Chromium: passou nas larguras 1920, 1440, 1024, 768, 390 e 360 px.
- Verificadas proporção e resolução da foto, título sem sobreposição, CTA abaixo dos atletas, ausência de overflow horizontal, foco e acionamento por teclado.
- Treze fotos da galeria e treze perfis carregaram; rotas secundárias continuam respondendo HTTP 200.
- Preferência por movimento reduzido respeitada; nenhuma animação infinita; nenhum erro JavaScript.
- Download artificialmente retido: dimensões e posição da imagem idênticas antes/depois do carregamento.
- Inspeção visual realizada abrindo as seis capturas finais e comparando com a composição anterior. Todos os participantes permanecem visíveis, incluindo os atletas das extremidades e os calçados.
- `git diff --check` passou. Dados, rotas, header, logo e PNG original sem alteração.

As expectativas do teste que obrigavam a CTA na primeira viewport foram substituídas por verificações de que ela permanece dentro da composição e fora da fotografia. Essa mudança acompanha a decisão explícita de privilegiar a escala dos atletas.

## Capturas e evidências

| Largura | Antes | Depois |
| --- | --- | --- |
| 1920 | [Antes](artifacts/hero-refinement/before-1920.png) | [Depois](artifacts/hero-refinement/after-1920.png) |
| 1440 | [Antes](artifacts/hero-refinement/before-1440.png) | [Depois](artifacts/hero-refinement/after-1440.png) |
| 1024 | [Antes](artifacts/hero-refinement/before-1024.png) | [Depois](artifacts/hero-refinement/after-1024.png) |
| 768 | [Antes](artifacts/hero-refinement/before-768.png) | [Depois](artifacts/hero-refinement/after-768.png) |
| 390 | [Antes](artifacts/hero-refinement/before-390.png) | [Depois](artifacts/hero-refinement/after-390.png) |
| 360 | [Antes](artifacts/hero-refinement/before-360.png) | [Depois](artifacts/hero-refinement/after-360.png) |

As capturas mostram a seção inteira da hero, sem recortar a composição para caber na altura da viewport.

- [Resultados do navegador](artifacts/hero-refinement/validation.json)
- [Estabilidade da imagem](artifacts/hero-refinement/loading-stability.json)
- [Inspeção do PNG](artifacts/hero-refinement/source-inspection.json)

## Integração e pendências

Implementação local pronta para revisão na branch separada; sem commit, merge, push ou publicação. Nenhuma funcionalidade externa à hero foi modificada nesta etapa.

A limitação principal continua sendo o cenário incorporado. Caso futuramente exista um recorte profissional fiel ao original, será possível colocar letras entre as silhuetas; essa não é uma dependência para a composição atual. Safari e Firefox não foram testados.
