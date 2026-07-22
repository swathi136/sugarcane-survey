export function getLocationName(locationId, locations) {
  const location = locations.find((item) => item.location_id === locationId);
  return location?.location_short_name || locationId || "-";
}

export function getPlotName(plotId, plots) {
  const plot = plots.find((item) => item.plot_id === plotId);
  return plot?.plot_name || plotId || "-";
}

export function formatNumber(value, decimals = 1) {
  if (typeof value !== "number") return "-";
  return Number(value.toFixed(decimals));
}