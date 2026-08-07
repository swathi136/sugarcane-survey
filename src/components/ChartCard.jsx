/**
 * ChartCard.jsx
 * Premium floating chart container with ambient green radial lighting,
 * soft warm-white gradient, layered shadows, and translucent border.
 * 2026 Smart Agriculture Analytics Platform Edition
 */

function ChartCard({ title, subtitle, children, large, action }) {
  return (
    <div
      className={`card chart-card ${large ? "large" : ""}`}
      style={{
        /* Premium warm-white floating card */
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbf5 100%)",
        borderRadius: 24,
        border: "1px solid rgba(200,228,205,0.70)",
        boxShadow:
          "0 4px 6px rgba(10,40,20,0.04), " +
          "0 12px 28px rgba(10,40,20,0.08), " +
          "0 32px 64px rgba(10,40,20,0.07), " +
          "inset 0 1px 0 rgba(255,255,255,1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient green radial lighting */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 65% 45% at 15% 0%, rgba(16,185,129,0.06) 0%, transparent 65%), " +
            "radial-gradient(ellipse 45% 45% at 90% 100%, rgba(26,92,56,0.05) 0%, transparent 65%)",
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top-light reflection strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "6%",
          right: "6%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 70%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Card content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="card-header">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          {action && <div>{action}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}

export default ChartCard;
