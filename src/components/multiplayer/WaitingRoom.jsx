export function WaitingRoom({ room, players, onlinePlayerIds, isHost, onStart, busy }) {
  const activePlayers = players.filter((p) => p.is_active);

  return (
    <div className="start-screen">
      <p className="room-code-label">ROOM CODE</p>
      <h1 className="room-code-value">{room.room_code}</h1>
      <ul className="player-list">
        {activePlayers.map((player) => (
          <li key={player.id} className={onlinePlayerIds.has(player.id) ? "" : "player-offline"}>
            {player.username}
            {player.id === room.host_player_id && <span className="host-crown"> {"\u{1F451}"} HOST</span>}
          </li>
        ))}
      </ul>
      <p>{activePlayers.length} Player{activePlayers.length === 1 ? "" : "s"}</p>

      {isHost ? (
        <button type="button" className="primary-button" disabled={busy || activePlayers.length < 1} onClick={onStart}>
          Start Game
        </button>
      ) : (
        <p>Waiting for host...</p>
      )}
    </div>
  );
}
