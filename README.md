# Animal Hunt

A mobile-friendly, browser-based AR-style QR scavenger hunt. Point your phone's
camera at a QR code and a matching animal appears overlaid on the camera feed
with its sound, added to your collection.

This is the single-player MVP. A real-time multiplayer version (rooms, shared
round timer, first-to-scan-wins, Supabase-backed) is the planned next phase —
see "Multiplayer (planned)" below.

## Live demo

https://qr-animal-hunt.netlify.app

Open on your phone, allow camera access, and scan a QR code from
https://qr-animal-hunt.netlify.app/test-qr-codes.html (pull that page up on a
second screen).

## How it works

- `getUserMedia()` requests the rear-facing camera only after the player taps
  **Start Game** (`src/components/StartScreen.jsx`), which is also where the
  `AudioContext` is unlocked for mobile autoplay restrictions.
- `jsQR` decodes downscaled frames; masking each decoded region lets multiple
  QR codes be found in a single frame (`src/lib/qrGeometry.js`, ported from
  the original qrcode-tracking prototype).
- `src/hooks/useQRScanner.js` runs the whole scan/track/draw loop outside
  React state for performance, and only calls back into React (`onDiscover`)
  once per fresh sighting. It also owns detection stability: a QR that blinks
  out for under 500ms doesn't flicker, it fades over the next ~700ms, and
  after 2s of being gone it's fully forgotten — so scanning it again later
  counts as a fresh discovery (and replays the sound).
- `src/lib/overlayRenderer.js` draws the bounding box, animal emoji, and
  caption onto a transparent canvas each frame, anchored to and scaled by the
  QR code's position — with a pop-in and idle bounce animation.
- `src/lib/sounds.js` synthesizes each animal's sound with the Web Audio API,
  so the MVP ships with zero binary audio assets. See "Using real art/audio"
  below to swap in real files.
- `src/hooks/useCollection.js` persists discovered animals to `localStorage`,
  isolated behind a hook so a backend can replace it later without other code
  changing.
- Everything runs client-side per browser tab; nothing is uploaded, and there
  is no shared/global camera state, so multiple players can open the same
  deployed URL simultaneously with fully independent sessions.

## Add a new animal

Edit `src/data/animals.js` — add an entry keyed by the exact QR code payload,
and add its id to `ANIMAL_ORDER`. Nothing else needs to change.

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

Regenerates `public/qr-codes/*.svg` and `public/test-qr-codes.html` — a
printable page listing all configured animal QR codes, useful for pulling up
on a second screen while testing on your phone.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Camera access requires HTTPS in production,
but `localhost` is exempt so this works over plain HTTP during development.

To test on a phone on the same network, use `npm run dev -- --host` and open
the printed LAN URL on the phone (still HTTP, but most mobile browsers also
treat LAN addresses during dev as trusted — if not, deploy to Netlify and test
over HTTPS instead).

## Deploy to Netlify

`netlify.toml` is already configured:

```toml
[build]
command = "npm run build"
publish = "dist"
```

Connect the repo in Netlify, or run `netlify deploy --prod` locally. HTTPS is
required for camera access on mobile browsers — Netlify's default domain
satisfies this.

## Testing checklist

**Desktop Chrome**
- [ ] Start screen renders, tapping Start prompts for camera permission
- [ ] Camera feed appears full-screen
- [ ] Holding a QR code up to the webcam shows a green box + animal + caption
- [ ] Sound plays once per discovery, not every frame
- [ ] Collection strip at the bottom updates and persists after a page reload

**iPhone Safari**
- [ ] Permission prompt appears only after tapping Start
- [ ] Rear camera is used by default
- [ ] Animal overlay stays visually anchored to the QR code while moving it
- [ ] Sound plays after Start Game is tapped (not blocked by autoplay policy)
- [ ] Rotating the screen (portrait/landscape) doesn't break the layout

**Android Chrome**
- [ ] Same checks as iPhone Safari

**Multiple phones**
- [ ] All phones can open the same deployed URL at once
- [ ] Each phone has its own independent camera session
- [ ] Each phone's collection progress is separate (localStorage is per-device)

**Detection stability**
- [ ] Briefly covering the QR code (<0.5s) does not make the animal flicker
- [ ] Removing the QR code fades the animal out over about a second
- [ ] Re-showing the same QR code after a few seconds replays the sound

## Multiplayer (planned)

The follow-up scope is a real-time room-based game: username -> create/join
room -> waiting room -> host starts -> 5 rounds, each with a shared target
animal and a server-authoritative 60s timer and first-scan-wins winner,
finishing in a leaderboard. That phase introduces Supabase (rooms, players,
rounds tables + Realtime subscriptions) as a new layer on top of the scanning
and overlay code above, which does not need to change. Not implemented yet —
ask for it explicitly when ready to start that phase, and have a Supabase
project's URL + anon key ready (account/project creation isn't something that
can be done on your behalf).
