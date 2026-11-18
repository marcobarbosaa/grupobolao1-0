# Regras e restrições para reconstrução

## Restrições algébricas observadas

Para equipe `t`, temporada `s`, jogos disputados `G(t,s) = W(t,s) + L(t,s)`. O aproveitamento exibido é `W/G` (preservar precisão de exibição do dado original). Nas edições com 30 equipes de 82 jogos, a soma da liga deve ser `ΣW = ΣL = 1.230`, pois cada partida contribui com uma vitória e uma derrota.

Para 002–005, o registro casa e fora precisa fechar:

```text
W = W_casa + W_fora       L = L_casa + L_fora
G = W + L = 82
G_conferência = W_conf + L_conf = 52
G_divisão = W_div + L_div = 16
```

Exemplo verificado: `season-002`, PHX: 63–19; casa 32–9; fora 31–10; conferência 39–13; divisão 11–5. Os registros casa/fora fecham; conferência e divisão totalizam 52 e 16 jogos. `streak` é somente a sequência final registrada, não a sequência cronológica completa.

Para qualquer partida reconstruída `g=(casa, visitante, vencedor)`, o resultado deve atualizar exatamente um W e um L, respeitar o mando e incrementar os contadores de conferência/divisão conforme a filiação **daquela edição**. H2H deve ser recíproco: cada vitória de A sobre B é uma derrota de B para A. A soma de jogos de cada equipe precisa coincidir com o alvo da temporada, sem duplicação ou autopartida.

## Playoffs

`season-extras.json` armazena séries, conferência/rodada, equipes, vitórias na série, vencedor e campeão. Para cada série, vencedor precisa ser participante e ter mais vitórias do que o adversário; toda rodada subsequente deve avançar os vencedores anteriores; final da NBA e campeão devem concordar. Os dados verificados passam por essas verificações básicas. Eles **não** especificam as datas, os placares, a sequência de mandos dos jogos nem a ordem real das partidas da série.

Não deduzir desempates ou seeding apenas da posição. As edições 2006–07 a 2009–10 são rótulos NBA, mas as descrições apontam ordenação conforme NBA 2K. A regra NBA real dava aos campeões de divisão uma vaga entre os quatro primeiros seeds até 2014–15; a alteração para ordenar os oito por campanha entrou em vigor em 2015–16 ([NBA Communications, 2015](https://pr.nba.com/nba-playoff-seeding-changes)). Isso deve ser tratado como regra histórica contextual, não presumido como regra da liga local sem comprovação.

## Calendário e épocas

Não há calendário recuperável nos arquivos atuais: `manifest.games` é vazio e não há agenda por equipe. Os rótulos 2005–06 a 2012–13 não bastam para preencher jogos. A NBA alterou a duração em situações extraordinárias; 2011–12 teve 66 partidas por equipe, não 82 ([NBA Communications](https://pr.nba.com/nba-2011-12-game-broadcast-schedules/)). Também variaram franquias e alinhamentos de conferência/divisão ao longo da história. Esta coleção cobre 30 equipes por edição, então não representa épocas antigas pré-expansão.

## Validações que o futuro sistema deve exigir

1. Validar total de partidas por temporada e por equipe com a regra/fontes daquela edição, não com um valor global fixo.
2. Validar cada equipe contra seus totais casa/fora e conferência/divisão quando presentes.
3. Validar totais da liga, reciprocidade H2H, ausência de duplicatas, mandante/visitante e associação de equipes ativas à edição.
4. Validar standings, seed, desempates e classificados conforme regra versionada da temporada.
5. Validar passagem de vencedores e campeão na chave de playoffs.
6. Manter procedência e precisão: valores observados, derivados e desconhecidos devem ser distintos. Não converter `—`, `L2`, strings `W-L` ou números arredondados em resultados de partida sem guardar o valor de origem.

## Fontes externas de contexto

- NBA 2011–12: [calendário oficial de 66 jogos](https://pr.nba.com/nba-2011-12-game-broadcast-schedules/).
- NBA 2015–16: [mudança de critério de seeding](https://pr.nba.com/nba-playoff-seeding-changes).

Essas fontes contextualizam a NBA real; não provam que os números locais sejam resultados NBA reais.
