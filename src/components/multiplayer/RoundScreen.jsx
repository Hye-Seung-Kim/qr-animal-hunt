import { useCallback, useEffect, useRef, useState } from "react";
import { CameraView } from "../CameraView";
import { ErrorBanner } from "../ErrorBanner";
import { useRoundTimer } from "../../hooks/useRoundTimer";
import { attemptRoundWin, TOTAL_ROUNDS } from "../../lib/gameApi";
import { getAnimal } from "../../data/animals";

const ERROR_STATUSES = new Set(["denied", "unavailable", "unsupported", "error"]);
const WRONG_GUESS_DURATION_MS = 1600;

export function RoundScreen({ room, round, playerId }) {
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [wrongGuess, setWrongGuess] = useState(null);
  const wrongGuessTimerRef = useRef(null);
  const remainingMs = useRoundTimer(round);
  const targetAnimal = getAnimal(round.target_animal);

  useEffect(() => () => clearTimeout(wrongGuessTimerRef.current), []);

  const handleDiscover = useCallback(({ id, animal }) => {
    if (id === round.target_animal) {
      const winningTimeSeconds = (Date.now() - new Date(round.started_at).getTime()) / 1000;
      attemptRoundWin({ roundId: round.id, playerId, winningTimeSeconds }).catch((err) => console.error(err));
      return;
    }
    clearTimeout(wrongGuessTimerRef.current);
    setWrongGuess(animal ? { emoji: animal.emoji, name: animal.name } : { emoji: "❓", name: "Unknown" });
    wrongGuessTimerRef.current = setTimeout(() => setWrongGuess(null), WRONG_GUESS_DURATION_MS);
  }, [round.id, round.target_animal, round.started_at, playerId]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="game-screen">
      <CameraView onDiscover={handleDiscover} onStatusChange={setCameraStatus} />

      <div className="hud-top">
        <span className="hud-title">Round {room.current_round} / {TOTAL_ROUNDS}</span>
        <span className="hud-count">{remainingSeconds}s</span>
      </div>

      <div className="round-target-banner">
        FIND THE<br />
        <span className="round-target-emoji">{targetAnimal?.emoji}</span> {targetAnimal?.name?.toUpperCase()}
      </div>

      {wrongGuess && (
        <div className="hud-toast hud-toast-unknown">
          <strong>{wrongGuess.emoji} {wrongGuess.name}</strong>
          <span>Not this one!</span>
        </div>
      )}

      {!ERROR_STATUSES.has(cameraStatus) && <div className="hud-bottom">Scan the correct animal QR</div>}
      {ERROR_STATUSES.has(cameraStatus) && <ErrorBanner status={cameraStatus} />}
    </div>
  );
}
