import { useEffect, useRef } from "react";
import { claimHost } from "../lib/gameApi";

const HOST_OFFLINE_GRACE_MS = 4000;

// Runs in every client, not just candidates for host -- each one independently
// notices the host's presence has dropped, waits out a grace period (so a
// brief reconnect blip doesn't trigger a swap), and only the earliest-joined
// still-online active player actually attempts the claim. claimHost's
// `eq(host_player_id, fromPlayerId)` guard means even if two clients raced
// here, only one update would land.
export function useHostFailover({ room, players, onlinePlayerIds, playerId, roomId }) {
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!room || !roomId) return undefined;
    if (onlinePlayerIds.size === 0 || onlinePlayerIds.has(room.host_player_id)) return undefined;

    timerRef.current = setTimeout(() => {
      const onlineActive = players
        .filter((p) => p.is_active && onlinePlayerIds.has(p.id))
        .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
      const earliest = onlineActive[0];
      if (earliest && earliest.id === playerId) {
        claimHost({ roomId, fromPlayerId: room.host_player_id, toPlayerId: playerId }).catch(() => {});
      }
    }, HOST_OFFLINE_GRACE_MS);

    return () => clearTimeout(timerRef.current);
  }, [room, players, onlinePlayerIds, playerId, roomId]);
}
