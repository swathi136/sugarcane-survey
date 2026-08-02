import { describe, expect, it } from "vitest";
import { normalizeApprovedCollegeRows } from "./normalizeApprovedCollegeRows";

const lookup = new Map([["R1T1", {
  plot_id: "P001", plot_name: "R1T1", replication: "R1", treatment_id: "T1",
}]]);

function row(overrides = {}) {
  return {
    id: "entry-1", status: "Approved", location_code: "L001", location_name: "College",
    plot: "R1T1", treatment: "T1", observation_day: 241,
    observation_date: "2026-08-02", plant_number: 1, plant_height: 0,
    ...overrides,
  };
}

describe("approved College normalization", () => {
  it("uses canonical plot identity and preserves future integer days and zero", () => {
    const result = normalizeApprovedCollegeRows([row()], lookup);
    expect(result.biometric).toHaveLength(1);
    expect(result.biometric[0]).toMatchObject({
      plot_id: "P001", plot_label: "R1T1", replication: "R1",
      observation_day: 241, plant_height_cm: 0, source_row_id: "entry-1",
    });
  });

  it("excludes non-approved, non-College, decimal-day, and unknown-plot rows", () => {
    const result = normalizeApprovedCollegeRows([
      row({ id: "pending", status: "Pending" }),
      row({ id: "other", location_code: "L002" }),
      row({ id: "decimal", observation_day: 12.5 }),
      row({ id: "unknown", plot: "R9T9" }),
    ], lookup);
    expect(result.biometric).toHaveLength(0);
    expect(result.diagnostics.map((item) => item.rowId)).toEqual(["other", "decimal", "unknown"]);
  });
});
