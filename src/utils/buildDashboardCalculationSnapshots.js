import { toFiniteMetricOrNull } from "./metrics/toFiniteMetricOrNull";

export const DASHBOARD_CALCULATION_VERSION = "1.0.0";

const LOCATIONS = [
  { id: "L001", name: "College" },
  { id: "L002", name: "Athani" },
  { id: "L003", name: "Anthiyur" },
];

const round = (value, digits = 1) => Number((Number(value) || 0).toFixed(digits));
const values = (rows, field) => rows.map((row) => toFiniteMetricOrNull(row[field])).filter((value) => value !== null);
const average = (items, digits = 1) => items.length ? round(items.reduce((sum, value) => sum + value, 0) / items.length, digits) : 0;
const sum = (rows, field) => round(values(rows, field).reduce((total, value) => total + value, 0), 2);

function groupAverage(rows, groupField, metricFields) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row[groupField];
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([key, groupRows]) => ({
    key,
    recordCount: groupRows.length,
    ...Object.fromEntries(metricFields.map(([output, field]) => [output, average(values(groupRows, field))])),
  }));
}

function treatmentResults(biometric) {
  const rows = groupAverage(biometric, "treatment_id", [
    ["avgPlantHeight", "plant_height_cm"],
    ["avgTillers", "number_of_tillers"],
    ["avgLeaves", "number_of_leaves"],
    ["avgLeafLength", "leaf_length_cm"],
    ["avgLeafBreadth", "leaf_breadth_cm"],
  ]).map(({ key, ...row }) => ({ treatment: key, ...row }));

  const maxima = ["avgPlantHeight", "avgTillers", "avgLeaves", "avgLeafLength", "avgLeafBreadth"]
    .map((field) => Math.max(0, ...rows.map((row) => row[field])));
  const weights = [40, 25, 15, 10, 10];
  const fields = ["avgPlantHeight", "avgTillers", "avgLeaves", "avgLeafLength", "avgLeafBreadth"];

  return rows.map((row) => ({
    ...row,
    performanceScore: round(fields.reduce((score, field, index) =>
      score + (maxima[index] > 0 ? row[field] / maxima[index] : 0) * weights[index], 0)),
  })).sort((a, b) => b.performanceScore - a.performanceScore);
}

function alertResults(biometric, fertigation, plots) {
  const heights = values(biometric, "plant_height_cm");
  const tillers = values(biometric, "number_of_tillers");
  const avgHeight = average(heights, 4);
  const avgTillers = average(tillers, 4);
  const latestDay = Math.max(0, ...values(biometric, "observation_day"));
  const latestPlots = new Set(biometric.filter((row) => row.observation_day === latestDay).map((row) => row.plot_id));
  const lowGrowth = biometric.filter((row) => typeof row.plant_height_cm === "number" && row.plant_height_cm < avgHeight * 0.75).slice(0, 20);
  const weakTillering = biometric.filter((row) => typeof row.number_of_tillers === "number" && row.number_of_tillers < avgTillers * 0.7).slice(0, 15);
  const missingEntries = plots.filter((plot) => !latestPlots.has(plot.plot_id));
  const fertigationAttention = fertigation.filter((row) =>
    (typeof row.n_kg !== "number" || row.n_kg === 0) &&
    (typeof row.k2o_kg !== "number" || row.k2o_kg === 0),
  ).slice(0, 15);

  return {
    total: lowGrowth.length + weakTillering.length + missingEntries.length + fertigationAttention.length,
    lowGrowth: lowGrowth.length,
    weakTillering: weakTillering.length,
    missingEntries: missingEntries.length,
    fertigationAttention: fertigationAttention.length,
    highPriority: lowGrowth.filter((row) => row.plant_height_cm < avgHeight * 0.6).length,
    latestObservationDay: latestDay,
  };
}

function completeness(rows, fields) {
  return Object.fromEntries(fields.map((field) => {
    const present = rows.filter((row) => row[field] !== null && row[field] !== undefined && row[field] !== "").length;
    return [field, rows.length ? round((present / rows.length) * 100) : 0];
  }));
}

function stableSignature(rows) {
  const serialized = JSON.stringify(rows
    .map((row) => Object.keys(row).sort().reduce((result, key) => ({ ...result, [key]: row[key] }), {}))
    .sort((a, b) => String(a.source_row_id).localeCompare(String(b.source_row_id))));
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${DASHBOARD_CALCULATION_VERSION}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function calculateLocation(data, location) {
  const biometric = (data.biometric || []).filter((row) => row.location_id === location.id);
  const fertigation = (data.fertigation || []).filter((row) => row.location_id === location.id);
  const plots = (data.plots || []).filter((row) => row.location_id === location.id);
  const treatments = (data.treatments || []).filter((row) => row.location_id === location.id);
  const approvedRows = [...biometric, ...fertigation].filter((row) => row.source === "supabase");
  const approvedIds = [...new Set(approvedRows.map((row) => row.source_row_id).filter(Boolean))].sort();
  if (!approvedIds.length) return null;

  const heights = values(biometric, "plant_height_cm");
  const tillers = values(biometric, "number_of_tillers");
  const treatmentRanking = treatmentResults(biometric);
  const growthByDay = groupAverage(biometric, "observation_day", [
    ["avgPlantHeight", "plant_height_cm"], ["avgTillers", "number_of_tillers"], ["avgLeaves", "number_of_leaves"],
  ]).map(({ key, ...row }) => ({ day: Number(key), ...row })).sort((a, b) => a.day - b.day);
  const fertilizerByDay = groupAverage(fertigation, "day_after_planting", [
    ["avgN", "n_kg"], ["avgP2O5", "p2o5_kg"], ["avgK2O", "k2o_kg"],
  ]).map(({ key, ...row }) => ({ day: Number(key), ...row })).sort((a, b) => a.day - b.day);
  const alerts = alertResults(biometric, fertigation, plots);
  const biometricCompleteness = completeness(biometric, ["plant_height_cm", "number_of_tillers", "number_of_leaves", "leaf_length_cm", "leaf_breadth_cm"]);
  const fertigationCompleteness = completeness(fertigation, ["n_kg", "p2o5_kg", "k2o_kg", "urea_kg", "map_kg", "dap_kg", "white_potash_kg"]);
  const overview = {
    totalLocations: 1,
    totalPlots: new Set(plots.map((row) => row.plot_id).filter(Boolean)).size,
    totalTreatments: new Set(biometric.map((row) => row.treatment_id).filter(Boolean)).size,
    biometricRecords: biometric.length,
    fertigationRecords: fertigation.length,
    avgPlantHeight: average(heights),
    avgTillers: average(tillers),
    latestObservationDay: Math.max(0, ...values(biometric, "observation_day")),
    openAlerts: alerts.total,
  };

  return {
    locationId: location.id,
    locationName: location.name,
    sourceSignature: stableSignature(approvedRows),
    approvedRowCount: approvedIds.length,
    approvedRowIds: approvedIds,
    results: {
      overview,
      biometricGrowth: {
        summaries: {
          plantHeight: { average: average(heights), highest: heights.length ? Math.max(...heights) : 0, lowest: heights.length ? Math.min(...heights) : 0 },
          tillers: { average: average(tillers), highest: tillers.length ? Math.max(...tillers) : 0, lowest: tillers.length ? Math.min(...tillers) : 0 },
          leaves: { average: average(values(biometric, "number_of_leaves")) },
          leafLength: { average: average(values(biometric, "leaf_length_cm")) },
          leafBreadth: { average: average(values(biometric, "leaf_breadth_cm")) },
        },
        growthByDay,
      },
      fertigationTracking: {
        totalRecords: fertigation.length,
        totalPlots: new Set(fertigation.map((row) => row.plot_id).filter(Boolean)).size,
        totalTreatments: new Set(fertigation.map((row) => row.treatment_id).filter(Boolean)).size,
        totals: { nKg: sum(fertigation, "n_kg"), p2o5Kg: sum(fertigation, "p2o5_kg"), k2oKg: sum(fertigation, "k2o_kg"), ureaKg: sum(fertigation, "urea_kg"), mapKg: sum(fertigation, "map_kg"), dapKg: sum(fertigation, "dap_kg"), whitePotashKg: sum(fertigation, "white_potash_kg") },
        fertilizerByDay,
      },
      treatmentComparison: {
        ranking: treatmentRanking,
        bestTreatment: treatmentRanking[0]?.treatment || null,
        weakestTreatment: treatmentRanking.at(-1)?.treatment || null,
      },
      comparativeAnalysis: { treatmentRanking, growthByDay, fertilizerByDay },
      smartAlerts: alerts,
      dataQuality: { biometricCompleteness, fertigationCompleteness },
      reports: { ...overview, alerts, treatmentRanking, fertilizerTotals: { nKg: sum(fertigation, "n_kg"), p2o5Kg: sum(fertigation, "p2o5_kg"), k2oKg: sum(fertigation, "k2o_kg") } },
      treatmentMaster: { referenceRows: treatments.length, mappedPlots: plots.length, treatments: new Set(treatments.map((row) => row.treatment_id).filter(Boolean)).size },
    },
  };
}

export function buildDashboardCalculationSnapshots(data) {
  return LOCATIONS.map((location) => calculateLocation(data, location)).filter(Boolean);
}
