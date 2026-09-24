import { useState } from "react";
import { useRoomChannel } from "../../hooks/useRoomChannel";
import { useHostRoundDirector } from "../../hooks/useHostRoundDirector";
import { useHostFailover } from "../../hooks/useHostFailover";
import { WaitingRoom } from "./WaitingRoom";
import { CountdownOverlay } from "./CountdownOverlay";
import { RoundScreen } from "./RoundScreen";
import { RoundResultScreen } from "./RoundResultScreen";
import { FinalLeaderboard } from "./FinalLeaderboard";
import { ExitButton } from "./ExitButton";
import { startCountdown, resetForPlayAgain, leaveRoom } from "../../lib/gameApi";

export function InRoom({ roomId, playerId, username, onLeaveRoom }) {
  const { room, players, rounds, onlinePlayerIds, error } = useRoomChannel({ roomId, playerId, username });
  const [busy, setBusy] = useState(false);
  const isHost = room?.host_player_id === playerId;

  useHostRoundDirector({ isHost, room, rounds, roomId });
  useHostFailover({ room, players, onlinePlayerIds, playerId, roomId });

  async function withBusy(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    await leaveRoom(playerId).catch((err) => console.error(err));
    onLeaveRoom();
  }

  if (error) {
    return (
      <div className="start-screen">
        <p className="landing-error">{error}</p>
        <button type="button" className="secondary-button" onClick={onLeaveRoom}>Back</button>
      </div>
    );
  }

  if (!room) {
    return <div className="start-screen"><p>Loading room...</p></div>;
  }

  if (room.status === "waiting") {
    return (
      <WaitingRoom
        room={room}
        players={players}
        onlinePlayerIds={onlinePlayerIds}
        isHost={isHost}
        busy={busy}
        onStart={() => withBusy(() => startCountdown(roomId))}
        onLeave={handleLeave}
      />
    );
  }

  if (room.status === "countdown") {
    return (
      <>
        <CountdownOverlay />
        <ExitButton onLeave={handleLeave} />
      </>
    );
  }

  if (room.status === "playing") {
    const currentRound = rounds.find((r) => r.round_number === room.current_round);
    if (!currentRound) {
      return <div className="start-screen"><p>Loading round...</p></div>;
    }
    return (
      <>
        {currentRound.status === "active" ? (
          <RoundScreen room={room} round={currentRound} playerId={playerId} />
        ) : (
          <RoundResultScreen round={currentRound} players={players} playerId={playerId} />
        )}
        <ExitButton onLeave={handleLeave} />
      </>
    );
  }

  if (room.status === "finished") {
    return (
      <FinalLeaderboard
        players={players}
        rounds={rounds}
        playerId={playerId}
        isHost={isHost}
        busy={busy}
        onPlayAgain={() => withBusy(() => resetForPlayAgain(roomId))}
        onLeave={handleLeave}
      />
    );
  }

  return null;
}
