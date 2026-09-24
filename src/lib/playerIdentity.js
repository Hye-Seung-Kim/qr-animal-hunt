// No accounts: each browser gets a random id, kept in sessionStorage so a
// refresh doesn't drop the player out of their room but a new tab/device
// gets its own identity. Username is a separate, remembered-for-convenience
// value in localStorage -- never used to key anything.
const PLAYER_ID_KEY = "animal-hunt:player-id";
const USERNAME_KEY = "animal-hunt:username";

export function getPlayerId() {
  let id = sessionStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getStoredUsername() {
  return window.localStorage.getItem(USERNAME_KEY) || "";
}

export function setStoredUsername(username) {
  window.localStorage.setItem(USERNAME_KEY, username);
}
