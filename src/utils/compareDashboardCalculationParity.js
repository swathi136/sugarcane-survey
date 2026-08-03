const comparableOverview = (value = {}) => ({
  totalPlots: Number(value.totalPlots || 0),
  totalTreatments: Number(value.totalTreatments || 0),
  biometricRecords: Number(value.biometricRecords || 0),
  fertigationRecords: Number(value.fertigationRecords || 0),
  avgPlantHeight: Number(value.avgPlantHeight || 0),
  avgTillers: Number(value.avgTillers || 0),
  latestObservationDay: Number(value.latestObservationDay || 0),
});

const comparableFertilizer = (value = {}) => ({
  nKg: Number(value.nKg || 0),
  p2o5Kg: Number(value.p2o5Kg || 0),
  k2oKg: Number(value.k2oKg || 0),
  ureaKg: Number(value.ureaKg || 0),
  mapKg: Number(value.mapKg || 0),
  dapKg: Number(value.dapKg || 0),
  whitePotashKg: Number(value.whitePotashKg || 0),
});

export function compareDashboardCalculationParity(clientSnapshots, serverByLocation) {
  return (clientSnapshots || []).map((client) => {
    const server = serverByLocation?.[client.locationId];
    if (!server) return { locationId: client.locationId, matches: false, reason: "missing server result" };
    const clientOverview = comparableOverview(client.results.overview);
    const serverOverview = comparableOverview(server.overview);
    const clientFertilizer = comparableFertilizer(client.results.fertigationTracking?.totals);
    const serverFertilizer = comparableFertilizer(server.fertigationTracking?.totals);
    const differences = [];
    for (const [key, value] of Object.entries(clientOverview)) {
      if (value !== serverOverview[key]) differences.push(`overview.${key}: ${value} != ${serverOverview[key]}`);
    }
    for (const [key, value] of Object.entries(clientFertilizer)) {
      if (value !== serverFertilizer[key]) differences.push(`fertigation.${key}: ${value} != ${serverFertilizer[key]}`);
    }
    const clientBest = client.results.treatmentComparison?.bestTreatment || null;
    const serverBest = server.treatmentComparison?.bestTreatment || null;
    if (clientBest !== serverBest) differences.push(`treatment.best: ${clientBest} != ${serverBest}`);
    return { locationId: client.locationId, matches: differences.length === 0, differences };
  });
}
