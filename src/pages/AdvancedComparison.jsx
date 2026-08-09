import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, GitCompare, Grid3X3, X } from "lucide-react";
import { getLocationName } from "../utils/formatters";
import {
  getActiveComparisonPairs,
  getComparisonPlotOptions,
  getDerivedTreatment,
  isDuplicateComparisonPair,
} from "../utils/advancedComparisonSelection";
import AdvancedComparisonHeatmap from "../components/AdvancedComparisonHeatmap";

const METRICS = [
  { key: "plant_height", label: "Plant Height", field: "plant_height_cm", unit: "cm", decimals: 1 },
  { key: "tillers", label: "Tiller Count", field: "number_of_tillers", unit: "", decimals: 1 },
  { key: "leaves", label: "Leaf Count", field: "number_of_leaves", unit: "", decimals: 1 },
  { key: "leaf_length", label: "Leaf Length", field: "leaf_length_cm", unit: "cm", decimals: 1 },
  { key: "leaf_breadth", label: "Leaf Breadth", field: "leaf_breadth_cm", unit: "cm", decimals: 1 },
];

const FERTILIZERS = [
  { key: "n", label: "Nitrogen (N) — Nutrient", field: "n_kg", shortLabel: "Nitrogen", unit: "kg" },
  { key: "p2o5", label: "P₂O₅ — Nutrient", field: "p2o5_kg", shortLabel: "P₂O₅", unit: "kg" },
  { key: "k2o", label: "K₂O — Nutrient", field: "k2o_kg", shortLabel: "K₂O", unit: "kg" },
  { key: "mn", label: "Mn Mixture — Nutrient", field: "mn_mixture_kg", shortLabel: "Mn Mixture", unit: "kg" },
  { key: "urea", label: "Urea — Product", field: "urea_kg", shortLabel: "Urea", unit: "kg" },
  { key: "map", label: "MAP — Product", field: "map_kg", shortLabel: "MAP", unit: "kg" },
  { key: "dap", label: "DAP — Product", field: "dap_kg", shortLabel: "DAP", unit: "kg" },
  { key: "potash", label: "White Potash — Product", field: "white_potash_kg", shortLabel: "White Potash", unit: "kg" },
];

const COLORS = ["#168657", "#2563eb", "#d97706"];
const EMPTY_PAIR = { locationId: "", plotId: "" };
const styles = {
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  tab: { borderWidth: 1.5, borderStyle: "solid", borderColor: "var(--border)", background: "#fff", color: "var(--text-secondary)", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  activeTab: { background: "linear-gradient(135deg, var(--forest), var(--emerald))", color: "#fff", borderColor: "transparent" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 22, marginBottom: 20, boxShadow: "var(--shadow-md)" },
  comparisonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 },
  controlGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "var(--text-primary)", fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" },
  input: { width: "100%", height: 44, border: "1.5px solid rgba(16,185,129,.18)", borderRadius: 12, padding: "0 12px", background: "#fff", color: "var(--text-primary)", fontWeight: 600 },
  treatment: { minHeight: 44, display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 12, background: "var(--forest-light)", color: "var(--text-primary)", fontWeight: 700 },
  button: { height: 42, padding: "0 16px", borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 11, background: "#fff", color: "var(--text-secondary)", fontWeight: 700, cursor: "pointer" },
  muted: { color: "var(--text-muted)", fontSize: 13 },
  chartHeader: { display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 },
  chartTitle: { margin: 0, lineHeight: 1.3 },
  chartDescription: { color: "var(--text-muted)", fontSize: 13, lineHeight: 1.55, margin: 0 },
  chartArea: { width: "100%", paddingTop: 4 },
  empty: { minHeight: 260, display: "grid", placeItems: "center", color: "var(--text-muted)", textAlign: "center", padding: 30 },
};

function finite(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function natural(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }); }
function keyOf(pair) { return pair.locationId && pair.plotId ? `${pair.locationId}|${pair.plotId}` : ""; }
function mean(values, decimals) {
  if (!values.length) return null;
  return {
    value: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(decimals)),
    count: values.length,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}
function metricValues(rows, pair, day, field) {
  return rows
    .filter((row) => row.location_id === pair.locationId && row.plot_id === pair.plotId && Number(row.observation_day) === Number(day))
    .map((row) => finite(row[field]))
    .filter((value) => value !== null);
}

function AdvancedComparison({ data }) {
  const biometric = useMemo(() => data.comparisonBiometric || [], [data.comparisonBiometric]);
  const fertigation = useMemo(() => data.comparisonFertigation || [], [data.comparisonFertigation]);
  const plots = useMemo(() => data.plots || [], [data.plots]);
  const locations = useMemo(() => data.locations || [], [data.locations]);
  const [tab, setTab] = useState("biometric");
  const [pairA, setPairA] = useState(EMPTY_PAIR);
  const [pairB, setPairB] = useState(EMPTY_PAIR);
  const [pairC, setPairC] = useState(EMPTY_PAIR);
  const [thirdEnabled, setThirdEnabled] = useState(false);
  const [metricKey, setMetricKey] = useState("");
  const [bioDay, setBioDay] = useState("");
  const [fertilizerKey, setFertilizerKey] = useState("");
  const [startDay, setStartDay] = useState("");
  const [endDay, setEndDay] = useState("");
  const [details, setDetails] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState("");

  const plotMap = useMemo(() => new Map(plots.map((plot) => [`${plot.location_id}|${plot.plot_id}`, plot])), [plots]);
  const locationOptions = useMemo(() => locations.filter((row) => row.location_id).sort((a, b) => natural(a.location_id, b.location_id)), [locations]);
  const availableMetrics = useMemo(() => METRICS.filter((metric) => biometric.some((row) => Object.hasOwn(row, metric.field))), [biometric]);
  const availableFertilizers = useMemo(() => FERTILIZERS.filter((item) => fertigation.some((row) => Object.hasOwn(row, item.field))), [fertigation]);
  const comparisonPairs = useMemo(() => getActiveComparisonPairs(pairA, pairB, pairC, thirdEnabled), [pairA, pairB, pairC, thirdEnabled]);
  const complete = comparisonPairs.every((pair) => Boolean(keyOf(pair)));

  const commonDays = useMemo(() => {
    if (!complete) return [];
    const daysFor = (pair) => new Set(biometric.filter((row) => row.location_id === pair.locationId && row.plot_id === pair.plotId).map((row) => finite(row.observation_day)).filter((day) => day !== null));
    const daySets = comparisonPairs.map(daysFor);
    return [...daySets[0]].filter((day) => daySets.slice(1).every((set) => set.has(day))).sort((x, y) => x - y);
  }, [biometric, comparisonPairs, complete]);

  const responseDays = useMemo(() => {
    if (!complete) return [];
    return Array.from(new Set(comparisonPairs.flatMap((pair) => biometric.filter((row) => row.location_id === pair.locationId && row.plot_id === pair.plotId).map((row) => finite(row.observation_day)).filter((day) => day !== null)))).sort((a, b) => a - b);
  }, [biometric, comparisonPairs, complete]);

  useEffect(() => {
    if (bioDay !== "" && !commonDays.includes(Number(bioDay))) setBioDay("");
  }, [commonDays, bioDay]);
  useEffect(() => {
    if (startDay !== "" && !responseDays.includes(Number(startDay))) setStartDay("");
    if (endDay !== "" && !responseDays.includes(Number(endDay))) setEndDay("");
  }, [responseDays, startDay, endDay]);

  const selectedPairs = useMemo(() => comparisonPairs.map((pair) => {
    const plot = plotMap.get(keyOf(pair));
    return plot ? {
      ...pair,
      locationName: getLocationName(pair.locationId, locations),
      plotLabel: plot.plot_name || plot.plot_label || plot.plot_id,
      treatment: plot.treatment_id || "Not mapped",
    } : null;
  }).filter(Boolean), [comparisonPairs, plotMap, locations]);

  const bioChart = useMemo(() => {
    const metric = availableMetrics.find((item) => item.key === metricKey);
    if (selectedPairs.length !== comparisonPairs.length || !metric || bioDay === "") return null;
    const rows = selectedPairs.map((pair) => {
      const summary = mean(metricValues(biometric, pair, bioDay, metric.field), metric.decimals);
      return summary ? { ...pair, ...summary, name: `${pair.locationName} — ${pair.plotLabel}`, day: Number(bioDay) } : null;
    }).filter(Boolean);
    return rows.length === comparisonPairs.length ? { rows, metric, day: Number(bioDay) } : { rows, metric, day: Number(bioDay), incomplete: true };
  }, [availableMetrics, metricKey, selectedPairs, comparisonPairs.length, bioDay, biometric]);

  const responseChart = useMemo(() => {
    const metric = availableMetrics.find((item) => item.key === metricKey);
    const fertilizer = availableFertilizers.find((item) => item.key === fertilizerKey);
    const start = Number(startDay), end = Number(endDay);
    if (selectedPairs.length !== comparisonPairs.length || !metric || !fertilizer || startDay === "" || endDay === "" || start > end) return null;
    const rows = responseDays.filter((day) => day >= start && day <= end).map((day) => ({ day, dayLabel: `${day} Day` }));
    selectedPairs.forEach((pair) => {
      const pairKey = keyOf(pair);
      rows.forEach((row) => {
        const summary = mean(metricValues(biometric, pair, row.day, metric.field), metric.decimals);
        if (!summary) return;
        const applications = fertigation.filter((item) => {
          const applicationDay = finite(item.day_after_planting);
          const treatmentMatches = !item.treatment_id || item.treatment_id === pair.treatment;
          return item.location_id === pair.locationId && item.plot_id === pair.plotId && treatmentMatches && applicationDay !== null && applicationDay <= row.day;
        });
        const quantities = applications.map((item) => finite(item[fertilizer.field])).filter((value) => value !== null);
        row[pairKey] = summary.value;
        row[`meta__${pairKey}`] = { ...pair, ...summary, day: row.day, cumulative: Number(quantities.reduce((sum, value) => sum + value, 0).toFixed(2)), fertilizerRecordCount: quantities.length };
      });
    });
    return rows.some((row) => selectedPairs.some((pair) => row[keyOf(pair)] !== undefined)) ? { rows, pairs: selectedPairs, metric, fertilizer, start, end } : null;
  }, [availableMetrics, availableFertilizers, metricKey, fertilizerKey, startDay, endDay, selectedPairs, comparisonPairs.length, responseDays, biometric, fertigation]);

  function updateLocation(which, locationId) {
    setSelectionMessage(""); setDetails(null);
    const setter = which === "A" ? setPairA : which === "B" ? setPairB : setPairC;
    setter({ locationId, plotId: "" });
  }
  function updatePlot(which, plotId) {
    setSelectionMessage(""); setDetails(null);
    const index = which === "A" ? 0 : which === "B" ? 1 : 2;
    const current = comparisonPairs[index];
    const next = { ...current, plotId };
    const setter = which === "A" ? setPairA : which === "B" ? setPairB : setPairC;
    if (isDuplicateComparisonPair(comparisonPairs, index, next)) {
      setSelectionMessage("Each comparison must use a different location–plot pair.");
      setter({ ...current, plotId: "" });
      return;
    }
    setter(next);
  }
  function reset() {
    setPairA(EMPTY_PAIR); setPairB(EMPTY_PAIR); setPairC(EMPTY_PAIR); setMetricKey(""); setBioDay("");
    setThirdEnabled(false); setFertilizerKey(""); setStartDay(""); setEndDay(""); setDetails(null); setSelectionMessage("");
  }

  function enableThirdComparison() {
    setThirdEnabled(true); setSelectionMessage(""); setDetails(null);
  }

  function removeThirdComparison() {
    setThirdEnabled(false); setPairC(EMPTY_PAIR); setSelectionMessage(""); setDetails(null);
  }

  const emptyText = !complete
    ? `Select ${thirdEnabled ? "three" : "two"} location–plot pairs to begin the comparison.`
    : !commonDays.length
      ? "No common observation day is available for the selected plots."
      : !metricKey || (tab === "biometric" && bioDay === "")
        ? "Select the metric and observation day to view the comparison."
        : "No valid Supabase biometric values are available for this selection.";

  return <div>
    <section className="page-toolbar"><div><h2>Advanced Comparison</h2><p>Compare genuine biometric measurements and fertilizer response across two or three location–plot pairs.</p></div></section>
    <div className="advanced-tabs" style={styles.tabs} role="tablist">
      <button type="button" className={tab === "biometric" ? "active" : ""} style={{ ...styles.tab, ...(tab === "biometric" ? styles.activeTab : {}) }} onClick={() => { setTab("biometric"); setDetails(null); }}><BarChart3 size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Biometric Comparison</button>
      <button type="button" className={tab === "response" ? "active" : ""} style={{ ...styles.tab, ...(tab === "response" ? styles.activeTab : {}) }} onClick={() => { setTab("response"); setDetails(null); }}><GitCompare size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Fertilizer Response Comparison</button>
      <button type="button" className={tab === "heatmap" ? "active" : ""} style={{ ...styles.tab, ...(tab === "heatmap" ? styles.activeTab : {}) }} onClick={() => { setTab("heatmap"); setDetails(null); }}><Grid3X3 size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />Heatmap Analysis</button>
    </div>

    {tab !== "heatmap" && <section className="advanced-surface" style={styles.card}>
      <div style={styles.comparisonGrid}>
        <ComparisonCard title="Comparison 1" pair={pairA} plots={plots} locations={locationOptions} plotMap={plotMap} onLocation={(value) => updateLocation("A", value)} onPlot={(value) => updatePlot("A", value)} />
        <ComparisonCard title="Comparison 2" pair={pairB} plots={plots} locations={locationOptions} plotMap={plotMap} onLocation={(value) => updateLocation("B", value)} onPlot={(value) => updatePlot("B", value)} />
        {thirdEnabled && <ComparisonCard title="Comparison 3" pair={pairC} plots={plots} locations={locationOptions} plotMap={plotMap} onLocation={(value) => updateLocation("C", value)} onPlot={(value) => updatePlot("C", value)} />}
      </div>
      <button type="button" style={{ ...styles.button, marginTop: 16 }} onClick={thirdEnabled ? removeThirdComparison : enableThirdComparison}>{thirdEnabled ? "Remove third comparison" : "+ Add third comparison"}</button>
      {selectionMessage && <p style={{ color: "#b45309", marginBottom: 0 }}>{selectionMessage}</p>}
    </section>}

    {tab === "biometric" ? <>
      <section style={styles.card}><div style={styles.controlGrid}>
        <Select label="Metric" value={metricKey} onChange={setMetricKey} options={[{ value: "", label: "Select metric" }, ...availableMetrics.map((item) => ({ value: item.key, label: item.label }))]} />
        <Select label="Observation Day" value={bioDay} onChange={setBioDay} disabled={!complete || !commonDays.length} options={[{ value: "", label: !complete ? `Select all ${thirdEnabled ? "three" : "two"} plots first` : commonDays.length ? "Select common day" : "No common observation day" }, ...commonDays.map((day) => ({ value: String(day), label: `Day ${day}` }))]} />
      </div></section>
      <Reset reset={reset} />
      {bioChart && !bioChart.incomplete ? <BiometricChart graph={bioChart} onDetails={setDetails} /> : <Empty text={bioChart?.incomplete ? "No valid Supabase biometric values are available for this selection." : emptyText} />}
      {details && <Details details={details} graph={bioChart} close={() => setDetails(null)} />}
    </> : tab === "response" ? <>
      <section style={styles.card}><div style={styles.controlGrid}>
        <Select label="Biometric Metric" value={metricKey} onChange={setMetricKey} options={[{ value: "", label: "Select metric" }, ...availableMetrics.map((item) => ({ value: item.key, label: item.label }))]} />
        <Select label="Fertilizer" value={fertilizerKey} onChange={setFertilizerKey} options={[{ value: "", label: "Select fertilizer" }, ...availableFertilizers.map((item) => ({ value: item.key, label: item.label }))]} />
        <Select label="Start Observation Day" value={startDay} onChange={setStartDay} disabled={!complete} options={[{ value: "", label: "Select start day" }, ...responseDays.map((day) => ({ value: String(day), label: `Day ${day}` }))]} />
        <Select label="End Observation Day" value={endDay} onChange={setEndDay} disabled={!complete} options={[{ value: "", label: "Select end day" }, ...responseDays.map((day) => ({ value: String(day), label: `Day ${day}` }))]} />
      </div></section>
      <Reset reset={reset} />
      {responseChart ? <ResponseChart graph={responseChart} /> : <Empty text={!complete ? `Select ${thirdEnabled ? "three" : "two"} location–plot pairs to begin the comparison.` : "Select the metric, fertilizer and observation-day range to view the comparison."} />}
    </> : <AdvancedComparisonHeatmap data={data} onResetAll={reset} />}
  </div>;
}

function ComparisonCard({ title, pair, plots, locations, plotMap, onLocation, onPlot }) {
  const options = getComparisonPlotOptions(plots, pair.locationId);
  const treatment = getDerivedTreatment(plotMap, pair);
  return <div className="advanced-selector-card" style={{ padding: 18, border: "1px solid rgba(16,185,129,.18)", borderRadius: 16, background: "var(--forest-light)" }}>
    <h3 style={{ margin: "0 0 15px" }}>{title}</h3>
    <div style={{ display: "grid", gap: 14 }}>
      <Select label="Location" value={pair.locationId} onChange={onLocation} options={[{ value: "", label: "Select location" }, ...locations.map((row) => ({ value: row.location_id, label: getLocationName(row.location_id, locations) }))]} />
      <Select label="Plot" value={pair.plotId} onChange={onPlot} disabled={!pair.locationId} options={[{ value: "", label: pair.locationId ? "Select plot" : "Select location first" }, ...options.map((plot) => ({ value: plot.plot_id, label: plot.plot_name || plot.plot_label || plot.plot_id }))]} />
      <div style={styles.field}><span style={styles.label}>Derived Treatment</span><div style={styles.treatment}>{treatment || "Select a mapped plot"}</div></div>
    </div>
  </div>;
}
function Select({ label, value, onChange, options, disabled = false }) { return <label style={styles.field}><span style={styles.label}>{label}</span><select style={styles.input} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>)}</select></label>; }
function Reset({ reset }) { return <div style={{ margin: "-5px 0 20px" }}><button type="button" style={styles.button} onClick={reset}>Reset</button></div>; }
function Empty({ text }) { return <section style={styles.card}><div style={styles.empty}>{text}</div></section>; }
function TooltipBox({ children }) { return <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", boxShadow: "var(--shadow-md)", fontSize: 13 }}>{children}</div>; }

function BiometricChart({ graph, onDetails }) {
  return <section style={styles.card}><div style={styles.chartHeader}><h3 style={styles.chartTitle}>Average {graph.metric.label} Comparison — Day {graph.day}</h3><p style={styles.chartDescription}>Each bar is the arithmetic mean of all valid Supabase measurements for that plot and day. Click a bar for details.</p></div><div style={styles.chartArea}><ResponsiveContainer width="100%" height={440}><BarChart data={graph.rows} margin={{ top: 8, right: 24, left: 48, bottom: 85 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={105} /><YAxis label={{ value: `Average ${graph.metric.label}${graph.metric.unit ? ` (${graph.metric.unit})` : ""}`, angle: -90, position: "insideLeft", offset: -25 }} /><Tooltip content={<BioTooltip graph={graph} />} /><Bar dataKey="value" fill="#168657" radius={[8, 8, 0, 0]} cursor="pointer" onClick={(row) => onDetails(row)} /></BarChart></ResponsiveContainer></div></section>;
}
function BioTooltip({ active, payload, graph }) { if (!active || !payload?.length) return null; const row = payload[0].payload; return <TooltipBox><strong>{row.locationName} — {row.plotLabel}</strong><div>Treatment: {row.treatment}</div><div>Observation day: {row.day}</div><div>Metric: {graph.metric.label}</div><div>Average value: {row.value}{graph.metric.unit ? ` ${graph.metric.unit}` : ""}</div><div>Valid records: {row.count}</div></TooltipBox>; }
function Details({ details, graph, close }) { return <section style={{ ...styles.card, position: "relative" }}><button type="button" onClick={close} aria-label="Close details" style={{ position: "absolute", right: 18, top: 18, border: 0, background: "transparent", cursor: "pointer" }}><X /></button><h3>Comparison Details</h3><div style={styles.controlGrid}>{[["Location", details.locationName], ["Location ID", details.locationId], ["Plot", details.plotLabel], ["Plot ID", details.plotId], ["Treatment", details.treatment], ["Observation day", details.day], ["Metric", graph.metric.label], ["Average value", `${details.value}${graph.metric.unit ? ` ${graph.metric.unit}` : ""}`], ["Valid records", details.count], ["Minimum", details.minimum], ["Maximum", details.maximum]].map(([label, value]) => <div key={label}><div style={styles.label}>{label}</div><strong>{value}</strong></div>)}</div></section>; }

function ResponseChart({ graph }) {
  const pairMap = Object.fromEntries(graph.pairs.map((pair) => [keyOf(pair), pair]));
  return <section style={styles.card}><div style={styles.chartHeader}><h3 style={styles.chartTitle}>Average {graph.metric.label} Response to {graph.fertilizer.shortLabel} Across Observation Days</h3><p style={styles.chartDescription}>Biometric points are arithmetic means of valid Supabase measurements.</p></div><div style={styles.chartArea}><ResponsiveContainer width="100%" height={470}><LineChart data={graph.rows} margin={{ top: 8, right: 24, left: 48, bottom: 24 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="dayLabel" label={{ value: "Observation Day", position: "insideBottom", offset: -12 }} /><YAxis label={{ value: `Average ${graph.metric.label}${graph.metric.unit ? ` (${graph.metric.unit})` : ""}`, angle: -90, position: "insideLeft", offset: -25 }} /><Tooltip content={<ResponseTooltip graph={graph} pairMap={pairMap} />} /><Legend formatter={(key) => { const pair = pairMap[key]; return pair ? `${pair.locationName} — ${pair.plotLabel}` : key; }} />{graph.pairs.map((pair, index) => <Line key={keyOf(pair)} type="monotone" dataKey={keyOf(pair)} connectNulls={false} stroke={COLORS[index]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer></div><p style={{ ...styles.chartDescription, marginTop: 14 }}>This chart compares biometric response with cumulative fertilizer application. It shows association, not proven causation.</p></section>;
}
function ResponseTooltip({ active, payload, label, graph, pairMap }) { if (!active || !payload?.length) return null; return <TooltipBox><strong>{label}</strong>{payload.map((entry) => { const pair = pairMap[entry.dataKey]; const meta = entry.payload[`meta__${entry.dataKey}`]; if (!pair || !meta) return null; return <div key={entry.dataKey} style={{ color: entry.color, marginTop: 9 }}><strong>{pair.locationName} — {pair.plotLabel}</strong><div>Treatment: {pair.treatment}</div><div>Average {graph.metric.label}: {meta.value}{graph.metric.unit ? ` ${graph.metric.unit}` : ""}</div><div>{graph.fertilizer.shortLabel} cumulative: {meta.cumulative} {graph.fertilizer.unit}</div><div>Valid biometric records: {meta.count}</div><div>Fertigation records used: {meta.fertilizerRecordCount}</div></div>; })}</TooltipBox>; }

export default AdvancedComparison;
