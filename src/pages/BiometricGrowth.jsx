import EmptyState from "../components/EmptyState";
import { getLocationName } from "../utils/formatters";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Activity,
  Leaf,
  Ruler,
  Sprout,
  TrendingUp,
} from "lucide-react";

import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import kpiBioAvgImg from "../assets/images/kpi_bio_avg_real.jpg";
import kpiBioHighestImg from "../assets/images/kpi_bio_highest_real.jpg";
import kpiBioLowestImg from "../assets/images/kpi_bio_lowest_real.jpg";
import kpiBioBestImg from "../assets/images/kpi_bio_best_real.jpg";
import kpiBioLatestImg from "../assets/images/kpi_bio_latest_real.jpg";
import {
  PremiumBarDefs,
  PremiumBarShape,
  PremiumLineDefs,
  LINE_COLORS,
  premiumGridProps,
  premiumAxisTick,
  premiumTooltipStyle,
  premiumTooltipLabelStyle,
  premiumTooltipItemStyle,
  premiumDot,
  premiumActiveDot,
} from "../components/PremiumCharts";

/* ── Custom Tooltips ─────────────────────────────────────────────── */
function BiometricLineTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  const color = LINE_COLORS[0].stroke;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color }}>
        {payload[0].value}{" "}
        <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>{unit || ""}</span>
      </p>
    </div>
  );
}

function BiometricBarTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  const color = LINE_COLORS[3].stroke;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color }}>
        {payload[0].value}{" "}
        <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>{unit || ""}</span>
      </p>
    </div>
  );
}

const metricOptions = [
  { key: "plant_height_cm", label: "Plant Height", unit: "cm", icon: <Ruler /> },
  { key: "number_of_tillers", label: "Number of Tillers", unit: "", icon: <Sprout /> },
  { key: "number_of_leaves", label: "Number of Leaves", unit: "", icon: <Leaf /> },
  { key: "leaf_length_cm", label: "Leaf Length", unit: "cm", icon: <Activity /> },
  { key: "leaf_breadth_cm", label: "Leaf Breadth", unit: "cm", icon: <TrendingUp /> },
];

function BiometricGrowth({ data, selectedLocation }) {
  const [metric, setMetric] = useState("plant_height_cm");
  const [selectedTreatment, setSelectedTreatment] = useState("All");

  const selectedMetric = metricOptions.find((item) => item.key === metric);

  const locationFilteredData = useMemo(() => {
    if (selectedLocation === "All") return data.biometric;

    return data.biometric.filter(
      (row) => row.location_id === selectedLocation
    );
  }, [data.biometric, selectedLocation]);

  const treatmentOptions = useMemo(() => {
    const treatments = new Set(
      locationFilteredData.map((row) => row.treatment_id).filter(Boolean)
    );

    return ["All", ...Array.from(treatments).sort((a, b) => {
      const numA = Number(String(a).replace("T", ""));
      const numB = Number(String(b).replace("T", ""));
      return numA - numB;
    })];
  }, [locationFilteredData]);

  const filteredData = useMemo(() => {
    if (selectedTreatment === "All") return locationFilteredData;

    return locationFilteredData.filter(
      (row) => row.treatment_id === selectedTreatment
    );
  }, [locationFilteredData, selectedTreatment]);

  const validMetricRows = useMemo(() => {
    return filteredData.filter((row) => typeof row[metric] === "number");
  }, [filteredData, metric]);

  const metricSummary = useMemo(() => {
    if (validMetricRows.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        latestDay: 0,
        totalRecords: 0,
      };
    }

    const values = validMetricRows.map((row) => row[metric]);
    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const latestDay = Math.max(
      ...validMetricRows.map((row) => row.observation_day || 0)
    );

    return {
      average: Number(average.toFixed(2)),
      highest: Number(Math.max(...values).toFixed(2)),
      lowest: Number(Math.min(...values).toFixed(2)),
      latestDay,
      totalRecords: validMetricRows.length,
    };
  }, [validMetricRows, metric]);

  const trendData = useMemo(() => {
    const grouped = {};

    validMetricRows.forEach((row) => {
      const day = row.observation_day;

      if (!grouped[day]) {
        grouped[day] = {
          total: 0,
          count: 0,
        };
      }

      grouped[day].total += row[metric];
      grouped[day].count += 1;
    });

    return Object.entries(grouped)
      .map(([day, value]) => ({
        day: `${day} Day`,
        observationDay: Number(day),
        value: Number((value.total / value.count).toFixed(2)),
      }))
      .sort((a, b) => a.observationDay - b.observationDay);
  }, [validMetricRows, metric]);

  const treatmentComparisonData = useMemo(() => {
    const grouped = {};

    locationFilteredData.forEach((row) => {
      if (typeof row[metric] !== "number") return;

      if (!grouped[row.treatment_id]) {
        grouped[row.treatment_id] = {
          treatment: row.treatment_id,
          total: 0,
          count: 0,
        };
      }

      grouped[row.treatment_id].total += row[metric];
      grouped[row.treatment_id].count += 1;
    });

    return Object.values(grouped)
      .map((item) => ({
        treatment: item.treatment,
        value: Number((item.total / item.count).toFixed(2)),
      }))
      .sort((a, b) => {
        const numA = Number(String(a.treatment).replace("T", ""));
        const numB = Number(String(b.treatment).replace("T", ""));
        return numA - numB;
      });
  }, [locationFilteredData, metric]);

  const latestTableRows = useMemo(() => {
    const latestDay = metricSummary.latestDay;

    return validMetricRows
      .filter((row) => row.observation_day === latestDay)
      .sort((a, b) => {
        const tA = Number(String(a.treatment_id).replace("T", ""));
        const tB = Number(String(b.treatment_id).replace("T", ""));
        return tA - tB;
      })
      .slice(0, 30);
  }, [validMetricRows, metricSummary.latestDay]);

  const bestTreatment = useMemo(() => {
    if (treatmentComparisonData.length === 0) return "-";

    const best = [...treatmentComparisonData].sort(
      (a, b) => b.value - a.value
    )[0];

    return best?.treatment || "-";
  }, [treatmentComparisonData]);

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Biometric Growth Analysis</h2>
          <p>
            Analyze sugarcane growth trends using official field observation data.
          </p>
        </div>

        <div className="toolbar-actions">
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {metricOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value)}
          >
            {treatmentOptions.map((treatment) => (
              <option key={treatment} value={treatment}>
                {treatment === "All" ? "All Treatments" : treatment}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={selectedMetric.icon}
          title={`Average ${selectedMetric.label}`}
          value={`${metricSummary.average} ${selectedMetric.unit}`}
          note="Based on available records"
          variant="orange"
          imageSrc={kpiBioAvgImg}
        />

        <KpiCard
          icon={<TrendingUp />}
          title="Highest Value"
          value={`${metricSummary.highest} ${selectedMetric.unit}`}
          note="Maximum observed value"
          variant="emerald"
          imageSrc={kpiBioHighestImg}
        />

        <KpiCard
          icon={<Activity />}
          title="Lowest Value"
          value={`${metricSummary.lowest} ${selectedMetric.unit}`}
          note="Minimum observed value"
          variant="blue"
          imageSrc={kpiBioLowestImg}
        />

        <KpiCard
          icon={<Sprout />}
          title="Best Treatment"
          value={bestTreatment}
          note={`By ${selectedMetric.label}`}
          variant="purple"
          imageSrc={kpiBioBestImg}
        />

        <KpiCard
          icon={<Leaf />}
          title="Latest Observation"
          value={`${metricSummary.latestDay} Day`}
          note={`${metricSummary.totalRecords} usable records`}
          variant="emerald"
          imageSrc={kpiBioLatestImg}
        />
      </section>

      <section className="dashboard-grid">
        <ChartCard
          large
          title={`${selectedMetric.label} Growth Trend`}
          subtitle="Average value by observation day. This uses observation day instead of date because date coverage is incomplete."
        >
          {trendData.length === 0 ? (
            <EmptyState
              title="No biometric trend data"
              message="No biometric records are available for the selected metric and location."
            />
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <PremiumLineDefs />
                  <linearGradient id="bioAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#4F7CFF" stopOpacity={0.18} />
                    <stop offset="60%"  stopColor="#4F7CFF" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#4F7CFF" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...premiumGridProps} />
                <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  content={
                    <BiometricLineTooltip unit={selectedMetric.unit} />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={LINE_COLORS[0].stroke}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  filter="url(#lgf0)"
                  dot={premiumDot(LINE_COLORS[0].dot)}
                  activeDot={premiumActiveDot(LINE_COLORS[0].dot)}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Treatment-wise Comparison"
          subtitle={`Average ${selectedMetric.label} by treatment.`}
        >
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={treatmentComparisonData} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <PremiumBarDefs />
              </defs>
              <CartesianGrid {...premiumGridProps} />
              <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <Tooltip
                content={<BiometricBarTooltip unit={selectedMetric.unit} />}
                cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }}
              />
              <Bar
                dataKey="value"
                shape={(props) => <PremiumBarShape {...props} />}
                isAnimationActive={true}
                animationBegin={80}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {treatmentComparisonData.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card data-card wide-card">
          <div className="card-header">
            <div>
              <h3>Latest Observation Records</h3>
              <p>
                Showing latest available records for {selectedMetric.label}.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Plot ID</th>
                  <th>Plot Label</th>
                  <th>Treatment</th>
                  <th>Observation Day</th>
                  <th>{selectedMetric.label}</th>
                  <th>Source Sheet</th>
                </tr>
              </thead>

              <tbody>
                {latestTableRows.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="No biometric records"
                        message="No latest biometric records are available for this selection."
                      />
                    </td>
                  </tr>
                ) : (
                  latestTableRows.map((row, index) => (
                    <tr key={index}>
                      <td>{getLocationName(row.location_id, data.locations)}</td>
                      <td>{row.plot_id}</td>
                      <td>{row.plot_label}</td>
                      <td>{row.treatment_id}</td>
                      <td>{row.observation_day}</td>
                      <td>
                        {row[metric]} {selectedMetric.unit}
                      </td>
                      <td>{row.source_sheet}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

export default BiometricGrowth;