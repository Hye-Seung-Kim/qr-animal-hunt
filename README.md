# Animal Hunt

A mobile-friendly, real-time multiplayer QR scavenger hunt. Everyone joins the
same room on their own phone, the host starts a 5-round game, each round
calls out a target animal, and whoever scans the matching physical QR code
first wins the round. Point your phone's camera at a QR code and a matching
animal pops up on screen with its sound.

## Live demo

https://qr-animal-hunt.netlify.app

Open on your phone, allow camera access, and scan a QR code from
https://qr-animal-hunt.netlify.app/test-qr-codes.html (pull that page up on a
second screen) — or the real physical QR codes the payloads in
`src/data/animals.js` are mapped to.

## Setup

1. `npm install`
2. Create a Supabase project, then run `sql/schema.sql` once in its SQL
   Editor (Dashboard -> SQL Editor -> New query -> paste -> Run). This creates
   the `rooms`/`players`/`rounds` tables, RLS policies, and adds them to the
   `supabase_realtime` publication.
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon/publishable key (Dashboard -> Project Settings -> API). Never use
   the `service_role` key here — it's server-only.
4. `npm run dev`

For Netlify, set the same two env vars on the site (`netlify env:set
VITE_SUPABASE_URL ...` / `VITE_SUPABASE_ANON_KEY ...`) — Vite bakes them into
the build, so they must exist at build time, not just at runtime.

## How the multiplayer game works

State machine: `LandingScreen` (username -> create/join room) hands off to
`InRoom`, which renders a screen purely as a function of the current room row
from Supabase — `waiting` -> `WaitingRoom`, `countdown` -> `CountdownOverlay`,
`playing` -> `RoundScreen` or `RoundResultScreen` depending on the current
round's status, `finished` -> `FinalLeaderboard`. No client-local game state
machine to keep in sync; the room row *is* the state machine.

- **No login.** Each browser generates a random id (`src/lib/playerIdentity.js`,
  kept in `sessionStorage`) and a chosen username (kept in `localStorage` for
  convenience only). Room codes are 5 unambiguous characters
  (`src/lib/roomCode.js`).
- **Realtime sync** (`src/hooks/useRoomChannel.js`): subscribes to Postgres
  Changes on all three tables plus a Presence channel for "who's actually
  connected." On any change it refetches the room/players/rounds snapshot —
  these tables are tiny, so this is simpler and just as fast as patching
  state in place.
- **Server-authoritative timer:** a round stores `ends_at`; every client
  computes its own countdown from that shared timestamp
  (`src/hooks/useRoundTimer.js`), so nobody's countdown depends on when they
  joined.
- **Atomic first-scan-wins** (`attemptRoundWin` in `src/lib/gameApi.js`): the
  winning update is `UPDATE rounds SET winner_player_id = ... WHERE id = ...
  AND winner_player_id IS NULL`. Postgres re-checks that `WHERE` clause after
  acquiring the row's lock, so concurrent attempts from different players
  serialize correctly — only the first one actually updates a row. No custom
  database function needed.
- **Host-driven pacing** (`src/hooks/useHostRoundDirector.js`): there's no
  server/Edge Function in this MVP, so the host's own browser is the single
  writer that creates each round row, detects a round timing out, and
  advances to the next round or finishes the game. Every other client just
  reacts to the resulting row changes.
- **Host failover** (`src/hooks/useHostFailover.js`): if presence shows the
  host has been gone for a few seconds, the earliest-joined still-connected
  player claims the role, guarded by the same atomic-`UPDATE`-with-`WHERE`
  pattern so two clients racing to claim it can't both succeed.
- **Scoring** is derived client-side from `rounds.winner_player_id` counts
  (`FinalLeaderboard.jsx`) rather than kept in a separate table — five rows
  per game is cheap to fetch and count.
- The camera/QR/overlay/sound layer from the single-player prototype is
  reused as-is (see below) — `RoundScreen` just wires `CameraView`'s
  `onDiscover` callback to check the scanned id against the round's target
  animal instead of a local collection.

### Known limitation: no real auth

There's no login system (by design, per the product spec), so the RLS
policies in `sql/schema.sql` allow the anon key to read/write all three
tables — any client could, in principle, tamper with any room's data. That's
an accepted tradeoff for a casual, no-stakes party game. Don't reuse this
schema as-is for anything where that matters.

## QR scanning / overlay / sound (shared with the single-player prototype)

- `getUserMedia()` requests the rear-facing camera only once the player has
  entered a username (first user gesture in the app), which is also where the
  `AudioContext` is unlocked for mobile autoplay restrictions.
- `jsQR` decodes downscaled frames; masking each decoded region lets multiple
  QR codes be found in a single frame (`src/lib/qrGeometry.js`, ported from
  the original qrcode-tracking prototype).
- `src/hooks/useQRScanner.js` runs the whole scan/track/draw loop outside
  React state for performance, and only calls back into React (`onDiscover`)
  once per fresh sighting. It also owns detection stability: a QR that blinks
  out for under 500ms doesn't flicker, it fades over the next ~700ms, and
  after 2s of being gone it's fully forgotten — so scanning it again later
  counts as a fresh discovery.
- `src/lib/overlayRenderer.js` draws the QR's bounding box (for scan
  feedback) plus the animal + caption, pinned to the center of the screen
  rather than the QR's own position — anchoring directly to the QR read
  poorly when it was held off to one side of frame.
- `src/lib/sounds.js` synthesizes each animal's sound with the Web Audio API,
  so the app ships with zero binary audio assets. See "Using real art/audio"
  below to swap in real files.

## Add a new animal

Edit `src/data/animals.js` — add an entry keyed by the exact QR code payload,
add its id to `ANIMAL_ORDER`, and add a synthesis recipe for its `soundType`
in `src/lib/sounds.js`. Nothing else needs to change.

## Using real art/audio instead of emoji/synthesized sound

1. Drop a PNG into `public/assets/animals/` and an mp3 into
   `public/assets/sounds/`.
2. Set `image`/`soundUrl` on that animal's entry in `src/data/animals.js`.
3. Update `src/lib/overlayRenderer.js` to draw `animal.image` (via a preloaded
   `Image`/`HTMLImageElement`) when present, falling back to `animal.emoji`
   otherwise, and update `src/lib/sounds.js`'s `playAnimalSound` to play a
   preloaded `<audio>`/`AudioBuffer` when `soundUrl` is present.

## Generate test QR codes

```bash
npm run generate-qr
```

Regenerates `public/qr-codes/*.svg` and `public/test-qr-codes.html` from
whatever payloads are in `src/data/animals.js` — a printable page listing all
configured animal QR codes, useful for pulling up on a second screen while
testing.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Camera access requires HTTPS in production,
but `localhost` is exempt so this works over plain HTTP during development.

To test with multiple phones on the same network, use `npm run dev -- --host`
and open the printed LAN URL on each phone.

## Deploy to Netlify

`netlify.toml` is already configured:

```toml
[build]
command = "npm run build"
publish = "dist"
```

Connect the repo in Netlify, or run `netlify deploy --prod --build` locally.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as site env vars (see
Setup above) — without them the build ships with no working backend.

## Testing checklist

**Setup**
- [ ] `sql/schema.sql` has been run in the Supabase SQL Editor
- [ ] `.env.local` (dev) and Netlify env vars (prod) both have the URL + anon key

**Room flow (2+ phones)**
- [ ] Creating a room shows a room code; joining with that code puts both
      players in the same waiting room in real time
- [ ] Only the host sees "Start Game"; others see "Waiting for host..."
- [ ] Tapping Start shows a synchronized-enough 3-2-1-GO on all phones

**Round flow**
- [ ] All players see the same target animal and a timer counting down from
      the same moment
- [ ] Scanning the wrong QR shows "Not this one!" without ending the round
- [ ] The first phone to scan the correct QR wins the round for everyone;
      other phones show who won and their time
- [ ] Letting the timer hit 0 with nobody scanning shows "TIME'S UP!" and
      awards no points
- [ ] After 5 rounds, everyone sees the same final leaderboard with correct
      tied ranks

**Resilience**
- [ ] Refreshing a phone mid-game rejoins the same room and shows the current
      state (no full restart)
- [ ] Closing the host's tab mid-game eventually transfers host to another
      connected player (a few seconds' delay is expected)
- [ ] "Play Again" (host only) resets scores/rounds but keeps the same room
      and players

**Mobile basics (iPhone Safari + Android Chrome)**
- [ ] Camera permission is requested only after entering a username
- [ ] Rear camera is used by default; screen rotation doesn't break layout
- [ ] Sounds play after that first tap (not blocked by autoplay policy)
