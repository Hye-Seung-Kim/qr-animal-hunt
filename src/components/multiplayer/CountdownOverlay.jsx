import { useEffect, useState } from "react";

// Purely cosmetic, locally-timed 3-2-1-GO -- every client renders its own on
// seeing room.status flip to "countdown" via realtime, so they land within a
// network round-trip of each other. The round timer that actually matters
// for gameplay is server-timestamped (see useRoundTimer) and starts only
// once the host creates the round row after this animation's local delay.
export function CountdownOverlay() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return undefined;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  return (
    <div className="countdown-overlay">
      <span className="countdown-number">{count > 0 ? count : "GO!"}</span>
    </div>
  );
}
