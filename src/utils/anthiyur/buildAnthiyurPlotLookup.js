const ANTHIYUR_LOCATION_ID = "L003";

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function buildAnthiyurPlotLookup(plots = []) {
  const lookup = new Map();
  plots.forEach((plot) => {
    if (clean(plot.location_id || plot.location_code) !== ANTHIYUR_LOCATION_ID) return;
    const plotId = clean(plot.plot_id);
    const plotName = clean(plot.plot_name || plot.plot_label || plot.name);
    if (!plotId || !plotName) return;
    lookup.set(plotName.toUpperCase(), {
      plot_id: plotId,
      plot_name: plotName,
      replication: clean(plot.replication) || null,
      treatment_id: clean(plot.treatment_id || plot.treatment) || null,
    });
  });
  return lookup;
}
