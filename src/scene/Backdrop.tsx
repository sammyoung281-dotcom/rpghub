import type { ReactNode } from "react";

/**
 * Procedural ATMOSPHERIC PLACEHOLDER backdrop — deliberately abstract, not
 * painterly (see README: real painted scenes are dropped in as PNGs later).
 * Returns a stack of full-scene layers; SceneStage applies parallax per layer
 * so panning gives a sense of depth. Layout/mood echoes the reference: misty
 * layered forest glade, glowing crystals, light shafts, a stone plaza.
 */
export interface BackdropLayer {
  key: string;
  parallax: number; // <1 = far (moves less), 1 = ground, >1 = foreground
  node: ReactNode;
}

export function placeholderLayers(w: number, h: number): BackdropLayer[] {
  const full = { width: "100%", height: "100%" } as const;

  return [
    // ── sky + sun glow ──
    {
      key: "sky",
      parallax: 0.12,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16323a" />
              <stop offset="42%" stopColor="#244a3e" />
              <stop offset="78%" stopColor="#3f6a3c" />
              <stop offset="100%" stopColor="#5d8a44" />
            </linearGradient>
            <radialGradient id="sun" cx="72%" cy="14%" r="42%">
              <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#ffe7a0" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffe7a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill="url(#sky)" />
          <rect width={w} height={h} fill="url(#sun)" />
        </svg>
      ),
    },

    // ── far cliffs + glowing crystals ──
    {
      key: "cliffs",
      parallax: 0.28,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* left cliff mass */}
          <path
            d={`M0 ${h} L0 ${h * 0.18} L${w * 0.1} ${h * 0.28} L${w * 0.18} ${h * 0.15} L${w * 0.26} ${h * 0.34} L${w * 0.3} ${h} Z`}
            fill="#1c3330"
          />
          {/* right cliff mass */}
          <path
            d={`M${w} ${h} L${w} ${h * 0.22} L${w * 0.88} ${h * 0.3} L${w * 0.8} ${h * 0.18} L${w * 0.72} ${h * 0.36} L${w * 0.7} ${h} Z`}
            fill="#1c3330"
          />
          {/* crystal clusters */}
          {[
            [w * 0.07, h * 0.55],
            [w * 0.12, h * 0.62],
            [w * 0.83, h * 0.5],
            [w * 0.9, h * 0.58],
          ].map(([cx, cy], i) => (
            <g key={i} filter="url(#glow)" className="crystal">
              <polygon
                points={`${cx},${cy - 36} ${cx + 12},${cy} ${cx},${cy + 14} ${cx - 12},${cy}`}
                fill="#5fe6e0"
                opacity="0.92"
              />
              <polygon
                points={`${cx + 16},${cy - 22} ${cx + 26},${cy + 4} ${cx + 16},${cy + 12} ${cx + 8},${cy + 2}`}
                fill="#3fc8d8"
                opacity="0.85"
              />
            </g>
          ))}
        </svg>
      ),
    },

    // ── mid forest canopy ──
    {
      key: "canopy",
      parallax: 0.5,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 14 }).map((_, i) => {
            const cx = (i / 13) * w;
            const cy = h * (0.28 + (i % 3) * 0.04);
            const r = 130 + (i % 4) * 40;
            return (
              <g key={i}>
                <rect x={cx - 14} y={cy} width="28" height={h * 0.5} fill="#2e4a2a" />
                <circle cx={cx} cy={cy} r={r} fill="#37592f" />
                <circle cx={cx - r * 0.4} cy={cy + 20} r={r * 0.7} fill="#2f4e29" />
                <circle cx={cx + r * 0.4} cy={cy + 10} r={r * 0.7} fill="#3d6334" />
              </g>
            );
          })}
        </svg>
      ),
    },

    // ── light shafts ──
    {
      key: "shafts",
      parallax: 0.44,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3c8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff3c8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="shafts">
            {[0.3, 0.45, 0.6, 0.72].map((fx, i) => {
              const x = w * fx;
              return (
                <polygon
                  key={i}
                  points={`${x},0 ${x + 120},0 ${x + 320},${h} ${x - 80},${h}`}
                  fill="url(#shaft)"
                  opacity={0.5 - i * 0.06}
                />
              );
            })}
          </g>
        </svg>
      ),
    },

    // ── ground plaza (parallax 1 — hotspots live on this plane) ──
    {
      key: "plaza",
      parallax: 1,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="grass" cx="50%" cy="62%" r="60%">
              <stop offset="0%" stopColor="#6fa24a" />
              <stop offset="100%" stopColor="#4c7a38" />
            </radialGradient>
          </defs>
          <rect x="0" y={h * 0.42} width={w} height={h * 0.58} fill="url(#grass)" />
          {/* stone plaza ellipse */}
          <ellipse cx={w * 0.55} cy={h * 0.66} rx={w * 0.26} ry={h * 0.2} fill="#b9ab86" />
          <ellipse cx={w * 0.55} cy={h * 0.66} rx={w * 0.26} ry={h * 0.2} fill="none" stroke="#9a8c66" strokeWidth="6" />
          {/* knotwork ring */}
          <ellipse cx={w * 0.55} cy={h * 0.66} rx={w * 0.2} ry={h * 0.15} fill="none" stroke="#8a7b58" strokeWidth="4" strokeDasharray="22 14" />
          <ellipse cx={w * 0.55} cy={h * 0.66} rx={w * 0.13} ry={h * 0.1} fill="none" stroke="#8a7b58" strokeWidth="3" strokeDasharray="14 10" />
          {/* glowing blue lantern-pillars flanking the plaza */}
          {[
            [w * 0.4, h * 0.78],
            [w * 0.71, h * 0.78],
          ].map(([cx, cy], i) => (
            <g key={i} className="crystal">
              <rect x={cx - 10} y={cy - 70} width="20" height="70" rx="5" fill="#5a6b8a" />
              <circle cx={cx} cy={cy - 78} r="14" fill="#6fd6ff" style={{ filter: "drop-shadow(0 0 14px #6fd6ff)" }} />
            </g>
          ))}
        </svg>
      ),
    },

    // ── foreground frame (closest — moves most) ──
    {
      key: "fg",
      parallax: 1.22,
      node: (
        <svg viewBox={`0 0 ${w} ${h}`} style={full} preserveAspectRatio="xMidYMid slice">
          {/* big dark trunks framing left & right */}
          <path d={`M-40 ${h} Q ${w * 0.06} ${h * 0.5} ${w * 0.02} 0 L-200 0 L-200 ${h} Z`} fill="#152019" />
          <path d={`M${w + 40} ${h} Q ${w * 0.94} ${h * 0.5} ${w * 0.98} 0 L${w + 200} 0 L${w + 200} ${h} Z`} fill="#152019" />
          {/* foreground foliage clumps */}
          <circle cx={w * 0.06} cy={h * 0.2} r="170" fill="#1c2b1d" />
          <circle cx={w * 0.95} cy={h * 0.25} r="190" fill="#1c2b1d" />
        </svg>
      ),
    },
  ];
}
