import { useEffect, useMemo, useState } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  MapPin,
  FileWarning,
  ClipboardCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import KpiCard from "../components/KpiCard";
import kpiDqBiometric from "../assets/images/dq_biometric.svg";
import kpiDqFertigation from "../assets/images/dq_fertigation.svg";
import kpiDqQuality from "../assets/images/dq_quality.svg";
import kpiDqStrong from "../assets/images/dq_strong.svg";
import kpiDqWeak from "../assets/images/dq_weak.svg";
import EmptyState from "../components/EmptyState";
import MethodologyNote from "../components/MethodologyNote";
import { getLocationName } from "../utils/formatters";
import { toFiniteMetricOrNull } from "../utils/metrics/toFiniteMetricOrNull";
import { loadDataQualityResults } from "../services/dashboardQueryService";
import {
  PremiumBarDefs,
  PremiumBarShape,
  premiumGridProps,
  premiumAxisTick,
  premiumTooltipStyle,
  premiumTooltipLabelStyle,
  premiumTooltipItemStyle,
  LINE_COLORS,
} from "../components/PremiumCharts";

/* ── Premium Tooltip ──────────────────────────────────────────────── */
function CompletenessTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color: LINE_COLORS[1].stroke }}>
        {payload[0].value}% completeness
      </p>
    </div>
  );
}

function DataQuality({ data, selectedLocation }) {
  const [serverView, setServerView] = useState(null);

  useEffect(() => {
    let active = true;
    setServerView(null);
    loadDataQualityResults(selectedLocation)
      .then((result) => { if (active) setServerView(result); })
      .catch((error) => { if (import.meta.env.DEV) console.error("Server data-quality query failed", error); });
    return () => { active = false; };
  }, [selectedLocation]);
  const biometric = useMemo(() => {
    if (selectedLocation === "All") return data.biometric || [];

    return (data.biometric || []).filter(
      (row) => row.location_id === selectedLocation
    );
  }, [data.biometric, selectedLocation]);

  const fertigation = useMemo(() => {
    if (selectedLocation === "All") return data.fertigation || [];

    return (data.fertigation || []).filter(
      (row) => row.location_id === selectedLocation
    );
  }, [data.fertigation, selectedLocation]);

  const selectedLocationName =
    selectedLocation === "All"
      ? "All Locations"
      : getLocationName(selectedLocation, data.locations || []);

  const biometricColumns = [
    "location_id",
    "plot_id",
    "treatment_id",
    "replication",
    "plot_label",
    "observation_day",
    "date_of_observation",
    "plant_count_1m",
    "plant_count_5m",
    "plant_count_15m",
    "number_of_tillers",
    "number_of_leaves",
    "plant_height_cm",
    "leaf_length_cm",
    "leaf_breadth_cm",
    "number_of_node",
    "node_length_cm",
    "millable_cane_count",
    "cane_girth_cm",
    "germination_pct",
  ];

  const fertigationColumns = [
    "location_id",
    "plot_id",
    "treatment_id",
    "day_after_planting",
    "date",
    "n_kg",
    "p2o5_kg",
    "k2o_kg",
    "urea_kg",
    "dap_kg",
    "map_kg",
    "white_potash_kg",
    "mn_mixture_kg",
  ];

  const biometricCompleteness = useMemo(() => {
    if (serverView?.biometricColumns) return serverView.biometricColumns.map((row) => ({ ...row, label: formatColumnName(row.column), status: getStatus(row.completeness) }));
    return calculateCompleteness(biometric, biometricColumns);
  }, [biometric, serverView]);

  const fertigationCompleteness = useMemo(() => {
    if (serverView?.fertigationColumns) return serverView.fertigationColumns.map((row) => ({ ...row, label: formatColumnName(row.column), status: getStatus(row.completeness) }));
    return calculateCompleteness(fertigation, fertigationColumns);
  }, [fertigation, serverView]);

  const coreMetricSummary = useMemo(() => {
    const coreMetrics = [
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
        usage: "Leaf development support metric",
      },
      {
        column: "leaf_length_cm",
        label: "Leaf Length",
        usage: "Leaf development support metric",
      },
      {
        column: "leaf_breadth_cm",
        label: "Leaf Breadth",
        usage: "Leaf development support metric",
      },
      {
        column: "observation_day",
        label: "Observation Day",
        usage: "Main time axis",
      },
    ];

    return coreMetrics.map((metric) => {
      const serverMetric = serverView?.biometricColumns?.find((row) => row.column === metric.column);
      if (serverMetric) return { ...metric, ...serverMetric, status: getStatus(serverMetric.completeness) };
      const result = calculateSingleColumnCompleteness(
        biometric,
        metric.column
      );

      return {
        ...metric,
        ...result,
        status: getStatus(result.completeness),
      };
    });
  }, [biometric, serverView]);

  const weakMetricSummary = useMemo(() => {
    const weakMetrics = [
      {
        column: "date_of_observation",
        label: "Date of Observation",
        reason: "Incomplete in some source sheets. Observation day is preferred.",
      },
      {
        column: "cane_girth_cm",
        label: "Cane Girth",
        reason: "Currently not available in processed biometric records.",
      },
      {
        column: "germination_pct",
        label: "Germination %",
        reason: "Currently not available in processed biometric records.",
      },
      {
        column: "millable_cane_count",
        label: "Millable Cane Count",
        reason: "Very limited coverage. Use later when more data is available.",
      },
      {
        column: "plant_count_1m",
        label: "Plant Count 1m",
        reason: "Limited coverage. Not used in main dashboard KPIs.",
      },
    ];

    return weakMetrics.map((metric) => {
      const serverMetric = serverView?.biometricColumns?.find((row) => row.column === metric.column);
      if (serverMetric) return { ...metric, ...serverMetric, status: getStatus(serverMetric.completeness) };
      const result = calculateSingleColumnCompleteness(
        biometric,
        metric.column
      );

      return {
        ...metric,
        ...result,
        status: getStatus(result.completeness),
      };
    });
  }, [biometric, serverView]);

  const locationCoverage = useMemo(() => {
    if (serverView?.locationCoverage) return serverView.locationCoverage.map((row) => ({
      location: getLocationName(row.locationId, data.locations || []),
      records: row.records,
      heightCompleteness: row.heightCompleteness,
      tillersCompleteness: row.tillersCompleteness,
      leavesCompleteness: row.leavesCompleteness,
      latestDay: row.latestDay,
    }));
    const grouped = {};

    biometric.forEach((row) => {
      const locationId = row.location_id;
      if (!locationId) return;

      if (!grouped[locationId]) {
        grouped[locationId] = {
          location_id: locationId,
          records: 0,
          heightAvailable: 0,
          tillersAvailable: 0,
          leavesAvailable: 0,
          latestDay: 0,
        };
      }

      grouped[locationId].records += 1;

      if (hasValue(row.plant_height_cm)) grouped[locationId].heightAvailable += 1;
      if (hasValue(row.number_of_tillers))
        grouped[locationId].tillersAvailable += 1;
      if (hasValue(row.number_of_leaves))
        grouped[locationId].leavesAvailable += 1;

      const day = toFiniteMetricOrNull(row.observation_day);
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
      heightCompleteness: percentage(item.heightAvailable, item.records),
      tillersCompleteness: percentage(item.tillersAvailable, item.records),
      leavesCompleteness: percentage(item.leavesAvailable, item.records),
      latestDay: item.latestDay,
    }));
  }, [biometric, data.locations, serverView]);

  const summary = useMemo(() => {
    if (serverView?.summary) return serverView.summary;
    const biometricAvg = average(
      biometricCompleteness.map((item) => item.completeness)
    );

    const fertigationAvg = average(
      fertigationCompleteness.map((item) => item.completeness)
    );

    const strongColumns = biometricCompleteness.filter(
      (item) => item.completeness >= 70
    ).length;

    const weakColumns = biometricCompleteness.filter(
      (item) => item.completeness < 40
    ).length;

    return {
      biometricRecords: biometric.length,
      fertigationRecords: fertigation.length,
      biometricCompleteness: biometricAvg,
      fertigationCompleteness: fertigationAvg,
      strongColumns,
      weakColumns,
    };
  }, [biometric, fertigation, biometricCompleteness, fertigationCompleteness, serverView]);

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Data Quality & Completeness</h2>
          <p>
            Data coverage analysis for biometric observations and fertigation
            records.
          </p>
        </div>

        <div className="quality-scope-badge">
          <MapPin size={16} />
          {selectedLocationName}
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={<Database />}
          title="Biometric Records"
          value={summary.biometricRecords}
          note="Rows used for growth analysis"
          variant="blue"
          imageSrc={kpiDqBiometric}
        />

        <KpiCard
          icon={<ClipboardCheck />}
          title="Fertigation Records"
          value={summary.fertigationRecords}
          note="Rows used for nutrient tracking"
          variant="purple"
          imageSrc={kpiDqFertigation}
        />

        <KpiCard
          icon={<CheckCircle2 />}
          title="Biometric Quality"
          value={`${summary.biometricCompleteness}%`}
          note="Average column completeness"
          variant="emerald"
          imageSrc={kpiDqQuality}
        />

        <KpiCard
          icon={<BarChart3 />}
          title="Strong Columns"
          value={summary.strongColumns}
          note="Columns with 70%+ coverage"
          variant="orange"
          imageSrc={kpiDqStrong}
        />

        <KpiCard
          icon={<FileWarning />}
          title="Weak Columns"
          value={summary.weakColumns}
          note="Columns below 40% coverage"
          danger={summary.weakColumns > 0}
          imageSrc={kpiDqWeak}
        />
      </section>

      <section className="quality-grid">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3>Core Biometric Metric Completeness</h3>
              <p>
                These columns are used in main growth charts, treatment ranking,
                and alert logic.
              </p>
            </div>
          </div>

          {coreMetricSummary.length === 0 ? (
            <EmptyState
              title="No metric completeness data"
              message="No biometric records are available for this selected scope."
            />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={coreMetricSummary} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
                <defs>
                  <PremiumBarDefs />
                </defs>
                <CartesianGrid {...premiumGridProps} />
                <XAxis dataKey="label" tick={{ ...premiumAxisTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={premiumAxisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<CompletenessTooltip />}
                  cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }}
                />
                <Bar
                  dataKey="completeness"
                  shape={(props) => <PremiumBarShape {...props} />}
                  isAnimationActive={true}
                  animationBegin={80}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {coreMetricSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card quality-side-card">
          <div className="card-header">
            <div>
              <h3>Data Usage Decision</h3>
              <p>How the dashboard decides which fields are reliable.</p>
            </div>
          </div>

          <div className="quality-decision-list">
            <div className="quality-decision success">
              <CheckCircle2 size={20} />
              <div>
                <strong>Used in Main Dashboard</strong>
                <span>
                  Plant height, tillers, leaves, leaf length, leaf breadth, and
                  observation day.
                </span>
              </div>
            </div>

            <div className="quality-decision warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Used Carefully</strong>
                <span>
                  Fertigation product fields are treated as N/A where values are
                  not applicable.
                </span>
              </div>
            </div>

            <div className="quality-decision danger">
              <XCircle size={20} />
              <div>
                <strong>Not Used for Core KPIs</strong>
                <span>
                  Cane girth, germination percentage, and very sparse plant count
                  fields are excluded from main calculations.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card data-card wide-card">
        <div className="card-header">
          <div>
            <h3>Core Metric Completeness Table</h3>
            <p>Completeness of important columns used in dashboard analytics.</p>
          </div>
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
                <th>Status</th>
                <th>Usage</th>
              </tr>
            </thead>

            <tbody>
              {coreMetricSummary.map((row) => (
                <tr key={row.column}>
                  <td>{row.label}</td>
                  <td>{row.column}</td>
                  <td>{row.available}</td>
                  <td>{row.missing}</td>
                  <td>{row.completeness}%</td>
                  <td>
                    <span className={`quality-badge ${row.status.className}`}>
                      {row.status.label}
                    </span>
                  </td>
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
            <h3>Weak / Excluded Metric Explanation</h3>
            <p>
              These columns are documented clearly so reviewers understand why
              they are not used in main calculations.
            </p>
          </div>
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
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>
              {weakMetricSummary.map((row) => (
                <tr key={row.column}>
                  <td>{row.label}</td>
                  <td>{row.column}</td>
                  <td>{row.available}</td>
                  <td>{row.missing}</td>
                  <td>{row.completeness}%</td>
                  <td>
                    <span className={`quality-badge ${row.status.className}`}>
                      {row.status.label}
                    </span>
                  </td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card data-card wide-card">
        <div className="card-header">
          <div>
            <h3>Location-wise Data Coverage</h3>
            <p>
              Compares data availability for plant height, tillers, and leaves by
              location.
            </p>
          </div>
        </div>

        {locationCoverage.length === 0 ? (
          <EmptyState
            title="No location coverage data"
            message="No biometric records are available for this selected scope."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Records</th>
                  <th>Height Coverage</th>
                  <th>Tillers Coverage</th>
                  <th>Leaves Coverage</th>
                  <th>Latest Observation Day</th>
                </tr>
              </thead>

              <tbody>
                {locationCoverage.map((row) => (
                  <tr key={row.location}>
                    <td>{row.location}</td>
                    <td>{row.records}</td>
                    <td>{row.heightCompleteness}%</td>
                    <td>{row.tillersCompleteness}%</td>
                    <td>{row.leavesCompleteness}%</td>
                    <td>{row.latestDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="quality-explanation-card">
        <div>
          <h3>Project Explanation</h3>
          <p>
            This page validates the quality of the processed dataset before
            visualization. Since agricultural field data can contain incomplete
            values, the dashboard separates reliable metrics from weak metrics.
            Core visualizations use fields with meaningful coverage, while sparse
            fields are documented and excluded from main KPI calculations.
          </p>
        </div>
      </section>

      <MethodologyNote />
    </>
  );
}

function calculateCompleteness(rows, columns) {
  return columns.map((column) => {
    const result = calculateSingleColumnCompleteness(rows, column);

    return {
      column,
      label: formatColumnName(column),
      ...result,
      status: getStatus(result.completeness),
    };
  });
}

function calculateSingleColumnCompleteness(rows, column) {
  const total = rows.length;

  if (total === 0) {
    return {
      total: 0,
      available: 0,
      missing: 0,
      completeness: 0,
    };
  }

  const available = rows.filter((row) => hasValue(row[column])).length;
  const missing = total - available;

  return {
    total,
    available,
    missing,
    completeness: percentage(available, total),
  };
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "" && value !== "-";
}

function percentage(value, total) {
  if (!total || total === 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function average(values) {
  if (!values || values.length === 0) return 0;

  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return Number((total / values.length).toFixed(1));
}

function getStatus(completeness) {
  if (completeness >= 70) {
    return {
      label: "Strong",
      className: "strong",
    };
  }

  if (completeness >= 40) {
    return {
      label: "Moderate",
      className: "moderate",
    };
  }

  return {
    label: "Weak",
    className: "weak",
  };
}

function formatColumnName(column) {
  return String(column)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default DataQuality;
