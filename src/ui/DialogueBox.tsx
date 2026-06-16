import { useEffect, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import type { ChoiceTone } from "../types";
import "./DialogueBox.css";

/**
 * The reusable parchment dialogue box — the backbone of the whole game.
 * Used for quests, questions, reports, permissions.
 *
 * ADHD rules enforced here:
 *  - chunked text (one ≤2-sentence chunk at a time, "Continue ▸")
 *  - big choice buttons only after the last chunk (one decision at a time)
 */
export default function DialogueBox() {
  const dialogue = useRealmStore((s) => s.activeDialogue);
  const resolve = useRealmStore((s) => s.resolveDialogue);
  const [chunkIndex, setChunkIndex] = useState(0);

  // reset to first chunk whenever a new dialogue opens
  useEffect(() => {
    setChunkIndex(0);
  }, [dialogue?.id]);

  if (!dialogue) return null;

  const isLastChunk = chunkIndex >= dialogue.chunks.length - 1;
  const accent = dialogue.accent ?? "#8c2b27";

  const advance = () => setChunkIndex((i) => Math.min(i + 1, dialogue.chunks.length - 1));

  return (
    <div className="dlg-backdrop" onClick={isLastChunk ? undefined : advance}>
      <div className="dlg-parchment" style={{ borderColor: accent }} onClick={(e) => e.stopPropagation()}>
        <div className="dlg-header">
          <div className="dlg-portrait" style={{ background: accent }}>
            <span>{dialogue.portrait}</span>
          </div>
          <div className="dlg-id">
            <div className="dlg-name">{dialogue.speakerName}</div>
            {dialogue.speakerTitle && <div className="dlg-title">{dialogue.speakerTitle}</div>}
          </div>
        </div>

        <div className="dlg-body">
          <p key={chunkIndex} className="dlg-chunk">
            {dialogue.chunks[chunkIndex]}
          </p>
          <div className="dlg-progress">
            {dialogue.chunks.map((_, i) => (
              <span key={i} className={"dlg-pip" + (i === chunkIndex ? " on" : "")} />
            ))}
          </div>
        </div>

        <div className="dlg-actions">
          {!isLastChunk ? (
            <button className="dlg-btn neutral" onClick={advance}>
              Continue ▸
            </button>
          ) : (
            dialogue.choices.map((c) => (
              <button
                key={c.id}
                className={"dlg-btn " + (c.tone ?? "neutral")}
                onClick={() => resolve(c.id)}
              >
                {choiceGlyph(c.tone)} {c.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function choiceGlyph(tone?: ChoiceTone) {
  if (tone === "accept") return "✔";
  if (tone === "decline") return "✘";
  return "•";
}
