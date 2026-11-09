A aplicação ainda mantém modelos e pontuações da geração anterior. Este PR adiciona uma fundação estatística isolada para a nova geração, sem migrar registros antigos ou modificar a interface.

Inclui contratos TypeScript derivados de Zod para identidades, temporadas, fases, partidas, consolidados, premiações, fontes, lotes e revisões. O manifest inicial está vazio. O cadastro atual é a única fonte de identidade dos 13 jogadores.

A CLI offline valida métricas, duplicatas, referências, fontes e aprovação, fases agregadas e continuidade de revisões. Rejeita escapes de diretório, incluindo symlinks. A opção --previous-root detecta alterações ou exclusões de versões aprovadas em comparação com uma base anterior.

Validação: 48 testes aprovados (16 existentes e 32 novos), dois typechecks, lint dos arquivos novos, validador do manifest e build cliente/SSR. O lint global foi executado: permanece em 9.063 erros e 1 aviso preexistentes, sem aumento por arquivo. Nenhuma regra foi desabilitada.

A comparação com main 1dce0e7 confirmou que frontend, cadastro, imagens, dados antigos e fórmulas não foram alterados. Não há novas dependências, OCR, importador, endpoints públicos, SQL ou dados fictícios em produção.

Documentação:

- docs/statistics-foundation.md: auditoria, decisões e contratos.
- src/data/statistics/README.md: persistência e publicação.
- docs/statistics-delivery-01.md: arquivos, resultados e pendências.

A aprovação manual é declarada no lote, não uma autenticação de usuário. A proteção entre snapshots requer executar a CLI com --previous-root no procedimento de publicação. Sem merge automático.
