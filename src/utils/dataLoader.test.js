import { describe, expect, it } from "vitest";
import {
  normalizeDashboardBiometricRows,
  normalizeDashboardFertigationRows,
} from "./dataLoader";

describe("Supabase dashboard row normalization", () => {
  it("normalizes biometric numerics while preserving null and source identity", () => {
    const [row] = normalizeDashboardBiometricRows([{
      location_id: "L001",
      observation_day: "30",
      plant_height_cm: "0",
      number_of_tillers: null,
      leaf_length_cm: "",
      date_of_observation: "2026-08-08",
      source_type: "supabase",
    }]);
    expect(row).toMatchObject({
      location_id: "L001",
      observation_day: 30,
      plant_height_cm: 0,
      number_of_tillers: null,
      leaf_length_cm: null,
      date_of_observation: "2026-08-08",
      source: "supabase",
    });
  });

  it("normalizes fertilizer quantities without converting missing values to zero", () => {
    const [row] = normalizeDashboardFertigationRows([{
      day_after_planting: "40",
      n_kg: "12.5",
      p2o5_kg: null,
      k2o_kg: "",
      source_type: "csv",
    }]);
    expect(row).toMatchObject({
      day_after_planting: 40,
      n_kg: 12.5,
      p2o5_kg: null,
      k2o_kg: null,
      source: "csv",
    });
  });
});
