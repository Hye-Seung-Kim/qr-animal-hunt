// All six critters are real downloaded .glb models (see GltfCritter, which
// auto-centers/auto-scales each one to a shared footprint) rather than
// three.js primitives -- an earlier primitive-built version existed here,
// but every species eventually got swapped for a real model as one came in,
// so there's no primitive fallback left to keep in sync. Check git history
// (`git log -- src/three/AnimalModels.jsx`) if that approach is ever wanted
// again for a species without a model file.

import { GltfCritter } from "./GltfCritter";

export const RAT_MODEL_URL = "/assets/models/rat.glb";
export const CAT_MODEL_URL = "/assets/models/cat.glb";
export const SQUIRREL_MODEL_URL = "/assets/models/squirrel.glb";
export const PIGEON_MODEL_URL = "/assets/models/pigeon.glb";
export const DOG_MODEL_URL = "/assets/models/dog.glb";
export const COCKROACH_MODEL_URL = "/assets/models/cockroach.glb";

function GltfRat() {
  return <GltfCritter url={RAT_MODEL_URL} targetSize={1.5} />;
}

function GltfCat() {
  return <GltfCritter url={CAT_MODEL_URL} targetSize={1.5} />;
}

function GltfSquirrel() {
  return <GltfCritter url={SQUIRREL_MODEL_URL} targetSize={1.5} />;
}

function GltfPigeon() {
  return <GltfCritter url={PIGEON_MODEL_URL} targetSize={1.5} />;
}

function GltfDog() {
  return <GltfCritter url={DOG_MODEL_URL} targetSize={1.5} />;
}

function GltfCockroach() {
  return <GltfCritter url={COCKROACH_MODEL_URL} targetSize={1.5} />;
}

const SPECIES = {
  dog: GltfDog,
  cat: GltfCat,
  pigeon: GltfPigeon,
  rat: GltfRat,
  squirrel: GltfSquirrel,
  cockroach: GltfCockroach,
};

export function AnimalMesh({ species }) {
  const Component = SPECIES[species];
  if (!Component) return null;
  return <Component />;
}
