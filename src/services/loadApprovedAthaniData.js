import { supabase } from "../utils/supabaseClient";

export const APPROVED_ATHANI_DASHBOARD_COLUMNS = [
  "id", "location_code", "location_name", "plot", "treatment", "treatment_name",
  "observation_day", "date_of_obs", "plant_num", "plant_height", "tiller_count",
  "leaf_count", "leaf_height", "leaf_breath", "fertigation_date", "n_kg",
  "p2o5_kg", "k2o_kg", "mn_mixture", "urea_kg", "map_kg", "dap_kg",
  "white_potash_kg", "status", "created_at",
].join(",");

export async function loadApprovedAthaniData() {
  const { data, error } = await supabase
    .from("athani_field_entries")
    .select(APPROVED_ATHANI_DASHBOARD_COLUMNS)
    .eq("status", "Approved")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) return { rows: [], error };
  return { rows: data || [], error: null };
}
