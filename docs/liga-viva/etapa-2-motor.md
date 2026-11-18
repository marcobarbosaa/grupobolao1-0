# Etapa 2 — Motor de reconstrução sintética

## Escopo e proveniência

O motor é um domínio isolado em `src/lib/liga-viva/`, sem integração com o catálogo de estatísticas individuais, sem edição das classificações observadas e sem alterações aos dados de playoffs. O piloto usa apenas `season-002` (rótulo 2006–07), os dados de classificação em `src/data/statistics/season-extras.json` e os detalhes em `src/data/statistics/season-002/standings-details.json`.

Cada partida gerada recebe `provenance: synthetic-constrained`. Ela não é um resultado histórico. O arquivo persistido fica no catálogo próprio `src/data/liga-viva/reconstructions/`, com seed, versão do algoritmo e regras, instante de geração, hash SHA-256 das três entradas (classificação, detalhes e regras), agenda, resultados e validação.

## Arquitetura

- `src/lib/liga-viva/types.ts`: contratos da temporada, regras, partidas, classificação reconstruída e artefato persistido.
- `src/lib/liga-viva/engine.ts`: validação de entrada, otimização do calendário par-a-par, atribuição exata de resultados e datas determinísticas.
- `src/lib/liga-viva/validate.ts`: validação independente que recalcula registros e confrontos a partir das partidas, sem reutilizar a solução do gerador.
- `scripts/liga-viva/pilot.ts`: normaliza os arquivos legados de `season-002` e calcula seu hash de entrada; não os escreve.
- `scripts/liga-viva/cli.ts`: geração/persistência e validação somente leitura do artefato.
- `src/data/liga-viva/rules/season-002.json`: regra sintética versionada do piloto.
- `src/data/liga-viva/reconstructions/season-002-seed-pilot.json`: reconstrução do piloto entregue.

## Algoritmo

O motor usa `glpk.js`/GLPK como solver de programação linear inteira mista (MILP). A seed alimenta um PRNG versionado para ordenar confrontos e fornecer coeficientes determinísticos de desempate. Os registros observados são igualdades rígidas; se o solver não encontrar solução, o motor falha e não corrige a tabela depois.

A agenda par-a-par do piloto é definida por estas regras configuradas:

- Cada equipe joga quatro partidas contra cada uma das quatro equipes de sua divisão sintética: 16 jogos, dois mandos para cada lado do par.
- Contra os dez adversários não divisionais da mesma conferência, cada par joga três partidas mais uma partida opcional. Cada equipe recebe seis partidas extras ao todo; o MILP escolhe os pares extras e distribui mandos para atingir 18 jogos em casa nesse grupo.
- Contra cada adversário da outra conferência são duas partidas, uma em cada mando.
- Assim, cada equipe totaliza 16 + 36 + 30 = 82 jogos, 52 de conferência e 41 em casa/41 fora.

Para cada jogo `g`, uma variável binária representa se o mandante venceu. As equações por equipe fixam vitórias totais, vitórias em casa, vitórias de conferência e vitórias divisionais. Cada jogo dá a vitória a exatamente um participante; derrotas, reciprocidade e demais registros são consequência e são recalculados pelo validador. W-L, casa/fora e alvos de conferência/divisão também são verificados antes de chamar o solver.

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

## Restrições verificadas

O validador independente recalcula jogos, W-L, aproveitamento, registros casa/fora, conferência/divisão e totais da liga; verifica participante distinto, equipe conhecida, vencedor/derrotado recíprocos, procedência, IDs e duplicatas, agenda/datas, limites de jogos por equipe/dia, contagem por par, mandos divisionais/interconferência, schedule plan, hash de entrada e cobertura/posição da classificação. Qualquer divergência produz `valid: false`; o comando de validação retorna código de saída diferente de zero.

Não há placares, portanto PPG/PAPG/diferencial não são reconstruídos. `GB` e a sequência final observada não são convertidos em resultados individuais. A chave de playoffs não participa da otimização e nenhum jogo de pós-temporada é gerado. A ordem de standings é preservada, não demonstrada por um algoritmo histórico de desempate.

A suavização de sequências é uma heurística determinística de busca local, não uma restrição dura nem garantia global de ótimo. No artefato entregue, a maior sequência observada é de seis resultados iguais e cinco mandos iguais. Outra seed pode gerar outra solução válida. O GLPK sinaliza se o MILP chegou ao ótimo; uma solução viável não ótima continua sujeita a todas as igualdades e validação independente.

## Resultado do piloto

- Identificador: `lv-2cb1fc1d7dfeacd1`.
- Seed: `stage-2-pilot-2026`; algoritmo: `liga-viva-milp-1.0.0`.
- Hash de entrada: `0364361e669ba7bf08df334eb8939da4fcc065db32858517c38e037877675c1f`.
- 30 equipes, 1.230 partidas em 170 dias; 1.230 vitórias e 1.230 derrotas recalculadas.
- Todas as campanhas, mandos, registros de conferência/divisão, contagens par-a-par e posições observadas foram validados; erros: zero.
- O MILP encontrou solução ótima para a função de desempate daquela seed. A validação atesta consistência com os agregados observados e as regras sintéticas, não autenticidade histórica.

## Comandos

```sh
npm run liga-viva:generate -- stage-2-pilot-2026
npm run liga-viva:validate -- src/data/liga-viva/reconstructions/season-002-seed-pilot.json
npm run liga-viva:test
npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --strict --skipLibCheck src/lib/liga-viva/types.ts src/lib/liga-viva/validate.ts src/lib/liga-viva/engine.ts scripts/liga-viva/pilot.ts scripts/liga-viva/cli.ts
```

A geração aceita uma seed e um caminho opcional: `node scripts/liga-viva/cli.ts generate <seed> <arquivo.json>`. O validador aceita o caminho do artefato: `node scripts/liga-viva/cli.ts validate <arquivo.json>`. Nenhum comando escreve nos arquivos históricos.

## Testes e próximos limites

Os oito testes automatizados exercitam geração real do piloto, reprodução da seed, seleção por seed alternativa, entradas incompletas/incompatíveis, duplicidade, equipe ausente, reciprocidade, divergências de classificação/mando/conferência/divisão, outra regra de temporada e impossibilidade matemática. A suíte existente do domínio de estatísticas também passou (135 testes), sem alteração no conteúdo do catálogo.

Antes de aplicar o núcleo a outras temporadas, ainda é preciso fornecer fontes/regras por edição, alinhamento de divisões confirmado, critérios de desempate e requisitos de cronologia mais fortes. Esta etapa não cobre seeding de playoffs, confrontos diretos observados, placares, interface visual, crônicas ou simulação de playoffs.
