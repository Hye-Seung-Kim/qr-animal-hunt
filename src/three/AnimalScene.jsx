import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AnimalMesh,
  RAT_MODEL_URL,
  CAT_MODEL_URL,
  SQUIRREL_MODEL_URL,
  PIGEON_MODEL_URL,
  DOG_MODEL_URL,
} from "./AnimalModels";
import { GltfCritter } from "./GltfCritter";

function backOut(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Picks the first tracked entry with a resolved animal -- in practice there's
// realistically at most one meaningfully visible at a time during play (the
// round only cares about one QR), so no need to reproduce the 2D layer's
// side-by-side multi-entry layout here.
function pickVisibleEntry(trackedRef) {
  const tracked = trackedRef.current;
  if (!tracked) return null;
  for (const entry of tracked.values()) {
    if (entry.animal && entry.opacity > 0.01) return entry;
  }
  return null;
}

function AnimalRig({ trackedRef }) {
  const groupRef = useRef(null);
  const speciesRef = useRef(null);
  const [species, setSpecies] = useState(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const entry = pickVisibleEntry(trackedRef);

    if (!entry) {
      group.scale.setScalar(0);
      if (speciesRef.current !== null) {
        speciesRef.current = null;
        setSpecies(null);
      }
      return;
    }

    if (entry.animal.soundType !== speciesRef.current) {
      speciesRef.current = entry.animal.soundType;
      setSpecies(entry.animal.soundType);
    }

    const t = state.clock.elapsedTime;
    const popInT = Math.min(1, (performance.now() - entry.discoveredAt) / 280);
    const scale = Math.max(0, backOut(popInT)) * entry.opacity;
    group.scale.setScalar(scale);
    group.rotation.y = t * 0.6;
    group.position.y = Math.sin(t * 2.2) * 0.15;
  });

  return (
    <group ref={groupRef} scale={0}>
      {/* useLoader (used by any glb-backed species, e.g. the rat) suspends
          while its file downloads -- this boundary must live inside the r3f
          tree, not just wherever <AnimalScene> itself happens to be lazy-
          loaded from. fallback={null} means an unfinished load just shows
          nothing rather than a placeholder, which is fine since it's
          preloaded well before it's actually needed (see below). */}
      <Suspense fallback={null}>{species && <AnimalMesh species={species} />}</Suspense>
    </group>
  );
}

// Transparent WebGL layer stacked between the 2D QR overlay canvas and the
// HUD text -- the 2D canvas still draws the QR bounding box + caption; this
// only draws the animal itself, always centered (matching the 2D layer's own
// "pin it to screen center" decision), reading the same live tracking data
// useQRScanner already maintains rather than a separate React state stream.
export function AnimalScene({ trackedRef }) {
  // Start downloading the glb-backed models as soon as a round begins (this
  // component only mounts once CameraView does), rather than waiting until
  // one is actually the detected species -- by the time a player finds that
  // QR, the model should already be cached and load instantly.
  useEffect(() => {
    GltfCritter.preload(RAT_MODEL_URL);
    GltfCritter.preload(CAT_MODEL_URL);
    GltfCritter.preload(SQUIRREL_MODEL_URL);
    GltfCritter.preload(PIGEON_MODEL_URL);
    GltfCritter.preload(DOG_MODEL_URL);
  }, []);

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.4, 3.4], fov: 40 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={1.2} />
      <directionalLight position={[-2, -1, -3]} intensity={0.3} />
      <AnimalRig trackedRef={trackedRef} />
    </Canvas>
  );
}
