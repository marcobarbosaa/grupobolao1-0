# Extras — Temporadas 09 (2013–2014) e 10 (2014–2015)

## Origem e escopo

Capturas oficiais do universo fictício MyNBA do Grupo Bolão, no **Google Drive Primary**, pasta `Bolão/Temporada 2013-2014 (F)/Extras` e `Bolão/Temporada 2014-2015 (F)/Extras`. Cinco imagens JPEG por temporada: uma chave completa dos playoffs e quatro capturas de classificações (Leste/Oeste, primeira e segunda metade). Imagens originais preservadas no Drive.

**Temporada 09 (2013–2014):** 30 posições de classificação, 15 séries dos playoffs, campeão Denver Nuggets sobre Toronto Raptors por **4–2**. Líderes de conferência: Denver Nuggets (62–20) e Toronto Raptors (60–22).

**Temporada 10 (2014–2015):** 30 posições de classificação, 15 séries dos playoffs, campeão New York Knicks sobre Denver Nuggets por **4–2**. Líderes de conferência: Dallas Mavericks (58–24) e Toronto Raptors (60–22).

## Conteúdo transcrito

Registros `season-009/extras.json` e `season-010/extras.json` contemplam, para todas as franquias, classificação, vitórias, derrotas, aproveitamento, jogos atrás do líder, campanhas em casa, fora, conferência e divisão, pontos feitos/sofridos por partida, saldo e sequência final. Ordem e sementes são **as da interface do jogo**, não reordenadas apenas por W/L. Para playoffs, cada série registra as equipes, placar, rodada, conferência e vencedor, com progressão conferida desde a primeira rodada até a final.

## Rastreabilidade

- `sources-extras.json`: cinco capturas por temporada, IDs do Drive e SHA-256 reais.
- `batches-extras.json`: lote específico publicado por temporada.
- `revisions-extras.json`: revisão de auditoria de cada Extra.
- `src/data/statistics/manifest.json`: registra o conjunto aprovado, sem retirar históricos.
- `SeasonExtras.tsx`: inclui históricos das Temporadas 09 e 10 para associar atletas aos times, assim como rótulos específicos de Charlotte Hornets e New Orleans Pelicans quando aplicáveis.

## Verificações e limitações

- 30 franquias distintas e 15 séries por temporada, com vencedores, campeão e progressão validados.
- Todas as campanhas resultam em 82 partidas, o retrospecto casa/fora coincide com a campanha, e os aproveitamentos são coerentes com os resultados arredondados.
- Referências entre Extra, fontes, lotes, revisões e manifesto conferidas por leitura de volta na `main`.
- Não foram adicionadas premiações, box scores ou partidas individuais que não apareçam nas dez capturas.
- **Sem teste completo do build de produção ou navegador Cloudflare Workers nesta sessão.**
