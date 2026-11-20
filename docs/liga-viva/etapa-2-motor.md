# Etapa 2 — Motor de reconstrução sintética

## Escopo e proveniência

O motor é um domínio isolado em `src/lib/liga-viva/`, sem integração com o catálogo de estatísticas individuais, sem edição das classificações observadas e sem alterações aos dados de playoffs. As temporadas 002 (2006–07) a 012 (2016–17) têm reconstruções próprias, derivadas de seus snapshots coletivos publicados; temporadas 002–008 usam `season-extras.json` e os sidecars disponíveis, enquanto S09–S12 usam diretamente seus arquivos `extras.json` auditados.

Cada partida gerada recebe `provenance: synthetic-constrained`; os placares gerados também recebem `scoreProvenance: synthetic-constrained`. Eles não são resultados históricos. O arquivo persistido fica no catálogo próprio `src/data/liga-viva/reconstructions/`, com seed, versão do algoritmo e regras, instante de geração, hash SHA-256 das três entradas (classificação, detalhes e regras), agenda, resultados, placares e validação.

## Arquitetura

- `src/lib/liga-viva/types.ts`: contratos da temporada, regras, partidas, classificação reconstruída e artefato persistido.
- `src/lib/liga-viva/engine.ts`: validação de entrada, otimização do calendário par-a-par, atribuição exata de resultados/placares e datas determinísticas.
- `src/lib/liga-viva/validate.ts`: validação independente que recalcula registros, placares e confrontos a partir das partidas, sem reutilizar a solução do gerador.
- `scripts/liga-viva/pilot.ts`: normaliza os arquivos legados de `season-002` e calcula seu hash de entrada; não os escreve.
- `scripts/liga-viva/cli.ts`: geração/persistência e validação somente leitura do artefato.
- `src/data/liga-viva/rules/season-002.json`: regra sintética versionada do piloto.
- `src/data/liga-viva/reconstructions/season-002-seed-pilot.json`: reconstrução do piloto entregue.
- `src/data/liga-viva/rules/season-003.json` e `src/data/liga-viva/reconstructions/season-003-seed-pilot.json`: reconstrução sintética condicionada da temporada 2007–08.
- `src/data/liga-viva/rules/season-004.json` e `src/data/liga-viva/reconstructions/season-004-seed-pilot.json`: reconstrução sintética condicionada da temporada 2008–09.
- `src/data/liga-viva/rules/season-005.json` e `src/data/liga-viva/reconstructions/season-005-seed-pilot.json`: reconstrução sintética condicionada da temporada 2009–10.
- `src/data/liga-viva/rules/season-006.json` e `src/data/liga-viva/reconstructions/season-006-seed-pilot.json`: reconstrução sintética condicionada da temporada 2010–11.
- `src/data/liga-viva/rules/season-007.json` e `src/data/liga-viva/reconstructions/season-007-seed-pilot.json`: reconstrução sintética condicionada da temporada local 2011–12.
- `src/data/liga-viva/rules/season-008.json` e `src/data/liga-viva/reconstructions/season-008-seed-pilot.json`: reconstrução sintética condicionada da temporada local 2012–13.
- `src/data/liga-viva/rules/season-009.json` e `src/data/liga-viva/reconstructions/season-009-seed-pilot.json`: reconstrução sintética condicionada aos Extras auditados da temporada local 2013–14.
- `src/data/liga-viva/rules/season-010.json` e `src/data/liga-viva/reconstructions/season-010-seed-pilot.json`: reconstrução sintética condicionada aos Extras auditados da temporada local 2014–15.
- `src/data/liga-viva/rules/season-011.json` e `src/data/liga-viva/reconstructions/season-011-seed-pilot.json`: reconstrução sintética da temporada local 2015–16, com cobertura divisional parcial explicitada.
- `src/data/liga-viva/rules/season-012.json` e `src/data/liga-viva/reconstructions/season-012-seed-pilot.json`: reconstrução sintética condicionada aos Extras auditados da temporada local 2016–17.

## Algoritmo

O motor usa `glpk.js`/GLPK como solver de programação linear inteira mista (MILP). A seed alimenta um PRNG versionado para ordenar confrontos e fornecer coeficientes determinísticos de desempate. Os registros observados são igualdades rígidas; se o solver não encontrar solução, o motor falha e não corrige a tabela depois.

A agenda par-a-par do piloto é definida por estas regras configuradas:

- Cada equipe joga quatro partidas contra cada uma das quatro equipes de sua divisão sintética: 16 jogos, dois mandos para cada lado do par.
- Contra os dez adversários não divisionais da mesma conferência, cada par joga três partidas mais uma partida opcional. Cada equipe recebe seis partidas extras ao todo; o MILP escolhe os pares extras e distribui mandos para atingir 18 jogos em casa nesse grupo.
- Contra cada adversário da outra conferência são duas partidas, uma em cada mando.
- Assim, cada equipe totaliza 16 + 36 + 30 = 82 jogos, 52 de conferência e 41 em casa/41 fora.

Para cada jogo `g`, uma variável binária representa se o mandante venceu. As equações por equipe fixam vitórias totais, vitórias em casa, vitórias de conferência e vitórias divisionais. Cada jogo dá a vitória a exatamente um participante; derrotas, reciprocidade e demais registros são consequência e são recalculados pelo validador. W-L, casa/fora e alvos de conferência/divisão também são verificados antes de chamar o solver.

Depois de fixar os vencedores, um segundo MILP atribui scores inteiros. Para cada equipe, o total de pontos feitos e sofridos deve cair no intervalo inteiro que arredondaria para o PPG/PAPG observado, com a precisão original de uma casa decimal; não se força um total exato que a fonte não registra. A soma de pontos feitos na liga é igual à soma de pontos sofridos por reciprocidade. Cada jogo tem limite configurável de pontos por time e totais combinados, margem positiva coerente com o vencedor e margem máxima. Para evitar explorar a liberdade dos agregados, cada lado também deve ficar dentro de uma faixa configurável em torno da média entre o ataque observado de uma equipe e a defesa observada do adversário. Scores continuam sintéticos, inclusive quando reproduzem a precisão das médias observadas.

Depois de fixar os resultados, o calendário inicial distribui os jogos por 170 datas a partir de 1º de outubro, escolhendo dias de menor carga e impedindo duas partidas da mesma equipe no mesmo dia. Uma busca local determinística tenta trocas de datas: só aceita uma troca se não criar conflito de equipes e reduzir a penalidade de sequências de mesmo resultado e de mesmo mando. As trocas nunca mudam participantes, mandos ou vencedores. A distribuição cronológica é uma heurística, não uma afirmação sobre o calendário real.

O rank observado é preservado em sua ordem e comparado com a saída; não é inferido por vitórias. Isso é intencional: as fontes não documentam os critérios de desempate/seeding necessários para reproduzir posições como a de MIN e LAL no Oeste.

## Regras sintéticas do piloto

Os arquivos de auditoria não contêm os nomes das divisões nem uma agenda. Para permitir aplicar os 16 jogos divisionais, a configuração agrupa as equipes em seis divisões sintéticas de cinco dentro das conferências. A partição foi escolhida para que as vitórias divisionais observadas somem 40 em cada grupo, que é o total necessário para 40 jogos divisionais recíprocos:

- Oeste 1: PHX, SA, LAL, GS, DEN.
- Oeste 2: MIN, NO, LAC, MEM, HOU.
- Oeste 3: SEA, POR, DAL, SAC, UTA.
- Leste 1: DET, ORL, NY, CHI, CHA.
- Leste 2: WAS, BOS, TOR, MIL, IND.
- Leste 3: CLE, PHI, MIA, NJN, ATL.

Essas associações são uma construção matemática da Etapa 2; não são evidência de divisões históricas ou da liga local. A escolha de pares não divisionais e a ordem das datas também são sintéticas. A janela de 170 dias e a data inicial são parâmetros de demonstração.

## Temporada 03 — 2007–08

A temporada 03 usa os agregados observados do universo NBA 2K no projeto e as seis divisões NBA de 2007–08: Southwest (SA, NO, HOU, DAL, MEM), Northwest (POR, DEN, MIN, UTA, SEA), Pacific (LAL, PHX, GS, SAC, LAC), Atlantic (BOS, NJN, NY, PHI, TOR), Central (CHI, CLE, DET, IND, MIL) e Southeast (MIA, ATL, ORL, WAS, CHA). Os registros divisionais publicados somam 40 vitórias em cada grupo e são compatíveis com o calendário configurado.

A reconstrução contém 1.230 partidas sintéticas, em 170 dias e 85 rodadas de apresentação (dois dias por rodada). Ela reconcilia campanhas, mandos, registros de conferência/divisão e médias de pontos com os dados finais publicados. As datas, confrontos específicos, vencedores e placares não são registros históricos nem reconstituição das partidas reais de 2007–08; são uma solução sintética condicionada. A ordem observada da classificação final é preservada, não inferida por desempate.

## Temporada 04 — 2008–09

A temporada 04 usa as seis divisões de 2008–09: Southwest (SA, NO, HOU, DAL, MEM), Northwest (DEN, MIN, POR, OKC, UTA), Pacific (LAL, PHX, GS, LAC, SAC), Atlantic (BOS, NJN, NY, PHI, TOR), Central (CLE, CHI, DET, IND, MIL) e Southeast (ATL, CHA, MIA, ORL, WAS). Os registros divisionais publicados somam 40 vitórias em cada divisão.

A reconstrução contém 1.230 partidas sintéticas, em 170 dias e 85 rodadas de apresentação, e reconcilia os agregados observados de campanha, mandos, conferência/divisão e pontuação. Datas, confrontos, vencedores e placares são sintéticos e não afirmam os resultados reais jogo a jogo da temporada 2008–09. A ordem final publicada permanece preservada.

## Temporada 05 — 2009–10

A temporada 05 usa as seis divisões de 2009–10: Southwest (DAL, NO, HOU, MEM, SA), Northwest (DEN, MIN, OKC, POR, UTA), Pacific (GS, LAC, LAL, PHX, SAC), Atlantic (BOS, NJN, NY, PHI, TOR), Central (CHI, CLE, DET, IND, MIL) e Southeast (ATL, CHA, MIA, ORL, WAS). Cada divisão soma 40 vitórias no registro publicado.

A reconstrução contém 1.230 partidas sintéticas, 170 dias e 85 rodadas. Ela reconcilia os agregados observados de campanha, mandos, conferência/divisão e pontuação; datas, confrontos, vencedores e placares não são apresentados como resultados históricos jogo a jogo. A ordem final observada permanece preservada.

## Temporada 06 — 2010–11

A temporada 06 usa as divisões de 2010–11: Southwest (DAL, HOU, MEM, NO, SA), Northwest (DEN, MIN, OKC, POR, UTA), Pacific (GS, LAC, LAL, PHX, SAC), Atlantic (BOS, NJN, NY, PHI, TOR), Central (CHI, CLE, DET, IND, MIL) e Southeast (ATL, CHA, MIA, ORL, WAS). Os detalhes complementares foram publicados em 18/11/2026; os 30 splits casa/fora fecham com as campanhas gerais e cada divisão soma 40 vitórias.

A reconstrução contém 1.230 partidas sintéticas em 85 rodadas e usa as campanhas, mandos, registros de conferência/divisão e médias de pontos publicados. Datas, confrontos, vencedores e placares são sintéticos; não representam resultados históricos jogo a jogo. A ordem final observada é preservada.

## Temporada 08 — 2012–13 (liga local NBA 2K)

A temporada 08 usa as classificações e detalhes capturados da liga NBA 2K local: 30 equipes, campanhas, mandos, conferência/divisão e médias de pontos. As seis divisões de 2012–13 (incluindo Brooklyn Nets na Atlantic) somam 40 vitórias cada, e os registros casa/fora fecham com as campanhas totais.

A reconstrução contém 1.230 partidas sintéticas, em 170 dias e 85 rodadas. Ela é condicionada aos agregados locais; datas, confrontos, vencedores e placares não são apresentados como resultados históricos jogo a jogo nem como reprodução da temporada real da NBA. A classificação final observada é preservada.

## Temporada 09 — 2013–14 (MyNBA local)

A temporada 09 é carregada diretamente do snapshot `src/data/statistics/season-009/extras.json`, que contém os 30 registros de classificação e todos os campos coletivos necessários. Casa/fora fecha com W-L, conferência soma 390 vitórias em cada lado e cada uma das seis divisões soma 40 vitórias. A divisão Southwest usa New Orleans (código `NO`); a Atlantic inclui Brooklyn (`BKN`). O hash de entrada inclui o snapshot original e as regras versionadas, sem depender de conversão para um sidecar diferente.

A reconstrução contém 1.230 partidas sintéticas em 85 rodadas. Resultados, placares, datas e confrontos específicos não são alegados como históricos; a ordem final observada permanece preservada.

## Temporada 10 — 2014–15 (MyNBA local)

A temporada 10 usa diretamente `src/data/statistics/season-010/extras.json`. O snapshot contém os 30 registros coletivos; as campanhas casa/fora fecham com W-L, conferência soma 390 vitórias de cada lado e as divisões 2014–15 somam 40 vitórias cada, com Charlotte na Southeast e Brooklyn na Atlantic. O hash usa o Extra original e as regras versionadas.

A reconstrução contém 1.230 partidas sintéticas em 85 rodadas. Resultados, placares, datas e confrontos específicos não são alegados como históricos; a ordem final publicada permanece preservada.

## Temporada 12 — 2016–17 (MyNBA local)

A temporada 12 usa diretamente `src/data/statistics/season-012/extras.json`. Os 30 registros incluem campanhas, casa/fora, conferência/divisão e médias de pontos; os splits fecham com W-L, cada conferência soma 390 vitórias e cada divisão 40. O hash da reconstrução cobre o Extra auditado e as regras versionadas.

A reconstrução contém 1.230 partidas sintéticas em 85 rodadas. A classificação final observada é preservada; datas, confrontos, vencedores e placares são sintéticos e não representam os resultados históricos jogo a jogo.

## Temporada 11 — 2015–16 (MyNBA local)

A temporada 11 usa diretamente `src/data/statistics/season-011/extras.json`. As campanhas totais, casa/fora, conferência e pontuação são condicionadas aos valores observados. Há uma divergência que impede impor todas as linhas divisionais: os registros Southwest (DAL, HOU, MEM, NO, SA) somam 38 vitórias e 42 derrotas em 80 jogos-equipe, enquanto 40 partidas recíprocas exigem 40 vitórias e 40 derrotas. Não há evidência para identificar qual linha individual deve ser corrigida.

Por isso, os cinco registros divisionais originais permanecem intactos, mas os resultados divisionais da Southwest não são usados como restrições do solver. As outras cinco divisões continuam condicionadas integralmente. O relatório do artefato marca `coverage.division: false`; as demais coberturas (campanha, casa/fora, conferência, pontuação e classificação) são validadas. A interface exibe essa ressalva. A reconstrução contém 1.230 partidas sintéticas em 85 rodadas; seus resultados não são históricos jogo a jogo.

## Temporada 07 — 2011–12 (liga local NBA 2K)

A classificação e as campanhas são as capturadas no universo Grupo Bolão NBA 2K: 82 jogos por equipe. Não representam a NBA real de 2011–12, que teve 66 partidas por equipe após o lockout. A reconstrução usa divisões, campanhas, mandos, médias e 85 rodadas de calendário sintético; não afirma datas nem resultados históricos jogo a jogo.

Há uma divergência na fonte divisional de Indiana: `6-12` soma 18 jogos, enquanto as demais equipes da divisão registram 16 e a campanha de vitórias da divisão fecha em 40. Para impor um calendário recíproco de 16 jogos divisionais, a meta interna normaliza apenas IND de `6-12` para `6-10`, preservando as seis vitórias observadas. O valor original e o motivo constam em `rules/season-007.json`; os arquivos de classificação e detalhes da fonte não são alterados.

## Restrições verificadas

O validador independente recalcula jogos, W-L, aproveitamento, registros casa/fora, conferência/divisão, pontos feitos/sofridos e totais da liga; verifica participante distinto, equipe conhecida, vencedor/derrotado e placar recíprocos, médias arredondadas, proveniência, IDs e duplicatas, agenda/datas, limites de jogos por equipe/dia, contagem por par, mandos divisionais/interconferência, schedule plan, hash de entrada e cobertura/posição da classificação. Qualquer divergência produz `valid: false`; o comando de validação retorna código de saída diferente de zero.

O score não representa placares observados: PPG/PAPG só limitam totais de campanha dentro da precisão publicada, sem revelar pontos verdadeiros por partida. `GB` e a sequência final observada não são convertidos em resultados individuais. A chave de playoffs não participa da otimização e nenhum jogo de pós-temporada é gerado. A ordem de standings é preservada, não demonstrada por um algoritmo histórico de desempate.

A suavização de sequências é uma heurística determinística de busca local, não uma restrição dura nem garantia global de ótimo. No artefato entregue, a maior sequência observada é de seis resultados iguais e cinco mandos iguais. Outra seed pode gerar outra solução válida. O primeiro MILP sinaliza otimalidade de sua função de desempate; o MILP de scores é um problema de viabilidade, sem afirmar otimização de preferência de placar.

## Resultado do piloto

- Identificador: `lv-751d3c695b125c6e`.
- Seed: `stage-2-pilot-2026`; algoritmo: `liga-viva-milp-1.1.0`.
- Hash de entrada: `717959e3832cdc6e763e26c40ff6b13aa8b8f18027ced7976998a45b85f07830`.
- 30 equipes, 1.230 partidas em 170 dias; 1.230 vitórias e derrotas recalculadas.
- Os scores inteiros vão de 84 a 130 pontos por equipe/jogo; a maior margem é 40. Pontos feitos e sofridos totalizam 259.321 cada.
- As 30 médias PPG/PAPG recalculadas arredondam exatamente aos respectivos alvos originais; a validação independente passou sem erros.
- O MILP encontrou solução ótima para a função de desempate daquela seed. A validação atesta consistência com os agregados observados e as regras sintéticas, não autenticidade histórica.

## Comandos

```sh
npm run liga-viva:generate -- stage-2-pilot-2026
npm run liga-viva:generate-season -- season-003 season-003-stage-3-2026
npm run liga-viva:generate-season -- season-004 season-004-stage-4-2026
npm run liga-viva:generate-season -- season-005 season-005-stage-5-2026
npm run liga-viva:generate-season -- season-006 season-006-stage-6-2026
npm run liga-viva:generate-season -- season-007 season-007-stage-7-2026
npm run liga-viva:generate-season -- season-008 season-008-stage-8-2026
npm run liga-viva:generate-season -- season-009 season-009-stage-9-2026
npm run liga-viva:generate-season -- season-010 season-010-stage-10-2026
npm run liga-viva:generate-season -- season-011 season-011-stage-11-2026
npm run liga-viva:generate-season -- season-012 season-012-stage-12-2026
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-002-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-003-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-004-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-005-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-006-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-007-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-008-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-009-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-010-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-011-seed-pilot.json
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-012-seed-pilot.json
npm run liga-viva:test
npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --strict --skipLibCheck src/lib/liga-viva/types.ts src/lib/liga-viva/validate.ts src/lib/liga-viva/engine.ts scripts/liga-viva/pilot.ts scripts/liga-viva/cli.ts
```

A geração aceita uma seed e um caminho opcional para a S02: `node scripts/liga-viva/cli.ts generate <seed> <arquivo.json>`. Para outras temporadas habilitadas, use `node scripts/liga-viva/cli.ts generate-season <season-id> <seed> <arquivo.json>`. O validador escolhe a temporada pelo artefato: `node scripts/liga-viva/cli.ts validate <arquivo.json>`. Nenhum comando escreve nos arquivos históricos.

## Testes e próximos limites

Os testes automatizados exercitam geração real do piloto com placares, reprodução da seed, seleção por seed alternativa, entradas incompletas/incompatíveis, duplicidade, equipe ausente, reciprocidade, divergências de classificação/mando/conferência/divisão, outra regra de temporada, placar que contradiz o vencedor, médias impossíveis e impossibilidade matemática. A suíte existente do domínio de estatísticas também passou (135 testes), sem alteração no conteúdo do catálogo.

Antes de aplicar o núcleo a outras temporadas, ainda é preciso fornecer fontes/regras por edição, alinhamento de divisões confirmado, critérios de desempate e requisitos de cronologia mais fortes. Esta etapa não cobre seeding de playoffs, confrontos diretos observados, placares históricos, interface visual, crônicas ou simulação de playoffs.

## Diretriz para a próxima interface

Diretriz aprovada pelo usuário e aplicada à visualização em `src/components/sports/SyntheticSeason.tsx`: avançar uma rodada por vez, reunir várias partidas na mesma rodada, oferecer filtro por equipe e não oferecer filtro por conferência.

Para a apresentação do piloto, uma rodada agrupa dois dias consecutivos da agenda sintética (85 rodadas, normalmente 14–16 partidas). As datas permanecem visíveis em cada partida, mas não são a unidade de navegação e os agrupamentos não alegam equivalência com rodadas históricas. A classificação acumulada inclui todas as partidas até a rodada selecionada; o filtro de equipe limita a lista de jogos e destaca a equipe na tabela, sem excluir outros clubes da classificação. A aba, a rodada e a equipe selecionada são persistidas nos parâmetros `view`, `round` e `team` da URL.
