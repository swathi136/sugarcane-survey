import { supabase } from "../utils/supabaseClient";
import { loadPaginatedSupabaseRows } from "./loadPaginatedSupabaseRows";

export const COMPARISON_FERTIGATION_RPC = "get_dashboard_comparison_fertigation_rows";

export async function loadDashboardComparisonFertigationRows() {
  const rows = await loadPaginatedSupabaseRows({
    sourceName: "dashboard_fertigation_source",
    fetchPage: (from, to) => supabase.rpc(COMPARISON_FERTIGATION_RPC).range(from, to),
  });
  return { rows, error: null };
}
