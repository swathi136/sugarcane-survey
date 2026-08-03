import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const root = process.cwd();
const dataDir = path.join(root, "public", "data");
const output = path.join(root, "supabase", "migrations", "20260803111000_import_dashboard_csv_baseline.sql");

const text = (value) => value === null || value === undefined || String(value).trim() === ""
  ? "null"
  : `'${String(value).replaceAll("'", "''")}'`;
const number = (value) => value === null || value === undefined || String(value).trim() === "" || !Number.isFinite(Number(value))
  ? "null"
  : String(Number(value));
const date = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return "null";
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return text(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const dotted = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return dotted ? text(`${dotted[3]}-${dotted[2]}-${dotted[1]}`) : "null";
};

function read(name) {
  const csv = fs.readFileSync(path.join(dataDir, name), "utf8");
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(`${name}: ${parsed.errors[0].message}`);
  return parsed.data;
}

function batchedInsert(table, columns, rows, valueBuilder, conflict, batchSize = 250) {
  const statements = [];
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    statements.push(`insert into public.${table} (${columns.join(", ")}) values\n${batch.map((row, offset) => `  (${valueBuilder(row, start + offset).join(", ")})`).join(",\n")}\non conflict ${conflict} do update set ${columns.filter((column) => !conflict.includes(column)).map((column) => `${column} = excluded.${column}`).join(", ")};`);
  }
  return statements.join("\n\n");
}

const biometric = read("biometric_observations.csv");
const fertigation = read("fertigation_schedule.csv");
const locations = read("location_master.csv");
const plots = read("plot_master.csv");
const treatments = read("treatment_reference.csv");
const stages = read("crop_stage_split_dose.csv");
const stock = read("fertilizer_stock.csv");

const sections = [
  "-- Generated from the committed public/data CSV baseline. Idempotent by stable source/master keys.",
  batchedInsert("dashboard_biometric_baseline", ["source_key", "location_id", "plot_id", "treatment_id", "replication", "plot_label", "observation_day", "date_of_observation", "plant_count_1m", "plant_count_5m", "plant_count_15m", "number_of_node", "node_length_cm", "millable_cane_count", "cane_girth_cm", "number_of_tillers", "number_of_leaves", "plant_height_cm", "leaf_length_cm", "leaf_breadth_cm", "germination_pct", "source_file", "source_sheet"], biometric, (r, index) => [text(`biometric_observations.csv:${index + 2}`), text(r.location_id), text(r.plot_id), text(r.treatment_id), text(r.replication), text(r.plot_label), number(r.observation_day), date(r.date_of_observation), number(r.plant_count_1m), number(r.plant_count_5m), number(r.plant_count_15m), number(r.number_of_node), number(r.node_length_cm), number(r.millable_cane_count), number(r.cane_girth_cm), number(r.number_of_tillers), number(r.number_of_leaves), number(r.plant_height_cm), number(r.leaf_length_cm), number(r.leaf_breadth_cm), number(r.germination_pct), text(r.source_file), text(r.source_sheet)], "(source_key)"),
  batchedInsert("dashboard_fertigation_baseline", ["source_key", "day_after_planting", "date", "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture_kg", "urea_kg", "map_kg", "dap_kg", "white_potash_kg", "location_id", "plot_id", "treatment_id"], fertigation, (r, index) => [text(`fertigation_schedule.csv:${index + 2}`), number(r.day_after_planting), date(r.date), number(r.n_kg), number(r.p2o5_kg), number(r.k2o_kg), number(r.mn_mixture_kg), number(r.urea_kg), number(r.map_kg), number(r.dap_kg), number(r.white_potash_kg), text(r.location_id), text(r.plot_id), text(r.treatment_id)], "(source_key)"),
  batchedInsert("dashboard_location_master", ["location_id", "location_name", "location_short_name", "plot_type", "farmer_name", "village", "variety"], locations, (r) => [text(r.location_id), text(r.location_name), text(r.location_short_name), text(r.plot_type), text(r.farmer_name), text(r.village), text(r.variety)], "(location_id)"),
  batchedInsert("dashboard_plot_master", ["plot_id", "location_id", "plot_name", "replication", "treatment_id", "extent_acre"], plots, (r) => [text(r.plot_id), text(r.location_id), text(r.plot_name), text(r.replication), text(r.treatment_id), number(r.extent_acre)], "(plot_id)"),
  batchedInsert("dashboard_treatment_master", ["location_id", "treatment_id", "plot_label", "treatment_details"], treatments, (r) => [text(r.location_id), text(r.treatment_id), text(r.plot_label), text(r.treatment_details)], "(location_id, treatment_id)"),
  batchedInsert("dashboard_crop_stage_split", ["location_id", "crop_stage", "days_after_planting", "n_pct", "p_pct", "k_pct"], stages, (r) => [text(r.location_id), text(r.crop_stage), text(r.days_after_planting), number(r.n_pct), number(r.p_pct), number(r.k_pct)], "(location_id, crop_stage)"),
  batchedInsert("dashboard_fertilizer_stock", ["location_id", "fertilizer", "total_kg", "available_bags"], stock, (r) => [text(r.location_id), text(r.fertilizer), number(r.total_kg), number(r.available_bags)], "(location_id, fertilizer)"),
];

fs.writeFileSync(output, `${sections.join("\n\n")}\n`, "utf8");
console.log(JSON.stringify({ output, biometric: biometric.length, fertigation: fertigation.length, locations: locations.length, plots: plots.length, treatments: treatments.length, stages: stages.length, stock: stock.length }));
