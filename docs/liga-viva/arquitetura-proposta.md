# Arquitetura proposta para o futuro motor

Esta proposta não implementa o motor nem modifica os dados publicados. O motor deve operar como domínio separado do catálogo de estatísticas de jogadores.

## Entradas normalizadas

Criar um contrato versionado de temporada da Liga, mantendo os arquivos atuais como fonte legada:

- `seasonId`, rótulo e status;
- modo de proveniência (`nba-real`, `nba2k-local`, `synthetic-constrained`), fonte e revisão;
- regras por temporada: limite de jogos, alinhamento de equipes/conferências/divisões, distribuição do calendário, seeding, desempates e playoff;
- snapshots observados: standings, detalhes e séries preservados sem mutação;
- evidências/cobertura para cada campo, incluindo `observed`, `derived`, `missing` e nível de confiança.

O contrato de jogo existente em `src/lib/statistics/schemas.ts` já fornece uma base para identificador, season/phase, mandante, visitante e data opcional. Para resultados completos, estender/adicionar um esquema explícito de resultado (placar ou vencedor) com fonte/revisão. Não sobrecarregar `playerPhaseStatsSchema` como resultado de equipe.

## Pipeline sugerido

```text
fontes arquivadas → normalização revisada → snapshot imutável de alvos
                                      ↓
regras históricas versionadas → solver/gerador com seed reproduzível
                                      ↓
validador independente → calendário reconstruído + trilha de evidências
                                      ↓
adaptador de leitura para interface/narrativas
```

1. **Normalização:** converter códigos históricos de equipes para IDs estáveis, conservar o código original e fazer revisão humana de OCR/transcrição.
2. **Restrições:** traduzir W-L, casa/fora, conferência/divisão, H2H disponível, standings e playoff para equações e limites; impedir que os dados derivados sobrescrevam alvos observados.
3. **Geração:** se o problema tiver várias soluções, documentar isso; usar algoritmo determinístico com seed e objetivo explícito (por exemplo, maximizar dispersão cronológica), sem chamar jogos inventados de resultados históricos.
4. **Validação independente:** recalcular classificação e estatísticas do zero e comparar com todos os alvos; reportar conflitos e campos sem cobertura.
5. **Publicação:** versionar um artefato separado para temporada reconstruída, com status (rascunho/revisado/publicado), configuração de regra, seed e hash das entradas. Interface lê por adaptador e mantém a separação entre dado observado e narrativa gerada.

## Ponto de integração no repositório

Manter `season-extras.json` e o catálogo de estatísticas intactos nesta etapa. Em futura implementação, introduzir um catálogo dedicado de Liga, ou uma categoria explícita no manifesto, em vez de misturar resultados de equipe com estatísticas de jogador. Consumidores atuais são `src/routes/temporadas.tsx` e `SeasonExtras`; a API interna deve oferecer leitura de classificação, chave e reconstrução por `seasonId`, enquanto os componentes não acessam arquivos de importação diretamente.

O validador atual (`scripts/statistics/validate-data.ts`) não examina `season-extras.json` matematicamente. Um futuro validador de Liga deve ter comandos de análise somente leitura antes de qualquer publicação, saída legível por temporada e opção de falhar em inconsistências. Testes devem usar fixtures de temporadas curtas com calendários históricos diferentes, empates e temporadas sem detalhes — não assumir 82 jogos em toda edição.

## Temporada piloto

Começar a especificação com `season-002` (2006–07): é a primeira temporada com classificação geral, detalhes de casa/fora, conferência/divisão, sequência e playoffs, e o arquivo registra status consistente. Antes de gerar qualquer partida, confirmar se sua fonte é uma liga local NBA 2K e obter a regra/calendário usado. Se esse calendário não existir, o primeiro artefato do motor deve ser identificado como **reconstrução sintética condicionada**, não reconstrução factual do calendário.
