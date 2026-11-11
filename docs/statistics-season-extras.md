# Arquivo coletivo — Temporadas 01 e 03

## Origem e escopo

- Temporada 01 (2005–06): 5 imagens anexadas pelo usuário na conversa em 11/11/2026 (uma árvore de playoffs, quatro telas de classificação).
- Temporada 03 (2007–08): cinco imagens da pasta Google Drive `Bolão / Temporada 2007-2008 / Extras`, pasta `1U90f0769L4ulBVuf2rOi3ZU3t9w47A26` (uma árvore de playoffs, quatro telas de classificação).
- Dados separados em `src/data/statistics/season-extras.json`; 30 equipes, 15 séries de playoffs por temporada. Fontes rastreadas em `season-extras-sources.json`; não se republicam os arquivos de imagem.
- Campos importados das classificações: posição exibida (não recalculada), equipe, vitórias, derrotas, percentual calculado, pontos por jogo, pontos cedidos por jogo e diferença. Outros campos presentes nos screenshots não foram transcritos nesta entrega.
- Caminhos dos playoffs mantêm as vitórias de cada série e o campeão exibido.

## Conflito verificável na Temporada 01

A árvore de playoffs enviada como 2005–06 exibe San Antonio como cabeça de chave 1 no Oeste, enquanto a classificação anexa exibe Phoenix em primeiro. No Leste, a árvore lista Milwaukee como 6º cabeça de chave, mas a classificação mostra Milwaukee em 8º. Há outras divergências inclusive entre classificados e não classificados (exemplo: Memphis aparece em 7º na árvore, mas 9º na classificação). **Não presumir que as fontes são do mesmo estado da liga.** A interface mantém ambos os documentos e exibe uma nota de divergência. Não substituir a ordem de classificação, nem alterar placares para forçar concordância.

## Verificações

O formato do arquivo coletivo não é parte dos contratos estatísticos de jogadores: é uma coleção complementar declarativa usada apenas pelo componente `SeasonExtras`. Cada conferência contém 15 linhas, registros W+L=82, e cada temporada contém 15 séries até as finais, com o vencedor determinável por quatro vitórias. A temporada 02 permanece sem dados coletivos. Necessária execução de `npm run build` e demais testes no ambiente do projeto.
