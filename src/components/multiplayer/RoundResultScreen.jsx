import { useEffect, useState } from "react";
import { TOTAL_ROUNDS } from "../../lib/gameApi";
import { getAnimal } from "../../data/animals";

const NEXT_ROUND_DELAY_SECONDS = 5;

export function RoundResultScreen({ round, players, playerId }) {
  const [countdown, setCountdown] = useState(NEXT_ROUND_DELAY_SECONDS);
  const animal = getAnimal(round.target_animal);
  const isLastRound = round.round_number >= TOTAL_ROUNDS;

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const winner = round.winner_player_id ? players.find((p) => p.id === round.winner_player_id) : null;

  return (
    <div className="start-screen">
      <span className="round-target-emoji">{animal?.emoji}</span>
      <h1>{animal?.name?.toUpperCase()} {round.status === "timeout" ? "" : "FOUND!"}</h1>

      {round.status === "timeout" ? (
        <p>Nobody found the {animal?.name}. No one scores this round.</p>
      ) : winner ? (
        <>
          <p className="result-winner">
            {"\u{1F947}"} {winner.id === playerId ? "You" : winner.username}
          </p>
          <p>{round.winning_time?.toFixed(1)} seconds</p>
        </>
      ) : (
        <p>Round complete.</p>
      )}

      <p>{isLastRound ? "Calculating final results..." : `Next round starting in: ${countdown}...`}</p>
    </div>
  );
}
