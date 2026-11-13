# Temporada 08 — 2012–2013 (Grupo Bolão NBA 2K)

**Origem:** Google Drive Primary → Bolão → Temporada 2012-2013 (F), com pastas de 13 jogadores e Extras.

## Importado para main

- Temporada 08 registrada no catálogo `season-008/seasons.json` e no `manifest.json`.
- Classificação: **15 times no Oeste e 15 no Leste**, conforme quatro capturas de tabela; são dados do universo da liga NBA 2K, não da temporada histórica da NBA.
- Playoffs: **15 confrontos** e campeão **Denver Nuggets**, que venceu Philadelphia 76ers **4–0** nas NBA Finals.
- Estatísticas gerais de 13 jogadores: **26 registros** em `season-008/statistics.json` (13 Regular Season e 13 agregados de Playoffs).
- Estatísticas por fase: **30 registros** em `season-008/statistics-rounds.json`, com GP, GS, médias e aproveitamentos:
  - Jonas 2 (First Round e Quarterfinals)
  - Tailan 2 (First Round e Quarterfinals)
  - Cristiano Ronaldo 4 (até NBA Finals)
  - Fábio Carvalho 4 (até NBA Finals)
  - Gam Mori 4 (até NBA Finals)
  - Nando 4 (até NBA Finals)
  - Guilherme 2 (First Round e Quarterfinals)
  - Matheus Medeiros 4 (até NBA Finals)
  - Russo, Marco Barbosa, Enzo e Abel: um First Round cada, pois as equipes foram eliminadas nessa fase e seus agregados equivalem à rodada.
- `teamHistory.json` contém as **13 equipes históricas** da temporada, extraídas das capturas individuais.
- `historical-logos.json` possui variações de época, incluindo o Brooklyn Nets de 2012; o componente `SeasonExtras.tsx` também reconhece jogadores por seu time na temporada.

## Proveniência e auditoria
- **39 capturas de carreira** e **52 capturas de rodadas**, todas vinculadas aos respectivos IDs do Google Drive e aos hashes SHA-256 reais em `sources.json` e `sources-rounds.json`.
- Cinco imagens de Extras com SHA-256 real em `season-extras-sources.json`; os originais continuam no Drive, não foram publicados no repositório.
- `batches.json` e `batches-rounds.json`: lotes aprovados e publicados.
- `revisions.json` e `revisions-rounds.json`: **56 registros de revisão**, com origem completa e referência aos lotes.

## Validações e limites
- Os 26 registros de Regular Season/Playoffs agregados têm pontos compatíveis com arremessos de quadra, três pontos e lances livres: `PTS = 2×FGM + 3PM + FTM`.
- Para os **12 atletas com rodadas identificáveis**, a soma de GP nas fases equivale exatamente ao GP consolidado. As médias ponderadas por GP são compatíveis com o arredondamento do jogo.
- **Dias:** cinco jogos estão presentes no agregado de playoffs, mas sua pasta possui somente telas de carreira, sem a fase da competição. Não foi inferida a rodada a partir da quantidade de jogos, porque o Dallas Mavericks avançou até a final do Oeste.
- Na comparação de médias por fase, a diferença de 0,1 ponto em Guilherme decorre dos arredondamentos do jogo.
- A consistência referencial dos 56 registros (91 fontes, 2 lotes, 56 revisões), das relações históricas e dos cálculos de PTS foi verificada por inspeção programática de JSON. Não foi executado o build completo ou teste visual no navegador nesta sessão.
