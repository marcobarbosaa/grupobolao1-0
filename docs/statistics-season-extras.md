# Classificações e playoffs: correção de temporadas (2026-11-11)

## Atribuição histórica

- **2005/06 — Temporada 01:** somente playoffs. A classificação anteriormente incluída foi enviada para o ano errado; removida do arquivo desta edição. O playoff da Temporada 01 permanece inalterado.
- **2006/07 — Temporada 02:** a classificação anteriormente associada a 2005/06 pertence a esta edição. A posição dos 30 times é compatível com a chave na pasta `Bolão/Temporada 2006-2007/Extras` do Google Drive. Foram importadas as 15 séries. Final: **New York Knicks 4–0 Minnesota Timberwolves**.
- **2007/08 — Temporada 03:** classificação e playoffs mantidos, sem mudanças nos resultados. Campeão: Atlanta Hawks, 4–1 sobre San Antonio Spurs.

## Procedência

As cinco fontes da Temporada 02 estão descritas em `season-extras-sources.json` (quatro telas de classificação e a chave dos playoffs). A fonte única da Temporada 01 continua sendo a árvore de playoffs anexada na conversa; nenhum print de classificação da Temporada 01 foi mantido. Temporada 03 permanece ligada às cinco imagens da pasta Extras da temporada correspondente. Imagens não são publicadas no repositório.

## Apresentação

`SeasonExtras` recebe o ID da temporada do seletor compartilhado em `src/routes/temporadas.tsx`. O arquivo `src/styles/season-extras.css` define o layout encapsulado, com largura máxima, hero de campeão, conferências selecionáveis, tabela legível em desktop/mobile e rodadas de playoffs com placares de série. Os dados dos jogadores em `PublishedStatistics` e as demais rotas não são alterados.

## Verificação

O teste `tests/statistics/season-extras.test.mjs` verifica: ausência de classificação da Temporada 01; 30 equipes nas Temporadas 02/03, 15 séries cada, vitórias/derrotas, correspondência dos classificados da primeira rodada com o top 8 de cada conferência, progressão entre rodadas e resultados das finais. Executar `npm run stats:test` e `npm run build` na CI ou em ambiente Node com dependências.
