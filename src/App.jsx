import { useState } from "react";
import { LandingScreen } from "./components/multiplayer/LandingScreen";
import { InRoom } from "./components/multiplayer/InRoom";
import { getPlayerId } from "./lib/playerIdentity";
import { createRoom, joinRoom } from "./lib/gameApi";
import "./App.css";

const ROOM_ID_KEY = "animal-hunt:room-id";
const USERNAME_KEY = "animal-hunt:active-username";

function App() {
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem(ROOM_ID_KEY));
  const [username, setUsername] = useState(() => sessionStorage.getItem(USERNAME_KEY) || "");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const playerId = getPlayerId();

  function enterRoom(room, name) {
    sessionStorage.setItem(ROOM_ID_KEY, room.id);
    sessionStorage.setItem(USERNAME_KEY, name);
    setUsername(name);
    setRoomId(room.id);
  }

  async function handleCreateRoom(name) {
    setBusy(true);
    setErrorMessage(null);
    try {
      const room = await createRoom({ playerId, username: name });
      enterRoom(room, name);
    } catch (err) {
      setErrorMessage(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom(name, roomCode) {
    setBusy(true);
    setErrorMessage(null);
    try {
      const room = await joinRoom({ playerId, username: name, roomCode });
      enterRoom(room, name);
    } catch (err) {
      setErrorMessage(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  function handleLeaveRoom() {
    sessionStorage.removeItem(ROOM_ID_KEY);
    setRoomId(null);
  }

  if (!roomId) {
    return (
      <LandingScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        busy={busy}
        errorMessage={errorMessage}
      />
    );
  }

  return <InRoom roomId={roomId} playerId={playerId} username={username} onLeaveRoom={handleLeaveRoom} />;
}

export default App;
