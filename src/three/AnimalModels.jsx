// Most critters are built entirely from three.js primitives -- no downloaded
// model files, so there's nothing to source, license, or verify. Low segment
// counts + flatShading give the faceted "low-poly toy" look. Each species is
// a thin wrapper around <Quadruped> (or its own build for the two-legged
// pigeon and six-legged cockroach) that only varies color and a few
// silhouette shapes, so most of the six animals share one body rig.
// The rat is the exception: a real downloaded .glb (see GltfCritter) after
// primitives kept landing on "close but off" for it specifically.

import { GltfCritter } from "./GltfCritter";

const FLAT = { flatShading: true, roughness: 0.75 };

// The head sphere in Quadruped/Pigeon has radius 0.32/0.2 -- every anchor
// point below is chosen to land at or slightly inside that surface (verified
// by distance-from-center, not eyeballed) so parts read as attached rather
// than floating, which is what "ears floating separately" turned out to be:
// the old anchors were ~0.6 units from a 0.32-radius head.
function Eyes({ z = 0.24, y = 0.12, spread = 0.16 }) {
  return (
    <>
      <mesh position={[-spread, y, z]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#111111" {...FLAT} />
      </mesh>
      <mesh position={[spread, y, z]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#111111" {...FLAT} />
      </mesh>
    </>
  );
}

// Body capsule radius is 0.34; a leg anchored at y=-0.22 sits ~0.04 inside
// that surface at these x offsets (embedded, not floating), then extends
// down to y=-0.56 -- well outside the body, so the leg is actually visible
// instead of hidden entirely inside the torso (the previous numbers put the
// whole leg inside the body).
function Legs({ color, count = 4, height = 0.34 }) {
  const xs = count === 4 ? [-0.2, 0.2] : [0];
  const zs = count === 4 ? [-0.2, 0.2] : [0];
  const topY = -0.22;
  const positions = [];
  zs.forEach((z) => xs.forEach((x) => positions.push([x, z])));
  return positions.map(([x, z]) => (
    <mesh key={`${x}-${z}`} position={[x, topY - height / 2, z]}>
      <cylinderGeometry args={[0.05, 0.06, height, 6]} />
      <meshStandardMaterial color={color} {...FLAT} />
    </mesh>
  ));
}

// tailShape: "low" (straight out the back), "trail" (long, thin, tapering,
// drooping -- a rat's bare tail), "up" (two-segment upward curve), "bushy"
// (a curled plume of puffs arcing up and over the back -- a squirrel's).
// The body's rear cap is centered around (0, 0, -0.275) with radius 0.34 --
// anchors here land well inside that (not just touching), a deliberate
// safety margin so the tail reads as attached even accounting for its own
// rotation shifting where its visible mass ends up.
function Tail({ color, shape, length = 0.5 }) {
  if (shape === "bushy") {
    // A handful of overlapping puffs, shrinking as they arc up from the
    // tail base and curl forward over the back, rather than one blob.
    const puffs = [
      { pos: [0, 0.05, -0.5], r: 0.16 },
      { pos: [0, 0.26, -0.56], r: 0.19 },
      { pos: [0, 0.46, -0.44], r: 0.2 },
      { pos: [0, 0.55, -0.18], r: 0.17 },
      { pos: [0, 0.48, 0.04], r: 0.13 },
    ];
    return puffs.map(({ pos, r }, i) => (
      <mesh key={i} position={pos}>
        <sphereGeometry args={[r, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
    ));
  }
  if (shape === "trail") {
    return (
      <group position={[0, 0, -0.35]}>
        <mesh position={[0, -0.02, -length * 0.28]} rotation={[1.48, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.055, length * 0.55, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, -0.09, -length * 0.62]} rotation={[1.32, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.04, length * 0.45, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </group>
    );
  }
  if (shape === "up") {
    return (
      <group position={[0, 0.05, -0.4]}>
        <mesh position={[0, 0.12, -0.05]} rotation={[0.9, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.06, length * 0.6, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, 0.32, -0.28]} rotation={[1.8, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.05, length * 0.5, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </group>
    );
  }
  if (shape === "straightUp") {
    // A cat's tail: mostly vertical with a slight backward lean, tapering
    // to a fine point, with just a small hook at the very tip -- not the
    // curled-over shape "up" makes.
    return (
      <group position={[0, 0.05, -0.42]}>
        <mesh position={[0, 0.18, -0.02]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.065, length * 0.55, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, 0.42, -0.1]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.055, length * 0.4, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, 0.62, -0.12]} rotation={[0.65, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.03, length * 0.2, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={[0, 0.02, -0.45]} rotation={[1.45, 0, 0]}>
      <cylinderGeometry args={[0.035, 0.06, length, 6]} />
      <meshStandardMaterial color={color} {...FLAT} />
    </mesh>
  );
}

// earShape: "floppy" (dog), "pointyLarge" (cat/rat), "round" (bear-ish/rat
// alt), "big" (squirrel's more prominent pointed ears).
//
// Each anchor's distance from the head's center (radius 0.32) is noted --
// all land at or just inside that radius, so the ear's own geometry (which
// extends further from its anchor) is what pokes out, rather than the whole
// ear floating in empty space next to the head.
function Ears({ color, shape }) {
  if (shape === "floppy") {
    const anchor = [0.24, 0.05, 0.13]; // dist ~0.28, inside the 0.32 head
    return (
      <>
        <mesh position={[-anchor[0], anchor[1], anchor[2]]} rotation={[0, 0, 0.6]}>
          <capsuleGeometry args={[0.08, 0.22, 3, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[anchor[0], anchor[1], anchor[2]]} rotation={[0, 0, -0.6]}>
          <capsuleGeometry args={[0.08, 0.22, 3, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </>
    );
  }
  if (shape === "round") {
    const anchor = [0.2, 0.2, 0.1]; // dist ~0.30, inside the 0.32 head
    return (
      <>
        <mesh position={[-anchor[0], anchor[1], anchor[2]]}>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[anchor[0], anchor[1], anchor[2]]}>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </>
    );
  }
  const scale = shape === "big" ? 1.3 : 1;
  const anchor = [0.15, 0.2, 0.08]; // dist ~0.26, inside the 0.32 head
  return (
    <>
      <mesh position={[-anchor[0], anchor[1], anchor[2]]} rotation={[0.1, 0, 0.3]} scale={scale}>
        <coneGeometry args={[0.11, 0.28, 6]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
      <mesh position={[anchor[0], anchor[1], anchor[2]]} rotation={[0.1, 0, -0.3]} scale={scale}>
        <coneGeometry args={[0.11, 0.28, 6]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
    </>
  );
}

function Quadruped({ color, snoutColor, earShape, tailShape, tailLength = 0.5, snoutLength = 0.28, legCount = 4 }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.34, 0.55, 4, 8]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
      <group position={[0, 0.18, 0.55]}>
        <mesh>
          <sphereGeometry args={[0.32, 8, 7]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, -0.08, snoutLength * 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.16, snoutLength, 7]} />
          <meshStandardMaterial color={snoutColor || color} {...FLAT} />
        </mesh>
        <Eyes />
        <Ears color={color} shape={earShape} />
      </group>
      <Tail color={color} shape={tailShape} length={tailLength} />
      <Legs color={color} count={legCount} />
    </group>
  );
}

export function Dog() {
  return <Quadruped color="#c98a4b" snoutColor="#e8c19a" earShape="pointyLarge" tailShape="up" snoutLength={0.26} />;
}

export function Cat() {
  return <Quadruped color="#8a8a92" snoutColor="#c7c7cf" earShape="pointyLarge" tailShape="straightUp" snoutLength={0.2} />;
}

export function Rat() {
  return (
    <Quadruped
      color="#5c5650"
      snoutColor="#8f867d"
      earShape="round"
      tailShape="trail"
      tailLength={1.15}
      snoutLength={0.3}
    />
  );
}

export function Squirrel() {
  return (
    <Quadruped
      color="#a85c32"
      snoutColor="#d9a878"
      earShape="round"
      tailShape="bushy"
      snoutLength={0.18}
    />
  );
}

export function Pigeon() {
  const bodyColor = "#8d95a3";
  const neckColor = "#6b7a8a";
  const wingColor = "#6b7280";
  return (
    <group>
      {/* Upright egg-shaped body instead of a flying pose -- pigeons at
          rest stand tall with wings folded, not spread out to the sides. */}
      <mesh scale={[0.85, 1.25, 0.95]}>
        <sphereGeometry args={[0.32, 8, 7]} />
        <meshStandardMaterial color={bodyColor} {...FLAT} />
      </mesh>
      <mesh position={[0, 0.35, 0.12]} rotation={[0.35, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.22, 7]} />
        <meshStandardMaterial color={neckColor} {...FLAT} />
      </mesh>
      <group position={[0, 0.52, 0.26]}>
        <mesh>
          <sphereGeometry args={[0.16, 7, 6]} />
          <meshStandardMaterial color={neckColor} {...FLAT} />
        </mesh>
        <mesh position={[0, -0.02, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.045, 0.14, 6]} />
          <meshStandardMaterial color="#3a3f47" {...FLAT} />
        </mesh>
        <Eyes z={0.12} y={0.02} spread={0.1} />
      </group>
      {/* Wings held close against the flanks (near-vertical capsules with
          only a slight outward lean), not sticking out to the sides. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.3, -0.02, -0.04]} rotation={[0, 0, side * 0.15]}>
          <capsuleGeometry args={[0.1, 0.38, 3, 6]} />
          <meshStandardMaterial color={wingColor} {...FLAT} />
        </mesh>
      ))}
      <mesh position={[0, -0.1, -0.42]} rotation={[1.15, 0, 0]}>
        <boxGeometry args={[0.34, 0.03, 0.26]} />
        <meshStandardMaterial color="#4b5160" {...FLAT} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, -0.5, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.3, 5]} />
          <meshStandardMaterial color="#c0392b" {...FLAT} />
        </mesh>
      ))}
    </group>
  );
}

export function Cockroach() {
  const color = "#3b2216";
  // Each leg row gets its own splay angle (shallower up front, steeper
  // toward the back) so the six legs radiate outward like the reference
  // photo instead of all sitting parallel to each other.
  const rows = [
    { z: 0.26, angle: 0.5 },
    { z: 0, angle: 0.95 },
    { z: -0.24, angle: 1.3 },
  ];
  return (
    <group>
      <mesh scale={[0.55, 0.32, 1.15]}>
        <sphereGeometry args={[0.42, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.03, 0.46]} scale={[0.46, 0.3, 0.4]}>
        <sphereGeometry args={[0.26, 7, 6]} />
        <meshStandardMaterial color={color} {...FLAT} metalness={0.25} roughness={0.35} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.12, 0.58]} rotation={[1.3, 0, x > 0 ? 0.35 : -0.35]}>
          <cylinderGeometry args={[0.01, 0.018, 0.55, 4]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      ))}
      {rows.map(({ z, angle }) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}-${side}`} position={[side * 0.3, -0.06, z]} rotation={[0, 0, side * angle]}>
            <cylinderGeometry args={[0.018, 0.024, 0.4, 4]} />
            <meshStandardMaterial color={color} {...FLAT} />
          </mesh>
        )),
      )}
    </group>
  );
}

export const RAT_MODEL_URL = "/assets/models/rat.glb";
export const CAT_MODEL_URL = "/assets/models/cat.glb";
export const SQUIRREL_MODEL_URL = "/assets/models/squirrel.glb";
export const PIGEON_MODEL_URL = "/assets/models/pigeon.glb";

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

const SPECIES = {
  dog: Dog,
  cat: GltfCat,
  pigeon: GltfPigeon,
  rat: GltfRat,
  squirrel: GltfSquirrel,
  cockroach: Cockroach,
};

export function AnimalMesh({ species }) {
  const Component = SPECIES[species];
  if (!Component) return null;
  return <Component />;
}
