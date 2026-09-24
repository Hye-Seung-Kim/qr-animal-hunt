const MEDALS = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

function computeStandings(players, rounds) {
  const wins = new Map(players.map((p) => [p.id, 0]));
  rounds.forEach((r) => {
    if (r.winner_player_id) wins.set(r.winner_player_id, (wins.get(r.winner_player_id) || 0) + 1);
  });
  const standings = players
    .filter((p) => p.is_active)
    .map((p) => ({ ...p, wins: wins.get(p.id) || 0 }));
  standings.sort((a, b) => b.wins - a.wins);
  standings.forEach((s) => {
    s.rank = 1 + standings.filter((other) => other.wins > s.wins).length;
  });
  return standings;
}

export function FinalLeaderboard({ players, rounds, playerId, isHost, onPlayAgain, onLeave, busy }) {
  const standings = computeStandings(players, rounds);

  return (
    <div className="start-screen">
      <h1>{"\u{1F3C6}"} Final Results</h1>
      <ul className="leaderboard-list">
        {standings.map((player) => (
          <li key={player.id} className={player.id === playerId ? "leaderboard-row-me" : ""}>
            <span className="leaderboard-rank">{MEDALS[player.rank] || player.rank}</span>
            <span className="leaderboard-name">{player.username}</span>
            <span className="leaderboard-wins">{player.wins} win{player.wins === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ul>

      <div className="room-choice">
        {isHost && (
          <button type="button" className="primary-button" disabled={busy} onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <button type="button" className="secondary-button" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </div>
  );
}
