import { EmbedBuilder } from "discord.js";
import { configManager } from "../config/config-manager";
import { IPlayer } from "../interfaces/player-interface";
import { bot } from "../main";
import { chunkByCharLimit, cleanPlayerName } from "../utils/function-utils";
import {
  filterTugaPlayers,
  getRecordString,
  hasPlayerDropped,
} from "../utils/player-utils";
import { getRound } from "../utils/round";
import { GCEvent } from "./gc-event";

export class RoundEndedEvent extends GCEvent {
  private oldRecords: IPlayer[] = [];

  public async newData(data: IPlayer[]): Promise<void> {
    if (!data || data.length === 0) return;

    const round = getRound(data);
    const players = filterTugaPlayers(data);

    if (!round) return;

    if (!this.roundEnded(data, round)) {
      return;
    }

    await bot.sendEmbed(this.createEmbed(players, round));
    this.oldRecords = players;
  }

  private roundEnded(data: IPlayer[], round: string) {
    return data.every((p) =>
      round in p.rounds ? p.rounds[round].result !== null : true,
    );
  }

  private getStandingUpdate(player: IPlayer): number | null {
    if (hasPlayerDropped(player)) return null;
    const oldRecord = this.oldRecords.find((old) => old.name === player.name);
    if (!oldRecord) return 0;
    return oldRecord.placing - player.placing;
  }

  private createEmbed(players: IPlayer[], round: string): EmbedBuilder[] {
    const sorted = [...players].sort((a, b) => a.placing - b.placing);

    const lines = sorted
      .filter((p) => round in p.rounds)
      .map((p) => {
        return this.formatLine(p);
      });

    const chunks = chunkByCharLimit(lines);
    const url = this.tournament.code
      ? configManager.origin_url + `${this.tournament.code}/`
      : undefined;

    const embeds = chunks.map((value, i) => {
      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${this.tournament.name} — Ronda finalizada ${round}`)
        .setColor(0x5865f2)
        .setDescription("Ronda finalizada, aqui estão os standings.")
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

  private formatLine(player: IPlayer): string {
    return ` ${this.getStandingIcon(player)} **#${player.placing}** • **${cleanPlayerName(player.name)}** ${getRecordString(player)}`;
  }

  private getStandingIcon(player: IPlayer): string {
    const change = this.getStandingUpdate(player);
    if (change === null) return "🟡";
    if (change > 0) return "⬆️";
    if (change === 0) return "↔️";
    if (change < 0) return "⬇️";
  }
}
