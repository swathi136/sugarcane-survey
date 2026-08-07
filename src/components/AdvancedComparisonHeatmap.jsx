import { useMemo, useState } from "react";
import {
  HEATMAP_FERTILIZERS,
  HEATMAP_METRICS,
  buildBiometricHeatmap,
  buildFertilizerHeatmap,
  buildTreatmentHeatmap,
  finiteHeatmapValue,
} from "../utils/advancedComparisonHeatmap";
import "./AdvancedComparisonHeatmap.css";

const MODES = [
  { value: "biometric", label: "Biometric Performance" },
  { value: "fertilizer", label: "Fertilizer Application" },
  { value: "treatment", label: "Treatment Performance" },
];

function AdvancedComparisonHeatmap({ data }) {
  const biometric = useMemo(() => data.comparisonBiometric || [], [data.comparisonBiometric]);
  const fertigation = useMemo(() => data.comparisonFertigation || [], [data.comparisonFertigation]);
  const plots = useMemo(() => data.plots || [], [data.plots]);
  const locations = useMemo(() => data.locations || [], [data.locations]);
  const [mode, setMode] = useState("biometric");
  const [metricKey, setMetricKey] = useState("");
  const [fertilizerKey, setFertilizerKey] = useState("");
  const [startDay, setStartDay] = useState("");
  const [endDay, setEndDay] = useState("");
  const [locationId, setLocationId] = useState("");
  const [plotKey, setPlotKey] = useState("");

  const metrics = useMemo(() => HEATMAP_METRICS.filter((metric) => biometric.some((row) => Object.hasOwn(row, metric.field))), [biometric]);
  const fertilizers = useMemo(() => HEATMAP_FERTILIZERS.filter((fertilizer) => fertigation.some((row) => Object.hasOwn(row, fertilizer.field))), [fertigation]);
  const metric = metrics.find((item) => item.key === metricKey) || null;
  const fertilizer = fertilizers.find((item) => item.key === fertilizerKey) || null;
  const sourceRows = mode === "fertilizer" ? fertigation : biometric;
  const dayField = mode === "fertilizer" ? "day_after_planting" : "observation_day";
  const availableDays = useMemo(() => [...new Set(sourceRows.filter((row) => !locationId || row.location_id === locationId).map((row) => finiteHeatmapValue(row[dayField])).filter((day) => day !== null))].sort((a, b) => a - b), [sourceRows, locationId, dayField]);
  const plotOptions = useMemo(() => plots.filter((plot) => !locationId || plot.location_id === locationId).sort((a, b) => `${a.location_id}|${a.plot_id}`.localeCompare(`${b.location_id}|${b.plot_id}`, undefined, { numeric: true })), [plots, locationId]);

  const matrix = useMemo(() => {
    if (mode === "fertilizer") return buildFertilizerHeatmap({ rows: fertigation, plots, locations, fertilizer, startDay, endDay, locationId, plotKey });
    if (mode === "treatment") return buildTreatmentHeatmap({ rows: biometric, locations, metric, startDay, endDay, locationId });
    return buildBiometricHeatmap({ rows: biometric, plots, locations, metric, startDay, endDay, locationId, plotKey });
  }, [mode, biometric, fertigation, plots, locations, metric, fertilizer, startDay, endDay, locationId, plotKey]);

  function reset(nextMode = mode) {
    setMode(nextMode); setMetricKey(""); setFertilizerKey(""); setStartDay(""); setEndDay(""); setLocationId(""); setPlotKey("");
  }

  const selectionMissing = mode === "fertilizer" ? !fertilizer : !metric || (mode === "treatment" && !locationId);

  return <div className="heatmap-workspace">
    <section className="heatmap-controls-card">
      <div className="heatmap-controls-grid">
        <HeatmapSelect label="Mode" value={mode} onChange={(value) => reset(value)} options={MODES} />
        {mode === "fertilizer"
          ? <HeatmapSelect label="Fertilizer" value={fertilizerKey} onChange={setFertilizerKey} options={[{ value: "", label: "Select fertilizer" }, ...fertilizers.map((item) => ({ value: item.key, label: item.label }))]} />
          : <HeatmapSelect label="Metric" value={metricKey} onChange={setMetricKey} options={[{ value: "", label: "Select metric" }, ...metrics.map((item) => ({ value: item.key, label: item.label }))]} />}
        <HeatmapSelect label={mode === "fertilizer" ? "Start Day" : "Start Observation Day"} value={startDay} onChange={setStartDay} options={[{ value: "", label: "All available" }, ...availableDays.map((day) => ({ value: String(day), label: `Day ${day}` }))]} />
        <HeatmapSelect label={mode === "fertilizer" ? "End Day" : "End Observation Day"} value={endDay} onChange={setEndDay} options={[{ value: "", label: "All available" }, ...availableDays.map((day) => ({ value: String(day), label: `Day ${day}` }))]} />
        <HeatmapSelect label="Location" value={locationId} onChange={(value) => { setLocationId(value); setPlotKey(""); }} options={[{ value: "", label: mode === "treatment" ? "Select location" : "All locations" }, ...locations.map((item) => ({ value: item.location_id, label: item.location_short_name || item.location_name || item.location_id }))]} />
        {mode !== "treatment" && <HeatmapSelect label="Plot (optional)" value={plotKey} onChange={setPlotKey} options={[{ value: "", label: "All plots" }, ...plotOptions.map((plot) => ({ value: `${plot.location_id}|${plot.plot_id}`, label: `${plot.location_id} — ${plot.plot_name || plot.plot_label || plot.plot_id}` }))]} />}
      </div>
      <button type="button" className="heatmap-reset" onClick={() => reset()}>Reset</button>
    </section>

    {selectionMissing ? <HeatmapEmpty text="Select a metric or fertilizer to view the heatmap." />
      : !matrix.rows.length || !matrix.days.length || !matrix.values.length ? <HeatmapEmpty text="No valid Supabase data is available for this selection." />
        : <HeatmapMatrix matrix={matrix} mode={mode} metric={metric} fertilizer={fertilizer} />}
  </div>;
}

function HeatmapSelect({ label, value, onChange, options }) {
  return <label className="heatmap-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>)}</select></label>;
}

function HeatmapEmpty({ text }) { return <section className="heatmap-card heatmap-empty">{text}</section>; }

function HeatmapMatrix({ matrix, mode, metric, fertilizer }) {
  const minimum = Math.min(...matrix.values);
  const maximum = Math.max(...matrix.values);
  return <section className="heatmap-card">
    <div className="heatmap-card-header"><div><h3>{mode === "fertilizer" ? `${fertilizer.label} Application` : `${metric.label} Performance`}</h3><p>Values use the same confirmed summary semantics as Advanced Comparison. Missing records remain empty.</p></div><div className="heatmap-legend" aria-label="Heatmap intensity from low to high"><span>Low</span><i className="legend-low" /><i className="legend-medium" /><i className="legend-high" /><span>High</span></div></div>
    <div className="heatmap-scroll"><div className="heatmap-matrix" style={{ gridTemplateColumns: `minmax(190px, 240px) repeat(${matrix.days.length}, minmax(64px, 1fr))` }}>
      <div className="heatmap-corner">{mode === "treatment" ? "Treatment" : "Location — Plot"}</div>
      {matrix.days.map((day) => <div className="heatmap-column-header" key={day}>{day}</div>)}
      {matrix.rows.map((row) => <HeatmapRow key={row.key} row={row} days={matrix.days} mode={mode} metric={metric} fertilizer={fertilizer} minimum={minimum} maximum={maximum} />)}
    </div></div>
  </section>;
}

function HeatmapRow({ row, days, mode, metric, fertilizer, minimum, maximum }) {
  return <><div className="heatmap-row-label"><strong>{mode === "treatment" ? row.treatment : `${row.locationName} — ${row.plotLabel}`}</strong><small>{mode === "treatment" ? row.locationName : row.treatment}</small></div>{days.map((day) => <HeatmapCell key={day} summary={row.cells[day]} row={row} day={day} mode={mode} metric={metric} fertilizer={fertilizer} minimum={minimum} maximum={maximum} />)}</>;
}

function HeatmapCell({ summary, row, day, mode, metric, fertilizer, minimum, maximum }) {
  const [open, setOpen] = useState(false);
  const ratio = summary && maximum > minimum ? (summary.value - minimum) / (maximum - minimum) : summary ? 0.55 : null;
  const background = ratio === null ? "#eef1ec" : interpolateSage(ratio);
  const dark = ratio !== null && ratio >= 0.65;
  const detail = mode === "fertilizer"
    ? `${row.locationName}; ${row.plotLabel}; ${row.treatment}; Application Day ${day}; ${fertilizer.label}; ${summary?.value ?? "Missing"} ${fertilizer.unit}`
    : `${row.locationName}; ${mode === "treatment" ? row.treatment : `${row.plotLabel}; ${row.treatment}`}; Observation Day ${day}; ${metric.label}; ${summary?.value ?? "Missing"}${metric.unit ? ` ${metric.unit}` : ""}${summary ? `; ${summary.count} record${summary.count === 1 ? "" : "s"}` : ""}`;
  return <div className="heatmap-cell-wrap"><button type="button" className={`heatmap-cell ${summary ? "has-value" : "missing"}${dark ? " dark" : ""}`} style={{ background }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} aria-label={detail}>{summary?.value ?? "—"}</button>{open && <div className="heatmap-tooltip" role="tooltip"><strong>{row.locationName}{mode !== "treatment" ? ` — ${row.plotLabel}` : ""}</strong><span>Treatment: {row.treatment}</span><span>{mode === "fertilizer" ? "Application" : "Observation"} Day: {day}</span><span>{mode === "fertilizer" ? fertilizer.label : metric.label}: {summary ? `${summary.value}${(fertilizer || metric).unit ? ` ${(fertilizer || metric).unit}` : ""}` : "Missing"}</span>{summary && mode !== "fertilizer" && <span>Valid records: {summary.count}</span>}</div>}</div>;
}

function interpolateSage(ratio) {
  const low = [226, 238, 226], high = [55, 105, 72];
  const channel = (index) => Math.round(low[index] + (high[index] - low[index]) * Math.max(0, Math.min(1, ratio)));
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export default AdvancedComparisonHeatmap;
