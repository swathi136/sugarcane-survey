import EmptyState from "../components/EmptyState";
import kpiMapImg from "../assets/images/kpi_map.png";
import kpiSugarcaneImg from "../assets/images/kpi_sugarcane.png";
import kpiFertilizerImg from "../assets/images/kpi_fertilizer.png";
import kpiPlantHeightImg from "../assets/images/kpi_plant_height.png";
import kpiAlertImg from "../assets/images/kpi_alert.png";
import MethodologyNote from "../components/MethodologyNote";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  Cell,
} from "recharts";
import {
  MapPin,
  Sprout,
  FlaskConical,
  Activity,
  Bell,
} from "lucide-react";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import {
  PremiumBarDefs,
  PremiumBarShape,
  PREMIUM_GRADIENTS,
  premiumGridProps,
  premiumAxisTick,
  premiumTooltipStyle,
  premiumTooltipLabelStyle,
  premiumTooltipItemStyle,
  premiumDot,
  premiumActiveDot,
} from "../components/PremiumCharts";

/* ── Custom Tooltip Components ─────────────────────────────────── */
function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color: "#064E3B" }}>
        {payload[0].value} <span style={{ fontWeight: 600, fontSize: 12, color: "#064E3B" }}>cm avg height</span>
      </p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color: "#1A5C38" }}>
        {payload[0].value} <span style={{ fontWeight: 500, fontSize: 12, color: "#6B8A6B" }}>cm avg height</span>
      </p>
    </div>
  );
}

function Overview({ data, selectedLocation }) {
  const biometric = useMemo(() => {
    if (selectedLocation === "All") return data.biometric;
    return data.biometric.filter((row) => row.location_id === selectedLocation);
  }, [data.biometric, selectedLocation]);

  const kpis = useMemo(() => {
    const validHeightRows = biometric.filter(
      (row) => typeof row.plant_height_cm === "number"
    );

    const avgHeight =
      validHeightRows.length > 0
        ? (
            validHeightRows.reduce((sum, row) => sum + row.plant_height_cm, 0) /
            validHeightRows.length
          ).toFixed(1)
        : 0;

    const latestDay =
      biometric.length > 0
        ? Math.max(...biometric.map((row) => row.observation_day || 0))
        : 0;

    const treatments = new Set(
      biometric.map((row) => row.treatment_id).filter(Boolean)
    );

    const locationPlots =
      selectedLocation === "All"
        ? data.plots || []
        : (data.plots || []).filter(
            (plot) => plot.location_id === selectedLocation
          );
    const plots = new Set(
      locationPlots.map((plot) => plot.plot_id).filter(Boolean)
    );

    const avg =
      validHeightRows.length > 0
        ? validHeightRows.reduce((sum, row) => sum + row.plant_height_cm, 0) /
          validHeightRows.length
        : 0;

    const alerts = validHeightRows.filter(
      (row) => row.plant_height_cm < avg * 0.75
    );

    return {
      totalLocations: data.locations.length,
      totalPlots: plots.size,
      totalTreatments: treatments.size,
      avgHeight,
      latestDay,
      openAlerts: alerts.length,
    };
  }, [biometric, data.locations, data.plots, selectedLocation]);

  const locationHeightData = useMemo(() => {
    const grouped = {};

    data.biometric.forEach((row) => {
      if (typeof row.plant_height_cm !== "number") return;

      if (!grouped[row.location_id]) {
        grouped[row.location_id] = { total: 0, count: 0 };
      }

      grouped[row.location_id].total += row.plant_height_cm;
      grouped[row.location_id].count += 1;
    });

    return Object.entries(grouped).map(([locationId, value]) => {
      const location = data.locations.find((loc) => loc.location_id === locationId);

      return {
        location: location?.location_short_name || locationId,
        avgPlantHeight: Number((value.total / value.count).toFixed(1)),
      };
    });
  }, [data.biometric, data.locations]);

  const growthTrendData = useMemo(() => {
    const grouped = {};

    biometric.forEach((row) => {
      if (typeof row.plant_height_cm !== "number") return;

      const day = row.observation_day;

      if (!grouped[day]) {
        grouped[day] = { total: 0, count: 0 };
      }

      grouped[day].total += row.plant_height_cm;
      grouped[day].count += 1;
    });

    return Object.entries(grouped)
      .map(([day, value]) => ({
        day: `${day} Day`,
        avgPlantHeight: Number((value.total / value.count).toFixed(1)),
      }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [biometric]);

  const topTreatmentsData = useMemo(() => {
    const grouped = {};

    biometric.forEach((row) => {
      if (typeof row.plant_height_cm !== "number") return;

      const key = row.treatment_id;

      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0 };
      }

      grouped[key].total += row.plant_height_cm;
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .map(([treatment, value]) => ({
        treatment,
        avgPlantHeight: Number((value.total / value.count).toFixed(1)),
      }))
      .sort((a, b) => b.avgPlantHeight - a.avgPlantHeight)
      .slice(0, 5);
  }, [biometric]);

  return (
    <>
      {/* ── KPI Cards ─────────────────────────────────────── */}
      <section className="kpi-grid">
        <KpiCard
          icon={<MapPin size={20} />}
          title="Total Locations"
          value={kpis.totalLocations}
          note="College, Athani, Anthiyur"
          variant="blue"
          imageSrc={kpiMapImg}
        />
        <KpiCard
          icon={<Sprout size={20} />}
          title="Active Plots"
          value={kpis.totalPlots}
          note="Mapped from plot master"
          variant="emerald"
          imageSrc={kpiSugarcaneImg}
        />
        <KpiCard
          icon={<FlaskConical size={20} />}
          title="Treatments"
          value={kpis.totalTreatments}
          note="Location-wise treatment set"
          variant="purple"
          imageSrc={kpiFertilizerImg}
        />
        <KpiCard
          icon={<Activity size={20} />}
          title="Avg Plant Height"
          value={`${kpis.avgHeight} cm`}
          note="Based on available readings"
          variant="orange"
          imageSrc={kpiPlantHeightImg}
        />
        <KpiCard
          icon={<Bell size={20} />}
          title="Open Alerts"
          value={kpis.openAlerts}
          note={`Latest observation: ${kpis.latestDay} day`}
          danger
          imageSrc={kpiAlertImg}
        />
      </section>

      {/* ── Growth Trend Hero Chart ───────────────────────────── */}
      <section className="overview-hero-chart">
        <ChartCard
          title="Growth Trend by Observation Day"
          subtitle="Average plant height across selected location."
        >
          {growthTrendData.length === 0 ? (
            <EmptyState
              title="No growth trend data"
              message="No plant height records are available for the selected location."
            />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={growthTrendData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10B981" stopOpacity={0.24} />
                    <stop offset="60%"  stopColor="#22C55E" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#1A5C38" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid {...premiumGridProps} />
                <XAxis
                  dataKey="day"
                  tick={premiumAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={premiumAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avgPlantHeight"
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={premiumDot("#10B981")}
                  activeDot={premiumActiveDot("#10B981")}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* ── Perfectly Aligned 2-Column Split Grid ────────────── */}
      <section className="overview-split-grid">
        {/* Location Performance — Gradient Bars */}
        <ChartCard
          title="Location-wise Performance"
          subtitle="Average plant height comparison."
        >
          {locationHeightData.length === 0 ? (
            <EmptyState
              title="No location performance data"
              message="No average plant height records are available for this selection."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationHeightData} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="30%">
                <defs>
                  <PremiumBarDefs />
                </defs>
                <CartesianGrid {...premiumGridProps} />
                <XAxis
                  dataKey="location"
                  tick={premiumAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={premiumAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: "rgba(16,185,129,0.05)", rx: 8 }}
                />
                <Bar
                  dataKey="avgPlantHeight"
                  shape={(props) => <PremiumBarShape {...props} />}
                  isAnimationActive={true}
                  animationBegin={80}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {locationHeightData.map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top Treatments Ranking */}
        <div className="card overview-ranking-card">
          <div className="card-header">
            <div>
              <h3>Top Treatments</h3>
              <p>Ranked by average plant height.</p>
            </div>
          </div>

          <div className="ranking-list">
            {topTreatmentsData.map((item, index) => (
              <div className="rank-row" key={item.treatment}>
                <span className="rank-number">{index + 1}</span>
                <div>
                  <strong>{item.treatment}</strong>
                  <p>{item.avgPlantHeight} cm average height</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MethodologyNote />
    </>
  );
}

export default Overview;
