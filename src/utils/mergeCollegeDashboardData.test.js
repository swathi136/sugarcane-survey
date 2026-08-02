import { describe, expect, it } from "vitest";
import { mergeCollegeDashboardData } from "./mergeCollegeDashboardData";

const base = { location_id: "L001", plot_id: "P001", treatment_id: "T1" };

describe("College dashboard merge", () => {
  it("keeps all five CSV biometric plants and appends a Supabase row once", () => {
    const csvRows = Array.from({ length: 5 }, (_, index) => ({ ...base, observation_day: 30, csvPlant: index + 1 }));
    const approved = { ...base, observation_day: 30, source: "supabase", source_row_id: "db-1" };
    const result = mergeCollegeDashboardData(
      { biometric: csvRows, fertigation: [] },
      { biometric: [approved, approved], fertigation: [] },
    );
    expect(result.data.biometric).toHaveLength(6);
    expect(result.diagnostics.biometric.duplicateCount).toBe(1);
  });

  it("replaces only one exact fertigation row after date canonicalization", () => {
    const csv = { ...base, day_after_planting: 30, date: "02.08.2026" };
    const approved = { ...base, day_after_planting: 30, date: "2026-08-02T00:00:00Z", source: "supabase", source_row_id: "db-2" };
    const result = mergeCollegeDashboardData(
      { biometric: [], fertigation: [csv] },
      { biometric: [], fertigation: [approved] },
    );
    expect(result.data.fertigation).toEqual([approved]);
    expect(result.diagnostics.fertigation.duplicateCount).toBe(1);
  });

  it("does not delete ambiguous fertigation CSV rows", () => {
    const csv = { ...base, day_after_planting: 30, date: "2026-08-02" };
    const approved = { ...csv, source: "supabase", source_row_id: "db-3" };
    const result = mergeCollegeDashboardData(
      { biometric: [], fertigation: [csv, { ...csv }] },
      { biometric: [], fertigation: [approved] },
    );
    expect(result.data.fertigation).toHaveLength(3);
    expect(result.diagnostics.fertigation.ambiguousKeys).toHaveLength(1);
  });
});
