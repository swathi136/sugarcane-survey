import fs from "node:fs";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { supabase } from "../../src/utils/supabaseClient";
import { buildCollegePlotLookup } from "../../src/utils/college/buildCollegePlotLookup";
import { buildAthaniPlotLookup } from "../../src/utils/athani/buildAthaniPlotLookup";
import { buildAnthiyurPlotLookup } from "../../src/utils/anthiyur/buildAnthiyurPlotLookup";
import { normalizeApprovedCollegeRows } from "../../src/utils/normalizers/normalizeApprovedCollegeRows";
import { normalizeApprovedAthaniRows } from "../../src/utils/normalizers/normalizeApprovedAthaniRows";
import { normalizeApprovedAnthiyurRows } from "../../src/utils/normalizers/normalizeApprovedAnthiyurRows";
import { mergeCollegeDashboardData } from "../../src/utils/mergeCollegeDashboardData";
import { mergeAthaniDashboardData } from "../../src/utils/mergeAthaniDashboardData";
import { mergeAnthiyurDashboardData } from "../../src/utils/mergeAnthiyurDashboardData";
import { buildDashboardCalculationSnapshots } from "../../src/utils/buildDashboardCalculationSnapshots";
import { compareDashboardCalculationParity } from "../../src/utils/compareDashboardCalculationParity";

const runRemote = process.env.RUN_REMOTE_DASHBOARD_PARITY === "true";
const readCsv = (name) => Papa.parse(
  fs.readFileSync(new URL(`../../public/data/${name}`, import.meta.url), "utf8"),
  { header: true, dynamicTyping: true, skipEmptyLines: true },
).data;

describe.skipIf(!runRemote)("server dashboard calculation parity", () => {
  it("matches the existing CSV plus approved-row browser pipeline", async () => {
    let dashboard = {
      biometric: readCsv("biometric_observations.csv"),
      fertigation: readCsv("fertigation_schedule.csv"),
      plots: readCsv("plot_master.csv"),
      locations: readCsv("location_master.csv"),
      treatments: readCsv("treatment_reference.csv"),
      cropStageSplit: readCsv("crop_stage_split_dose.csv"),
      fertilizerStock: readCsv("fertilizer_stock.csv"),
      fertigationSummary: readCsv("fertigation_plot_summary.csv"),
    };
    const [college, athani, anthiyur, server] = await Promise.all([
      supabase.from("field_entries").select("*").eq("status", "Approved"),
      supabase.from("athani_field_entries").select("*").eq("status", "Approved"),
      supabase.rpc("get_approved_anthiyur_dashboard_data"),
      supabase.from("dashboard_current_results").select("location_id,results"),
    ]);
    [college, athani, anthiyur, server].forEach(({ error }) => expect(error).toBeNull());

    dashboard = mergeCollegeDashboardData(dashboard, normalizeApprovedCollegeRows(college.data, buildCollegePlotLookup(dashboard.plots))).data;
    dashboard = mergeAthaniDashboardData(dashboard, normalizeApprovedAthaniRows(athani.data, buildAthaniPlotLookup(dashboard.plots))).data;
    dashboard = mergeAnthiyurDashboardData(dashboard, normalizeApprovedAnthiyurRows(anthiyur.data, buildAnthiyurPlotLookup(dashboard.plots))).data;

    const serverByLocation = Object.fromEntries(server.data.map((row) => [row.location_id, row.results]));
    const parity = compareDashboardCalculationParity(buildDashboardCalculationSnapshots(dashboard), serverByLocation);
    expect(parity).toEqual(parity.map((row) => ({ ...row, matches: true, differences: [] })));
  }, 30000);
});
