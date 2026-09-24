import { unlockAudio } from "../lib/sounds";

export function StartScreen({ onStart }) {
  function handleStart() {
    // Must run synchronously inside the tap handler — mobile Safari only
    // allows creating/resuming an AudioContext from within a user gesture.
    unlockAudio();
    onStart();
  }

  return (
    <div className="start-screen">
      <h1>Animal Hunt</h1>
      <p>Find the hidden animals around you.</p>
      <button type="button" className="primary-button" onClick={handleStart}>
        Start Game
      </button>
    </div>
  );
}
