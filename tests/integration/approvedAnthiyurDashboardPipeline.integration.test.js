import { describe, expect, it } from "vitest";
import { buildAnthiyurPlotLookup } from "../../src/utils/anthiyur/buildAnthiyurPlotLookup";
import { normalizeApprovedAnthiyurRows } from "../../src/utils/normalizers/normalizeApprovedAnthiyurRows";
import { mergeAnthiyurDashboardData } from "../../src/utils/mergeAnthiyurDashboardData";

describe("Approved Anthiyur dashboard pipeline", () => {
  it("moves one safe Approved RPC row into L003 inputs without changing other locations", () => {
    const plots=[{location_id:"L003",plot_id:"P034",plot_name:"Plot A",treatment_id:"T1"}];
    const rpcRow={id:"rpc-1",location_code:"L003",location_name:"Anthiyur",plot:"Plot A",treatment:"T1",observation_day:30,date_of_obs:"2026-08-02",plant_height:40,tiller_count:2,leaf_count:3,leaf_height:25,leaf_breath:1.5,fertigation_date:"2026-08-03",n_kg:1,status:"Approved",created_at:"2026-08-02T00:00:00Z"};
    expect(rpcRow).not.toHaveProperty("created_by");
    const normalized=normalizeApprovedAnthiyurRows([rpcRow],buildAnthiyurPlotLookup(plots));
    const college={location_id:"L001",source_row_id:"college"};const athani={location_id:"L002",source_row_id:"athani"};
    const merged=mergeAnthiyurDashboardData({biometric:[college,athani],fertigation:[],plots},normalized);
    expect(merged.data.biometric.filter((row)=>row.location_id==="L003")).toHaveLength(1);
    expect(merged.data.biometric[0]).toBe(college);expect(merged.data.biometric[1]).toBe(athani);
    const repeated=mergeAnthiyurDashboardData({biometric:[college,athani],fertigation:[],plots},{...normalized,biometric:[...normalized.biometric,...normalized.biometric]});
    expect(repeated.data.biometric.filter((row)=>row.location_id==="L003")).toHaveLength(1);
  });
});
