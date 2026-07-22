import { useEffect, useRef, useState } from "react";

/**
 * KpiCard — Premium Agriculture Enterprise Metric Card
 * Accepts an optional `variant` prop: "blue" | "emerald" | "purple" | "orange" | "red"
 * Accepts an optional `imageSrc` prop: fills the full card background with the image.
 * A frosted-glass overlay keeps text readable over the photo.
 * Falls back to "emerald" if variant not provided. `danger` prop maps to "red".
 * Plays a smooth pop animation on the value whenever it changes.
 */
function KpiCard({ icon, title, value, note, danger, variant, imageSrc }) {
  const colorClass = danger
    ? "kpi-red"
    : `kpi-${variant || "emerald"}`;

  const [updated, setUpdated] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setUpdated(true);
      const timer = setTimeout(() => setUpdated(false), 460);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const hasImgClass = imageSrc ? " kpi-has-image" : "";

  return (
    <div className={`kpi-card ${colorClass}${hasImgClass}${updated ? " kpi-updated" : ""}`}>

      {/* ── Full-card background image ── */}
      {imageSrc && (
        <div
          className="kpi-bg-image"
          style={{ backgroundImage: `url(${imageSrc})` }}
          aria-hidden="true"
        />
      )}

      {/* ── Frosted glass overlay — keeps text legible ── */}
      {imageSrc && (
        <div className="kpi-bg-overlay" aria-hidden="true" />
      )}

      {/* ── Animated green glow ring border ── */}
      <div className="kpi-glow-ring" aria-hidden="true" />

      {/* ── Card content ── */}
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-text">
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{note}</span>
      </div>
    </div>
  );
}

export default KpiCard;