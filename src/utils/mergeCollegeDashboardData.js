function keyPart(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function canonicalDate(value) {
  const text = keyPart(value);
  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dottedMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dottedMatch) return `${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`;

  return text;
}

export function fertigationObservationKey(row) {
  return [
    row.location_id,
    row.plot_id,
    row.treatment_id,
    row.day_after_planting,
    canonicalDate(row.date || row.fertigation_date),
  ].map(keyPart).join("|");
}

function uniqueApprovedRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = keyPart(row.source_row_id || row.supabase_id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function mergeBiometric(csvRows, approvedRows) {
  const uniqueApproved = uniqueApprovedRows(approvedRows);
  return {
    rows: [...csvRows, ...uniqueApproved],
    duplicateCount: approvedRows.length - uniqueApproved.length,
    duplicateKeys: [],
    ambiguousKeys: [],
  };
}

function mergeFertigation(csvRows, approvedRows) {
  const uniqueApproved = uniqueApprovedRows(approvedRows);
  const approvedByKey = new Map();
  uniqueApproved.forEach((row) => {
    const key = fertigationObservationKey(row);
    const values = approvedByKey.get(key) || [];
    values.push(row);
    approvedByKey.set(key, values);
  });

  const csvCounts = new Map();
  csvRows.forEach((row) => {
    const key = fertigationObservationKey(row);
    csvCounts.set(key, (csvCounts.get(key) || 0) + 1);
  });

  const exactKeys = new Set();
  const ambiguousKeys = [];
  approvedByKey.forEach((approvedMatches, key) => {
    const csvCount = csvCounts.get(key) || 0;
    if (approvedMatches.length === 1 && csvCount === 1) exactKeys.add(key);
    else if (csvCount > 1 || approvedMatches.length > 1) ambiguousKeys.push(key);
  });

  const retainedCsv = csvRows.filter((row) => !exactKeys.has(fertigationObservationKey(row)));
  return {
    rows: [...retainedCsv, ...uniqueApproved],
    duplicateCount: exactKeys.size + (approvedRows.length - uniqueApproved.length),
    duplicateKeys: [...exactKeys],
    ambiguousKeys,
  };
}

export function mergeCollegeDashboardData(csvData, approvedCollegeData) {
  const csvBiometric = csvData.biometric || [];
  const csvFertigation = csvData.fertigation || [];
  const approvedBiometric = approvedCollegeData.biometric || [];
  const approvedFertigation = approvedCollegeData.fertigation || [];
  const biometricMerge = mergeBiometric(csvBiometric, approvedBiometric);
  const fertigationMerge = mergeFertigation(csvFertigation, approvedFertigation);

  return {
    data: { ...csvData, biometric: biometricMerge.rows, fertigation: fertigationMerge.rows },
    diagnostics: {
      biometric: {
        csvCount: csvBiometric.length,
        approvedSupabaseCount: approvedBiometric.length,
        duplicateCount: biometricMerge.duplicateCount,
        duplicateKeys: biometricMerge.duplicateKeys,
        ambiguousKeys: biometricMerge.ambiguousKeys,
        finalCount: biometricMerge.rows.length,
        approvedIdsSurviving: biometricMerge.rows.filter((row) => row.source === "supabase").map((row) => row.source_row_id),
      },
      fertigation: {
        csvCount: csvFertigation.length,
        approvedSupabaseCount: approvedFertigation.length,
        duplicateCount: fertigationMerge.duplicateCount,
        duplicateKeys: fertigationMerge.duplicateKeys,
        ambiguousKeys: fertigationMerge.ambiguousKeys,
        finalCount: fertigationMerge.rows.length,
        approvedIdsSurviving: fertigationMerge.rows.filter((row) => row.source === "supabase").map((row) => row.source_row_id),
      },
    },
  };
}
