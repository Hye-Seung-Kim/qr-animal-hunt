-- Animal Hunt multiplayer schema.
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Scores are derived from `rounds.winner_player_id` client-side rather than
-- stored in a separate table -- five rows per game is cheap to fetch and
-- count, and it avoids a second source of truth to keep in sync.
--
-- SECURITY NOTE: there is no login/auth in this MVP (per the product spec --
-- "no account/login system is needed"), so these policies allow the public
-- anon key to read/write all three tables. Any client can therefore modify
-- any room's data. That's an accepted tradeoff for a casual, no-stakes party
-- game; do not reuse this schema for anything where that matters without
-- adding real auth + tighter RLS.

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_player_id uuid not null,
  status text not null default 'waiting'
    check (status in ('waiting', 'countdown', 'playing', 'finished')),
  current_round int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  username text not null,
  is_active boolean not null default true,
  joined_at timestamptz not null default now()
);

-- No two *active* players in the same room may share a username
-- (case-insensitive). Partial index so a name frees up once someone leaves.
create unique index if not exists players_room_username_unique
  on players (room_id, lower(username))
  where is_active;

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number int not null,
  target_animal text not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  winner_player_id uuid references players(id),
  winning_time numeric,
  status text not null default 'active'
    check (status in ('active', 'completed', 'timeout')),
  unique (room_id, round_number)
);

alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;

drop policy if exists "rooms_anon_all" on rooms;
create policy "rooms_anon_all" on rooms for all using (true) with check (true);

drop policy if exists "players_anon_all" on players;
create policy "players_anon_all" on players for all using (true) with check (true);

drop policy if exists "rounds_anon_all" on rounds;
create policy "rounds_anon_all" on rounds for all using (true) with check (true);

-- Realtime: broadcast row changes on all three tables to subscribed clients.
alter publication supabase_realtime add table rooms, players, rounds;
