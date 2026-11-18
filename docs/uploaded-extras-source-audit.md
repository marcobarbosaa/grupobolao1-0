# Fonte recebida — classificações de quatro temporadas

Os quatro arquivos ZIP enviados pelo usuário foram abertos e as imagens verificadas quanto à integridade. Inventário e hashes SHA-256 foram registrados em `src/data/statistics/uploaded-extras-source-inventory.json`.

## Temporadas incluídas
- 2010–2011 (5 capturas)
- 2011–2012 (5 capturas)
- 2012–2013 (5 capturas)
- 2015–2016 (5 capturas)

Cada ZIP contém 4 capturas de classificações (com sobreposição de ranks 7–9 entre as capturas superior/inferior) e 1 chave de playoffs.

## Status de importação
Este commit registra e valida a fonte enviada, não a transcrição numérica completa. A leitura automática (OCR) produziu erros em vários valores de campanha, PPG, PAPG, diferença e sequência; por isso, os números não foram publicados como dados ativos. A importação numérica deve ser concluída com conferência visual linha a linha antes de ativar esses dados na tela.


## Correção dos nomes das fontes (confirmada pelo usuário)

O usuário confirmou que os ZIPs chamados `Temporada 2010-2011.zip` e `Temporada 2011-2012.zip` foram nomeados invertidos. Portanto:

- ZIP `Temporada 2010-2011.zip` contém a classificação da temporada interna **2011–12** (`season-007`). A campanha do Chicago Bulls (65–17) e do Dallas Mavericks (61–21) confirmou a correspondência.
- ZIP `Temporada 2011-2012.zip` contém a classificação da temporada interna **2010–11** (`season-006`). A campanha do Philadelphia 76ers (54–28), Dallas (59–23) e Bulls (48–34) confirmou a correspondência.
- Os ZIPs 2012–13 e 2015–16 permanecem associados aos seus respectivos anos.

O inventário foi corrigido para registrar a correspondência correta. Esta atualização resolve a divergência de identificação, mas a transcrição numérica das colunas complementares ainda está em andamento.



## Retificação da remessa recebida em 18/11/2026

Os três ZIPs anexados nesta execução foram verificados pelo conteúdo visual e pelos hashes reais dos cinco arquivos de cada pasta `Extras`. Nesta remessa, os nomes dos arquivos correspondem aos anos solicitados:

- `Temporada 2010-2011(1).zip`: campanha do Philadelphia 76ers 54–28 e Dallas Mavericks 59–23; fontes associadas a `season-006`.
- `Temporada 2011-2012(1).zip`: campanha do Chicago Bulls 65–17 e Dallas Mavericks 61–21; fontes associadas a `season-007`.
- `Temporada 2015-2016(1).zip`: classificação das duas conferências e chave terminando em Toronto 4–3 Dallas; fontes associadas a `season-011`.

A associação anterior dos dois primeiros ZIPs estava invertida em relação a estes nomes recebidos. O inventário de fontes foi alinhado aos conteúdos verificados nesta remessa, preservando os arquivos de 2012–13 e 2015–16.
