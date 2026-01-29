import { IPlayer } from "../interfaces/player-interface";

/**
 * Ends all matches in a round by randomly assigning wins and losses
 * When a player wins against an opponent:
 * - Winner: wins increment in both record and round result
 * - Loser: losses increment in both record and round result
 * @param players - Array of players with ongoing matches
 * @param round - The round number/identifier to end
 * @returns Updated players array with all matches finished
 */
export function endRound(players: IPlayer[], round: string): IPlayer[] {
  const processedPlayers = JSON.parse(JSON.stringify(players)); // Deep copy
  const processedMatches = new Set<string>();

  for (const player of processedPlayers) {
    if (!(round in player.rounds)) continue;

    const roundData = player.rounds[round];

    // Skip if already has a result
    if (roundData.result !== null) continue;

    // Create a unique match identifier (sorted to avoid duplicates)
    const opponentName = roundData.name;
    const matchId = [player.name, opponentName].sort().join("|");

    // Skip if we already processed this match
    if (processedMatches.has(matchId)) continue;

    processedMatches.add(matchId);

    // Randomly determine winner (50/50 chance)
    const playerWins = Math.random() < 0.5;

    // Find opponent
    const opponent = processedPlayers.find((p) => p.name === opponentName);

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

  return processedPlayers;
}
