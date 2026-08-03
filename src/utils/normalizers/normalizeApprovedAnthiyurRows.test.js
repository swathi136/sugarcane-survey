import { describe, expect, it } from "vitest";
import { normalizeApprovedAnthiyurRows } from "./normalizeApprovedAnthiyurRows";
const lookup = new Map([["PLOT A", { plot_id: "P034", plot_name: "Plot A", replication: null, treatment_id: "T1" }]]);
const base = { id:"an-1",status:"Approved",location_code:"L003",location_name:"Anthiyur",plot:"Plot A",treatment:"T1",treatment_name:"One",observation_day:240,date_of_obs:"2026-08-02",plant_height:0,tiller_count:2,leaf_count:3,leaf_height:30,leaf_breath:1.5,number_of_nodes:5,node_length:4,millable_cane_count_1m:7,plant_count_1m:8,fertigation_date:"2026-08-03",n_kg:0,p2o5_kg:2,k2o_kg:null,mn_mixture:1,urea_kg:null,map_kg:0,dap_kg:4,white_potash_kg:null };
describe("Approved Anthiyur normalization", () => {
  it("maps safe biometric and fertilizer fields, aliases, null and zero", () => {
    const result = normalizeApprovedAnthiyurRows([base], lookup);
    expect(result.biometric[0]).toMatchObject({ location_id:"L003",plot_id:"P034",plot_label:"Plot A",plant_height_cm:0,number_of_node:5,number_of_nodes:5,node_length_cm:4,millable_cane_count_1m:7,millable_cane_count:7,plant_count_1m:8 });
    expect(result.biometric[0]).not.toHaveProperty("plant_number");
    expect(result.fertigation[0]).toMatchObject({ n_kg:0,k2o_kg:null,map_kg:0,date:"2026-08-03" });
  });
  it("excludes wrong status, location, day and unknown plots", () => {
    const rows=[{...base,id:"p",status:"Pending"},{...base,id:"r",status:"Rejected"},{...base,id:"o",location_code:"L002"},{...base,id:"d",observation_day:2.5},{...base,id:"late",observation_day:241},{...base,id:"u",plot:"Plot Z"}];
    const result=normalizeApprovedAnthiyurRows(rows,lookup);
    expect(result.biometric).toHaveLength(0);
    expect(result.diagnostics.map((x)=>x.rowId)).toEqual(["o","d","late","u"]);
  });
  it("keeps valid metrics when optional fields are malformed", () => {
    const source={...base,plant_height:42,tiller_count:2.5,number_of_nodes:" ",node_length:-1,leaf_breath:"bad"};
    const result=normalizeApprovedAnthiyurRows([source],lookup);
    expect(result.biometric[0]).toMatchObject({plant_height_cm:42,number_of_tillers:null,number_of_nodes:null,node_length_cm:null,leaf_breadth_cm:null});
    expect(result.diagnostics).toHaveLength(3);
    expect(source.tiller_count).toBe(2.5);
  });
  it("validates dates at field level", () => {
    const result=normalizeApprovedAnthiyurRows([{...base,date_of_obs:"2026-02-30",fertigation_date:"bad"}],lookup);
    expect(result.biometric[0].date_of_observation).toBeNull();
    expect(result.fertigation[0].date).toBeNull();
  });
});
