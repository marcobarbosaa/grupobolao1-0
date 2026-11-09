/** Nova geração da Central do Bolão. Nada aqui herda dados da liga anterior. */
export interface BolaoPlayer {
  id: string;
  name: string;
  team: string;
  sport: "basquete";
  portrait: string;
  portraitSet: string;
  dataStatus: "not-imported";
  biography: null;
  seasons: [];
  awards: [];
  positions: [];
}
const picture = (stem: string, size: 480 | 960) =>
  `/jogadores/novo-elenco/${stem}-${size}.webp`;
export const newRoster: BolaoPlayer[] = [
  {
    "id": "fabio-carvalho",
    "name": "Fábio Carvalho",
    "team": "New Orleans Hornets",
    "stem": "fabio-carvalho"
  },
  {
    "id": "abel",
    "name": "Abel",
    "team": "Sacramento Kings",
    "stem": "abel"
  },
  {
    "id": "gam-mori",
    "name": "Gam Mori",
    "team": "Atlanta Hawks",
    "stem": "gam-mori"
  },
  {
    "id": "marco-barbosa",
    "name": "Marco Barbosa",
    "team": "Denver Nuggets",
    "stem": "marco-barbosa"
  },
  {
    "id": "cristiano-ronaldo",
    "name": "Cristiano Ronaldo",
    "team": "Indiana Pacers",
    "stem": "cristiano-ronaldo"
  },
  {
    "id": "dias",
    "name": "Dias",
    "team": "Detroit Pistons",
    "stem": "dias"
  },
  {
    "id": "russo",
    "name": "Russo",
    "team": "Toronto Raptors",
    "stem": "russo"
  },
  {
    "id": "jonas",
    "name": "Jonas",
    "team": "New York Knicks",
    "stem": "jonas"
  },
  {
    "id": "enzo",
    "name": "Enzo",
    "team": "San Antonio Spurs",
    "stem": "enzo"
  },
  {
    "id": "tailan",
    "name": "Tailan",
    "team": "Minnesota Timberwolves",
    "stem": "tailan"
  },
  {
    "id": "matheus-medeiros",
    "name": "Matheus Medeiros",
    "team": "Philadelphia 76ers",
    "stem": "matheus-medeiros"
  },
  {
    "id": "nando",
    "name": "Nando",
    "team": "Houston Rockets",
    "stem": "nando"
  },
  {
    "id": "guilherme",
    "name": "Guilherme",
    "team": "Chicago Bulls",
    "stem": "guilherme"
  }
]
  .map(({ id, name, team, stem }) => ({
    id, name, team, sport: "basquete",
    portrait: picture(stem, 960),
    portraitSet: `${picture(stem, 480)} 480w, ${picture(stem, 960)} 960w`,
    dataStatus: "not-imported",
    biography: null, seasons: [], awards: [], positions: [],
  }));
export const findNewPlayer = (id: string) => newRoster.find((player) => player.id === id);
export const currentSeasons: [] = [];
