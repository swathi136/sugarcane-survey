import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AdvancedComparison from "./AdvancedComparison";
import {
  getActiveComparisonPairs,
  getComparisonPlotOptions,
  getDerivedTreatment,
  isDuplicateComparisonPair,
} from "../utils/advancedComparisonSelection";

const first = { locationId: "L001", plotId: "P001" };
const second = { locationId: "L002", plotId: "P029" };
const third = { locationId: "L003", plotId: "P034" };
const empty = { locationId: "", plotId: "" };

describe("Advanced Comparison pair behavior", () => {
  it("renders Comparisons 1 and 2 while Comparison 3 starts hidden", () => {
    const markup = renderToStaticMarkup(<AdvancedComparison data={{ comparisonBiometric: [], comparisonFertigation: [], plots: [], locations: [] }} />);
    expect(markup).toContain("Comparison 1");
    expect(markup).toContain("Comparison 2");
    expect(markup).not.toContain(">Comparison 3<");
    expect(markup).toContain("+ Add third comparison");
    expect(markup).not.toContain("Comparison 4");
  });

  it("supports exactly two active pairs before enabling the third", () => {
    expect(getActiveComparisonPairs(first, second, empty, false)).toEqual([first, second]);
  });

  it("supports exactly three active pairs when the third is enabled", () => {
    expect(getActiveComparisonPairs(first, second, third, true)).toEqual([first, second, third]);
  });

  it("removes the third bar and line source immediately when disabled", () => {
    const enabled = getActiveComparisonPairs(first, second, third, true);
    const disabled = getActiveComparisonPairs(first, second, empty, false);
    expect(enabled).toHaveLength(3);
    expect(disabled).toHaveLength(2);
    expect(disabled).toEqual([first, second]);
  });

  it("rejects only duplicate canonical location and plot pairs", () => {
    expect(isDuplicateComparisonPair([first, second], 1, first)).toBe(true);
    expect(isDuplicateComparisonPair([first, second], 1, { locationId: "L002", plotId: "P001" })).toBe(false);
  });

  it("filters plots by the selected location", () => {
    const plots = [
      { location_id: "L001", plot_id: "P001", plot_name: "R1T1" },
      { location_id: "L002", plot_id: "P029", plot_name: "Plot A" },
    ];
    expect(getComparisonPlotOptions(plots, "L002").map((plot) => plot.plot_id)).toEqual(["P029"]);
  });

  it("derives treatment from the canonical plot master mapping", () => {
    const plotMap = new Map([["L001|P001", { treatment_id: "T1" }]]);
    expect(getDerivedTreatment(plotMap, first)).toBe("T1");
    expect(getDerivedTreatment(plotMap, { locationId: "L001", plotId: "UNKNOWN" })).toBeNull();
  });
});
