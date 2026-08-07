import { supabase } from "../utils/supabaseClient";

export function adaptResult(result) {
  if (!result) return result;
  const growthByDay = (result.biometricGrowth?.growthByDay || [])
    .filter((row) => row.avg_plant_height !== null && row.avg_plant_height !== undefined)
    .map((row) => ({
      day: Number(row.day),
      recordCount: Number(row.record_count || 0),
      avgPlantHeight: Number(row.avg_plant_height),
      avgTillers: row.avg_tillers == null ? null : Number(row.avg_tillers),
      avgLeaves: row.avg_leaves == null ? null : Number(row.avg_leaves),
    }));
  const fertilizerByDay = (result.fertigationTracking?.fertilizerByDay || []).map((row) => ({
    day: Number(row.day),
    recordCount: Number(row.record_count || 0),
    avgN: Number(row.avg_n || 0),
    avgP2O5: Number(row.avg_p2o5 || 0),
    avgK2O: Number(row.avg_k2o || 0),
  }));
  return {
    ...result,
    biometricGrowth: { ...result.biometricGrowth, growthByDay },
    fertigationTracking: { ...result.fertigationTracking, fertilizerByDay },
    comparativeAnalysis: {
      ...result.comparativeAnalysis,
      growthByDay,
      fertilizerByDay,
    },
  };
}

export async function loadServerDashboardResults() {
  const { data, error } = await supabase
    .from("dashboard_current_results")
    .select("location_id,location_name,source_signature,calculation_version,approved_row_count,results,refreshed_at")
    .order("location_id", { ascending: true });

  if (error) return { byLocation: {}, rows: [], error };
  const rows = data || [];
  return {
    rows,
    byLocation: Object.fromEntries(rows.map((row) => [row.location_id, adaptResult(row.results)])),
    error: null,
  };
}

export async function loadServerDashboardReferenceData() {
  const { data, error } = await supabase.rpc("get_dashboard_reference_data");
  if (error) return { data: null, error };
  return { data, error: null };
}

export function buildPreparedDashboardData(results, reference, comparison) {
  return {
    biometric: [],
    fertigation: [],
    comparisonBiometric: comparison.biometric || [],
    comparisonFertigation: comparison.fertigation || [],
    locations: reference.data.locations || [],
    plots: reference.data.plots || [],
    treatments: reference.data.treatments || [],
    cropStageSplit: reference.data.cropStageSplit || [],
    fertilizerStock: reference.data.fertilizerStock || [],
    fertigationSummary: reference.data.fertigationSummary || [],
    serverResultsByLocation: results.byLocation,
    serverCalculationParity: [],
    dashboardDataSource: "supabase-prepared-results",
  };
}
