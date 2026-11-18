# Auditoria de cobertura — Extras de classificações (18/11/2026)

Auditoria atualizada após conferência visual dos ZIPs fornecidos nesta solicitação e comparação com a branch `main`.

## Resultado por temporada

| ID | Ano | Classificação | Playoffs | Detalhes complementares |
|---|---|---:|---:|---|
| season-001 | 2005–06 | Não publicada | 15 séries | Apenas chaveamento |
| season-002 | 2006–07 | 30 equipes | 15 séries | Completo |
| season-003 | 2007–08 | 30 equipes | 15 séries | Completo |
| season-004 | 2008–09 | 30 equipes | 15 séries | Completo |
| season-005 | 2009–10 | 30 equipes | 15 séries | Completo |
| season-006 | 2010–11 | 30 equipes | 15 séries | Completo; detalhes em `season-006/standings-details.json` |
| season-007 | 2011–12 | 30 equipes | 15 séries | Completo; detalhes em `season-007/standings-details.json` |
| season-008 | 2012–13 | 30 equipes | 15 séries | Campos complementares pendentes |
| season-009 | 2013–14 | 30 equipes | 15 séries | Completo, campos incorporados nas linhas |
| season-010 | 2014–15 | 30 equipes | 15 séries | Completo, campos incorporados nas linhas |
| season-011 | 2015–16 | 30 equipes | 15 séries | Completo em `season-011/extras.json` |

## Estrutura e integração

A tabela da Liga apresenta posição, equipe, vitórias, derrotas, aproveitamento, GB, Casa, Fora, campanha de Conferência, Divisão, PPG, PAPG, saldo e sequência.

- Em 2010/11 e 2011/12, os seis campos complementares foram registrados em sidecars separados, seguindo a arquitetura existente usada nas temporadas antigas. `SeasonExtras.tsx` associa os arquivos por temporada, sem conflitar com a propriedade de conferência usada para separar Oeste e Leste nas linhas base.
- Em 2015/16, classificação e playoffs foram adicionados ao catálogo de Extras via manifesto. Cada linha contém os seis campos complementares.
- A renderização usa a mesma estrutura Classificação/Playoffs e os mesmos componentes existentes; não houve reformulação visual.
- Os nomes de franquias Charlotte e New Orleans na classificação de 2015/16 respeitam a identidade histórica Hornets/Pelicans daquele período.

## Verificações realizadas

- 30 equipes e 15 séries preexistentes preservadas em cada uma das temporadas 2010/11 e 2011/12.
- Todos os 30 registros de detalhes em cada sidecar foram associados a uma equipe única; os splits Casa/Fora reconciliam com vitórias e derrotas da classificação.
- 2015/16: 15 equipes por conferência, 30 códigos de equipe únicos, 15 séries e campeão Toronto Raptors.
- Aproveitamentos, campanhas de Casa/Fora, saldos e progressão dos vencedores foram validados por verificações independentes antes da publicação.
- As capturas de origem de 2015/16 possuem SHA-256 registrado em `season-011/sources-extras.json`; lote e revisão estão publicados e referenciados no manifesto.
- Nenhum arquivo de estatísticas individuais ou de temporadas fora do escopo foi incluído na complementação.

O build do projeto e o teste visual em navegador não foram executados nesta sessão; a validação descrita acima é estrutural e numérica, não substitui a verificação pós-deploy.
