import { getLocationName } from "../utils/formatters";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import {
  Droplets,
  FlaskConical,
  Sprout,
  CalendarDays,
  PackageCheck,
} from "lucide-react";

import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import kpiFertScheduleImg from "../assets/images/kpi_fert_schedule_real.jpg";
import kpiFertPlotsImg from "../assets/images/kpi_fert_plots_real.jpg";
import kpiFertNImg from "../assets/images/kpi_fert_n_real.jpg";
import userPotassiumPowder from "../assets/images/user_potassium_powder.png";
import userHandUreaPrills from "../assets/images/user_hand_urea_prills.png";
import {
  PremiumBarDefs,
  PremiumBarShape,
  PremiumLineDefs,
  PREMIUM_GRADIENTS,
  LINE_COLORS,
  premiumGridProps,
  premiumAxisTick,
  premiumTooltipStyle,
  premiumTooltipLabelStyle,
  premiumTooltipItemStyle,
  premiumLegendStyle,
  premiumDot,
  premiumActiveDot,
} from "../components/PremiumCharts";

/* ── Premium Multi-line Tooltip ─────────────────────────────────── */
const NPK_COLORS = [
  LINE_COLORS[4].stroke, // Cyan — N
  LINE_COLORS[1].stroke, // Green — P
  LINE_COLORS[6].stroke, // Amber — K
];

function NPKTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ ...premiumTooltipItemStyle, color: entry.stroke, margin: "2px 0" }}>
          {entry.name}: {entry.value} kg
        </p>
      ))}
    </div>
  );
}

function FertilizerBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      <p style={{ ...premiumTooltipItemStyle, color: LINE_COLORS[4].stroke }}>
        {payload[0].value} kg
      </p>
    </div>
  );
}

function FertigationTracking({ data, selectedLocation }) {
  const [selectedTreatment, setSelectedTreatment] = useState("All");

  const locationFilteredData = useMemo(() => {
    if (selectedLocation === "All") return data.fertigation;

    return data.fertigation.filter(
      (row) => row.location_id === selectedLocation
    );
  }, [data.fertigation, selectedLocation]);

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

  const filteredRows = useMemo(() => {
    if (selectedTreatment === "All") return locationFilteredData;

    return locationFilteredData.filter(
      (row) => row.treatment_id === selectedTreatment
    );
  }, [locationFilteredData, selectedTreatment]);

  const summary = useMemo(() => {
    const safeSum = (key) =>
      filteredRows.reduce((sum, row) => {
        const value = typeof row[key] === "number" ? row[key] : 0;
        return sum + value;
      }, 0);

    const uniqueTreatments = new Set(
      filteredRows.map((row) => row.treatment_id).filter(Boolean)
    );

    const uniquePlots = new Set(
      filteredRows.map((row) => row.plot_id).filter(Boolean)
    );

    return {
      totalRecords: filteredRows.length,
      totalTreatments: uniqueTreatments.size,
      totalPlots: uniquePlots.size,
      totalN: Number(safeSum("n_kg").toFixed(2)),
      totalP: Number(safeSum("p2o5_kg").toFixed(2)),
      totalK: Number(safeSum("k2o_kg").toFixed(2)),
      totalUrea: Number(safeSum("urea_kg").toFixed(2)),
      totalPotash: Number(safeSum("white_potash_kg").toFixed(2)),
    };
  }, [filteredRows]);

  const npkTrendData = useMemo(() => {
    const grouped = {};

    filteredRows.forEach((row) => {
      const day = row.day_after_planting;

      if (!day && day !== 0) return;

      if (!grouped[day]) {
        grouped[day] = {
          dayAfterPlanting: Number(day),
          day: `${day} Day`,
          nKg: 0,
          pKg: 0,
          kKg: 0,
        };
      }

      grouped[day].nKg += typeof row.n_kg === "number" ? row.n_kg : 0;
      grouped[day].pKg += typeof row.p2o5_kg === "number" ? row.p2o5_kg : 0;
      grouped[day].kKg += typeof row.k2o_kg === "number" ? row.k2o_kg : 0;
    });

    return Object.values(grouped)
      .map((row) => ({
        ...row,
        nKg: Number(row.nKg.toFixed(2)),
        pKg: Number(row.pKg.toFixed(2)),
        kKg: Number(row.kKg.toFixed(2)),
      }))
      .sort((a, b) => a.dayAfterPlanting - b.dayAfterPlanting);
  }, [filteredRows]);

  const fertilizerUsageData = useMemo(() => {
    const safeSum = (key) =>
      filteredRows.reduce((sum, row) => {
        const value = typeof row[key] === "number" ? row[key] : 0;
        return sum + value;
      }, 0);

    return [
      {
        fertilizer: "Urea",
        quantity: Number(safeSum("urea_kg").toFixed(2)),
      },
      {
        fertilizer: "DAP",
        quantity: Number(safeSum("dap_kg").toFixed(2)),
      },
      {
        fertilizer: "MAP",
        quantity: Number(safeSum("map_kg").toFixed(2)),
      },
      {
        fertilizer: "White Potash",
        quantity: Number(safeSum("white_potash_kg").toFixed(2)),
      },
      {
        fertilizer: "MN Mixture",
        quantity: Number(safeSum("mn_mixture_kg").toFixed(2)),
      },
    ].filter((item) => item.quantity > 0);
  }, [filteredRows]);

  const cropStageRows = useMemo(() => {
    const splitRows =
      selectedLocation === "All"
        ? data.cropStageSplit
        : data.cropStageSplit.filter(
            (row) => row.location_id === selectedLocation
          );

    return splitRows;
  }, [data.cropStageSplit, selectedLocation]);

  const scheduleRows = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => {
        const dayA = Number(a.day_after_planting || 0);
        const dayB = Number(b.day_after_planting || 0);
        return dayA - dayB;
      })
      .slice(0, 60);
  }, [filteredRows]);

  function showValue(value, unit = "kg") {
    if (typeof value === "number") {
      return `${value} ${unit}`;
    }

    return "N/A";
  }

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Fertigation Tracking</h2>
          <p>
            Track treatment-wise fertigation schedule, NPK split, and fertilizer
            product usage.
          </p>
        </div>

        <div className="toolbar-actions">
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
          icon={<CalendarDays />}
          title="Schedule Records"
          value={summary.totalRecords}
          note="Fertigation entries"
          variant="blue"
          imageSrc={kpiFertScheduleImg}
        />

        <KpiCard
          icon={<Sprout />}
          title="Plots Covered"
          value={summary.totalPlots}
          note="Based on selected location"
          variant="emerald"
          imageSrc={kpiFertPlotsImg}
        />

        <KpiCard
          icon={<FlaskConical />}
          title="Total N"
          value={`${summary.totalN} kg`}
          note="Nitrogen planned"
          variant="purple"
          imageSrc={kpiFertNImg}
        />

        <KpiCard
          icon={<Droplets />}
          title="Total K₂O"
          value={`${summary.totalK} kg`}
          note="Potassium planned"
          variant="orange"
          imageSrc={userPotassiumPowder}
        />

        <KpiCard
          icon={<PackageCheck />}
          title="Urea Required"
          value={`${summary.totalUrea} kg`}
          note="Calculated from schedule"
          variant="blue"
          imageSrc={userHandUreaPrills}
        />
      </section>

      {/* ── 1. Charts Section — 2-Column Equal-Height Grid ──────── */}
      <section className="fertigation-charts-grid">
        <ChartCard
          title="NPK Schedule by Day After Planting"
          subtitle="N, P₂O₅ and K₂O quantities grouped by fertigation day."
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={npkTrendData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <PremiumLineDefs />
              </defs>
              <CartesianGrid {...premiumGridProps} />
              <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<NPKTooltip />} />
              <Legend wrapperStyle={premiumLegendStyle} />
              <Line
                type="monotone"
                dataKey="nKg"
                name="N kg"
                stroke={NPK_COLORS[0]}
                strokeWidth={3.5}
                strokeLinecap="round"
                filter="url(#lgf4)"
                dot={premiumDot(NPK_COLORS[0])}
                activeDot={premiumActiveDot(NPK_COLORS[0])}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="pKg"
                name="P₂O₅ kg"
                stroke={NPK_COLORS[1]}
                strokeWidth={3.5}
                strokeLinecap="round"
                filter="url(#lgf1)"
                dot={premiumDot(NPK_COLORS[1])}
                activeDot={premiumActiveDot(NPK_COLORS[1])}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="kKg"
                name="K₂O kg"
                stroke={NPK_COLORS[2]}
                strokeWidth={3.5}
                strokeLinecap="round"
                filter="url(#lgf2)"
                dot={premiumDot(NPK_COLORS[2])}
                activeDot={premiumActiveDot(NPK_COLORS[2])}
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Fertilizer Product Usage"
          subtitle="Total fertilizer product quantity from schedule."
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={fertilizerUsageData} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <PremiumBarDefs />
              </defs>
              <CartesianGrid {...premiumGridProps} />
              <XAxis dataKey="fertilizer" tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
              <Tooltip
                content={<FertilizerBarTooltip />}
                cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }}
              />
              <Bar
                dataKey="quantity"
                shape={(props) => <PremiumBarShape {...props} />}
                isAnimationActive={true}
                animationBegin={80}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {fertilizerUsageData.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ── 2. Tables Split Grid — 2-Column Aligned Tables ──────── */}
      <section className="fertigation-tables-split-grid">
        <div className="card card-table shadow-sm">
          <div className="card-header">
            <div>
              <h3>Crop Stage Split Dose</h3>
              <p>NPK percentage distribution by crop stage.</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Crop Stage</th>
                  <th>DAP</th>
                  <th>N %</th>
                  <th>P %</th>
                  <th>K %</th>
                </tr>
              </thead>

              <tbody>
                {cropStageRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "#94A3B8" }}>
                      No crop stage data available.
                    </td>
                  </tr>
                ) : (
                  cropStageRows.map((row, index) => (
                    <tr key={index}>
                      <td>{getLocationName(row.location_id, data.locations)}</td>
                      <td>
                        <strong>{row.crop_stage}</strong>
                      </td>
                      <td>{row.days_after_planting} days</td>
                      <td>{row.n_pct}%</td>
                      <td>{row.p_pct}%</td>
                      <td>{row.k_pct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-table shadow-sm">
          <div className="card-header">
            <div>
              <h3>Fertigation Plot Summary</h3>
              <p>Total NPK planned plot-wise.</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Plot</th>
                  <th>Treatment</th>
                  <th>Extent</th>
                  <th>Total N</th>
                  <th>Total P</th>
                  <th>Total K</th>
                </tr>
              </thead>

              <tbody>
                {data.fertigationSummary
                  .filter((row) => {
                    if (selectedLocation === "All") return true;
                    return row.location_id === selectedLocation;
                  })
                  .slice(0, 20)
                  .map((row, index) => (
                    <tr key={index}>
                      <td>{getLocationName(row.location_id, data.locations)}</td>
                      <td>
                        <strong>{row.plot_id}</strong>
                      </td>
                      <td>{row.treatment_id}</td>
                      <td>{row.extent_acre} acre</td>
                      <td>{showValue(row.total_n_kg)} kg</td>
                      <td>{showValue(row.total_p_kg)} kg</td>
                      <td>{showValue(row.total_k_kg)} kg</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 3. Full-Width Detailed Schedule Table ─────────────── */}
      <section className="fertigation-full-table-section">
        <div className="card card-table shadow-sm">
          <div className="card-header">
            <div>
              <h3>Fertigation Schedule Table</h3>
              <p>
                Complete day-by-day fertigation nutrient plan and fertilizer product breakdown.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Plot</th>
                  <th>Treatment</th>
                  <th>Day</th>
                  <th>Date</th>
                  <th>N kg</th>
                  <th>P₂O₅ kg</th>
                  <th>K₂O kg</th>
                  <th>MN Mix</th>
                  <th>Urea</th>
                  <th>DAP</th>
                  <th>MAP</th>
                  <th>White Potash</th>
                </tr>
              </thead>

              <tbody>
                {scheduleRows.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ textAlign: "center", color: "#94A3B8" }}>
                      No fertigation schedule data available.
                    </td>
                  </tr>
                ) : (
                  scheduleRows.map((row, index) => (
                    <tr key={index}>
                      <td>{getLocationName(row.location_id, data.locations)}</td>
                      <td>
                        <strong>{row.plot_id}</strong>
                      </td>
                      <td>{row.treatment_id}</td>
                      <td>Day {row.day_after_planting}</td>
                      <td>{row.date}</td>
                      <td>{showValue(row.n_kg)}</td>
                      <td>{showValue(row.p2o5_kg)}</td>
                      <td>{showValue(row.k2o_kg)}</td>
                      <td>{showValue(row.mn_mixture_kg)}</td>
                      <td>{showValue(row.urea_kg)}</td>
                      <td>{showValue(row.dap_kg)}</td>
                      <td>{showValue(row.map_kg)}</td>
                      <td>{showValue(row.white_potash_kg)}</td>
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

export default FertigationTracking;