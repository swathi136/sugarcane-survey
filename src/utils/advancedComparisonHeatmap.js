export const HEATMAP_METRICS = [
  { key: "plant_height", label: "Plant Height", field: "plant_height_cm", unit: "cm", decimals: 1 },
  { key: "tillers", label: "Tiller Count", field: "number_of_tillers", unit: "", decimals: 1 },
  { key: "leaves", label: "Leaf Count", field: "number_of_leaves", unit: "", decimals: 1 },
  { key: "leaf_length", label: "Leaf Length", field: "leaf_length_cm", unit: "cm", decimals: 1 },
  { key: "leaf_breadth", label: "Leaf Breadth", field: "leaf_breadth_cm", unit: "cm", decimals: 1 },
  { key: "nodes", label: "Number of Nodes", field: "number_of_nodes", unit: "", decimals: 1 },
  { key: "node_length", label: "Node Length", field: "node_length_cm", unit: "cm", decimals: 1 },
  { key: "millable_cane", label: "Millable Cane Count", field: "millable_cane_count", unit: "", decimals: 1 },
  { key: "plant_count_1m", label: "Plant Count at 1 metre", field: "plant_count_1m", unit: "", decimals: 1 },
  { key: "plant_count_5m", label: "Plant Count at 5 metres", field: "plant_count_5m", unit: "", decimals: 1 },
  { key: "plant_count_15m", label: "Plant Count at 15 metres", field: "plant_count_15m", unit: "", decimals: 1 },
  { key: "germination", label: "Germination Percentage", field: "germination_pct", unit: "%", decimals: 1 },
];

export const HEATMAP_FERTILIZERS = [
  { key: "n", label: "Nitrogen", field: "n_kg", unit: "kg" },
  { key: "p2o5", label: "P₂O₅", field: "p2o5_kg", unit: "kg" },
  { key: "k2o", label: "K₂O", field: "k2o_kg", unit: "kg" },
  { key: "mn", label: "Mn Mixture", field: "mn_mixture_kg", unit: "kg" },
  { key: "urea", label: "Urea", field: "urea_kg", unit: "kg" },
  { key: "map", label: "MAP", field: "map_kg", unit: "kg" },
  { key: "dap", label: "DAP", field: "dap_kg", unit: "kg" },
  { key: "ssp", label: "SSP", field: "ssp_kg", unit: "kg" },
  { key: "mop", label: "MOP", field: "mop_kg", unit: "kg" },
  { key: "white_potash", label: "White Potash", field: "white_potash_kg", unit: "kg" },
];

export function finiteHeatmapValue(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function summarize(values, decimals = 1, method = "mean") {
  const valid = values.map(finiteHeatmapValue).filter((value) => value !== null);
  if (!valid.length) return null;
  const total = valid.reduce((sum, value) => sum + value, 0);
  const value = method === "sum" ? total : total / valid.length;
  return { value: Number(value.toFixed(decimals)), count: valid.length };
}

function inRange(day, startDay, endDay) {
  return (startDay === "" || day >= Number(startDay)) && (endDay === "" || day <= Number(endDay));
}

function plotLookup(plots) {
  return new Map(plots.map((plot) => [`${plot.location_id}|${plot.plot_id}`, plot]));
}

function locationLookup(locations) {
  return new Map(locations.map((location) => [location.location_id, location.location_short_name || location.location_name || location.location_id]));
}

export function buildBiometricHeatmap({ rows, plots = [], locations = [], metric, startDay = "", endDay = "", locationId = "", plotKey = "" }) {
  if (!metric) return { rows: [], days: [], values: [] };
  const selected = rows.filter((row) => {
    const day = finiteHeatmapValue(row.observation_day);
    const key = `${row.location_id}|${row.plot_id}`;
    return day !== null && inRange(day, startDay, endDay) && (!locationId || row.location_id === locationId) && (!plotKey || key === plotKey);
  });
  const days = [...new Set(selected.map((row) => Number(row.observation_day)))].sort((a, b) => a - b);
  const plotsByKey = plotLookup(plots);
  const locationsById = locationLookup(locations);
  const identities = [...new Set(selected.map((row) => `${row.location_id}|${row.plot_id}`))].sort();
  const matrixRows = identities.map((key) => {
    const [rowLocationId, plotId] = key.split("|");
    const plot = plotsByKey.get(key);
    const source = selected.find((row) => row.location_id === rowLocationId && row.plot_id === plotId);
    const cells = Object.fromEntries(days.map((day) => [day, summarize(selected.filter((row) => row.location_id === rowLocationId && row.plot_id === plotId && Number(row.observation_day) === day).map((row) => row[metric.field]), metric.decimals)]));
    return { key, locationId: rowLocationId, locationName: locationsById.get(rowLocationId) || source?.location_name || rowLocationId, plotId, plotLabel: plot?.plot_name || plot?.plot_label || source?.plot_label || plotId, treatment: plot?.treatment_id || source?.treatment_id || "Not mapped", cells };
  });
  return { rows: matrixRows, days, values: matrixRows.flatMap((row) => days.map((day) => row.cells[day]?.value).filter((value) => value !== undefined)) };
}

export function buildFertilizerHeatmap({ rows, plots = [], locations = [], fertilizer, startDay = "", endDay = "", locationId = "", plotKey = "" }) {
  if (!fertilizer) return { rows: [], days: [], values: [] };
  const selected = rows.filter((row) => {
    const day = finiteHeatmapValue(row.day_after_planting);
    const key = `${row.location_id}|${row.plot_id}`;
    return day !== null && inRange(day, startDay, endDay) && (!locationId || row.location_id === locationId) && (!plotKey || key === plotKey);
  });
  const days = [...new Set(selected.map((row) => Number(row.day_after_planting)))].sort((a, b) => a - b);
  const plotsByKey = plotLookup(plots);
  const locationsById = locationLookup(locations);
  const identities = [...new Set(selected.map((row) => `${row.location_id}|${row.plot_id}`))].sort();
  const matrixRows = identities.map((key) => {
    const [rowLocationId, plotId] = key.split("|");
    const plot = plotsByKey.get(key);
    const source = selected.find((row) => row.location_id === rowLocationId && row.plot_id === plotId);
    const cells = Object.fromEntries(days.map((day) => [day, summarize(selected.filter((row) => row.location_id === rowLocationId && row.plot_id === plotId && Number(row.day_after_planting) === day).map((row) => row[fertilizer.field]), 2, "sum")]));
    return { key, locationId: rowLocationId, locationName: locationsById.get(rowLocationId) || source?.location_name || rowLocationId, plotId, plotLabel: plot?.plot_name || plot?.plot_label || source?.plot_label || plotId, treatment: plot?.treatment_id || source?.treatment_id || "Not mapped", cells };
  });
  return { rows: matrixRows, days, values: matrixRows.flatMap((row) => days.map((day) => row.cells[day]?.value).filter((value) => value !== undefined)) };
}

export function buildTreatmentHeatmap({ rows, locations = [], metric, startDay = "", endDay = "", locationId = "" }) {
  if (!metric || !locationId) return { rows: [], days: [], values: [] };
  const selected = rows.filter((row) => {
    const day = finiteHeatmapValue(row.observation_day);
    return row.location_id === locationId && row.treatment_id && day !== null && inRange(day, startDay, endDay);
  });
  const days = [...new Set(selected.map((row) => Number(row.observation_day)))].sort((a, b) => a - b);
  const treatments = [...new Set(selected.map((row) => row.treatment_id))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const locationName = locationLookup(locations).get(locationId) || locationId;
  const matrixRows = treatments.map((treatment) => {
    const cells = Object.fromEntries(days.map((day) => [day, summarize(selected.filter((row) => row.treatment_id === treatment && Number(row.observation_day) === day).map((row) => row[metric.field]), metric.decimals)]));
    return { key: `${locationId}|${treatment}`, locationId, locationName, treatment, cells };
  });
  return { rows: matrixRows, days, values: matrixRows.flatMap((row) => days.map((day) => row.cells[day]?.value).filter((value) => value !== undefined)) };
}
