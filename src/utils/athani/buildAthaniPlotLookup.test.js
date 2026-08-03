import { describe, expect, it } from "vitest";
import { buildAthaniPlotLookup } from "./buildAthaniPlotLookup";

const plots = [
  ["P029", "Plot A", "T1"], ["P030", "Plot B", "T2"], ["P031", "Plot C", "T3"],
  ["P032", "Plot D", "T4"], ["P033", "Plot E", "T5"],
].map(([plot_id, plot_name, treatment_id]) => ({ location_id: "L002", plot_id, plot_name, treatment_id }));

describe("Athani plot lookup", () => {
  it("maps every canonical Athani plot and ignores other locations", () => {
    const lookup = buildAthaniPlotLookup([...plots, { location_id: "L003", plot_id: "P034", plot_name: "Plot A" }]);
    expect([...lookup.keys()]).toEqual(["PLOT A", "PLOT B", "PLOT C", "PLOT D", "PLOT E"]);
    expect(lookup.get("PLOT A")).toMatchObject({ plot_id: "P029", treatment_id: "T1" });
    expect(lookup.get("PLOT E")).toMatchObject({ plot_id: "P033", treatment_id: "T5" });
    expect(lookup.get("UNKNOWN")).toBeUndefined();
  });
});
