-- Run this once against a database that already has sql/schema.sql applied
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Prevents two active players in the same room from sharing a username
-- (case-insensitive) -- app-side already checks this before joining, but a
-- database constraint closes the race window where two people submit the
-- same new name at nearly the same instant. The partial WHERE clause means
-- a name frees up automatically once that player leaves (is_active = false).

create unique index if not exists players_room_username_unique
  on players (room_id, lower(username))
  where is_active;
