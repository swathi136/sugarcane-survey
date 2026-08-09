import { describe, expect, it } from "vitest";
import {
  HEATMAP_FERTILIZERS,
  HEATMAP_METRICS,
  buildDayMetricHeatmap,
  buildFertilizerMetricHeatmap,
  hasValidHeatmapCell,
  removeEmptyHeatmapColumns,
} from "./advancedComparisonHeatmap";
import { EMPTY_METRIC_MESSAGE } from "../components/AdvancedComparisonHeatmap";

const locations = [
  { location_id: "L001", location_name: "College" },
  { location_id: "L002", location_name: "Athani" },
];

const biometric = [
  { location_id: "L001", plot_id: "P1", observation_day: 30, plant_height_cm: 0, number_of_tillers: 2, number_of_nodes: null },
  { location_id: "L001", plot_id: "P1", observation_day: 60, plant_height_cm: 10, number_of_tillers: 4, number_of_nodes: 3 },
  { location_id: "L001", plot_id: "P1", observation_day: 60, plant_height_cm: 20, number_of_tillers: 6, number_of_nodes: 5 },
  { location_id: "L001", plot_id: "P2", observation_day: 60, plant_height_cm: 30, number_of_tillers: 8, number_of_nodes: null },
  { location_id: "L001", plot_id: "P3", observation_day: 60, plant_height_cm: 45, number_of_tillers: 10, number_of_nodes: 9 },
  { location_id: "L001", plot_id: "P1", observation_day: 90, plant_height_cm: null, number_of_tillers: 12, number_of_nodes: 11 },
  { location_id: "L002", plot_id: "P4", observation_day: 60, plant_height_cm: 100, number_of_tillers: 20, number_of_nodes: 15 },
];

const fertigation = [
  { location_id: "L001", plot_id: "P1", day_after_planting: 20, n_kg: 1, urea_kg: 3 },
  { location_id: "L001", plot_id: "P1", day_after_planting: 60, n_kg: 1, urea_kg: 2 },
  { location_id: "L001", plot_id: "P2", day_after_planting: 20, n_kg: 3, urea_kg: 3 },
  { location_id: "L001", plot_id: "P2", day_after_planting: 70, n_kg: 100, urea_kg: 100 },
  { location_id: "L001", plot_id: "P3", day_after_planting: 20, n_kg: 4, urea_kg: 1 },
  { location_id: "L002", plot_id: "P4", day_after_planting: 20, n_kg: 9, urea_kg: 9 },
];

describe("advanced comparison heatmap calculations", () => {
  it("exposes exactly the requested metric and fertilizer axes", () => {
    expect(HEATMAP_METRICS.map((item) => item.label)).toEqual([
      "Plant Height", "Tiller Count", "Leaf Count", "Leaf Length", "Leaf Breadth",
      "Node Count", "Node Length", "Millable Cane Count",
    ]);
    expect(HEATMAP_FERTILIZERS.map((item) => item.label)).toEqual([
      "N", "P₂O₅", "K₂O", "Urea", "DAP", "MAP", "SSP", "MOP", "White Potash",
    ]);
  });

  it("calculates fertilizer-to-metric relationships across plots using cumulative fertilizer up to the selected day", () => {
    const matrix = buildFertilizerMetricHeatmap({ biometricRows: biometric, fertigationRows: fertigation, locations, locationId: "L001", observationDay: "60" });
    const nitrogen = matrix.rows.find((row) => row.key === "n");
    const urea = matrix.rows.find((row) => row.key === "urea");
    expect(matrix.locationName).toBe("College");
    expect(matrix.day).toBe(60);
    expect(nitrogen.cells.plant_height).toEqual({ value: 1, count: 3 });
    expect(urea.cells.plant_height).toEqual({ value: -1, count: 3 });
  });

  it("does not use fertilizer applications after the selected day", () => {
    const matrix = buildFertilizerMetricHeatmap({ biometricRows: biometric, fertigationRows: fertigation, locations, locationId: "L001", observationDay: 60 });
    expect(matrix.rows.find((row) => row.key === "n").cells.plant_height.value).toBe(1);
  });

  it("keeps unsupported or insufficient fertilizer relationships null", () => {
    const matrix = buildFertilizerMetricHeatmap({ biometricRows: biometric, fertigationRows: fertigation, locations, locationId: "L001", observationDay: 60 });
    expect(matrix.rows.find((row) => row.key === "ssp").cells.plant_height).toBeNull();
    expect(matrix.rows.find((row) => row.key === "n").cells.leaves).toBeNull();
  });

  it("creates one row per available observation day inside the manual range", () => {
    const matrix = buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId: "L001", startDay: "30", endDay: "60" });
    expect(matrix.rows.map((row) => row.day)).toEqual([30, 60]);
    expect(matrix.rows[0].cells.plant_height).toEqual({ value: 0, count: 1 });
    expect(matrix.rows[1].cells.plant_height).toEqual({ value: 26.3, count: 4 });
  });

  it("preserves missing metric values as null and excludes other locations", () => {
    const matrix = buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId: "L001", startDay: 90, endDay: 90 });
    expect(matrix.rows).toHaveLength(1);
    expect(matrix.rows[0].cells.plant_height).toBeNull();
    expect(matrix.rows[0].cells.tillers).toEqual({ value: 12, count: 1 });
  });

  it("returns an empty matrix for incomplete or reversed manual ranges", () => {
    expect(buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId: "L001", startDay: "", endDay: 60 }).rows).toEqual([]);
    expect(buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId: "L001", startDay: 90, endDay: 30 }).rows).toEqual([]);
  });

  it("removes a metric column only when every cell is invalid", () => {
    const matrix = removeEmptyHeatmapColumns({
      columns: [{ key: "height" }, { key: "nodes" }],
      rows: [
        { cells: { height: { value: 10 }, nodes: null } },
        { cells: { height: { value: 20 }, nodes: { value: undefined } } },
      ],
      values: {},
    });
    expect(matrix.columns.map((column) => column.key)).toEqual(["height"]);
  });

  it("keeps a column containing a genuine zero", () => {
    const matrix = removeEmptyHeatmapColumns({
      columns: [{ key: "height" }],
      rows: [{ cells: { height: { value: 0 } } }],
      values: {},
    });
    expect(matrix.columns.map((column) => column.key)).toEqual(["height"]);
  });

  it.each([null, undefined, "", "   ", Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("treats %s as an invalid heatmap value", (value) => {
    expect(hasValidHeatmapCell({ value })).toBe(false);
  });

  it("applies empty-column filtering to fertilizer-vs-metric output", () => {
    const matrix = buildFertilizerMetricHeatmap({ biometricRows: biometric, fertigationRows: fertigation, locations, locationId: "L001", observationDay: 60 });
    expect(matrix.columns.some((column) => column.key === "plant_height")).toBe(true);
    expect(matrix.columns.some((column) => column.key === "leaves")).toBe(false);
  });

  it("applies empty-column filtering to day-vs-metric output", () => {
    const matrix = buildDayMetricHeatmap({ biometricRows: biometric, locations, locationId: "L001", startDay: 30, endDay: 30 });
    expect(matrix.columns.some((column) => column.key === "plant_height")).toBe(true);
    expect(matrix.columns.some((column) => column.key === "nodes")).toBe(false);
  });

  it("removes every column for an all-empty matrix and exposes the required empty-state text", () => {
    const matrix = removeEmptyHeatmapColumns({ columns: HEATMAP_METRICS, rows: [{ cells: {} }], values: {} });
    expect(matrix.columns).toEqual([]);
    expect(EMPTY_METRIC_MESSAGE).toBe("No valid metric data is available for the selected filters.");
  });
});
