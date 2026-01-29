export class ConfigManager {
  public readonly extraPlayers: string[] = [];
  public origin_url: string;
  public intervalMs: number = 10_000;
  public discordToken: string;
  public channelId: string;
  public askId: string;

  constructor() {
    this.loadConfig();
  }
  private loadConfig() {
    this.origin_url =
      process.env.ORIGIN_URL && process.env.ORIGIN_URL.endsWith("/")
        ? process.env.ORIGIN_URL
        : process.env.ORIGIN_URL + "/";
    this.intervalMs = Number(process.env.INTERVAL_MS) || 30_000;
    this.discordToken = process.env.DISCORD_TOKEN;
    this.channelId = process.env.CHANNEL_ID;

    if (!this.origin_url) {
      throw new Error("Missing ORIGIN_URL environment variables");
    } else if (!this.discordToken) {
      throw new Error("Missing DISCORD_TOKEN environment variables");
    } else if (!this.channelId) {
      throw new Error("Missing CHANNEL_ID environment variables");
    }

    this.loadExtraPlayers();
  }

  private loadExtraPlayers() {
    const extraPlayersFile = process.env.EXTRA_PLAYERS_FILE;
    if (extraPlayersFile) {
      const fs = require("fs");
      try {
        const data = fs.readFileSync(extraPlayersFile, "utf-8");
        this.extraPlayers.push(
          ...data
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        );
      } catch (err) {
        console.error(
          `Error reading extra players from file ${extraPlayersFile}:`,
          err,
        );
      }
    }
  }

  public addExtraPlayer(playerName: string) {
    if (!this.extraPlayers.includes(playerName)) {
      this.extraPlayers.push(playerName);
      this.saveExtraPlayers();
    }
  }

  public removeExtraPlayer(playerName: string) {
    const index = this.extraPlayers.indexOf(playerName);
    if (index !== -1) {
      this.extraPlayers.splice(index, 1);
      this.saveExtraPlayers();
    }
  }

  private saveExtraPlayers() {
    const extraPlayersFile = process.env.EXTRA_PLAYERS_FILE;
    if (extraPlayersFile) {
      const fs = require("fs");
      try {
        fs.writeFileSync(
          extraPlayersFile,
          this.extraPlayers.map((line) => line + "\n").join(""),
          "utf-8",
        );
      } catch (err) {
        console.error(
          `Error writing extra players to file ${extraPlayersFile}:`,
          err,
        );
      }
    }
  }
}

export const configManager = new ConfigManager();
