import { configManager } from "../config/config-manager";
import { IPlayer } from "../interfaces/player-interface";

export function filterTugaPlayers(players: IPlayer[]): IPlayer[] {
  return players.filter(
    (el) =>
      el.name.endsWith("[PT]") ||
      configManager.extraPlayers
        .map((el) => el.toLowerCase())
        .includes(el.name.toLowerCase()),
  );
}

export function getRecordString(player: IPlayer): string {
  return `\`${player.record.wins}-${player.record.losses}-${player.record.ties}\``;
}

export function hasPlayerDropped(player: IPlayer): boolean {
  return player.drop !== -1;
}
