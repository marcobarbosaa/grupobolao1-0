# Temporada 06 — 2010–2011 (F): importação do Grupo Bolão

**Origem:** Google Drive Primary / Bolão / Temporada 2010-2011 (F) (pasta `1HpyLqG_1JcRwrZRR2reiieDxIMsHBQuc`). Importação em 13/11/2026.

## Dados publicados

- Classificação da temporada regular: **30 equipes**, 15 por conferência, ordenadas segundo as telas de NBA 2K.
- Playoffs: **15 séries**, incluindo a final **New York Knicks 4–3 Memphis Grizzlies**.
- **13 registros de jogadores na temporada regular**, com totais, médias e aproveitamentos.
- **8 registros agregados de playoffs**: Jonas, Tailan, Gam Mori, Enzo, Dias, Nando, Guilherme e Matheus Medeiros. Nenhuma fase foi atribuída a atletas sem linha de playoffs nas capturas.
- **13 vínculos históricos de equipe**, associados à temporada específica para as estrelas e os nomes na classificação e nos playoffs.
- **39 capturas consolidadas** de jogadores, com IDs privados do Google Drive e SHA-256 para auditoria, mais 5 imagens de Extras. Arquivos originais não são publicados.
- Catálogo e tela de Temporadas atualizados para expor a sexta edição e seus escudos da época.

## Complementação — playoffs individuais por rodada (13/11/2026)

**18 registros individuais por fase** publicados em `season-006/statistics-rounds.json`: Jonas (4), Tailan (4), Gam Mori (3), Nando (3), Guilherme (2) e Matheus Medeiros (2). Fases registradas: `first-round`, `quarterfinals`, `conference-finals` e `nba-finals`, exclusivamente nas capturas existentes.

Foram vinculadas **36 imagens JPEG do Drive** em `sources-rounds.json` com IDs e SHA-256, sem disponibilizar imagens privadas no GitHub. `batches-rounds.json` e `revisions-rounds.json` registram a trilha de importação. As 18 linhas foram registradas no catálogo (`manifest.json`).

Cada registro contém GP, GS, médias e aproveitamentos visíveis nos prints; os totais de arremessos por fase não foram estimados a partir de médias arredondadas. A soma de jogos e a média ponderada dos pontos por fase foram confrontadas com os 6 registros agregados de playoffs já publicados.

**Sem registros por rodada para Enzo e Dias:** as capturas consolidadas confirmam os playoffs, mas não foram localizadas capturas de fases individuais nas pastas respectivas nesta remessa.

Colunas detalhadas de classificação (campanha em casa, fora, divisão, conferência, GB e sequência) não foram digitalizadas nesta remessa: a visualização mantém traços onde não existem dados estruturados.

Arquivos: `src/data/statistics/season-006/`, `src/data/statistics/season-extras.json`, `src/data/statistics/season-extras-sources.json`, `src/data/statistics/manifest.json` e `src/components/sports/SeasonExtras.tsx`.
