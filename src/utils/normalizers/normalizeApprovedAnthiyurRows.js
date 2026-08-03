import { toFiniteMetricOrNull, toIntegerMetricOrNull } from "../metrics/toFiniteMetricOrNull";

const LOCATION_ID = "L003";
const INTEGER_FIELDS = new Set(["tiller_count", "leaf_count", "number_of_nodes", "millable_cane_count_1m", "plant_count_1m"]);
const BIOMETRIC_FIELDS = ["plant_height", "tiller_count", "leaf_count", "leaf_height", "leaf_breath", "number_of_nodes", "node_length", "millable_cane_count_1m", "plant_count_1m"];
const FERTIGATION_FIELDS = ["n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea_kg", "map_kg", "dap_kg", "white_potash_kg"];
const NUMERIC_FIELDS = [...BIOMETRIC_FIELDS, ...FERTIGATION_FIELDS];

function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function dateOrNull(value) {
  const text = textOrNull(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
}

function addDiagnostic(list, rowId, field, reason, category) {
  list.push({ rowId, field, reason, category });
}

function normalizeField(row, field, diagnostics) {
  const raw = row[field];
  const value = INTEGER_FIELDS.has(field) ? toIntegerMetricOrNull(raw) : toFiniteMetricOrNull(raw);
  const category = BIOMETRIC_FIELDS.includes(field) ? "biometric" : "fertigation";
  if (value === null) {
    if (raw !== null && raw !== undefined && String(raw).trim() !== "") {
      addDiagnostic(diagnostics, row.id, field, INTEGER_FIELDS.has(field) ? "invalid integer" : "invalid finite number", category);
    }
    return null;
  }
  if (value < 0) {
    addDiagnostic(diagnostics, row.id, field, "negative value excluded", category);
    return null;
  }
  return value;
}

export function normalizeApprovedAnthiyurRows(rows, plotLookup = new Map()) {
  const biometric = [];
  const fertigation = [];
  const diagnostics = [];

  (rows || []).forEach((row) => {
    if (row.status !== "Approved") return;
    if (textOrNull(row.location_code) !== LOCATION_ID) {
      addDiagnostic(diagnostics, row.id, "location_code", "non-Anthiyur row excluded", "record");
      return;
    }
    const sourcePlot = textOrNull(row.plot);
    const treatmentId = textOrNull(row.treatment);
    const mapping = sourcePlot ? plotLookup.get(sourcePlot.toUpperCase()) : null;
    if (!sourcePlot || !treatmentId) {
      addDiagnostic(diagnostics, row.id, !sourcePlot ? "plot" : "treatment", "required identifier missing", "record");
      return;
    }
    if (!mapping?.plot_id) {
      addDiagnostic(diagnostics, row.id, "plot", `unknown Anthiyur plot mapping: ${sourcePlot}`, "record");
      return;
    }
    const observationDay = toIntegerMetricOrNull(row.observation_day);
    if (observationDay === null || observationDay < 1 || observationDay > 240) {
      addDiagnostic(diagnostics, row.id, "observation_day", "invalid Anthiyur observation day", "record");
      return;
    }
    const observationDate = dateOrNull(row.date_of_obs);
    const fertigationDate = dateOrNull(row.fertigation_date);
    if (row.date_of_obs && !observationDate) addDiagnostic(diagnostics, row.id, "date_of_obs", "invalid date", "biometric");
    if (row.fertigation_date && !fertigationDate) addDiagnostic(diagnostics, row.id, "fertigation_date", "invalid date", "fertigation");

    const values = Object.fromEntries(NUMERIC_FIELDS.map((field) => [field, normalizeField(row, field, diagnostics)]));
    const provenance = {
      supabase_id: row.id, source_row_id: row.id, source: "supabase",
      source_table: "anthiyur_field_entries", status: row.status,
      location_id: LOCATION_ID, location_name: textOrNull(row.location_name) || "Anthiyur",
      plot_id: mapping.plot_id, plot_label: sourcePlot, source_plot: sourcePlot,
      replication: mapping.replication, treatment_id: treatmentId,
      treatment_name: textOrNull(row.treatment_name),
    };

    if (BIOMETRIC_FIELDS.some((field) => values[field] !== null)) {
      biometric.push({
        ...provenance, observation_day: observationDay, date_of_observation: observationDate,
        plant_height_cm: values.plant_height, number_of_tillers: values.tiller_count,
        number_of_leaves: values.leaf_count, leaf_length_cm: values.leaf_height,
        leaf_breadth_cm: values.leaf_breath, number_of_node: values.number_of_nodes,
        number_of_nodes: values.number_of_nodes, node_length_cm: values.node_length,
        millable_cane_count_1m: values.millable_cane_count_1m,
        millable_cane_count: values.millable_cane_count_1m,
        plant_count_1m: values.plant_count_1m,
        source_file: "Supabase anthiyur_field_entries", source_sheet: "Approved Anthiyur Entry",
      });
    }
    if (FERTIGATION_FIELDS.some((field) => values[field] !== null)) {
      fertigation.push({
        ...provenance, day_after_planting: observationDay, observation_day: observationDay,
        date: fertigationDate, fertigation_date: fertigationDate,
        n_kg: values.n_kg, p2o5_kg: values.p2o5_kg, k2o_kg: values.k2o_kg,
        mn_mixture_kg: values.mn_mixture, urea_kg: values.urea_kg,
        map_kg: values.map_kg, dap_kg: values.dap_kg,
        white_potash_kg: values.white_potash_kg,
      });
    }
  });
  return { biometric, fertigation, diagnostics };
}
