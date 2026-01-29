import { scheduleJob } from "node-schedule";
import { configManager } from "./config/config-manager";
import { DiscordBot } from "./discord-bot";
import { ITournament } from "./interfaces/tournament-interface";
import { Tournament } from "./tournament";
import { fetchTodaysTournaments } from "./utils/scrap-tournaments";

export class TournamentManager {
  private tournaments: Record<string, Tournament> = {};

  constructor(private bot: DiscordBot) {}

  start() {
    this.fetchTournaments();
    scheduleJob("0 0 * * *", () => {
      this.fetchTournaments();
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
