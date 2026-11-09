# Hero cinematográfica — Central do Bolão

Entrega: 09/11/2026. Branch: `feat/cinematic-roster-hero`.
Base: `7cb1119`, que já inclui a foto oficial do commit `6d9ada2`.

## Composição e comparação

Antes: título à esquerda, retrato individual à direita, troca automática a cada 6,5 segundos, controles de navegação e duas chamadas.
Agora: título monumental vermelho “NOVA GERAÇÃO”, fotografia coletiva central sobre a parte inferior da tipografia e uma única CTA “CONHECER O ELENCO”, para `/jogadores`. O fundo grafite usa iluminação radial discreta. A CTA ocupa uma área própria abaixo dos atletas.

No desktop, a largura da cena considera tanto a largura quanto a altura disponível. A seção pode crescer em telas baixas: não há altura fixa nem overflow que esconda atletas. Em mobile, o título ocupa duas linhas, a foto mantém sua proporção horizontal completa e a CTA fica abaixo do texto de apoio. Entradas finitas e suaves, desativadas com movimento reduzido.

O carrossel, temporizador, estados de pausa, controles, imports e estilos exclusivos foram removidos. A galeria e os perfis continuam usando os retratos individuais. O título da galeria na home passou semanticamente para h2, conservando o visual, para deixar apenas um h1 na página.

## Fotografia e limites do tratamento

- Original: `public/jogadores/elenco-junto/Elenco_Unido.png`, 1672 × 941 px, 2.684.897 bytes.
- Inspeção visual: 13 jogadores, seis atrás e sete à frente. Os calçados da fileira dianteira estão próximos da borda inferior; os jogadores das extremidades também exigem preservar a largura total.
- Verificação de todos os pixels: nenhuma transparência.
- Derivada: `Elenco_Unido.webp`, mesmas dimensões, 461.880 bytes (redução de aproximadamente 82,8%).
- Conversão local pelo encoder WebP do navegador, qualidade 0,94, sem redimensionamento, retoque, geração de imagem ou filtros sobre os uniformes. O PNG permanece intacto.
- A imagem usa dimensões explícitas, proporção reservada, object-fit contain, carregamento eager e prioridade alta. O navegador baixa apenas a versão WebP utilizada.
- Usada a alternativa expressamente permitida no briefing: manter o cenário original e integrar suas bordas com máscaras CSS. A transição superior termina em 4% da altura, antes dos cabelos; as laterais terminam em 3% de cada borda. Não há máscara inferior sobre os calçados.
- **Não foi criado um recorte individual dos atletas.** O cenário também fica à frente da parte inferior das letras. Essa composição evita segmentação imperfeita; não equivale a letras visíveis entre todas as silhuetas.
- As imagens de referência POISON/METAVERSE não estavam nos anexos. A direção foi implementada conforme sua descrição textual.

## Arquivos

| Arquivo | Alteração |
| --- | --- |
| src/components/home/GenerationHero.tsx | Novo componente independente: título semântico, imagem coletiva e CTA única. |
| src/styles/generation-hero.css | Novas camadas, composição responsiva, máscaras de integração, foco e animações finitas. |
| public/jogadores/elenco-junto/Elenco_Unido.webp | Versão otimizada local da fotografia oficial. |
| src/components/sports/NewGeneration.tsx | Integração da hero; remoção do carrossel e backdrop antigo; ajuste semântico do título da galeria na home. |
| src/styles/new-generation.css | Remoção de CSS do carrossel; preservação das regras da galeria e dos perfis. |
| tests/new-roster.test.mjs | Atualização das expectativas que exigiam o carrossel removido; preservação dos testes do elenco e enquadramentos. |
| tests/cinematic-hero.browser.mjs | Validação de imagem, proporção, CTA, responsividade, acessibilidade e rotas relacionadas. |
| HERO-CINEMATOGRAFICA.md | Este relatório. |
| artifacts/cinematic-hero/ | Capturas antes/depois e resultados das verificações. |

Nenhuma alteração em dados, rankings, rotas, logo, header, paleta global, dependências ou fotografias originais.

## Validação

- `npx tsc --noEmit`: passou.
- ESLint nos dois componentes TSX e nos dois arquivos de teste alterados/criados: passou.
- Prettier nos dois arquivos CSS: passou. O projeto não possui lint específico de CSS configurado.
- `npm run build`: passou, cliente e SSR.
- `node --test tests/*.test.mjs`: 12 testes passaram.
- Novo teste de navegador: passou em Edge/Chromium, nas dimensões 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 e 360×800.
- Capturas das seis resoluções foram abertas e inspecionadas: todos os 13 jogadores visíveis, sem deformação ou cortes, título legível, CTA separada dos atletas e sem overflow horizontal.
- CTA visível na primeira viewport nos seis cenários; foco e ativação por Enter confirmados.
- Uma requisição da foto coletiva por navegação; resolução correta e proporção preservada.
- Movimento reduzido desativa as animações; sem animações ainda executando após a entrada.
- Treze imagens da galeria carregadas; treze links únicos e treze perfis respondendo HTTP 200.
- Hall da Fama, Temporadas, Recordes, Comparar e Biografias também respondendo HTTP 200.
- Nenhum erro JavaScript durante essa suíte.
- Download da foto artificialmente retido: caixa da imagem idêntica antes e depois do carregamento. Isso verifica a estabilidade causada pela imagem, não constitui uma medição geral de Core Web Vitals.
- `git diff --check`: passou.

Comando do teste de navegador neste ambiente:
```powershell
$env:PLAYWRIGHT_MODULE='file:///D:/Dev/Projetos/visdna/node_modules/playwright-core/index.mjs'
$env:BASE_URL='http://127.0.0.1:8082'
node tests/cinematic-hero.browser.mjs
```
O módulo Playwright existente foi reutilizado; não houve instalação de dependências.

Os scripts browser antigos do acervo anterior têm seletores e expectativas que já não correspondem à aplicação de nova geração da base desta branch. Não foram reescritos nem utilizados como aprovação desta hero.

## Capturas

- [Antes desktop](artifacts/cinematic-hero/before-1440.png)
- [Depois desktop](artifacts/cinematic-hero/after-1440.png)
- [Antes mobile](artifacts/cinematic-hero/before-390.png)
- [Depois mobile](artifacts/cinematic-hero/after-390.png)
- [1920 px](artifacts/cinematic-hero/after-1920.png)
- [1024 px](artifacts/cinematic-hero/after-1024.png)
- [768 px](artifacts/cinematic-hero/after-768.png)
- [360 px](artifacts/cinematic-hero/after-360.png)
- [Resultados do navegador](artifacts/cinematic-hero/validation.json)
- [Estabilidade no carregamento](artifacts/cinematic-hero/loading-stability.json)

As capturas finais também mostram o foco visível da CTA após a verificação por teclado.

## Pendências e integração

Implementação e verificações concluídas na branch separada. Sem merge, push ou publicação.
A aprovação estética pode ser feita pelo preview e pelas capturas. A profundidade usa a composição alternativa com cenário preservado, conforme explicado acima. A validação automatizada foi realizada em Edge/Chromium; Safari e Firefox não foram executados.
