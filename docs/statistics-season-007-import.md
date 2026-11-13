# Importação da Temporada 07 — 2011–2012

Origem: Google Drive Primary → Bolão → Temporada 2011-2012 (F).

## Dados publicados na main
- Classificações das Conferências Oeste e Leste: 30 franquias; pontuação, aproveitamento e campanha a partir das cinco capturas de **Extras**.
- Chaveamento dos playoffs: 15 séries completas, New York Knicks campeão contra Dallas Mavericks por 4–2.
- Jogadores: 13 registros de Regular Season e 10 registros consolidados de playoffs em `season-007/statistics.json`. Gam Mori, Enzo e Nando não possuem registro agregado de playoffs porque suas equipes ficaram fora.
- Playoffs individuais: **22 registros por fase**, com GP/GS, médias e aproveitamentos em `season-007/statistics-rounds.json`: Jonas 4, Tailan 4, Dias 4, Matheus Medeiros 3, Fábio Carvalho 2, Russo 2, Guilherme 2 e Abel 1.
- Histórico de equipes da temporada para os 13 atletas, inclusive Marco Barbosa no Miami Heat e Dias no Dallas Mavericks, sem usar uniforme da temporada atual.
- Escudos históricos, fontes e arquivos de auditoria vinculados ao catálogo publicado.

## Auditoria de fontes
- 39 capturas dos perfis de jogadores (`sources.json`) e 44 capturas de rodadas (`sources-rounds.json`).
- Cada entrada de fonte contém nome original, ID e pasta do Google Drive, e SHA-256 dos bytes JPEG; imagens privadas não foram copiadas para o repositório.
- `batches*.json` e `revisions*.json` preservam autorização de publicação e vínculo entre registros e capturas. Os cinco prints de Extras possuem rastreabilidade em `season-extras-sources.json`.

## Verificações e limites
- Os 23 registros regulares/agregados têm total de pontos compatível com cestas de 2, 3 e lances livres.
- Para os atletas com todas as fases disponíveis, a soma de jogos por fase e as médias de pontos ponderadas correspondem ao registro agregado (diferenças de até décimo devido a arredondamento).
- **Abel:** a pasta tem um print específico das quartas de final (cinco jogos) e prints do agregado dos playoffs (dez jogos). A primeira rodada não foi publicada separadamente porque não havia captura específica; não se inferiram suas estatísticas.
- Para Cristiano Ronaldo e Marco Barbosa foram importados os agregados de playoffs, mas não existem capturas detalhadas por rodada nas pastas. Não se inventaram registros individuais.
- Dados visíveis são referentes ao universo Grupo Bolão NBA 2K, não à temporada histórica real da NBA. Não foram executados testes de interface em navegador nesta sessão.
