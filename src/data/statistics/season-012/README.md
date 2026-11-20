# Temporada 2016–2017 — importação

## Conteúdo publicado

- Temporada 12 (2016–17) configurada com Temporada regular, Playoffs, Primeira rodada, Quartas, Finais de conferência e Finais da NBA.
- 13 registros individuais da temporada regular e 13 vínculos de histórico jogador/equipe.
- 33 registros estatísticos por fase/consolidado de playoffs, incluindo os complementos de Nando e Dias.
- 30 posições de classificação (15 por conferência), com campanhas, aproveitamento, casa/fora, conferência/divisão, pontos por jogo, pontos sofridos, saldo e sequência.
- 15 séries do chaveamento dos playoffs, até a NBA Finals; Dallas Mavericks campeão sobre Philadelphia 76ers por 4–1.
- 101 capturas do ZIP inventariadas: 38 imagens de Career Stats, 58 imagens de fases e 5 imagens de Extras. Todas as imagens incorporadas possuem SHA-256 calculado sobre os bytes originais.
- Dois registros manuais adicionais documentam as reconstruções fictícias autorizadas para Dias.

## Nando — First Round concluído

A linha agregada Playoffs da tela Career Stats contém GP 7, GS 7, 176 pontos, 61 rebotes, 20 assistências, 6 roubos, 8 bloqueios, 4 turnovers, 63 FGM, 120 FGA, 6 3PM, 18 3PA, 44 FTM, 49 FTA, 28 faltas e 2 double-doubles. As médias são 25,1 PPG, 8,7 RPG, 2,9 APG, 0,9 SPG, 1,1 BPG, 0,6 TOPG e 32,0 MPG; aproveitamentos 52,5 FG%, 33,3 3P% e 89,8 FT%.

Como Milwaukee foi eliminado no First Round (série de sete jogos contra Philadelphia) e o usuário confirmou essa informação, o consolidado de playoffs foi alocado ao First Round. Não foram criados registros de rodadas posteriores para Nando.

## Dias — fases ausentes reconstruídas

O consolidado geral Playoffs de Career Stats mostra 21 GP, 565 pontos, 63 rebotes, 225 assistências, 22 roubos, 0 bloqueios, 67 turnovers, 198 FGM, 399 FGA, 53 3PM, 121 3PA, 116 FTM e 141 FTA. Também mostra 847 minutos, 63 faltas, 14 double-doubles e nenhum triple-double. A linha apresenta 40,3 MPG, 26,9 PPG, 3,0 RPG, 10,7 APG, 1,0 SPG, 0,0 BPG, 3,2 TOPG, 49,6 FG%, 43,8 3P% e 82,3 FT%.

Os 21 jogos coincidem com o caminho de Dallas na chave: First Round (7), Quarterfinals (4), Conference Finals (5) e NBA Finals (5). Conforme autorização expressa do usuário, as médias ausentes de Conference Finals e NBA Finals foram reconstruídas ficticiamente para permanecer coerentes com a média geral e com os dois primeiros rounds observados:

| Fase | GP | MPG | PPG | RPG | APG | SPG | BPG | TOPG | FG% | 3P% | FT% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| First Round — captura | 7 | 40,6 | 27,3 | 2,7 | 10,0 | 1,3 | 0,0 | 3,7 | 52,4 | 60,5 | 82,6 |
| Quarterfinals — captura | 4 | 38,3 | 23,8 | 4,2 | 11,3 | 1,3 | 0,0 | 2,8 | 50,0 | 20,0 | 66,7 |
| Conference Finals — **FICTÍCIO** | 5 | 40,9 | 28,0 | 2,6 | 11,0 | 0,6 | 0,0 | 3,0 | 47,0 | 40,0 | 88,0 |
| NBA Finals — **FICTÍCIO** | 5 | 41,0 | 27,8 | 2,8 | 11,0 | 0,8 | 0,0 | 3,0 | 48,0 | 43,3 | 88,6 |

A média ponderada pelo número de jogos das quatro linhas arredonda para os valores gerais indicados acima. Os dois novos registros estão marcados no próprio dado como reconstrução fictícia, com fonte manual, hashes de especificação e nota de cobertura parcial. Eles não são apresentados como boxescores reais. Os GP das duas fases foram obtidos pelo chaveamento; médias e percentuais são estimativas.

## Pendências mantidas

- **Abel:** as capturas de Career Stats disponíveis não mostram GP, GS, minutos totais, FTM/FTA, faltas, duplos-duplos ou triplos-duplos. Esses campos permanecem ausentes e serão debatidos separadamente.
- **Enzo (San Antonio Spurs) e Marco Barbosa (Atlanta Hawks):** não há capturas de playoffs, mas suas equipes não se classificaram na temporada regular; portanto, isso não foi tratado como dado faltante.

## Precisão e procedência

Os registros por fase guardam os GP/GS e as médias/percentuais exibidos quando havia captura. Os totais de arremessos por fase não foram inferidos de médias arredondadas. Os totais consolidados de Career Stats permanecem separados das médias sintéticas por fase. As imagens originais não foram adicionadas ao repositório: cada fonte tem nome, pasta no ZIP, tamanho e hash SHA-256 para auditoria.
