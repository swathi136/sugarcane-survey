import { supabase } from "../utils/supabaseClient";

export const APPROVED_COLLEGE_DASHBOARD_COLUMNS = [
  "id", "location_code", "location_name", "plot", "treatment",
  "observation_day", "observation_date", "plant_height",
  "tiller_count", "leaf_count", "leaf_length", "leaf_width",
  "plant_count_1m", "plant_count_5m", "plant_count_15m", "number_of_nodes",
  "node_length", "germination_pct", "fertigation_date", "white_potash_kg",
  "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea", "map", "dap",
  "ssp", "mop", "status", "created_at",
].join(",");

export async function loadApprovedCollegeData() {
  const { data, error } = await supabase
    .from("field_entries")
    .select(APPROVED_COLLEGE_DASHBOARD_COLUMNS)
    .eq("status", "Approved")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return { rows: [], error };
  }

  return { rows: data || [], error: null };
}
