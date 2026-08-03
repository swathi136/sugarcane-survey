import { supabase } from "../utils/supabaseClient";

export const APPROVED_ANTHIYUR_RPC = "get_approved_anthiyur_dashboard_data";

export async function loadApprovedAnthiyurData() {
  const { data, error } = await supabase.rpc(APPROVED_ANTHIYUR_RPC);
  if (error) return { rows: [], error };
  return { rows: data || [], error: null };
}
