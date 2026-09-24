// Central QR -> animal mapping. Add new animals here only; nothing else
// needs to change to support them (camera, scanner, overlay, sound, and
// collection all read from this list).
//
// `image` is optional — leave it null to render the emoji as a placeholder.
// Drop a PNG into public/assets/animals/ and point `image` at it
// (e.g. "/assets/animals/cat.png") to upgrade to real art later.
// Same idea for `soundUrl` under public/assets/sounds/ — until one is
// provided, a synthesized sound from lib/sounds.js is used instead.

export const ANIMALS = {
  CAT_001: {
    id: "CAT_001",
    name: "Cat",
    emoji: "\u{1F431}",
    image: null,
    soundUrl: null,
    soundType: "cat",
    caption: "You found a cat!",
  },
  DOG_001: {
    id: "DOG_001",
    name: "Dog",
    emoji: "\u{1F436}",
    image: null,
    soundUrl: null,
    soundType: "dog",
    caption: "You found a dog!",
  },
  FROG_001: {
    id: "FROG_001",
    name: "Frog",
    emoji: "\u{1F438}",
    image: null,
    soundUrl: null,
    soundType: "frog",
    caption: "You found a frog!",
  },
};

export const ANIMAL_ORDER = ["CAT_001", "DOG_001", "FROG_001"];

export function getAnimal(qrData) {
  return ANIMALS[qrData] || null;
}
