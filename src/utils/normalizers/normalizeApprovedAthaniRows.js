import { toFiniteMetricOrNull, toIntegerMetricOrNull } from "../metrics/toFiniteMetricOrNull";

const ATHANI_LOCATION_ID = "L002";
const MIN_OBSERVATION_DAY = 1;
const MAX_OBSERVATION_DAY = 240;

const INTEGER_FIELDS = new Set(["tiller_count", "leaf_count"]);
const BIOMETRIC_FIELDS = [
  "plant_height", "tiller_count", "leaf_count", "leaf_height", "leaf_breath",
];
const FERTIGATION_FIELDS = [
  "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea_kg", "map_kg", "dap_kg",
  "white_potash_kg",
];
const NUMERIC_FIELDS = [...BIOMETRIC_FIELDS, ...FERTIGATION_FIELDS];

function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function validDateOrNull(value) {
  const text = textOrNull(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
}

function diagnostic(diagnostics, rowId, field, reason, category) {
  diagnostics.push({ rowId, field, reason, category });
}

function normalizeField(row, field, diagnostics) {
  const raw = row[field];
  const value = INTEGER_FIELDS.has(field)
    ? toIntegerMetricOrNull(raw)
    : toFiniteMetricOrNull(raw);

  if (value === null) {
    if (raw !== null && raw !== undefined && String(raw).trim() !== "") {
      diagnostic(
        diagnostics,
        row.id,
        field,
        INTEGER_FIELDS.has(field) ? "invalid integer" : "invalid finite number",
        BIOMETRIC_FIELDS.includes(field) ? "biometric" : "fertigation",
      );
    }
    return null;
  }
  if (value < 0) {
    diagnostic(diagnostics, row.id, field, "negative or out-of-range value excluded", BIOMETRIC_FIELDS.includes(field) ? "biometric" : "fertigation");
    return null;
  }
  return value;
}

export function normalizeApprovedAthaniRows(rows, plotLookup = new Map()) {
  const biometric = [];
  const fertigation = [];
  const diagnostics = [];

  (rows || []).forEach((row) => {
    if (row.status !== "Approved") return;
    if (textOrNull(row.location_code) !== ATHANI_LOCATION_ID) {
      diagnostic(diagnostics, row.id, "location_code", "non-Athani row excluded", "record");
      return;
    }

    const sourcePlot = textOrNull(row.plot);
    const treatmentId = textOrNull(row.treatment);
    const plotMapping = sourcePlot ? plotLookup.get(sourcePlot.toUpperCase()) : null;
    if (!sourcePlot || !treatmentId) {
      diagnostic(diagnostics, row.id, !sourcePlot ? "plot" : "treatment", "required identifier missing", "record");
      return;
    }
    if (!plotMapping?.plot_id) {
      diagnostic(diagnostics, row.id, "plot", `unknown Athani plot mapping: ${sourcePlot}`, "record");
      return;
    }

    const observationDay = toIntegerMetricOrNull(row.observation_day);
    if (observationDay === null || observationDay < MIN_OBSERVATION_DAY || observationDay > MAX_OBSERVATION_DAY) {
      diagnostic(diagnostics, row.id, "observation_day", "invalid Athani observation day", "record");
      return;
    }

    const observationDate = validDateOrNull(row.date_of_obs);
    const fertigationDate = validDateOrNull(row.fertigation_date);
    if (row.date_of_obs && !observationDate) diagnostic(diagnostics, row.id, "date_of_obs", "invalid date", "biometric");
    if (row.fertigation_date && !fertigationDate) diagnostic(diagnostics, row.id, "fertigation_date", "invalid date", "fertigation");

    const values = Object.fromEntries(NUMERIC_FIELDS.map((field) => [field, normalizeField(row, field, diagnostics)]));
    const provenance = {
      supabase_id: row.id,
      source_row_id: row.id,
      source: "supabase",
      source_table: "athani_field_entries",
      status: row.status,
      location_id: ATHANI_LOCATION_ID,
      location_name: textOrNull(row.location_name) || "Athani",
      plot_id: plotMapping.plot_id,
      plot_label: sourcePlot,
      source_plot: sourcePlot,
      replication: plotMapping.replication,
      treatment_id: treatmentId,
      treatment_name: textOrNull(row.treatment_name),
    };

    if (BIOMETRIC_FIELDS.some((field) => values[field] !== null)) {
      biometric.push({
        ...provenance,
        observation_day: observationDay,
        date_of_observation: observationDate,
        plant_height_cm: values.plant_height,
        number_of_tillers: values.tiller_count,
        number_of_leaves: values.leaf_count,
        leaf_length_cm: values.leaf_height,
        leaf_breadth_cm: values.leaf_breath,
        source_file: "Supabase athani_field_entries",
        source_sheet: "Approved Athani Entry",
      });
    }

    if (FERTIGATION_FIELDS.some((field) => values[field] !== null)) {
      fertigation.push({
        ...provenance,
        day_after_planting: observationDay,
        observation_day: observationDay,
        date: fertigationDate,
        fertigation_date: fertigationDate,
        n_kg: values.n_kg,
        p2o5_kg: values.p2o5_kg,
        k2o_kg: values.k2o_kg,
        mn_mixture_kg: values.mn_mixture,
        urea_kg: values.urea_kg,
        map_kg: values.map_kg,
        dap_kg: values.dap_kg,
        white_potash_kg: values.white_potash_kg,
      });
    }
  });

  return { biometric, fertigation, diagnostics };
}
