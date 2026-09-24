// Simple low-poly critters built entirely from three.js primitives -- no
// downloaded model files, so there's nothing to source, license, or verify.
// Low segment counts + flatShading give the faceted "low-poly toy" look.
// Each species is a thin wrapper around <Quadruped> (or its own build for
// the two-legged pigeon and six-legged cockroach) that only varies color and
// a few silhouette shapes, so the six animals share one body rig.

const FLAT = { flatShading: true, roughness: 0.75 };

function Eyes({ z = 0.55, y = 0.15, spread = 0.16 }) {
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

function Legs({ color, count = 4, bodyLength = 0.7, bodyWidth = 0.32, height = 0.28 }) {
  const xs = count === 4 ? [-bodyWidth * 0.55, bodyWidth * 0.55] : [0];
  const zs = count === 4 ? [-bodyLength * 0.32, bodyLength * 0.32] : [0];
  const positions = [];
  zs.forEach((z) => xs.forEach((x) => positions.push([x, -height / 2, z])));
  return positions.map(([x, y, z]) => (
    <mesh key={`${x}-${z}`} position={[x, y, z]}>
      <cylinderGeometry args={[0.05, 0.06, height, 6]} />
      <meshStandardMaterial color={color} {...FLAT} />
    </mesh>
  ));
}

// tailShape: "low" (straight out the back), "up" (two-segment upward curve),
// "bushy" (one big arched puff, e.g. a squirrel).
function Tail({ color, shape, length = 0.5 }) {
  if (shape === "bushy") {
    return (
      <mesh position={[0, 0.35, -0.55]} rotation={[0.7, 0, 0]}>
        <sphereGeometry args={[0.32, 8, 7]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
    );
  }
  if (shape === "up") {
    return (
      <group position={[0, 0.05, -0.5]}>
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
    <mesh position={[0, 0.02, -0.65]} rotation={[1.45, 0, 0]}>
      <cylinderGeometry args={[0.035, 0.06, length, 6]} />
      <meshStandardMaterial color={color} {...FLAT} />
    </mesh>
  );
}

// earShape: "floppy" (dog), "pointyLarge" (cat/rat), "round" (bear-ish/rat
// alt), "big" (squirrel's more prominent pointed ears).
function Ears({ color, shape }) {
  const common = [0.2, 0.5, 0.3];
  if (shape === "floppy") {
    return (
      <>
        <mesh position={[-common[0], common[1] - 0.1, common[2]]} rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.08, 0.22, 3, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[common[0], common[1] - 0.1, common[2]]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.08, 0.22, 3, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </>
    );
  }
  if (shape === "round") {
    return (
      <>
        <mesh position={[-common[0] * 0.8, common[1], common[2]]}>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
        <mesh position={[common[0] * 0.8, common[1], common[2]]}>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshStandardMaterial color={color} {...FLAT} />
        </mesh>
      </>
    );
  }
  const scale = shape === "big" ? 1.3 : 1;
  return (
    <>
      <mesh position={[-common[0], common[1] + 0.08 * scale, common[2]]} rotation={[0.1, 0, 0.25]} scale={scale}>
        <coneGeometry args={[0.11, 0.28, 6]} />
        <meshStandardMaterial color={color} {...FLAT} />
      </mesh>
      <mesh position={[common[0], common[1] + 0.08 * scale, common[2]]} rotation={[0.1, 0, -0.25]} scale={scale}>
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
        <Eyes z={0.28} />
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
        <Eyes z={0.16} y={0.05} spread={0.12} />
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
