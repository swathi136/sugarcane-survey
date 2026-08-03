import { canonicalDate } from "./mergeCollegeDashboardData";

function part(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function athaniFertigationKey(row) {
  return [row.location_id, row.plot_id, row.treatment_id, row.day_after_planting, canonicalDate(row.date || row.fertigation_date)].map(part).join("|");
}

function uniqueBySourceId(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = part(row.source_row_id || row.supabase_id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function mergeAthaniDashboardData(baseData, approvedAthaniData) {
  const csvBiometric = baseData.biometric || [];
  const csvFertigation = baseData.fertigation || [];
  const rawApprovedBiometric = approvedAthaniData.biometric || [];
  const rawApprovedFertigation = approvedAthaniData.fertigation || [];
  const approvedBiometric = uniqueBySourceId(rawApprovedBiometric);
  const approvedFertigation = uniqueBySourceId(rawApprovedFertigation);

  const approvedByKey = new Map();
  approvedFertigation.forEach((row) => {
    const key = athaniFertigationKey(row);
    approvedByKey.set(key, [...(approvedByKey.get(key) || []), row]);
  });
  const csvCounts = new Map();
  csvFertigation.forEach((row) => {
    const key = athaniFertigationKey(row);
    csvCounts.set(key, (csvCounts.get(key) || 0) + 1);
  });

  const exactKeys = new Set();
  const ambiguousKeys = [];
  approvedByKey.forEach((matches, key) => {
    const csvCount = csvCounts.get(key) || 0;
    if (matches.length === 1 && csvCount === 1) exactKeys.add(key);
    else if (matches.length > 1 || csvCount > 1) ambiguousKeys.push(key);
  });

  const retainedFertigation = csvFertigation.filter((row) => !exactKeys.has(athaniFertigationKey(row)));
  const biometric = [...csvBiometric, ...approvedBiometric];
  const fertigation = [...retainedFertigation, ...approvedFertigation];

  return {
    data: { ...baseData, biometric, fertigation },
    diagnostics: {
      biometric: {
        approvedSupabaseCount: rawApprovedBiometric.length,
        duplicateCount: rawApprovedBiometric.length - approvedBiometric.length,
        finalCount: biometric.length,
        approvedIdsSurviving: approvedBiometric.map((row) => row.source_row_id),
      },
      fertigation: {
        approvedSupabaseCount: rawApprovedFertigation.length,
        duplicateCount: exactKeys.size + rawApprovedFertigation.length - approvedFertigation.length,
        duplicateKeys: [...exactKeys],
        ambiguousKeys,
        finalCount: fertigation.length,
        approvedIdsSurviving: approvedFertigation.map((row) => row.source_row_id),
      },
    },
  };
}
