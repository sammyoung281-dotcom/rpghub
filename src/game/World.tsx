import { Canvas } from "@react-three/fiber";
import { SoftShadows } from "@react-three/drei";
import Hero from "./Hero";
import Keep from "./Keep";
import Scenery from "./Scenery";

/**
 * The 3D world root. react-three-fiber owns the canvas; React UI overlays
 * (dialogue, scroll, journal) render on top in App.tsx.
 *
 * Style target: late-90s top-down god-game (Black & White / Populous), but with
 * modern rendering — soft shadows, warm directional sun, cosy fog — for the
 * "higher bit-rate" look. All geometry is procedural so it runs with zero assets.
 */
export default function World() {
  return (
    <div id="game-root">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ fov: 45, near: 0.1, far: 400, position: [0, 13, 24] }}
      >
        {/* cosy sky + distance haze */}
        <color attach="background" args={["#cfe6f2"]} />
        <fog attach="fog" args={["#cfe6f2", 55, 110]} />

        {/* softened contact shadows for the god-game cosy feel */}
        <SoftShadows size={28} samples={12} focus={0.6} />

        {/* warm key sun */}
        <directionalLight
          position={[24, 34, 14]}
          intensity={1.5}
          color="#fff1d4"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-near={1}
          shadow-camera-far={120}
          shadow-bias={-0.0004}
        />
        {/* sky/ground bounce + gentle fill */}
        <hemisphereLight args={["#bcd6ff", "#5a6b3a", 0.7]} />
        <ambientLight intensity={0.25} />

        <Scenery />
        <Keep />
        <Hero />
      </Canvas>
    </div>
  );
}
