import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { adaptResult, buildPreparedDashboardData } from "./loadServerDashboardResults";

describe("adaptResult", () => {
  it("keeps the original overview behavior by omitting days without plant height", () => {
    const result = adaptResult({
      biometricGrowth: {
        growthByDay: [
          { day: 160, record_count: 25, avg_plant_height: 366.4, avg_tillers: 5.4 },
          { day: 170, record_count: 25, avg_plant_height: null, avg_tillers: null },
          { day: 240, record_count: 26, avg_plant_height: 300, avg_tillers: 20 },
        ],
      },
      fertigationTracking: { fertilizerByDay: [] },
      comparativeAnalysis: {},
    });

    expect(result.biometricGrowth.growthByDay).toEqual([
      { day: 160, recordCount: 25, avgPlantHeight: 366.4, avgTillers: 5.4, avgLeaves: null },
      { day: 240, recordCount: 26, avgPlantHeight: 300, avgTillers: 20, avgLeaves: null },
    ]);
  });
});

describe("prepared dashboard comparison extension", () => {
  it("adds comparison arrays without changing existing prepared properties", () => {
    const byLocation = { All: { overview: { totalRecords: 10 } } };
    const reference = { data: { locations: [1], plots: [2], treatments: [3], cropStageSplit: [4], fertilizerStock: [5], fertigationSummary: [6] } };
    const comparison = { biometric: [{ plot_id: "P001" }], fertigation: [{ plot_id: "P001" }] };
    const result = buildPreparedDashboardData({ byLocation }, reference, comparison);
    expect(result.biometric).toEqual([]);
    expect(result.fertigation).toEqual([]);
    expect(result.serverResultsByLocation).toBe(byLocation);
    expect(result.comparisonBiometric).toBe(comparison.biometric);
    expect(result.comparisonFertigation).toBe(comparison.fertigation);
  });

  it("keeps RPCs fixed-column, read-only and free of private submission fields", () => {
    const sql = fs.readFileSync("supabase/migrations/20260807100000_add_advanced_comparison_read_rpcs.sql", "utf8");
    expect(sql).toContain("from public.dashboard_biometric_source source");
    expect(sql).toContain("from public.dashboard_fertigation_source source");
    expect(sql).toContain("security definer");
    expect(sql).toContain("revoke all");
    for (const field of ["created_by", "approved_by", "rejected_by", "rejection_feedback", "custom_fields"]) expect(sql).not.toContain(field);
    expect(sql).not.toMatch(/\b(insert|update|delete)\b/i);
  });
});
