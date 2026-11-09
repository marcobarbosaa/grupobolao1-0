# Persistência estatística v1.0

Este diretório começa sem temporadas, equipes ou estatísticas publicadas. O cadastro de jogadores vem exclusivamente de `src/lib/new-roster.ts`; não há arquivo players.json.

Cada referência do manifest aponta para **um array JSON** da categoria correspondente. Os diretórios são criados quando existir o primeiro registro aprovado, não por meio de temporadas ou arquivos vazios fictícios.

| Categoria   | Conteúdo                                | Organização sugerida          |
| ----------- | --------------------------------------- | ----------------------------- |
| seasons     | Season[]                                | seasons/<id>.json             |
| teams       | Team[]                                  | teams/registry.json           |
| teamHistory | PlayerTeamHistory[]                     | team-history/<season-id>.json |
| games       | Game[]                                  | games/<season-id>.json        |
| statistics  | (PlayerGameStats ou PlayerPhaseStats)[] | statistics/<season-id>.json   |
| awards      | Award[]                                 | awards/<season-id>.json       |
| sources     | ImportSource[]                          | audit/sources.json            |
| batches     | ImportBatch[]                           | audit/batches.json            |
| revisions   | DataRevision[]                          | audit/revisions.json          |

A ordem dos arquivos ou temporadas não tem significado. Todas as referências de um snapshot publicado precisam resolver; dados parciais significam campos desconhecidos omitidos, não referências quebradas.

## Publicação e correções

1. Registrar a evidência com ID estável e SHA-256 do conteúdo; `fileName` é metadado, não um caminho que o validador abre.
2. Revisar externamente. Lotes received/extracted/pending-review podem existir sem registros publicados.
3. Registrar o lote publicado com approvedAt, approvedBy e sourceIds.
4. Registrar cada versão estatística e sua DataRevision, ligada ao lote. As fontes da versão e da revisão devem coincidir e estar cobertas pelo lote.
5. Em correções, manter a versão anterior, incrementar revision em um, indicar supersedesRevision e reason. Nunca alterar a versão anterior em seu lugar.
6. Executar `npm run stats:validate`. Antes de publicar uma atualização, comparar também com um snapshot anterior confiável:

```sh
npm run stats:validate -- --previous-root /caminho/para/snapshot-anterior
```

`--root` e `--previous-root` são diretórios explicitamente escolhidos pelo operador. Os caminhos vindos do JSON permanecem confinados a cada raiz, incluindo resolução de links simbólicos. Não há acesso à rede, interpretação de código, upload ou escrita de registros pelo validador.

Sem um snapshot anterior, não é possível detectar que alguém reescreveu uma versão antiga mantendo seus mesmos IDs. A comparação append-only é obrigatória no procedimento de publicação de correções; esta entrega não cria o importador ou um serviço de escrita.

Erros mostram arquivo, índice e campo quando disponíveis. Código 0 significa válido; 1 indica dados inválidos; 2 indica uso inválido da CLI. Cada JSON tem limite de 10 MiB; coleções maiores podem ser divididas em vários arquivos.

O manifest aceita schemaVersion exatamente "1.0". generatedAt é opcional e não é inventado para o manifest vazio.
