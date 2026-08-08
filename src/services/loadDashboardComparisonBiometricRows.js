import { supabase } from "../utils/supabaseClient";
import { loadPaginatedSupabaseRows } from "./loadPaginatedSupabaseRows";

export const COMPARISON_BIOMETRIC_RPC = "get_dashboard_comparison_biometric_rows";

export async function loadDashboardComparisonBiometricRows() {
  const rows = await loadPaginatedSupabaseRows({
    sourceName: "dashboard_biometric_source",
    fetchPage: (from, to) => supabase.rpc(COMPARISON_BIOMETRIC_RPC).range(from, to),
  });
  return { rows, error: null };
}
