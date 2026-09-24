import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchRoomSnapshot } from "../lib/gameApi";

// Subscribes to a room's rows (rooms/players/rounds) via Postgres Changes and
// to presence on the same channel for "who's actually connected right now".
// The tables are tiny (a handful of players, at most 5 rounds), so on any
// change we just refetch the whole snapshot rather than patch state in
// place -- simpler and correct, with no meaningful cost at this scale.
export function useRoomChannel({ roomId, playerId, username }) {
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [onlinePlayerIds, setOnlinePlayerIds] = useState(() => new Set());
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      const snapshot = await fetchRoomSnapshot(roomId);
      setRoom(snapshot.room);
      setPlayers(snapshot.players);
      setRounds(snapshot.rounds);
    } catch (err) {
      setError(err.message || String(err));
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;
    refresh();

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: playerId } },
    });

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => {
        if (!cancelled) refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` }, () => {
        if (!cancelled) refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` }, () => {
        if (!cancelled) refresh();
      })
      .on("presence", { event: "sync" }, () => {
        if (cancelled) return;
        setOnlinePlayerIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ username, online_at: Date.now() });
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId, username, refresh]);

  return { room, players, rounds, onlinePlayerIds, error, refresh };
}
