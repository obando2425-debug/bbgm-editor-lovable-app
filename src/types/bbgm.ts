// Types for Basketball GM JSON structure
export interface BBGMPlayer {
  firstName: string;
  lastName: string;
  age?: number;
  pos?: string;
  hgt?: number;
  weight?: number;
  imgURL?: string;
  born?: { year?: number; loc?: string };
  college?: string;
  tid?: number;
  contract?: { amount?: number; exp?: number };
  draft?: { year?: number; round?: number; pick?: number; tid?: number };
  ratings?: BBGMRating[];
  stats?: any[];
  injury?: { type?: string; gamesRemaining?: number };
  salaries?: any[];
  awards?: any[];
  jerseyNumber?: string;
  [key: string]: any;
}

export interface BBGMRating {
  season?: number;
  hgt?: number;
  stre?: number;
  spd?: number;
  jmp?: number;
  endu?: number;
  ins?: number;
  dnk?: number;
  ft?: number;
  fg?: number;
  tp?: number;
  oiq?: number;
  diq?: number;
  drb?: number;
  pss?: number;
  reb?: number;
  ovr?: number;
  pot?: number;
  [key: string]: any;
}

export interface BBGMTeam {
  tid: number;
  cid?: number;
  did?: number;
  region: string;
  name: string;
  abbrev: string;
  imgURL?: string;
  imgURLSmall?: string;
  colors?: string[];
  pop?: number;
  stadiumCapacity?: number;
  budget?: any;
  strategy?: string;
  [key: string]: any;
}

export interface BBGMDraftPick {
  round: number;
  pick?: number;
  tid: number;
  originalTid: number;
  season: number | "fantasy";
  [key: string]: any;
}

export interface BBGMGameAttributes {
  phase?: number;
  season?: number;
  startingSeason?: number;
  leagueName?: string;
  numGames?: number;
  numGamesPlayoffSeries?: number[];
  numPlayoffByes?: number;
  confs?: { cid: number; name: string }[];
  divs?: { did: number; cid: number; name: string }[];
  salaryCap?: number;
  minPayroll?: number;
  luxuryPayroll?: number;
  luxuryTax?: number;
  minContract?: number;
  maxContract?: number;
  [key: string]: any;
}

export interface BBGMLeague {
  version?: number;
  startingSeason?: number;
  players?: BBGMPlayer[];
  teams?: BBGMTeam[];
  draftPicks?: BBGMDraftPick[];
  gameAttributes?: BBGMGameAttributes | Record<string, any>;
  trade?: any;
  meta?: any;
  [key: string]: any;
}
