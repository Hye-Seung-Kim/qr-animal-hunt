import { useEffect, useState } from "react";

// Ticks from a server-set `ends_at` timestamp rather than counting down
// locally from 60, so every client agrees on the remaining time regardless
// of when it joined or how its own clock drifts.
export function useRoundTimer(round) {
  const [remainingMs, setRemainingMs] = useState(0);
  const endsAtIso = round?.ends_at ?? null;

  useEffect(() => {
    if (!endsAtIso) {
      setRemainingMs(0);
      return undefined;
    }
    const endsAt = new Date(endsAtIso).getTime();
    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAtIso]);

  return remainingMs;
}
