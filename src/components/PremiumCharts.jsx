/**
 * PremiumCharts.jsx
 * ─────────────────────────────────────────────────────────────────
 * Visual-only enhancement layer for Recharts.
 * Drop-in replacements / wrappers that add premium gradients, glows,
 * rounded bars, and animations.  NO data or chart logic is changed.
 *
 * 2026 Smart Agriculture Analytics Platform Edition
 * Palette: 12 lush green shades — Forest, Emerald, Leaf, Lime, Olive,
 *          Moss, Sage, Mint, Tea, Pine, Fern, Jade
 * ─────────────────────────────────────────────────────────────────
 */

import { Rectangle } from "recharts";

// ── 1. PREMIUM COLOR PALETTE — 12 Lush Agriculture Greens ──────────
export const PREMIUM_GRADIENTS = [
  // Forest Green
  { id: "pg0",  top: "#2D7D47", bot: "#1A5C38", glow: "rgba(26,92,56,0.24)",    stroke: "#1A5C38"  },
  // Emerald
  { id: "pg1",  top: "#34D399", bot: "#10B981", glow: "rgba(16,185,129,0.24)",  stroke: "#10B981"  },
  // Leaf Green
  { id: "pg2",  top: "#4ADE80", bot: "#22C55E", glow: "rgba(34,197,94,0.24)",   stroke: "#22C55E"  },
  // Lime Green
  { id: "pg3",  top: "#A3E635", bot: "#84CC16", glow: "rgba(132,204,22,0.24)",  stroke: "#84CC16"  },
  // Olive Green
  { id: "pg4",  top: "#8FAB4A", bot: "#6B7C3C", glow: "rgba(107,124,60,0.24)",  stroke: "#6B7C3C"  },
  // Moss Green
  { id: "pg5",  top: "#5A8032", bot: "#3F6212", glow: "rgba(63,98,18,0.24)",    stroke: "#3F6212"  },
  // Sage Green
  { id: "pg6",  top: "#9DC4A1", bot: "#7BAE7F", glow: "rgba(123,174,127,0.24)", stroke: "#7BAE7F"  },
  // Mint Green
  { id: "pg7",  top: "#6EE7B7", bot: "#34D399", glow: "rgba(52,211,153,0.24)",  stroke: "#34D399"  },
  // Tea Green
  { id: "pg8",  top: "#BBF7D0", bot: "#86EFAC", glow: "rgba(134,239,172,0.30)", stroke: "#4ADE80"  },
  // Pine Green
  { id: "pg9",  top: "#166534", bot: "#14532D", glow: "rgba(20,83,45,0.26)",    stroke: "#14532D"  },
  // Fern Green
  { id: "pg10", top: "#86EFAC", bot: "#4ADE80", glow: "rgba(74,222,128,0.24)",  stroke: "#22C55E"  },
  // Jade Green
  { id: "pg11", top: "#5EEAD4", bot: "#14B8A6", glow: "rgba(20,184,166,0.24)",  stroke: "#14B8A6"  },
];

// ── 2. SVG DEFS — must be rendered inside <BarChart> via <defs> ──────
// Renders all gradient & filter defs into the chart's own SVG.
export function PremiumBarDefs({ ids } = {}) {
  const gradients = ids
    ? PREMIUM_GRADIENTS.filter((g) => ids.includes(g.id))
    : PREMIUM_GRADIENTS;

  return (
    <defs>
      {/* Gradient fills */}
      {PREMIUM_GRADIENTS.map((g) => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          {/* Glossy top highlight */}
          <stop offset="0%"   stopColor={g.top} stopOpacity={1} />
          <stop offset="18%"  stopColor={g.top} stopOpacity={0.92} />
          <stop offset="100%" stopColor={g.bot} stopOpacity={0.88} />
        </linearGradient>
      ))}

      {/* Drop-shadow filter for the floating effect */}
      <filter id="barShadow" x="-20%" y="-10%" width="140%" height="150%">
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="5"
          floodColor="rgba(10,40,20,0.14)"
          floodOpacity="1"
        />
      </filter>

      {/* Soft inner-edge glow overlay */}
      <filter id="innerGlow" x="0" y="0" width="100%" height="100%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

// ── 3. PREMIUM BAR SHAPE ─────────────────────────────────────────────
// Custom shape renderer for <Bar shape={...}> prop.
// Draws:  outer glow rect → shadow rect → gradient fill rect →
//         semi-transparent white border → glossy top-left highlight
export function PremiumBarShape(props) {
  const { x, y, width, height, index } = props;
  if (!width || !height || height <= 0) return null;

  const g = PREMIUM_GRADIENTS[index % PREMIUM_GRADIENTS.length];
  const r = Math.min(10, width / 2); // rounded top corners

  // Glow rect — slightly oversized, low opacity colored rect behind bar
  const glowPad = 6;
  const glowR   = r + 2;

  // Glossy highlight: top-left bright stripe
  const glossW = Math.max(width * 0.45, 4);
  const glossH = Math.min(height * 0.38, 32);

  return (
    <g className="premium-bar-group" style={{ cursor: "default" }}>
      {/* ── Soft outer colored glow ─────────────────────────────── */}
      <rect
        x={x - glowPad}
        y={y - glowPad}
        width={width + glowPad * 2}
        height={height + glowPad + 2}
        rx={glowR}
        ry={glowR}
        fill={g.glow}
        style={{
          filter: `blur(12px)`,
          opacity: 0.75,
          transition: "opacity 0.25s ease-out, filter 0.25s ease-out",
        }}
        className="bar-glow"
      />

      {/* ── Drop shadow ─────────────────────────────────────────── */}
      <rect
        x={x + 1}
        y={y + height - 2}
        width={width - 2}
        height={8}
        rx={2}
        fill="rgba(10,40,20,0.10)"
        style={{ filter: "blur(5px)" }}
      />

      {/* ── Main gradient bar ────────────────────────────────────── */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        ry={r}
        fill={`url(#${g.id})`}
        style={{
          transition: "height 0.25s ease-out, y 0.25s ease-out, filter 0.25s ease-out",
        }}
        className="bar-fill"
      />

      {/* Square bottom (so rounded top only) */}
      <rect
        x={x}
        y={y + height - r}
        width={width}
        height={r}
        fill={`url(#${g.id})`}
        style={{ transition: "height 0.25s ease-out" }}
      />

      {/* ── Semi-transparent white border ───────────────────────── */}
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={width - 1}
        height={height - 1}
        rx={r}
        ry={r}
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth={1}
        style={{ pointerEvents: "none" }}
      />

      {/* ── Glossy top-left highlight ────────────────────────────── */}
      <rect
        x={x + 3}
        y={y + 3}
        width={glossW}
        height={glossH}
        rx={r * 0.6}
        ry={r * 0.6}
        fill="rgba(255,255,255,0.24)"
        style={{ pointerEvents: "none" }}
      />

      {/* ── Extra-thin top highlight line ───────────────────────── */}
      <rect
        x={x + r}
        y={y + 1}
        width={width - r * 2}
        height={1.5}
        rx={1}
        fill="rgba(255,255,255,0.55)"
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}

// ── 3b. MULTI-SERIES BAR SHAPE ──────────────────────────────────────
// Use this when multiple Bar components share the same chart.
// Pass `colorIndex` to control which palette color this series uses.
export function makePremiumBarShape(colorIndex = 0) {
  return function PremiumBarShapeFixed(props) {
    const { x, y, width, height } = props;
    if (!width || !height || height <= 0) return null;

    const g = PREMIUM_GRADIENTS[colorIndex % PREMIUM_GRADIENTS.length];
    const r = Math.min(10, width / 2);
    const glowPad = 6;
    const glowR   = r + 2;
    const glossW = Math.max(width * 0.45, 4);
    const glossH = Math.min(height * 0.38, 32);

    return (
      <g className="premium-bar-group" style={{ cursor: "default" }}>
        <rect
          x={x - glowPad} y={y - glowPad}
          width={width + glowPad * 2} height={height + glowPad + 2}
          rx={glowR} ry={glowR} fill={g.glow}
          style={{ filter: "blur(12px)", opacity: 0.7, transition: "opacity 0.25s ease-out" }}
        />
        <rect
          x={x + 1} y={y + height - 2}
          width={width - 2} height={8} rx={2}
          fill="rgba(10,40,20,0.10)" style={{ filter: "blur(5px)" }}
        />
        <rect
          x={x} y={y} width={width} height={height} rx={r} ry={r}
          fill={`url(#${g.id})`}
          style={{ transition: "height 0.25s ease-out, y 0.25s ease-out" }}
        />
        <rect
          x={x} y={y + height - r} width={width} height={r}
          fill={`url(#${g.id})`}
        />
        <rect
          x={x + 0.5} y={y + 0.5} width={width - 1} height={height - 1}
          rx={r} ry={r} fill="none"
          stroke="rgba(255,255,255,0.30)" strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
        <rect
          x={x + 3} y={y + 3} width={glossW} height={glossH}
          rx={r * 0.6} ry={r * 0.6}
          fill="rgba(255,255,255,0.24)" style={{ pointerEvents: "none" }}
        />
        <rect
          x={x + r} y={y + 1} width={width - r * 2} height={1.5} rx={1}
          fill="rgba(255,255,255,0.55)" style={{ pointerEvents: "none" }}
        />
      </g>
    );
  };
}

// ── 4. PREMIUM LINE / AREA COLORS — Lush Agriculture Greens ─────────
// 8 rich line colors with area fill and dot color
export const LINE_COLORS = [
  { stroke: "#10B981", fill: "rgba(16,185,129,0.12)",   dot: "#10B981",  glow: "rgba(16,185,129,0.38)"  },  // Emerald
  { stroke: "#22C55E", fill: "rgba(34,197,94,0.10)",    dot: "#22C55E",  glow: "rgba(34,197,94,0.38)"   },  // Leaf
  { stroke: "#84CC16", fill: "rgba(132,204,22,0.10)",   dot: "#84CC16",  glow: "rgba(132,204,22,0.38)"  },  // Lime
  { stroke: "#1A5C38", fill: "rgba(26,92,56,0.10)",     dot: "#1A5C38",  glow: "rgba(26,92,56,0.38)"    },  // Forest
  { stroke: "#D4A843", fill: "rgba(212,168,67,0.10)",   dot: "#D4A843",  glow: "rgba(212,168,67,0.38)"  },  // Wheat Gold
  { stroke: "#38BDF8", fill: "rgba(56,189,248,0.10)",   dot: "#38BDF8",  glow: "rgba(56,189,248,0.38)"  },  // Sky Blue
  { stroke: "#7BAE7F", fill: "rgba(123,174,127,0.10)",  dot: "#7BAE7F",  glow: "rgba(123,174,127,0.38)" },  // Sage
  { stroke: "#34D399", fill: "rgba(52,211,153,0.10)",   dot: "#34D399",  glow: "rgba(52,211,153,0.38)"  },  // Jade/Mint
];

// ── 5. LINE DEFS — renders gradient strokes into chart SVG ───────────
// Put inside your LineChart / AreaChart <defs> section
export function PremiumLineDefs() {
  return (
    <defs>
      {LINE_COLORS.map((c, i) => (
        <filter key={`lgf${i}`} id={`lgf${i}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
      {/* Area gradients */}
      {LINE_COLORS.map((c, i) => (
        <linearGradient key={`lag${i}`} id={`lag${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c.stroke} stopOpacity={0.22} />
          <stop offset="60%"  stopColor={c.stroke} stopOpacity={0.06} />
          <stop offset="100%" stopColor={c.stroke} stopOpacity={0.00} />
        </linearGradient>
      ))}
    </defs>
  );
}

// ── 6. PREMIUM DOT RENDERERS ─────────────────────────────────────────

// Shared active dot for line charts — glowing point
export function premiumActiveDot(color = "#10B981") {
  return {
    r: 7,
    fill: color,
    stroke: "white",
    strokeWidth: 2.5,
    filter: `drop-shadow(0 0 6px ${color})`,
  };
}

// Shared regular dot style
export function premiumDot(color = "#10B981") {
  return {
    r: 4,
    fill: color,
    stroke: "white",
    strokeWidth: 2,
  };
}

// Get line color by index
export function getLineColor(index) {
  return LINE_COLORS[index % LINE_COLORS.length];
}

// ── 7. PREMIUM TOOLTIP STYLE ─────────────────────────────────────────
export const premiumTooltipStyle = {
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(16,185,129,0.16)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(10,40,20,0.12), 0 2px 6px rgba(10,40,20,0.06), inset 0 1px 0 rgba(255,255,255,1)",
  padding: "12px 16px",
  backdropFilter: "blur(8px)",
  fontFamily: "'Inter', sans-serif",
};

export const premiumTooltipLabelStyle = {
  fontWeight: 700,
  color: "#0F1F0F",
  fontSize: 13,
  marginBottom: 6,
};

export const premiumTooltipItemStyle = {
  fontWeight: 600,
  fontSize: 13,
};

// ── 8. PREMIUM CARTESIAN GRID PROPS ──────────────────────────────────
export const premiumGridProps = {
  strokeDasharray: "3 6",
  stroke: "rgba(148,190,158,0.18)",
  vertical: false,
};

// ── 9. PREMIUM AXIS TICK STYLE ────────────────────────────────────────
export const premiumAxisTick = {
  fontSize: 12,
  fill: "#6B8A6B",
  fontWeight: 500,
  fontFamily: "'Inter', sans-serif",
};

// ── 10. PREMIUM LEGEND STYLE ──────────────────────────────────────────
export const premiumLegendStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  color: "#2D4A2D",
  paddingTop: 8,
};

// ── 11. CHART CONTAINER AMBIENT GLOW ─────────────────────────────────
// A pseudo-element style object to add behind chart containers.
// Used in ChartCard's wrapping div via inline style or className additions.
export const chartContainerStyle = {
  position: "relative",
};

export const chartAmbientBefore = {
  content: '""',
  position: "absolute",
  inset: "-1px",
  borderRadius: "inherit",
  background:
    "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(16,185,129,0.07) 0%, transparent 60%), " +
    "radial-gradient(ellipse 40% 40% at 80% 100%, rgba(26,92,56,0.05) 0%, transparent 60%)",
  pointerEvents: "none",
  zIndex: 0,
};
