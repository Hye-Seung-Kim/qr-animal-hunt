import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";

// Loads a real .glb model and auto-centers + auto-scales it to roughly the
// same footprint the hand-built primitive critters occupy, so a downloaded
// model and a procedural one can sit side by side in SPECIES without each
// one needing hand-tuned numbers. `targetSize` is the desired largest
// dimension (X/Y/Z) after scaling -- tune per-model if one still reads as
// too big/small relative to the others.
export function GltfCritter({ url, targetSize = 1.4 }) {
  const gltf = useLoader(GLTFLoader, url);

  const { scene, scale, offset } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);
    const largestDimension = Math.max(size.x, size.y, size.z) || 1;
    return {
      scene: cloned,
      scale: targetSize / largestDimension,
      offset: [-center.x, -box.min.y, -center.z],
    };
  }, [gltf, targetSize]);

  return (
    <group scale={scale}>
      <primitive object={scene} position={offset} />
    </group>
  );
}

// Kicks off the download as soon as AnimalScene mounts (i.e. as soon as a
// round starts, well before any specific animal is detected) instead of
// waiting until this species is actually the one being rendered -- by the
// time a player finds the right QR, the model should already be cached.
GltfCritter.preload = (url) => useLoader.preload(GLTFLoader, url);
