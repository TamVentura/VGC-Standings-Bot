import { first } from "rxjs";
import { DiscordBot } from "./discord-bot";
import { TournamentManager } from "./tournament-manager";
import { logError } from "./utils/log-utils";

process.on("unhandledRejection", (reason) => {
  logError("Unhandled rejection", reason);
});

export const bot = new DiscordBot();

bot.isReady.pipe(first()).subscribe(() => {
  new TournamentManager(bot).start();
});
