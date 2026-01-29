import { first } from "rxjs";
import { DiscordBot } from "./discord-bot";
import { TournamentManager } from "./tournament-manager";

export const bot = new DiscordBot();

bot.isReady.pipe(first()).subscribe(() => {
  new TournamentManager(bot).start();
});