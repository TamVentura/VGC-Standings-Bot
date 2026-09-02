import { logError } from "./utils/log-utils";

export class StateManager {
  private sentTournaments: string[] = [];

  constructor() {
    this.loadSentTournaments();
  }

  public hasSentFinalStandings(code: string): boolean {
    return this.sentTournaments.includes(code);
  }

  public markFinalStandingsSent(code: string) {
    if (this.sentTournaments.includes(code)) return;

    this.sentTournaments.push(code);
    this.saveSentTournaments();
  }

  private loadSentTournaments() {
    const stateFile = process.env.STATE_FILE;
    if (!stateFile) return;

    const fs = require("fs");
    if (!fs.existsSync(stateFile)) return;

    try {
      const data: string = fs.readFileSync(stateFile, "utf-8");
      this.sentTournaments.push(
        ...data
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
      );
    } catch (err) {
      logError(`Read state from ${stateFile}`, err);
    }
  }

  private saveSentTournaments() {
    const stateFile = process.env.STATE_FILE;
    if (!stateFile) return;

    const fs = require("fs");
    try {
      fs.writeFileSync(
        stateFile,
        this.sentTournaments.map((line) => line + "\n").join(""),
        "utf-8",
      );
    } catch (err) {
      logError(`Write state to ${stateFile}`, err);
    }
  }
}

export const stateManager = new StateManager();
