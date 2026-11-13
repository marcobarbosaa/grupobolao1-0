# Temporada 08 — 2012–2013 (Grupo Bolão NBA 2K)

**Origem:** Google Drive Primary → Bolão → Temporada 2012-2013 (F), com pastas de 13 jogadores e Extras.

## Importado para main

- Temporada 08 registrada no catálogo `season-008/seasons.json` e no `manifest.json`.
- Classificação: **15 times no Oeste e 15 no Leste**, conforme quatro capturas de tabela; são dados do universo da liga NBA 2K, não da temporada histórica da NBA.
- Playoffs: **15 confrontos** e campeão **Denver Nuggets**, que venceu Philadelphia 76ers **4–0** nas NBA Finals.
- Estatísticas gerais de 13 jogadores: **26 registros** em `season-008/statistics.json` (13 Regular Season e 13 agregados de Playoffs).
- Estatísticas por fase: **31 registros** em `season-008/statistics-rounds.json`, com GP, GS, médias e aproveitamentos:
  - Jonas 2 (First Round e Quarterfinals)
  - Tailan 2 (First Round e Quarterfinals)
  - Cristiano Ronaldo 4 (até NBA Finals)
  - Fábio Carvalho 4 (até NBA Finals)
  - Gam Mori 4 (até NBA Finals)
  - Nando 4 (até NBA Finals)
  - Guilherme 2 (First Round e Quarterfinals)
  - Matheus Medeiros 4 (até NBA Finals)
  - Russo, Marco Barbosa, Enzo, Abel e Dias: um First Round cada. Para Dias, o usuário confirmou expressamente que os cinco jogos do agregado pertencem à primeira rodada; não foi inferida eliminação de sua equipe.
- `teamHistory.json` contém as **13 equipes históricas** da temporada, extraídas das capturas individuais.
- `historical-logos.json` possui variações de época, incluindo o Brooklyn Nets de 2012; o componente `SeasonExtras.tsx` também reconhece jogadores por seu time na temporada.

## Proveniência e auditoria
- **39 capturas de carreira** e **52 capturas de rodadas**, todas vinculadas aos respectivos IDs do Google Drive e aos hashes SHA-256 reais em `sources.json` e `sources-rounds.json`.
- Cinco imagens de Extras com SHA-256 real em `season-extras-sources.json`; os originais continuam no Drive, não foram publicados no repositório.
- `batches.json` e `batches-rounds.json`: lotes aprovados e publicados.
- `revisions.json` e `revisions-rounds.json`: **57 registros de revisão**, com origem completa e referência aos lotes.

## Validações e limites
- Os 26 registros de Regular Season/Playoffs agregados têm pontos compatíveis com arremessos de quadra, três pontos e lances livres: `PTS = 2×FGM + 3PM + FTM`.
- Para os **13 atletas com rodadas identificadas**, a soma de GP nas fases equivale exatamente ao GP consolidado. As médias ponderadas por GP são compatíveis com o arredondamento do jogo.
- **Dias:** o usuário confirmou em 13/11/2026 que seus cinco jogos do agregado de playoffs correspondem ao **First Round**. O mesmo conjunto de estatísticas foi registrado nessa fase, sem duplicar partidas. O chaveamento mostra que Dallas Mavericks avançou além da primeira rodada; portanto essa classificação é de participação individual e não deve ser interpretada como eliminação do time.
- Na comparação de médias por fase, a diferença de 0,1 ponto em Guilherme decorre dos arredondamentos do jogo.
- A consistência referencial dos 57 registros (91 fontes, 3 lotes, 57 revisões), das relações históricas e dos cálculos de PTS foi verificada por inspeção programática de JSON. Não foi executado o build completo ou teste visual no navegador nesta sessão.
