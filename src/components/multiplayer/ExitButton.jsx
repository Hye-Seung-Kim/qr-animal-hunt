// Countdown/round/result screens otherwise have no way to leave a game in
// progress -- WaitingRoom and FinalLeaderboard already have their own Leave
// Room button, but once the host starts, a player was stuck until all 5
// rounds finished.
export function ExitButton({ onLeave }) {
  return (
    <button type="button" className="exit-button" onClick={onLeave}>
      Exit
    </button>
  );
}
