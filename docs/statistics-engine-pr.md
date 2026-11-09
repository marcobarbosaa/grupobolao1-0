A fundação estatística foi integrada à main em 25db46d. Este PR adiciona o motor matemático isolado do frontend: médias, aproveitamentos, totais de unidades distintas, revisões vigentes, agregação de partidas/rodadas/equipes e comparação objetiva.

Os resultados carregam procedência e cobertura por métrica. coverage e displayPrecision são extensões opcionais dos registros existentes. Completude exige evidência revisada; o histórico de partidas exige correspondência exata com os IDs esperados. Consolidados, rodadas e jogos são alternativas separadas, e fontes completas incompatíveis geram conflito.

Não há arredondamento destrutivo, reconstrução de totais a partir de médias, soma do agregado playoffs como rodada, notas ou rankings. Manifest, cadastro dos 13 jogadores e frontend permanecem intactos.

Documentação: docs/statistics-engine.md (fórmulas, API, política de fontes, exemplos sintéticos, limitações) e docs/statistics-delivery-02.md (arquivos e validação).

Sem merge automático. OCR, importador, banco, autenticação e integração visual seguem fora do escopo.

Validação local: 89 testes aprovados (73 estatísticos e 16 existentes), stats:validate, stats:typecheck, tsc --noEmit, ESLint de todo o escopo estatístico e build cliente/SSR. Sem falhas ou skips; nenhuma regra de lint desabilitada.
