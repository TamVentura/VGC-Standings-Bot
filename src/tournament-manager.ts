import { scheduleJob } from "node-schedule";
import { configManager } from "./config/config-manager";
import { DiscordBot } from "./discord-bot";
import { ITournament } from "./interfaces/tournament-interface";
import { Tournament } from "./tournament";
import { logError } from "./utils/log-utils";
import { fetchTodaysTournaments } from "./utils/scrap-tournaments";

export class TournamentManager {
  private tournaments: Record<string, Tournament> = {};

  constructor(private bot: DiscordBot) {}

  start() {
    this.runFetch();

    scheduleJob("0 0 * * *", () => {
      this.runFetch();
    });
  }

  private runFetch() {
    this.fetchTournaments().catch((err) => {
      logError(`Fetch today's tournaments (${configManager.origin_url})`, err);
    });
  }

  async fetchTournaments() {
    const todayTourns: ITournament[] = await fetchTodaysTournaments(
      configManager.origin_url,
    );

    for (const tourn of todayTourns) {
      if (!this.tournaments[tourn.code]) {
        this.tournaments[tourn.code] = new Tournament(tourn);
      }
    }

    for (const tourn of Object.values(this.tournaments)) {
      if (!todayTourns.find((t) => t.code === tourn.tournament.code)) {
        this.removeTournament(tourn.tournament.code);
      }
    }
  }

  removeTournament(id: string) {
    this.tournaments[id]?.endTournament();
    delete this.tournaments[id];
  }
}
