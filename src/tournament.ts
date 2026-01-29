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

  private stop() {
    this.jsonManager?.stop();
  }

  endTournament() {
    this.stop();
    this.jsonManager.endTournamet();
  }
}
