import { EmbedBuilder } from "discord.js";
import { configManager } from "../config/config-manager";
import { IPlayer } from "../interfaces/player-interface";
import { bot } from "../main";
import { chunkByCharLimit, cleanPlayerName } from "../utils/function-utils";
import { filterTugaPlayers } from "../utils/player-utils";
import { getRound } from "../utils/round";
import { GCEvent } from "./gc-event";

export class NewRoundEvent extends GCEvent {
  private oldRound: string = "";

  public async newData(data: IPlayer[]): Promise<void> {
    if (!data || data.length === 0) return;

    const currentRound = getRound(data);
    if(!currentRound) return;
    const players = filterTugaPlayers(data);

    if (this.oldRound === currentRound) {
      return;
    }

    this.oldRound = currentRound;

    if (!this.playersPlaying(players, currentRound)) return;

    await bot.sendEmbed(this.createEmbed(players, currentRound));
  }

  private playersPlaying(players: IPlayer[], round: string): boolean {
    return players.some((p) => round in p.rounds);
  }

  public createEmbed(players: IPlayer[], round: string): EmbedBuilder[] {
    const sorted = [...filterTugaPlayers(players)].sort(
      (a, b) => a.placing - b.placing,
    );

    const lines = sorted
      .filter((p) => round in p.rounds)
      .map((p) => {
        return this.formatLine(p, round);
      });

    const chunks = chunkByCharLimit(lines);

    const url = this.tournament.code
      ? configManager.origin_url + `${this.tournament.code}/`
      : undefined;

    const embeds = chunks.map((value, i) => {
      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${this.tournament.name} — Nova ronda ${round}`)
        .setColor(0x5865f2)
        .setDescription("Nova ronda disponível! Aqui estão os matchups")
        .addFields({
          name:
            chunks.length > 1
              ? `━━━━━━━━ MATCHUPS ━━━━━━━━ (${i + 1}/${chunks.length})`
              : `━━━━━━━━ MATCHUPS ━━━━━━━━`,
          value: value || "Sem jogadores Tugas restantes.",
        })
        .setTimestamp(new Date());

      if (url) embed.setURL(url);
      return embed;
    });

    return embeds;
  }

  private formatLine(player: IPlayer, round: string): string {
    const roundData = player.rounds[round];
    const record = `\`${player.record.wins}-${player.record.losses}-${player.record.ties}\``;
    return ` **${cleanPlayerName(player.name)}** ${record} x ${cleanPlayerName(roundData.name)} •  #${player.placing}`;
  }
}
