import { supabase } from "../utils/supabaseClient";

const OBSERVATION_TABLES = {
  field_entries: "college_raw_observations",
  athani_field_entries: "athani_raw_observations",
  anthiyur_field_entries: "anthiyur_raw_observations",
};

export async function insertFieldEntryObservations(sourceTable, rows) {
  if (!rows.length) return [];
  const observationTable = OBSERVATION_TABLES[sourceTable];
  if (!observationTable) throw new Error(`Unknown observation source table: ${sourceTable}`);

  const { data, error } = await supabase
    .from(observationTable)
    .insert(rows)
    .select();

  if (error) {
    const insertError = new Error(`The averaged record was saved, but its raw observations could not be saved: ${error.message}`);
    insertError.cause = error;
    throw insertError;
  }

  return data || [];
}

export async function insertFieldEntry(payload) {
  try {
    const { data, error } = await supabase
      .from("field_entries")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase field entry insert error:", error);

      const insertError = new Error(
        `Unable to save the field data record: ${error.message}`
      );
      insertError.cause = error;
      throw insertError;
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;

    console.error("Unexpected field entry insert error:", error);
    throw new Error("Unable to save the field data record. Please try again.");
  }
}

// Maps College DB format to unified frontend format
function mapCollegeEntry(dbRow) {
  return {
    id: dbRow.id,
    tableName: 'field_entries',
    timestamp: new Date(dbRow.created_at).toLocaleString(),
    locationName: "College",
    locationId: "L001",
    plotName: dbRow.plot,
    obsDay: `DAY ${dbRow.observation_day}`,
    treatment: dbRow.treatment,
    obsDate: dbRow.observation_date,
    fertDate: dbRow.fertigation_date,
    plantHeight: dbRow.plant_height ?? "-",
    numTillers: dbRow.tiller_count ?? "-",
    numLeaves: dbRow.leaf_count ?? "-",
    leafLength: dbRow.leaf_length ?? "-",
    leafBreadth: dbRow.leaf_width ?? "-",
    numNodes: dbRow.number_of_nodes ?? "-",
    nodeLength: dbRow.node_length ?? "-",
    plantCount1m: dbRow.plant_count_1m ?? "-",
    plantCount5m: dbRow.plant_count_5m ?? "-",
    plantCount15m: dbRow.plant_count_15m ?? "-",
    germinationPct: dbRow.germination_pct ?? "-",
    whitePotashKg: dbRow.white_potash_kg ?? "-",
    nKg: dbRow.n_kg ?? "-",
    p2o5Kg: dbRow.p2o5_kg ?? "-",
    k2oKg: dbRow.k2o_kg ?? "-",
    mnMixture: dbRow.mn_mixture ?? "-",
    mapKg: dbRow.map ?? "-",
    dapKg: dbRow.dap ?? "-",
    sspKg: dbRow.ssp ?? "-",
    ureaKg: dbRow.urea ?? "-",
    mopKg: dbRow.mop ?? "-",
    studentEmail: dbRow.student_email || "Student",
    status: dbRow.status || "PENDING",
    rejectionFeedback: dbRow.rejection_feedback || "",
  };
}

// Maps Athani/Anthiyur DB format to unified frontend format
function mapOtherEntry(dbRow, locationName, tableName) {
  return {
    id: dbRow.id,
    tableName,
    timestamp: new Date(dbRow.created_at).toLocaleString(),
    locationName,
    locationId: dbRow.location_code,
    plotName: dbRow.plot,
    obsDay: `DAY ${dbRow.observation_day}`,
    treatment: dbRow.treatment,
    obsDate: dbRow.date_of_obs,
    fertDate: dbRow.fertigation_date,
    plantHeight: dbRow.plant_height ?? "-",
    numTillers: dbRow.tiller_count ?? "-",
    numLeaves: dbRow.leaf_count ?? "-",
    leafLength: dbRow.leaf_height ?? "-",
    leafBreadth: dbRow.leaf_breath ?? "-",
    numNodes: dbRow.number_of_nodes ?? "-",
    nodeLength: dbRow.node_length ?? "-",
    plantCount1m: dbRow.plant_count_1m ?? "-",
    whitePotashKg: dbRow.white_potash_kg ?? "-",
    nKg: dbRow.n_kg ?? "-",
    p2o5Kg: dbRow.p2o5_kg ?? "-",
    k2oKg: dbRow.k2o_kg ?? "-",
    mnMixture: dbRow.mn_mixture ?? "-",
    mapKg: dbRow.map_kg ?? "-",
    dapKg: dbRow.dap_kg ?? "-",
    ureaKg: dbRow.urea_kg ?? "-",
    studentEmail: dbRow.student_email || "Student",
    status: dbRow.status || "PENDING",
    rejectionFeedback: dbRow.rejection_feedback || "",
  };
}

export async function fetchAllSubmissions() {
  try {
    const [collegeRes, athaniRes, anthiyurRes] = await Promise.all([
      supabase.from("field_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("athani_field_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("anthiyur_field_entries").select("*").order("created_at", { ascending: false }),
    ]);

    const collegeData = (collegeRes.data || []).map(mapCollegeEntry);
    const athaniData = (athaniRes.data || []).map(r => mapOtherEntry(r, "Athani", "athani_field_entries"));
    const anthiyurData = (anthiyurRes.data || []).map(r => mapOtherEntry(r, "Anthiyur", "anthiyur_field_entries"));

    const combined = [...collegeData, ...athaniData, ...anthiyurData].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Merge in local meta since database schema wasn't updated
    const localMeta = JSON.parse(localStorage.getItem("adminApprovalMeta") || "{}");
    return combined.map(entry => {
      const meta = localMeta[entry.id];
      if (meta) {
        if (meta.status) entry.status = meta.status;
        if (meta.feedback) entry.rejectionFeedback = meta.feedback;
        if (meta.studentEmail) entry.studentEmail = meta.studentEmail;
        if (meta.realObservationDay) entry.obsDay = `DAY ${meta.realObservationDay}`;
      }
      return entry;
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

export async function updateSubmissionStatus(id, tableName, status, feedback = "") {
  try {
    // We cannot update Supabase schema without user running SQL script, so we save locally.
    const localMeta = JSON.parse(localStorage.getItem("adminApprovalMeta") || "{}");
    localMeta[id] = { ...localMeta[id], status, feedback };
    localStorage.setItem("adminApprovalMeta", JSON.stringify(localMeta));
    return true;
  } catch (error) {
    console.error(`Error saving local status for id ${id}:`, error);
    throw error;
  }
}

// Map frontend data structure to DB columns for updates
function mapFrontendToDb(tableName, data) {
  const parseNum = (val) => {
    if (val === "-" || val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const payload = {};

  if (tableName === "field_entries") {
    if (data.obsDate !== undefined) payload.observation_date = data.obsDate;
    if (data.fertDate !== undefined) payload.fertigation_date = data.fertDate;
    if (data.plantHeight !== undefined) payload.plant_height = parseNum(data.plantHeight);
    if (data.numTillers !== undefined) payload.tiller_count = parseNum(data.numTillers);
    if (data.numLeaves !== undefined) payload.leaf_count = parseNum(data.numLeaves);
    if (data.leafLength !== undefined) payload.leaf_length = parseNum(data.leafLength);
    if (data.leafBreadth !== undefined) payload.leaf_width = parseNum(data.leafBreadth);
    if (data.numNodes !== undefined) payload.number_of_nodes = parseNum(data.numNodes);
    if (data.nodeLength !== undefined) payload.node_length = parseNum(data.nodeLength);
    if (data.plantCount1m !== undefined) payload.plant_count_1m = parseNum(data.plantCount1m);
    if (data.plantCount5m !== undefined) payload.plant_count_5m = parseNum(data.plantCount5m);
    if (data.plantCount15m !== undefined) payload.plant_count_15m = parseNum(data.plantCount15m);
    if (data.germinationPct !== undefined) payload.germination_pct = parseNum(data.germinationPct);
    
    if (data.whitePotashKg !== undefined) payload.white_potash_kg = parseNum(data.whitePotashKg);
    if (data.nKg !== undefined) payload.n_kg = parseNum(data.nKg);
    if (data.p2o5Kg !== undefined) payload.p2o5_kg = parseNum(data.p2o5Kg);
    if (data.k2oKg !== undefined) payload.k2o_kg = parseNum(data.k2oKg);
    if (data.mnMixture !== undefined) payload.mn_mixture = parseNum(data.mnMixture);
    if (data.mapKg !== undefined) payload.map = parseNum(data.mapKg);
    if (data.dapKg !== undefined) payload.dap = parseNum(data.dapKg);
    if (data.sspKg !== undefined) payload.ssp = parseNum(data.sspKg);
    if (data.ureaKg !== undefined) payload.urea = parseNum(data.ureaKg);
    if (data.mopKg !== undefined) payload.mop = parseNum(data.mopKg);
  } else {
    // Athani / Anthiyur
    if (data.obsDate !== undefined) payload.date_of_obs = data.obsDate;
    if (data.fertDate !== undefined) payload.fertigation_date = data.fertDate;
    if (data.plantHeight !== undefined) payload.plant_height = parseNum(data.plantHeight);
    if (data.numTillers !== undefined) payload.tiller_count = parseNum(data.numTillers);
    if (data.numLeaves !== undefined) payload.leaf_count = parseNum(data.numLeaves);
    if (data.leafLength !== undefined) payload.leaf_height = parseNum(data.leafLength);
    if (data.leafBreadth !== undefined) payload.leaf_breath = parseNum(data.leafBreadth);
    if (data.numNodes !== undefined) payload.number_of_nodes = parseNum(data.numNodes);
    if (data.nodeLength !== undefined) payload.node_length = parseNum(data.nodeLength);
    if (data.plantCount1m !== undefined) payload.plant_count_1m = parseNum(data.plantCount1m);
    
    if (data.whitePotashKg !== undefined) payload.white_potash_kg = parseNum(data.whitePotashKg);
    if (data.nKg !== undefined) payload.n_kg = parseNum(data.nKg);
    if (data.p2o5Kg !== undefined) payload.p2o5_kg = parseNum(data.p2o5Kg);
    if (data.k2oKg !== undefined) payload.k2o_kg = parseNum(data.k2oKg);
    if (data.mnMixture !== undefined) payload.mn_mixture = parseNum(data.mnMixture);
    if (data.mapKg !== undefined) payload.map_kg = parseNum(data.mapKg);
    if (data.dapKg !== undefined) payload.dap_kg = parseNum(data.dapKg);
    if (data.ureaKg !== undefined) payload.urea_kg = parseNum(data.ureaKg);
  }

  // Common mapping for plot / treatment if needed
  if (data.plotName !== undefined) payload.plot = data.plotName;
  if (data.treatment !== undefined) payload.treatment = data.treatment;

  // Clean payload by removing undefined properties
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return payload;
}

export async function updateSubmissionData(id, tableName, updatedFields) {
  try {
    const dbPayload = mapFrontendToDb(tableName, updatedFields);
    
    // Only update if there are fields to update
    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase
        .from(tableName)
        .update(dbPayload)
        .eq("id", id);
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error(`Error updating data for ${tableName} id ${id}:`, error);
    throw error;
  }
}
