import { IPlayer } from "../interfaces/player-interface";
import { lastChildOf } from "./function-utils";

export function getRound(players: IPlayer[]): string {
  return lastChildOf(Object.keys(players[0].rounds));
}
