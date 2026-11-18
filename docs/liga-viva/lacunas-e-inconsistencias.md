# Lacunas e inconsistências

## Lacunas por cobertura

| Lacuna | Edições afetadas | Evidência | Impacto |
|---|---|---|---|
| Classificação regular ausente | 001 | `season-extras.json` tem playoffs e integridade `playoffs-only`, sem `standings` | Não é possível condicionar reconstrução da temporada regular à posição/campanha final. |
| Registros casa/fora, conferência/divisão e sequência ausentes | 001, 006–008 | Não existem `standings-details.json` para essas edições | Menos equações para restringir partidas e validar agenda. |
| Jogos individuais ausentes | 001–008 | `manifest.json` declara `games: []`; os JSONs de estatísticas são registros por jogador/fase | Não há datas, placares, mando, H2H ou cronologia para narrativas factuais. |
| Agenda e regra anual não formalizadas | 001–008 | `seasonSchema` tem fases e rótulos, mas não calendário/alvo de jogos; sem catálogo de regra por temporada | Não dá para inferir agenda só do rótulo. |
| Afiliação de franquia e divisão ao longo da edição | 001–008 | Classificação informa conferência nas edições com standings; detalhes trazem W-L divisional, sem lista explícita de adversários/divisão | Totais divisionais não identificam contra quais equipes as vitórias ocorreram. `teamHistory.json` é histórico de jogadores/equipes. |
| Desempates e critérios do seeding NBA 2K | 002–008 | `integrity.description` cita ordenação/critério NBA 2K, sem regra normativa completa | Empates não podem ser reproduzidos com segurança. |
| Procedência granular de Extras/playoffs | 002–008 | Origem resumida em `integrity.description`; as capturas não estão armazenadas no manifesto de fontes por partida | Auditoria externa e reprocessamento da transcrição ficam limitados. |

## Conflitos condicionais identificados

1. **`season-007` 2011–12:** cada uma das 30 equipes tem 82 jogos (1.230 vitórias e derrotas somadas). A temporada NBA real de 2011–12 teve 66 jogos por equipe após lockout ([comunicado NBA](https://pr.nba.com/nba-2011-12-game-broadcast-schedules/)). A evidência local descreve dados de captura NBA 2K; portanto o conflito é entre ano rotulado e calendário NBA real, e não necessariamente entre arquivos locais. Resolver a semântica: edição local simulada ou retrato da NBA real.
2. **`season-001` classificação retirada:** o texto de integridade diz que a classificação anteriormente atribuída a 2005–06 pertencia a 2006–07 e foi removida. O arquivo preserva apenas chave de playoffs; não restaurar classificação por inferência.
3. **Conferir estatísticas individuais separadamente:** 310 revisões válidas no validador são dados de jogadores e não asseguram a qualidade da classificação. Não usar totais individuais para derivar resultados de equipe sem demonstrar cobertura completa e consistência de fonte.

## Inconsistências que não apareceram nos testes agregados

Em 002–008, registros são 82 jogos por equipe e totalizam 1.230 W e 1.230 L; percentual bate com W/(W+L). Em 002–005, casa/fora recompõe W-L, e totais de conferência/divisão são 52/16. Todas as chaves 002–008 têm 15 séries, vencedor válido em cada série e campeão igual ao vencedor da final. Esses resultados não provam que exista uma solução única (ou mesmo uma solução jogo a jogo) para as restrições combinadas com agendas reais: H2H, schedule e ordem de mando não são registrados.

O validador executado, `npm run stats:validate`, valida oito temporadas e 310 revisões estatísticas, mas informa explicitamente zero jogos e zero prêmios. Assim, “válido” significa conformidade do catálogo/esquema de estatísticas, não certificação independente dos dados da Liga.

## Pendências para fechar antes do motor

- Confirmar se as temporadas representam liga personalizada NBA 2K ou resultados NBA reais.
- Para cada edição, localizar capturas/documentos originais e registrar fonte, data e regra de transcrição.
- Definir o regulamento anual: quantidade de jogos, calendário de adversários, alinhamento de conferências/divisões, desempates, elegibilidade e formato de playoffs.
- Recuperar a lista de equipes e divisão por edição, incluindo aliases (por exemplo, NJN/NJ Nets, NO/NOH) com identidade estável.
- Obter ou aprovar um modelo de geração de agenda que satisfaça os agregados, mantendo explícito que uma agenda sintética não é o calendário histórico verdadeiro.
