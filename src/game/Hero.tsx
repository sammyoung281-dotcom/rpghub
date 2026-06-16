import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useKeys } from "./useKeys";

const MOVE_SPEED = 7; // units/sec
const ROT_SPEED = 1.8; // rad/sec (Q/E camera rotate)
const CAM_DIST = 16;
const CAM_TILT = THREE.MathUtils.degToRad(52); // 3/4 god-game angle
const BOUND = 22; // courtyard half-extent the Sovereign can roam

/**
 * The Sovereign avatar. WASD/arrows move (camera-relative), Q/E orbit the
 * tilted camera around them. The camera always trails the hero at the god-game
 * 3/4 angle and smoothly follows.
 */
export default function Hero() {
  const group = useRef<THREE.Group>(null!);
  const keys = useKeys();
  const azimuth = useRef(Math.PI); // camera angle around hero
  const { camera } = useThree();

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); // guard against tab-switch spikes
    const k = keys.current;
    const g = group.current;

    // rotate camera
    if (k["KeyQ"]) azimuth.current -= ROT_SPEED * dt;
    if (k["KeyE"]) azimuth.current += ROT_SPEED * dt;
    const a = azimuth.current;

    // camera-relative movement basis on the ground (XZ) plane
    const fwd = new THREE.Vector2(-Math.sin(a), -Math.cos(a));
    const right = new THREE.Vector2(Math.cos(a), -Math.sin(a));

    let mx = 0;
    let mz = 0;
    if (k["KeyW"] || k["ArrowUp"]) (mx += fwd.x), (mz += fwd.y);
    if (k["KeyS"] || k["ArrowDown"]) (mx -= fwd.x), (mz -= fwd.y);
    if (k["KeyD"] || k["ArrowRight"]) (mx += right.x), (mz += right.y);
    if (k["KeyA"] || k["ArrowLeft"]) (mx -= right.x), (mz -= right.y);

    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
      g.position.x = THREE.MathUtils.clamp(g.position.x + mx * MOVE_SPEED * dt, -BOUND, BOUND);
      g.position.z = THREE.MathUtils.clamp(g.position.z + mz * MOVE_SPEED * dt, -BOUND, BOUND);
      // face travel direction
      const targetRot = Math.atan2(mx, mz);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRot, 0.25);
    }

    // trail camera at the tilted angle, smoothed
    const horiz = CAM_DIST * Math.cos(CAM_TILT);
    const height = CAM_DIST * Math.sin(CAM_TILT);
    const want = new THREE.Vector3(
      g.position.x + horiz * Math.sin(a),
      height,
      g.position.z + horiz * Math.cos(a)
    );
    camera.position.lerp(want, 1 - Math.pow(0.0015, dt));
    camera.lookAt(g.position.x, 1.2, g.position.z);
  });

  return (
    <group ref={group} position={[0, 0, 8]}>
      {/* cloak body */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.45, 0.8, 6, 16]} />
        <meshStandardMaterial color="#2c4a7a" roughness={0.8} />
      </mesh>
      {/* head */}
      <mesh castShadow position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#e8c79a" roughness={0.9} />
      </mesh>
      {/* gold crown */}
      <mesh castShadow position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.16, 16]} />
        <meshStandardMaterial color="#c9a24b" metalness={0.7} roughness={0.3} />
      </mesh>

      <Html position={[0, 2.7, 0]} center distanceFactor={18} occlude>
        <div
          style={{
            background: "#3a2a18cc",
            color: "#f4e9cf",
            padding: "2px 8px",
            borderRadius: 6,
            border: "1px solid #c9a24b",
            font: "600 13px Trebuchet MS, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          The Sovereign
        </div>
      </Html>
    </group>
  );
}
