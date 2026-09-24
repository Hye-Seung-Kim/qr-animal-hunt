import { supabase } from "./supabaseClient";
import { generateRoomCode } from "./roomCode";
import { ANIMAL_ORDER } from "../data/animals";

export const TOTAL_ROUNDS = 5;
export const ROUND_DURATION_MS = 60_000;

async function insertRoomWithUniqueCode(hostPlayerId) {
  // Collisions are rare (33^5 codes) but retry a few times instead of
  // assuming uniqueness.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ room_code: roomCode, host_player_id: hostPlayerId })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error; // not a unique-violation, don't retry
  }
  throw new Error("Could not generate a unique room code, please try again.");
}

function usernameTakenError(username) {
  return new Error(`"${username}" is already taken in this room. Please choose a different username.`);
}

// Checked up front (fast, friendly error) *and* enforced by a unique index
// in the database (see sql/002_unique_username_per_room.sql) for the rare
// case of two people submitting the same new name at the same instant --
// the pre-check alone can't close that race.
async function assertUsernameAvailable({ roomId, playerId, username }) {
  const { data: existingPlayers, error } = await supabase
    .from("players")
    .select("id, username")
    .eq("room_id", roomId)
    .eq("is_active", true);
  if (error) throw error;

  const taken = (existingPlayers || []).some(
    (p) => p.id !== playerId && p.username.trim().toLowerCase() === username.toLowerCase(),
  );
  if (taken) throw usernameTakenError(username);
}

async function upsertPlayer({ playerId, roomId, username }) {
  const { error } = await supabase
    .from("players")
    .upsert({ id: playerId, room_id: roomId, username, is_active: true, joined_at: new Date().toISOString() });
  if (error) {
    if (error.code === "23505") throw usernameTakenError(username);
    throw error;
  }
}

export async function createRoom({ playerId, username }) {
  const trimmedUsername = username.trim();
  const room = await insertRoomWithUniqueCode(playerId);
  // Same browser/session re-creating a room after a previous game already
  // has a `players` row from that old room under this playerId (its primary
  // key) -- upsert moves that row to the new room instead of colliding.
  await upsertPlayer({ playerId, roomId: room.id, username: trimmedUsername });
  return room;
}

export async function joinRoom({ playerId, username, roomCode }) {
  const trimmedUsername = username.trim();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select()
    .eq("room_code", roomCode.trim().toUpperCase())
    .maybeSingle();
  if (roomError) throw roomError;
  if (!room) throw new Error("Room not found. Check the code and try again.");

  await assertUsernameAvailable({ roomId: room.id, playerId, username: trimmedUsername });
  await upsertPlayer({ playerId, roomId: room.id, username: trimmedUsername });
  return room;
}

export async function fetchRoomSnapshot(roomId) {
  const [{ data: room, error: roomError }, { data: players, error: playersError }, { data: rounds, error: roundsError }] = await Promise.all([
    supabase.from("rooms").select().eq("id", roomId).single(),
    supabase.from("players").select().eq("room_id", roomId).order("joined_at", { ascending: true }),
    supabase.from("rounds").select().eq("room_id", roomId).order("round_number", { ascending: true }),
  ]);
  if (roomError) throw roomError;
  if (playersError) throw playersError;
  if (roundsError) throw roundsError;
  return { room, players: players || [], rounds: rounds || [] };
}

export async function startCountdown(roomId) {
  const { error } = await supabase
    .from("rooms")
    .update({ status: "countdown", current_round: 0 })
    .eq("id", roomId);
  if (error) throw error;
}

function pickTargetAnimal(usedAnimalIds) {
  const remaining = ANIMAL_ORDER.filter((id) => !usedAnimalIds.includes(id));
  const pool = remaining.length > 0 ? remaining : ANIMAL_ORDER;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function createRound({ roomId, roundNumber, usedAnimalIds }) {
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + ROUND_DURATION_MS);
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      target_animal: pickTargetAnimal(usedAnimalIds),
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select()
    .single();
  if (roundError) throw roundError;

  const { error: roomError } = await supabase
    .from("rooms")
    .update({ status: "playing", current_round: roundNumber })
    .eq("id", roomId);
  if (roomError) throw roomError;

  return round;
}

export async function markRoundTimedOut(roundId) {
  const { error } = await supabase
    .from("rounds")
    .update({ status: "timeout" })
    .eq("id", roundId)
    .eq("status", "active");
  if (error) throw error;
}

export async function finishGame(roomId) {
  const { error } = await supabase.from("rooms").update({ status: "finished" }).eq("id", roomId);
  if (error) throw error;
}

// Atomic "first scanner wins": the WHERE clause is re-checked against the
// committed row when Postgres grants the update its row lock, so concurrent
// callers naturally serialize -- only the first one finds winner_player_id
// still null and actually updates a row. Returns true only for the winner.
export async function attemptRoundWin({ roundId, playerId, winningTimeSeconds }) {
  const { data, error } = await supabase
    .from("rounds")
    .update({ winner_player_id: playerId, winning_time: winningTimeSeconds, status: "completed" })
    .eq("id", roundId)
    .eq("status", "active")
    .is("winner_player_id", null)
    .select();
  if (error) throw error;
  return Boolean(data && data.length > 0);
}

export async function resetForPlayAgain(roomId) {
  const { error: deleteError } = await supabase.from("rounds").delete().eq("room_id", roomId);
  if (deleteError) throw deleteError;
  const { error: roomError } = await supabase
    .from("rooms")
    .update({ status: "waiting", current_round: 0 })
    .eq("id", roomId);
  if (roomError) throw roomError;
}

export async function leaveRoom(playerId) {
  const { error } = await supabase.from("players").update({ is_active: false }).eq("id", playerId);
  if (error) throw error;
}

// Guarded the same way as attemptRoundWin: only succeeds if `fromPlayerId`
// was still the host at the moment of the update, so two clients racing to
// transfer host can't both "win".
export async function claimHost({ roomId, fromPlayerId, toPlayerId }) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ host_player_id: toPlayerId })
    .eq("id", roomId)
    .eq("host_player_id", fromPlayerId)
    .select();
  if (error) throw error;
  return Boolean(data && data.length > 0);
}
