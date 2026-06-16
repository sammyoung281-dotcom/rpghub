import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { SCENES, STARTING_SCENE } from "../data/scenes";
import { useCamera } from "./useCamera";
import Sprite from "./Sprite";
import Motes from "./Motes";
import PixelPlaceholder from "./PixelPlaceholder";
import { summonCharacter } from "./interactions";
import "./scene.css";

interface RenderLayer {
  key: string;
  parallax: number;
  node: ReactNode;
}

/**
 * The painted 2.5D world. Renders the active scene as a stack of parallax
 * layers under a free god-camera (pan/zoom/glide via useCamera). Hotspots sit
 * on the ground plane (parallax 1) and open the dialogue system on click.
 */
export default function SceneStage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

  const scene = SCENES[STARTING_SCENE];
  const cameraTarget = useRealmStore((s) => s.cameraTarget);
  const clearCameraTarget = useRealmStore((s) => s.clearCameraTarget);
  // subscribe to quest state so markers re-render when quests change
  useRealmStore((s) => s.proposals);
  useRealmStore((s) => s.quests);
  const characterMarker = useRealmStore((s) => s.characterMarker);

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

  // parallax: ground (p=1) maps world→screen 1:1 with the camera; far layers
  // move less, foreground more. The /zoom term keeps centring stable on zoom.
  const layerTransform = (parallax: number) => {
    const tx = vp.w / 2 / cam.zoom - cam.x * parallax;
    const ty = vp.h / 2 / cam.zoom - cam.y * parallax;
    return `translate(${tx}px, ${ty}px)`;
  };

  // Pixel layers: real owner-supplied PNGs if present, else the procedural
  // placeholder. All rendered crisp (image-rendering: pixelated, see scene.css).
  const layers: RenderLayer[] = useMemo(() => {
    if (scene.layers?.length) {
      return scene.layers.map((l, i) => ({
        key: `${l.z}-${i}`,
        parallax: l.parallax ?? 1,
        node: (
          <img
            className="pixel-img"
            src={l.src}
            alt=""
            style={{ width: "100%", height: "100%" }}
            draggable={false}
          />
        ),
      }));
    }
    return [{ key: "pixel-placeholder", parallax: 1, node: <PixelPlaceholder scene={scene} /> }];
  }, [scene]);

  return (
    <div id="game-root" ref={viewportRef} className="scene-viewport">
      <div className="scene-stage" style={{ transform: `scale(${cam.zoom})` }}>
        {layers.map((l) => (
          <div
            key={l.key}
            className="scene-layer"
            style={{ width: scene.width, height: scene.height, transform: layerTransform(l.parallax) }}
          >
            {l.node}
          </div>
        ))}

        {/* hotspots ride the ground plane (parallax 1) */}
        <div
          className="scene-layer hotspot-layer"
          style={{ width: scene.width, height: scene.height, transform: layerTransform(1) }}
        >
          {scene.hotspots.map((spot) => (
            <Sprite
              key={spot.id}
              spot={spot}
              marker={characterMarker(spot.characterId)}
              onClick={() => summonCharacter(scene, spot.characterId)}
            />
          ))}
        </div>
      </div>

      <Motes />
      <div className="scene-vignette" />
      <div className="scene-place-name">{scene.name}</div>
    </div>
  );
}
