import { canonicalDate } from "./mergeCollegeDashboardData";

const part = (value) => value === null || value === undefined ? "" : String(value).trim();

export function anthiyurFertigationKey(row) {
  return [row.location_id, row.plot_id, row.treatment_id, row.day_after_planting, canonicalDate(row.date || row.fertigation_date)].map(part).join("|");
}

function uniqueSourceRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = part(row.source_row_id || row.supabase_id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function mergeAnthiyurDashboardData(baseData, approvedData) {
  const baseBiometric = baseData.biometric || [];
  const baseFertigation = baseData.fertigation || [];
  const rawBiometric = approvedData.biometric || [];
  const rawFertigation = approvedData.fertigation || [];
  const approvedBiometric = uniqueSourceRows(rawBiometric);
  const approvedFertigation = uniqueSourceRows(rawFertigation);
  const approvedByKey = new Map();
  approvedFertigation.forEach((row) => {
    const key = anthiyurFertigationKey(row);
    approvedByKey.set(key, [...(approvedByKey.get(key) || []), row]);
  });
  const baseCounts = new Map();
  baseFertigation.forEach((row) => {
    const key = anthiyurFertigationKey(row);
    baseCounts.set(key, (baseCounts.get(key) || 0) + 1);
  });
  const replacedKeys = new Set();
  const ambiguousKeys = [];
  approvedByKey.forEach((matches, key) => {
    const baseCount = baseCounts.get(key) || 0;
    if (matches.length === 1 && baseCount === 1) replacedKeys.add(key);
    else if (matches.length > 1 || baseCount > 1) ambiguousKeys.push(key);
  });
  const retainedFertigation = baseFertigation.filter((row) => !replacedKeys.has(anthiyurFertigationKey(row)));
  const biometric = [...baseBiometric, ...approvedBiometric];
  const fertigation = [...retainedFertigation, ...approvedFertigation];
  return {
    data: { ...baseData, biometric, fertigation },
    diagnostics: {
      biometricAdded: approvedBiometric.length,
      biometricDuplicateIds: rawBiometric.length - approvedBiometric.length,
      fertigationAdded: approvedFertigation.length - replacedKeys.size,
      fertigationReplaced: replacedKeys.size,
      fertigationAmbiguous: ambiguousKeys,
      finalBiometricCount: biometric.length,
      finalFertigationCount: fertigation.length,
    },
  };
}
