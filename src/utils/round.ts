import { IPlayer } from "../interfaces/player-interface";
import { lastChildOf } from "./function-utils";

export function getRound(players: IPlayer[]): string | null {
  if (
    players.length === 0 ||
    !players[0].rounds ||
    !Object.keys(players[0].rounds) ||
    Object.keys(players[0].rounds).length === 0
  )
    return null;
  return lastChildOf(Object.keys(players[0].rounds))!;
}

export function getMaxRound(players: IPlayer[]): string | null {
  const rounds: number[] = [];

  for (const player of players) {
    if (!player.rounds) continue;

    rounds.push(...Object.keys(player.rounds).map(Number));
  }

  if (rounds.length === 0) return null;

  return String(Math.max(...rounds));
}

export function getRoundPlayers(players: IPlayer[], round: string): IPlayer[] {
  return players.filter((p) => {
    return !!p.rounds && round in p.rounds;
  });
}
