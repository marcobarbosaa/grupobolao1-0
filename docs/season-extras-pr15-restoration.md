# Classificação e Playoffs — direção visual do PR #15

Referência: https://github.com/marcobarbosaa/grupobolao1-0/pull/15 (Escudos históricos).

## Alteração visual
- Recupera a organização do PR #15: painéis azul-marinho, títulos de arquivo esportivo, tabela detalhada, escudos históricos e um chaveamento horizontal com Oeste → NBA Finals ← Leste.
- Restaura a classe principal `seasonextras`, os painéis `seasonextras-panel` e o CSS histórico de `src/components/sports/SeasonExtras.css`, com reforços de acessibilidade e responsividade.
- A identidade visual se aplica exclusivamente à seção de Classificação e Playoffs. Não altera o visual das fichas individuais nem a landing page.
- A seleção da temporada é compartilhada pela rota `src/routes/temporadas.tsx`. Dentro da seção, "Classificação" e "Chaveamento" são visualizações distintas, como no PR #15.

## Dados preservados
- Temporada 01 (2005–06): somente chave de playoffs; nenhuma classificação publicada.
- Temporada 02 (2006–07): classificação com 30 franquias e playoffs, campeão Knicks 4–0 Timberwolves.
- Temporada 03 (2007–08): classificação com 30 franquias e playoffs, campeão Hawks 4–1 Spurs.
- `season-extras.json` NÃO foi modificado nesta alteração. As colunas adicionais da tabela (GB, Casa, Fora, Conferência, Divisão, Sequência) estão separadas em `season-002/standings-details.json` e `season-003/standings-details.json`, a partir do PR #15 e dos prints já fornecidos.

## Escudos históricos
- Mapeamento das 30 franquias derivado do PR #15, com assets históricos da https://logocdn.com/nba/ e fallback de sigla caso o CDN falhe.
- Exceções de período: Milwaukee (1993) na Temporada 01; Atlanta, Charlotte, New Orleans Hornets e Washington (2007) na Temporada 03.
- O sistema NÃO utiliza logos atuais da ESPN: relocations e rebrands (Nets, SuperSonics, Hornets, Bobcats) são tratados pelo mapeamento de época.

## Verificações
O teste `tests/statistics/season-extras.test.mjs` protege integridade dos dados, os 30 escudos, os campos adicionais de classificação e a separação das temporadas. Os resultados dependem do acesso às URLs de escudos, que possuem fallback no cliente.
