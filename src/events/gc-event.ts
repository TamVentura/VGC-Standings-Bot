import { IPlayer } from "../interfaces/player-interface";
import { ITournament } from "../interfaces/tournament-interface";

export abstract class GCEvent {
  constructor(protected tournament: ITournament) {}
  public abstract newData(data: IPlayer[]): void;
}
