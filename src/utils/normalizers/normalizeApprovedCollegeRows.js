const COLLEGE_LOCATION_ID = "L001";
const MIN_OBSERVATION_DAY = 1;
import { toFiniteMetricOrNull, toIntegerMetricOrNull } from "../metrics/toFiniteMetricOrNull";


const INTEGER_FIELDS = new Set([
  "tiller_count",
  "leaf_count",
  "plant_count_1m",
  "plant_count_5m",
  "plant_count_15m",
  "number_of_nodes",
]);

const NUMERIC_FIELDS = [
  ...INTEGER_FIELDS,
  "plant_height",
  "leaf_length",
  "leaf_width",
  "node_length",
  "germination_pct",
  "white_potash_kg",
  "n_kg",
  "p2o5_kg",
  "k2o_kg",
  "mn_mixture",
  "urea",
  "map",
  "dap",
  "ssp",
  "mop",
];

const BIOMETRIC_FIELDS = [
  "plant_height",
  "tiller_count",
  "leaf_count",
  "leaf_length",
  "leaf_width",
  "plant_count_1m",
  "plant_count_5m",
  "plant_count_15m",
  "number_of_nodes",
  "node_length",
  "germination_pct",
];

const FERTIGATION_FIELDS = [
  "white_potash_kg",
  "n_kg",
  "p2o5_kg",
  "k2o_kg",
  "mn_mixture",
  "urea",
  "map",
  "dap",
  "ssp",
  "mop",
];

export function toFiniteNumberOrNull(value) {
  return toFiniteMetricOrNull(value);
}

export function toIntegerOrNull(value) {
  return toIntegerMetricOrNull(value);
}

export function toValidDateOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;

  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
    ? text
    : null;
}

function nonEmptyTextOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function addDiagnostic(diagnostics, rowId, field, reason, category) {
  diagnostics.push({ rowId, field, reason, category });
}

function normalizeNonNegativeField(row, field, diagnostics) {
  const rawValue = row[field];
  const value = INTEGER_FIELDS.has(field)
    ? toIntegerOrNull(rawValue)
    : toFiniteNumberOrNull(rawValue);

  if (value === null) {
    if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== "") {
      addDiagnostic(
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
    addDiagnostic(
      diagnostics,
      row.id,
      field,
      "negative value excluded",
      BIOMETRIC_FIELDS.includes(field) ? "biometric" : "fertigation",
    );
    return null;
  }

  return value;
}

export function normalizeApprovedCollegeRows(rows, plotLookup = new Map()) {
  const biometric = [];
  const fertigation = [];
  const diagnostics = [];

  (rows || []).forEach((row) => {
    if (row.status !== "Approved") return;

    const locationId = nonEmptyTextOrNull(row.location_code);
    if (locationId !== COLLEGE_LOCATION_ID) {
      addDiagnostic(diagnostics, row.id, "location_code", "non-College row excluded", "record");
      return;
    }

    const sourcePlot = nonEmptyTextOrNull(row.plot);
    const plotMapping = sourcePlot ? plotLookup.get(sourcePlot.toUpperCase()) : null;
    const plotId = plotMapping?.plot_id || null;
    const treatmentId = nonEmptyTextOrNull(row.treatment);
    if (!sourcePlot || !treatmentId) {
      addDiagnostic(diagnostics, row.id, !sourcePlot ? "plot" : "treatment", "required identifier missing", "record");
      return;
    }
    if (!plotId) {
      addDiagnostic(diagnostics, row.id, "plot", `unknown College plot mapping: ${sourcePlot}`, "record");
      return;
    }

    const observationDay = toIntegerOrNull(row.observation_day);
    if (
      observationDay === null ||
      observationDay < MIN_OBSERVATION_DAY 
     
    ) {
      addDiagnostic(diagnostics, row.id, "observation_day", "invalid College observation day", "record");
      return;
    }

    const observationDate = toValidDateOrNull(row.observation_date);
    const fertigationDate = toValidDateOrNull(row.fertigation_date);
    if (row.observation_date && !observationDate) {
      addDiagnostic(diagnostics, row.id, "observation_date", "invalid date", "biometric");
    }
    if (row.fertigation_date && !fertigationDate) {
      addDiagnostic(diagnostics, row.id, "fertigation_date", "invalid date", "fertigation");
    }

    const values = Object.fromEntries(
      NUMERIC_FIELDS.map((field) => [field, normalizeNonNegativeField(row, field, diagnostics)]),
    );

    const provenance = {
      supabase_id: row.id,
      source_row_id: row.id,
      source: "supabase",
      source_table: "field_entries",
      status: row.status,
      location_id: locationId,
      location_name: nonEmptyTextOrNull(row.location_name) || "College",
      plot_id: plotId,
      plot_label: sourcePlot,
      source_plot: sourcePlot,
      replication: plotMapping.replication,
      treatment_id: treatmentId,
    };

    if (BIOMETRIC_FIELDS.some((field) => values[field] !== null)) {
      biometric.push({
        ...provenance,
        observation_day: observationDay,
        date_of_observation: observationDate,
        plant_height_cm: values.plant_height,
        number_of_tillers: values.tiller_count,
        number_of_leaves: values.leaf_count,
        leaf_length_cm: values.leaf_length,
        leaf_breadth_cm: values.leaf_width,
        plant_count_1m: values.plant_count_1m,
        plant_count_5m: values.plant_count_5m,
        plant_count_15m: values.plant_count_15m,
        number_of_node: values.number_of_nodes,
        number_of_nodes: values.number_of_nodes,
        node_length_cm: values.node_length,
        germination_pct: values.germination_pct,
        source_file: "Supabase field_entries",
        source_sheet: "Approved College Entry",
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
        urea_kg: values.urea,
        map_kg: values.map,
        dap_kg: values.dap,
        white_potash_kg: values.white_potash_kg,
        ssp_kg: values.ssp,
        mop_kg: values.mop,
      });
    }
  });

  return { biometric, fertigation, diagnostics };
}
