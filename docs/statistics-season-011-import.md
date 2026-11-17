# Auditoria da importação — Temporada 2015–2016 (season-011)

## Escopo e fontes

- Origem: Google Drive **Primary**, pasta `Bolão/Temporada 2015-2016 (F)`.
- Destino: `src/data/statistics/season-011/`.
- 13 pastas de jogadores, 63 capturas JPEG, todas identificadas por `driveFileId`, `driveFolderId`, nome original e **SHA-256 calculado sobre os bytes baixados**.
- A pasta `Extras` não fez parte da importação.
- Dois conjuntos separados: 1) temporada regular e playoffs consolidados, 2) fases individuais.

## Quantidades

| Categoria | Registros |
| --- | ---: |
| Jogadores históricos | 13 |
| Temporada regular | 13 |
| Playoffs consolidados | 10 |
| Fases com estatísticas disponíveis | 12 |
| Fases de Russo com ausência por lesão documentada | 2 |
| Capturas com SHA-256 individual | 63 |
| Fonte manual sobre a lesão | 1 |

## Identidades e equipes históricas

| Pasta no Drive | ID canônico | Equipe em 2015–2016 |
| --- | --- | --- |
| Abel | `abel` | Phoenix Suns |
| Binho | `fabio-carvalho` | Minnesota Timberwolves |
| Cerrote | `cristiano-ronaldo` | Denver Nuggets |
| Dias | `dias` | Orlando Magic |
| Enzo | `enzo` | San Antonio Spurs |
| Gam | `gam-mori` | Philadelphia 76ers |
| Guilherme | `guilherme` | New York Knicks |
| Jonas | `jonas` | New York Knicks |
| Marco | `marco-barbosa` | Atlanta Hawks |
| Medeiros | `matheus-medeiros` | Philadelphia 76ers |
| Nando | `nando` | Milwaukee Bucks |
| Russo | `russo` | Toronto Raptors |
| Tailan | `tailan` | New York Knicks |

Os apelidos Binho e Cerrote foram vinculados a Fábio Carvalho e Cristiano Ronaldo **pelos nomes visíveis nas respectivas capturas**, não por suposição baseada nas equipes atuais.

## Cobertura de playoffs

- Abel: 4 jogos First Round + 6 Quarterfinals = 10 de 10.
- Fábio Carvalho (Binho): 7 + 5 = 12 de 12.
- Gam Mori: 7 + 4 + 5 = 16 de 16.
- Matheus Medeiros: 7 + 7 + 7 = 21 de 21.
- Russo: 5 First Round + 4 NBA Finals = 9 de 9. **Quarterfinals e Conference Finals: lesionado, sem atuação**, conforme declaração expressa do usuário. `availability: "no-games"`, `stats: {}` e nota de cobertura registram a ausência, evitando falsos zeros de média; não há enum `injured` no schema atual.
- Cristiano Ronaldo, Guilherme, Jonas, Nando e Tailan: totais consolidados presentes; sem imagens por fase nesta pasta. As fases não são inferidas.
- Dias, Enzo e Marco: somente temporada regular nas capturas. Não foram criados totais de playoffs.

## Verificações realizadas antes da publicação

1. Pontuação de todos os 23 registros com totais: `PTS = 2 × FGM + 3PM + FTM`.
2. Conversão de porcentagens e médias preservando uma casa decimal da captura; tolerância de arredondamento de até 0,1.
3. `GS <= GP`, tentativas >= acertos, nenhum total de fase deduzido das médias.
4. Reconciliação dos jogos por fase para os cinco atletas com decomposição completa.
5. Integridade das 63 capturas: SHA-256 de bytes reais, 63 hashes distintos, arquivos de origem rastreáveis.
6. Referências entre IDs das estatísticas, fontes, lotes e revisões geradas com IDs canônicos compatíveis com o schema do repositório.
7. Continuidade histórica: todos os arquivos de temporadas anteriores permanecem intocados; novo diretório e apêndice ao manifesto.

## Limitações de verificação

As verificações numéricas e de referência acima foram executadas localmente com um script de validação independente. **O comando oficial `npm run stats:validate` e o build `npm run build` não foram executados nesse ambiente**, porque não há dependências instaladas nem acesso Git para clonar e compilar o repositório completo. O funcionamento do site no Cloudflare exige verificação posterior do deploy, independente da publicação no GitHub.