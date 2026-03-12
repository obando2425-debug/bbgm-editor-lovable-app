// BBGM Reference Schema — extracted from real Basketball GM export (v69)
// This is the "ghost schema" used for merge, validation, and section generation

export const BBGM_TOP_LEVEL_KEYS = [
  "version", "meta", "players", "teams", "gameAttributes", "draftPicks",
  "draftLotteryResults", "trade", "schedule", "playoffSeries", "awards",
  "retiredPlayers", "hallOfFame", "events", "negotiations", "messages",
  "playerFeats", "headToHeads", "teamSeasons", "teamStats", "allStars",
  "scheduledEvents",
] as const;

export const GHOST_PLAYER = {
  pid: 0, firstName: "", lastName: "", pos: "PG", college: "",
  born: { year: 2000, loc: "" }, weight: 200, hgt: 75, tid: -1,
  imgURL: "", real: false,
  draft: { tid: -1, originalTid: -1, round: 0, pick: 0, year: 0, skills: [], pot: 0, ovr: 0 },
  ratings: [{
    hgt: 50, stre: 50, spd: 50, jmp: 50, endu: 50, ins: 50, dnk: 50,
    ft: 50, fg: 50, tp: 50, diq: 50, oiq: 50, drb: 50, pss: 50, reb: 50,
    season: 2025, pos: "PG", fuzz: 0, skills: [] as string[], ovr: 50, pot: 50,
  }],
  stats: [] as any[], injury: { type: "Healthy", gamesRemaining: 0 },
  contract: { amount: 1000, exp: 2026 },
  salaries: [] as any[], awards: [] as any[], jerseyNumber: "",
  retiredYear: null as number | null, srID: "", gamesUntilTradable: 0,
  injuries: [] as any[], moodTraits: [] as string[], numDaysFreeAgent: 0,
  ptModifier: 1, rosterOrder: 0, yearsFreeAgent: 0,
  statsTids: [] as number[], relatives: [] as any[],
  valueNoPot: 0, valueNoPotFuzz: 0, value: 0, valueFuzz: 0,
  transactions: [] as any[],
};

export const GHOST_TEAM = {
  tid: 0, cid: 0, did: 0, region: "", name: "", abbrev: "",
  imgURL: "", imgURLSmall: "", colors: ["#000000", "#ffffff", "#cccccc"],
  pop: 1, stadiumCapacity: 25000,
  budget: {
    ticketPrice: { amount: 35 },
    scouting: { amount: 50 },
    coaching: { amount: 50 },
    health: { amount: 50 },
    facilities: { amount: 50 },
  },
  strategy: "contending",
  seasons: [] as any[],
  stats: [] as any[],
  depth: undefined as any,
  adjustForInflation: true,
  disabled: false,
  keepRosterSorted: true,
  autoTicketPrice: true,
};

export const GHOST_DRAFT_PICK = {
  round: 1, pick: 0, tid: 0, originalTid: 0, season: 2025,
};

export const GHOST_GAME_ATTRIBUTES: Record<string, any> = {
  // Liga
  leagueName: "", season: 2025, startingSeason: 2025, phase: 0, nextPhase: null,
  gameOver: false, godMode: false, godModeInPast: false,
  otherTeamsWantToHire: false, lid: 0,
  // Juego
  numGames: 82, numGamesPlayoffSeries: [7, 7, 7, 7], numPlayoffByes: 0,
  numPlayoffRounds: 4, quarterLength: 12, numPeriods: 4, pace: 100,
  threePointers: true, foulsNeededToFoulOut: 6,
  foulsUntilBonus: [5, 4], elam: false, elamASG: false, elamPoints: 0,
  // Conferencias/Divisiones
  confs: [{ cid: 0, name: "Eastern" }, { cid: 1, name: "Western" }],
  divs: [
    { did: 0, cid: 0, name: "Atlantic" }, { did: 1, cid: 0, name: "Central" },
    { did: 2, cid: 0, name: "Southeast" }, { did: 3, cid: 1, name: "Northwest" },
    { did: 4, cid: 1, name: "Pacific" }, { did: 5, cid: 1, name: "Southwest" },
  ],
  // Equipos
  numActiveTeams: 30, numTeams: 30, equalizeRegions: false,
  stopOnInjury: false, stopOnInjuryGames: 20,
  aiTradesFactor: 1, aiJerseyRetirement: true,
  // Jugadores
  maxRosterSize: 15, minRosterSize: 10, numDraftRounds: 2,
  draftType: "nba2019", playersRefuseToNegotiate: true,
  rookieContractLengths: [3, 2], tragicDeathRate: 0.000001,
  brotherRate: 0.02, sonRate: 0.02, injuryRate: 1,
  hardCap: false, playerBioInfo: null,
  // Finanzas
  salaryCap: 90000, minPayroll: 60000, luxuryPayroll: 100000,
  luxuryTax: 1.5, minContract: 750, maxContract: 30000, budget: true,
  // Draft
  draftAges: [19, 22], draftPickAutoContract: true,
  // User
  userTid: 0, userTids: [0], autoDeleteOldBoxScores: true,
  hofFactor: 1, allStarGame: null,
  difficulty: 0, looseEnds: undefined,
  // Retos
  challengeNoDraftPicks: false, challengeNoFreeAgents: false,
  challengeNoRatings: false, challengeNoTrades: false,
  challengeLoseBestPlayer: false, challengeFiredLuxuryTax: false,
  challengeFiredMissPlayoffs: false,
  // Otros
  repeatSeason: undefined, ties: false, otl: false,
  spectator: false, tradeDeadline: 0.6, autoRelocate: false,
  inflationAvg: 0, inflationMax: 0, inflationMin: 0, inflationStd: 0,
  playoffsByConf: true, playoffsNumTeamsDiv: undefined,
  playIn: false, numPlayersDunk: 4, numPlayersThree: 8,
  realStats: "none", realDraftRatings: "draft",
  homeCourtAdvantage: 1, rookiesCanRefuse: true,
  sonOvr: undefined, brotherOvr: undefined,
  forceRetireAge: 0, forceRetireSeasons: 0,
  draftProspectRate: undefined, salaryCapType: "soft",
  numSeasonsFutureDraftPicks: 4,
  pointsFormula: "", randomDebutsForever: undefined,
  realPlayerDeterminism: 0, repeatSeasonType: undefined,
  riggedLottery: undefined, tradeAbovePayrollTax: false,
};

export const GHOST_LEAGUE: Record<string, any> = {
  version: 69,
  meta: { name: "" },
  players: [],
  teams: [],
  gameAttributes: [] as { key: string; value: any }[],
  draftPicks: [],
  draftLotteryResults: [],
  trade: [],
  schedule: [],
  playoffSeries: [],
  awards: [],
  retiredPlayers: [],
  hallOfFame: [],
  events: [],
  negotiations: [],
  messages: [],
  playerFeats: [],
  headToHeads: {},
  teamSeasons: [],
  teamStats: [],
  allStars: [],
  scheduledEvents: [],
};

// Player field metadata for UI rendering
export const PLAYER_FIELDS = {
  basic: [
    { key: "firstName", label: "Nombre", type: "text" },
    { key: "lastName", label: "Apellido", type: "text" },
    { key: "pos", label: "Posición", type: "select", options: ["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"] },
    { key: "age", label: "Edad", type: "number" },
    { key: "hgt", label: "Altura (in)", type: "number" },
    { key: "weight", label: "Peso (lbs)", type: "number" },
    { key: "jerseyNumber", label: "Jersey #", type: "text" },
    { key: "college", label: "College", type: "text" },
    { key: "imgURL", label: "Img URL", type: "text" },
  ],
  born: [
    { key: "year", label: "Año nacimiento", type: "number" },
    { key: "loc", label: "Lugar nacimiento", type: "text" },
  ],
  contract: [
    { key: "amount", label: "Salario ($K)", type: "number" },
    { key: "exp", label: "Expiración", type: "number" },
  ],
  ratings: [
    "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp",
    "oiq", "diq", "drb", "pss", "reb", "ovr", "pot",
  ],
  ratingLabels: {
    hgt: "Altura", stre: "Fuerza", spd: "Velocidad", jmp: "Salto",
    endu: "Resistencia", ins: "Interior", dnk: "Mates", ft: "Tiros libres",
    fg: "Tiro medio", tp: "Triples", oiq: "IQ Ofensivo", diq: "IQ Defensivo",
    drb: "Dribling", pss: "Pases", reb: "Rebotes", ovr: "Overall", pot: "Potencial",
  } as Record<string, string>,
  advanced: [
    { key: "pid", label: "PID", type: "number" },
    { key: "real", label: "Real", type: "boolean" },
    { key: "srID", label: "SR ID", type: "text" },
    { key: "retiredYear", label: "Año retiro", type: "number" },
    { key: "gamesUntilTradable", label: "Juegos hasta tradeable", type: "number" },
    { key: "numDaysFreeAgent", label: "Días FA", type: "number" },
    { key: "ptModifier", label: "PT Modifier", type: "number" },
    { key: "rosterOrder", label: "Orden en roster", type: "number" },
    { key: "yearsFreeAgent", label: "Años FA", type: "number" },
  ],
  draft: [
    { key: "tid", label: "Equipo draft", type: "number" },
    { key: "originalTid", label: "Equipo original", type: "number" },
    { key: "round", label: "Ronda", type: "number" },
    { key: "pick", label: "Pick", type: "number" },
    { key: "year", label: "Año", type: "number" },
    { key: "ovr", label: "OVR en draft", type: "number" },
    { key: "pot", label: "POT en draft", type: "number" },
  ],
  injury: [
    { key: "type", label: "Tipo de lesión", type: "text" },
    { key: "gamesRemaining", label: "Juegos restantes", type: "number" },
  ],
};

// Team field metadata for UI rendering
export const TEAM_FIELDS = {
  basic: [
    { key: "region", label: "Región", type: "text" },
    { key: "name", label: "Nombre", type: "text" },
    { key: "abbrev", label: "Abreviación", type: "text" },
    { key: "tid", label: "TID", type: "number" },
    { key: "cid", label: "Conference ID", type: "number" },
    { key: "did", label: "Division ID", type: "number" },
    { key: "pop", label: "Población (M)", type: "number" },
    { key: "stadiumCapacity", label: "Capacidad estadio", type: "number" },
    { key: "strategy", label: "Estrategia", type: "select", options: ["contending", "rebuilding"] },
    { key: "imgURL", label: "Logo URL", type: "text" },
    { key: "imgURLSmall", label: "Logo pequeño URL", type: "text" },
  ],
  advanced: [
    { key: "adjustForInflation", label: "Ajustar inflación", type: "boolean" },
    { key: "disabled", label: "Deshabilitado", type: "boolean" },
    { key: "keepRosterSorted", label: "Mantener roster ordenado", type: "boolean" },
    { key: "autoTicketPrice", label: "Precio boleto auto", type: "boolean" },
  ],
  budget: [
    { key: "ticketPrice", label: "Precio boleto ($)", type: "number" },
    { key: "scouting", label: "Scouting", type: "number" },
    { key: "coaching", label: "Coaching", type: "number" },
    { key: "health", label: "Salud", type: "number" },
    { key: "facilities", label: "Instalaciones", type: "number" },
  ],
};

// Sections that map to top-level keys 
export const SECTION_MAP: { key: string; tab: string; label: string; icon: string }[] = [
  { key: "players", tab: "players", label: "Jugadores", icon: "Users" },
  { key: "teams", tab: "teams", label: "Equipos", icon: "Trophy" },
  { key: "draftPicks", tab: "draft", label: "Draft", icon: "ListOrdered" },
  { key: "gameAttributes", tab: "settings", label: "Configuración", icon: "Settings" },
  { key: "awards", tab: "awards", label: "Premios", icon: "Award" },
  { key: "events", tab: "trades", label: "Trades/Eventos", icon: "ArrowLeftRight" },
  { key: "playoffSeries", tab: "seasons", label: "Historial", icon: "Calendar" },
  { key: "retiredPlayers", tab: "retired", label: "Retirados", icon: "UserMinus" },
  { key: "hallOfFame", tab: "halloffame", label: "Hall of Fame", icon: "Crown" },
  { key: "messages", tab: "messages", label: "Mensajes", icon: "MessageSquare" },
  { key: "negotiations", tab: "negotiations", label: "Negociaciones", icon: "Handshake" },
  { key: "scheduledEvents", tab: "scheduledevents", label: "Eventos Programados", icon: "CalendarClock" },
];

// Validation ranges for BBGM
export const VALIDATION_RULES: Record<string, { min?: number; max?: number; type?: string }> = {
  "player.ratings.hgt": { min: 0, max: 100 },
  "player.ratings.stre": { min: 0, max: 100 },
  "player.ratings.spd": { min: 0, max: 100 },
  "player.ratings.jmp": { min: 0, max: 100 },
  "player.ratings.endu": { min: 0, max: 100 },
  "player.ratings.ins": { min: 0, max: 100 },
  "player.ratings.dnk": { min: 0, max: 100 },
  "player.ratings.ft": { min: 0, max: 100 },
  "player.ratings.fg": { min: 0, max: 100 },
  "player.ratings.tp": { min: 0, max: 100 },
  "player.ratings.oiq": { min: 0, max: 100 },
  "player.ratings.diq": { min: 0, max: 100 },
  "player.ratings.drb": { min: 0, max: 100 },
  "player.ratings.pss": { min: 0, max: 100 },
  "player.ratings.reb": { min: 0, max: 100 },
  "player.ratings.ovr": { min: 0, max: 100 },
  "player.ratings.pot": { min: 0, max: 100 },
  "player.age": { min: 15, max: 55 },
  "player.hgt": { min: 60, max: 96 },
  "player.weight": { min: 130, max: 400 },
  "player.contract.amount": { min: 0, max: 500000 },
  "team.pop": { min: 0, max: 50 },
  "team.stadiumCapacity": { min: 0, max: 100000 },
};
