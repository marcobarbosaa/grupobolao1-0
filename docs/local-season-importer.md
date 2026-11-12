# Importador local de temporadas

## Iniciar no Windows

No terminal PowerShell do VS Code, na raiz deste repositório, use Node.js 24:

```powershell
npm ci
npm run stats:import:local
```

Abra **http://127.0.0.1:5179/__bolao/importador** no Chrome ou Edge. Cole o código de sessão exibido no terminal. Mantenha o terminal aberto; `Ctrl+C` encerra o serviço. A sessão expira em oito horas e um novo início gera outro código. Não há necessidade de iniciar `npm run dev` junto.

O processo Node inicia uma entrada React isolada usando o Vite do mesmo projeto. A rota não integra o roteador TanStack, nem a configuração de produção, nem o menu público. O comando normal de desenvolvimento também não registra as APIs administrativas. Nenhum arquivo ou segredo administrativo é importado pelo Worker Cloudflare.

## Importar e conferir

1. Arraste uma única pasta, por exemplo `Temporada 2008-2009`, ou use **Selecionar pasta**. As imagens devem ficar em subpastas de jogadores ou `Extras`; subdiretórios internos são preservados.
2. Confira a identificação `season-004`, edição 04, anos 2008/09, e clique em **Confirmar temporada**. A sequência começa em 2005/06 = edição 01. Um nome não reconhecido exige informar os anos; metadados existentes são reaproveitados e não sobrescritos.
3. A leitura é sequencial e informa progresso, imagens rejeitadas e duplicatas. Pode ser cancelada. Para continuar, retome o lote e selecione a mesma pasta; os arquivos já recebidos são comparados por SHA-256. Um arquivo alterado exige outro lote.
4. Escolha um arquivo na faixa de revisão. O original fica à esquerda e os campos à direita. Clique na imagem para abri-la em tamanho original. A seleção de fase é obrigatória; ausência de prints nunca implica eliminação.
5. Preencha apenas valores visíveis. Campos vazios permanecem ausentes. As abas separam totais, médias e percentuais; os percentuais individuais usam **0 a 100**. `quarterfinals` corresponde a **Conference Semifinals** no contrato existente.
6. Use **Salvar pendente** para continuar depois, ou **Conferi este print · salvar** após conferir. Um indicador mostra alterações não salvas. A navegação de arquivos e a publicação ficam bloqueadas enquanto houver alterações não salvas. Fechar a aba com alterações pendentes exibe o aviso do navegador.
7. Uma pasta desconhecida exige selecionar um jogador cadastrado. Não são criados jogadores. Correspondências recorrentes podem ser aprovadas no painel de aliases, com responsável declarado; passam a valer nas próximas leituras. `Marco`, por exemplo, pode precisar ser associado ao nome cadastrado `Marco Barbosa`.
8. Para deixar um arquivo fora do lote, informe um motivo e salve. O motivo fica nas notas do candidato. O filtro **Somente pendentes** facilita a revisão.

O trabalho salvo fica em `artifacts/statistics-imports/local/`, ignorado pelo Git. A lista **Retomar revisão** permite reabrir lotes após fechar a interface ou reiniciar o serviço. Faça backup dessa área caso queira preservar os prints privados em outra máquina. Os originais selecionados não são modificados; uma cópia privada com nome UUID é usada para conferir hashes.

## OCR: capacidade real e limites

O processamento não usa serviço remoto. Tesseract é **opcional** e deve ser instalado explicitamente pelo administrador, junto com `eng.traineddata`, antes de iniciar o importador. Não há instalação ou download automático de linguagem/modelo durante a importação.

Exemplo após instalar o executável e a linguagem:

```powershell
$env:BOLAO_TESSERACT = 'C:\Program Files\Tesseract-OCR\tesseract.exe'
& $env:BOLAO_TESSERACT --list-langs
npm run stats:import:local
```

O caminho precisa ser absoluto. O serviço chama o executável com argumentos fixos, sem shell, usando `eng`, `--psm 6` e TSV. O texto é agrupado por página/bloco/parágrafo/linha do TSV e a confiança média das palavras é exibida. A leitura tem timeout de 60 segundos e limites de saída; cancelar interrompe o subprocesso.

Funcionam no interpretador:

- Cabeçalhos explícitos de temporada regular, playoffs consolidado e quatro rodadas.
- Identificação textual de nome cadastrado e anos; divergências com a pasta geram avisos.
- Distinção explícita entre `TOTALS` e `AVERAGES`.
- Linhas simples como `PTS 27.40` e uma linha numérica única imediatamente abaixo de cabeçalhos reconhecidos.
- Pré-processamento opcional de uma região de interesse: recorte percentual, cinza, contraste e escala limitada. Ele produz outra imagem privada, sem substituir a fonte aprovada.

Não há modelo calibrado para todos os layouts do NBA 2K26. Várias linhas, abreviações sem contexto, números ausentes e fases ambíguas não são resolvidos por suposição. A associação automática de equipe não é confiável nesta versão; use o escopo/equipe nos campos avançados e os IDs existentes. OCR de Extras fornece texto e sinaliza o tipo de tela; **a transcrição estruturada de classificações e séries é manual nesta versão**. Não há reconhecimento automático confiável de chaveamentos por posição visual. Mesmo uma leitura de alta confiança exige conferência humana. A confiança não é uma garantia de precisão de cada campo.

Sem Tesseract, o fluxo completo de transcrição, revisão e publicação continua funcionando. Os testes de OCR usam texto/TSV sintéticos; screenshots reais do jogo ainda precisam de avaliação operacional. Consulte a [instalação oficial](https://tesseract-ocr.github.io/tessdoc/Installation.html) e o [formato TSV](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html).

## Extras e escudos

Na revisão de Extras, adicione equipes na conferência correspondente e transcreva as posições mostradas pelo jogo. Não existe ordenação por número de vitórias. Aproveitamento coletivo usa **fração de 0 a 1**, compatível com o arquivo histórico; campanhas casa/fora/conferência/divisão usam `V-D`.

Adicione somente séries com resultado concluído, usando os códigos das equipes, rodada, conferência, vitórias e vencedor. A NBA Finals usa conferência `finals`. Dados coletivos parciais são aceitos; ausência de uma rodada não produz confrontos fictícios. Validações bloqueiam equipes/posições repetidas, resultados incompatíveis, progressão de perdedores, campeão divergente e participantes incompatíveis com a classificação conhecida. Conferências parciais não permitem verificar todos os classificados ausentes.

Extras entram como `season-extras` no mesmo lote, gerando registros `extras`, fontes, revisões e recibo no mesmo snapshot transacional dos dados individuais. Correções preservam versões anteriores. Os arquivos `season-extras.json`, fontes históricas e detalhes das temporadas 01–03 continuam intactos. Alterações nesses Extras antigos são bloqueadas pela interface e exigem migração específica revisada; este fluxo atende às novas temporadas e suas revisões.

As tabelas e o chaveamento horizontal existentes são reutilizados. Os escudos históricos antigos são preservados. Para temporadas novas, não se presume que o escudo antigo ainda seja correto: há fallback de sigla até uma definição aprovada. É possível incluir no campo avançado `extras.logos` um mapeamento `CODIGO: { "year": ANO_DO_ESCUDO, "slug": "identidade-da-franquia" }`, validado junto ao lote. O endereço usa o mesmo provedor fixo do componente existente; nenhum URL arbitrário é aceito. Essa configuração não exige alteração de React.

## Aprovar, simular e publicar

1. Salve a conferência de todos os arquivos incluídos e confirme a temporada.
2. Clique em **Gerar relatório e validar**. O adaptador combina prints complementares do mesmo jogador/fase/escopo. Valores conflitantes bloqueiam o lote; os consolidados de playoffs nunca são distribuídos entre rodadas.
3. Examine registros normalizados, fontes verificadas, metadados, alterações, conflitos e hash da revisão. Os relatórios JSON e Markdown também ficam no diretório privado do lote.
4. Informe o responsável, marque a aprovação explícita e, quando aplicável, aceite separadamente as correções. Clique em **Aprovar revisão**. Isso gera uma autorização separada vinculada ao candidato, base, fontes e revisão.
5. Execute **dry-run** e confira os arquivos propostos.
6. Clique em **Publicar localmente**. O servidor refaz as verificações e chama o publicador existente. A geração é preparada, validada, instalada e passa a ser visível pela troca atômica do manifest. Uma validação final confirma a base.

Editar qualquer informação invalida a autorização local. Alterar candidato, fonte ou base depois da aprovação também impede publicar. Para corrigir um registro existente, informe a revisão vigente e o motivo; o candidato deve conter **todos** os campos que devem permanecer, pois correções são versões completas, não patches. Para importar somente parte da temporada, exclua os arquivos ainda não revisados com motivo e publique outro lote depois. Lotes publicados não são editados.

Cada lote mantém `batch-N.json`, `review-UUID/`, `authorization-UUID.json`, `draft.json`, imagens e logs privados. O limite do JSON candidato continua em 2 MiB; se o relatório apontar excesso, divida a importação em lotes. Máximos padrão: 500 arquivos, 25 MiB por imagem, 1 GiB por lote, 32 megapixels e 12 níveis de diretórios. Os limites são centralizados em `src/lib/statistics/local-import.ts`; ajustes precisam continuar compatíveis com os contratos do publicador.

## Atualizar o site e preparar GitHub

Após uma publicação real aprovada:

```powershell
npm run stats:validate
npm run stats:typecheck
npm run stats:test
npx tsc --noEmit
npm run build
git status --short
git diff -- src/data/statistics/manifest.json
```

O catálogo público lê exclusivamente os arquivos referenciados pelo manifest, seleciona revisões vigentes e descobre temporadas. Um glob literal eager do Vite inclui gerações novas no build; a área `staging` é excluída. Seletores da página de temporadas, perfis e home usam o catálogo. Não é preciso acrescentar `season-004` nos componentes.

Revise os JSON da geração `src/data/statistics/import-HASH/`, seu `receipt.json` e o manifest. Esses são os artefatos oficiais a versionar. Nunca adicione a pasta privada de imagens/revisão. O importador não executa Git, commit, push, merge ou deploy. Faça essas operações separadamente após conferir o diff. Para esta implementação, sugestão de commit: `feat(statistics): add local season importer with reviewed publication`.

## Segurança e recuperação

O servidor escuta apenas em `127.0.0.1:5179`, exige Host e Origin exatos, rejeita solicitações cross-site e exige o código de sessão em todas as APIs. Não aceita caminhos absolutos do navegador nem comandos. As imagens chegam como bytes autorizados pelo seletor do navegador; nomes relativos servem como procedência, nunca como destinos de escrita. Symlinks/junctions na área privada são recusados. A API serializa mutações, usa revisão otimista para evitar sobrescrita por outra aba e mantém JSON local por rename atômico.

O navegador decodifica cada imagem, e navegador/servidor inspecionam tipo e dimensões antes do processamento. O servidor reaproveita também a conferência de fontes do publicador. A inspeção de cabeçalhos do Node não substitui um decodificador completo. Não há leitura recursiva arbitrária do computador: o navegador entrega somente arquivos escolhidos. Links de diretórios não são seguidos por uma rotina Node de varredura.

Imagens não são copiadas para `public/`; a configuração do Vite local nega acesso direto à área privada. O original é servido somente por chamada autenticada e uma URL de objeto no navegador. Autorização de sessão protege o serviço HTTP; `approvedBy` continua sendo uma declaração de revisão humana, não uma identidade criptograficamente comprovada.

Se houver falha antes da troca do manifest, a base anterior permanece válida. Se a troca já aconteceu, o resultado informa `committed: true`; não repita cegamente. Inspecione o manifest e o recibo e execute `stats:validate`. Uma falha posterior ao commit pode exigir conferir o estado do rascunho local. Locks de processo interrompido são recuperados pelo comando existente, **depois de confirmar que o processo terminou**:

```powershell
npm run stats:import:recover -- --root src/data/statistics --token TOKEN_DO_JOURNAL --confirm-recovery
```

Não remova o lock manualmente nem sobrescreva gerações. Consulte [o guia do pipeline](statistics-import-guide.md) para as garantias e limitações de rename/flush no filesystem local.

## Auditoria e verificações da implementação

Pontos de integração examinados: documentação de fundação/importação, schemas, normalização, revisão, publicação, persistência, manifest, componentes de estatísticas/Extras, página de temporadas, home e testes. O [PR #15](https://github.com/marcobarbosaa/grupobolao1-0/pull/15) orienta a preservação dos escudos históricos.

Arquivos principais:

- `scripts/statistics/local/`: servidor exclusivamente local, autorização HTTP, armazenamento privado, OCR e adaptação ao pipeline.
- `src/admin/`: entrada React, seleção recursiva de diretórios, editor de Extras e estilos.
- `src/lib/statistics/local-import.ts`, `image-header.ts`, `extras.ts`: composição, limites e contratos.
- `src/lib/statistics/catalog.ts` e `src/lib/published-catalog.ts`: catálogo validado e inclusão pelo Vite.
- Schemas, contratos, validador, import-validation e persistence existentes: extensão para Extras versionados.
- `PublishedStatistics`, `SeasonExtras`, `CinematicHome` e rota `temporadas`: consumo do catálogo.
- `tests/statistics/local-import.test.mjs`: fixtures isoladas, segurança, OCR textual, publicação, revisões, falhas e catálogo.
- `tests/importer.browser.mjs`: Edge/Playwright, usando base temporária; nunca publica na base real.

O teste de navegador usa Playwright instalado explicitamente no ambiente de QA, sem adicioná-lo como dependência de produção. Para executá-lo, disponibilize o módulo `playwright` ou indique seu `index.mjs` em `PLAYWRIGHT_MODULE`; usa Edge por padrão. `BROWSER_CHANNEL` permite escolher outro canal instalado.

Referências de implementação: [leitura recursiva de diretórios no Chromium](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries), que exige repetir `readEntries()` além dos primeiros 100 itens; [glob eager no Vite](https://vite.dev/guide/features#glob-import).
