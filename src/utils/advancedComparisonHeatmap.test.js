import { describe, expect, it } from "vitest";
import {
  HEATMAP_FERTILIZERS,
  HEATMAP_METRICS,
  buildBiometricHeatmap,
  buildFertilizerHeatmap,
  buildTreatmentHeatmap,
} from "./advancedComparisonHeatmap";

const locations = [
  { location_id: "L001", location_name: "College" },
  { location_id: "L002", location_name: "Athani" },
];
const plots = [
  { location_id: "L001", plot_id: "P1", plot_name: "R1T1", treatment_id: "T1" },
  { location_id: "L002", plot_id: "P1", plot_name: "Plot A", treatment_id: "T2" },
];
const height = HEATMAP_METRICS.find((metric) => metric.field === "plant_height_cm");
const tillers = HEATMAP_METRICS.find((metric) => metric.field === "number_of_tillers");
const nitrogen = HEATMAP_FERTILIZERS.find((item) => item.field === "n_kg");
const urea = HEATMAP_FERTILIZERS.find((item) => item.field === "urea_kg");

const biometric = [
  { location_id: "L001", plot_id: "P1", treatment_id: "T1", observation_day: 30, plant_height_cm: 0, number_of_tillers: 4 },
  { location_id: "L001", plot_id: "P1", treatment_id: "T1", observation_day: 30, plant_height_cm: 10, number_of_tillers: 6 },
  { location_id: "L001", plot_id: "P1", treatment_id: "T1", observation_day: 60, plant_height_cm: null, number_of_tillers: 8 },
  { location_id: "L002", plot_id: "P1", treatment_id: "T2", observation_day: 60, plant_height_cm: 20, number_of_tillers: 10 },
];

describe("advanced comparison heatmap calculations", () => {
  it("creates location-plot rows without collisions and observation-day columns", () => {
    const matrix = buildBiometricHeatmap({ rows: biometric, plots, locations, metric: height });
    expect(matrix.rows.map((row) => row.key)).toEqual(["L001|P1", "L002|P1"]);
    expect(matrix.days).toEqual([30, 60]);
    expect(matrix.rows[0].plotLabel).toBe("R1T1");
    expect(matrix.rows[1].plotLabel).toBe("Plot A");
  });

  it("uses the arithmetic mean, keeps genuine zero valid, and leaves missing values empty", () => {
    const matrix = buildBiometricHeatmap({ rows: biometric, plots, locations, metric: height });
    expect(matrix.rows[0].cells[30]).toEqual({ value: 5, count: 2 });
    expect(matrix.rows[0].cells[60]).toBeNull();
    const zeroOnly = buildBiometricHeatmap({ rows: [biometric[0]], plots, locations, metric: height });
    expect(zeroOnly.rows[0].cells[30]).toEqual({ value: 0, count: 1 });
  });

  it("updates cell values when the metric changes", () => {
    const matrix = buildBiometricHeatmap({ rows: biometric, plots, locations, metric: tillers });
    expect(matrix.rows[0].cells[30]).toEqual({ value: 5, count: 2 });
    expect(matrix.rows[0].cells[60]).toEqual({ value: 8, count: 1 });
  });

  it("updates columns when the day range changes", () => {
    const matrix = buildBiometricHeatmap({ rows: biometric, plots, locations, metric: height, startDay: "60", endDay: "60" });
    expect(matrix.days).toEqual([60]);
  });

  it("sums fertilizer applied on each day and updates when fertilizer changes", () => {
    const rows = [
      { location_id: "L001", plot_id: "P1", day_after_planting: 20, n_kg: 2, urea_kg: 5 },
      { location_id: "L001", plot_id: "P1", day_after_planting: 20, n_kg: 3, urea_kg: null },
      { location_id: "L001", plot_id: "P1", day_after_planting: 40, n_kg: null, urea_kg: 7 },
    ];
    const nMatrix = buildFertilizerHeatmap({ rows, plots, locations, fertilizer: nitrogen });
    const ureaMatrix = buildFertilizerHeatmap({ rows, plots, locations, fertilizer: urea });
    expect(nMatrix.days).toEqual([20, 40]);
    expect(nMatrix.rows[0].cells[20]).toEqual({ value: 5, count: 2 });
    expect(nMatrix.rows[0].cells[40]).toBeNull();
    expect(ureaMatrix.rows[0].cells[20]).toEqual({ value: 5, count: 1 });
    expect(ureaMatrix.rows[0].cells[40]).toEqual({ value: 7, count: 1 });
  });

  it("creates treatment rows for the selected location", () => {
    const matrix = buildTreatmentHeatmap({ rows: biometric, locations, metric: tillers, locationId: "L001" });
    expect(matrix.rows.map((row) => row.key)).toEqual(["L001|T1"]);
    expect(matrix.days).toEqual([30, 60]);
    expect(matrix.rows[0].cells[60].value).toBe(8);
  });

  it("recalculates from updated Supabase-backed props", () => {
    const before = buildBiometricHeatmap({ rows: biometric, plots, locations, metric: height });
    const afterRows = biometric.map((row, index) => index === 3 ? { ...row, plant_height_cm: 35 } : row);
    const after = buildBiometricHeatmap({ rows: afterRows, plots, locations, metric: height });
    expect(before.rows[1].cells[60].value).toBe(20);
    expect(after.rows[1].cells[60].value).toBe(35);
  });
});
