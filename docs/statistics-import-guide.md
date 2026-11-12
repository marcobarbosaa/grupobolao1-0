# Importação revisada — Entrega 03

Este guia descreve o pipeline CLI de preparação, revisão, aprovação e publicação. O repositório também possui uma interface local para selecionar pastas, fazer revisão manual e usar OCR Tesseract opcional; para o fluxo operacional pela interface, consulte [Importador local de temporadas](local-season-importer.md). As limitações abaixo sobre OCR e upload referem-se ao pipeline CLI, não à interface local.

## Escopo e auditoria

Base: main f129e01, que contém as Entregas 01/02 e a correção do workflow estatístico. Antes da implementação, os 89 testes existentes e o manifest vazio passaram. O pipeline reutiliza os schemas aprovados, validateDataset, validateAppendOnly, seleção de revisões e motor matemático. Não modifica fórmulas, cadastro, frontend ou dados públicos.

Node 24 é o ambiente suportado. Não há dependências novas, OCR, upload, banco, credenciais ou comandos Git automáticos no importador.

## Fluxo operacional em português

1. O usuário envia prints. A transcrição acontece externamente, nesta conversa, com conferência humana.
2. Guardar os arquivos originais em diretório privado autorizado. Recomenda-se artifacts/statistics-imports/inbox, ignorado pelo Git. Nunca copiar imagens automaticamente para public/.
3. Calcular SHA-256 dos bytes originais, por exemplo com Get-FileHash -Algorithm SHA256 -LiteralPath no PowerShell. Usar o hash hexadecimal em minúsculas.
4. Montar batch.json com identidades explícitas, contexto de tela, valores transcritos e dúvidas. Os arquivos completos usados como exemplos sintéticos estão em tests/statistics/import-fixtures.mjs; não são estatísticas oficiais.
5. Executar prepare. Conferir review.json e review.md. Corrigir pendências no candidato e repetir em outro diretório de saída.
6. Executar review imediatamente antes da decisão humana. Essa etapa recalcula o relatório contra a base atual e verifica novamente os originais; não confia em um relatório editável salvo anteriormente.
7. Apresentar ao usuário os registros, valores, fontes, metadados novos e correções. Aguardar aprovação explícita nesta conversa.
8. Somente depois dessa aprovação, executar approve informando o hash da revisão, aprovador declarado, instante, IDs exatos dos itens e IDs das correções aceitas.
9. Executar publish em dry-run e conferir a lista de alterações. Nada é escrito na base.
10. Executar publish --write, validar novamente contra o snapshot anterior e revisar o diff. Criar commit e PR somente dos JSON aprovados e do recibo de publicação.

O pipeline não registra uma conversa automaticamente e não prova a identidade de quem executa approve. A declaração operacional deve corresponder à aprovação humana real; sua rastreabilidade depende do processo de revisão e do histórico Git.

## Comandos

Os caminhos raiz são escolhidos pelo operador. Os nomes dentro do lote são sempre relativos ao input-root, sem traversal.

```powershell
npm run stats:import:prepare -- --input-root artifacts/statistics-imports/inbox --batch batch.json --out artifacts/statistics-imports/review-01
npm run stats:import:review -- --input-root artifacts/statistics-imports/inbox --batch batch.json --out artifacts/statistics-imports/review-02
```

Os diretórios pais de saída devem existir. Cada saída deve ser um diretório novo, fora da base publicada. prepare e review compartilham a validação determinística: prepare serve para organizar a proposta inicial; review refaz a conferência antes da decisão.

Após a aprovação explícita, substituir os placeholders:

```powershell
npm run stats:import:approve -- --input-root artifacts/statistics-imports/inbox --batch batch.json --out artifacts/statistics-imports/inbox/approval-01 --confirm-reviewed --review-hash HASH_DO_RELATORIO --approver NOME_DECLARADO --approved-at INSTANTE_ISO_COM_OFFSET --records item-a,item-b
npm run stats:import:publish -- --input-root artifacts/statistics-imports/inbox --batch batch.json --authorization approval-01/authorization.json --dry-run
npm run stats:import:publish -- --input-root artifacts/statistics-imports/inbox --batch batch.json --authorization approval-01/authorization.json --write
npm run stats:validate
```

Para correções, acrescentar `--corrections item-a` na autorização. A lista precisa corresponder exatamente às correções propostas. A aprovação cobre o lote inteiro: para aprovar somente parte, criar outro lote e refazer a revisão. Os IDs dos itens autorizam seus registros e o hash vincula também todas as fontes e entidades auxiliares propostas.

`--root DIRETORIO` altera a base estatística, cujo padrão é src/data/statistics. `--aliases aliases.json` seleciona um cadastro de aliases previamente autorizado, separado do candidato; usar o mesmo argumento em todas as etapas.

Publicação sem --write é dry-run. Códigos: 0 sucesso, 1 pendência/erro de dados ou I/O, 2 erro de argumentos. Nenhum comando faz commit, push ou merge.

## Formato do lote

Objeto strict com:

- schemaVersion: "1.0", id (slug até 40 caracteres), receivedAt (ISO com offset).
- sources: lista de { source, path }. source reutiliza ImportSource: id, kind="screenshot", fileName descritivo, contentHash SHA-256, receivedAt, capturedAt opcional, metadata. path identifica o arquivo local autorizado; fileName nunca é usado para abrir arquivos.
- entities: teams, seasons e games opcionais, cada qual uma lista de { value, sourceIds }. value usa exatamente o schema da Entrega 01.
- items: de 1 a 1.000 candidatos.
- decimalSeparator opcional "." ou ","; notes opcionais.

Cada item tem id (slug até 40 caracteres), kind, sourceIds e os campos pertinentes:

| kind           | Contexto necessário para publicação                                                          |
| -------------- | -------------------------------------------------------------------------------------------- |
| season-summary | player, seasonId, phaseId=regular, scope, availability, values; teamId somente em scope=team |
| phase-summary  | Mesmo contrato, com fase explicitamente configurada na temporada                             |
| game-box-score | player, seasonId, phaseId, gameId e teamId; availability e values                            |
| award          | seasonId, player e/ou teamId, award={type,label}                                             |
| team-history   | player, seasonId, teamId, history com datas opcionais                                        |

recordId é opcional para registros novos e permite indicar a identidade permanente existente. Quando omitido num registro novo, usa-se o id do item. Para uma identidade lógica existente, o pipeline reutiliza seu ID, sem criar um cadastro independente.

player aceita id permanente e/ou name. Se ambos forem informados, precisam concordar. Não há aproximação, remoção automática de acentos ou criação de atletas. Somente nomes exatos do cadastro ou aliases previamente autorizados são aceitos. Aliases contêm name, playerId, approvedBy e approvedAt; ambiguidades bloqueiam a importação mesmo com nomes semelhantes.

seasonId não depende das temporadas anteriores. Metadados de uma nova temporada podem acompanhar uma importação da edição 03 mesmo sem dados da edição 01. Não se deduz ano, datas ou resultados. Partidas exigem um ID explícito; confrontos repetidos não são vinculados apenas por data.

Dados candidatos podem omitir campos: ficam pendentes quando faltam identificadores indispensáveis. Valores estatísticos ausentes podem ser omitidos ou representados como null na transcrição. unrecognizedFields preserva campos não compreendidos e bloqueia a aprovação até sua resolução; notes registra contexto útil.

## Normalização

values é uma lista de { label, value }, onde value pode ser texto numérico, number finito ou null. Preferir texto para preservar zeros decimais exibidos. As observações originais permanecem no relatório; médias e percentuais recebem displayPrecision quando a transcrição textual informa a resolução.

Exemplo sintético:

```json
{
  "screen": "averages",
  "values": [
    { "label": "GP", "value": "82" },
    { "label": "PTS", "value": "27,40" },
    { "label": "AST", "value": null }
  ]
}
```

Isso significa gp=82 e ppg=27.4, com duas casas exibidas; não cria pontos totais nem assistências zero.

PTS/REB/AST/STL/BLK/TO/TOV/MIN dependem de screen="totals" ou "averages". GP e GS são contagens. FG%/3P%/FT% são percentuais de 0 a 100. Abreviações de arremessos e outras contagens exigem totals. Nomes canônicos como points, ppg e fgPct já declaram sua semântica.

Aceitam-se ponto ou vírgula decimal; agrupamento de milhares, notação científica, valores ilegíveis e símbolos indevidos são recusados. Um token como 1,234 exige decimalSeparator explícito, pois pode ser ambíguo. Conversões que perderiam dígitos significativos são recusadas. Nenhum valor é arredondado durante a normalização; limites IEEE-754 permanecem os do domínio.

Não se inventa cobertura. coverage opcional reutiliza o contrato da Entrega 02 e suas evidências precisam estar entre as fontes revisadas do registro.

## Revisão, duplicatas e conflitos

O relatório contém candidato original, fontes verificadas, mapeamento de fontes reutilizadas, registros novos/duplicados/correções, valores normalizados, campos explicitamente ausentes, conflitos e pendências. Os grupos completos de métricas não informados permanecem ausentes no objeto normalizado.

Validações:

1. Estrutura strict, identificadores e formatos.
2. Identidade exata e referências a equipes, temporadas, fases e jogos.
3. Contagens, percentuais, relações entre métricas e consistência pelo motor existente, com precisão documentada.
4. Identidade lógica, fontes repetidas, revisão anterior e retenção do histórico.

O mesmo SHA-256 reutiliza a fonte existente, mesmo quando o candidato usa outro ID. Um ID de fonte existente com outro hash é erro. Uma observação idêntica não cria versão independente; um lote sem alterações efetivas não é publicado.

Diferenças retornam campo, existingValue, candidateValue, itemId e recordId. Para uma correção, declarar correction={expectedRevision,reason}; a autorização ainda precisa aceitar esse item separadamente. A revisão vigente avança em uma unidade, com fonte e lote, mantendo a anterior.

Correções representam o registro substituto completo, não um patch implícito. Campos removidos aparecem como diferenças com candidateValue=null. Conferir também cobertura e precisão. Não se escolhe o maior valor nem o mais recente sem decisão.

Conflitos matemáticos remanescentes entre fontes completas bloqueiam a publicação; não basta autorizar uma correção que ainda produz contradições no conjunto. Warnings de inconsistência sem resolução decimal também exigem revisão.

## Autorização

O candidato não aceita approved nem campos de aprovação. A etapa approve gera arquivo separado com batchId, candidateHash, baselineHash, reviewHash, approvedBy, approvedAt, recordIds e correctionIds.

O hash da revisão inclui candidato, diagnóstico, metadados, normalização, aliases e fontes verificadas; o candidato também é vinculado pelos bytes exatos do JSON. A base é vinculada pelos hashes do manifest e de todos os arquivos que ele referencia. Alterar valores, notas, formatação do candidato, aliases, imagens ou base exige refazer a conferência e a aprovação.

A autorização não é assinatura de identidade. Alguém com acesso local pode declarar um aprovador; o sistema garante os vínculos de integridade e o procedimento explícito, não autenticação.

## Escrita e recuperação

O publicador gera um snapshot completo com todas as revisões, em diretório novo import-HASH. Uma geração contém os arrays JSON, manifest local e receipt.json com autorização, fontes e mudanças. O recibo também documenta a procedência de temporadas/equipes/jogos e históricos de transferência, cujos contratos atuais não possuem revisão própria.

Antes de gravar:

- Refaz leitura, verificação dos originais e revisão contra a base atual.
- Verifica autorização e append-only.
- Obtém lock exclusivo com journal.
- Prepara arquivos em .import-stage-TOKEN, faz flush e valida o snapshot escrito.
- Instala a geração inteira sem sobrescrever gerações anteriores.
- Reconfere a base e troca somente manifest.json por rename no mesmo filesystem.

Esse rename é o ponto de commit. Leitores veem o manifest antigo ou o novo; todos os arquivos referenciados por ambos permanecem disponíveis. Não há troca destrutiva de diretórios nem eliminação de versões. Uma falha antes do commit mantém a base anterior; uma falha posterior informa committed=true e orienta inspeção.

Interrupções podem deixar lock e staging. Não apagar o lock cegamente. Após confirmar que o processo terminou, ler o token do journal e executar:

```powershell
npm run stats:import:recover -- --root src/data/statistics --token TOKEN_DO_JOURNAL --confirm-recovery
```

A recuperação recusa processo ainda ativo, token divergente ou manifest fora dos estados antigo/novo. Remove apenas scratch da transação validada; mantém gerações, inclusive órfãs. Uma tentativa posterior pode reutilizar geração órfã somente se todos os arquivos coincidirem exatamente.

O mecanismo pressupõe filesystem local com rename atômico e um único escritor cooperante por lock. Não é uma transação distribuída; editores externos que ignorem o lock e falhas físicas de disco exigem cuidados operacionais. Flush de diretório depende do suporte do sistema operacional. Um journal truncado ou divergente exige inspeção manual, sem recuperação automática destrutiva.

## Segurança e limites

JSON de entrada: até 2 MiB. Originais: até 25 MiB por imagem. PNG/JPEG/WebP com extensão e estrutura de cabeçalho compatíveis; não há decodificação completa nem OCR. Snapshot gerado respeita o limite existente de 10 MiB por arquivo JSON. Lotes têm limites de itens, fontes, textos e valores.

Caminhos relativos aceitam apenas diretórios/nomes ASCII simples e extensões autorizadas; traversal, caminhos absolutos e symlinks externos são recusados. Arquivos precisam ser regulares. Conteúdo nunca vira shell, eval ou instrução executável. Relatórios exibem os dados em blocos JSON. Não são publicados arquivos binários.

A área de revisão e os originais devem permanecer privados, fora da base estatística. O pipeline não apaga imagens nem publica dados em GitHub automaticamente.

## Limitações e próxima entrega

Metadados existentes de equipes, temporadas, jogos e históricos são imutáveis neste pipeline: propostas idênticas são reconhecidas; mudanças exigem migração revisada específica. Isso evita inventar revisões para entidades cujos contratos não as possuem. Estatísticas e premiações suportam correções versionadas normalmente.

O pipeline não resolve automaticamente conflitos, não decide correspondências ambíguas, não produz dados oficiais e não introduz interface. A próxima entrega poderá operacionalizar transcrições reais aprovadas e ampliar versionamento de metadados, se necessário. O manifest desta implementação permanece vazio.
