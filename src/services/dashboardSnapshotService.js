import { supabase } from "../utils/supabaseClient";
import { DASHBOARD_CALCULATION_VERSION } from "../utils/buildDashboardCalculationSnapshots";

export async function saveDashboardCalculationSnapshots(snapshots) {
  if (!snapshots?.length) return { saved: 0, skipped: 0 };

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) return { saved: 0, skipped: snapshots.length };

  const settled = await Promise.allSettled(snapshots.map((snapshot) =>
    supabase.rpc("save_dashboard_calculation_snapshot", {
      p_location_id: snapshot.locationId,
      p_location_name: snapshot.locationName,
      p_source_signature: snapshot.sourceSignature,
      p_approved_row_count: snapshot.approvedRowCount,
      p_approved_row_ids: snapshot.approvedRowIds,
      p_calculation_version: DASHBOARD_CALCULATION_VERSION,
      p_results: snapshot.results,
    }),
  ));

  const failures = settled.filter((result) => result.status === "rejected" || result.value?.error);
  if (failures.length && import.meta.env.DEV) {
    console.error("Some dashboard calculation snapshots could not be saved", failures);
  }
  return { saved: settled.length - failures.length, skipped: failures.length };
}
