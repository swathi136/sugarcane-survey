import { describe, expect, it } from "vitest";
import { buildDashboardCalculationSnapshots } from "./buildDashboardCalculationSnapshots";

const locationRows = [
  ["L001", "college-1"],
  ["L002", "athani-1"],
  ["L003", "anthiyur-1"],
];

describe("dashboard calculation snapshots", () => {
  it("creates component results separately for all three approved locations", () => {
    const biometric = locationRows.flatMap(([location_id, source_row_id], index) => [
      { location_id, source_row_id, source: "supabase", plot_id: `P${index + 1}`, treatment_id: "T1", observation_day: 30, plant_height_cm: 100 + index * 10, number_of_tillers: 10, number_of_leaves: 8, leaf_length_cm: 90, leaf_breadth_cm: 3 },
      { location_id, source: "csv", plot_id: `P${index + 1}`, treatment_id: "T1", observation_day: 60, plant_height_cm: 200, number_of_tillers: 20, number_of_leaves: 10, leaf_length_cm: 100, leaf_breadth_cm: 4 },
    ]);
    const fertigation = locationRows.map(([location_id, source_row_id], index) => ({
      location_id, source_row_id, source: "supabase", plot_id: `P${index + 1}`, treatment_id: "T1", day_after_planting: 30, n_kg: 10, p2o5_kg: 5, k2o_kg: 4,
    }));
    const plots = locationRows.map(([location_id], index) => ({ location_id, plot_id: `P${index + 1}`, treatment_id: "T1" }));
    const treatments = locationRows.map(([location_id]) => ({ location_id, treatment_id: "T1" }));

    const snapshots = buildDashboardCalculationSnapshots({ biometric, fertigation, plots, treatments });

    expect(snapshots.map((snapshot) => snapshot.locationId)).toEqual(["L001", "L002", "L003"]);
    snapshots.forEach((snapshot) => {
      expect(snapshot.approvedRowCount).toBe(1);
      expect(snapshot.results.overview.biometricRecords).toBe(2);
      expect(snapshot.results.fertigationTracking.totals.nKg).toBe(10);
      expect(snapshot.results.treatmentComparison.bestTreatment).toBe("T1");
      expect(snapshot.results.smartAlerts).toBeDefined();
      expect(snapshot.results.dataQuality).toBeDefined();
      expect(snapshot.results.reports).toBeDefined();
    });
  });

  it("does not create snapshots for locations without approved Supabase rows", () => {
    expect(buildDashboardCalculationSnapshots({ biometric: [], fertigation: [], plots: [], treatments: [] })).toEqual([]);
  });
});
