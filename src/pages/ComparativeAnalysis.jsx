import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  MapPin,
  FlaskConical,
  CalendarDays,
  Droplets,
  TrendingUp,
  Scale,
  RotateCcw,
  Filter,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

import KpiCard from "../components/KpiCard";
import userBestLocCollege from "../assets/images/user_bestloc_college.png";
import userBestLocAnthiyur from "../assets/images/user_bestloc_anthiyur.png";
import userBestLocAthani from "../assets/images/user_bestloc_athani.png";
import userSugarcaneHarvestBundles from "../assets/images/user_sugarcane_harvest_bundles.png";
import userSproutCalendar from "../assets/images/user_sprout_calendar.png";
import userBlueNpkGranules from "../assets/images/user_blue_npk_granules.png";
import userFarmerThrowingFertilizer from "../assets/images/user_farmer_throwing_fertilizer.png";

function getBestLocationBgImage(locName) {
  const name = String(locName || "").toLowerCase();
  if (name.includes("anthiyur")) {
    return userBestLocAnthiyur;
  }
  if (name.includes("athani")) {
    return userBestLocAthani;
  }
  return userBestLocCollege;
}
import EmptyState from "../components/EmptyState";
import MethodologyNote from "../components/MethodologyNote";
import { getLocationName } from "../utils/formatters";
import {
  PremiumBarDefs,
  PremiumBarShape,
  makePremiumBarShape,
  PremiumLineDefs,
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

/* ── Shared Premium Tooltips ──────────────────────────────────────── */
function GenericBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ ...premiumTooltipItemStyle, color: entry.fill || LINE_COLORS[i % LINE_COLORS.length].stroke, margin: "2px 0" }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

function GenericLineTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={premiumTooltipStyle}>
      <p style={premiumTooltipLabelStyle}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ ...premiumTooltipItemStyle, color: entry.stroke || LINE_COLORS[i % LINE_COLORS.length].stroke, margin: "2px 0" }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ── Pre-built shaped bars by series index ──────────────────────── */
const PremiumBar0 = makePremiumBarShape(0);
const PremiumBar1 = makePremiumBarShape(1);
const PremiumBar2 = makePremiumBarShape(2);
const PremiumBar3 = makePremiumBarShape(3);
const PremiumBar4 = makePremiumBarShape(4);
const PremiumBar5 = makePremiumBarShape(5);
const PremiumBar6 = makePremiumBarShape(6);

function ComparativeAnalysis({ data, selectedLocation }) {
  const [selectedMetric, setSelectedMetric] = useState("plant_height_cm");
  const [selectedTreatment, setSelectedTreatment] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  const metricOptions = [
    { label: "Plant Height", value: "plant_height_cm" },
    { label: "Tillers", value: "number_of_tillers" },
    { label: "Leaves", value: "number_of_leaves" },
    { label: "Leaf Length", value: "leaf_length_cm" },
    { label: "Leaf Breadth", value: "leaf_breadth_cm" },
  ];

  const selectedMetricLabel =
    metricOptions.find((item) => item.value === selectedMetric)?.label ||
    "Plant Height";

  const selectedLocationName =
    selectedLocation === "All"
      ? "All Locations"
      : getLocationName(selectedLocation, data.locations || []);

  const locationFilteredBiometric = useMemo(() => {
    const rows = data.biometric || [];

    if (selectedLocation === "All") return rows;

    return rows.filter((row) => row.location_id === selectedLocation);
  }, [data.biometric, selectedLocation]);

  const locationFilteredFertigation = useMemo(() => {
    const rows = data.fertigation || [];

    if (selectedLocation === "All") return rows;

    return rows.filter((row) => row.location_id === selectedLocation);
  }, [data.fertigation, selectedLocation]);

  const treatmentOptions = useMemo(() => {
  const treatments = new Set();

  locationFilteredBiometric.forEach((row) => {
    if (row.treatment_id) {
      treatments.add(row.treatment_id);
    }
  });

  locationFilteredFertigation.forEach((row) => {
    if (row.treatment_id) {
      treatments.add(row.treatment_id);
    }
  });

  return ["All", ...Array.from(treatments).sort(naturalSort)];
}, [locationFilteredBiometric, locationFilteredFertigation]);

useEffect(() => {
  if (!treatmentOptions.includes(selectedTreatment)) {
    setSelectedTreatment("All");
  }
}, [treatmentOptions, selectedTreatment]);

const dayBaseBiometric = useMemo(() => {
  return locationFilteredBiometric.filter((row) => {
    return selectedTreatment === "All" || row.treatment_id === selectedTreatment;
  });
}, [locationFilteredBiometric, selectedTreatment]);

const dayBaseFertigation = useMemo(() => {
  return locationFilteredFertigation.filter((row) => {
    return selectedTreatment === "All" || row.treatment_id === selectedTreatment;
  });
}, [locationFilteredFertigation, selectedTreatment]);

const biometricDayOptions = useMemo(() => {
  return getUniqueSortedDays(dayBaseBiometric, "observation_day");
}, [dayBaseBiometric]);

const fertigationDayOptions = useMemo(() => {
  return getUniqueSortedDays(dayBaseFertigation, "day_after_planting");
}, [dayBaseFertigation]);

const [bioStartIndex, setBioStartIndex] = useState(0);
const [bioEndIndex, setBioEndIndex] = useState(0);
const [fertStartIndex, setFertStartIndex] = useState(0);
const [fertEndIndex, setFertEndIndex] = useState(0);

useEffect(() => {
  setBioStartIndex(0);
  setBioEndIndex(Math.max(biometricDayOptions.length - 1, 0));
}, [biometricDayOptions]);

useEffect(() => {
  setFertStartIndex(0);
  setFertEndIndex(Math.max(fertigationDayOptions.length - 1, 0));
}, [fertigationDayOptions]);

const bioDayMin = biometricDayOptions[bioStartIndex] ?? 0;
const bioDayMax = biometricDayOptions[bioEndIndex] ?? 0;
const fertDayMin = fertigationDayOptions[fertStartIndex] ?? 0;
const fertDayMax = fertigationDayOptions[fertEndIndex] ?? 0;

  const biometric = useMemo(() => {
    return locationFilteredBiometric.filter((row) => {
      const day = Number(row.observation_day);
      const treatmentMatch =
        selectedTreatment === "All" || row.treatment_id === selectedTreatment;

      const dayMatch =
        biometricDayOptions.length === 0 ||
        (!Number.isNaN(day) && day >= bioDayMin && day <= bioDayMax);

      return treatmentMatch && dayMatch;
    });
  }, [
    locationFilteredBiometric,
    selectedTreatment,
    bioDayMin,
    bioDayMax,
     biometricDayOptions.length,
  ]);

  const fertigation = useMemo(() => {
    return locationFilteredFertigation.filter((row) => {
      const day = Number(row.day_after_planting);
      const treatmentMatch =
        selectedTreatment === "All" || row.treatment_id === selectedTreatment;

      const dayMatch =
        fertigationDayOptions.length === 0 ||
        (!Number.isNaN(day) && day >= fertDayMin && day <= fertDayMax);

      return treatmentMatch && dayMatch;
    });
  }, [
    locationFilteredFertigation,
    selectedTreatment,
    fertDayMin,
    fertDayMax,
    fertigationDayOptions.length,
  ]);

  const locationComparison = useMemo(() => {
    const grouped = {};

    biometric.forEach((row) => {
      const locationId = row.location_id;
      if (!locationId) return;

      if (!grouped[locationId]) {
        grouped[locationId] = {
          location_id: locationId,
          records: 0,
          plantHeight: [],
          tillers: [],
          leaves: [],
          leafLength: [],
          leafBreadth: [],
          latestDay: 0,
        };
      }

      grouped[locationId].records += 1;

      pushNumber(grouped[locationId].plantHeight, row.plant_height_cm);
      pushNumber(grouped[locationId].tillers, row.number_of_tillers);
      pushNumber(grouped[locationId].leaves, row.number_of_leaves);
      pushNumber(grouped[locationId].leafLength, row.leaf_length_cm);
      pushNumber(grouped[locationId].leafBreadth, row.leaf_breadth_cm);

      const day = Number(row.observation_day);
      if (!Number.isNaN(day)) {
        grouped[locationId].latestDay = Math.max(
          grouped[locationId].latestDay,
          day
        );
      }
    });

    return Object.values(grouped).map((item) => ({
      location: getLocationName(item.location_id, data.locations || []),
      records: item.records,
      avgHeight: average(item.plantHeight),
      avgTillers: average(item.tillers),
      avgLeaves: average(item.leaves),
      avgLeafLength: average(item.leafLength),
      avgLeafBreadth: average(item.leafBreadth),
      latestDay: item.latestDay,
    }));
  }, [biometric, data.locations]);

  const treatmentComparison = useMemo(() => {
    const grouped = {};

    biometric.forEach((row) => {
      if (!row.treatment_id) return;

      const key = `${row.location_id}-${row.treatment_id}`;

      if (!grouped[key]) {
        grouped[key] = {
          location_id: row.location_id,
          treatment_id: row.treatment_id,
          records: 0,
          plantHeight: [],
          tillers: [],
          leaves: [],
          leafLength: [],
          leafBreadth: [],
          latestDay: 0,
        };
      }

      grouped[key].records += 1;

      pushNumber(grouped[key].plantHeight, row.plant_height_cm);
      pushNumber(grouped[key].tillers, row.number_of_tillers);
      pushNumber(grouped[key].leaves, row.number_of_leaves);
      pushNumber(grouped[key].leafLength, row.leaf_length_cm);
      pushNumber(grouped[key].leafBreadth, row.leaf_breadth_cm);

      const day = Number(row.observation_day);
      if (!Number.isNaN(day)) {
        grouped[key].latestDay = Math.max(grouped[key].latestDay, day);
      }
    });

    const rows = Object.values(grouped).map((item) => {
      const avgHeight = average(item.plantHeight);
      const avgTillers = average(item.tillers);
      const avgLeaves = average(item.leaves);
      const avgLeafLength = average(item.leafLength);
      const avgLeafBreadth = average(item.leafBreadth);

      return {
        location: getLocationName(item.location_id, data.locations || []),
        treatment: item.treatment_id,
        records: item.records,
        avgHeight,
        avgTillers,
        avgLeaves,
        avgLeafLength,
        avgLeafBreadth,
        latestDay: item.latestDay,
      };
    });

    const maxHeight = maxValue(rows, "avgHeight");
    const maxTillers = maxValue(rows, "avgTillers");
    const maxLeaves = maxValue(rows, "avgLeaves");
    const maxLeafLength = maxValue(rows, "avgLeafLength");
    const maxLeafBreadth = maxValue(rows, "avgLeafBreadth");

    return rows
      .map((row) => {
        const score =
          normalizedScore(row.avgHeight, maxHeight) * 40 +
          normalizedScore(row.avgTillers, maxTillers) * 25 +
          normalizedScore(row.avgLeaves, maxLeaves) * 15 +
          normalizedScore(row.avgLeafLength, maxLeafLength) * 10 +
          normalizedScore(row.avgLeafBreadth, maxLeafBreadth) * 10;

        return {
          ...row,
          performanceScore: Number(score.toFixed(1)),
        };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }, [biometric, data.locations]);

  const dayWiseBiometric = useMemo(() => {
    const grouped = {};

    biometric.forEach((row) => {
      const day = Number(row.observation_day);
      if (Number.isNaN(day)) return;

      if (!grouped[day]) {
        grouped[day] = {
          day,
          records: 0,
          plantHeight: [],
          tillers: [],
          leaves: [],
          leafLength: [],
          leafBreadth: [],
        };
      }

      grouped[day].records += 1;

      pushNumber(grouped[day].plantHeight, row.plant_height_cm);
      pushNumber(grouped[day].tillers, row.number_of_tillers);
      pushNumber(grouped[day].leaves, row.number_of_leaves);
      pushNumber(grouped[day].leafLength, row.leaf_length_cm);
      pushNumber(grouped[day].leafBreadth, row.leaf_breadth_cm);
    });

    return Object.values(grouped)
      .map((item) => ({
        day: item.day,
        records: item.records,
        avgHeight: average(item.plantHeight),
        avgTillers: average(item.tillers),
        avgLeaves: average(item.leaves),
        avgLeafLength: average(item.leafLength),
        avgLeafBreadth: average(item.leafBreadth),
      }))
      .sort((a, b) => a.day - b.day);
  }, [biometric]);

  const dayWiseFertigation = useMemo(() => {
    const grouped = {};

    fertigation.forEach((row) => {
      const day = Number(row.day_after_planting);
      if (Number.isNaN(day)) return;

      if (!grouped[day]) {
        grouped[day] = {
          day,
          records: 0,
          n: 0,
          p: 0,
          k: 0,
          urea: 0,
          dap: 0,
          map: 0,
          potash: 0,
        };
      }

      grouped[day].records += 1;

      grouped[day].n += safeNumber(row.n_kg);
      grouped[day].p += safeNumber(row.p2o5_kg);
      grouped[day].k += safeNumber(row.k2o_kg);
      grouped[day].urea += safeNumber(row.urea_kg);
      grouped[day].dap += safeNumber(row.dap_kg);
      grouped[day].map += safeNumber(row.map_kg);
      grouped[day].potash += safeNumber(row.white_potash_kg);
    });

    return Object.values(grouped)
      .map((item) => ({
        day: item.day,
        records: item.records,
        n: round(item.n),
        p: round(item.p),
        k: round(item.k),
        urea: round(item.urea),
        dap: round(item.dap),
        map: round(item.map),
        potash: round(item.potash),
      }))
      .sort((a, b) => a.day - b.day);
  }, [fertigation]);

  const nutrientVsGrowth = useMemo(() => {
    const growthGrouped = {};
    const fertGrouped = {};

    biometric.forEach((row) => {
      if (!row.treatment_id) return;

      const key = `${row.location_id}-${row.treatment_id}`;

      if (!growthGrouped[key]) {
        growthGrouped[key] = {
          location_id: row.location_id,
          treatment_id: row.treatment_id,
          height: [],
          tillers: [],
        };
      }

      pushNumber(growthGrouped[key].height, row.plant_height_cm);
      pushNumber(growthGrouped[key].tillers, row.number_of_tillers);
    });

    fertigation.forEach((row) => {
      if (!row.treatment_id) return;

      const key = `${row.location_id}-${row.treatment_id}`;

      if (!fertGrouped[key]) {
        fertGrouped[key] = {
          n: 0,
          p: 0,
          k: 0,
        };
      }

      fertGrouped[key].n += safeNumber(row.n_kg);
      fertGrouped[key].p += safeNumber(row.p2o5_kg);
      fertGrouped[key].k += safeNumber(row.k2o_kg);
    });

    return Object.keys(growthGrouped)
      .map((key) => {
        const growth = growthGrouped[key];
        const fert = fertGrouped[key] || { n: 0, p: 0, k: 0 };

        return {
          location: getLocationName(growth.location_id, data.locations || []),
          treatment: growth.treatment_id,
          totalNPK: round(fert.n + fert.p + fert.k),
          totalN: round(fert.n),
          totalP: round(fert.p),
          totalK: round(fert.k),
          avgHeight: average(growth.height),
          avgTillers: average(growth.tillers),
        };
      })
      .sort((a, b) => b.avgHeight - a.avgHeight)
      .slice(0, 15);
  }, [biometric, fertigation, data.locations]);

  const summary = useMemo(() => {
    const bestLocation = [...locationComparison].sort(
      (a, b) => b.avgHeight - a.avgHeight
    )[0];

    const bestTreatment = treatmentComparison[0];

    const latestDay =
      dayWiseBiometric.length > 0
        ? Math.max(...dayWiseBiometric.map((row) => row.day))
        : 0;

    const totalN = dayWiseFertigation.reduce((sum, row) => sum + row.n, 0);
    const totalP = dayWiseFertigation.reduce((sum, row) => sum + row.p, 0);
    const totalK = dayWiseFertigation.reduce((sum, row) => sum + row.k, 0);

    return {
      bestLocation: bestLocation?.location || "-",
      bestTreatment: bestTreatment?.treatment || "-",
      latestDay,
      totalNPK: round(totalN + totalP + totalK),
      treatmentCount: treatmentComparison.length,
      biometricRecords: biometric.length,
      fertigationRecords: fertigation.length,
    };
  }, [
    locationComparison,
    treatmentComparison,
    dayWiseBiometric,
    dayWiseFertigation,
    biometric,
    fertigation,
  ]);

function resetFilters() {
  setSelectedMetric("plant_height_cm");
  setSelectedTreatment("All");

  setBioStartIndex(0);
  setBioEndIndex(Math.max(biometricDayOptions.length - 1, 0));

  setFertStartIndex(0);
  setFertEndIndex(Math.max(fertigationDayOptions.length - 1, 0));

  setActiveTab("overview");
}

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Comparative Analysis</h2>
          <p>
            Location-wise, treatment-wise, day-wise biometric, and fertigation
            comparison for the selected scope.
          </p>
        </div>

        <div className="quality-scope-badge">
          <MapPin size={16} />
          {selectedLocationName}
        </div>
      </section>

      <section className="comparison-filter-panel">
        <div className="filter-panel-header">
          <div>
            <h3>
              <Filter size={18} />
              Analysis Filters
            </h3>
            <p>
              Use these filters to compare selected treatment, biometric period,
              and fertigation period.
            </p>
          </div>

          <button className="secondary-btn" onClick={resetFilters}>
            <RotateCcw size={16} />
            Reset Filters
          </button>
        </div>

        <div className="comparison-filter-grid">
          <div className="filter-control">
            <label>Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {metricOptions.map((metric) => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label>Treatment</label>
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

          <div className="range-control">
            <label>
              Biometric Observation Day: {bioDayMin} - {bioDayMax}
            </label>

            <div className="dual-range">
              <input
                type="range"
                min={0}
                max={Math.max(biometricDayOptions.length - 1, 0)}
                value={bioStartIndex}
                disabled={biometricDayOptions.length <= 1}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBioStartIndex(Math.min(value, bioEndIndex));
                }}
              />

              <input
                type="range"
                min={0}
                max={Math.max(biometricDayOptions.length - 1, 0)}
                value={bioEndIndex}
                disabled={biometricDayOptions.length <= 1}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBioEndIndex(Math.max(value, bioStartIndex));
                }}
              />
            </div>

            <small>
              Available days:{" "}
              {biometricDayOptions.length > 0
                ? biometricDayOptions.join(", ")
                : "No biometric days available"}
            </small>
          </div>

          <div className="range-control">
            <label>
              Fertigation Day After Planting: {fertDayMin} - {fertDayMax}
            </label>

            <div className="dual-range">
              <input
                type="range"
                min={0}
                max={Math.max(fertigationDayOptions.length - 1, 0)}
                value={fertStartIndex}
                disabled={fertigationDayOptions.length <= 1}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFertStartIndex(Math.min(value, fertEndIndex));
                }}
              />

              <input
                type="range"
                min={0}
                max={Math.max(fertigationDayOptions.length - 1, 0)}
                value={fertEndIndex}
                disabled={fertigationDayOptions.length <= 1}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFertEndIndex(Math.max(value, fertStartIndex));
                }}
              />
            </div>

            <small>
              Available days:{" "}
              {fertigationDayOptions.length > 0
                ? fertigationDayOptions.join(", ")
                : "No fertigation days available"}
            </small>
          </div>
        </div>

        <div className="filter-result-strip">
          <span>
            Biometric Records: <strong>{summary.biometricRecords}</strong>
          </span>
          <span>
            Fertigation Records: <strong>{summary.fertigationRecords}</strong>
          </span>
          <span>
            Treatment:{" "}
            <strong>
              {selectedTreatment === "All"
                ? "All Treatments"
                : selectedTreatment}
            </strong>
          </span>
          <span>
            Metric: <strong>{selectedMetricLabel}</strong>
          </span>
        </div>
      </section>

      <section className="comparison-tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "location", label: "Location Comparison" },
          { id: "treatment", label: "Treatment Comparison" },
          { id: "biometric", label: "Day-wise Biometric" },
          { id: "fertigation", label: "Day-wise Fertigation" },
          { id: "nutrient", label: "Nutrient vs Growth" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {(activeTab === "overview" || activeTab === "location") && (
        <>
          <section className="kpi-grid">
            <KpiCard
              icon={<MapPin />}
              title="Best Location"
              value={summary.bestLocation}
              note="Based on average plant height"
              variant="blue"
              imageSrc={getBestLocationBgImage(summary.bestLocation)}
            />

            <KpiCard
              icon={<FlaskConical />}
              title="Best Treatment"
              value={summary.bestTreatment}
              note="Based on performance score"
              variant="emerald"
              imageSrc={userSugarcaneHarvestBundles}
            />

            <KpiCard
              icon={<CalendarDays />}
              title="Latest Day"
              value={summary.latestDay}
              note="Latest biometric observation"
              variant="purple"
              imageSrc={userSproutCalendar}
            />

            <KpiCard
              icon={<Droplets />}
              title="Total NPK"
              value={summary.totalNPK}
              note="From fertigation records"
              variant="orange"
              imageSrc={userBlueNpkGranules}
            />

            <KpiCard
              icon={<Scale />}
              title="Treatments"
              value={summary.treatmentCount}
              note={selectedLocationName}
              variant="blue"
              imageSrc={userFarmerThrowingFertilizer}
            />
          </section>

          <section className="comparison-grid">
            <LocationGrowthChart locationComparison={locationComparison} />

            <TreatmentScoreChart treatmentComparison={treatmentComparison} />
          </section>
        </>
      )}

      {activeTab === "location" && (
        <LocationComparisonTable locationComparison={locationComparison} />
      )}

      {activeTab === "treatment" && (
        <>
          <section className="comparison-grid">
            <TreatmentScoreChart treatmentComparison={treatmentComparison} />

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>Treatment Metric Comparison</h3>
                  <p>Selected metric average by treatment.</p>
                </div>
              </div>

              {treatmentComparison.length === 0 ? (
                <EmptyState
                  title="No treatment metric data"
                  message="No treatment records are available for this filter."
                />
              ) : (
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={treatmentComparison.slice(0, 14)} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
                    <defs>
                      <PremiumBarDefs />
                    </defs>
                    <CartesianGrid {...premiumGridProps} />
                    <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<GenericBarTooltip />} cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }} />
                    <Bar
                      dataKey={metricToTreatmentKey(selectedMetric)}
                      name={selectedMetricLabel}
                      shape={(props) => <PremiumBarShape {...props} />}
                      isAnimationActive={true}
                      animationBegin={80}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {treatmentComparison.slice(0, 14).map((_, index) => (
                        <Cell key={index} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <TreatmentDeepTable treatmentComparison={treatmentComparison} />
        </>
      )}

      {activeTab === "biometric" && (
        <>
          <section className="comparison-grid">
            <DayWiseBiometricChart
              dayWiseBiometric={dayWiseBiometric}
              selectedMetric={selectedMetric}
              selectedMetricLabel={selectedMetricLabel}
            />

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>Height vs Tillers by Observation Day</h3>
                  <p>Day-wise comparison of two major growth indicators.</p>
                </div>
              </div>

              {dayWiseBiometric.length === 0 ? (
                <EmptyState
                  title="No biometric trend data"
                  message="No observation day records are available."
                />
              ) : (
                <ResponsiveContainer width="100%" height={330}>
                  <LineChart data={dayWiseBiometric} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <defs><PremiumLineDefs /></defs>
                    <CartesianGrid {...premiumGridProps} />
                    <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<GenericLineTooltip />} />
                    <Legend wrapperStyle={premiumLegendStyle} />
                    <Line
                      type="monotone"
                      dataKey="avgHeight"
                      name="Avg Height"
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
                    <Line
                      type="monotone"
                      dataKey="avgTillers"
                      name="Avg Tillers"
                      stroke={LINE_COLORS[3].stroke}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      filter="url(#lgf3)"
                      dot={premiumDot(LINE_COLORS[3].dot)}
                      activeDot={premiumActiveDot(LINE_COLORS[3].dot)}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <DayWiseBiometricTable dayWiseBiometric={dayWiseBiometric} />
        </>
      )}

      {activeTab === "fertigation" && (
        <>
          <section className="comparison-grid">
            <DayWiseFertigationChart dayWiseFertigation={dayWiseFertigation} />

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>Fertilizer Product Trend</h3>
                  <p>Urea, DAP, MAP, and potash by day after planting.</p>
                </div>
              </div>

              {dayWiseFertigation.length === 0 ? (
                <EmptyState
                  title="No fertilizer product data"
                  message="No day-wise fertilizer product records are available."
                />
              ) : (
                <ResponsiveContainer width="100%" height={330}>
                  <LineChart data={dayWiseFertigation} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <defs><PremiumLineDefs /></defs>
                    <CartesianGrid {...premiumGridProps} />
                    <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<GenericLineTooltip />} />
                    <Legend wrapperStyle={premiumLegendStyle} />
                    <Line type="monotone" dataKey="urea" name="Urea" stroke={LINE_COLORS[6].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf6)" dot={premiumDot(LINE_COLORS[6].dot)} activeDot={premiumActiveDot(LINE_COLORS[6].dot)} isAnimationActive={true} animationDuration={900} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="dap" name="DAP" stroke={LINE_COLORS[4].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf4)" dot={premiumDot(LINE_COLORS[4].dot)} activeDot={premiumActiveDot(LINE_COLORS[4].dot)} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="map" name="MAP" stroke={LINE_COLORS[1].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf1)" dot={premiumDot(LINE_COLORS[1].dot)} activeDot={premiumActiveDot(LINE_COLORS[1].dot)} isAnimationActive={true} animationDuration={1100} animationEasing="ease-out" />
                    <Line type="monotone" dataKey="potash" name="White Potash" stroke={LINE_COLORS[3].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf3)" dot={premiumDot(LINE_COLORS[3].dot)} activeDot={premiumActiveDot(LINE_COLORS[3].dot)} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <DayWiseFertigationTable dayWiseFertigation={dayWiseFertigation} />
        </>
      )}

      {activeTab === "nutrient" && (
        <>
          <section className="comparison-grid">
            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>NPK Input vs Avg Height</h3>
                  <p>Exploratory treatment-wise nutrient and growth comparison.</p>
                </div>
              </div>

              {nutrientVsGrowth.length === 0 ? (
                <EmptyState
                  title="No nutrient-growth comparison"
                  message="Both biometric and fertigation records are required."
                />
              ) : (
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={nutrientVsGrowth} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="20%">
                    <defs><PremiumBarDefs /></defs>
                    <CartesianGrid {...premiumGridProps} />
                    <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<GenericBarTooltip />} cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }} />
                    <Legend wrapperStyle={premiumLegendStyle} />
                    <Bar dataKey="totalNPK" name="Total NPK" shape={PremiumBar0} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="avgHeight" name="Avg Height" shape={PremiumBar4} isAnimationActive={true} animationDuration={900} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <h3>N, P2O5, K2O by Treatment</h3>
                  <p>Total nutrient input grouped by treatment.</p>
                </div>
              </div>

              {nutrientVsGrowth.length === 0 ? (
                <EmptyState
                  title="No nutrient data"
                  message="No nutrient totals are available for this filter."
                />
              ) : (
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={nutrientVsGrowth} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="20%">
                    <defs><PremiumBarDefs /></defs>
                    <CartesianGrid {...premiumGridProps} />
                    <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<GenericBarTooltip />} cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }} />
                    <Legend wrapperStyle={premiumLegendStyle} />
                    <Bar dataKey="totalN" name="N" shape={PremiumBar4} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="totalP" name="P2O5" shape={PremiumBar1} isAnimationActive={true} animationDuration={900} animationEasing="ease-out" />
                    <Bar dataKey="totalK" name="K2O" shape={PremiumBar6} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <NutrientGrowthTable nutrientVsGrowth={nutrientVsGrowth} />
        </>
      )}

      <section className="comparison-note">
        <h3>Comparison Note</h3>
        <p>
          Location-wise comparison gives an overview only because locations may
          differ in trial structure, number of plots, and observation coverage.
          Treatment-wise comparison should be interpreted within the selected
          location. Nutrient input vs growth response is exploratory and does not
          claim direct causation without statistical validation.
        </p>
      </section>

      <MethodologyNote />
    </>
  );
}

function LocationGrowthChart({ locationComparison }) {
  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <h3>Location-wise Growth Comparison</h3>
          <p>Average plant height and tillers by location.</p>
        </div>
      </div>

      {locationComparison.length === 0 ? (
        <EmptyState
          title="No location comparison data"
          message="No biometric records are available for this selected scope."
        />
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={locationComparison} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="20%">
            <defs><PremiumBarDefs /></defs>
            <CartesianGrid {...premiumGridProps} />
            <XAxis dataKey="location" tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<GenericBarTooltip />} cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }} />
            <Legend wrapperStyle={premiumLegendStyle} />
            <Bar dataKey="avgHeight" name="Avg Height" shape={PremiumBar0} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            <Bar dataKey="avgTillers" name="Avg Tillers" shape={PremiumBar3} isAnimationActive={true} animationDuration={900} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function TreatmentScoreChart({ treatmentComparison }) {
  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <h3>Treatment Performance Score</h3>
          <p>Rule-based score from height, tillers, leaves, and leaf size.</p>
        </div>
      </div>

      {treatmentComparison.length === 0 ? (
        <EmptyState
          title="No treatment comparison data"
          message="No treatment-wise biometric records are available."
        />
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={treatmentComparison.slice(0, 14)} margin={{ top: 14, right: 12, left: -10, bottom: 0 }} barCategoryGap="28%">
            <defs><PremiumBarDefs /></defs>
            <CartesianGrid {...premiumGridProps} />
            <XAxis dataKey="treatment" tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<GenericBarTooltip />} cursor={{ fill: "rgba(79,124,255,0.05)", rx: 8 }} />
            <Bar
              dataKey="performanceScore"
              name="Performance Score"
              shape={(props) => <PremiumBarShape {...props} />}
              isAnimationActive={true}
              animationBegin={80}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {treatmentComparison.slice(0, 14).map((_, index) => (
                <Cell key={index} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function DayWiseBiometricChart({
  dayWiseBiometric,
  selectedMetric,
  selectedMetricLabel,
}) {
  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <h3>Day-wise Biometric Trend</h3>
          <p>{selectedMetricLabel} trend by observation day.</p>
        </div>
      </div>

      {dayWiseBiometric.length === 0 ? (
        <EmptyState
          title="No day-wise biometric data"
          message="No observation day records are available."
        />
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <LineChart data={dayWiseBiometric} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <defs><PremiumLineDefs /></defs>
            <CartesianGrid {...premiumGridProps} />
            <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<GenericLineTooltip />} />
            <Legend wrapperStyle={premiumLegendStyle} />
            <Line
              type="monotone"
              dataKey={metricToChartKey(selectedMetric)}
              name={selectedMetricLabel}
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
    </div>
  );
}

function DayWiseFertigationChart({ dayWiseFertigation }) {
  return (
    <div className="card chart-card">
      <div className="card-header">
        <div>
          <h3>Day-wise Fertigation NPK</h3>
          <p>N, P2O5, and K2O application by day after planting.</p>
        </div>
      </div>

      {dayWiseFertigation.length === 0 ? (
        <EmptyState
          title="No day-wise fertigation data"
          message="No fertigation records are available for this selected scope."
        />
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <LineChart data={dayWiseFertigation} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <defs><PremiumLineDefs /></defs>
            <CartesianGrid {...premiumGridProps} />
            <XAxis dataKey="day" tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={premiumAxisTick} axisLine={false} tickLine={false} />
            <Tooltip content={<GenericLineTooltip />} />
            <Legend wrapperStyle={premiumLegendStyle} />
            <Line type="monotone" dataKey="n" name="N kg" stroke={LINE_COLORS[4].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf4)" dot={premiumDot(LINE_COLORS[4].dot)} activeDot={premiumActiveDot(LINE_COLORS[4].dot)} isAnimationActive={true} animationDuration={900} animationEasing="ease-out" />
            <Line type="monotone" dataKey="p" name="P2O5 kg" stroke={LINE_COLORS[1].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf1)" dot={premiumDot(LINE_COLORS[1].dot)} activeDot={premiumActiveDot(LINE_COLORS[1].dot)} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
            <Line type="monotone" dataKey="k" name="K2O kg" stroke={LINE_COLORS[2].stroke} strokeWidth={3.5} strokeLinecap="round" filter="url(#lgf2)" dot={premiumDot(LINE_COLORS[2].dot)} activeDot={premiumActiveDot(LINE_COLORS[2].dot)} isAnimationActive={true} animationDuration={1100} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function LocationComparisonTable({ locationComparison }) {
  return (
    <section className="card data-card wide-card">
      <div className="card-header">
        <div>
          <h3>Location-wise Comparison Table</h3>
          <p>Average biometric values grouped by location.</p>
        </div>
      </div>

      {locationComparison.length === 0 ? (
        <EmptyState
          title="No location comparison table"
          message="No location-wise biometric records are available."
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
                <th>Avg Leaves</th>
                <th>Leaf Length</th>
                <th>Leaf Breadth</th>
                <th>Latest Day</th>
              </tr>
            </thead>

            <tbody>
              {locationComparison.map((row) => (
                <tr key={row.location}>
                  <td>{row.location}</td>
                  <td>{row.records}</td>
                  <td>{row.avgHeight}</td>
                  <td>{row.avgTillers}</td>
                  <td>{row.avgLeaves}</td>
                  <td>{row.avgLeafLength}</td>
                  <td>{row.avgLeafBreadth}</td>
                  <td>{row.latestDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TreatmentDeepTable({ treatmentComparison }) {
  return (
    <section className="card data-card wide-card">
      <div className="card-header">
        <div>
          <h3>Treatment-wise Deep Comparison</h3>
          <p>Treatment ranking using biometric averages and performance score.</p>
        </div>
        <TrendingUp size={24} />
      </div>

      {treatmentComparison.length === 0 ? (
        <EmptyState
          title="No treatment comparison"
          message="No treatment records are available for this selected scope."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Location</th>
                <th>Treatment</th>
                <th>Records</th>
                <th>Avg Height</th>
                <th>Avg Tillers</th>
                <th>Avg Leaves</th>
                <th>Leaf Length</th>
                <th>Leaf Breadth</th>
                <th>Score</th>
              </tr>
            </thead>

            <tbody>
              {treatmentComparison.map((row, index) => (
                <tr key={`${row.location}-${row.treatment}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{row.location}</td>
                  <td>
                    <strong>{row.treatment}</strong>
                  </td>
                  <td>{row.records}</td>
                  <td>{row.avgHeight}</td>
                  <td>{row.avgTillers}</td>
                  <td>{row.avgLeaves}</td>
                  <td>{row.avgLeafLength}</td>
                  <td>{row.avgLeafBreadth}</td>
                  <td>
                    <span className="score-badge">{row.performanceScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DayWiseBiometricTable({ dayWiseBiometric }) {
  return (
    <section className="card data-card wide-card">
      <div className="card-header">
        <div>
          <h3>Day-wise Biometric Summary</h3>
          <p>Average biometric values grouped by observation day.</p>
        </div>
        <BarChart3 size={24} />
      </div>

      {dayWiseBiometric.length === 0 ? (
        <EmptyState
          title="No biometric day summary"
          message="No biometric values are available by observation day."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Observation Day</th>
                <th>Records</th>
                <th>Avg Height</th>
                <th>Avg Tillers</th>
                <th>Avg Leaves</th>
                <th>Leaf Length</th>
                <th>Leaf Breadth</th>
              </tr>
            </thead>

            <tbody>
              {dayWiseBiometric.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{row.records}</td>
                  <td>{row.avgHeight}</td>
                  <td>{row.avgTillers}</td>
                  <td>{row.avgLeaves}</td>
                  <td>{row.avgLeafLength}</td>
                  <td>{row.avgLeafBreadth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DayWiseFertigationTable({ dayWiseFertigation }) {
  return (
    <section className="card data-card wide-card">
      <div className="card-header">
        <div>
          <h3>Day-wise Fertigation Summary</h3>
          <p>Total nutrient and fertilizer product values by day after planting.</p>
        </div>
        <Droplets size={24} />
      </div>

      {dayWiseFertigation.length === 0 ? (
        <EmptyState
          title="No fertigation day summary"
          message="No fertigation values are available by day after planting."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Day After Planting</th>
                <th>Records</th>
                <th>N kg</th>
                <th>P2O5 kg</th>
                <th>K2O kg</th>
                <th>Urea kg</th>
                <th>DAP kg</th>
                <th>MAP kg</th>
                <th>Potash kg</th>
              </tr>
            </thead>

            <tbody>
              {dayWiseFertigation.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{row.records}</td>
                  <td>{row.n}</td>
                  <td>{row.p}</td>
                  <td>{row.k}</td>
                  <td>{row.urea}</td>
                  <td>{row.dap}</td>
                  <td>{row.map}</td>
                  <td>{row.potash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function NutrientGrowthTable({ nutrientVsGrowth }) {
  return (
    <section className="card data-card wide-card">
      <div className="card-header">
        <div>
          <h3>Nutrient Input vs Growth Response</h3>
          <p>
            Exploratory comparison of treatment-wise total NPK and biometric
            response.
          </p>
        </div>
      </div>

      {nutrientVsGrowth.length === 0 ? (
        <EmptyState
          title="No nutrient-growth comparison"
          message="Both biometric and fertigation records are required for this comparison."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Treatment</th>
                <th>Total NPK</th>
                <th>Total N</th>
                <th>Total P2O5</th>
                <th>Total K2O</th>
                <th>Avg Height</th>
                <th>Avg Tillers</th>
              </tr>
            </thead>

            <tbody>
              {nutrientVsGrowth.map((row, index) => (
                <tr key={`${row.location}-${row.treatment}-${index}`}>
                  <td>{row.location}</td>
                  <td>
                    <strong>{row.treatment}</strong>
                  </td>
                  <td>{row.totalNPK}</td>
                  <td>{row.totalN}</td>
                  <td>{row.totalP}</td>
                  <td>{row.totalK}</td>
                  <td>{row.avgHeight}</td>
                  <td>{row.avgTillers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function pushNumber(array, value) {
  const number = Number(value);

  if (!Number.isNaN(number)) {
    array.push(number);
  }
}

function average(values) {
  if (!values || values.length === 0) return 0;

  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return Number((total / values.length).toFixed(2));
}

function safeNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}

function round(value) {
  return Number(Number(value || 0).toFixed(2));
}

function maxValue(rows, key) {
  if (!rows || rows.length === 0) return 0;

  const values = rows
    .map((row) => Number(row[key]))
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) return 0;

  return Math.max(...values);
}

function normalizedScore(value, max) {
  if (!max || max === 0) return 0;

  return Number(value || 0) / max;
}

function metricToChartKey(metric) {
  const mapping = {
    plant_height_cm: "avgHeight",
    number_of_tillers: "avgTillers",
    number_of_leaves: "avgLeaves",
    leaf_length_cm: "avgLeafLength",
    leaf_breadth_cm: "avgLeafBreadth",
  };

  return mapping[metric] || "avgHeight";
}

function metricToTreatmentKey(metric) {
  const mapping = {
    plant_height_cm: "avgHeight",
    number_of_tillers: "avgTillers",
    number_of_leaves: "avgLeaves",
    leaf_length_cm: "avgLeafLength",
    leaf_breadth_cm: "avgLeafBreadth",
  };

  return mapping[metric] || "avgHeight";
}

function getUniqueSortedDays(rows, columnName) {
  return Array.from(
    new Set(
      (rows || [])
        .map((row) => Number(row[columnName]))
        .filter((value) => !Number.isNaN(value))
    )
  ).sort((a, b) => a - b);
}

function naturalSort(a, b) {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export default ComparativeAnalysis;
