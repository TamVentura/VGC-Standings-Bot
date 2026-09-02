import { ITournament } from "./interfaces/tournament-interface";
import { JSONManager } from "./json-manager";

export class Tournament {
  private jsonManager: JSONManager;
  constructor(public tournament: ITournament) {
    this.start();
  }

  private start() {
    this.jsonManager = new JSONManager(this.tournament);
  }

  endTournament() {
    this.jsonManager?.endTournament();
  }
}
