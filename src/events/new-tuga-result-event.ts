import { EmbedBuilder, Message } from "discord.js";
import { configManager } from "../config/config-manager";
import { IPlayer } from "../interfaces/player-interface";
import { bot } from "../main";
import {
  chunkByCharLimit,
  cleanPlayerName,
  lastChildOf,
} from "../utils/function-utils";
import { filterTugaPlayers } from "../utils/player-utils";
import { getRound } from "../utils/round";
import { GCEvent } from "./gc-event";

export class NewTugaResultEvent extends GCEvent {
  private oldResults: IPlayer[] = [];
  private oldRoundMessage: Message<true> | null = null;
  private currentRound: string = "";

  public async newData(data: IPlayer[]): Promise<void> {
    const tugaPlayers = filterTugaPlayers(data);
    if (tugaPlayers.length === 0) return;
    const updatedTugaNames: string[] = this.getUpdatedTugaNames(tugaPlayers);
    if (updatedTugaNames.length === 0) return;

    const round = getRound(tugaPlayers);
    if (!round) return;
    if (round !== this.currentRound) {
      this.oldRoundMessage = null;
    }

    if (round === this.currentRound && updatedTugaNames.length === 0) return;

    if (this.oldRoundMessage) {
      this.oldRoundMessage.delete();
    }

    this.oldRoundMessage = await bot.sendEmbed(
      this.buildResultsEmbed(tugaPlayers, updatedTugaNames),
    );

    this.oldResults = tugaPlayers;
    this.currentRound = round;
  }

  private getUpdatedTugaNames(newPlayers: IPlayer[]): string[] {
    const result: string[] = [];

    for (const player of newPlayers) {
      const oldPlayer = this.oldResults.find((p) => p.name === player.name);
      if (!oldPlayer) {
        result.push(player.name);
        continue;
      }
      if (
        oldPlayer.record.wins !== player.record.wins ||
        oldPlayer.record.losses !== player.record.losses ||
        oldPlayer.record.ties !== player.record.ties
      ) {
        result.push(player.name);
        continue;
      }
    }
    return result;
  }

  private buildResultsEmbed(
    players: IPlayer[],
    updatedTugaNames: string[],
  ): EmbedBuilder[] {
    const round = getRound(players);
    if (!round) return [];
    const sorted = [...players].sort((a, b) => a.placing - b.placing);

    const lines = sorted.map((p) => {
      return this.formatLine(p, updatedTugaNames);
    });

    const chunks = chunkByCharLimit(lines);

    const url = this.tournament.code
      ? configManager.origin_url + `${this.tournament.code}/`
      : undefined;

    const embeds = chunks.map((value, i) => {
      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${this.tournament.name} — Ronda ${round}`)
        .setColor(0x5865f2)
        .setDescription(
          `Jogadores atualizados: **${updatedTugaNames.length}** | Jogos finalizados **${players.filter((el) => el.rounds[round] && el.rounds[round].result != null).length}** / **${players.filter((el) => el.drop === -1).length}**\n\n✅ Vitória (wins↑) • ❌ Derrota (losses↑) • ⏳ A jogar • 🏳️ Desistiu`,
        )
        .addFields({
          name:
            chunks.length > 1
              ? `📊 ━━━━━━━━ RESULTADOS ━━━━━━━━ (${i + 1}/${chunks.length})`
              : `📊 ━━━━━━━━ RESULTADOS ━━━━━━━━`,
          value: value || "Sem jogadores Tugas restantes.",
        })
        .setTimestamp(new Date());

      if (url) embed.setURL(url);
      return embed;
    });
    return embeds;
  }

  private formatLine(player: IPlayer, updatedTugaNames: string[]): string {
    const isUpdated = updatedTugaNames.includes(player.name);
    let statusIcon: string = this.buildIcon(player);

    const recordText = `${player.record.wins}-${player.record.losses}-${player.record.ties}`;
    const record = isUpdated ? `**\`${recordText}\`**` : `\`${recordText}\``;

    const line = `${statusIcon} **${cleanPlayerName(player.name)}**  ${record}  •  #${player.placing}`;

    return line;
  }

  private buildIcon(player: IPlayer): string {
    if (player.drop !== -1) {
      return "🏳️";
    }
    if (!player || !player.rounds || !Object.keys(player.rounds) || Object.keys(player.rounds).length === 0) {
      throw new Error(`Player ${player.name} has no rounds data.`);
    }
    const roundData = lastChildOf(Object.values(player.rounds))!;
    if (roundData.result === "W") {
      return "✅";
    } else if (roundData.result === "L") {
      return "❌";
    } else if (roundData.result === "T") {
      return "🤝";
    } else {
      return "⏳";
    }
  }
}
