import Papa from "papaparse";

export const DATA_FILES = {
  biometric: "/data/biometric_observations.csv",
  fertigation: "/data/fertigation_schedule.csv",
  fertigationSummary: "/data/fertigation_plot_summary.csv",
  fertilizerStock: "/data/fertilizer_stock.csv",
  cropStageSplit: "/data/crop_stage_split_dose.csv",
  plots: "/data/plot_master.csv",
  locations: "/data/location_master.csv",
  treatments: "/data/treatment_reference.csv",
};

export function parseCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: reject,
    });
  });
}

export async function loadDashboardData() {
  const [
    biometric,
    fertigation,
    fertigationSummary,
    fertilizerStock,
    cropStageSplit,
    plots,
    locations,
    treatments,
  ] = await Promise.all([
    parseCSV(DATA_FILES.biometric),
    parseCSV(DATA_FILES.fertigation),
    parseCSV(DATA_FILES.fertigationSummary),
    parseCSV(DATA_FILES.fertilizerStock),
    parseCSV(DATA_FILES.cropStageSplit),
    parseCSV(DATA_FILES.plots),
    parseCSV(DATA_FILES.locations),
    parseCSV(DATA_FILES.treatments),
  ]);

  return {
    biometric,
    fertigation,
    fertigationSummary,
    fertilizerStock,
    cropStageSplit,
    plots,
    locations,
    treatments,
  };
}