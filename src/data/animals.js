// Central QR -> animal mapping. Add new animals here only; nothing else
// needs to change to support them (camera, scanner, overlay, sound, and
// collection all read from this list).
//
// Keys are the exact decoded QR payloads from the physical QR codes already
// in use (see the qrcode-tracking prototype) — object-a/b/c, notebook,
// bottle, phone — repurposed here to trigger animals instead of just
// labeling the object.
//
// `image` is optional — leave it null to render the emoji as a placeholder.
// Drop a PNG into public/assets/animals/ and point `image` at it
// (e.g. "/assets/animals/cat.png") to upgrade to real art later.
// Same idea for `soundUrl` under public/assets/sounds/ — until one is
// provided, a synthesized sound from lib/sounds.js is used instead.

export const ANIMALS = {
  "object-c": {
    id: "object-c",
    name: "Dog",
    emoji: "\u{1F436}",
    image: null,
    soundUrl: null,
    soundType: "dog",
    caption: "You found a dog!",
  },
  notebook: {
    id: "notebook",
    name: "Cat",
    emoji: "\u{1F431}",
    image: null,
    soundUrl: null,
    soundType: "cat",
    caption: "You found a cat!",
  },
  "object-b": {
    id: "object-b",
    name: "Pigeon",
    emoji: "\u{1F54A}\u{FE0F}",
    image: null,
    soundUrl: null,
    soundType: "pigeon",
    caption: "You found a pigeon!",
  },
  bottle: {
    id: "bottle",
    name: "Rat",
    emoji: "\u{1F400}",
    image: null,
    soundUrl: null,
    soundType: "rat",
    caption: "You found a rat!",
  },
  phone: {
    id: "phone",
    name: "Squirrel",
    emoji: "\u{1F43F}\u{FE0F}",
    image: null,
    soundUrl: null,
    soundType: "squirrel",
    caption: "You found a squirrel!",
  },
  "object-a": {
    id: "object-a",
    name: "Cockroach",
    emoji: "\u{1FAB3}",
    image: null,
    soundUrl: null,
    soundType: "cockroach",
    caption: "You found a cockroach!",
  },
};

export const ANIMAL_ORDER = ["object-c", "notebook", "object-b", "bottle", "phone", "object-a"];

export function getAnimal(qrData) {
  return ANIMALS[qrData] || null;
}
