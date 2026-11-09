/** Nova geração da Central do Bolão. Nada aqui herda dados da liga anterior. */
export interface BolaoPlayer {
  id: string;
  name: string;
  team: string;
  sport: "basquete";
  portrait: string;
  portraitSet?: string;
  dataStatus: "not-imported";
  biography: null;
  seasons: [];
  awards: [];
  positions: [];
}
const picture = (fileName: string) => `/jogadores/novo-elenco/${fileName}`;
export const newRoster: BolaoPlayer[] = [
  {
    "id": "fabio-carvalho",
    "name": "Fábio Carvalho",
    "team": "New Orleans Hornets",
    "stem": "Binho_NOHornets.png"
  },
  {
    "id": "abel",
    "name": "Abel",
    "team": "Sacramento Kings",
    "stem": "Abel_Kings.png"
  },
  {
    "id": "gam-mori",
    "name": "Gam Mori",
    "team": "Atlanta Hawks",
    "stem": "Gam_Hawks.png"
  },
  {
    "id": "marco-barbosa",
    "name": "Marco Barbosa",
    "team": "Denver Nuggets",
    "stem": "Marco_Nuggets.png"
  },
  {
    "id": "cristiano-ronaldo",
    "name": "Cristiano Ronaldo",
    "team": "Indiana Pacers",
    "stem": "Cerrote_Pacers.png"
  },
  {
    "id": "dias",
    "name": "Dias",
    "team": "Detroit Pistons",
    "stem": "Dias_Pistons.png"
  },
  {
    "id": "russo",
    "name": "Russo",
    "team": "Toronto Raptors",
    "stem": "Russo_Raptors.png"
  },
  {
    "id": "jonas",
    "name": "Jonas",
    "team": "New York Knicks",
    "stem": "Jonas_Knicks.png"
  },
  {
    "id": "enzo",
    "name": "Enzo",
    "team": "San Antonio Spurs",
    "stem": "Enzo_Spurs.png"
  },
  {
    "id": "tailan",
    "name": "Tailan",
    "team": "Minnesota Timberwolves",
    "stem": "Tailan_Minnesota.png"
  },
  {
    "id": "matheus-medeiros",
    "name": "Matheus Medeiros",
    "team": "Philadelphia 76ers",
    "stem": "Medeiros_76ers.png"
  },
  {
    "id": "nando",
    "name": "Nando",
    "team": "Houston Rockets",
    "stem": "Nando_Rockets.png"
  },
  {
    "id": "guilherme",
    "name": "Guilherme",
    "team": "Chicago Bulls",
    "stem": "Guilherme_Bulls.png"
  }
]
  .map(({ id, name, team, stem }) => ({
    id, name, team, sport: "basquete",
    portrait: picture(stem),
    dataStatus: "not-imported",
    biography: null, seasons: [], awards: [], positions: [],
  }));
export const findNewPlayer = (id: string) => newRoster.find((player) => player.id === id);
export const currentSeasons: [] = [];
