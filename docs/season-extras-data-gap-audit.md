# Auditoria de cobertura — Extras de classificações (2015–16 e anteriores)

Auditoria realizada em 18/11/2026 com leitura dos dados publicados na branch `main`, do catálogo histórico, das fontes indexadas e da lógica de renderização de `SeasonExtras.tsx`.

## Resultado por temporada

| ID | Ano | Classificação | Playoffs | Detalhes complementares |
|---|---|---|---:|---|
| season-001 | 2005–06 | Não publicada | 15 séries | Apenas chaveamento |
| season-002 | 2006–07 | 30 equipes | 15 séries | Completo (arquivo de detalhes por equipe) |
| season-003 | 2007–08 | 30 equipes | 15 séries | Completo (arquivo de detalhes por equipe) |
| season-004 | 2008–09 | 30 equipes | 15 séries | Completo (arquivo de detalhes por equipe) |
| season-005 | 2009–10 | 30 equipes | 15 séries | Completo (arquivo de detalhes por equipe) |
| season-006 | 2010–11 | 30 equipes | 15 séries | **Pendente** |
| season-007 | 2011–12 | 30 equipes | 15 séries | **Pendente** |
| season-008 | 2012–13 | 30 equipes | 15 séries | **Pendente** |
| season-009 | 2013–14 | 30 equipes | 15 séries | Completo, campos incorporados nas linhas |
| season-010 | 2014–15 | 30 equipes | 15 séries | Completo, campos incorporados nas linhas |
| season-011 | 2015–16 | — | — | Extras ainda não importados |

## Campos da tabela

A interface apresenta os campos: posição, equipe, vitórias, derrotas, aproveitamento, GB, Casa, Fora, Conferência, Divisão, PPG, PAPG, saldo e sequência.

Os registros publicados em seasons 006–008 incluem posição, conferência, equipe, vitórias, derrotas, aproveitamento, PPG, PAPG e saldo. As seis colunas complementares (GB, Casa, Fora, Conferência, Divisão e Sequência) não estão presentes nos JSONs dessas três temporadas.

O repositório, contudo, possui cinco referências de captura de Extras para cada uma das temporadas 006, 007 e 008 — quatro capturas das classificações e uma captura da chave de playoffs. Os dados completos das imagens não puderam ser conferidos nesta sessão.

## Alteração visual publicada

`SeasonExtras.tsx` agora identifica dinamicamente os campos complementares ausentes na conferência selecionada e mostra um aviso explicativo. O aviso não altera nem inventa estatísticas; indica que o traço representa dado ainda não publicado, e não zero.

## Restrição de fonte

O conector Google Drive estava indisponível por restrição administrativa nesta sessão. Os IDs das capturas estão registrados no `season-extras-sources.json`, mas o conteúdo visual dos arquivos não pôde ser reaberto. A classificação fictícia MyNBA não pode ser completada com dados da NBA real ou inferências.

Para completar a extração de seasons 006–008 e importar season-011, é necessário recuperar as imagens de Extras do Drive (ou disponibilizar novamente as capturas). Não foram criados valores estimados.

## Verificação

- 30 equipes e 15 séries de playoffs nos registros de standings seasons 002–010.
- seasons 002–005: 30 detalhes complementares por temporada.
- seasons 009–010: campos complementares embutidos nas linhas da classificação.
- seasons 006–008: somente campos básicos; 5 fontes indexadas por temporada.
- season-011: estatísticas individuais importadas previamente, mas nenhum registro de Extras.
- Build e teste visual de produção não executados nesta sessão.
