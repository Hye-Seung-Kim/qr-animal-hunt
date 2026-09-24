import { useEffect, useRef } from "react";
import { TOTAL_ROUNDS, createRound, markRoundTimedOut, finishGame } from "../lib/gameApi";

const COUNTDOWN_MS = 3000;
const NEXT_ROUND_DELAY_MS = 5000;

// Only the host's browser runs this -- it's the single writer responsible
// for round pacing (there's no server/Edge Function in this MVP), so there's
// nothing to race against. Everyone else just reacts to the row changes it
// produces via useRoomChannel's realtime subscription. If the host's tab
// closes, pacing pauses until useHostFailover transfers the role to another
// online player, whose own instance of this hook then takes over.
export function useHostRoundDirector({ isHost, room, rounds, roomId }) {
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!isHost || !room) return;

    if (room.status === "countdown") {
      timerRef.current = setTimeout(() => {
        createRound({ roomId, roundNumber: 1, usedAnimalIds: [] }).catch((err) => console.error(err));
      }, COUNTDOWN_MS);
      return;
    }

    if (room.status !== "playing") return;

    const currentRound = rounds.find((r) => r.round_number === room.current_round);
    if (!currentRound) return;

    if (currentRound.status === "active") {
      const msLeft = new Date(currentRound.ends_at).getTime() - Date.now();
      timerRef.current = setTimeout(() => {
        markRoundTimedOut(currentRound.id).catch((err) => console.error(err));
      }, Math.max(0, msLeft));
      return;
    }

    // Round just completed or timed out -- pause, then advance.
    timerRef.current = setTimeout(() => {
      if (room.current_round >= TOTAL_ROUNDS) {
        finishGame(roomId).catch((err) => console.error(err));
      } else {
        const usedAnimalIds = rounds.map((r) => r.target_animal);
        createRound({ roomId, roundNumber: room.current_round + 1, usedAnimalIds }).catch((err) => console.error(err));
      }
    }, NEXT_ROUND_DELAY_MS);
  }, [isHost, room, rounds, roomId]);
}
