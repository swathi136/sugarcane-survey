function pairKey(pair) {
  return pair.locationId && pair.plotId ? `${pair.locationId}|${pair.plotId}` : "";
}

export function getActiveComparisonPairs(pairA, pairB, pairC, thirdEnabled) {
  return thirdEnabled ? [pairA, pairB, pairC] : [pairA, pairB];
}

export function isDuplicateComparisonPair(pairs, currentIndex, nextPair) {
  const nextKey = pairKey(nextPair);
  return Boolean(nextKey) && pairs.some((pair, index) => index !== currentIndex && pairKey(pair) === nextKey);
}

export function getComparisonPlotOptions(plots, locationId) {
  return plots
    .filter((plot) => plot.location_id === locationId)
    .sort((a, b) => String(a.plot_name || a.plot_id).localeCompare(String(b.plot_name || b.plot_id), undefined, { numeric: true, sensitivity: "base" }));
}

export function getDerivedTreatment(plotMap, pair) {
  return plotMap.get(pairKey(pair))?.treatment_id || null;
}
