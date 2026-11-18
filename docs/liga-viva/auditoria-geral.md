# Auditoria geral — Liga Viva

**Escopo:** auditoria somente leitura dos dados e dos fluxos existentes no repositório. Nenhum dado histórico foi alterado. A auditoria foi feita em 18/11/2026.

## Diagnóstico

A rota `/temporadas` monta a interface da Liga a partir do catálogo publicado (`src/lib/published-catalog.ts`), que combina `src/data/statistics/manifest.json` e os arquivos resolvidos pelo plugin virtual. O seletor da página é limitado às temporadas cadastradas no catálogo. O componente `src/components/sports/SeasonExtras.tsx` consome os complementos de classificação e playoffs; estatísticas individuais são outro domínio, carregado pelo catálogo de estatísticas.

O manifesto registra oito temporadas (`season-001` a `season-008`), **zero partidas** (`games: []`) e zero prêmios. Os resultados de classificação e séries estão em `src/data/statistics/season-extras.json`, fora do esquema principal de `games`. A temporada 001 contém apenas chave de playoffs; as temporadas 002–008 têm classificação geral e chave de playoffs. Somente 002–005 também têm `standings-details.json` com mandante, visitante, conferência, divisão, jogos de vantagem e sequência.

As temporadas são edições da liga local com rótulos de anos NBA e dados transcritos de Extras/NBA 2K; não há calendário de partidas nem definição formal de que placares e regras sejam os da NBA real. A documentação de origem em `integrity.description` descreve capturas de tela e validação visual. Isso torna essencial manter separados “ano exibido” e “regra/agenda comprovada”.

## Verificações realizadas

- `npm run stats:validate` passou: `Statistics v1.0 valid: 8 seasons, 310 statistical revisions, 0 games, 0 award revisions.` Esse validador verifica o catálogo e os registros do domínio de estatísticas, não a consistência matemática da classificação/playoffs em `season-extras.json`.
- Nas temporadas 002–008, classificação: 30 equipes, 15 por conferência, 82 jogos por equipe; somas de vitórias e derrotas = 1.230 cada; aproveitamento coincide com vitórias/jogos. Em 002–005, os registros casa/fora somam ao registro geral; conferência soma 52 jogos por equipe e divisão 16. Sequências e jogos de vantagem estão presentes como strings.
- As temporadas 002–008 têm 15 séries cada; vencedor declarado pertence ao par e o campeão declarado coincide com o vencedor da final. A chave codifica séries e vitórias por série, não datas, placares individuais ou mandos jogo a jogo.
- Temporada 001: 15 séries e campeão da chave, mas nenhum registro de classificação. `integrity.status` é `playoffs-only` e informa que a classificação atribuída anteriormente foi retirada por pertencer a outra temporada.
- O validador de dados e os testes existentes não verificam que as partidas individuais reconstruídas satisfaçam todas essas contagens, nem verificam as relações da chave com a classificação.

## Conclusões práticas

1. **Melhor piloto:** `season-002` (2006–07), por ter classificação, registros casa/fora, conferência/divisão, sequência, jogos de vantagem, chave completa e notas de consistência. Continua sem calendário nem confrontos diretos explícitos; a geração de jogos ainda exigirá um modelo de restrições e revisão das regras locais.
2. **Candidatas com restrições agregadas mais fortes:** 002–005. As temporadas 006–008 têm classificação/chave, mas não o arquivo de detalhes; portanto oferecem menos restrições à reconstrução.
3. **Não pilotar:** 001, por falta da classificação. 007 também exige decisão de proveniência: seu rótulo é 2011–12, mas os dados informam 82 jogos por equipe; a temporada real da NBA foi encurtada para 66 jogos por equipe devido ao lockout ([comunicado oficial NBA](https://pr.nba.com/nba-2011-12-game-broadcast-schedules/)). Se a edição representar a NBA real, é incompatível com o calendário histórico. Se representar uma carreira/simulação local NBA 2K, isso precisa ser afirmado e documentado como regra da liga.

## Fontes internas principais

- Catálogo e publicação: `src/data/statistics/manifest.json`, `src/lib/published-catalog.ts`, `src/lib/statistics/catalog.ts`, `vite.config.ts` (plugin virtual).
- Interface: `src/routes/temporadas.tsx`, `src/components/sports/SeasonExtras.tsx`.
- Dados da Liga: `src/data/statistics/season-extras.json`; detalhes por temporada em `src/data/statistics/season-00N/standings-details.json` (002–005).
- Contrato de jogos e fases: `src/lib/statistics/schemas.ts`. O esquema `gameSchema` aceita jogo com mandante/visitante, data opcional e fase, mas o manifesto publicado não contém jogos.
- Validação/importação: `scripts/statistics/validate-data.ts`, `src/lib/statistics/validate.ts`, `src/lib/statistics/import-validation.ts`; testes em `tests/statistics/` cobrem estatísticas, esquema, importação e persistência, não o motor da Liga.
- Origem e cobertura dos dados individuais: `src/data/statistics/season-00N/{sources,batches,revisions,statistics}*.json`, `teamHistory.json`, `teams.json` quando presente e os READMEs por temporada. Esses registros descrevem estatísticas de jogadores e histórico de vínculo com equipes, não resultados completos de partidas.
