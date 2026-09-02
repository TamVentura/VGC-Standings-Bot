import { EmbedBuilder } from "discord.js";
import { configManager } from "../config/config-manager";
import { IPlayer } from "../interfaces/player-interface";
import { bot } from "../main";
import { stateManager } from "../state-manager";
import {
  chunkByCharLimit,
  cleanPlayerNameWithCountry,
} from "../utils/function-utils";
import {
  filterTugaPlayers,
  getRecordString,
  hasPlayerDropped,
} from "../utils/player-utils";
import { getMaxRound, getRoundPlayers } from "../utils/round";
import { GCEvent } from "./gc-event";

const TOP_SIZE = 16;

export class FinalStandingsEvent extends GCEvent {
  public async newData(data: IPlayer[]): Promise<void> {
    if (!data || data.length === 0) return;

    if (stateManager.hasSentFinalStandings(this.tournament.code)) return;

    if (!this.tournamentEnded(data)) return;

    await bot.sendEmbed(this.createEmbed(data));

    stateManager.markFinalStandingsSent(this.tournament.code);
  }

  private tournamentEnded(data: IPlayer[]): boolean {
    const maxRound = getMaxRound(data);
    if (!maxRound) return false;

    const finalists = getRoundPlayers(data, maxRound);
    if (finalists.length !== 2) return false;

    return finalists.every((p) => {
      return p.rounds[maxRound].result !== null;
    });
  }

  private createEmbed(data: IPlayer[]): EmbedBuilder[] {
    const topLines = this.buildTopLines(data);
    if (topLines.length === 0) return [];

    const chunks = chunkByCharLimit(this.buildTugaLines(data));
    const values = chunks.length > 0 ? chunks : [""];

    const embeds = values.map((value, i) => {
      return this.buildEmbed(topLines, value, i, values.length);
    });

    return embeds;
  }

  private buildEmbed(
    topLines: string[],
    tugaValue: string,
    index: number,
    total: number,
  ): EmbedBuilder {
    const url = this.tournament.code
      ? configManager.origin_url + `${this.tournament.code}/`
      : undefined;

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${this.tournament.name} — Resultado final`)
      .setColor(0x5865f2)
      .setDescription("O torneio terminou! Aqui está o resultado final.")
      .setTimestamp(new Date());

    if (index === 0) {
      embed.addFields({
        name: `━━━━━━━━ TOP ${TOP_SIZE} ━━━━━━━━`,
        value: chunkByCharLimit(topLines)[0],
      });
    }

    embed.addFields({
      name:
        total > 1
          ? `━━━━━━━━ TUGAS ━━━━━━━━ (${index + 1}/${total})`
          : `━━━━━━━━ TUGAS ━━━━━━━━`,
      value: tugaValue || "Sem jogadores Tugas.",
    });

    if (url) embed.setURL(url);

    return embed;
  }

  private buildTopLines(data: IPlayer[]): string[] {
    const sorted = [...data].sort((a, b) => a.placing - b.placing);

    const lines = sorted.slice(0, TOP_SIZE).map((p) => {
      return this.formatLine(p);
    });

    return lines;
  }

  private buildTugaLines(data: IPlayer[]): string[] {
    const sorted = [...filterTugaPlayers(data)].sort(
      (a, b) => a.placing - b.placing,
    );

    const lines = sorted.map((p) => {
      return this.formatLine(p);
    });

    return lines;
  }

  private formatLine(player: IPlayer): string {
    const name = cleanPlayerNameWithCountry(player.name);
    const record = getRecordString(player);

    const line = ` ${this.getPlacingIcon(player)} **#${player.placing}** • **${name}** ${record}`;

    return line;
  }

  private getPlacingIcon(player: IPlayer): string {
    if (hasPlayerDropped(player)) return "🏳️";
    if (player.placing === 1) return "🥇";
    if (player.placing === 2) return "🥈";
    if (player.placing === 3) return "🥉";
    return "▫️";
  }
}
