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

// A short burst of filtered noise, for percussive/skittering effects that a
// plain oscillator can't produce (e.g. a cockroach's legs).
function noiseBurst(ctx, { start, duration, gain = 0.15, filterFreq = 3000 }) {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = filterFreq;
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;

  source.connect(filter).connect(gainNode).connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.01);
}

const RECIPES = {
  cat(ctx, t0) {
    // Short upward-then-downward chirp, roughly "meow"-shaped.
    tone(ctx, { start: t0, duration: 0.18, freqStart: 500, freqEnd: 900, type: "triangle", gain: 0.22 });
    tone(ctx, { start: t0 + 0.16, duration: 0.22, freqStart: 850, freqEnd: 350, type: "triangle", gain: 0.22 });
  },
  dog(ctx, t0) {
    // "Ruff-ruff": a noisy transient for the sharp attack, a fast-falling
    // sawtooth for the bark's body, and a low square layer underneath for
    // some chest resonance.
    function bark(start) {
      noiseBurst(ctx, { start, duration: 0.02, gain: 0.2, filterFreq: 900 });
      tone(ctx, { start, duration: 0.1, freqStart: 650, freqEnd: 130, type: "sawtooth", gain: 0.3 });
      tone(ctx, { start, duration: 0.1, freqStart: 260, freqEnd: 90, type: "square", gain: 0.16 });
    }
    bark(t0);
    bark(t0 + 0.19);
  },
  pigeon(ctx, t0) {
    // Two soft, low warbling coos.
    tone(ctx, { start: t0, duration: 0.3, freqStart: 340, freqEnd: 260, type: "sine", gain: 0.14 });
    tone(ctx, { start: t0 + 0.32, duration: 0.34, freqStart: 320, freqEnd: 230, type: "sine", gain: 0.14 });
  },
  rat(ctx, t0) {
    // Real rodent squeaks rise sharply then flick back down, rather than
    // just falling — three of those in quick succession.
    function squeak(start) {
      tone(ctx, { start, duration: 0.035, freqStart: 2200, freqEnd: 4900, type: "sine", gain: 0.16 });
      tone(ctx, { start: start + 0.03, duration: 0.03, freqStart: 4900, freqEnd: 3000, type: "sine", gain: 0.14 });
    }
    squeak(t0);
    squeak(t0 + 0.11);
    squeak(t0 + 0.22);
  },
  squirrel(ctx, t0) {
    // Rapid high chittering.
    [0, 0.06, 0.12, 0.18, 0.24].forEach((offset, i) => {
      const base = i % 2 === 0 ? 2600 : 3400;
      tone(ctx, { start: t0 + offset, duration: 0.045, freqStart: base, freqEnd: base - 600, type: "triangle", gain: 0.13 });
    });
  },
  cockroach(ctx, t0) {
    // Cockroaches don't vocalize, so this is a skittering-legs foley effect
    // instead of a real "cockroach sound" — quick clicky noise bursts.
    [0, 0.05, 0.09, 0.16, 0.2, 0.27].forEach((offset) => {
      noiseBurst(ctx, { start: t0 + offset, duration: 0.03, gain: 0.12, filterFreq: 3000 });
    });
  },
};

export function playAnimalSound(soundType) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const recipe = RECIPES[soundType];
  if (!recipe) return;
  recipe(ctx, ctx.currentTime);
}
