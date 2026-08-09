export const HEATMAP_METRICS = [
  { key: "plant_height", label: "Plant Height", field: "plant_height_cm", unit: "cm", decimals: 1 },
  { key: "tillers", label: "Tiller Count", field: "number_of_tillers", unit: "", decimals: 1 },
  { key: "leaves", label: "Leaf Count", field: "number_of_leaves", unit: "", decimals: 1 },
  { key: "leaf_length", label: "Leaf Length", field: "leaf_length_cm", unit: "cm", decimals: 1 },
  { key: "leaf_breadth", label: "Leaf Breadth", field: "leaf_breadth_cm", unit: "cm", decimals: 1 },
  { key: "nodes", label: "Node Count", field: "number_of_nodes", unit: "", decimals: 1 },
  { key: "node_length", label: "Node Length", field: "node_length_cm", unit: "cm", decimals: 1 },
  { key: "millable_cane", label: "Millable Cane Count", field: "millable_cane_count", unit: "", decimals: 1 },
];

export const HEATMAP_FERTILIZERS = [
  { key: "n", label: "N", field: "n_kg", unit: "kg" },
  { key: "p2o5", label: "P₂O₅", field: "p2o5_kg", unit: "kg" },
  { key: "k2o", label: "K₂O", field: "k2o_kg", unit: "kg" },
  { key: "urea", label: "Urea", field: "urea_kg", unit: "kg" },
  { key: "dap", label: "DAP", field: "dap_kg", unit: "kg" },
  { key: "map", label: "MAP", field: "map_kg", unit: "kg" },
  { key: "ssp", label: "SSP", field: "ssp_kg", unit: "kg" },
  { key: "mop", label: "MOP", field: "mop_kg", unit: "kg" },
  { key: "white_potash", label: "White Potash", field: "white_potash_kg", unit: "kg" },
];

export function finiteHeatmapValue(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function hasValidHeatmapCell(cell) {
  const value = cell && typeof cell === "object" && Object.hasOwn(cell, "value") ? cell.value : cell;
  return finiteHeatmapValue(value) !== null;
}

export function removeEmptyHeatmapColumns(matrix) {
  const columns = (matrix.columns || []).filter((column) => (
    (matrix.rows || []).some((row) => hasValidHeatmapCell(row.cells?.[column.key]))
  ));
  const columnKeys = new Set(columns.map((column) => column.key));
  const values = Array.isArray(matrix.values)
    ? (matrix.rows || []).flatMap((row) => columns.map((column) => finiteHeatmapValue(row.cells?.[column.key]?.value)).filter((value) => value !== null))
    : Object.fromEntries(Object.entries(matrix.values || {}).filter(([key]) => columnKeys.has(key)));
  return { ...matrix, columns, values };
}

function mean(values, decimals = null) {
  const valid = values.map(finiteHeatmapValue).filter((value) => value !== null);
  if (!valid.length) return null;
  const value = valid.reduce((sum, item) => sum + item, 0) / valid.length;
  return decimals === null ? value : Number(value.toFixed(decimals));
}

function pearson(pairs) {
  if (pairs.length < 2) return null;
  const xMean = mean(pairs.map((pair) => pair.x));
  const yMean = mean(pairs.map((pair) => pair.y));
  let numerator = 0;
  let xSquared = 0;
  let ySquared = 0;

  pairs.forEach(({ x, y }) => {
    const xDelta = x - xMean;
    const yDelta = y - yMean;
    numerator += xDelta * yDelta;
    xSquared += xDelta * xDelta;
    ySquared += yDelta * yDelta;
  });

  const denominator = Math.sqrt(xSquared * ySquared);
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(3));
}

function selectedLocationName(locations, locationId) {
  const location = locations.find((item) => item.location_id === locationId);
  return location?.location_short_name || location?.location_name || locationId;
}

function groupRowsByPlot(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (!row.plot_id) return;
    if (!grouped.has(row.plot_id)) grouped.set(row.plot_id, []);
    grouped.get(row.plot_id).push(row);
  });
  return grouped;
}

function cumulativeForPlot(rows, day, field) {
  const values = rows
    .filter((row) => {
      const rowDay = finiteHeatmapValue(row.day_after_planting);
      return rowDay !== null && rowDay <= day;
    })
    .map((row) => finiteHeatmapValue(row[field]))
    .filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

export function buildFertilizerMetricHeatmap({
  biometricRows = [],
  fertigationRows = [],
  locations = [],
  locationId = "",
  observationDay = "",
}) {
  const day = finiteHeatmapValue(observationDay);
  if (!locationId || day === null) return { rows: [], columns: HEATMAP_METRICS, values: [], locationName: "", day };

  const biometricByPlot = groupRowsByPlot(biometricRows.filter((row) => (
    row.location_id === locationId && finiteHeatmapValue(row.observation_day) === day
  )));
  const fertigationByPlot = groupRowsByPlot(fertigationRows.filter((row) => row.location_id === locationId));

  const matrixRows = HEATMAP_FERTILIZERS.map((fertilizer) => {
    const cells = Object.fromEntries(HEATMAP_METRICS.map((metric) => {
      const pairs = [];
      biometricByPlot.forEach((plotRows, plotId) => {
        const metricValue = mean(plotRows.map((row) => row[metric.field]));
        const fertilizerValue = cumulativeForPlot(fertigationByPlot.get(plotId) || [], day, fertilizer.field);
        if (metricValue !== null && fertilizerValue !== null) pairs.push({ x: fertilizerValue, y: metricValue });
      });
      const value = pearson(pairs);
      return [metric.key, value === null ? null : { value, count: pairs.length }];
    }));
    return { key: fertilizer.key, label: fertilizer.label, fertilizer, cells };
  });

  return removeEmptyHeatmapColumns({
    rows: matrixRows,
    columns: HEATMAP_METRICS,
    values: matrixRows.flatMap((row) => HEATMAP_METRICS.map((metric) => row.cells[metric.key]?.value).filter((value) => value !== undefined)),
    locationId,
    locationName: selectedLocationName(locations, locationId),
    day,
  });
}

export function buildDayMetricHeatmap({
  biometricRows = [],
  locations = [],
  locationId = "",
  startDay = "",
  endDay = "",
}) {
  const start = finiteHeatmapValue(startDay);
  const end = finiteHeatmapValue(endDay);
  if (!locationId || start === null || end === null || start > end) {
    return { rows: [], columns: HEATMAP_METRICS, values: [], locationName: "", startDay: start, endDay: end };
  }

  const selected = biometricRows.filter((row) => {
    const day = finiteHeatmapValue(row.observation_day);
    return row.location_id === locationId && day !== null && day >= start && day <= end;
  });
  const days = [...new Set(selected.map((row) => finiteHeatmapValue(row.observation_day)))].sort((a, b) => a - b);
  const matrixRows = days.map((day) => {
    const dayRows = selected.filter((row) => finiteHeatmapValue(row.observation_day) === day);
    const cells = Object.fromEntries(HEATMAP_METRICS.map((metric) => {
      const valid = dayRows.map((row) => finiteHeatmapValue(row[metric.field])).filter((value) => value !== null);
      if (!valid.length) return [metric.key, null];
      return [metric.key, { value: mean(valid, metric.decimals), count: valid.length }];
    }));
    return { key: String(day), day, cells };
  });

  const values = Object.fromEntries(HEATMAP_METRICS.map((metric) => [
    metric.key,
    matrixRows.map((row) => row.cells[metric.key]?.value).filter((value) => value !== undefined),
  ]));
  return removeEmptyHeatmapColumns({
    rows: matrixRows,
    columns: HEATMAP_METRICS,
    values,
    locationId,
    locationName: selectedLocationName(locations, locationId),
    startDay: start,
    endDay: end,
  });
}
