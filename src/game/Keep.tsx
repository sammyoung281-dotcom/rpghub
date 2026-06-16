import { RoundedBox } from "@react-three/drei";

/**
 * The High Keep — the Chairman's throne hub, built from rounded low-poly
 * primitives for a cosy Black & White feel. Procedural for now; swap individual
 * pieces for Kenney/Quaternius GLTF models later without touching the layout.
 */

function Tower({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* body */}
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 5, 16]} />
        <meshStandardMaterial color="#9c8a6a" roughness={0.9} />
      </mesh>
      {/* battlement ring */}
      <mesh castShadow position={[0, 5.1, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.5, 16]} />
        <meshStandardMaterial color="#8a7757" roughness={0.9} />
      </mesh>
      {/* conical roof */}
      <mesh castShadow position={[0, 6.4, 0]}>
        <coneGeometry args={[1.9, 2.4, 16]} />
        <meshStandardMaterial color="#7a2f2b" roughness={0.7} />
      </mesh>
      {/* banner pole + flag */}
      <mesh position={[0, 8.0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
        <meshStandardMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0.45, 8.2, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.04]} />
        <meshStandardMaterial color="#c9a24b" />
      </mesh>
    </group>
  );
}

function Wall({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return (
    <RoundedBox position={position} args={args} radius={0.18} smoothness={3} castShadow receiveShadow>
      <meshStandardMaterial color="#a39270" roughness={0.95} />
    </RoundedBox>
  );
}

export default function Keep() {
  return (
    <group>
      {/* raised stone courtyard floor */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[20, 20, 0.3, 48]} />
        <meshStandardMaterial color="#b9ab86" roughness={1} />
      </mesh>

      {/* central throne dais */}
      <mesh castShadow receiveShadow position={[0, 0.45, -6]}>
        <cylinderGeometry args={[4.2, 4.6, 0.6, 32]} />
        <meshStandardMaterial color="#7b5fa0" roughness={0.85} />
      </mesh>
      {/* the throne */}
      <group position={[0, 0.75, -6]}>
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[1.8, 1.2, 1.4]} />
          <meshStandardMaterial color="#caa64d" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 1.9, -0.6]}>
          <boxGeometry args={[1.8, 2.4, 0.3]} />
          <meshStandardMaterial color="#caa64d" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* corner towers */}
      <Tower x={-14} z={-14} />
      <Tower x={14} z={-14} />
      <Tower x={-14} z={14} />
      <Tower x={14} z={14} />

      {/* perimeter walls (gap at front for the entrance) */}
      <Wall position={[0, 1.6, -16]} args={[26, 3.2, 1.2]} />
      <Wall position={[-16, 1.6, 0]} args={[1.2, 3.2, 26]} />
      <Wall position={[16, 1.6, 0]} args={[1.2, 3.2, 26]} />
      <Wall position={[-9.5, 1.6, 16]} args={[7, 3.2, 1.2]} />
      <Wall position={[9.5, 1.6, 16]} args={[7, 3.2, 1.2]} />
    </group>
  );
}
