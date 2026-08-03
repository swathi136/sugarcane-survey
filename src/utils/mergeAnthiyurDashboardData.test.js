import { describe, expect, it } from "vitest";
import { mergeAnthiyurDashboardData } from "./mergeAnthiyurDashboardData";
const a={location_id:"L003",plot_id:"P034",treatment_id:"T1"};
describe("Anthiyur merge", () => {
  it("preserves other locations and CSV while deduplicating source IDs", () => {
    const college={location_id:"L001"};const athani={location_id:"L002"};const csv=Array.from({length:5},(_,i)=>({...a,csv:i}));const one={...a,source:"supabase",source_row_id:"one"};const two={...a,source:"supabase",source_row_id:"two"};
    const result=mergeAnthiyurDashboardData({biometric:[college,athani,...csv],fertigation:[],plots:[1]},{biometric:[one,one,two],fertigation:[]});
    expect(result.data.biometric).toHaveLength(9);expect(result.data.biometric[0]).toBe(college);expect(result.data.biometric[1]).toBe(athani);expect(result.data.plots).toEqual([1]);expect(result.diagnostics.biometricDuplicateIds).toBe(1);
  });
  it("replaces one exact fertigation match", () => {
    const csv={...a,day_after_planting:30,date:"03.08.2026"};const approved={...a,day_after_planting:30,date:"2026-08-03T00:00:00Z",source:"supabase",source_row_id:"f1"};const result=mergeAnthiyurDashboardData({biometric:[],fertigation:[csv]},{biometric:[],fertigation:[approved,approved]});expect(result.data.fertigation).toEqual([approved]);expect(result.diagnostics.fertigationReplaced).toBe(1);
  });
  it("preserves ambiguous matches and appends unmatched rows", () => {
    const csv={...a,day_after_planting:30,date:"2026-08-03"};const approved={...csv,source:"supabase",source_row_id:"f2"};const unmatched={...a,day_after_planting:40,date:"2026-08-13",source:"supabase",source_row_id:"f3"};const result=mergeAnthiyurDashboardData({biometric:[],fertigation:[csv,{...csv}]},{biometric:[],fertigation:[approved,unmatched]});expect(result.data.fertigation).toHaveLength(4);expect(result.diagnostics.fertigationAmbiguous).toHaveLength(1);expect(result.diagnostics.fertigationAdded).toBe(2);
  });
});
