export interface IPlayerRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface IPlayerResistances {
  self: number;
  opp: number;
  oppopp: number;
}

export interface IPlayerRound {
  name: string;
  result: string;
  table: string;
}

export interface IPlayer {
  name: string;
  placing: number;
  record: IPlayerRecord;
  resistances: IPlayerResistances;
  decklist: string;
  drop: number;
  rounds: Record<string, IPlayerRound>;
}
