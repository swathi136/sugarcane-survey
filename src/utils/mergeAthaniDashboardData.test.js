import { describe, expect, it } from "vitest";
import { mergeAthaniDashboardData } from "./mergeAthaniDashboardData";

const athani = { location_id: "L002", plot_id: "P029", treatment_id: "T1" };

describe("Athani dashboard merge", () => {
  it("preserves CSV and College rows while appending each Supabase biometric source once", () => {
    const csv = Array.from({ length: 5 }, (_, i) => ({ ...athani, observation_day: 30, csvPlant: i + 1 }));
    const college = { location_id: "L001", plot_id: "P001", treatment_id: "T1" };
    const plant1 = { ...athani, plant_number: 1, source: "supabase", source_row_id: "a1" };
    const plant2 = { ...athani, plant_number: 2, source: "supabase", source_row_id: "a2" };
    const result = mergeAthaniDashboardData({ biometric: [college, ...csv], fertigation: [], plots: ["unchanged"] }, { biometric: [plant1, plant1, plant2], fertigation: [] });
    expect(result.data.biometric).toHaveLength(8);
    expect(result.data.biometric[0]).toBe(college);
    expect(result.data.plots).toEqual(["unchanged"]);
    expect(result.diagnostics.biometric.duplicateCount).toBe(1);
  });

  it("replaces one exact fertigation match and preserves unique additions", () => {
    const csv = { ...athani, day_after_planting: 30, date: "03.08.2026" };
    const approved = { ...athani, day_after_planting: 30, date: "2026-08-03T00:00:00Z", source: "supabase", source_row_id: "f1" };
    const result = mergeAthaniDashboardData({ biometric: [], fertigation: [csv] }, { biometric: [], fertigation: [approved, approved] });
    expect(result.data.fertigation).toEqual([approved]);
    expect(result.diagnostics.fertigation.duplicateCount).toBe(2);
  });

  it("preserves ambiguous CSV fertigation matches", () => {
    const csv = { ...athani, day_after_planting: 30, date: "2026-08-03" };
    const approved = { ...csv, source: "supabase", source_row_id: "f2" };
    const result = mergeAthaniDashboardData({ biometric: [], fertigation: [csv, { ...csv }] }, { biometric: [], fertigation: [approved] });
    expect(result.data.fertigation).toHaveLength(3);
    expect(result.diagnostics.fertigation.ambiguousKeys).toHaveLength(1);
  });
});
