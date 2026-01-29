import dotenv from "dotenv";
import * as fs from "fs";
import { IPlayer } from "./src/interfaces/player-interface";
import { lastChildOf } from "./src/utils/function-utils";

const prompt = require("prompt-async");
console.log(prompt);
dotenv.config({ path: ".env.test" });
console.log("a");

const data: IPlayer[] = Array.from({ length: 11 }, (_, i) => {
  const countryCode =
    i % 2 === 0
      ? "PT"
      : ["ES", "FR", "DE", "IT"][Math.floor(Math.random() * 4)];
  const name = `Player ${i + 1} [${countryCode}]`;
  const player: IPlayer = {
    name,
    placing: i + 1,
    record: {
      wins: 0,
      losses: 0,
      ties: 0,
    },
    resistances: {
      self: 0,
      opp: 0,
      oppopp: 0,
    },
    decklist: "",
    drop: -1,
    rounds: {},
  };
  return player;
});

const express = require("express");
const app = express();
const port = 7144;

app.get("/standingsVGC/", (req, res) => {
  try {
    console.log("HERE");
    res.send(fs.readFileSync("./testHtml.html"));
  } catch (e) {
    console.error(e);
  }
});

app.get("/standingsVGC/1/masters/1_Masters.json", (req, res) => {
  try {
    res.send(JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
});
app.get("/", (req, res) => {
  return "a";
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
(async () => {
  console.log("HERE");
  require("./src/main.ts");
  console.log("HERE");
})();

(async () => {
  prompt.start();
  while (true) {
    let { command }: { command: string } = await prompt.get(["command"]);
    command = command.toLowerCase();
    if (command === "newround") {
      newRound();
    } else if (command === "log") {
      console.log(data);
    } else if (command === "endround") {
      endRoundMatches();
    } else if (command === "endmatch") {
      const { playerNum, result } = await prompt.get(["playerNum", "result"]);
      endPlayerMatch(playerNum, result);
    }
  }
})();

function newRound() {
  if (
    data.some(
      (el) =>
        el.drop === -1 && lastChildOf(Object.values(el.rounds))?.result == null,
    )
  ) {
    endRoundMatches();
  }

  data.forEach((el) => {
    if (el.drop === -1 && el.record.losses >= 3 && Math.random() < 0.5) {
      el.drop = 1;
    }
  });

  const playersSortedByRecord = [...data.filter((el) => el.drop === -1)].sort(
    (a, b) => {
      if (a.record.wins !== b.record.wins) {
        return b.record.wins - a.record.wins;
      }
      if (a.record.losses !== b.record.losses) {
        return a.record.losses - b.record.losses;
      }
      if (a.record.ties !== b.record.ties) {
        return b.record.ties - a.record.ties;
      }
      return a.placing - b.placing;
    },
  );


  const roundKey =
    Number.parseInt(
      lastChildOf(Object.keys(playersSortedByRecord[0].rounds)) ?? "0",
    ) + 1;

  for (let i = 0; i <= playersSortedByRecord.length - 1; i += 2) {
    const p1 = playersSortedByRecord[i];

    if (i + 1 >= playersSortedByRecord.length) {
      console.log("UGABUGA");
      p1.rounds[roundKey] = {
        name: "BYE",
        table: "1",
        result: "W",
      };
      p1.record.wins++;
      continue
    }

    const p2 = playersSortedByRecord[i + 1];

    p1.rounds[roundKey] = {
      name: p2.name,
      table: "1",
      result: null,
    };
    p2.rounds[roundKey] = {
      name: p1.name,
      table: "1",
      result: null,
    };
  }
}

/**
 * Ends all matches in the current round by randomly assigning wins and losses
 * When a player wins against an opponent:
 * - Winner: wins increment in both record and round result
 * - Loser: losses increment in both record and round result
 */
function endRoundMatches() {
  const round = lastChildOf(Object.keys(data[0].rounds));
  if (!round) {
    console.log("No active round found");
    return;
  }

  const processedMatches = new Set<string>();

  for (const player of data) {
    if (!(round in player.rounds)) continue;

    const roundData = player.rounds[round];

    // Skip if already has a result or if opponent is BYE
    if (roundData.result !== null || roundData.name === "BYE") continue;

    // Create a unique match identifier (sorted to avoid duplicates)
    const opponentName = roundData.name;
    const matchId = [player.name, opponentName].sort().join("|");

    // Skip if we already processed this match
    if (processedMatches.has(matchId)) continue;

    processedMatches.add(matchId);

    // Randomly determine winner (50/50 chance)
    const playerWins = Math.random() < 0.5;

    // Find opponent
    const opponent = data.find((p) => p.name === opponentName);

    if (!opponent || !(round in opponent.rounds)) continue;

    // Update player result
    if (playerWins) {
      player.rounds[round].result = "W";
      player.record.wins++;

      opponent.rounds[round].result = "L";
      opponent.record.losses++;
    } else {
      player.rounds[round].result = "L";
      player.record.losses++;

      opponent.rounds[round].result = "W";
      opponent.record.wins++;
    }
  }

  calculateResistances();

  console.log(`Round ${round} ended!`);
}

/**
 * Calculates resistances for all players
 * - self: Sum of wins of all opponents faced (Strength of Schedule)
 * - opp: Sum of wins of all opponents' opponents faced (Opponent's SOS)
 * - oppopp: Sum of wins of all opponents' opponents' opponents faced
 */
function calculateResistances() {
  for (const player of data) {
    let selfResistance = 0;
    let oppResistance = 0;
    let oppoppResistance = 0;

    // Get all opponents this player faced
    const opponents = Object.values(player.rounds)
      .filter((round) => round.name !== "BYE")
      .map((round) => data.find((p) => p.name === round.name))
      .filter((opponent) => opponent !== undefined) as IPlayer[];

    // Self resistance: sum of wins of all opponents
    for (const opponent of opponents) {
      selfResistance += opponent.record.wins;
    }

    // Opponent's resistance & Opponent's opponent's resistance
    for (const opponent of opponents) {
      // Get opponent's opponents
      const oppOpponents = Object.values(opponent.rounds)
        .filter((round) => round.name !== "BYE")
        .map((round) => data.find((p) => p.name === round.name))
        .filter((opp) => opp !== undefined) as IPlayer[];

      // Opp resistance: sum of wins of opponent's opponents
      for (const oppOpp of oppOpponents) {
        oppResistance += oppOpp.record.wins;
      }

      // Oppopp resistance: sum of wins of opponent's opponent's opponents
      for (const oppOpp of oppOpponents) {
        const oppOppOpponents = Object.values(oppOpp.rounds)
          .filter((round) => round.name !== "BYE")
          .map((round) => data.find((p) => p.name === round.name))
          .filter((ooo) => ooo !== undefined) as IPlayer[];

        for (const ooo of oppOppOpponents) {
          oppoppResistance += ooo.record.wins;
        }
      }
    }

    player.resistances = {
      self: selfResistance,
      opp: oppResistance,
      oppopp: oppoppResistance,
    };
  }

  calculatePlacements();

  console.log("Resistances calculated!");
}

/**
 * Calculates and updates placements for all players based on:
 * 1. Record (wins descending, losses ascending, ties descending)
 * 2. Resistances as tiebreakers (self, opp, oppopp)
 */
function calculatePlacements() {
  // Filter active players (not dropped)
  const activePlayers = data.filter((p) => p.drop === -1);

  // Sort players by record and resistances
  activePlayers.sort((a, b) => {
    // 1. Compare wins (descending)
    if (a.record.wins !== b.record.wins) {
      return b.record.wins - a.record.wins;
    }

    // 2. Compare losses (ascending - fewer losses is better)
    if (a.record.losses !== b.record.losses) {
      return a.record.losses - b.record.losses;
    }

    // 3. Compare ties (descending - more ties is better)
    if (a.record.ties !== b.record.ties) {
      return b.record.ties - a.record.ties;
    }

    // 4. Self resistance (SOS - descending)
    if (a.resistances.self !== b.resistances.self) {
      return b.resistances.self - a.resistances.self;
    }

    // 5. Opponent's resistance (OSS - descending)
    if (a.resistances.opp !== b.resistances.opp) {
      return b.resistances.opp - a.resistances.opp;
    }

    // 6. Opponent's opponent's resistance (descending)
    return b.resistances.oppopp - a.resistances.oppopp;
  });

  // Update placements
  activePlayers.forEach((player, index) => {
    player.placing = index + 1;
  });

  console.log("Placements calculated!");
}

/**
 * Ends the current match for a specific player by player number and result
 * Usage: endMatch 1 w (for Player 1 to WIN)
 *        endMatch 1 l (for Player 1 to LOSE)
 * @param playerNum - The player number (1-10)
 * @param result - "w" for win or "l" for loss
 */
function endPlayerMatch(playerNum: number, result?: string) {
  if (!result || !["w", "l"].includes(result)) {
    console.log(
      "Invalid result. Use 'w' for win or 'l' for loss. Example: endMatch 1 w",
    );
    return;
  }

  const player = data.find((p) => p.name.startsWith(`Player ${playerNum} [`));

  if (!player) {
    console.log(`Player ${playerNum} not found`);
    return;
  }

  const round = lastChildOf(Object.keys(player.rounds));
  if (!round) {
    console.log(`Player ${playerNum} has no active round`);
    return;
  }

  const roundData = player.rounds[round];

  // Skip if already has a result or opponent is BYE
  if (roundData.result !== null) {
    console.log(`Player ${playerNum} already has a result in round ${round}`);
    return;
  }

  if (roundData.name === "BYE") {
    console.log(`Player ${playerNum} has a BYE in round ${round}`);
    return;
  }

  // Find opponent
  const opponent = data.find((p) => p.name === roundData.name);

  if (!opponent || !(round in opponent.rounds)) {
    console.log(`Opponent not found for Player ${playerNum}`);
    return;
  }

  // Update results based on the provided result
  const playerWins = result === "w";

  if (playerWins) {
    player.rounds[round].result = "W";
    player.record.wins++;

    opponent.rounds[round].result = "L";
    opponent.record.losses++;

    console.log(`Player ${playerNum} WON against ${opponent.name}!`);
  } else {
    player.rounds[round].result = "L";
    player.record.losses++;

    opponent.rounds[round].result = "W";
    opponent.record.wins++;

    console.log(`Player ${playerNum} LOST against ${opponent.name}!`);
  }

  calculatePlacements();
}
