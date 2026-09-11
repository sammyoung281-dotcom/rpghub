import { useEffect, useMemo, useRef, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import type { MessageKind, RealmScene } from "../types";

/**
 * COURIERS — the message bus, made visible.
 *
 * Every raven the agents send flies across the map from sender to recipient.
 * This is the payoff for routing messages through a bus instead of letting
 * agents call each other directly: the data was already there, it just needed
 * drawing. When you press "Advance the Realm" you now SEE the realm talk to
 * itself — a request going down a chain, a report coming back up, a cross-guild
 * ask visibly detouring through the Elder.
 *
 * Renders inside the scene's depth layer, so it pans and zooms with the world.
 */

const FLIGHT_MS = 2200;
const STAGGER_MS = 260;

const KIND_GLYPH: Record<MessageKind, string> = {
  request: "📨",
  response: "↩",
  escalation: "⚠",
  report: "📜",
  permission: "🔑",
  verify: "🔍",
  broadcast: "📢",
};

const KIND_COLOR: Record<MessageKind, string> = {
  request: "#c9a24d",
  response: "#8fae7a",
  escalation: "#c0392b",
  report: "#9db4c9",
  permission: "#e0b64a",
  verify: "#7fb0a8",
  broadcast: "#b58ec9",
};

interface Flight {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  kind: MessageKind;
  subject: string;
  startAt: number;
}

export default function Couriers({ scene }: { scene: RealmScene }) {
  const messages = useRealmStore((s) => s.messages);
  const [flights, setFlights] = useState<Flight[]>([]);
  const seen = useRef<Set<string> | null>(null);

  /** Where each character stands in this scene, plus where "the Chairman" sits. */
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const h of scene.hotspots) map[h.characterId] = { x: h.x, y: h.y };
    const keep = scene.doors?.find((d) => d.to === "keep");
    map.chairman = keep
      ? { x: keep.x + keep.w / 2, y: keep.y + keep.h / 2 }
      : { x: scene.width / 2, y: scene.height * 0.12 };
    return map;
  }, [scene]);

  useEffect(() => {
    // On first run (including after a reload) remember what already exists
    // without replaying the entire history across the map.
    if (seen.current === null) {
      seen.current = new Set(messages.map((m) => m.id));
      return;
    }

    const fresh = messages.filter((m) => !seen.current!.has(m.id));
    if (!fresh.length) return;
    fresh.forEach((m) => seen.current!.add(m.id));

    const now = performance.now();
    const added: Flight[] = [];
    fresh.forEach((m, i) => {
      const from = positions[m.from];
      const to = positions[m.to];
      if (!from || !to) return; // someone isn't in this scene — nothing to draw
      added.push({
        id: m.id,
        x0: from.x,
        y0: from.y,
        x1: to.x,
        y1: to.y,
        kind: m.kind,
        subject: m.subject,
        startAt: now + i * STAGGER_MS,
      });
    });
    if (added.length) setFlights((f) => [...f, ...added]);
  }, [messages, positions]);

  // Retire finished flights.
  useEffect(() => {
    if (!flights.length) return;
    const timer = window.setInterval(() => {
      const now = performance.now();
      setFlights((f) => f.filter((fl) => now - fl.startAt < FLIGHT_MS + 400));
    }, 500);
    return () => window.clearInterval(timer);
  }, [flights.length]);

  if (!flights.length) return null;

  return (
    <>
      {flights.map((f) => (
        <Courier key={f.id} flight={f} />
      ))}
    </>
  );
}

function Courier({ flight }: { flight: Flight }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const step = () => {
      const elapsed = performance.now() - flight.startAt;
      if (elapsed < 0) {
        el.style.opacity = "0";
        raf = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(elapsed / FLIGHT_MS, 1);
      // ease-in-out so it launches and lands rather than sliding linearly
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = flight.x0 + (flight.x1 - flight.x0) * e;
      const y = flight.y0 + (flight.y1 - flight.y0) * e;
      // parabolic lift — it's a bird, not a slug
      const arc = Math.sin(t * Math.PI) * (60 + Math.hypot(flight.x1 - flight.x0, flight.y1 - flight.y0) * 0.12);
      const fade = t < 0.1 ? t / 0.1 : t > 0.88 ? (1 - t) / 0.12 : 1;

      el.style.transform = `translate(${x}px, ${y - arc}px)`;
      el.style.opacity = String(Math.max(0, fade));
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [flight]);

  const heading = flight.x1 >= flight.x0 ? 1 : -1;

  return (
    <div ref={ref} className="courier" style={{ zIndex: 999999 }} title={flight.subject}>
      <span className="courier-bird" style={{ transform: `scaleX(${heading})` }}>
        🕊
      </span>
      <span className="courier-tag" style={{ borderColor: KIND_COLOR[flight.kind] }}>
        {KIND_GLYPH[flight.kind]}
      </span>
    </div>
  );
}
