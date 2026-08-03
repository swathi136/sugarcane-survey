import { describe, expect, it } from "vitest";
import { compareDashboardCalculationParity } from "./compareDashboardCalculationParity";

describe("dashboard server parity", () => {
  it("reports matching component results", () => {
    const results = { overview: { totalPlots: 5, avgPlantHeight: 10 }, fertigationTracking: { totals: { nKg: 4 } }, treatmentComparison: { bestTreatment: "T1" } };
    expect(compareDashboardCalculationParity([{ locationId: "L002", results }], { L002: results })).toEqual([
      { locationId: "L002", matches: true, differences: [] },
    ]);
  });

  it("reports exact differences instead of allowing an unsafe cutover", () => {
    const client = { overview: { totalPlots: 5 }, fertigationTracking: { totals: {} }, treatmentComparison: {} };
    const server = { overview: { totalPlots: 4 }, fertigationTracking: { totals: {} }, treatmentComparison: {} };
    const [result] = compareDashboardCalculationParity([{ locationId: "L002", results: client }], { L002: server });
    expect(result.matches).toBe(false);
    expect(result.differences).toContain("overview.totalPlots: 5 != 4");
  });
});
