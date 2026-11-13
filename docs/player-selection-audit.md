# Auditoria da seleção de jogadores — PR #20

Os 13 PNGs em `public/jogadores/selecao` foram inspecionados visualmente em 13/11/2026.
O mapeamento em `src/lib/player-selection-identity.ts` pertence exclusivamente à apresentação
de `/jogadores`. O cadastro `new-roster.ts`, temporadas, estatísticas e transferências não foram alterados.
Os números abaixo são os números legíveis nos PNGs aprovados, não números inferidos de temporadas.

| Jogador / arquivo PNG                     | Cadastro preservado    | Equipe na imagem e seleção | Camisa |
| ----------------------------------------- | ---------------------- | -------------------------- | ------ |
| Fábio Carvalho / fabio-carvalho.png       | New Orleans Hornets    | New Orleans Hornets        | 44     |
| Abel / abel.png                           | Sacramento Kings       | Phoenix Suns               | 0      |
| Gam Mori / gam-mori.png                   | Atlanta Hawks          | Atlanta Hawks              | 24     |
| Marco Barbosa / marco-barbosa.png         | Denver Nuggets         | Denver Nuggets             | 46     |
| Cristiano Ronaldo / cristiano-ronaldo.png | Indiana Pacers         | Denver Nuggets             | 22     |
| Dias / dias.png                           | Detroit Pistons        | Dallas Mavericks           | 31     |
| Russo / russo.png                         | Toronto Raptors        | Toronto Raptors            | 7      |
| Jonas / jonas.png                         | New York Knicks        | New York Knicks            | 13     |
| Enzo / enzo.png                           | San Antonio Spurs      | San Antonio Spurs          | 43     |
| Tailan / tailan.png                       | Minnesota Timberwolves | New York Knicks            | 6      |
| Matheus Medeiros / medeiros.png           | Philadelphia 76ers     | Philadelphia 76ers         | 35     |
| Nando / nando.png                         | Houston Rockets        | Houston Rockets            | 28     |
| Guilherme / guilherme.png                 | Chicago Bulls          | Chicago Bulls              | 39     |

Não há pendência de identificação de franquia. As posições principal/secundária não existem no
cadastro atual (`positions: []`), portanto são omitidas. O componente as apresentará quando disponíveis.
Medeiros usa o PNG atualizado indicado pelo usuário; nenhum arquivo de atleta foi removido ou regravado.
Em falha de carregamento da fotografia, o escudo da identidade selecionada funciona como fallback,
evitando mostrar um uniforme antigo de outra equipe.

## Escudos

Cópias locais em `public/jogadores/escudos`, obtidas da mesma biblioteca usada por `SeasonExtras.tsx`.
As referências históricas foram reaproveitadas individualmente quando coerentes com a identidade visual,
sem importar automaticamente o escudo de uma temporada. Em especial, Hornets mantém New Orleans;
não usa Charlotte nem Pelicans. Suns e Hawks usam as identidades roxa/laranja e vermelha/dourada
correspondentes aos uniformes modernos nas fotografias.

Origem: `https://i.logocdn.com/nba/{ano}/{slug}@3x.png` (Bulls usa `.svg`).

| Arquivo local | Ano / slug de origem       |
| ------------- | -------------------------- |
| hornets.png   | 2007 / new-orleans-hornets |
| suns.png      | 2013 / phoenix-suns        |
| hawks.png     | 2015 / atlanta-hawks       |
| nuggets.png   | 2003 / denver-nuggets      |
| mavericks.png | 2001 / dallas-mavericks    |
| raptors.png   | 1995 / toronto-raptors     |
| knicks.png    | 1995 / new-york-knicks     |
| spurs.png     | 2002 / san-antonio-spurs   |
| 76ers.png     | 1997 / philadelphia-76ers  |
| rockets.png   | 2003 / houston-rockets     |
| bulls.svg     | 1966 / chicago-bulls       |

## Direção de arte

São 13 atletas e 11 franquias distintas. Cada franquia possui base, sombra profunda, cor primária,
secundária, destaque, iluminação, texto contrastante e escudo explícitos. Bulls tem preto e carmim;
Hawks, vermelho quente e dourado; Suns, roxo e laranja; Hornets, petróleo e turquesa; Nuggets,
azul claro e ouro; Mavericks, azul frio e prata; Raptors, vinho e violeta; Knicks, azul e laranja;
Spurs, grafite e prata; 76ers, azul, vermelho e dourado; Rockets, rubi e cinza frio.
O shell interpola as variáveis existentes em 550 ms. A landing continua usando suas paletas originais.

## Validação reproduzível

- `npx tsc --noEmit`
- `npm run build`
- `npm run lint` (há problemas preexistentes no projeto e em artefatos locais; ver entrega do PR)
- `npx eslint src/components/home/LandingThemeShell.tsx src/components/sports/PlayerSelection.tsx src/lib/player-selection-identity.ts tests/player-selection.browser.mjs`
- `node --test tests/*.test.mjs tests/statistics/*.test.mjs`
- Com Vite na porta 8080: `node tests/player-selection.browser.mjs`.
  Aceita `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL` e `BASE_URL`, sem adicionar dependência ao projeto.
  Capturas ficam em `artifacts/players-review` (ignorado pelo Git).

O teste de navegador verifica o ciclo dos 13 jogadores, imagens e escudos carregados, equipes e números,
links, hover e saída, permanência sobre o painel, foco, setas, clique lateral, perfil central,
arraste touch real via CDP e toque no CTA, sete resoluções e reduced motion.
Há smoke test da landing, não comparação pixel a pixel. Em alturas até 480 px, a seleção admite
rolagem vertical para preservar legibilidade. Não foi realizado teste em aparelho físico nem Safari.
