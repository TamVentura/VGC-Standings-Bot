import { createHash } from "crypto";
import { configManager } from "./config/config-manager";
import { GCEvent } from "./events/gc-event";
import { NewRoundEvent } from "./events/new-round-event";
import { NewTugaResultEvent } from "./events/new-tuga-result-event";
import { RoundEndedEvent } from "./events/tournament-ends-event";
import { IPlayer } from "./interfaces/player-interface";
import { ITournament } from "./interfaces/tournament-interface";
import { JSONWatcher } from "./json-watcher";
import { filterTugaPlayers } from "./utils/player-utils";

export class JSONManager {
  private jsonWatcher: JSONWatcher<any>;
  private oldHash: string = "";
  private events: GCEvent[] = [];

  constructor(private tournament: ITournament) {
    this.events = [
      new NewRoundEvent(this.tournament),
      new NewTugaResultEvent(this.tournament),
      new RoundEndedEvent(this.tournament),
    ];

    const url =
      configManager.origin_url +
      `${tournament.code}/masters/${tournament.code}_Masters.json`;
    this.jsonWatcher = new JSONWatcher<IPlayer[]>(url, this.onChage.bind(this));
    this.jsonWatcher.start();
  }

  private stop() {
    this.jsonWatcher?.stop();
  }

  private hash(data: IPlayer[]): string {
    return createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  private async onChage(data: IPlayer[]) {
    if (filterTugaPlayers(data).length === 0) {
      this.stop();
      return;
    }
    const newHash = this.hash(data);
    if (this.oldHash === newHash) return;

    this.oldHash = newHash;

    for (const event of this.events) {
      await event.newData(data);
    }
  }

  public async endTournament() {
    this.stop();
    const data = await this.jsonWatcher.getData();
  }

  public;
}
