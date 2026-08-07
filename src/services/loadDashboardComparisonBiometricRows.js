import { supabase } from "../utils/supabaseClient";

export const COMPARISON_BIOMETRIC_RPC = "get_dashboard_comparison_biometric_rows";
const PAGE_SIZE = 1000;

export async function loadDashboardComparisonBiometricRows() {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.rpc(COMPARISON_BIOMETRIC_RPC).range(from, from + PAGE_SIZE - 1);
    if (error) return { rows: [], error };
    const page = Array.isArray(data) ? data : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { rows, error: null };
  }
}
