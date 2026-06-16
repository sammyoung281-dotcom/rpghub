import { useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { CHARACTER_LIST } from "../data/characters";
import { GUILDS } from "../data/guilds";
import { SCENES, STARTING_SCENE } from "../data/scenes";
import type { CharacterId } from "../types";
import "./DecreeQuill.css";

/**
 * Low-friction capture (ADHD rule #7): hand any character a brief. Opening the
 * quill is 1 click; pick a recipient + dash off the task. Creates an in-progress
 * quest owned by that character (the Chairman is delegating, not asking).
 */
export default function DecreeQuill() {
  const open = useRealmStore((s) => s.decreeOpen);
  const setOpen = useRealmStore((s) => s.setDecreeOpen);
  const decreeQuest = useRealmStore((s) => s.decreeQuest);
  const focusCamera = useRealmStore((s) => s.focusCamera);

  const [who, setWho] = useState<CharacterId>("brannock");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setTitle("");
    setBrief("");
  };

  const decree = () => {
    if (!title.trim()) return;
    decreeQuest(who, title.trim(), brief.trim() || "(no further details)");
    const spot = SCENES[STARTING_SCENE].hotspots.find((h) => h.characterId === who);
    if (spot) focusCamera({ x: spot.x, y: spot.y - 80, zoom: 1.1 });
    close();
  };

  return (
    <div className="dec-backdrop" onClick={close}>
      <div className="dec-panel" onClick={(e) => e.stopPropagation()}>
        <header className="dec-head">
          <h2>🪶 Decree a Task</h2>
          <button className="dec-close" onClick={close} aria-label="Close">✕</button>
        </header>

        <label className="dec-label">To whom?</label>
        <div className="dec-who">
          {CHARACTER_LIST.map((c) => (
            <button
              key={c.id}
              className={"dec-chip" + (who === c.id ? " on" : "")}
              onClick={() => setWho(c.id)}
              title={c.role}
            >
              {c.portrait} {c.name.split(" ")[0]}
              <em>{c.guildId ? GUILDS[c.guildId].emoji : "🏰"}</em>
            </button>
          ))}
        </div>

        <label className="dec-label">The task</label>
        <input
          className="dec-input"
          placeholder="e.g. Ship the v2 update to the store"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="dec-brief"
          placeholder="Paste the brief / details (optional)…"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
        />

        <button className="dec-go" disabled={!title.trim()} onClick={decree}>
          Decree it ▸
        </button>
      </div>
    </div>
  );
}
