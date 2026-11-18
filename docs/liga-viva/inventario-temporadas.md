# Inventário de temporadas

O inventário abaixo combina `src/data/statistics/manifest.json`, `seasons.json`, `season-extras.json` e os arquivos de detalhes disponíveis. “Parcial” significa que há âncoras úteis, mas faltam restrições importantes para reconstruir uma temporada de ponta a ponta. “Completa” indica potencial matemático com os agregados existentes, não disponibilidade do calendário verdadeiro.

| Edição | Rótulo | Classificação | Classificação geral / W-L / aproveitamento | Casa/fora | Conferência/divisão | Sequência / GB | Playoffs | Limites/evidências |
|---|---|---|---|---|---|---|---|---|
| 001 | 2005–06 | Incompleta | Ausente | Ausente | Ausente | Ausente | 15 séries; campeão MIL | `integrity.status=playoffs-only`; nenhuma tabela de classificação em `season-extras.json`. |
| 002 | 2006–07 | Completa* | 30 times; 82 jogos; W-L e pct | Sim, 30/30 | Sim, 30/30 | Sim, 30/30 | 15 séries; campeão NY | Melhor cobertura agregada; não há lista de jogos ou H2H explícito. |
| 003 | 2007–08 | Completa* | 30 times; 82 jogos; W-L e pct | Sim, 30/30 | Sim, 30/30 | Sim, 30/30 | 15 séries; campeão ATL | Mesmo nível agregado de 002; detalhe em `standings-details.json`. |
| 004 | 2008–09 | Completa* | 30 times; 82 jogos; W-L e pct | Sim, 30/30 | Sim, 30/30 | Sim, 30/30 | 15 séries; campeão CHI | Integridade declara 30 franquias e chave conferida nas capturas Extras. |
| 005 | 2009–10 | Completa* | 30 times; 82 jogos; W-L e pct | Sim, 30/30 | Sim, 30/30 | Sim, 30/30 | 15 séries; campeão DAL | Integridade declara classificação e séries conferidas em cinco imagens. |
| 006 | 2010–11 | Parcial | 30 times; 82 jogos; W-L e pct | Não disponível | Não disponível | Não disponível | 15 séries; campeão NY | Classificação/playoffs marcados consistentes; detalhes por equipe ausentes. |
| 007 | 2011–12 | Incompatível** | 30 times; 82 jogos; W-L e pct | Não disponível | Não disponível | Não disponível | 15 séries; campeão NY | Conflito com calendário NBA real, encurtado para 66 jogos; ver observação abaixo. |
| 008 | 2012–13 | Parcial | 30 times; 82 jogos; W-L e pct | Não disponível | Não disponível | Não disponível | 15 séries; campeão DEN | Classificação/playoffs marcados consistentes; detalhes por equipe ausentes. |

\* “Completa” aqui é provisória e relativa aos agregados locais: permite impor e verificar mais restrições do que as demais, mas não contém calendário, resultados individuais ou divisões históricas explicitamente mapeadas. Não significa que os jogos verdadeiros estejam recuperáveis sem novas fontes.

\** Se `season-007` é uma temporada NBA real, o total de 82 partidas contradiz a temporada de 2011–12, que teve 66 jogos por equipe ([NBA Communications](https://pr.nba.com/nba-2011-12-game-broadcast-schedules/)). Se é uma simulação/edição NBA 2K com agenda própria, recategorizar após registrar a regra e a fonte da agenda local.

## Indicadores disponíveis por edição

- **002–008:** vitórias, derrotas, aproveitamento, posição (`rank`), conferência, pontos por jogo (`ppg`), pontos sofridos por jogo (`papg`) e diferencial (`diff`), além de playoffs.
- **002–005:** ainda têm `home`, `away`, `conference`, `division`, `streak` e `gb` em `standings-details.json`. Exemplo: em 2006–07, PHX registra casa 32–9 e fora 31–10, totalizando 63–19; conferência 39–13; divisão 11–5; sequência representada como texto (`L2`).
- **001:** playoffs existem, mas não se conhece W-L, seed/rank nem composição da temporada regular.
- **Todas:** não há confrontos diretos (H2H), datas, ordem de jogos ou placares individuais no manifesto de jogos. Campos de estatísticas individuais e histórico de jogadores não substituem esses dados.

## Nomes de arquivos por edição

Toda edição possui `seasons.json`, estatísticas individuais, fontes, batches, revisões e `teamHistory.json`. `standings-details.json` só existe em 002–005. Alguns arquivos de séries de rodadas (`statistics-rounds.json`, `sources-rounds.json`, `batches-rounds.json`, `revisions-rounds.json`) se referem a importação de estatísticas por fase/rodada de jogadores, não a um calendário de jogos da liga.
