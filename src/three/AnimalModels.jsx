// Simple low-poly critters built entirely from three.js primitives -- no
// downloaded model files, so there's nothing to source, license, or verify.
// Low segment counts + flatShading give the faceted "low-poly toy" look.
// Each species is a thin wrapper around <Quadruped> (or its own build for
// the two-legged pigeon and six-legged cockroach) that only varies color and
// a few silhouette shapes, so the six animals share one body rig.

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

// tailShape: "low" (straight out the back), "up" (two-segment upward curve),
// "bushy" (one big arched puff, e.g. a squirrel).
// The body's rear cap is centered around (0, 0, -0.275) with radius 0.34 --
// anchors here land well inside that (not just touching), a deliberate
// safety margin so the tail reads as attached even accounting for its own
// rotation shifting where its visible mass ends up.
function Tail({ color, shape, length = 0.5 }) {
  if (shape === "bushy") {
    return (
      <mesh position={[0, 0.28, -0.45]} rotation={[0.7, 0, 0]}>
        <sphereGeometry args={[0.32, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
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

function Quadruped({ color, snoutColor, earShape, tailShape, snoutLength = 0.28, legCount = 4 }) {
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
      <Tail color={color} shape={tailShape} />
      <Legs color={color} count={legCount} />
    </group>
  );
}

export function Dog() {
  return <Quadruped color="#c98a4b" snoutColor="#e8c19a" earShape="floppy" tailShape="up" snoutLength={0.32} />;
}

export function Cat() {
  return <Quadruped color="#8a8a92" snoutColor="#c7c7cf" earShape="pointyLarge" tailShape="up" snoutLength={0.2} />;
}

export function Rat() {
  return <Quadruped color="#7a7269" snoutColor="#a89f95" earShape="round" tailShape="low" snoutLength={0.3} />;
}

export function Squirrel() {
  return <Quadruped color="#a85c32" snoutColor="#d9a878" earShape="big" tailShape="bushy" snoutLength={0.18} />;
}

export function Pigeon() {
  const color = "#8d95a3";
  return (
    <group>
      <mesh scale={[1, 1.15, 1.3]}>
        <sphereGeometry args={[0.36, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
      <group position={[0, 0.32, 0.32]}>
        <mesh>
          <sphereGeometry args={[0.2, 7, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[0, -0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.18, 6]} />
          <meshStandardMaterial color="#e8a53d" {...FLAT} />
        </mesh>
        <Eyes z={0.14} y={0.05} spread={0.12} />
      </group>
      <mesh position={[-0.34, 0, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.45, 0.06, 0.32]} />
        <meshStandardMaterial color="#6b7280" {...FLAT} />
      </mesh>
      <mesh position={[0.34, 0, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.45, 0.06, 0.32]} />
        <meshStandardMaterial color="#6b7280" {...FLAT} />
      </mesh>
      <mesh position={[0, -0.05, -0.42]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.32, 0.05, 0.28]} />
        <meshStandardMaterial color="#4b5160" {...FLAT} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 5]} />
        <meshStandardMaterial color="#e8a53d" {...FLAT} />
      </mesh>
    </group>
  );
}

export function Cockroach() {
  const color = "#3b2a20";
  const legAngles = [-0.9, 0, 0.9];
  return (
    <group rotation={[0, 0, 0]}>
      <mesh scale={[0.62, 0.38, 1]}>
        <sphereGeometry args={[0.42, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0.4]} scale={[0.5, 0.35, 0.5]}>
        <sphereGeometry args={[0.24, 7, 6]} />
        <meshStandardMaterial color={color} {...FLAT} metalness={0.2} roughness={0.4} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.1, 0.55]} rotation={[1.4, 0, x > 0 ? 0.3 : -0.3]}>
          <cylinderGeometry args={[0.012, 0.02, 0.4, 4]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      ))}
      {legAngles.map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`${z}-${side}`}
            position={[side * 0.32, -0.08, z * 0.16]}
            rotation={[0, 0, side * 0.9]}
          >
            <cylinderGeometry args={[0.02, 0.025, 0.34, 4]} />
            <meshStandardMaterial color={color} {...FLAT} />
          </mesh>
        )),
      )}
    </group>
  );
}

const SPECIES = {
  dog: Dog,
  cat: Cat,
  pigeon: Pigeon,
  rat: Rat,
  squirrel: Squirrel,
  cockroach: Cockroach,
};

export function AnimalMesh({ species }) {
  const Component = SPECIES[species];
  if (!Component) return null;
  return <Component />;
}
