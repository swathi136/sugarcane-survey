import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  MapPin,
  Sprout,
  FlaskConical,
  Droplets,
  Bell,
  Download,
  CalendarDays,
  Printer,
  BarChart3,
  Database,
} from "lucide-react";

import KpiCard from "../components/KpiCard";
import kpiRepLoc from "../assets/images/rep_bg_loc_google_map.jpg";
import kpiRepPlots from "../assets/images/user_plots_pinned.jpg";
import kpiRepTreatments from "../assets/images/rep_bg_plots_drone_view.jpg";
import kpiRepRecords from "../assets/images/rep_bg_records.jpg";
import kpiRepLatest from "../assets/images/rep_bg_latest.jpg";
import EmptyState from "../components/EmptyState";
import MethodologyNote from "../components/MethodologyNote";
import { getLocationName } from "../utils/formatters";
import { toFiniteMetricOrNull } from "../utils/metrics/toFiniteMetricOrNull";
import { loadDataQualityResults } from "../services/dashboardQueryService";

function Reports({ data, selectedLocation }) {
  const serverResult = data.serverResultsByLocation?.[selectedLocation];
  const [serverQuality, setServerQuality] = useState(null);

  useEffect(() => {
    let active = true;
    loadDataQualityResults(selectedLocation)
      .then((result) => {
        if (active) setServerQuality(result);
      })
      .catch(() => {
        if (active) setServerQuality(null);
      });
    return () => {
      active = false;
    };
  }, [selectedLocation]);
  const biometric = useMemo(() => {
    const rows = data.biometric || [];

    if (selectedLocation === "All") return rows;

    return rows.filter((row) => row.location_id === selectedLocation);
  }, [data.biometric, selectedLocation]);

  const fertigation = useMemo(() => {
    const rows = data.fertigation || [];

    if (selectedLocation === "All") return rows;

    return rows.filter((row) => row.location_id === selectedLocation);
  }, [data.fertigation, selectedLocation]);

  const plots = useMemo(() => {
    const rows = data.plots || [];

    if (selectedLocation === "All") return rows;

    return rows.filter((row) => row.location_id === selectedLocation);
  }, [data.plots, selectedLocation]);

  const selectedLocationName =
    selectedLocation === "All"
      ? "All Locations"
      : getLocationName(selectedLocation, data.locations || []);

  const summary = useMemo(() => {
    if (serverResult) {
      const overview = serverResult.overview || {};
      return {
        locations: Number(overview.totalLocations || 0),
        plots: Number(overview.totalPlots || 0),
        treatments: Number(overview.totalTreatments || 0),
        biometricRecords: Number(overview.biometricRecords || 0),
        fertigationRecords: Number(overview.fertigationRecords || 0),
        avgHeight: Number(overview.avgPlantHeight || 0),
        avgTillers: Number(overview.avgTillers || 0),
        latestDay: Number(overview.latestObservationDay || 0),
      };
    }
    const locationSet = new Set(
      biometric.map((row) => row.location_id).filter(Boolean)
    );

    const plotSet = new Set(
      biometric.map((row) => row.plot_id).filter(Boolean)
    );

    const treatmentSet = new Set(
      biometric
        .map((row) => `${row.location_id}-${row.treatment_id}`)
        .filter(Boolean)
    );

    const heightValues = biometric
      .map((row) => toFiniteMetricOrNull(row.plant_height_cm))
      .filter((value) => value !== null);

    const tillerValues = biometric
      .map((row) => toFiniteMetricOrNull(row.number_of_tillers))
      .filter((value) => value !== null);

    const latestDay =
      biometric.length > 0
        ? Math.max(
            ...biometric
              .map((row) => toFiniteMetricOrNull(row.observation_day))
              .filter((value) => value !== null)
          )
        : 0;

    return {
      locations:
        selectedLocation === "All"
          ? locationSet.size
          : selectedLocation && selectedLocation !== "All"
          ? 1
          : 0,
      plots: plotSet.size || plots.length,
      treatments: treatmentSet.size,
      biometricRecords: biometric.length,
      fertigationRecords: fertigation.length,
      avgHeight: average(heightValues),
      avgTillers: average(tillerValues),
      latestDay,
    };
  }, [biometric, fertigation, plots, selectedLocation, serverResult]);

  const locationSummary = useMemo(() => {
    if (serverResult?.reports?.locationSummary) {
      return serverResult.reports.locationSummary.map((row) => ({
        location: getLocationName(row.location_id, data.locations || []),
        records: Number(row.records || 0),
        avgHeight: Number(row.avg_height || 0),
        avgTillers: Number(row.avg_tillers || 0),
        latestDay: Number(row.latest_day || 0),
      }));
    }
    const grouped = {};

    biometric.forEach((row) => {
      const locationId = row.location_id;
      if (!locationId) return;

      if (!grouped[locationId]) {
        grouped[locationId] = {
          location_id: locationId,
          records: 0,
          heightValues: [],
          tillerValues: [],
          latestDay: 0,
        };
      }

      grouped[locationId].records += 1;

      const height = toFiniteMetricOrNull(row.plant_height_cm);
      const tillers = toFiniteMetricOrNull(row.number_of_tillers);
      const day = toFiniteMetricOrNull(row.observation_day);

      if (height !== null) grouped[locationId].heightValues.push(height);
      if (tillers !== null) grouped[locationId].tillerValues.push(tillers);

      if (day !== null) {
        grouped[locationId].latestDay = Math.max(
          grouped[locationId].latestDay,
          day
        );
      }
    });

    return Object.values(grouped).map((item) => ({
      location: getLocationName(item.location_id, data.locations || []),
      records: item.records,
      avgHeight: average(item.heightValues),
      avgTillers: average(item.tillerValues),
      latestDay: item.latestDay,
    }));
  }, [biometric, data.locations, serverResult]);

  const treatmentRanking = useMemo(() => {
    if (serverResult?.reports?.treatmentRanking) {
      return serverResult.reports.treatmentRanking.map((row) => ({
        location: getLocationName(row.location_id, data.locations || []),
        treatment: row.treatment,
        records: Number(row.records || 0),
        avgHeight: Number(row.avg_height || 0),
        avgTillers: Number(row.avg_tillers || 0),
        avgLeaves: Number(row.avg_leaves || 0),
      }));
    }
    const grouped = {};

    biometric.forEach((row) => {
      if (!row.treatment_id) return;

      const key = `${row.location_id}-${row.treatment_id}`;

      if (!grouped[key]) {
        grouped[key] = {
          location_id: row.location_id,
          treatment_id: row.treatment_id,
          records: 0,
          heightValues: [],
          tillerValues: [],
          leafValues: [],
        };
      }

      grouped[key].records += 1;

      const height = toFiniteMetricOrNull(row.plant_height_cm);
      const tillers = toFiniteMetricOrNull(row.number_of_tillers);
      const leaves = toFiniteMetricOrNull(row.number_of_leaves);

      if (height !== null) grouped[key].heightValues.push(height);
      if (tillers !== null) grouped[key].tillerValues.push(tillers);
      if (leaves !== null) grouped[key].leafValues.push(leaves);
    });

    return Object.values(grouped)
      .map((item) => ({
        location: getLocationName(item.location_id, data.locations || []),
        treatment: item.treatment_id,
        records: item.records,
        avgHeight: average(item.heightValues),
        avgTillers: average(item.tillerValues),
        avgLeaves: average(item.leafValues),
      }))
      .sort((a, b) => b.avgHeight - a.avgHeight)
      .slice(0, 10);
  }, [biometric, data.locations, serverResult]);

  const fertilizerTotals = useMemo(() => {
    if (serverResult?.fertigationTracking?.totals) {
      const totals = serverResult.fertigationTracking.totals;
      return {
        nitrogen: Number(totals.nKg || 0),
        phosphorus: Number(totals.p2o5Kg || 0),
        potassium: Number(totals.k2oKg || 0),
        urea: Number(totals.ureaKg || 0),
        dap: Number(totals.dapKg || 0),
        map: Number(totals.mapKg || 0),
        potash: Number(totals.whitePotashKg || 0),
      };
    }
    return {
      nitrogen: sumColumn(fertigation, "n_kg"),
      phosphorus: sumColumn(fertigation, "p2o5_kg"),
      potassium: sumColumn(fertigation, "k2o_kg"),
      urea: sumColumn(fertigation, "urea_kg"),
      dap: sumColumn(fertigation, "dap_kg"),
      map: sumColumn(fertigation, "map_kg"),
      potash: sumColumn(fertigation, "white_potash_kg"),
    };
  }, [fertigation, serverResult]);

  const alertSummary = useMemo(() => {
    if (serverResult?.smartAlerts) {
      return {
        lowGrowthCount: Number(serverResult.smartAlerts.lowGrowth || 0),
        weakTilleringCount: Number(serverResult.smartAlerts.weakTillering || 0),
        totalAlerts: Number(serverResult.smartAlerts.total || 0),
      };
    }
    const heightValues = biometric
      .map((row) => toFiniteMetricOrNull(row.plant_height_cm))
      .filter((value) => value !== null);

    const tillerValues = biometric
      .map((row) => toFiniteMetricOrNull(row.number_of_tillers))
      .filter((value) => value !== null);

    const avgHeight = average(heightValues);
    const avgTillers = average(tillerValues);

    const lowGrowthCount = biometric.filter((row) => {
      const height = toFiniteMetricOrNull(row.plant_height_cm);
      return height !== null && avgHeight > 0 && height < avgHeight * 0.75;
    }).length;

    const weakTilleringCount = biometric.filter((row) => {
      const tillers = toFiniteMetricOrNull(row.number_of_tillers);
      return (
        tillers !== null && avgTillers > 0 && tillers < avgTillers * 0.7
      );
    }).length;

    return {
      lowGrowthCount,
      weakTilleringCount,
      totalAlerts: lowGrowthCount + weakTilleringCount,
    };
  }, [biometric, serverResult]);

  const comparativeSummary = useMemo(() => {
    const bestLocation = [...locationSummary].sort(
      (a, b) => b.avgHeight - a.avgHeight
    )[0];

    const bestTreatment = treatmentRanking[0];

    const totalNPK =
      fertilizerTotals.nitrogen +
      fertilizerTotals.phosphorus +
      fertilizerTotals.potassium;

    const uniqueTreatmentCount = serverResult
      ? Number(serverResult.overview?.totalTreatments || 0)
      : new Set(
      biometric
        .map((row) => `${row.location_id}-${row.treatment_id}`)
        .filter(Boolean)
      ).size;

    return {
      bestLocation: bestLocation?.location || "-",
      bestLocationHeight: bestLocation?.avgHeight || 0,
      bestTreatment: bestTreatment?.treatment || "-",
      bestTreatmentHeight: bestTreatment?.avgHeight || 0,
      latestDay: summary.latestDay,
      totalNPK: Number(totalNPK.toFixed(2)),
      treatmentsCompared: uniqueTreatmentCount,
    };
  }, [
    locationSummary,
    treatmentRanking,
    fertilizerTotals,
    biometric,
    summary.latestDay,
    serverResult,
  ]);

  const dataQualitySummary = useMemo(() => {
    const coreColumns = [
      {
        column: "plant_height_cm",
        label: "Plant Height",
        usage: "Core growth metric",
      },
      {
        column: "number_of_tillers",
        label: "Number of Tillers",
        usage: "Core tillering metric",
      },
      {
        column: "number_of_leaves",
        label: "Number of Leaves",
        usage: "Leaf development metric",
      },
      {
        column: "leaf_length_cm",
        label: "Leaf Length",
        usage: "Leaf development metric",
      },
      {
        column: "leaf_breadth_cm",
        label: "Leaf Breadth",
        usage: "Leaf development metric",
      },
      {
        column: "observation_day",
        label: "Observation Day",
        usage: "Main time axis",
      },
    ];

    const weakColumns = [
      {
        column: "date_of_observation",
        label: "Date of Observation",
        reason: "Incomplete in some source sheets",
      },
      {
        column: "cane_girth_cm",
        label: "Cane Girth",
        reason: "Currently unavailable / very sparse",
      },
      {
        column: "germination_pct",
        label: "Germination %",
        reason: "Currently unavailable / very sparse",
      },
      {
        column: "millable_cane_count",
        label: "Millable Cane Count",
        reason: "Limited coverage",
      },
    ];

    const serverColumns = new Map(
      (serverQuality?.biometricColumns || []).map((row) => [row.column, row])
    );
    const coreRows = coreColumns.map((item) => ({
      ...item,
      ...(serverColumns.get(item.column) || getColumnCompleteness(biometric, item.column)),
    }));

    const weakRows = weakColumns.map((item) => ({
      ...item,
      ...(serverColumns.get(item.column) || getColumnCompleteness(biometric, item.column)),
    }));

    const avgCoreCompleteness = average(
      coreRows.map((row) => row.completeness)
    );

    const strongCoreMetrics = coreRows.filter(
      (row) => row.completeness >= 70
    ).length;

    const weakImportantMetrics = weakRows.filter(
      (row) => row.completeness < 40
    ).length;

    return {
      avgCoreCompleteness,
      strongCoreMetrics,
      weakImportantMetrics,
      coreRows,
      weakRows,
    };
  }, [biometric, serverQuality]);

  function downloadSummaryCSV() {
    const rows = [];

    rows.push(["Sugarcane Survey Dashboard Report"]);
    rows.push(["Selected Location", selectedLocationName]);
    rows.push(["Generated On", new Date().toLocaleString()]);
    rows.push([]);

    rows.push(["Summary"]);
    rows.push(["Locations", summary.locations]);
    rows.push(["Plots", summary.plots]);
    rows.push(["Treatments", summary.treatments]);
    rows.push(["Biometric Records", summary.biometricRecords]);
    rows.push(["Fertigation Records", summary.fertigationRecords]);
    rows.push(["Average Plant Height", summary.avgHeight]);
    rows.push(["Average Tillers", summary.avgTillers]);
    rows.push(["Latest Observation Day", summary.latestDay]);
    rows.push([]);

    rows.push(["Comparative Analysis Summary"]);
    rows.push(["Best Location", comparativeSummary.bestLocation]);
    rows.push(["Best Location Avg Height", comparativeSummary.bestLocationHeight]);
    rows.push(["Best Treatment", comparativeSummary.bestTreatment]);
    rows.push(["Best Treatment Avg Height", comparativeSummary.bestTreatmentHeight]);
    rows.push(["Latest Observation Day", comparativeSummary.latestDay]);
    rows.push(["Total NPK", comparativeSummary.totalNPK]);
    rows.push(["Treatments Compared", comparativeSummary.treatmentsCompared]);
    rows.push([]);

    rows.push(["Data Quality Summary"]);
    rows.push([
      "Average Core Metric Completeness",
      `${dataQualitySummary.avgCoreCompleteness}%`,
    ]);
    rows.push(["Strong Core Metrics", dataQualitySummary.strongCoreMetrics]);
    rows.push(["Weak Important Metrics", dataQualitySummary.weakImportantMetrics]);
    rows.push([]);

    rows.push(["Core Metric Completeness"]);
    rows.push(["Metric", "Column", "Available", "Missing", "Completeness", "Usage"]);
    dataQualitySummary.coreRows.forEach((row) => {
      rows.push([
        row.label,
        row.column,
        row.available,
        row.missing,
        `${row.completeness}%`,
        row.usage,
      ]);
    });
    rows.push([]);

    rows.push(["Weak Metric Notes"]);
    rows.push(["Metric", "Column", "Available", "Missing", "Completeness", "Reason"]);
    dataQualitySummary.weakRows.forEach((row) => {
      rows.push([
        row.label,
        row.column,
        row.available,
        row.missing,
        `${row.completeness}%`,
        row.reason,
      ]);
    });
    rows.push([]);

    rows.push(["Location Summary"]);
    rows.push(["Location", "Records", "Avg Height", "Avg Tillers", "Latest Day"]);
    locationSummary.forEach((row) => {
      rows.push([
        row.location,
        row.records,
        row.avgHeight,
        row.avgTillers,
        row.latestDay,
      ]);
    });
    rows.push([]);

    rows.push(["Treatment Ranking"]);
    rows.push([
      "Location",
      "Treatment",
      "Records",
      "Avg Height",
      "Avg Tillers",
      "Avg Leaves",
    ]);
    treatmentRanking.forEach((row) => {
      rows.push([
        row.location,
        row.treatment,
        row.records,
        row.avgHeight,
        row.avgTillers,
        row.avgLeaves,
      ]);
    });
    rows.push([]);

    rows.push(["Fertilizer Summary"]);
    rows.push(["N kg", fertilizerTotals.nitrogen]);
    rows.push(["P2O5 kg", fertilizerTotals.phosphorus]);
    rows.push(["K2O kg", fertilizerTotals.potassium]);
    rows.push(["Urea kg", fertilizerTotals.urea]);
    rows.push(["DAP kg", fertilizerTotals.dap]);
    rows.push(["MAP kg", fertilizerTotals.map]);
    rows.push(["White Potash kg", fertilizerTotals.potash]);
    rows.push([]);

    rows.push(["Alert Summary"]);
    rows.push(["Low Growth Alerts", alertSummary.lowGrowthCount]);
    rows.push(["Weak Tillering Alerts", alertSummary.weakTilleringCount]);
    rows.push(["Total Alerts", alertSummary.totalAlerts]);

    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sugarcane_report_${selectedLocationName
      .replaceAll(" ", "_")
      .toLowerCase()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function printReport() {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to print the report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sugarcane Survey Report</title>
          <style>
            body {
              font-family: "Inter", sans-serif;
              color: #12351f;
              padding: 28px;
              line-height: 1.5;
            }

            h1 {
              margin-bottom: 4px;
              color: #0f2f1d;
            }

            h2 {
              margin-top: 28px;
              color: #166534;
              border-bottom: 2px solid #dcfce7;
              padding-bottom: 6px;
            }

            .meta {
              color: #64748b;
              margin-bottom: 22px;
            }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-top: 18px;
            }

            .summary-card {
              border: 1px solid #dbe7d2;
              border-radius: 12px;
              padding: 12px;
              background: #f8fbf5;
            }

            .summary-card span {
              display: block;
              font-size: 12px;
              color: #64748b;
            }

            .summary-card strong {
              display: block;
              font-size: 20px;
              margin-top: 4px;
              color: #12351f;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              font-size: 13px;
            }

            th {
              background: #ecfdf3;
              color: #166534;
              text-align: left;
            }

            th, td {
              border: 1px solid #dbe7d2;
              padding: 9px;
            }

            .note {
              margin-top: 28px;
              padding: 14px;
              background: #ecfdf3;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
              font-size: 13px;
              color: #31523d;
            }

            @media print {
              body {
                padding: 18px;
              }
            }
          </style>
        </head>

        <body>
          <h1>Sugarcane Survey Visualization Report</h1>
          <div class="meta">
            Selected Location: ${selectedLocationName}<br/>
            Generated On: ${new Date().toLocaleString()}
          </div>

          <h2>Dashboard Summary</h2>
          <div class="summary-grid">
            <div class="summary-card"><span>Locations</span><strong>${summary.locations}</strong></div>
            <div class="summary-card"><span>Plots</span><strong>${summary.plots}</strong></div>
            <div class="summary-card"><span>Treatments</span><strong>${summary.treatments}</strong></div>
            <div class="summary-card"><span>Biometric Records</span><strong>${summary.biometricRecords}</strong></div>
            <div class="summary-card"><span>Fertigation Records</span><strong>${summary.fertigationRecords}</strong></div>
            <div class="summary-card"><span>Avg Height</span><strong>${summary.avgHeight}</strong></div>
            <div class="summary-card"><span>Avg Tillers</span><strong>${summary.avgTillers}</strong></div>
            <div class="summary-card"><span>Latest Day</span><strong>${summary.latestDay}</strong></div>
          </div>

          <h2>Comparative Analysis Summary</h2>
          <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Best Location</td><td>${comparativeSummary.bestLocation}</td></tr>
            <tr><td>Best Location Avg Height</td><td>${comparativeSummary.bestLocationHeight}</td></tr>
            <tr><td>Best Treatment</td><td>${comparativeSummary.bestTreatment}</td></tr>
            <tr><td>Best Treatment Avg Height</td><td>${comparativeSummary.bestTreatmentHeight}</td></tr>
            <tr><td>Latest Observation Day</td><td>${comparativeSummary.latestDay}</td></tr>
            <tr><td>Total NPK</td><td>${comparativeSummary.totalNPK}</td></tr>
            <tr><td>Treatments Compared</td><td>${comparativeSummary.treatmentsCompared}</td></tr>
          </table>

          <h2>Data Quality Summary</h2>
          <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Average Core Metric Completeness</td><td>${dataQualitySummary.avgCoreCompleteness}%</td></tr>
            <tr><td>Strong Core Metrics</td><td>${dataQualitySummary.strongCoreMetrics}</td></tr>
            <tr><td>Weak Important Metrics</td><td>${dataQualitySummary.weakImportantMetrics}</td></tr>
          </table>

          <h2>Core Metric Completeness</h2>
          ${createHtmlTable(dataQualitySummary.coreRows, [
            "label",
            "available",
            "missing",
            "completeness",
            "usage",
          ])}

          <h2>Location Summary</h2>
          ${createHtmlTable(locationSummary, [
            "location",
            "records",
            "avgHeight",
            "avgTillers",
            "latestDay",
          ])}

          <h2>Top Treatment Ranking</h2>
          ${createHtmlTable(treatmentRanking, [
            "location",
            "treatment",
            "records",
            "avgHeight",
            "avgTillers",
            "avgLeaves",
          ])}

          <h2>Fertilizer Summary</h2>
          <table>
            <tr><th>Parameter</th><th>Total</th></tr>
            <tr><td>N kg</td><td>${fertilizerTotals.nitrogen}</td></tr>
            <tr><td>P2O5 kg</td><td>${fertilizerTotals.phosphorus}</td></tr>
            <tr><td>K2O kg</td><td>${fertilizerTotals.potassium}</td></tr>
            <tr><td>Urea kg</td><td>${fertilizerTotals.urea}</td></tr>
            <tr><td>DAP kg</td><td>${fertilizerTotals.dap}</td></tr>
            <tr><td>MAP kg</td><td>${fertilizerTotals.map}</td></tr>
            <tr><td>White Potash kg</td><td>${fertilizerTotals.potash}</td></tr>
          </table>

          <h2>Alert Summary</h2>
          <table>
            <tr><th>Alert Type</th><th>Count</th></tr>
            <tr><td>Low Growth Alerts</td><td>${alertSummary.lowGrowthCount}</td></tr>
            <tr><td>Weak Tillering Alerts</td><td>${alertSummary.weakTilleringCount}</td></tr>
            <tr><td>Total Alerts</td><td>${alertSummary.totalAlerts}</td></tr>
          </table>

          <div class="note">
            <strong>Methodology Note:</strong>
            This report is generated from processed official Excel survey records.
            Observation day is used as the main time axis because some original date
            fields are incomplete. Smart alerts are rule-based decision support
            indicators, not sensor-based predictions.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Monthly Dashboard Report</h2>
          <p>
            Summary report generated from biometric, treatment, fertigation,
            alert, comparative, and data quality records.
          </p>
        </div>

        <div className="toolbar-actions">
          <button className="report-btn" onClick={downloadSummaryCSV}>
            <Download size={16} />
            Download CSV
          </button>

          <button className="report-btn" onClick={printReport}>
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={<MapPin />}
          title="Locations"
          value={summary.locations}
          note="Selected report scope"
          variant="blue"
          imageSrc={kpiRepLoc}
        />

        <KpiCard
          icon={<Sprout />}
          title="Plots"
          value={summary.plots}
          note="Plots covered"
          variant="emerald"
          imageSrc={kpiRepPlots}
        />

        <KpiCard
          icon={<FlaskConical />}
          title="Treatments"
          value={summary.treatments}
          note="Treatment entries"
          variant="purple"
          imageSrc={kpiRepTreatments}
        />

        <KpiCard
          icon={<FileText />}
          title="Records"
          value={summary.biometricRecords}
          note="Biometric observations"
          variant="orange"
          imageSrc={kpiRepRecords}
        />

        <KpiCard
          icon={<CalendarDays />}
          title="Latest Day"
          value={summary.latestDay}
          note="Observation day"
          variant="blue"
          imageSrc={kpiRepLatest}
        />
      </section>

      <section className="report-grid">
        <div className="card report-overview-card">
          <div className="report-title-row">
            <div>
              <h3>Report Overview</h3>
              <p>
                Selected scope: <strong>{selectedLocationName}</strong>
              </p>
            </div>
            <FileText size={32} />
          </div>

          <div className="report-highlight-grid">
            <div>
              <span>Average Plant Height</span>
              <strong>{summary.avgHeight} cm</strong>
            </div>

            <div>
              <span>Average Tillers</span>
              <strong>{summary.avgTillers}</strong>
            </div>

            <div>
              <span>Fertigation Records</span>
              <strong>{summary.fertigationRecords}</strong>
            </div>

            <div>
              <span>Total Alerts</span>
              <strong>{alertSummary.totalAlerts}</strong>
            </div>
          </div>
        </div>

        <div className="card report-side-card">
          <h3>Alert Summary</h3>

          <div className="report-note-list">
            <div className="report-note warning">
              <strong>Low Growth Alerts</strong>
              <span>
                {alertSummary.lowGrowthCount} records are below the rule-based
                plant height threshold.
              </span>
            </div>

            <div className="report-note danger">
              <strong>Weak Tillering Alerts</strong>
              <span>
                {alertSummary.weakTilleringCount} records are below the
                rule-based tiller threshold.
              </span>
            </div>

            <div className="report-note success">
              <strong>Report Export</strong>
              <span>
                CSV download and print/PDF report export are available for
                monthly documentation.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="report-grid">
        <div className="card report-side-card">
          <h3>Comparative Analysis Summary</h3>

          <div className="report-note-list">
            <div className="report-note success">
              <strong>Best Location</strong>
              <span>
                {comparativeSummary.bestLocation} has the highest average plant
                height ({comparativeSummary.bestLocationHeight} cm).
              </span>
            </div>

            <div className="report-note warning">
              <strong>Best Treatment</strong>
              <span>
                {comparativeSummary.bestTreatment} has the highest treatment-wise
                average plant height ({comparativeSummary.bestTreatmentHeight} cm).
              </span>
            </div>

            <div className="report-note success">
              <strong>Nutrient Input</strong>
              <span>
                Total NPK recorded in the selected scope is{" "}
                {comparativeSummary.totalNPK} kg.
              </span>
            </div>
          </div>
        </div>

        <div className="card report-side-card">
          <h3>Data Quality Summary</h3>

          <div className="report-note-list">
            <div className="report-note success">
              <strong>Core Metric Quality</strong>
              <span>
                Average completeness of core biometric metrics is{" "}
                {dataQualitySummary.avgCoreCompleteness}%.
              </span>
            </div>

            <div className="report-note warning">
              <strong>Strong Metrics</strong>
              <span>
                {dataQualitySummary.strongCoreMetrics} core metrics have strong
                coverage and are suitable for dashboard calculations.
              </span>
            </div>

            <div className="report-note danger">
              <strong>Weak Metrics</strong>
              <span>
                {dataQualitySummary.weakImportantMetrics} important fields have
                weak coverage and are documented separately.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="card data-card wide-card">
        <div className="card-header">
          <div>
            <h3>Core Metric Completeness in Report</h3>
            <p>
              Data quality of important biometric fields used in dashboard
              calculations.
            </p>
          </div>
          <Database size={24} />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Column</th>
                <th>Available</th>
                <th>Missing</th>
                <th>Completeness</th>
                <th>Usage</th>
              </tr>
            </thead>

            <tbody>
              {dataQualitySummary.coreRows.map((row) => (
                <tr key={row.column}>
                  <td>{row.label}</td>
                  <td>{row.column}</td>
                  <td>{row.available}</td>
                  <td>{row.missing}</td>
                  <td>{row.completeness}%</td>
                  <td>{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card data-card wide-card">
        <div className="card-header">
          <div>
            <h3>Location-wise Summary</h3>
            <p>Average growth and observation coverage by location.</p>
          </div>
          <BarChart3 size={24} />
        </div>

        {locationSummary.length === 0 ? (
          <EmptyState
            title="No location summary"
            message="No location-wise records are available for the selected scope."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Records</th>
                  <th>Avg Height</th>
                  <th>Avg Tillers</th>
                  <th>Latest Day</th>
                </tr>
              </thead>

              <tbody>
                {locationSummary.map((row, index) => (
                  <tr key={index}>
                    <td>{row.location}</td>
                    <td>{row.records}</td>
                    <td>{row.avgHeight}</td>
                    <td>{row.avgTillers}</td>
                    <td>{row.latestDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card data-card wide-card">
        <div className="card-header">
          <div>
            <h3>Top Treatment Ranking</h3>
            <p>Ranked mainly using average plant height from biometric records.</p>
          </div>
        </div>

        {treatmentRanking.length === 0 ? (
          <EmptyState
            title="No treatment ranking"
            message="No treatment-wise biometric records are available for this selection."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Treatment</th>
                  <th>Records</th>
                  <th>Avg Height</th>
                  <th>Avg Tillers</th>
                  <th>Avg Leaves</th>
                </tr>
              </thead>

              <tbody>
                {treatmentRanking.map((row, index) => (
                  <tr key={index}>
                    <td>{row.location}</td>
                    <td>
                      <strong>{row.treatment}</strong>
                    </td>
                    <td>{row.records}</td>
                    <td>{row.avgHeight}</td>
                    <td>{row.avgTillers}</td>
                    <td>{row.avgLeaves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card wide-card">
        <div className="card-header">
          <div>
            <h3>Fertilizer Summary</h3>
            <p>Total fertilizer and nutrient values from fertigation records.</p>
          </div>
          <Droplets size={24} />
        </div>

        <div className="fertilizer-summary-grid">
          <div className="summary-tile">
            <span>N kg</span>
            <strong>{fertilizerTotals.nitrogen}</strong>
          </div>

          <div className="summary-tile">
            <span>P2O5 kg</span>
            <strong>{fertilizerTotals.phosphorus}</strong>
          </div>

          <div className="summary-tile">
            <span>K2O kg</span>
            <strong>{fertilizerTotals.potassium}</strong>
          </div>

          <div className="summary-tile">
            <span>Urea kg</span>
            <strong>{fertilizerTotals.urea}</strong>
          </div>

          <div className="summary-tile">
            <span>DAP kg</span>
            <strong>{fertilizerTotals.dap}</strong>
          </div>

          <div className="summary-tile">
            <span>MAP kg</span>
            <strong>{fertilizerTotals.map}</strong>
          </div>

          <div className="summary-tile">
            <span>White Potash kg</span>
            <strong>{fertilizerTotals.potash}</strong>
          </div>
        </div>
      </section>

      <section className="card wide-card">
        <div className="card-header">
          <div>
            <h3>Report Notes</h3>
            <p>Important explanation for project review and documentation.</p>
          </div>
          <Bell size={24} />
        </div>

        <div className="report-note-list">
          <div className="report-note success">
            <strong>Data Source</strong>
            <span>
              This report is generated from processed biometric, fertigation,
              plot, treatment, and fertilizer records.
            </span>
          </div>

          <div className="report-note warning">
            <strong>Observation Day</strong>
            <span>
              Observation day is used as the main time axis because some source
              sheets have incomplete date values.
            </span>
          </div>

          <div className="report-note danger">
            <strong>Smart Alerts</strong>
            <span>
              Alerts are rule-based support indicators and should be verified
              through field inspection.
            </span>
          </div>
        </div>
      </section>

      <MethodologyNote />
    </>
  );
}

function average(values) {
  if (!values || values.length === 0) return 0;

  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return Number((total / values.length).toFixed(2));
}

function sumColumn(rows, columnName) {
  const total = (rows || []).reduce((sum, row) => {
    const value = toFiniteMetricOrNull(row[columnName]);
    return value === null ? sum : sum + value;
  }, 0);

  return Number(total.toFixed(2));
}

function getColumnCompleteness(rows, columnName) {
  const total = rows.length;

  if (total === 0) {
    return {
      total: 0,
      available: 0,
      missing: 0,
      completeness: 0,
    };
  }

  const available = rows.filter((row) => hasValue(row[columnName])).length;
  const missing = total - available;

  return {
    total,
    available,
    missing,
    completeness: Number(((available / total) * 100).toFixed(1)),
  };
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "" && value !== "-";
}

function createHtmlTable(rows, columns) {
  if (!rows || rows.length === 0) {
    return "<p>No records available.</p>";
  }

  const header = columns
    .map((column) => `<th>${formatHeader(column)}</th>`)
    .join("");

  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${row[column] ?? "-"}</td>`)
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <table>
      <thead>
        <tr>${header}</tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
    </table>
  `;
}

function formatHeader(text) {
  return String(text)
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .replace(/^./, (char) => char.toUpperCase());
}

export default Reports;
