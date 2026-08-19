import { describe, expect, it } from "vitest";
import { normalizeApprovedAthaniRows } from "./normalizeApprovedAthaniRows";

const lookup = new Map([["PLOT A", { plot_id: "P029", plot_name: "Plot A", replication: null, treatment_id: "T1" }]]);
const base = {
  id: "athani-1", status: "Approved", location_code: "L002", location_name: "Athani",
  plot: "Plot A", treatment: "T1", treatment_name: "Treatment one", observation_day: 30,
  date_of_obs: "2026-08-02", plant_num: 1, plant_height: 0, tiller_count: 2,
  leaf_count: 3, leaf_height: 21.5, leaf_breath: 1.2, fertigation_date: "2026-08-03",
  n_kg: 0, p2o5_kg: 2, k2o_kg: null, mn_mixture: 1, urea_kg: null,
  map_kg: 0, dap_kg: 4, white_potash_kg: null,
};

describe("approved Athani normalization", () => {
  it("maps biometric, fertilizer, provenance, plot identity, null and zero correctly", () => {
    const result = normalizeApprovedAthaniRows([base], lookup);
    expect(result.biometric[0]).toMatchObject({
      source_row_id: "athani-1", source_table: "athani_field_entries", location_id: "L002",
      plot_id: "P029", plot_label: "Plot A", plant_height_cm: 0,
      leaf_length_cm: 21.5, leaf_breadth_cm: 1.2,
    });
    expect(result.fertigation[0]).toMatchObject({ n_kg: 0, k2o_kg: null, map_kg: 0, date: "2026-08-03" });
  });

  it("excludes Pending, Rejected, non-L002, invalid day, and unknown plot records", () => {
    const rows = [
      { ...base, id: "pending", status: "Pending" }, { ...base, id: "rejected", status: "Rejected" },
      { ...base, id: "other", location_code: "L001" }, { ...base, id: "decimal-day", observation_day: 30.5 },
      { ...base, id: "late", observation_day: 241 }, { ...base, id: "unknown", plot: "Plot Z" },
    ];
    const result = normalizeApprovedAthaniRows(rows, lookup);
    expect(result.biometric).toHaveLength(0);
    expect(result.diagnostics.map((item) => item.rowId)).toEqual(["other", "decimal-day", "late", "unknown"]);
  });

  it("rejects invalid optional fields without discarding valid metrics", () => {
    const source = { ...base, tiller_count: 2.5, leaf_count: " ", leaf_height: -1, leaf_breath: "bad", plant_height: 45 };
    const result = normalizeApprovedAthaniRows([source], lookup);
    expect(result.biometric[0]).toMatchObject({ plant_height_cm: 45, number_of_tillers: null, number_of_leaves: null, leaf_length_cm: null, leaf_breadth_cm: null });
    expect(result.diagnostics).toHaveLength(3);
    expect(source.tiller_count).toBe(2.5);
  });

  it("diagnoses invalid dates at field level", () => {
    const result = normalizeApprovedAthaniRows([{ ...base, date_of_obs: "2026-02-30", fertigation_date: "bad" }], lookup);
    expect(result.biometric[0].date_of_observation).toBeNull();
    expect(result.fertigation[0].date).toBeNull();
    expect(result.diagnostics.map((item) => item.field)).toEqual(["date_of_obs", "fertigation_date"]);
  });
});
