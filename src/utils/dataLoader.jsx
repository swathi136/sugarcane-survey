import { loadDashboardComparisonBiometricRows } from "../services/loadDashboardComparisonBiometricRows";
import { loadDashboardComparisonFertigationRows } from "../services/loadDashboardComparisonFertigationRows";
import {
  loadServerDashboardReferenceData,
  loadServerDashboardResults,
} from "../services/loadServerDashboardResults";

const BIOMETRIC_NUMERIC_FIELDS = [
  "observation_day", "plant_count_1m", "plant_count_5m", "plant_count_15m",
  "number_of_node", "number_of_nodes", "node_length_cm", "millable_cane_count",
  "millable_cane_count_1m", "cane_girth_cm", "number_of_tillers",
  "number_of_leaves", "plant_height_cm", "leaf_length_cm", "leaf_breadth_cm",
  "germination_pct",
];

const FERTIGATION_NUMERIC_FIELDS = [
  "day_after_planting", "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture_kg",
  "urea_kg", "map_kg", "dap_kg", "white_potash_kg",
];

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeNumericFields(row, fields) {
  const normalized = { ...row };
  fields.forEach((field) => {
    if (Object.hasOwn(row, field)) normalized[field] = finiteOrNull(row[field]);
  });
  return normalized;
}

export function normalizeDashboardBiometricRows(rows) {
  return (rows || []).map((row) => ({
    ...normalizeNumericFields(row, BIOMETRIC_NUMERIC_FIELDS),
    source: row.source_type || row.source || null,
  }));
}

export function normalizeDashboardFertigationRows(rows) {
  return (rows || []).map((row) => ({
    ...normalizeNumericFields(row, FERTIGATION_NUMERIC_FIELDS),
    source: row.source_type || row.source || null,
  }));
}

function requireSuccessfulResult(result, sourceName) {
  if (!result?.error) return result;
  const message = result.error.message || String(result.error);
  throw new Error(`Failed to load Supabase source "${sourceName}": ${message}`, { cause: result.error });
}

export async function loadDashboardData() {
  const [biometricResult, fertigationResult, referenceResult, serverResult] = await Promise.all([
    loadDashboardComparisonBiometricRows(),
    loadDashboardComparisonFertigationRows(),
    loadServerDashboardReferenceData(),
    loadServerDashboardResults(),
  ]);

  requireSuccessfulResult(biometricResult, "dashboard_biometric_source");
  requireSuccessfulResult(fertigationResult, "dashboard_fertigation_source");
  requireSuccessfulResult(referenceResult, "dashboard reference tables");
  requireSuccessfulResult(serverResult, "dashboard_current_results");

  const biometric = normalizeDashboardBiometricRows(biometricResult.rows);
  const fertigation = normalizeDashboardFertigationRows(fertigationResult.rows);
  const reference = referenceResult.data || {};

  return {
    biometric,
    fertigation,
    comparisonBiometric: biometric,
    comparisonFertigation: fertigation,
    fertigationSummary: reference.fertigationSummary || [],
    fertilizerStock: reference.fertilizerStock || [],
    cropStageSplit: reference.cropStageSplit || [],
    plots: reference.plots || [],
    locations: reference.locations || [],
    treatments: reference.treatments || [],
    serverResultsByLocation: serverResult.byLocation,
    serverCalculationParity: [],
    dashboardDataSource: "supabase-source-views",
  };
}
