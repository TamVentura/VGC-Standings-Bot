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
