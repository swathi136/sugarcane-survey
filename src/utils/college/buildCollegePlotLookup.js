const COLLEGE_LOCATION_ID = "L001";

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function buildCollegePlotLookup(plots = []) {
  const lookup = new Map();

  plots.forEach((plot) => {
    const locationId = clean(plot.location_id || plot.location_code);
    if (locationId !== COLLEGE_LOCATION_ID) return;

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
