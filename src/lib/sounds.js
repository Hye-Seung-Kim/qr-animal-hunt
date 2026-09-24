// Lightweight animal sound effects synthesized with the Web Audio API, so the
// MVP needs zero binary audio assets. Swap in a real recording later by
// setting `soundUrl` on an entry in data/animals.js and branching in
// playAnimalSound() to decode/play that buffer instead — the debounce logic
// in useQRScanner.js does not need to change either way.

let audioContext = null;

// Mobile browsers only allow creating/resuming an AudioContext inside a
// user-gesture handler, so this must be called from the "Start Game" tap.
export function unlockAudio() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function tone(ctx, { start, duration, freqStart, freqEnd, type = "sine", gain = 0.25 }) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + duration);

  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + duration * 0.15);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gainNode).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const RECIPES = {
  cat(ctx, t0) {
    // Short upward-then-downward chirp, roughly "meow"-shaped.
    tone(ctx, { start: t0, duration: 0.18, freqStart: 500, freqEnd: 900, type: "triangle", gain: 0.22 });
    tone(ctx, { start: t0 + 0.16, duration: 0.22, freqStart: 850, freqEnd: 350, type: "triangle", gain: 0.22 });
  },
  dog(ctx, t0) {
    // Two quick low bursts, roughly "bark bark".
    tone(ctx, { start: t0, duration: 0.11, freqStart: 220, freqEnd: 140, type: "square", gain: 0.28 });
    tone(ctx, { start: t0 + 0.16, duration: 0.11, freqStart: 220, freqEnd: 140, type: "square", gain: 0.28 });
  },
  frog(ctx, t0) {
    // Low pulsing croak.
    tone(ctx, { start: t0, duration: 0.14, freqStart: 180, freqEnd: 90, type: "sawtooth", gain: 0.2 });
    tone(ctx, { start: t0 + 0.15, duration: 0.14, freqStart: 180, freqEnd: 90, type: "sawtooth", gain: 0.2 });
    tone(ctx, { start: t0 + 0.3, duration: 0.18, freqStart: 160, freqEnd: 70, type: "sawtooth", gain: 0.2 });
  },
};

export function playAnimalSound(soundType) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const recipe = RECIPES[soundType];
  if (!recipe) return;
  recipe(ctx, ctx.currentTime);
}
