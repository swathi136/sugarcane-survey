import { supabase } from "../utils/supabaseClient";

export async function loadBiometricGrowthResults(locationId, treatmentId, metric) {
  const { data, error } = await supabase.rpc("get_biometric_growth_results", {
    p_location_id: locationId || "All",
    p_treatment_id: treatmentId || "All",
    p_metric: metric,
  });
  if (error) throw error;
  return {
    ...data,
    summary: {
      average: Number(data?.summary?.average || 0),
      highest: Number(data?.summary?.highest || 0),
      lowest: Number(data?.summary?.lowest || 0),
      latestDay: Number(data?.summary?.latest_day || 0),
      totalRecords: Number(data?.summary?.total_records || 0),
    },
    latestRows: (data?.latestRows || []).map((row) => ({
      ...row,
      location_id: row.location_id,
      plot_id: row.plot_id,
      plot_label: row.plot_label,
      treatment_id: row.treatment_id,
      observation_day: row.observation_day,
      source_sheet: row.source_sheet,
      [metric]: Number(row.metric_value),
    })),
  };
}

export async function loadFertigationTrackingResults(locationId, treatmentId) {
  const { data, error } = await supabase.rpc("get_fertigation_tracking_results", {
    p_location_id: locationId || "All",
    p_treatment_id: treatmentId || "All",
  });
  if (error) throw error;
  return {
    ...data,
    summary: {
      totalRecords: Number(data?.summary?.total_records || 0),
      totalTreatments: Number(data?.summary?.total_treatments || 0),
      totalPlots: Number(data?.summary?.total_plots || 0),
      totalN: Number(data?.summary?.total_n || 0),
      totalP: Number(data?.summary?.total_p || 0),
      totalK: Number(data?.summary?.total_k || 0),
      totalUrea: Number(data?.summary?.total_urea || 0),
      totalPotash: Number(data?.summary?.total_potash || 0),
    },
    usage: (data?.usage || []).filter((item) => Number(item.quantity) > 0),
  };
}

export async function loadDataQualityResults(locationId) {
  const { data, error } = await supabase.rpc("get_dashboard_data_quality_results", {
    p_location_id: locationId || "All",
  });
  if (error) throw error;
  const adaptRows = (rows) => (rows || []).map((row) => ({
    column: row.column_name,
    total: Number(row.total || 0),
    available: Number(row.available || 0),
    missing: Number(row.missing || 0),
    completeness: Number(row.completeness || 0),
  }));
  return {
    ...data,
    biometricColumns: adaptRows(data?.biometricColumns),
    fertigationColumns: adaptRows(data?.fertigationColumns),
    locationCoverage: (data?.locationCoverage || []).map((row) => ({
      locationId: row.location_id,
      records: Number(row.records || 0),
      heightCompleteness: Number(row.height_completeness || 0),
      tillersCompleteness: Number(row.tillers_completeness || 0),
      leavesCompleteness: Number(row.leaves_completeness || 0),
      latestDay: Number(row.latest_day || 0),
    })),
    summary: {
      biometricRecords: Number(data?.summary?.biometric_records || 0),
      fertigationRecords: Number(data?.summary?.fertigation_records || 0),
      biometricCompleteness: Number(data?.summary?.biometric_completeness || 0),
      fertigationCompleteness: Number(data?.summary?.fertigation_completeness || 0),
      strongColumns: Number(data?.summary?.strong_columns || 0),
      weakColumns: Number(data?.summary?.weak_columns || 0),
    },
  };
}

export async function loadComparativeAnalysisResults({
  locationId,
  treatmentId,
  bioDayMin = null,
  bioDayMax = null,
  fertDayMin = null,
  fertDayMax = null,
}) {
  const { data, error } = await supabase.rpc("get_comparative_analysis_results", {
    p_location_id: locationId || "All",
    p_treatment_id: treatmentId || "All",
    p_bio_day_min: bioDayMin,
    p_bio_day_max: bioDayMax,
    p_fert_day_min: fertDayMin,
    p_fert_day_max: fertDayMax,
  });
  if (error) throw error;
  return data;
}
