import { useState } from "react";
import { unlockAudio } from "../../lib/sounds";
import { getStoredUsername, setStoredUsername } from "../../lib/playerIdentity";

export function LandingScreen({ onCreateRoom, onJoinRoom, busy, errorMessage }) {
  const [step, setStep] = useState("username"); // 'username' | 'choose'
  const [username, setUsername] = useState(() => getStoredUsername());
  const [roomCode, setRoomCode] = useState("");

  function handleStart() {
    if (!username.trim()) return;
    // Must run inside this tap handler for mobile Safari's autoplay policy --
    // this is the first user gesture in the whole app.
    unlockAudio();
    setStoredUsername(username.trim());
    setStep("choose");
  }

  return (
    <div className="start-screen">
      <h1>Animal Hunt</h1>
      <p>Find the animal before everyone else.</p>

      {step === "username" ? (
        <>
          <input
            className="text-input"
            placeholder="Username"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
          />
          <button type="button" className="primary-button" disabled={!username.trim()} onClick={handleStart}>
            Start
          </button>
        </>
      ) : (
        <div className="room-choice">
          <p className="chosen-username">
            Playing as <strong>{username}</strong>{" "}
            <button type="button" className="link-button" onClick={() => setStep("username")}>
              Change
            </button>
          </p>
          <button type="button" className="primary-button" disabled={busy} onClick={() => onCreateRoom(username.trim())}>
            Create Room
          </button>
          <div className="room-choice-divider">or</div>
          <input
            className="text-input"
            placeholder="Room Code"
            value={roomCode}
            maxLength={6}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            className="secondary-button"
            disabled={busy || !roomCode.trim()}
            onClick={() => onJoinRoom(username.trim(), roomCode.trim())}
          >
            Join Room
          </button>
        </div>
      )}

      {errorMessage && <p className="landing-error">{errorMessage}</p>}
    </div>
  );
}
