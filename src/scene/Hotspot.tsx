import type { SceneHotspot } from "../types";
import { URGENCY_COLOR } from "../types";

/**
 * A character standing in the scene. Placeholder = a glowing disc + emoji +
 * name plate; swap for a sprite later (set a background image on .hs-body).
 * The floating marker shows colour-coded urgency (ADHD rule #3) and a "!" when
 * the character needs the Chairman.
 */
export default function Hotspot({ spot, onClick }: { spot: SceneHotspot; onClick: () => void }) {
  const needs = spot.marker === "needs_me";
  return (
    <button
      className="hotspot"
      style={{ left: spot.x, top: spot.y }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {spot.marker && (
        <span
          className={"hs-marker" + (needs ? " urgent" : "")}
          style={{ background: URGENCY_COLOR[spot.marker] }}
        >
          {needs ? "!" : ""}
        </span>
      )}
      <span className="hs-body" style={{ background: spot.accent, boxShadow: `0 0 22px ${spot.accent}` }}>
        {spot.emoji}
      </span>
      <span className="hs-name">{spot.name}</span>
    </button>
  );
}
