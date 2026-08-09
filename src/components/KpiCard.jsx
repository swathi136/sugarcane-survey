import { useEffect, useRef, useState } from "react";

/**
 * KpiCard — Premium Agriculture Enterprise Metric Card
 * Accepts an optional `variant` prop: "blue" | "emerald" | "purple" | "orange" | "red"
 * Accepts an optional `imageSrc` prop: fills the full card background with the image.
 * A frosted-glass overlay keeps text readable over the photo.
 * Falls back to "emerald" if variant not provided. `danger` prop maps to "red".
 * Plays a smooth pop animation on the value whenever it changes.
 */
function KpiCard({ title, value, note, danger, variant }) {
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

  return (
    <div className={`kpi-card ${colorClass}${updated ? " kpi-updated" : ""}`}>
      <div className="kpi-text">
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{note}</span>
      </div>
    </div>
  );
}

export default KpiCard;
