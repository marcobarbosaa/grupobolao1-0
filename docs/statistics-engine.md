# Motor estatístico v1.0 — Entrega 02

## Base e isolamento

Base verificada: main `25db46d` (Merge statistical data foundation). O commit `3bc0e84` da Entrega 01 é ancestral dessa main; a fundação não foi recriada. Antes das alterações, os 32 testes estatísticos e o manifest vazio passaram. Os 13 jogadores continuam vindo exclusivamente de new-roster.ts.

A biblioteca importa somente o domínio estatístico e Zod. Não usa React, filesystem, rede, rankings, notas ou pesos. Não altera os dados de entrada. Os exemplos deste documento e as fixtures são sintéticos; o manifest público permanece vazio.

## API

Importar de `src/lib/statistics/index.ts`:

- `calculateAverage(total, games)`, `calculatePercentage(made, attempted)`, `sumCounts(values, decimal?)`: operações puras de baixo nível. Retornam valor e estado, sem inventar procedência para números isolados.
- `selectCurrentRevisions(dataset)`: valida todo o snapshot, suas referências e a cadeia de aprovação; seleciona somente a maior revisão de cada identidade. Retorna cópias produzidas pelo schema, nunca escreve o histórico.
- `aggregateGames(dataset, query)`: representa somente partidas individuais.
- `aggregatePlayoffs(dataset, query)`: representa somente consolidados das rodadas configuradas, nunca inclui o registro agregado playoffs na soma.
- `collectRepresentations(dataset, query)`: expõe alternativas separadas para inspeção.
- `selectSeasonStats(dataset, query)`: escolhe uma representação segundo a política abaixo e verifica conflitos.
- `compareStatistics(dataset, leftQuery, rightQuery, metrics?)`: retorna métricas lado a lado e cobertura de ambas. Não retorna vencedor, score, ranking ou percentual de superioridade.

Query: `{ playerId, seasonId, phaseId, teamId? }`. Sem teamId, o escopo é todos os times. Com teamId, são usadas apenas participações/consolidados daquela equipe. Uma consulta sempre representa uma fase de uma temporada. Não há agregação de carreira nem soma automática de regular com playoffs.

As funções públicas que recebem datasets executam a validação runtime da Entrega 01 antes de calcular. Dados inválidos lançam StatisticalInputError; query inválida lança erro de validação/RangeError. Ausência normal de uma métrica não é uma exceção.

## Fórmulas e precisão

| Métrica          | Fórmula                                                   |
| ---------------- | --------------------------------------------------------- |
| PPG / RPG / APG  | points / GP, rebounds / GP, assists / GP                  |
| SPG / BPG / TOPG | steals / GP, blocks / GP, turnovers / GP                  |
| MPG              | minutes / GP                                              |
| FG% / 3P% / FT%  | fgm / fga × 100, threePm / threePa × 100, ftm / fta × 100 |

Os percentuais resultantes estão entre 0 e 100. Não se faz média aritmética de percentuais. Não se somam médias ou percentuais. Não se reconstrói um total multiplicando GP por uma média arredondada.

Valores ausentes resultam em `insufficient-data`; denominador conhecido igual a zero resulta em `undefined`. Um percentual 0 observado diretamente é preservado como `direct-source`, mesmo quando a razão 0/0 é indefinida. Não foi adotada uma convenção automática de exibição do NBA 2K.

Não há arredondamento dos resultados. Contagens e somas devem permanecer no intervalo de inteiros seguros do JavaScript; overflow é recusado. Minutos totais permitem decimais e usam soma compensada. Resultados em ponto flutuante têm as limitações IEEE-754; uma razão 1/3 é preservada como number, sem truncamento para apresentação.

### Precisão observada e consistência

`displayPrecision` é opcional nos registros e informa as casas decimais realmente observadas de médias e percentuais. Exemplo: `{ ppg: 1, fgPct: 1 }`. Cada entrada exige uma métrica presente e compatível com a resolução declarada. Não há valor padrão inventado.

A tolerância é metade da última unidade exibida: 0,05 para uma casa, 0,005 para duas, mais erro de ponto flutuante limitado por `8 × Number.EPSILON × max(1, magnitude)`. Na comparação de duas observações arredondadas, comparam-se os intervalos de ambas. Contagens inteiras exatas exigem igualdade exata, sem tolerância relativa.

Exemplo sintético: 61 pontos / 3 jogos = 20,333...; PPG observado 20,3 com uma casa é compatível. PPG 20,4 não é. Sem declaração de precisão, uma diferença entre média observada e razão gera aviso de consistência não certificada, preservando a observação. Entre representações completas, divergências sem tolerância documentada geram conflito conservador.

As restrições FGM ≤ FGA, 3PM ≤ 3PA, FTM ≤ FTA, 3PM ≤ FGM, 3PA ≤ FGA e GS ≤ GP continuam no schema existente. A consistência entre médias/percentuais observados e razões é verificada em cada registro utilizado, inclusive rodadas e partidas. Totais positivos com GP explicitamente zero são recusados pelo motor.

## Cobertura revisada

Campo opcional `coverage` em PlayerPhaseStats:

```json
{
  "status": "complete",
  "sourceIds": ["source-reviewed-example"],
  "note": "Evidência revisada de todo o período e escopo deste jogador.",
  "expectedGames": 2,
  "expectedGameIds": ["game-example-a", "game-example-b"]
}
```

Este é um exemplo de contrato, não um registro oficial. As fontes precisam fazer parte das fontes do próprio registro, já vinculadas à revisão e ao lote publicado. A nota documenta a evidência externa; não é autenticação nem verificação automática do conteúdo de um print.

- Sem declaração revisada, a completude do consolidado é unknown, mesmo com GP informado.
- `complete` declara cobertura integral do jogador, temporada, fase e escopo de equipe desse registro. Não basta a existência do registro nem o status completed da temporada.
- `partial` explicita um recorte incompleto.
- expectedGames é opcional e representa participações do jogador, não a quantidade de jogos de toda a liga.
- expectedGameIds é opcional; se presente, exige expectedGames igual ao tamanho da lista, sem duplicatas. É uma lista de participações esperadas, que pode antecipar IDs ainda não importados. IDs que já existem devem corresponder ao período/equipe declarados.
- Para certificar o histórico individual como completo, a lista esperada deve existir, estar revisada como complete e coincidir exatamente com o conjunto de participações disponíveis. Somente igualar uma contagem não basta.
- Um consolidado completo pode coexistir com gameCoverage=none. Um consolidado com 82 jogos e 12 partidas conhecidas tem histórico parcial.
- not-imported não pode receber certificação complete. Uma fase certificada não disputada não pode declarar participações positivas.

O contrato DerivedMetric inclui cobertura própria: known/expected, unidade games/periods e fontes da evidência. Um agregado pode ter todos os jogos conhecidos e ainda ter apenas parte das assistências conhecidas.

Nas partidas, um PlayerGameStats disponível representa uma participação individual, salvo GP=0 explícito. O motor conta essas identidades distintas; não grava GP=1 no registro. Estados not-played/not-qualified/no-games não criam participações. not-imported impede assumir que uma métrica foi observada.

## Dados parciais

Para um total, somam-se os valores conhecidos de unidades distintas e marca-se a cobertura correspondente. Métrica ausente em todas as unidades retorna null com insufficient-data, nunca zero.

Para uma razão, numerador e denominador devem pertencer exatamente ao mesmo subconjunto. Exemplo sintético:

- Jogo A: 30 pontos, 8 assistências.
- Jogo B: 20 pontos, assistências ausentes.
- Pontos: 50; PPG: 25.
- Assistências: 8 parciais; APG: 8 somente no jogo conhecido, com coverage=partial. Não se calcula 8/2.

Em consolidados, uma rodada sem GP não fornece denominador para a sua média. Médias arredondadas de duas rodadas, desacompanhadas de totais, não produzem total nem média agregada.

## Identidade, revisões e duplicações

O dataset inteiro passa pelo validador antes da seleção. Duplicatas, mudança de identidade lógica, fontes/lotes inválidos, lacunas e auditorias inconsistentes interrompem a consulta. As versões antigas permanecem disponíveis no snapshot; apenas a maior revisão por identidade entra no cálculo. A ordem de importação não influencia a seleção.

As partidas são filtradas por jogador, temporada, fase e equipe. PlayerGameStats usa a identidade jogador/partida, sem depender de data. Transferências não fazem uma partida aparecer duas vezes.

Rodadas de playoffs são os stages não regulares configurados na temporada. O aggregate playoffs jamais é uma rodada somável. Fases configuradas ausentes deixam a cobertura parcial. Uma fase com não participação revisada e completa pode encerrar a cobertura sem fabricar um registro numérico de zeros.

Consolidados por equipe representam participações distintas. Podem ser somados separadamente como alternativa teams, mas a mera presença de duas equipes não prova que todas foram importadas; essa representação fica unknown. Nunca é somada ao consolidado all-teams. O histórico atual de equipes do elenco não é usado para deduzir equipes passadas.

## Prioridade e conflitos

Ordem explícita:

1. Consolidado da consulta com cobertura completa.
2. Outra representação completa.
3. Primeira representação com métricas disponíveis/conflitantes na ordem: consolidado, rodadas, equipes, partidas.
4. Representação sem valores, quando nada pode ser calculado.

Não há preenchimento de lacunas com uma fonte sobreposta. Por exemplo, um consolidado completo contendo apenas GP e PPG não recebe pontos calculados a partir de algumas partidas.

Todas as representações completas equivalentes são comparadas métrica a métrica quando ambas têm cobertura completa para aquela métrica. Divergências retornam status=conflict, value=null e as alternativas com seus valores e procedência. Não há escolha pelo maior valor ou timestamp mais recente. A correção deve ocorrer por nova revisão aprovada.

Um conflito interno de um somando também impede divulgar como disponível a métrica afetada. As outras métricas independentes continuam utilizáveis.

## Resultado e comparação

DerivedMetric contém metric, value, status, method, sourceRecordIds, sourceRecords com kind/id/revision, sourceIds, coverage, precision e reason quando necessário. Os resultados também incluem query, representation, gameCount, gameCoverage, conflicts e warnings. Evidências de completude são identificadas separadamente das fontes dos valores.

Exemplo sintético: duas partidas com 30 e 20 pontos geram points=50 por sum e ppg=25 por ratio, referenciando as duas revisões. Sem prova de período integral, a cobertura continua unknown.

`comparable` é verdadeiro apenas quando os dois valores estão disponíveis e possuem cobertura completa. Isso permite leitura lado a lado; não afirma superioridade. A consulta e as contagens permanecem expostas para distinguir temporadas, fases, equipes e quantidades de jogos diferentes.

## Compatibilidade, recusas e próximas etapas

Os schemas anteriores continuam aceitos: coverage e displayPrecision são adições opcionais, sem novos arquivos de produção ou migração obrigatória. Para acrescentar evidência a um registro já publicado, criar uma nova revisão e executar o controle append-only com baseline. Não editar silenciosamente o histórico.

O motor recusa dados inválidos, referências inválidas, revisões inconsistentes, overflow e contradições de participação. Retorna indisponibilidade por dados faltantes, indefinição por divisor zero e conflito por fontes incompatíveis.

Não estima partidas, equipes, rodadas ausentes ou totais oficiais. Não existe média ponderada de médias arredondadas, consolidação de carreira, autenticação de revisão, OCR ou importador. A Entrega 03 poderá alimentar os contratos com dados revisados, resolver evidências de completude e integrar consumidores sem alterar estas regras. Formatação visual fica fora do domínio.

Evidências de equipes/rodadas que citam a mesma participação são recusadas antes da soma, inclusive quando o jogo ainda não foi importado. Conflitos na métrica GP também deixam gameCount indisponível.
