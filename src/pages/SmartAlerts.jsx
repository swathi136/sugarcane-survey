import { getLocationName } from "../utils/formatters";
import { useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Activity,
  ClipboardCheck,
  Droplets,
  SearchCheck,
} from "lucide-react";

import KpiCard from "../components/KpiCard";
import kpiSaTotalImg from "../assets/images/sa_total_alert.svg";
import kpiSaHighImg from "../assets/images/sa_high_alert.svg";
import kpiSaMediumImg from "../assets/images/sa_medium_alert.svg";
import kpiSaLowImg from "../assets/images/sa_low_alert.svg";
import kpiSaTypesImg from "../assets/images/sa_types_alert.svg";

function SmartAlerts({ data, selectedLocation }) {
  const [alertType, setAlertType] = useState("All");
  const serverAlerts = data.serverResultsByLocation?.[selectedLocation]?.smartAlerts?.alerts;

  const biometric = useMemo(() => {
    if (selectedLocation === "All") return data.biometric;
    return data.biometric.filter((row) => row.location_id === selectedLocation);
  }, [data.biometric, selectedLocation]);

  const fertigation = useMemo(() => {
    if (selectedLocation === "All") return data.fertigation;
    return data.fertigation.filter((row) => row.location_id === selectedLocation);
  }, [data.fertigation, selectedLocation]);

  const generatedAlerts = useMemo(() => {
    if (serverAlerts) return serverAlerts.map((alert, index) => ({ ...alert, id: `SERVER-${index + 1}` }));
    const alerts = [];

    // -------------------------------
    // 1. Low Growth Alert
    // -------------------------------
    const heightRows = biometric.filter(
      (row) => typeof row.plant_height_cm === "number"
    );

    if (heightRows.length > 0) {
      const avgHeight =
        heightRows.reduce((sum, row) => sum + row.plant_height_cm, 0) /
        heightRows.length;

      heightRows
        .filter((row) => row.plant_height_cm < avgHeight * 0.75)
        .slice(0, 20)
        .forEach((row, index) => {
          alerts.push({
            id: `LG-${index + 1}`,
            type: "Low Growth",
            priority: row.plant_height_cm < avgHeight * 0.6 ? "High" : "Medium",
            location: row.location_id,
            plot: row.plot_label || row.plot_id,
            treatment: row.treatment_id,
            message: `${row.plot_label || row.plot_id} shows low plant height compared to selected average.`,
            reason: `Plant height ${row.plant_height_cm} cm is below the expected average range.`,
            action: "Mark for field inspection and verify crop condition.",
          });
        });
    }

    // -------------------------------
    // 2. Weak Tillering Alert
    // -------------------------------
    const tillerRows = biometric.filter(
      (row) => typeof row.number_of_tillers === "number"
    );

    if (tillerRows.length > 0) {
      const avgTillers =
        tillerRows.reduce((sum, row) => sum + row.number_of_tillers, 0) /
        tillerRows.length;

      tillerRows
        .filter((row) => row.number_of_tillers < avgTillers * 0.7)
        .slice(0, 15)
        .forEach((row, index) => {
          alerts.push({
            id: `WT-${index + 1}`,
            type: "Weak Tillering",
            priority: "Medium",
            location: row.location_id,
            plot: row.plot_label || row.plot_id,
            treatment: row.treatment_id,
            message: `${row.plot_label || row.plot_id} has lower tiller count than average.`,
            reason: `Tillers count ${row.number_of_tillers} is below normal comparison level.`,
            action: "Review treatment response and field growth status.",
          });
        });
    }

    // -------------------------------
    // 3. Missing Latest Observation Alert
    // -------------------------------
    const latestDay =
      biometric.length > 0
        ? Math.max(...biometric.map((row) => row.observation_day || 0))
        : 0;

    const latestPlotSet = new Set(
      biometric
        .filter((row) => row.observation_day === latestDay)
        .map((row) => row.plot_id)
    );

    const relevantPlots =
      selectedLocation === "All"
        ? data.plots
        : data.plots.filter((plot) => plot.location_id === selectedLocation);

    relevantPlots.forEach((plot, index) => {
      if (!latestPlotSet.has(plot.plot_id)) {
        alerts.push({
          id: `ME-${index + 1}`,
          type: "Missing Entry",
          priority: "Low",
          location: plot.location_id,
          plot: plot.plot_name || plot.plot_id,
          treatment: plot.treatment_id,
          message: `${plot.plot_name || plot.plot_id} has no record for latest observation day.`,
          reason: `Latest available observation day is ${latestDay}, but this plot is not found.`,
          action: "Ask field official to verify and update monthly observation entry.",
        });
      }
    });

    // -------------------------------
    // 4. Fertigation Attention Alert
    // -------------------------------
    fertigation
      .filter((row) => {
        const nMissing = typeof row.n_kg !== "number" || row.n_kg === 0;
        const kMissing = typeof row.k2o_kg !== "number" || row.k2o_kg === 0;

        return nMissing && kMissing;
      })
      .slice(0, 15)
      .forEach((row, index) => {
        alerts.push({
          id: `FA-${index + 1}`,
          type: "Fertigation Attention",
          priority: "Medium",
          location: row.location_id,
          plot: row.plot_id,
          treatment: row.treatment_id,
          message: `Fertigation entry needs review for ${row.plot_id}.`,
          reason: `N and K₂O values are empty or zero for day ${row.day_after_planting}.`,
          action: "Check whether this is planned zero dose or data entry issue.",
        });
      });

    return alerts;
  }, [biometric, fertigation, data.plots, selectedLocation, serverAlerts]);

  const filteredAlerts = useMemo(() => {
    if (alertType === "All") return generatedAlerts;
    return generatedAlerts.filter((alert) => alert.type === alertType);
  }, [generatedAlerts, alertType]);

  const alertTypes = useMemo(() => {
    const types = new Set(generatedAlerts.map((alert) => alert.type));
    return ["All", ...Array.from(types)];
  }, [generatedAlerts]);

  const alertSummary = useMemo(() => {
    const high = generatedAlerts.filter((a) => a.priority === "High").length;
    const medium = generatedAlerts.filter((a) => a.priority === "Medium").length;
    const low = generatedAlerts.filter((a) => a.priority === "Low").length;

    return {
      total: generatedAlerts.length,
      high,
      medium,
      low,
      types: alertTypes.length - 1,
    };
  }, [generatedAlerts, alertTypes]);

  function priorityClass(priority) {
    return priority.toLowerCase();
  }

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Smart Alerts</h2>
          <p>
            Rule-based decision support generated from biometric and fertigation
            data.
          </p>
        </div>

        <div className="toolbar-actions">
          <select value={alertType} onChange={(e) => setAlertType(e.target.value)}>
            {alertTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Alert Types" : type}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={<Bell />}
          title="Total Alerts"
          value={alertSummary.total}
          note="Generated from rules"
          danger={alertSummary.total > 0}
        />

        <KpiCard
          icon={<AlertTriangle />}
          title="High Priority"
          value={alertSummary.high}
          note="Immediate attention"
          danger={alertSummary.high > 0}
        />

        <KpiCard
          icon={<Activity />}
          title="Medium Priority"
          value={alertSummary.medium}
          note="Needs monitoring"
          variant="orange"
        />

        <KpiCard
          icon={<ClipboardCheck />}
          title="Low Priority"
          value={alertSummary.low}
          note="Data verification"
          variant="blue"
        />

        <KpiCard
          icon={<SearchCheck />}
          title="Alert Types"
          value={alertSummary.types}
          note="Rule categories"
          variant="emerald"
        />
      </section>

      <section className="alert-summary-grid">
        <div className="alert-insight-card high-card">
          <AlertTriangle size={24} />
          <div>
            <h3>High Priority Logic</h3>
            <p>
              Triggered when plant height is far below selected location average.
            </p>
          </div>
        </div>

        <div className="alert-insight-card medium-card">
          <Droplets size={24} />
          <div>
            <h3>Fertigation Review Logic</h3>
            <p>
              Triggered when N and K₂O values are empty or zero in schedule rows.
            </p>
          </div>
        </div>

        <div className="alert-insight-card low-card">
          <ClipboardCheck size={24} />
          <div>
            <h3>Missing Entry Logic</h3>
            <p>
              Triggered when a plot is not found in the latest observation day.
            </p>
          </div>
        </div>
      </section>

      <div className="card data-card">
        <div className="card-header">
          <div>
            <h3>Generated Alert List</h3>
            <p>
              Alerts are generated from available field observation and
              fertigation records. They are not sensor-based.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Alert Type</th>
                <th>Location</th>
                <th>Plot</th>
                <th>Treatment</th>
                <th>Message</th>
                <th>Reason</th>
                <th>Recommended Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8">No alerts found for this selection.</td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span className={`priority ${priorityClass(alert.priority)}`}>
                        {alert.priority}
                      </span>
                    </td>
                    <td>{alert.type}</td>
                    <td>{getLocationName(alert.location, data.locations)}</td>
                    <td>{alert.plot}</td>
                    <td>{alert.treatment}</td>
                    <td>{alert.message}</td>
                    <td>{alert.reason}</td>
                    <td>{alert.action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default SmartAlerts;
