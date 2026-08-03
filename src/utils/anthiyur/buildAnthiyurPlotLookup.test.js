import { describe, expect, it } from "vitest";
import { buildAnthiyurPlotLookup } from "./buildAnthiyurPlotLookup";
const plots = [["P034","Plot A","T1"],["P035","Plot B","T2"],["P036","Plot C","T3"],["P037","Plot D","T4"],["P038","Plot E","T5"]]
  .map(([plot_id, plot_name, treatment_id]) => ({ location_id: "L003", plot_id, plot_name, treatment_id }));
describe("Anthiyur plot lookup", () => {
  it("maps every known L003 plot without guessing", () => {
    const lookup = buildAnthiyurPlotLookup([...plots, { location_id: "L002", plot_id: "P029", plot_name: "Plot A" }]);
    expect([...lookup.keys()]).toEqual(["PLOT A","PLOT B","PLOT C","PLOT D","PLOT E"]);
    expect(lookup.get("PLOT A")).toMatchObject({ plot_id: "P034", treatment_id: "T1" });
    expect(lookup.get("PLOT E")).toMatchObject({ plot_id: "P038", treatment_id: "T5" });
    expect(lookup.get("UNKNOWN")).toBeUndefined();
  });
});
