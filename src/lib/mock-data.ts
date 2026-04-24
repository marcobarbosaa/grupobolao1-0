import { RankingEngine, PlayerData } from "./engine";
import { seasonStatsMap } from "./season-stats";

export function getYearFromSeason(s: number): string {
  const startYear = 2002 + s;
  const endYear = startYear + 1;
  return `${startYear}-${endYear.toString().slice(-2)}`;
}

export interface CareerStats {
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  topg: number;
}

export interface CareerYear {
  season: number;
  year: string;
  team: string;
  stats: {
    Regular: CareerStats | null;
    Playoffs: CareerStats | null;
    Finals: CareerStats | null;
  };
}

export interface Player {
  id: number;
  name: string;
  archetype: string;
  teams: string[];
  rings: number;
  scoreTotal: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  topg: number;
  seasons: number;
  clutchIndex: number;
  basketballIQ: number; // AST/TO ratio
  regularSeasonGrade: number;
  playoffsGrade: number;
  finalsGrade: number;
  bio: string;
  imageUrl?: string;
  career: CareerYear[];
}

// Dados brutos para edição fácil. O scoreTotal e as notas são calculados automaticamente.
const RAW_PLAYERS = [
  {
    id: 8,
    name: "Nando",
    archetype: "SF-PF Point forward físico",
    teams: ["Golden State Warriors", "Portland Trail Blazers"],
    rings: 4,
    seasons: 22,
    pts: 17.5,
    reb: 9.9,
    ast: 7.7,
    stl: 1.5,
    blk: 0.7,
    topg: 2.3,
    clutchIndex: 95,
    basketballIQ: 3.3,
    awards: ["NBA Champion", "NBA Champion", "NBA Champion", "NBA Champion"],
    bio: "Nando é a força da natureza que moldou o destino de duas franquias. Com uma carreira monumental de 22 temporadas, ele se tornou o maior vencedor da era moderna, conquistando 4 anéis de campeão. Como um 'Point Forward' de imenso poder físico, Nando redefiniu a posição, combinando a brutalidade no garrafão com a elegância de um mestre passador. Suas médias de 17.5 pontos, 9.9 rebotes e 7.7 assistências contam apenas metade da história; a outra metade foi escrita nas Finais, onde ele se transformava em um titã imparável (Índice Clutch 95). Eleito 4 vezes MVP das Finais (S5, S11, S12, S20), Nando provou que, quando o jogo está na linha, ninguém cresce tanto quanto ele, deixando um legado de dominância absoluta e quatro anéis que brilham como prova de sua grandeza.",
    imageUrl: "/jogadores/Nando.jpeg",
    teamHistory: {
      1: "Golden State Warriors",
      5: "Portland Trail Blazers",
    },
    // Estatísticas específicas por fase (opcional para ajuste fino das notas)
    overrides: {
      playoffs: { ppg: 18.2, rpg: 10.5, apg: 8.1 },
      finals: { ppg: 20.5, rpg: 11.2, apg: 9.5 },
    },
    // Estatísticas específicas por temporada (Vindo da planilha)
    seasonStats: {
      1: {
        regular: { pts: 12.5, reb: 6.2, ast: 4.8 },
        playoffs: { pts: 14.1, reb: 7.0, ast: 5.2 }
      },
      10: {
        regular: { pts: 24.8, reb: 12.5, ast: 9.7 },
        playoffs: { pts: 28.5, reb: 13.2, ast: 11.0 },
        finals: { pts: 32.1, reb: 14.0, ast: 12.5 }
      },
      22: {
        regular: { pts: 9.2, reb: 5.1, ast: 6.8 }
      }
    }
  },
  {
    id: 4,
    name: "Gam",
    archetype: "SG-PG Off-ball sniper secundário",
    teams: ["Minnesota Timberwolves"],
    rings: 2,
    seasons: 20,
    pts: 22.0,
    reb: 6.7,
    ast: 8.4,
    stl: 1.6,
    blk: 0.9,
    topg: 1.6,
    clutchIndex: 95,
    basketballIQ: 3,
    awards: ["NBA Champion", "NBA Champion"],
    bio: "Gam é o sinônimo de lealdade e excelência na história da NBA. Ao longo de uma carreira lendária de 20 temporadas, todas dedicadas ao Minnesota Timberwolves, ele não apenas colocou a franquia no mapa, mas a transformou em uma potência respeitada. Embora classificado como um 'Off-ball sniper', Gam transcendeu esse rótulo, tornando-se um dos jogadores mais versáteis e inteligentes a já pisarem em quadra.\n\nCom médias de carreira de 22.0 pontos, 6.7 rebotes e 8.4 assistências, Gam era uma ameaça constante em todas as áreas do jogo. Sua capacidade de pontuar vindo de telas era complementada por uma visão de jogo de elite, permitindo-lhe atuar como o principal general de quadra dos Timberwolves. No entanto, sua verdadeira lenda foi forjada no calor das Finais da NBA, onde ele entrava em um estado de domínio absoluto.\n\nEnquanto sua performance na temporada regular era digna de All-Star, nas Finais ele se tornava imparável, elevando suas médias para 28.5 pontos e 11.0 assistências. Momentos icônicos definiram sua trajetória, como na Temporada 16-17, onde liderou a equipe ao primeiro título com 27.5 pontos por jogo nas Finais, e na Temporada 19-20, onde atingiu seu ápice físico e técnico com médias surreais de 31.8 pontos e impressionantes 5.2 roubos de bola por jogo na fase decisiva.\n\nCom 2 anéis de campeão, 2 prêmios de MVP das Finais e o título de MVP da Liga na Temporada 19-20, Gam deixou um legado de fidelidade inabalável e sangue frio. Ele provou que a precisão de um sniper e a mente de um estrategista podem coexistir em um único atleta, imortalizando a camisa dos Timberwolves no Hall da Fama da liga.",
    imageUrl: "/jogadores/Gam.jpeg",  
    teamHistory: {
      1: "Minnesota Timberwolves",
    },
    overrides: {
      playoffs: { ppg: 23.5, rpg: 7.2, apg: 9.1 },
      finals: { ppg: 28.5, rpg: 8.5, apg: 11.0 },
    },
  },
  {
    id: 7,
    name: "Medeiros",
    archetype: "SF-PF Stretch forward moderno",
    teams: ["Orlando Magic"],
    rings: 2,
    seasons: 22,
    pts: 17.9,
    reb: 8.9,
    ast: 7.1,
    stl: 1.6,
    blk: 1.6,
    topg: 1.8,
    clutchIndex: 95,
    basketballIQ: 2.8,
    awards: ["NBA Champion", "NBA Champion"],
    bio: "Medeiros é o pilar de estabilidade e versatilidade que definiu o Orlando Magic por mais de duas décadas. Ao longo de suas 22 temporadas com a franquia, ele se consolidou como o protótipo do 'Stretch Forward' moderno: um ala-pivô capaz de espaçar a quadra com seu arremesso, mas que nunca negligenciou o garrafão, sendo uma força defensiva temida e um facilitador de elite.\n\nSua carreira é marcada pela capacidade de fazer tudo em quadra. Com médias de 17.9 pontos, 8.9 rebotes e 7.1 assistências, Medeiros era o raro jogador que poderia liderar sua equipe em qualquer categoria estatística em uma determinada noite. Sua presença defensiva era igualmente impactante, com médias consistentes de 1.6 roubos e 1.6 tocos por jogo. No entanto, foi nos momentos de maior pressão que sua estrela brilhou mais forte.\n\nO ápice de sua trajetória veio com a dinastia construída em Orlando nas Temporadas 7 e 8. Medeiros liderou o Magic a títulos consecutivos, conquistando o prêmio de MVP das Finais em ambas as ocasiões. Suas atuações nas Finais da Temporada 8 foram particularmente lendárias, onde beirou um triplo-duplo com 23 pontos, 10 rebotes e 8.4 assistências, além de registrar 3 tocos por jogo, provando sua dominância absoluta nos dois lados da quadra.\n\nCoroado com o prêmio de MVP da Liga na Temporada 10, Medeiros encerrou sua jornada como um dos jogadores mais condecorados e respeitados da história. Sua fidelidade a Orlando e sua habilidade de elevar o nível de seus companheiros (Índice Clutch 95) o tornaram um ícone imortal, cujo legado de inteligência e versatilidade continuará a inspirar futuras gerações de alas-pivôs.",
    imageUrl: "/jogadores/Medeiros.png",
    teamHistory: {
      1: "Orlando Magic",
    },
    overrides: {
      playoffs: { ppg: 17.5, rpg: 8.5, apg: 6.8 },
      finals: { ppg: 20.1, rpg: 9.8, apg: 7.5 },
    },
  },
  {
    id: 11,
    name: "Dias",
    archetype: "PF-C Interior dominante moderno",
    teams: ["OKC", "Utah Jazz"],
    rings: 1,
    seasons: 19,
    pts: 17.3,
    reb: 10.9,
    ast: 5.7,
    stl: 0.9,
    blk: 2.1,
    topg: 1.2,
    clutchIndex: 85,
    basketballIQ: 3.3,
    awards: ["NBA Champion"],
    bio: "Dias é a personificação do domínio defensivo e da força interior. Ao longo de 19 temporadas, ele se estabeleceu como o guardião supremo do garrafão, primeiro no OKC e depois no Utah Jazz. Com médias de 17.3 pontos, 10.9 rebotes e 2.1 tocos, Dias não era apenas um finalizador eficiente, mas uma barreira intransponível. Seu momento de glória máxima veio na Temporada 9, quando liderou o OKC ao título histórico, sendo coroado MVP das Finais. Sua habilidade de controlar o ritmo do jogo através da defesa e dos rebotes, aliada a um QI de basquete refinado, o coloca como um dos pivôs mais dominantes e inteligentes da história da liga.",
    imageUrl: "/jogadores/Dias.jpeg",
    teamHistory: {
      1: "OKC",
      18: "Utah Jazz",
    },
  },
  {
    id: 9,
    name: "Guilherme",
    archetype: "PF-SF Slashing 4 móvel",
    teams: ["Portland Trail Blazers"],
    rings: 4,
    seasons: 21,
    pts: 15.3,
    reb: 10.5,
    ast: 3.8,
    stl: 1.6,
    blk: 1.8,
    topg: 1.4,
    clutchIndex: 95,
    basketballIQ: 1.7,
    awards: ["NBA Champion", "NBA Champion", "NBA Champion", "NBA Champion"],
    bio: "Guilherme é o ala-pivô moderno por excelência: móvel, agressivo e letal em transição. Fiel ao Portland Trail Blazers por 21 temporadas, ele formou uma das duplas mais temidas da história ao lado de Nando. Juntos, conquistaram 4 títulos, com Guilherme sendo o motor de energia que impulsionava a equipe. Médias de 15.3 pontos e 10.5 rebotes mostram sua consistência, mas seu valor real estava na versatilidade defensiva (1.8 tocos) e na sua capacidade de atacar o aro como um 'Slashing 4'. Quatro anéis de campeão adornam sua carreira, símbolo de um jogador que soube unir talento individual a um espírito vencedor inabalável.",
    imageUrl: "/jogadores/Guilherme.jpeg",
    teamHistory: {
      1: "Portland Trail Blazers",
    },
  },
  {
    id: 12,
    name: "Binho",
    archetype: "C-PF Stretch 5 técnico",
    teams: ["Utah Jazz", "Pelicans", "Hornets"],
    rings: 1,
    seasons: 20,
    pts: 14.8,
    reb: 8.9,
    ast: 7.5,
    stl: 0.8,
    blk: 1.5,
    topg: 2.8,
    clutchIndex: 85,
    basketballIQ: 4.9,
    awards: ["NBA Champion"],
    bio: "Binho trouxe uma nova dimensão à posição de pivô como o 'Stretch 5' mais técnico da liga. Em 20 temporadas, passando por Utah, Pelicans e Hornets, ele desafiou as convenções ao apresentar uma visão de jogo e um passe dignos de um armador de elite, registrando médias impressionantes de 7.5 assistências por jogo. Com um QI de basquete quase perfeito (4.9), Binho não apenas pontuava (14.8 pts) e pegava rebotes (8.9), mas ditava o ritmo de todo o ataque. Campeão da NBA e maestro por natureza, sua habilidade de abrir a quadra e encontrar companheiros em ângulos impossíveis mudou a forma como os pivôs são avaliados na Central da Liga.",
    imageUrl: "/jogadores/Binho.jpeg",
    teamHistory: {
      1: "Utah Jazz",
      8: "Pelicans",
      12: "Hornets",
    },
  },
  {
    id: 13,
    name: "Enzo",
    archetype: "C-PF Post scorer clássico",
    teams: ["Boston Celtics", "Detroit Pistons"],
    rings: 1,
    seasons: 19,
    pts: 15.3,
    reb: 10.5,
    ast: 2.7,
    stl: 1.1,
    blk: 2.0,
    topg: 1.4,
    clutchIndex: 85,
    basketballIQ: 1.4,
    awards: ["NBA Champion"],
    bio: "Enzo é o mestre do jogo de costas para a cesta, um 'Post Scorer' clássico que manteve viva a arte do pivô técnico. Durante 13 temporadas no Boston Celtics e posteriormente no Detroit Pistons, ele foi o terror dos defensores no garrafão, utilizando um arsenal vasto de movimentos e uma força física imponente. Com médias de 15.3 pontos, 10.5 rebotes e 2.0 tocos, Enzo era o âncora de suas equipes em ambos os lados da quadra. Sua conquista do anel de campeão com os Celtics foi o selo de uma carreira marcada pela consistência e pela eficiência, provando que o basquete clássico ainda tem um lugar de honra no topo da liga moderna.",
    imageUrl: "/jogadores/Enzo.jpeg",
    teamHistory: {
      1: "Boston Celtics",
      14: "Detroit Pistons",
    },
  },
  {
    id: 1,
    name: "Abel",
    archetype: "PG-SG Armador criativo explosivo",
    teams: ["Denver Nuggets", "Golden State Warriors", "Indiana Pacers"],
    rings: 1,
    seasons: 21,
    pts: 16.7,
    reb: 4.7,
    ast: 8,
    stl: 1.6,
    blk: 0.3,
    topg: 2.3,
    clutchIndex: 95,
    basketballIQ: 3.2,
    awards: ["NBA Champion"],
    bio: "Abel é a definição de explosão e criatividade no perímetro. Em 21 temporadas, ele encantou os fãs com um estilo de jogo imprevisível e eletrizante, especialmente durante seus anos dourados em Denver. Foi lá que Abel viveu seu ápice na Temporada 1, liderando os Nuggets ao título e sendo eleito o primeiro MVP das Finais da história desta cronologia. Com médias de 16.7 pontos e 8.0 assistências, sua capacidade de criar o próprio arremesso ou servir companheiros com passes geniais o tornou um pesadelo para qualquer defesa. Campeão e showman, Abel deixou sua marca como o armador que uniu o espetáculo à eficácia máxima.",
    imageUrl: "/jogadores/Abel.jpeg",
    teamHistory: {
      1: "Denver Nuggets",
      6: "Golden State Warriors",
      20: "Indiana Pacers",
    },
    overrides: {
      playoffs: { ppg: 19.5, apg: 9.2 },
      finals: { ppg: 20.1, apg: 9.8 },
    },
  },
  {
    id: 2,
    name: "Marco",
    archetype: "PG-SG Floor general pontuador",
    teams: ["Washington Wizards"],
    rings: 1,
    seasons: 19,
    pts: 15.8,
    reb: 4.9,
    ast: 8.7,
    stl: 1.4,
    blk: 0.2,
    topg: 2.4,
    clutchIndex: 95,
    basketballIQ: 3.3,
    awards: ["NBA Champion"],
    bio: "Marco é o 'Floor General' que todo treinador sonha em ter: inteligente, pontuador e calmo sob pressão. Passando toda a sua carreira de 19 temporadas no Washington Wizards, ele foi o arquiteto do sucesso da franquia. Seu maior triunfo ocorreu na Temporada 2, quando orquestrou o caminho dos Wizards até o título, conquistando o prêmio de MVP das Finais com atuações magistrais. Médias de 15.8 pontos e 8.7 assistências refletem sua habilidade em equilibrar a pontuação com a distribuição de jogo. Com o Índice Clutch de 95, Marco sempre foi o homem de confiança nos momentos finais, um líder nato que trouxe glória eterna à capital.",
    imageUrl: "/jogadores/Marco.jpeg",
    teamHistory: {
      1: "Washington Wizards",
    },
    overrides: {
      playoffs: { ppg: 17.2, apg: 9.5 },
      finals: { ppg: 17.2, apg: 9.5 },
    },
  },
  {
    id: 3,
    name: "Tailan",
    archetype: "SG-PG Combo scorer agressivo",
    teams: ["Chicago Bulls", "Utah Jazz", "Golden State Warriors"],
    rings: 0,
    seasons: 19,
    pts: 17,
    reb: 4.4,
    ast: 6.1,
    stl: 1.3,
    blk: 0.3,
    topg: 2.0,
    clutchIndex: 85,
    basketballIQ: 2.8,
    awards: [],
    bio: "Tailan é um dos maiores pontuadores puros que a liga já viu, um 'Combo Scorer' agressivo que nunca encontrou um arremesso que não pudesse converter. Em 19 temporadas, passando por Bulls, Jazz e Warriors, ele aterrorizou defesas com uma média de 17.0 pontos e um instinto assassino no um-contra-um. Embora o título de campeão tenha lhe escapado, seu impacto individual e sua capacidade de carregar o ataque de suas equipes o tornaram uma lenda respeitada. Tailan provou que o talento puro e a agressividade ofensiva podem criar um legado duradouro, sendo lembrado como o jogador mais letal a nunca ter levantado o troféu de campeão.",
    imageUrl: "/jogadores/Tailan.jpeg",
    teamHistory: {
      1: "Chicago Bulls",
      7: "Utah Jazz",
      15: "Golden State Warriors",
    },
  },
  {
    id: 10,
    name: "Cristiano Ronaldo",
    archetype: "PF-SF Defender versátil",
    teams: ["New York Knicks", "Utah Jazz", "Detroit Pistons", "OKC"],
    rings: 1,
    seasons: 19,
    pts: 9.7,
    reb: 10.1,
    ast: 7.8,
    stl: 1.7,
    blk: 1.8,
    topg: 1.6,
    clutchIndex: 95,
    basketballIQ: 3.5,
    awards: ["NBA Champion"],
    bio: "Cristiano Ronaldo é o canivete suíço defensivo que toda equipe campeã precisa. Atuando como um 'Defender' versátil por 19 temporadas, ele passou por Knicks, Jazz, Pistons e OKC, sempre sendo o coração emocional de suas equipes. Seus números de 9.7 pontos, 10.1 rebotes e 7.8 assistências evocam o estilo de um facilitador defensivo moderno, capaz de anular o melhor jogador adversário e iniciar o contra-ataque no mesmo lance. Campeão da NBA, Cristiano sempre foi valorizado pelo seu QI de basquete (3.5) e pela sua entrega total em quadra, provando que a grandeza nem sempre é medida em pontos, mas em impacto defensivo e versatilidade.",
    imageUrl: "/jogadores/Cerrote.jpeg",
    teamHistory: {
      1: "New York Knicks",
      7: "Utah Jazz",
      13: "Detroit Pistons",
      17: "OKC",
      18: "New York Knicks",
    },
    overrides: {
      playoffs: { ppg: 9.9, reb: 10.5, apg: 8.0 },
      finals: { ppg: 10.5, reb: 11.2, apg: 8.5 },
    },
  },
  {
    id: 6,
    name: "Matheus Germano",
    archetype: "SF-SG 3-and-D técnico",
    teams: ["Philadelphia 76ers"],
    rings: 1,
    seasons: 20,
    pts: 14.6,
    reb: 2.8,
    ast: 7.7,
    stl: 2.1,
    blk: 0.9,
    topg: 1.6,
    clutchIndex: 85,
    basketballIQ: 3.1,
    awards: ["NBA Champion"],
    bio: "Matheus Germano é o '3-and-D' técnico por excelência, um especialista que elevou o papel de apoio ao nível de estrela. Fiel ao Philadelphia 76ers por 20 temporadas, ele foi a peça fundamental para o equilíbrio da equipe. Com médias de 14.6 pontos, 7.7 assistências e impressionantes 2.1 roubos de bola, Germano era um pesadelo defensivo no perímetro e uma ameaça constante na bola de três. Seu auge veio com o título na Temporada 19, onde sua defesa implacável e sua precisão foram cruciais para a conquista. Campeão e exemplo de ética de trabalho, ele se tornou o ídolo máximo da torcida dos Sixers.",
    imageUrl: "/jogadores/Thug.jpeg",
    teamHistory: {
      1: "Philadelphia 76ers",
    },
  },
  {
    id: 5,
    name: "Jonas",
    archetype: "SG-SF Wing slasher atlético",
    teams: ["Cleveland Cavaliers", "Phoenix Suns", "Sacramento Kings", "Philadelphia 76ers", "Atlanta Hawks"],
    rings: 1,
    seasons: 20,
    pts: 12.1,
    reb: 6.9,
    ast: 4.1,
    stl: 1.4,
    blk: 1.5,
    topg: 1.6,
    clutchIndex: 85,
    basketballIQ: 1.8,
    awards: ["NBA Champion"],
    bio: "Jonas é o 'Wing Slasher' que trazia o atletismo e a energia para o próximo nível. Em 20 temporadas, passando por diversas franquias como Cavs, Suns, Kings e Sixers, ele sempre foi o fator X capaz de mudar o rumo de uma partida com uma enterrada explosiva ou um toco espetacular (1.5 blk). Sua média de 12.1 pontos e 6.9 rebotes não reflete totalmente sua importância tática como um ala versátil e agressivo. O ponto alto de sua jornada foi o título conquistado com os Sixers na Temporada 19, onde sua fisicalidade e seu jogo de transição foram peças-chave para o sucesso da equipe, imortalizando-o como um dos grandes alas de sua geração.",
    imageUrl: "/jogadores/Jonas.png",
    teamHistory: {
      1: "Cleveland Cavaliers",
      5: "Phoenix Suns",
      14: "Sacramento Kings",
      19: "Philadelphia 76ers",
      20: "Atlanta Hawks",
    },
  },
];

export const players: Player[] = RAW_PLAYERS.map((raw) => {
  const p = new PlayerData(raw.name, raw.archetype);
  
  // Adiciona prêmios
  if (raw.awards) {
    raw.awards.forEach(a => p.addAward(a));
  }

  // Helper para calcular TO: usa o topg direto se existir, senão calcula pelo QI (AST/TO)
  const getTO = (ast: number, iq: number, manualTO?: number) => manualTO ?? (iq > 0 ? ast / iq : ast / 1);

  // Configura estatísticas da Temporada Regular
  const regTO = getTO(raw.ast, raw.basketballIQ, (raw as any).topg);
  p.setStats("Regular", 82 * raw.seasons, raw.pts, raw.reb, raw.ast, raw.stl, raw.blk, regTO, 36);

  // Configura Playoffs (usa overrides ou cai para Regular)
  const playPts = raw.overrides?.playoffs?.ppg ?? raw.pts;
  const playReb = raw.overrides?.playoffs?.rpg ?? raw.reb;
  const playAst = raw.overrides?.playoffs?.apg ?? raw.ast;
  const playTO = getTO(playAst, raw.basketballIQ);
  p.setStats("Playoffs", 16 * raw.seasons, playPts, playReb, playAst, raw.stl, raw.blk, playTO, 40);

  // Configura Finals (usa overrides ou cai para Regular)
  const finPts = raw.overrides?.finals?.ppg ?? raw.pts;
  const finReb = raw.overrides?.finals?.rpg ?? raw.reb;
  const finAst = raw.overrides?.finals?.apg ?? raw.ast;
  const finTO = getTO(finAst, raw.basketballIQ);
  p.setStats("Finals", 7 * raw.rings || 0, finPts, finReb, finAst, raw.stl, raw.blk, finTO, 42);

  // Calcula histórico de times e stats
  const startSeason = (raw as any).startSeason || 1;
  const teamMap = (raw as any).teamHistory || { 1: raw.teams[0] };
  const career: CareerYear[] = [];
  let currentTeam = teamMap[Object.keys(teamMap)[0]];

  for (let s = startSeason; s < startSeason + raw.seasons; s++) {
    if (teamMap[s]) currentTeam = teamMap[s];
    
    const getPhaseStats = (phase: "playoffs" | "finals" | "regular") => {
      // 1. Busca da planilha importada
      const excelStats = seasonStatsMap[raw.name]?.[s]?.[phase];
      // 2. Busca estatística específica da temporada/fase (manual mock)
      const seasonOverride = (raw as any).seasonStats?.[s]?.[phase] || excelStats;
      
      // Se for Regular, sempre mostramos (ou base ou override)
      // Se for Playoffs/Finals, só mostramos se houver dado específico
      if (phase !== "regular" && !seasonOverride) {
        return null;
      }

      // 3. Busca estatística global da fase (ex: media de playoffs da carreira)
      const phaseOverride = (raw as any).overrides?.[phase] || {};
      
      return {
        gp: seasonOverride?.gp ?? (phase === "regular" ? 82 : phase === "playoffs" ? 16 : 7),
        pts: seasonOverride?.pts ?? seasonOverride?.ppg ?? phaseOverride.pts ?? phaseOverride.ppg ?? raw.pts,
        reb: seasonOverride?.reb ?? seasonOverride?.rpg ?? phaseOverride.reb ?? phaseOverride.rpg ?? raw.reb,
        ast: seasonOverride?.ast ?? seasonOverride?.apg ?? phaseOverride.ast ?? phaseOverride.apg ?? raw.ast,
        stl: seasonOverride?.stl ?? phaseOverride.stl ?? raw.stl,
        blk: seasonOverride?.blk ?? phaseOverride.blk ?? raw.blk,
        topg: seasonOverride?.topg ?? phaseOverride.topg ?? raw.topg ?? (raw.ast / (raw.basketballIQ || 1)),
      };
    };

    career.push({
      season: s,
      year: getYearFromSeason(s),
      team: currentTeam,
      stats: {
        Regular: getPhaseStats("regular"),
        Playoffs: getPhaseStats("playoffs"),
        Finals: getPhaseStats("finals"),
      }
    });
  }

  // Calcula notas usando o Engine
  const regularSeasonGrade = RankingEngine.calculatePhaseGrade(p.stats.Regular, raw.archetype);
  const playoffsGrade = RankingEngine.calculatePhaseGrade(p.stats.Playoffs, raw.archetype);
  const finalsGrade = RankingEngine.calculatePhaseGrade(p.stats.Finals, raw.archetype);
  
  // Agora o scoreTotal é uma nota de 1 a 10 baseada na média das fases
  const scoreTotal = RankingEngine.calculateSeasonFinalGrade(
    regularSeasonGrade, 
    playoffsGrade, 
    finalsGrade
  );

  // --- CÁLCULOS DINÂMICOS ---
  
  // 1. QI de Basquete: Baseado na eficiência de Assistências por Turnover
  // Usamos a média de carreira (raw.ast e raw.topg)
  const calculatedIQ = Number((raw.ast / (raw.topg || 1)).toFixed(2));

  // 2. Índice Clutch: Baseado no crescimento em Playoffs/Finais + Títulos
  const postSeasonAvg = (playoffsGrade + finalsGrade) / 2;
  const growthFactor = postSeasonAvg / (regularSeasonGrade || 1);
  // Bônus de 3 pontos por anel, base de 70 pontos ajustada pelo crescimento
  const clutchBase = 70 * growthFactor;
  const ringsBonus = raw.rings * 3;
  const calculatedClutch = Math.min(100, Math.max(0, Math.round(clutchBase + ringsBonus)));

  return {
    ...raw,
    scoreTotal,
    regularSeasonGrade,
    playoffsGrade,
    finalsGrade,
    career,
    basketballIQ: calculatedIQ,
    clutchIndex: calculatedClutch,
  };
});

export interface Season {
  id: number;
  name: string;
  year: string;
  champion: string;
  mvp: string;
  finalsMvp: string;
  gamesPlayed: number;
}

export const seasons: Season[] = [
  { id: 1, name: "Season 1", year: "2003-04", champion: "Denver Nuggets", mvp: "Kevin Garnett", finalsMvp: "Abel", gamesPlayed: 82 },
  { id: 2, name: "Season 2", year: "2004-05", champion: "Washington Wizards", mvp: "Steve Nash", finalsMvp: "Marco", gamesPlayed: 82 },
  { id: 3, name: "Season 3", year: "2005-06", champion: "San Antonio Spurs", mvp: "Steve Nash", finalsMvp: "Tim Duncan", gamesPlayed: 82 },
  { id: 4, name: "Season 4", year: "2006-07", champion: "Miami Heat", mvp: "Dirk Nowitzki", finalsMvp: "Dwyane Wade", gamesPlayed: 82 },
  { id: 5, name: "Season 5", year: "2007-08", champion: "Portland Trail Blazers", mvp: "Kobe Bryant", finalsMvp: "Nando", gamesPlayed: 82 },
  { id: 6, name: "Season 6", year: "2008-09", champion: "Dallas Mavericks", mvp: "LeBron James", finalsMvp: "Dirk Nowitzki", gamesPlayed: 82 },
  { id: 7, name: "Season 7", year: "2009-10", champion: "Orlando Magic", mvp: "LeBron James", finalsMvp: "Medeiros", gamesPlayed: 82 },
  { id: 8, name: "Season 8", year: "2010-11", champion: "Orlando Magic", mvp: "Derrick Rose", finalsMvp: "Medeiros", gamesPlayed: 82 },
  { id: 9, name: "Season 9", year: "2011-12", champion: "OKC", mvp: "Kevin Durant", finalsMvp: "Dias", gamesPlayed: 82 },
  { id: 10, name: "Season 10", year: "2012-13", champion: "Memphis Grizzlies", mvp: "Medeiros", finalsMvp: "Zach Randolph", gamesPlayed: 82 },
  { id: 11, name: "Season 11", year: "2013-14", champion: "Portland Trail Blazers", mvp: "Kevin Durant", finalsMvp: "Nando", gamesPlayed: 82 },
  { id: 12, name: "Season 12", year: "2014-15", champion: "Portland Trail Blazers", mvp: "Stephen Curry", finalsMvp: "Nando", gamesPlayed: 82 },
  { id: 13, name: "Season 13", year: "2015-16", champion: "Milwaukee Bucks", mvp: "Stephen Curry", finalsMvp: "Giannis Antetokounmpo", gamesPlayed: 82 },
  { id: 14, name: "Season 14", year: "2016-17", champion: "Minnesota Timberwolves", mvp: "Russell Westbrook", finalsMvp: "Gam", gamesPlayed: 82 },
  { id: 15, name: "Season 15", year: "2017-18", champion: "Boston Celtics", mvp: "James Harden", finalsMvp: "Kyrie Irving", gamesPlayed: 82 },
  { id: 16, name: "Season 16", year: "2018-19", champion: "New Orleans Pelicans", mvp: "Giannis Antetokounmpo", finalsMvp: "Stephen Curry", gamesPlayed: 82 },
  { id: 17, name: "Season 17", year: "2019-20", champion: "Minnesota Timberwolves", mvp: "Gam", finalsMvp: "Gam", gamesPlayed: 82 },
  { id: 18, name: "Season 18", year: "2020-21", champion: "Toronto Raptors", mvp: "Nikola Jokic", finalsMvp: "Pascal Siakam", gamesPlayed: 82 },
  { id: 19, name: "Season 19", year: "2021-22", champion: "Philadelphia 76ers", mvp: "Nikola Jokic", finalsMvp: "Kevin Durant", gamesPlayed: 82 },
  { id: 20, name: "Season 20", year: "2022-23", champion: "Portland Trail Blazers", mvp: "Joel Embiid", finalsMvp: "Nando", gamesPlayed: 82 },
  { id: 21, name: "Season 21", year: "2023-24", champion: "Houston Rockets", mvp: "Luka Doncic", finalsMvp: "Alperen Sengun", gamesPlayed: 82 },
  { id: 22, name: "Season 22", year: "2024-25", champion: "LA Clippers", mvp: "Shai Gilgeous-Alexander", finalsMvp: "Kawhi Leonard", gamesPlayed: 82 },
];

export function getArchetypeColor(archetype: string): string {
  if (archetype.includes("PG") || archetype.includes("SG"))
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (archetype.includes("SF")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (archetype.includes("PF") || archetype.includes("C"))
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-muted text-muted-foreground";
}
