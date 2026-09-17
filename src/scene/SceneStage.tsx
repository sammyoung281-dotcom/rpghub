import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { SCENES, STARTING_SCENE } from "../data/scenes";
import { useCamera } from "./useCamera";
import Sprite from "./Sprite";
import Motes from "./Motes";
import PixelPlaceholder from "./PixelPlaceholder";
import Couriers from "./Couriers";
import { openCharacterDialogue } from "./interactions";
import { asset } from "../asset";
import "./scene.css";

interface RenderLayer {
  key: string;
  parallax: number;
  node: ReactNode;
}

/**
 * The pixel 2.5D world. Renders, back-to-front:
 *  1. behind layers (background + ground, or the procedural placeholder),
 *  2. a DEPTH container (parallax 1) holding occluders + sprites, all y-sorted by
 *     z-index = their baseline, so characters pass behind/in front of props,
 *  3. light layers (additive) on top.
 * Free god-camera (contain-zoom + pan overscan) via useCamera.
 */
export default function SceneStage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

  const activeSceneId = useRealmStore((s) => s.activeSceneId);
  const scene = SCENES[activeSceneId] ?? SCENES[STARTING_SCENE];
  const cameraTarget = useRealmStore((s) => s.cameraTarget);
  const clearCameraTarget = useRealmStore((s) => s.clearCameraTarget);
  useRealmStore((s) => s.proposals);
  useRealmStore((s) => s.quests);
  const characterMarker = useRealmStore((s) => s.characterMarker);
  const setActiveScene = useRealmStore((s) => s.setActiveScene);

  useEffect(() => {
    const onResize = () => {
      const el = viewportRef.current;
      if (el) setVp({ w: el.clientWidth, h: el.clientHeight });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cam = useCamera({
    sceneW: scene.width,
    sceneH: scene.height,
    viewportRef,
    focusTarget: cameraTarget,
    onFocusConsumed: clearCameraTarget,
  });

  const layerTransform = (parallax: number) => {
    const tx = vp.w / 2 / cam.zoom - cam.x * parallax;
    const ty = vp.h / 2 / cam.zoom - cam.y * parallax;
    return `translate(${tx}px, ${ty}px)`;
  };

  // split owner-supplied layers by role; fall back to the procedural placeholder
  const { behind, occluders, lights } = useMemo(() => {
    const L = scene.layers ?? [];
    const behindL: RenderLayer[] = L.filter((l) => l.z === "background" || l.z === "ground").map((l, i) => ({
      key: `b-${i}`,
      parallax: l.parallax ?? 1,
      node: <img className="scene-img" src={asset(l.src)} alt="" style={{ width: "100%", height: "100%" }} draggable={false} />,
    }));
    if (behindL.length === 0) {
      behindL.push({ key: "pixel-placeholder", parallax: 1, node: <PixelPlaceholder scene={scene} /> });
    }
    return {
      behind: behindL,
      occluders: L.filter((l) => l.z === "occluder"),
      lights: L.filter((l) => l.z === "light"),
    };
  }, [scene]);

  // Demo occluders so walk-behind is provable before real occluder PNGs land.
  const demoTrees = scene.layers ? [] : DEMO_TREES;

  return (
    <div id="game-root" ref={viewportRef} className="scene-viewport">
      <div className="scene-stage" style={{ transform: `scale(${cam.zoom})`, ["--zoom" as string]: cam.zoom } as CSSProperties}>
        {behind.map((l) => (
          <div key={l.key} className="scene-layer" style={{ width: scene.width, height: scene.height, transform: layerTransform(l.parallax) }}>
            {l.node}
          </div>
        ))}

        {/* clickable building doors (overworld) */}
        {scene.doors?.map((d) => (
          <button
            key={d.id}
            className="scene-door"
            style={{ transform: layerTransform(1), zIndex: 1 }}
            onClick={(e) => { e.stopPropagation(); setActiveScene(d.to); }}
            title={`Enter ${d.label}`}
          >
            <span className="door-rect" style={{ left: d.x, top: d.y, width: d.w, height: d.h }}>
              <span className="door-label">⮕ {d.label}</span>
            </span>
          </button>
        ))}

        {/* depth container: occluders + sprites, y-sorted by z-index */}
        <div className="scene-layer depth-layer" style={{ width: scene.width, height: scene.height, transform: layerTransform(1) }}>
          {occluders.map((l, i) => (
            <img
              key={`occ-${i}`}
              className="scene-img occluder"
              src={asset(l.src)}
              alt=""
              style={{ width: scene.width, height: scene.height, zIndex: Math.round(l.baseline ?? scene.height) }}
              draggable={false}
            />
          ))}
          {demoTrees.map((tr, i) => (
            <DemoTree key={`tree-${i}`} x={tr.x} y={tr.y} />
          ))}
          {scene.hotspots.map((spot) => (
            <Sprite
              key={spot.id}
              spot={spot}
              marker={characterMarker(spot.characterId)}
              onClick={() => openCharacterDialogue(spot.characterId)}
              spriteHeight={scene.spriteHeight ?? 190}
              zones={scene.elevationZones}
              lights={scene.lights}
              depthScale={scene.depthScale}
              sceneH={scene.height}
            />
          ))}
          {/* every message the agents send, drawn flying between them */}
          <Couriers scene={scene} />
        </div>

        {lights.map((l, i) => (
          <div key={`light-${i}`} className="scene-layer light-layer" style={{ width: scene.width, height: scene.height, transform: layerTransform(l.parallax ?? 1) }}>
            <img className="pixel-img" src={asset(l.src)} alt="" style={{ width: "100%", height: "100%" }} draggable={false} />
          </div>
        ))}
      </div>

      <Motes />
      <div className="scene-vignette" />
      <div className="scene-place-name">{scene.name}</div>
    </div>
  );
}

/** Placeholder occluder: a tree whose trunk base sits at (x,y); canopy occludes
 *  sprites with a higher baseline. z-index = trunk-base Y so it y-sorts. */
function DemoTree({ x, y }: { x: number; y: number }) {
  return (
    <svg
      className="demo-tree"
      viewBox="0 0 60 90"
      width={260}
      height={390}
      style={{ left: x, top: y, zIndex: Math.round(y) }}
    >
      <rect x="27" y="55" width="6" height="34" fill="#3d2516" />
      <circle cx="30" cy="40" r="22" fill="#16382c" />
      <circle cx="16" cy="46" r="15" fill="#1d4a35" />
      <circle cx="44" cy="46" r="16" fill="#214f3a" />
      <circle cx="30" cy="28" r="16" fill="#245c3f" />
    </svg>
  );
}

const DEMO_TREES = [
  { x: 1300, y: 1905 }, // Tasha paces vertically through this one
  { x: 2280, y: 1140 }, // beside the Keep plaza
  { x: 3380, y: 2660 }, // by the Scholars' tower
];
