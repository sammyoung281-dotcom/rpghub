import { useRealmStore } from "../store/useRealmStore";
import { SCENES, STARTING_SCENE } from "../data/scenes";
import { CHARACTER_LIST } from "../data/characters";
import { URGENCY_COLOR, type Urgency } from "../types";
import "./RealmMap.css";

/**
 * Fast-travel map — an ADHD shortcut to glide the camera to any space without
 * panning across the whole realm. Each place shows a colour pip if someone
 * there needs the Chairman, so open loops stay visible (object permanence).
 */
export default function RealmMap() {
  const open = useRealmStore((s) => s.mapOpen);
  const setOpen = useRealmStore((s) => s.setMapOpen);
  const focusCamera = useRealmStore((s) => s.focusCamera);
  const characterMarker = useRealmStore((s) => s.characterMarker);
  // subscribe so pips refresh as quests change
  useRealmStore((s) => s.proposals);
  useRealmStore((s) => s.quests);

  if (!open) return null;
  const scene = SCENES[STARTING_SCENE];

  /** Most urgent marker among characters belonging to a region. */
  const regionMarker = (guildId: string | null): Urgency | undefined => {
    const here = CHARACTER_LIST.filter((c) => c.guildId === guildId);
    const marks = here.map((c) => characterMarker(c.id));
    if (marks.includes("needs_me")) return "needs_me";
    if (marks.includes("in_progress")) return "in_progress";
    if (marks.includes("done")) return "done";
    return undefined;
  };

  return (
    <div className="map-backdrop" onClick={() => setOpen(false)}>
      <div className="map-panel" onClick={(e) => e.stopPropagation()}>
        <header className="map-head">
          <h2>🗺️ Travel the Realm</h2>
          <button className="map-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="map-list">
          {scene.regions.map((r) => {
            const mark = regionMarker(r.guildId);
            return (
              <button
                key={r.id}
                className="map-place"
                onClick={() => {
                  focusCamera({ x: r.cx, y: r.cy, zoom: r.focusZoom });
                  setOpen(false);
                }}
              >
                <span className="map-emoji">{r.emoji}</span>
                <span className="map-name">{r.name}</span>
                {mark && <span className="map-pip" style={{ background: URGENCY_COLOR[mark] }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
