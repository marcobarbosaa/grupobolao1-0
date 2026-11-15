# Identidade histórica dos jogadores

O manifesto `public/jogadores/rotas/manifest.json` é a fonte de períodos, times e uniformes. Nando e Tailan têm confirmação manual do usuário; os demais registros conservam a verificação e procedência originais.

`src/lib/player-history.ts` normaliza aliases (Binho/Fábio, Gam/Gam Mori, Marco/Marco Barbosa, Medeiros/Matheus e Cerrote/Cristiano), interpreta temporadas completas ou abreviadas e resolve intervalos inclusivos. Períodos abertos só valem para temporadas presentes no catálogo publicado. Ausência, ambiguidade ou temporada futura produzem equipe não confirmada e nenhum uniforme presumido.

`src/lib/player-selection-identity.ts` associa a resolução às paletas existentes e aos escudos de `historical-logos.json`, respeitando overrides da temporada e Extras publicados. As versões de 2015 não substituem os escudos históricos. Cópias locais em `public/jogadores/escudos/historicos` vieram das URLs `https://assets.logocdn.com/images/sports/nba/{ano}/{slug}{extensão}` já usadas pelo projeto. Definições futuras sem cópia local usam essa mesma origem, com tratamento de falha na interface.

O plugin `scripts/player-history-plugin.ts` incorpora o manifesto público ao bundle e observa mudanças em desenvolvimento, sem duplicar JSON nem fazer fetch inicial no cliente. Novas imagens e períodos exigem apenas atualizar o manifesto e adicionar o arquivo correspondente. Novas equipes precisam de uma paleta; equipes desconhecidas usam tema neutro.

Início e Jogadores usam a temporada publicada mais recente (2012–2013 nesta entrega). O seletor editorial “Temporada em destaque” da home continua controlando os destaques do arquivo; não altera a temporada de referência dos protagonistas. No perfil, o seletor existente controla estatísticas, imagem, time, escudo e tema. As imagens do próprio jogador permanecem montadas para permitir crossfade e navegação rápida; movimento reduzido desliga as transições. No celular, a informação fica acima do retrato para não cobrir o rosto.

Validação: testes de todos os intervalos, 13 jogadores, aliases, limites e transferências; suíte estatística; TypeScript; build cliente/SSR; navegador em 1440×900, 1366×768, 768×1024 e 390×844. Nenhum arquivo de estatísticas publicadas foi alterado. O build conserva o aviso de chunk JavaScript acima de 500 kB.

Comandos:

- `npm run stats:test`
- `npm run stats:validate`
- `npm run stats:typecheck`
- `npx tsc --noEmit`
- `npm run build`
- Com servidor na porta 8080: `node tests/player-history.browser.mjs` e `node tests/player-selection.browser.mjs`. Configure `PLAYWRIGHT_MODULE` se Playwright estiver instalado fora do projeto; `BASE_URL` permite outro endereço.
