# Temporada 10 — 2014–2015 (Grupo Bolão NBA 2K)

**Origem:** Google Drive Primary → Bolão → Temporada 2014-2015 (F).

## Publicado na main — duas partes

- A edição `season-010` foi cadastrada em `season-010/seasons.json` e habilitada pelo `manifest.json`.
- **Parte 1:** 13 jogadores com temporada regular e 12 agregados de playoffs; **25 registros** em `statistics.json`. Os registros incluem partidas, minutos, pontos, rebotes, assistências, roubos, bloqueios, perdas de bola, arremessos, lances livres, faltas, duplos-duplos, triplos-duplos, médias e aproveitamentos conforme capturas.
- **Parte 2:** 26 registros individuais de playoffs em `statistics-rounds.json`, com GP/GS, médias e aproveitamentos por fase (sem criar totais que as telas individuais não apresentam).
- Jogadores com fases: Jonas 4, Tailan 4, Cristiano Ronaldo 4, Fábio Carvalho 2, Russo 2, Gam Mori 3, Guilherme 4, Matheus Medeiros 3.
- Enzo, Dias, Nando e Abel têm agregados de playoffs sem telas individuais de fases nesta pasta; **não foi presumida uma fase**.
- Marco Barbosa possui somente temporada regular, sem agregado de playoffs no conjunto.
- `teamHistory.json` registra as 13 associações individuais de 2014–2015. Alterações observadas: Fábio Carvalho (Minnesota Timberwolves), Dias (Orlando Magic), Nando (Milwaukee Bucks). As duas últimas franquias foram adicionadas a `teams.json`.
- **Extras não importados**, conforme orientação anterior de manter essa área separada para o futuro.

## Fontes e auditoria

- `sources.json`: 13 fontes JPEG individualizadas, uma por atleta, com **SHA-256 calculado dos bytes da captura indicada**; o campo `additionalCaptureFiles` referencia as outras duas telas consultadas na mesma pasta.
- `sources-rounds.json`: 26 fontes JPEG de fases com hashes SHA-256 reais; telas complementares de arremessos permanecem no Drive.
- Dois lotes `published` em `batches.json` e `batches-rounds.json`; **51 revisões** em `revisions.json` e `revisions-rounds.json`.
- Os originais das capturas permanecem no Drive, não são disponibilizados publicamente no GitHub.

## Integridade verificada

- Os 25 agregados preservam a identidade `PTS = 2 × FGM + 3PM + FTM`; os 13 históricos apontam para equipes cadastradas.
- Para os oito atletas com partidas por fase, a soma de GP nas rodadas equivale ao GP do agregado de playoffs.
- As médias de pontos das fases são compatíveis com o agregado, dentro do arredondamento de uma casa decimal usado no jogo.
- Todos os 51 registros têm origem e revisão; os 39 hashes de fontes da temporada são distintos.
- A validação referencial foi realizada nos arquivos JSON após publicação. **Build completo e teste visual do Cloudflare Workers não foram executados nesta sessão.**

## Escopo não coberto

Não foram publicados classificação de conferências, chaveamento completo, jogos individuais ou prêmios a partir de `Extras`, pois seu uso continua reservado para uma etapa futura.
