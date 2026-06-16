import { useMemo } from "react";

/** A single low-poly tree (trunk + two foliage cones). */
function Tree({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 1.6, 8]} />
        <meshStandardMaterial color="#6b4a2b" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 2.0, 0]}>
        <coneGeometry args={[1.3, 2.0, 9]} />
        <meshStandardMaterial color="#4f7a3a" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 3.0, 0]}>
        <coneGeometry args={[0.95, 1.6, 9]} />
        <meshStandardMaterial color="#5d8a44" roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * The grassland the Keep sits on, plus a ring of trees outside the walls.
 * Tree positions are deterministic (seeded) so the scene is stable across reloads.
 */
export default function Scenery() {
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number }[] = [];
    let seed = 1337;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 40; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 26 + rng() * 22;
      out.push({
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad,
        s: 0.8 + rng() * 0.8,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {/* grass ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#5a8a3c" roughness={1} />
      </mesh>

      {trees.map((t, i) => (
        <Tree key={i} {...t} />
      ))}
    </group>
  );
}
