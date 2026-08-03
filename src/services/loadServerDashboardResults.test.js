import { describe, expect, it } from "vitest";
import { adaptResult } from "./loadServerDashboardResults";

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
