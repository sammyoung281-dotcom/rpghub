import type { ReactNode } from "react";
import type { RealmScene, SceneRegion } from "../types";

/**
 * Procedural PLACEHOLDER for the continuous realm map — deliberately abstract,
 * not painterly (real painted art is dropped in as a PNG later; see README).
 * It fakes a 2.5D landscape: grass, connecting paths, raised stone platforms
 * with simple isometric-style buildings per region, trees and crystals. Enough
 * to navigate and see the layout; the real look comes from the painted map.
 */
export interface BackdropLayer {
  key: string;
  parallax: number; // <1 = far (moves less), 1 = ground, >1 = foreground
  node: ReactNode;
}

// ── tiny helpers ─────────────────────────────────────────────────────────────
type Pt = [number, number];
const pts = (a: Pt[]) => a.map(([x, y]) => `${x},${y}`).join(" ");

/** Lighten (amt>0) / darken (amt<0) a #rrggbb hex. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v + amt * 255)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** A raised stone platform (top ellipse + front wall) for the elevation feel. */
function platform(cx: number, cy: number, rx: number, ry: number, h: number, color: string) {
  return (
    <g>
      <path
        d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`}
        fill={shade(color, -0.16)}
      />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.74} ry={ry * 0.74} fill="none" stroke={shade(color, -0.1)} strokeWidth={6} strokeDasharray="26 16" />
    </g>
  );
}

/** A cosy faked-iso building (front wall + right side + gable roof + door). */
function building(cx: number, baseY: number, w: number, wallH: number, wall: string, roof: string) {
  const dep = w * 0.34;
  const dy = dep * 0.5;
  const rh = wallH * 0.62;
  const topY = baseY - wallH;
  const flb: Pt = [cx - w / 2, baseY];
  const frb: Pt = [cx + w / 2, baseY];
  const frt: Pt = [cx + w / 2, topY];
  const flt: Pt = [cx - w / 2, topY];
  const brb: Pt = [cx + w / 2 + dep, baseY - dy];
  const brt: Pt = [cx + w / 2 + dep, topY - dy];
  const ridgeF: Pt = [cx, topY - rh];
  const ridgeB: Pt = [cx + dep, topY - rh - dy];
  return (
    <g>
      <polygon points={pts([frb, brb, brt, frt])} fill={shade(wall, -0.16)} />
      <polygon points={pts([flb, frb, frt, flt])} fill={wall} />
      <polygon points={pts([frt, ridgeF, ridgeB, brt])} fill={shade(roof, -0.12)} />
      <polygon points={pts([flt, frt, ridgeF])} fill={roof} />
      {/* door + windows */}
      <rect x={cx - w * 0.1} y={baseY - wallH * 0.5} width={w * 0.2} height={wallH * 0.5} rx={6} fill={shade(wall, -0.34)} />
      <rect x={cx - w * 0.34} y={topY + wallH * 0.18} width={w * 0.16} height={w * 0.13} rx={4} fill={shade(wall, 0.22)} />
      <rect x={cx + w * 0.18} y={topY + wallH * 0.18} width={w * 0.16} height={w * 0.13} rx={4} fill={shade(wall, 0.22)} />
    </g>
  );
}

function tower(cx: number, baseY: number, w: number, h: number, wall: string, roof: string) {
  const topY = baseY - h;
  return (
    <g>
      <rect x={cx - w / 2} y={topY} width={w} height={h} rx={8} fill={wall} />
      <rect x={cx - w / 2} y={topY} width={w * 0.5} height={h} fill={shade(wall, 0.08)} />
      <polygon points={pts([[cx - w * 0.62, topY], [cx + w * 0.62, topY], [cx, topY - h * 0.4]])} fill={roof} />
      <rect x={cx - w * 0.16} y={baseY - h * 0.28} width={w * 0.32} height={h * 0.28} rx={5} fill={shade(wall, -0.34)} />
    </g>
  );
}

function smallTree(cx: number, cy: number, s: number) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={34} ry={12} fill="rgba(0,0,0,0.18)" />
      <rect x={-7} y={-34} width={14} height={40} rx={5} fill="#6b4a2b" />
      <circle cx={0} cy={-54} r={40} fill="#3f6a37" />
      <circle cx={-18} cy={-44} r={28} fill="#356030" />
      <circle cx={18} cy={-48} r={30} fill="#477a3c" />
    </g>
  );
}

// region accent palette for the placeholder buildings
const REGION_COLOR: Record<string, { wall: string; roof: string }> = {
  keep: { wall: "#cfc39a", roof: "#7a2f2b" },
  merchants: { wall: "#d8b25a", roof: "#8a5a22" },
  ledger: { wall: "#8fa6bd", roof: "#3c5a74" },
  hearth: { wall: "#d39a72", roof: "#8a4a2c" },
  scholars: { wall: "#9bbf78", roof: "#4a6d3a" },
};

function regionBuildings(r: SceneRegion): ReactNode {
  const col = REGION_COLOR[r.id] ?? REGION_COLOR.keep;
  const stone = "#b3a684";
  if (r.id === "keep") {
    return (
      <g>
        {platform(r.cx, r.cy, 420, 150, 46, "#b7a9cf")}
        {tower(r.cx - 300, r.cy - 30, 90, 320, stone, col.roof)}
        {tower(r.cx + 300, r.cy - 30, 90, 320, stone, col.roof)}
        {building(r.cx, r.cy - 10, 460, 230, col.wall, col.roof)}
      </g>
    );
  }
  if (r.id === "scholars") {
    return (
      <g>
        {platform(r.cx, r.cy, 320, 120, 40, stone)}
        {tower(r.cx, r.cy - 20, 130, 420, col.wall, col.roof)}
        {building(r.cx - 150, r.cy + 10, 200, 150, col.wall, col.roof)}
      </g>
    );
  }
  return (
    <g>
      {platform(r.cx, r.cy, 330, 130, 42, stone)}
      {building(r.cx, r.cy, 360, 200, col.wall, col.roof)}
    </g>
  );
}

function regionLabel(r: SceneRegion): ReactNode {
  const w = r.name.length * 16 + 60;
  const y = r.id === "keep" ? r.cy - 420 : r.id === "scholars" ? r.cy - 480 : r.cy - 300;
  return (
    <g>
      <rect x={r.cx - w / 2} y={y} width={w} height={48} rx={12} fill="#3a2a18cc" stroke="#c9a24b" strokeWidth={2} />
      <text x={r.cx} y={y + 32} textAnchor="middle" fontFamily="Trebuchet MS, sans-serif" fontSize={28} fill="#f4e9cf">
        {r.emoji} {r.name}
      </text>
    </g>
  );
}

// ── the layer stack ──────────────────────────────────────────────────────────
export function placeholderLayers(scene: RealmScene): BackdropLayer[] {
  const w = scene.width;
  const h = scene.height;
  const full = { width: "100%", height: "100%" } as const;
  const keep = scene.regions.find((r) => r.id === "keep") ?? scene.regions[0];

  // deterministic scatter for trees
  let seed = 9001;
  const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const trees: Pt[] = [];
  for (let i = 0; i < 90; i++) trees.push([rng() * w, h * 0.18 + rng() * h * 0.8]);

  return [
    {
      key: "sky",
      parallax: 0.15,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16323a" />
              <stop offset="55%" stopColor="#2c5340" />
              <stop offset="100%" stopColor="#467036" />
            </linearGradient>
            <radialGradient id="sun" cx="68%" cy="10%" r="45%">
              <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffe7a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill="url(#sky)" />
          <rect width={w} height={h} fill="url(#sun)" />
        </svg>
      ),
    },
    {
      key: "farscape",
      parallax: 0.42,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <path d={`M0 ${h * 0.34} Q ${w * 0.25} ${h * 0.2} ${w * 0.5} ${h * 0.32} T ${w} ${h * 0.3} L ${w} ${h} L 0 ${h} Z`} fill="#234a30" opacity="0.85" />
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={(i / 21) * w} cy={h * (0.26 + (i % 3) * 0.02)} r={120 + (i % 4) * 30} fill="#2c5836" opacity="0.6" />
          ))}
        </svg>
      ),
    },
    {
      key: "ground",
      parallax: 1,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="meadow" cx="50%" cy="48%" r="62%">
              <stop offset="0%" stopColor="#6fa24a" />
              <stop offset="100%" stopColor="#4c7a38" />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill="url(#meadow)" />

          {/* paths from the Keep to each guild */}
          {scene.regions
            .filter((r) => r.id !== "keep")
            .map((r) => (
              <path
                key={"path-" + r.id}
                d={`M ${keep.cx} ${keep.cy + 40} Q ${(keep.cx + r.cx) / 2} ${(keep.cy + r.cy) / 2 + 80} ${r.cx} ${r.cy}`}
                fill="none"
                stroke="#c2b083"
                strokeWidth={70}
                strokeLinecap="round"
                opacity="0.7"
              />
            ))}

          {/* scattered trees (drawn before buildings so buildings sit in front) */}
          {trees.map((t, i) => (
            <g key={"tree-" + i}>{smallTree(t[0], t[1], 0.7 + rng() * 0.7)}</g>
          ))}

          {/* regions: platform + buildings, painted back-to-front by cy */}
          {[...scene.regions]
            .sort((a, b) => a.cy - b.cy)
            .map((r) => (
              <g key={"reg-" + r.id}>{regionBuildings(r)}</g>
            ))}

          {/* region nameplates on top */}
          {scene.regions.map((r) => (
            <g key={"lbl-" + r.id}>{regionLabel(r)}</g>
          ))}
        </svg>
      ),
    },
    {
      key: "fg",
      parallax: 1.18,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <path d={`M-60 ${h} Q ${w * 0.05} ${h * 0.55} ${w * 0.015} 0 L-300 0 L-300 ${h} Z`} fill="#14201a" />
          <path d={`M${w + 60} ${h} Q ${w * 0.95} ${h * 0.55} ${w * 0.985} 0 L${w + 300} 0 L${w + 300} ${h} Z`} fill="#14201a" />
        </svg>
      ),
    },
  ];
}
