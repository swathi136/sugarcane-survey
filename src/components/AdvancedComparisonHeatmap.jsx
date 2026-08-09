import { useMemo, useState } from "react";
import {
  buildDayMetricHeatmap,
  buildFertilizerMetricHeatmap,
} from "../utils/advancedComparisonHeatmap";

const MODES = [
  { value: "fertilizer-metric", label: "Fertilizer vs Metric" },
  { value: "day-metric", label: "Day vs Metric" },
];
const LOCATION_IDS = new Set(["L001", "L002", "L003"]);
const SCALE = ["#f3ead8", "#bdc8a3", "#8d975f", "#4f8757", "#225c3a"];
export const EMPTY_METRIC_MESSAGE = "No valid metric data is available for the selected filters.";

function AdvancedComparisonHeatmap({ data, onResetAll }) {
  const biometric = useMemo(() => data.comparisonBiometric || [], [data.comparisonBiometric]);
  const fertigation = useMemo(() => data.comparisonFertigation || [], [data.comparisonFertigation]);
  const locations = useMemo(() => (data.locations || []).filter((item) => LOCATION_IDS.has(item.location_id)), [data.locations]);
  const [mode, setMode] = useState("fertilizer-metric");
  const [locationId, setLocationId] = useState("");
  const [observationDay, setObservationDay] = useState("");
  const [startDay, setStartDay] = useState("");
  const [endDay, setEndDay] = useState("");

  const matrix = useMemo(() => (
    mode === "fertilizer-metric"
      ? buildFertilizerMetricHeatmap({ biometricRows: biometric, fertigationRows: fertigation, locations, locationId, observationDay })
      : buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId, startDay, endDay })
  ), [mode, biometric, fertigation, locations, locationId, observationDay, startDay, endDay]);

  const validRange = mode !== "day-metric" || (startDay !== "" && endDay !== "" && Number(startDay) <= Number(endDay));
  const selectionMissing = !locationId || (mode === "fertilizer-metric" ? observationDay === "" : startDay === "" || endDay === "");

  function switchMode(nextMode) {
    setMode(nextMode);
    setObservationDay("");
    setStartDay("");
    setEndDay("");
  }

  function reset() {
    setLocationId("");
    setObservationDay("");
    setStartDay("");
    setEndDay("");
    onResetAll?.();
  }

  return <div className="heatmap-workspace">
    <section className="heatmap-controls-card">
      <div className="heatmap-tabs" role="tablist" aria-label="Heatmap type">
        {MODES.map((item) => <button key={item.value} type="button" role="tab" aria-selected={mode === item.value} className={`heatmap-tab${mode === item.value ? " active" : ""}`} onClick={() => switchMode(item.value)}>{item.label}</button>)}
      </div>
      <div className="heatmap-controls-grid">
        <HeatmapSelect label="Location" value={locationId} onChange={setLocationId} options={[{ value: "", label: "Select location" }, ...locations.map((item) => ({ value: item.location_id, label: item.location_short_name || item.location_name || item.location_id }))]} />
        {mode === "fertilizer-metric"
          ? <HeatmapNumber label="Observation Day" value={observationDay} onChange={setObservationDay} placeholder="90" />
          : <><HeatmapNumber label="Start Day" value={startDay} onChange={setStartDay} placeholder="30" /><HeatmapNumber label="End Day" value={endDay} onChange={setEndDay} placeholder="150" /></>}
      </div>
      <button type="button" className="heatmap-reset" onClick={reset}>Reset</button>
    </section>

    {selectionMissing ? <HeatmapEmpty text={mode === "fertilizer-metric" ? "Select a location and enter an observation day to view the heatmap." : "Select a location and enter a start and end day to view the heatmap."} />
      : !validRange ? <HeatmapEmpty text="Start day must be less than or equal to end day." />
        : !matrix.rows.length ? <HeatmapEmpty text="No valid Supabase data is available for this selection." />
          : !matrix.columns.length ? <HeatmapEmpty text={EMPTY_METRIC_MESSAGE} />
          : <HeatmapMatrix matrix={matrix} mode={mode} />}
  </div>;
}

function HeatmapSelect({ label, value, onChange, options }) {
  return <label className="heatmap-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>)}</select></label>;
}

function HeatmapNumber({ label, value, onChange, placeholder }) {
  return <label className="heatmap-field"><span>{label}</span><input type="number" min="0" step="1" inputMode="numeric" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function HeatmapEmpty({ text }) { return <section className="heatmap-card heatmap-empty">{text}</section>; }

function HeatmapMatrix({ matrix, mode }) {
  const isRelationship = mode === "fertilizer-metric";
  return <section className="heatmap-card">
    <div className="heatmap-card-header"><div><h3>{isRelationship ? "Fertilizer vs Metric" : "Day vs Metric"}</h3><p>{isRelationship ? `Fertilizer-to-biometric relationships for ${matrix.locationName} on observation day ${matrix.day}.` : `Biometric progression for ${matrix.locationName} from day ${matrix.startDay} to day ${matrix.endDay}.`} Missing values remain empty.</p></div><HeatmapLegend /></div>
    <div className="heatmap-scroll"><div className="heatmap-matrix" style={{ gridTemplateColumns: `minmax(150px, 210px) repeat(${matrix.columns.length}, minmax(86px, 1fr))` }}>
      <div className="heatmap-corner">{isRelationship ? "Fertilizer" : "Day"}</div>
      {matrix.columns.map((metric) => <div className="heatmap-column-header" key={metric.key}>{metric.label}</div>)}
      {matrix.rows.map((row) => <HeatmapRow key={row.key} row={row} matrix={matrix} relationship={isRelationship} />)}
    </div></div>
  </section>;
}

function HeatmapLegend() {
  return <div className="heatmap-legend" aria-label="Heatmap scale from very low to very high"><span>Very Low</span>{SCALE.map((color) => <i key={color} style={{ background: color }} />)}<span>Very High</span></div>;
}

function HeatmapRow({ row, matrix, relationship }) {
  return <><div className="heatmap-row-label"><strong>{relationship ? row.label : `Day ${row.day}`}</strong></div>{matrix.columns.map((metric) => <HeatmapCell key={metric.key} summary={row.cells[metric.key]} row={row} metric={metric} matrix={matrix} relationship={relationship} />)}</>;
}

function HeatmapCell({ summary, row, metric, matrix, relationship }) {
  const [open, setOpen] = useState(false);
  const intensity = relationship ? relationshipIntensity(summary?.value) : metricIntensity(summary?.value, matrix.values[metric.key]);
  const background = intensity === null ? "transparent" : SCALE[intensity];
  const valueLabel = summary ? summary.value : "Missing";
  const detail = relationship
    ? `${matrix.locationName}; Observation day ${matrix.day}; ${row.label}; ${metric.label}; Relationship ${valueLabel}`
    : `${matrix.locationName}; Day ${row.day}; ${metric.label}; ${valueLabel}${summary && metric.unit ? ` ${metric.unit}` : ""}`;
  return <div className="heatmap-cell-wrap"><button type="button" className={`heatmap-cell${summary ? " has-value" : " missing"}`} style={{ background }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} aria-label={detail} />{open && <div className="heatmap-tooltip" role="tooltip"><strong>{matrix.locationName}</strong>{relationship ? <><span>Observation day: {matrix.day}</span><span>Fertilizer: {row.label}</span><span>Metric: {metric.label}</span><span>Relationship value: {valueLabel}</span></> : <><span>Day: {row.day}</span><span>Metric: {metric.label}</span><span>Value: {summary ? `${summary.value}${metric.unit ? ` ${metric.unit}` : ""}` : "Missing"}</span></>}</div>}</div>;
}

function relationshipIntensity(value) {
  if (value === null || value === undefined) return null;
  return Math.min(4, Math.floor(((Math.max(-1, Math.min(1, value)) + 1) / 2) * 5));
}

function metricIntensity(value, values = []) {
  if (value === null || value === undefined || !values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (maximum === minimum) return 2;
  return Math.min(4, Math.floor(((value - minimum) / (maximum - minimum)) * 5));
}

export default AdvancedComparisonHeatmap;
