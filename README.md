# Animal Hunt

A multiplayer QR scavenger hunt for mobile browsers. Join a room, find the
animal shown on screen, and scan its QR code before everyone else. Recognized
codes bring up animated, low-poly 3D animals over the camera view with
synthesized animal sounds.

[Play Animal Hunt](https://qr-animal-hunt.netlify.app) ·
[Printable QR codes](https://qr-animal-hunt.netlify.app/test-qr-codes.html)

## How to play

1. Print the QR codes and place them around the play area, or open the QR
   code page on a second screen for testing.
2. Open the game on each player's phone and choose a username.
3. Have one player create a room and share its five-character code. Everyone
   else joins with that code. Active players in a room need distinct usernames
   (case-insensitive).
4. The host selects **Start Game**. Allow camera access when the first round
   opens, then look for the target animal's QR code.
5. Play five rounds of up to 60 seconds each. The first accepted matching scan
   earns one point; a wrong animal earns none and the round continues. A timeout
   awards no points. Results appear between rounds, followed by the final
   leaderboard. The host can select **Play Again** to reuse the room.

## Features

- Shared room, player, and round state through Supabase Realtime.
- QR recognition with `jsQR`, including tracking and scan feedback.
- Six procedural 3D animals rendered with Three.js and React Three Fiber.
- Animal sounds generated with the Web Audio API; no audio files required.
- Session-based rejoining after a page refresh and automatic host transfer
  when the host disconnects and another active player remains online.
- No account or login required.

## Local setup

### Requirements

- Node.js 22.12+ and npm.
- A Supabase project with access to its SQL Editor.
- A camera-equipped browser with WebGL support for gameplay.

### 1. Install dependencies

```bash
npm ci
cp .env.local.example .env.local
```

### 2. Set up Supabase

For a new database, run [`sql/schema.sql`](sql/schema.sql) once in the
Supabase SQL Editor. It creates the `rooms`, `players`, and `rounds` tables,
indexes, row-level security policies, and Realtime publication entries.
The publication statement is intended for initial setup; rerunning the whole
file after the tables have been added to Realtime can produce an error.

For an older installation without the unique-username index, run
[`sql/002_unique_username_per_room.sql`](sql/002_unique_username_per_room.sql).
New installations already include this index in the main schema. Existing
active duplicate usernames must be resolved before applying the index.

Fill in `.env.local` using your project's URL and public anon or publishable key:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

These values are included in the browser build. Never use a `service_role`
or secret key here. Keep `.env.local` out of version control.

### 3. Start the app

```bash
npm run dev
```

Open the local URL printed by Vite. The QR sheet is available at
`/test-qr-codes.html` on the same server.

Camera access requires a secure context. `http://localhost` works on the
computer running Vite, but an ordinary HTTP LAN address on a phone does not.
For phone testing, use an HTTPS deployment or an HTTPS development setup.
`npm run dev -- --host` exposes the server to the network but does not enable
HTTPS by itself.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production app into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check source files with Oxlint |
| `npm run generate-qr` | Regenerate the SVG QR codes and printable HTML page |

## Animals and QR codes

QR payloads must match the keys in [`src/data/animals.js`](src/data/animals.js)
exactly. Encode the payload itself, not a URL or the animal's display name.

| Animal | QR payload |
| --- | --- |
| Dog | `object-c` |
| Cat | `notebook` |
| Pigeon | `object-b` |
| Rat | `bottle` |
| Squirrel | `phone` |
| Cockroach | `object-a` |

To add an animal:

1. Add its entry to `ANIMALS` and its ID to `ANIMAL_ORDER` in
   `src/data/animals.js`.
2. Add a model and register its `soundType` in the `SPECIES` map in
   `src/three/AnimalModels.jsx`. The 3D scene uses `soundType` to select a model.
3. Add its synthesized sound in `src/lib/sounds.js`.
4. Update the separate `CODES` list in `scripts/generate-qr-codes.mjs`, then
   run `npm run generate-qr`.

The generator maintains its own list; it does not import `animals.js`.
Generated files are saved in `public/qr-codes/` and
`public/test-qr-codes.html`. The `image` and `soundUrl` fields in animal data
are placeholders; setting them alone does not load custom artwork or audio.

## Project structure

```text
src/
  components/multiplayer/  Lobby, countdown, rounds, and leaderboard
  components/CameraView.jsx  Camera, QR overlay, and lazy-loaded 3D scene
  data/animals.js         QR payloads and animal metadata
  hooks/                  Camera, scanning, Realtime, timers, and host logic
  lib/                    Supabase API, player identity, drawing, and sounds
  three/                  Procedural animal models and animated scene
sql/                      Database schema and migration
scripts/                  QR code generator
public/                   Printable QR page and generated SVGs
```

## Multiplayer behavior and limitations

Supabase stores the shared game state. Clients subscribe to database changes
and refetch the room snapshot; Presence tracks connected players. Round wins
use a conditional update that only succeeds while the round is active and
has no winner, preventing simultaneous claims from awarding multiple wins.
Scores are derived from completed round winners.

The host's browser creates rounds, marks timeouts, and advances the game.
Round timestamps originate on that browser and are stored in Supabase;
clients calculate the countdown using their own clocks. Timing therefore
depends on device clocks, network latency, and the host remaining active.
If the host disconnects, the earliest-joined online active player can take
over after a grace period. Progress may pause during that transfer.

Player identity and the current room are kept in `sessionStorage`, so a
refresh can restore the session. The preferred username is remembered in
`localStorage`; it is not an authenticated identity.

This is a casual game prototype: the database policies allow public clients
to read and write game data. Room codes do not provide access control, and
scan validation and host permissions are enforced by the app rather than a
trusted server. Competitive or private use requires authentication, tighter
database policies, and server-side validation.

## Deploy to Netlify

1. Connect this repository to a Netlify site.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the site's build
   environment using the same values as local development.
3. Deploy. [`netlify.toml`](netlify.toml) sets `npm run build` as the build
   command, publishes `dist/`, and includes the app fallback redirect.

If the Netlify CLI is installed and the site is linked, you can also run:

```bash
netlify deploy --prod --build
```

Vite embeds environment variables at build time. Redeploy after changing
those values; changing only the runtime environment does not update the app.

## Manual verification

Use two phones or independent browser sessions against the same Supabase project.

- Create and join a room; confirm that both players appear and duplicate
  usernames are rejected.
- Start as the host; confirm that both players see the same target and round.
- Scan a wrong animal, then the correct one; verify the feedback, 3D model,
  sound, and a single winner when both players scan together.
- Let a round time out; confirm that nobody receives a point.
- Complete five rounds and check the scores, tied ranks, and **Play Again** flow.
- Refresh during play and confirm that the session returns to the room.
- Disconnect the host and check that another online player takes over.
- Check camera permission, sound, and screen rotation on iPhone Safari and
  Android Chrome over HTTPS.

`npm run lint` and `npm run build` provide static and build checks. There is
currently no automated gameplay test suite.
