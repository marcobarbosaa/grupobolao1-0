# Temporada 04 — 2008–2009: inventário e publicação

Fonte atual: **Bolão / Temporada 2008-2009 (F)** no Google Drive, verificada em 12/11/2026.
Pasta de origem: `1dZbByM4XpzRaPyE3S9HdRwbaLdMS5oM8`.

## Inventário da pasta (F)

| Subpasta | Arquivos JPEG |
| --- | ---: |
| Abel | 3 |
| Binho | 3 |
| Cerrote | 3 |
| Dias | 3 |
| Enzo | 9 |
| Gam | 7 |
| Guilherme | 11 |
| Jonas | 3 |
| Marco | 3 |
| Medeiros | 3 |
| Nando | 3 |
| Russo | 7 |
| Tailan | 3 |
| Extras | 5 |
| **Total** | **66** |

## Publicação na main

- `season-004`, edição **04**, temporada **2008–2009**.
- **13 registros de temporada regular** (todos os jogadores), baseados em 39 imagens de estatísticas de carreira.
- **8 registros agregados de playoffs** em que o total estava disponível nas imagens de carreira. A ausência de registro agregado dos outros atletas **não** significa ausência de participação.
- **30 classificações de franquias**, divididas em 15 de Oeste e 15 de Leste, extraídas de quatro imagens da subpasta Extras.
- **15 séries dos playoffs**, extraídas da quinta imagem Extras, incluindo **Chicago Bulls 4–3 Los Angeles Clippers** na final.
- Capturas originais permanecem no Drive; no GitHub são registrados dados estruturados e identificadores/referências dos arquivos.
- Metadados de fontes e versões mantidos em `src/data/statistics/season-004/` e na trilha `season-extras-sources.json`.
- Escudos históricos e classificações integrados ao componente `SeasonExtras.tsx`.

**Escopo não concluído:** 22 capturas adicionais de Enzo (6), Gam (4), Guilherme (8) e Russo (4), a avaliar para possíveis estatísticas detalhadas por rodada de playoffs. Não atribuir a elas uma fase ou um número sem conferência explícita. Os oito registros publicados de playoffs são **agregados**, não por rodada.

Este inventário substitui o levantamento anterior associado à pasta de nome semelhante sem o sufixo `(F)`. Nenhum dado da temporada 01–03 foi substituído.


## Complementação — playoffs por rodada (12/11/2026)

As capturas antes apontadas como pendentes **foram conferidas e publicadas** em `src/data/statistics/season-004/statistics-rounds.json`.

- **11 registros individuais por fase**: Enzo (3), Gam Mori (2), Guilherme (4), Russo (2).
- **22 imagens JPEG** registradas em `sources-rounds.json` com identificadores do Drive e hashes SHA-256 verificáveis.
- `batches-rounds.json` e `revisions-rounds.json` guardam a trilha de publicação; `manifest.json` referencia esses arquivos.
- Fases: `first-round`, `quarterfinals`, `conference-finals` e `nba-finals` quando documentadas nas capturas.
- Cada registro de rodada contém GP, GS, médias e aproveitamentos observados nos prints. Totais de arremessos e demais contagens **não foram fabricados** a partir de médias arredondadas.
- Soma dos jogos e soma ponderada dos pontos por rodada confrontadas com o registro agregado de playoffs já publicado, dentro da precisão dos valores exibidos.
- Rodadas sem print não foram preenchidas automaticamente. As imagens continuam privadas no Drive.
