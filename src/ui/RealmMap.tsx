import { useRealmStore } from "../store/useRealmStore";
import { SCENE_LIST } from "../data/scenes";
import { URGENCY_COLOR, type Urgency } from "../types";
import "./RealmMap.css";

/**
 * Fast-travel: jump straight to any place (scene) without walking. Each shows a
 * colour pip if someone there needs the Chairman, so open loops stay visible.
 */
export default function RealmMap() {
  const open = useRealmStore((s) => s.mapOpen);
  const setOpen = useRealmStore((s) => s.setMapOpen);
  const setActiveScene = useRealmStore((s) => s.setActiveScene);
  const activeSceneId = useRealmStore((s) => s.activeSceneId);
  const characterMarker = useRealmStore((s) => s.characterMarker);
  // subscribe so pips refresh as quests change
  useRealmStore((s) => s.proposals);
  useRealmStore((s) => s.quests);

  if (!open) return null;

  /** Most urgent marker among the characters living in a scene. */
  const sceneMarker = (sceneId: string): Urgency | undefined => {
    const scene = SCENE_LIST.find((s) => s.id === sceneId);
    const marks = scene?.hotspots.map((h) => characterMarker(h.characterId)) ?? [];
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
          {SCENE_LIST.map((s) => {
            const mark = sceneMarker(s.id);
            return (
              <button
                key={s.id}
                className={"map-place" + (s.id === activeSceneId ? " here" : "")}
                onClick={() => {
                  setActiveScene(s.id);
                  setOpen(false);
                }}
              >
                <span className="map-emoji">{s.emoji}</span>
                <span className="map-name">{s.name}</span>
                {s.id === activeSceneId && <span className="map-you">you are here</span>}
                {mark && <span className="map-pip" style={{ background: URGENCY_COLOR[mark] }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
