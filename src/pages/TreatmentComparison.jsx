import { useMemo } from "react";
import {
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
  Trophy,
  AlertTriangle,
  Activity,
  Sprout,
  TrendingUp,
} from "lucide-react";

import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import kpiTcBestImg from "../assets/images/kpi_tc_best_real.jpg";
import kpiTcWeakestImg from "../assets/images/kpi_tc_weakest_real.jpg";
import userMeasuringTapePlantHeight from "../assets/images/user_measuring_tape_plant_height.png";
import userSugarcaneTillerShoots from "../assets/images/user_sugarcane_tiller_shoots.png";
import kpiTcCountImg from "../assets/images/kpi_tc_count_real.jpg";
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

/* ── Premium Tooltips ─────────────────────────────────────────────── */
function HeightBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{`Treatment: ${label}`}</p>
      <p style={{ ...premiumTooltipItemStyle, color: "#10B981" }}>
        {`Avg Height: ${data.avgPlantHeight} cm`}
      </p>
      <p style={{ ...premiumTooltipItemStyle, color: "#94A3B8" }}>
        {`Record Count: ${data.recordCount}`}
      </p>
    </div>
  );
}

function TillersBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{`Treatment: ${label}`}</p>
      <p style={{ ...premiumTooltipItemStyle, color: "#8B5CF6" }}>
        {`Avg Tillers: ${data.avgTillers}`}
      </p>
      <p style={{ ...premiumTooltipItemStyle, color: "#94A3B8" }}>
        {`Record Count: ${data.recordCount}`}
      </p>
    </div>
  );
}

function TreatmentComparison({ data, selectedLocation }) {
  const biometric = useMemo(() => {
    if (!data || !Array.isArray(data.biometric)) return [];
    if (!selectedLocation || selectedLocation === "All" || selectedLocation === "all") return data.biometric;

    return data.biometric.filter(
      (row) => String(row.location_id) === String(selectedLocation)
    );
  }, [data, selectedLocation]);

  const treatmentData = useMemo(() => {
    if (!biometric || biometric.length === 0) return [];

    const grouped = {};

    biometric.forEach((row) => {
      const trKey = row.treatment_id || "Unspecified";

      if (!grouped[trKey]) {
        grouped[trKey] = {
          treatment: trKey,
          plantHeight: [],
          tillers: [],
          leaves: [],
          leafLength: [],
          leafBreadth: [],
          recordCount: 0,
        };
      }

      grouped[trKey].recordCount += 1;

      if (typeof row.plant_height_cm === "number" && !isNaN(row.plant_height_cm)) {
        grouped[trKey].plantHeight.push(row.plant_height_cm);
      }

      const tillerVal =
        typeof row.number_of_tillers === "number"
          ? row.number_of_tillers
          : typeof row.tillers_per_plant === "number"
          ? row.tillers_per_plant
          : typeof row.tillers === "number"
          ? row.tillers
          : null;

      if (tillerVal !== null && !isNaN(tillerVal)) {
        grouped[trKey].tillers.push(tillerVal);
      }

      if (typeof row.number_of_leaves === "number" && !isNaN(row.number_of_leaves)) {
        grouped[trKey].leaves.push(row.number_of_leaves);
      }

      if (typeof row.leaf_length_cm === "number" && !isNaN(row.leaf_length_cm)) {
        grouped[trKey].leafLength.push(row.leaf_length_cm);
      }

      if (typeof row.leaf_breadth_cm === "number" && !isNaN(row.leaf_breadth_cm)) {
        grouped[trKey].leafBreadth.push(row.leaf_breadth_cm);
      }
    });

    const averages = Object.values(grouped).map((row) => ({
      ...row,
      avgPlantHeight: average(row.plantHeight),
      avgTillers: average(row.tillers),
      avgLeaves: average(row.leaves),
      avgLeafLength: average(row.leafLength),
      avgLeafBreadth: average(row.leafBreadth),
    }));

    const maxHeight = maxValue(averages, "avgPlantHeight");
    const maxTillers = maxValue(averages, "avgTillers");
    const maxLeaves = maxValue(averages, "avgLeaves");
    const maxLeafLength = maxValue(averages, "avgLeafLength");
    const maxLeafBreadth = maxValue(averages, "avgLeafBreadth");

    return averages
      .map((row) => ({
        ...row,
        performanceScore: Number(
          (
            normalizedScore(row.avgPlantHeight, maxHeight) * 40 +
            normalizedScore(row.avgTillers, maxTillers) * 25 +
            normalizedScore(row.avgLeaves, maxLeaves) * 15 +
            normalizedScore(row.avgLeafLength, maxLeafLength) * 10 +
            normalizedScore(row.avgLeafBreadth, maxLeafBreadth) * 10
          ).toFixed(1)
        ),
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }, [biometric]);

  const kpis = useMemo(() => {
    if (treatmentData.length === 0) {
      return {
        bestTreatment: "-",
        weakestTreatment: "-",
        avgHeight: 0,
        avgTillers: 0,
        totalTreatments: 0,
      };
    }

    const bestTreatment = treatmentData[0];
    const weakestTreatment = treatmentData[treatmentData.length - 1];

    const avgHeight =
      treatmentData.reduce((sum, row) => sum + row.avgPlantHeight, 0) /
      treatmentData.length;

    const avgTillers =
      treatmentData.reduce((sum, row) => sum + row.avgTillers, 0) /
      treatmentData.length;

    return {
      bestTreatment: bestTreatment.treatment,
      weakestTreatment: weakestTreatment.treatment,
      avgHeight: Number(avgHeight.toFixed(1)),
      avgTillers: Number(avgTillers.toFixed(1)),
      totalTreatments: treatmentData.length,
    };
  }, [treatmentData]);

  const plantHeightChartData = useMemo(() => {
    return [...treatmentData].sort((a, b) => {
      const tA = Number(String(a.treatment).replace("T", ""));
      const tB = Number(String(b.treatment).replace("T", ""));
      return tA - tB;
    });
  }, [treatmentData]);

  const tillersChartData = useMemo(() => {
    return [...treatmentData].sort((a, b) => {
      const tA = Number(String(a.treatment).replace("T", ""));
      const tB = Number(String(b.treatment).replace("T", ""));
      return tA - tB;
    });
  }, [treatmentData]);

  function getPerformanceClass(score) {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 55) return "moderate";
    return "weak";
  }

  function getPerformanceLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Moderate";
    return "Needs Attention";
  }

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Treatment Comparison</h2>
          <p>
            Compare treatments using plant height, tillers, leaves, and leaf
            measurements.
          </p>
        </div>

        <div className="toolbar-note">
          <strong>{kpis.totalTreatments}</strong> treatments analyzed
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={<Trophy />}
          title="Best Treatment"
          value={kpis.bestTreatment}
          note="Highest performance score"
          variant="emerald"
          imageSrc={kpiTcBestImg}
        />

        <KpiCard
          icon={<AlertTriangle />}
          title="Weakest Treatment"
          value={kpis.weakestTreatment}
          note="Needs field review"
          danger
          imageSrc={kpiTcWeakestImg}
        />

        <KpiCard
          icon={<Activity />}
          title="Avg Plant Height"
          value={`${kpis.avgHeight} cm`}
          note="Treatment-level average"
          variant="orange"
          imageSrc={userMeasuringTapePlantHeight}
        />

        <KpiCard
          icon={<Sprout />}
          title="Avg Tillers"
          value={kpis.avgTillers}
          note="Treatment-level average"
          variant="purple"
          imageSrc={userSugarcaneTillerShoots}
        />

        <KpiCard
          icon={<TrendingUp />}
          title="Treatments"
          value={kpis.totalTreatments}
          note="Based on selected location"
          variant="blue"
          imageSrc={kpiTcCountImg}
        />
      </section>

      <section className="dashboard-grid">
        <ChartCard
          large
          title="Treatment-wise Plant Height"
          subtitle="Average plant height comparison across treatments."
        >
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={plantHeightChartData} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <PremiumBarDefs />
              </defs>
              <CartesianGrid {...premiumGridProps} />
              <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <Tooltip
                content={<HeightBarTooltip />}
                cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }}
              />
              <Bar
                dataKey="avgPlantHeight"
                shape={(props) => <PremiumBarShape {...props} />}
                isAnimationActive={true}
                animationBegin={80}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {plantHeightChartData.map((_, index) => (
                  <Cell
                    key={`cell-height-${index}`}
                    fill={LINE_COLORS[index % LINE_COLORS.length].stroke}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Treatment-wise Tillers"
          subtitle="Average tillers count comparison."
        >
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={tillersChartData} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <PremiumBarDefs />
              </defs>
              <CartesianGrid {...premiumGridProps} />
              <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <Tooltip
                content={<TillersBarTooltip />}
                cursor={{ fill: "rgba(16,185,129,0.05)", rx: 8 }}
              />
              <Bar
                dataKey="avgTillers"
                shape={(props) => <PremiumBarShape {...props} />}
                isAnimationActive={true}
                animationBegin={80}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {tillersChartData.map((_, index) => (
                  <Cell
                    key={`cell-tillers-${index}`}
                    fill={LINE_COLORS[(index + 2) % LINE_COLORS.length].stroke}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ── Detailed Table ── */}
      <section className="card card-table shadow-sm">
        <div className="card-header">
          <div>
            <h3>Detailed Treatment Performance Ranking</h3>
            <p>
              Ranked using performance score calculated from plant height,
              tillers, and leaves.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Treatment</th>
                <th>Performance</th>
                <th>Score</th>
                <th>Avg Height</th>
                <th>Avg Tillers</th>
                <th>Avg Leaves</th>
                <th>Leaf Length</th>
                <th>Leaf Breadth</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {treatmentData.map((row, index) => {
                const statusClass = getPerformanceClass(row.performanceScore);
                const statusLabel = getPerformanceLabel(row.performanceScore);

                return (
                  <tr key={row.treatment}>
                    <td>
                      <span className={`rank-badge rank-${index + 1}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>
                      <strong>{row.treatment}</strong>
                    </td>
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <strong>{row.performanceScore}</strong>
                    </td>
                    <td>{row.avgPlantHeight} cm</td>
                    <td>{row.avgTillers}</td>
                    <td>{row.avgLeaves}</td>
                    <td>{row.avgLeafLength} cm</td>
                    <td>{row.avgLeafBreadth} cm</td>
                    <td>{row.recordCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function average(values) {
  if (!values.length) return 0;
  return Number(
    (values.reduce((sum, value) => sum + Number(value), 0) / values.length).toFixed(2)
  );
}

function maxValue(rows, key) {
  const values = rows
    .map((row) => Number(row[key]))
    .filter((value) => !Number.isNaN(value));

  return values.length ? Math.max(...values) : 0;
}

function normalizedScore(value, max) {
  if (!max) return 0;
  return value / max;
}

export default TreatmentComparison;
