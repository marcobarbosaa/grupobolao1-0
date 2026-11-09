Este PR adiciona o pipeline offline que recebe transcrições estruturadas de prints, prepara relatórios determinísticos, exige autorização separada e gera snapshots JSON publicáveis. A base é main f129e01, com Fundação, Motor Matemático e correção de CI integrados.

A normalização depende do contexto declarado da tela, preserva a precisão e recusa ambiguidades. Identidades vêm dos 13 jogadores existentes. SHA-256 reutiliza imagens já conhecidas; conflitos são relatados campo a campo e correções preservam versões anteriores.

A autorização vincula candidato, base, aliases, fontes, relatório e escopo exato. publish usa dry-run por padrão; --write prepara e valida uma geração imutável antes da troca atômica do manifest. Lock/journal permitem recuperação após interrupções, sem apagar gerações anteriores.

Não há estatísticas reais/fictícias no manifest, OCR, upload, backend externo ou mudanças visuais. Fórmulas e contratos aprovados foram preservados. A aprovação é operacional e rastreável, sem alegação de autenticação criptográfica.

Guia: docs/statistics-import-guide.md. Relatório: docs/statistics-delivery-03.md. Sem merge automático.
