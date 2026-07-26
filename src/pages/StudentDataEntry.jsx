import React, { useState, useMemo } from "react";
import {
  MapPin,
  Grid,
  Calendar,
  FlaskConical,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Save,
  Info,
  Leaf,
  Ruler,
  Sliders,
  Droplets,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  LayoutDashboard,
  Clock,
} from "lucide-react";

// Master Location mappings
const LOCATIONS = [
  { id: "L001", name: "Kumaraguru Agricultural College", shortName: "College" },
  { id: "L003", name: "Anthiyur", shortName: "Anthiyur" },
  { id: "L002", name: "Athani", shortName: "Athani" },
];

// Master Plot mappings
const PLOTS_BY_LOCATION = {
  L001: [
    { plot_id: "P001", name: "R1T1", rep: "R1", treatment_id: "T1" },
    { plot_id: "P002", name: "R1T2", rep: "R1", treatment_id: "T2" },
    { plot_id: "P003", name: "R1T3", rep: "R1", treatment_id: "T3" },
    { plot_id: "P004", name: "R1T4", rep: "R1", treatment_id: "T4" },
    { plot_id: "P005", name: "R1T5", rep: "R1", treatment_id: "T5" },
    { plot_id: "P006", name: "R1T6", rep: "R1", treatment_id: "T6" },
    { plot_id: "P007", name: "R1T7", rep: "R1", treatment_id: "T7" },
    { plot_id: "P008", name: "R1T8", rep: "R1", treatment_id: "T8" },
    { plot_id: "P009", name: "R1T9", rep: "R1", treatment_id: "T9" },
    { plot_id: "P010", name: "R1T10", rep: "R1", treatment_id: "T10" },
    { plot_id: "P011", name: "R1T11", rep: "R1", treatment_id: "T11" },
    { plot_id: "P012", name: "R1T12", rep: "R1", treatment_id: "T12" },
    { plot_id: "P013", name: "R1T13", rep: "R1", treatment_id: "T13" },
    { plot_id: "P014", name: "R1T14", rep: "R1", treatment_id: "T14" },
    { plot_id: "P015", name: "R2T1", rep: "R2", treatment_id: "T1" },
    { plot_id: "P016", name: "R2T2", rep: "R2", treatment_id: "T2" },
    { plot_id: "P017", name: "R2T3", rep: "R2", treatment_id: "T3" },
    { plot_id: "P018", name: "R2T4", rep: "R2", treatment_id: "T4" },
    { plot_id: "P019", name: "R2T5", rep: "R2", treatment_id: "T5" },
    { plot_id: "P020", name: "R2T6", rep: "R2", treatment_id: "T6" },
    { plot_id: "P021", name: "R2T7", rep: "R2", treatment_id: "T7" },
    { plot_id: "P022", name: "R2T8", rep: "R2", treatment_id: "T8" },
    { plot_id: "P023", name: "R2T9", rep: "R2", treatment_id: "T9" },
    { plot_id: "P024", name: "R2T10", rep: "R2", treatment_id: "T10" },
    { plot_id: "P025", name: "R2T11", rep: "R2", treatment_id: "T11" },
    { plot_id: "P026", name: "R2T12", rep: "R2", treatment_id: "T12" },
    { plot_id: "P027", name: "R2T13", rep: "R2", treatment_id: "T13" },
    { plot_id: "P028", name: "R2T14", rep: "R2", treatment_id: "T14" },
  ],
  L003: [
    { plot_id: "P034", name: "Plot A", plot_label: "A" },
    { plot_id: "P035", name: "Plot B", plot_label: "B" },
    { plot_id: "P036", name: "Plot C", plot_label: "C" },
    { plot_id: "P037", name: "Plot D", plot_label: "D" },
    { plot_id: "P038", name: "Plot E", plot_label: "E" },
  ],
  L002: [
    { plot_id: "P029", name: "Plot A", plot_label: "A" },
    { plot_id: "P030", name: "Plot B", plot_label: "B" },
    { plot_id: "P031", name: "Plot C", plot_label: "C" },
    { plot_id: "P032", name: "Plot D", plot_label: "D" },
    { plot_id: "P033", name: "Plot E", plot_label: "E" },
  ],
};

// Observation Days by Location
const OBSERVATION_DAYS_BY_LOCATION = {
  L001: [30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
  L003: [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
  L002: [30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
};

// Treatment descriptions lookup
const TREATMENT_DESCRIPTIONS = {
  L001: {
    T1: "Absolute control (No fertilizer)",
    T2: "100% RDF (SSL) + 12.5t FYM",
    T3: "100% RDF (TNAU CPG) + 12.5t FYM",
    T4: "75% RDF + 25% N Bioslurry (TNAU)",
    T5: "75% RDF + 25% N Treated Pressmud (TNAU)",
    T6: "75% RDF + 25% N Enriched Bio Compost (TNAU)",
    T7: "75% RDF + 25% N Trash Compost (TNAU)",
    T8: "75% RDF + 25% N Bioslurry (SSL)",
    T9: "75% RDF + 25% N Treated Pressmud (SSL)",
    T10: "75% RDF + 25% N Enriched Bio Compost (SSL)",
    T11: "75% RDF + 25% N Trash Compost (SSL)",
    T12: "100% RDF STCR - IPNS (Target 150 t/ha)",
    T13: "100% RDF STCR – IPNS (Target 175 t/ha)",
    T14: "100% RDF CoE + 12.5t FYM",
  },
  L003: {
    T1: "100% SSL High Yield CoE (568:284:296)",
    T2: "75% RDF + 25% N Enriched Bio Compost",
    T3: "100% RDF STCR-IPNS (Target 200 t/ha)",
    T4: "100% RDF TNAU CPG + 12.5t FYM",
    T5: "100% RDF SSL + 12.5t FYM",
  },
  L002: {
    T1: "100% SSL High Yield CoE (568:284:296)",
    T2: "75% RDF + 25% N Enriched Bio Compost",
    T3: "100% RDF STCR-IPNS (Target 200 t/ha)",
    T4: "100% RDF TNAU CPG + 12.5t FYM",
    T5: "100% RDF SSL + 12.5t FYM",
  },
};

function StudentDataEntry({ authSession, onBackToDashboard, onBackToLanding, onSignOut, onSubmitNewEntry }) {
  // Section 1: Header Dropdown & Target Selection States
  const [selectedLocation, setSelectedLocation] = useState("L001");
  const [selectedPlot, setSelectedPlot] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedObsDay, setSelectedObsDay] = useState("30");
  const [dateOfObs, setDateOfObs] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Section 2: Biometric Observation Field States
  const [plantNum, setPlantNum] = useState("1");
  const [plantHeight, setPlantHeight] = useState("");
  const [numTillers, setNumTillers] = useState("");
  const [numLeaves, setNumLeaves] = useState("");
  const [leafLength, setLeafLength] = useState("");
  const [leafBreadth, setLeafBreadth] = useState("");
  const [numNodes, setNumNodes] = useState("");
  const [nodeLength, setNodeLength] = useState("");
  const [millableCaneCount, setMillableCaneCount] = useState("");
  const [caneGirth, setCaneGirth] = useState("");
  const [plantCount1m, setPlantCount1m] = useState("");
  const [plantCount5m, setPlantCount5m] = useState("");
  const [plantCount15m, setPlantCount15m] = useState("");
  const [germinationPct, setGerminationPct] = useState("");

  // Section 3: Fertigation Schedule Field States
  const [fertigationDate, setFertigationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [whitePotashKg, setWhitePotashKg] = useState("");
  const [dapKg, setDapKg] = useState("");
  const [sspKg, setSspKg] = useState("");
  const [mnMixture, setMnMixture] = useState("");
  const [nKg, setNKg] = useState("");
  const [p2o5Kg, setP2o5Kg] = useState("");
  const [k2oKg, setK2oKg] = useState("");
  const [mapKg, setMapKg] = useState("");
  const [ureaKg, setUreaKg] = useState("");
  const [mopKg, setMopKg] = useState("");

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedEntries, setSubmittedEntries] = useState([]);

  // Available Plots based on selected Location
  const availablePlots = useMemo(() => {
    if (!selectedLocation) return [];
    return PLOTS_BY_LOCATION[selectedLocation] || [];
  }, [selectedLocation]);

  // Available Treatments for Location
  const availableTreatments = useMemo(() => {
    if (!selectedLocation) return [];
    if (selectedLocation === "L001") {
      return Array.from({ length: 14 }, (_, i) => `T${i + 1}`);
    }
    return ["T1", "T2", "T3", "T4", "T5"];
  }, [selectedLocation]);

  // Available Observation Days for Location
  const availableObsDays = useMemo(() => {
    return OBSERVATION_DAYS_BY_LOCATION[selectedLocation] || [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  }, [selectedLocation]);

  const numericObsDay = parseInt(selectedObsDay, 10) || 30;

  // Location Identifiers
  const isCollege = selectedLocation === "L001";
  const isAnthiyur = selectedLocation === "L003";

  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    setSelectedPlot("");
    setSelectedTreatment("");
    setSelectedObsDay("30");
    setSubmitSuccess("");
    setSubmitError("");
  };

  const handlePlotChange = (e) => {
    const plotId = e.target.value;
    setSelectedPlot(plotId);
    setSubmitSuccess("");
    setSubmitError("");

    const plotObj = availablePlots.find((p) => p.plot_id === plotId);
    if (plotObj && plotObj.treatment_id) {
      setSelectedTreatment(plotObj.treatment_id);
    }
  };

  const locationObj = LOCATIONS.find((l) => l.id === selectedLocation);
  const plotObj = availablePlots.find((p) => p.plot_id === selectedPlot);
  const treatmentDesc =
    selectedLocation && selectedTreatment
      ? TREATMENT_DESCRIPTIONS[selectedLocation]?.[selectedTreatment] || ""
      : "";

  // UNIFIED COMMON SUBMIT HANDLER
  const handleCommonSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!selectedLocation || !selectedPlot || !selectedTreatment) {
      setSubmitError(
        "Please select Location, Plot Allocation, and Treatment."
      );
      return;
    }

    const hasBiometricData = plantHeight || numTillers || numLeaves || plantCount1m || germinationPct;
    const hasFertigationData =
      whitePotashKg || nKg || p2o5Kg || k2oKg || mnMixture || ureaKg || mopKg || dapKg || sspKg || mapKg;

    if (!hasBiometricData && !hasFertigationData) {
      setSubmitError(
        "Please fill in at least one observation measurement or fertilizer quantity."
      );
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        locationName: locationObj?.shortName || selectedLocation,
        plotName: plotObj?.name || selectedPlot,
        obsDay: `${selectedObsDay} DAY`,
        treatment: selectedTreatment,
        obsDate: dateOfObs,
        fertDate: fertigationDate,
        // Biometrics
        plantNum: plantNum || "1",
        plantHeight: parseFloat(plantHeight) || 0,
        numTillers: parseInt(numTillers, 10) || 0,
        numLeaves: parseInt(numLeaves, 10) || 0,
        leafLength: leafLength ? parseFloat(leafLength) : "-",
        leafBreadth: leafBreadth ? parseFloat(leafBreadth) : "-",
        numNodes: numNodes || "-",
        nodeLength: nodeLength || "-",
        millableCaneCount: millableCaneCount || "-",
        plantCount1m: plantCount1m || "-",
        plantCount5m: plantCount5m || "-",
        plantCount15m: plantCount15m || "-",
        germinationPct: germinationPct || "-",
        // Fertigation
        whitePotashKg: parseFloat(whitePotashKg) || 0,
        dapKg: parseFloat(dapKg) || 0,
        sspKg: parseFloat(sspKg) || 0,
        mnMixture: parseFloat(mnMixture) || 0,
        nKg: parseFloat(nKg) || 0,
        p2o5Kg: parseFloat(p2o5Kg) || 0,
        k2oKg: parseFloat(k2oKg) || 0,
        mapKg: parseFloat(mapKg) || 0,
        ureaKg: parseFloat(ureaKg) || 0,
        mopKg: parseFloat(mopKg) || 0,
        studentEmail: authSession?.user?.email || "Student",
      };

      setSubmittedEntries((prev) => [newEntry, ...prev]);
      if (onSubmitNewEntry) {
        onSubmitNewEntry(newEntry);
      }
      setSubmitSuccess(
        `Field Data Record submitted successfully for ${newEntry.plotName} (${newEntry.locationName} - Treatment ${selectedTreatment}, Obs Date: ${dateOfObs}, Day ${selectedObsDay})!`
      );
      setSubmitting(false);

      // Clear numerical inputs
      setPlantHeight("");
      setNumTillers("");
      setNumLeaves("");
      setLeafLength("");
      setLeafBreadth("");
      setNumNodes("");
      setNodeLength("");
      setMillableCaneCount("");
      setCaneGirth("");
      setPlantCount1m("");
      setPlantCount5m("");
      setPlantCount15m("");
      setGerminationPct("");
      setWhitePotashKg("");
      setNKg("");
      setP2o5Kg("");
      setK2oKg("");
      setMnMixture("");
      setUreaKg("");
      setMopKg("");
      setDapKg("");
      setSspKg("");
      setMapKg("");
    }, 600);
  };

  const handleResetForm = () => {
    setSelectedPlot("");
    setSelectedTreatment("");
    setPlantHeight("");
    setNumTillers("");
    setNumLeaves("");
    setLeafLength("");
    setLeafBreadth("");
    setNumNodes("");
    setNodeLength("");
    setMillableCaneCount("");
    setCaneGirth("");
    setPlantCount1m("");
    setPlantCount5m("");
    setPlantCount15m("");
    setGerminationPct("");
    setWhitePotashKg("");
    setNKg("");
    setP2o5Kg("");
    setK2oKg("");
    setMnMixture("");
    setUreaKg("");
    setMopKg("");
    setDapKg("");
    setSspKg("");
    setMapKg("");
    setSubmitSuccess("");
    setSubmitError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 32px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* STANDALONE TOP NAVIGATION HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            background: "#ffffff",
            padding: "16px 24px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <ArrowLeft size={16} />
                <span>Public Dashboard</span>
              </button>
            )}

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#166534",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                <GraduationCap size={16} />
                <span>Field Data Collection Portal</span>
              </div>
              <h1
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: "1.3",
                }}
              >
                Student Field Data Entry Page
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {authSession?.user && (
              <div
                style={{
                  background: "#f0fdf4",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #bbf7d0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                <span>Student: {authSession.user.email}</span>
              </div>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Sign Out
              </button>
            )}

            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#f1f5f9",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Exit Portal
              </button>
            )}
          </div>
        </header>

        {/* HERO BANNER CARD */}
        <div
          style={{
            background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
            color: "white",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px -5px rgba(20, 83, 45, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={14} color="#fde047" />
                <span>{locationObj?.shortName} Growth & Fertigation Requirements</span>
              </span>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "white",
                  margin: "8px 0 4px 0",
                  lineHeight: "1.3",
                }}
              >
                {locationObj?.shortName} Field Data & Dosing Entry Form
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#e2e8f0",
                  maxWidth: "780px",
                  lineHeight: "1.5",
                }}
              >
                Select location (<b>College</b>, <b>Athani</b>, <b>Anthiyur</b>), target plot allocation, observation date, and treatment. 
                Parameters dynamically update with exact alignment without overlapping text.
              </p>
            </div>
          </div>
        </div>

        {/* UNIFIED FORM START */}
        <form onSubmit={handleCommonSubmit}>
          {/* CATEGORY 1: TARGET SELECTION & OBSERVATION DATE PANEL */}
          <div
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sliders size={20} style={{ color: "#166534" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  1. Target Location, Plot Allocation & Observation Date
                </h3>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={14} />
                <span>Clear Selections</span>
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "18px",
              }}
            >
              {/* Location Selector */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <MapPin size={15} style={{ color: "#166534" }} />
                  <span>Location *</span>
                </label>
                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: selectedLocation ? "2px solid #22c55e" : "1px solid #cbd5e1",
                    fontWeight: 700,
                    fontSize: "14px",
                    background: "#f0fdf4",
                    color: "#14532d",
                  }}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.shortName} ({loc.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plot Selector */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Grid size={15} style={{ color: "#166534" }} />
                  <span>Plot Allocation *</span>
                </label>
                <select
                  value={selectedPlot}
                  onChange={handlePlotChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: selectedPlot ? "2px solid #22c55e" : "1px solid #cbd5e1",
                    fontWeight: 600,
                    fontSize: "14px",
                    background: selectedPlot ? "#f0fdf4" : "white",
                  }}
                >
                  <option value="">
                    {isCollege
                      ? "-- Select Plot (R1T1 to R2T14) --"
                      : "-- Select Plot (Plot A, B, C, D, E) --"}
                  </option>
                  {availablePlots.map((plot) => (
                    <option key={plot.plot_id} value={plot.plot_id}>
                      {plot.name} {plot.rep ? `(${plot.rep})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Treatment Selector */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FlaskConical size={15} style={{ color: "#166534" }} />
                  <span>Treatment *</span>
                </label>
                <select
                  value={selectedTreatment}
                  onChange={(e) => setSelectedTreatment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: selectedTreatment ? "2px solid #22c55e" : "1px solid #cbd5e1",
                    fontWeight: 600,
                    fontSize: "14px",
                    background: selectedTreatment ? "#f0fdf4" : "white",
                  }}
                >
                  <option value="">
                    {isCollege
                      ? "-- Select Treatment (T1 to T14) --"
                      : "-- Select Treatment (T1 to T5) --"}
                  </option>
                  {availableTreatments.map((t) => (
                    <option key={t} value={t}>
                      {t} - {TREATMENT_DESCRIPTIONS[selectedLocation]?.[t] || ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observation Day Schedule */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Calendar size={15} style={{ color: "#166534" }} />
                  <span>Observation Day *</span>
                </label>
                <select
                  value={selectedObsDay}
                  onChange={(e) => setSelectedObsDay(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: selectedObsDay ? "2px solid #22c55e" : "1px solid #cbd5e1",
                    fontWeight: 600,
                    fontSize: "14px",
                    background: "#f0fdf4",
                  }}
                >
                  {availableObsDays.map((d) => (
                    <option key={d} value={d}>
                      Day {d} (Biometric Schedule)
                    </option>
                  ))}
                </select>
              </div>

              {/* OBSERVATION DATE (Explicit Requirement in Category 1) */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#166534",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Clock size={15} style={{ color: "#166534" }} />
                  <span>Observation Date (date_of_obs) *</span>
                </label>
                <input
                  type="date"
                  value={dateOfObs}
                  onChange={(e) => {
                    setDateOfObs(e.target.value);
                    setFertigationDate(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "2px solid #22c55e",
                    fontWeight: 700,
                    fontSize: "14px",
                    background: "#f0fdf4",
                    color: "#14532d",
                  }}
                />
              </div>
            </div>

            {treatmentDesc && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "#eef6f0",
                  border: "1px solid #bbf7d0",
                  fontSize: "13px",
                  color: "#14532d",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  lineHeight: "1.4",
                }}
              >
                <Info size={16} style={{ shrink: 0, color: "#16a34a" }} />
                <span>
                  <b>Treatment Spec for {selectedTreatment}:</b> {treatmentDesc}
                </span>
              </div>
            )}
          </div>

          {/* CATEGORY 2: BIOMETRIC PLANT GROWTH OBSERVATIONS & OBSERVATION DATE */}
          <div
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              background: "#ffffff",
              border: "1px solid #bbf7d0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Leaf size={20} style={{ color: "#166534" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#14532d" }}>
                  2. Biometric Growth Observations ({locationObj?.shortName})
                </h3>
              </div>

              {isCollege && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "12px",
                    background: numericObsDay <= 70 ? "#e0f2fe" : "#fef3c7",
                    color: numericObsDay <= 70 ? "#0369a1" : "#92400e",
                  }}
                >
                  {numericObsDay <= 70
                    ? "College Early Growth (Days 30-70: 1m, 5m, 15m Plant Counts & Vegetative Growth)"
                    : "College Maturity Stage (Days 80-120: 1m Count, Node Count & Node Length)"}
                </span>
              )}

              {isAnthiyur && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "12px",
                    background: numericObsDay <= 40 ? "#e0f2fe" : "#fef3c7",
                    color: numericObsDay <= 40 ? "#0369a1" : "#92400e",
                  }}
                >
                  {numericObsDay <= 40
                    ? "Anthiyur Early Stage (Days 30-40)"
                    : "Anthiyur Advanced Stage (Days 50-160)"}
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              {/* OBSERVATION DATE (Explicit Requirement in Category 2) */}
              <div style={{ background: "#f0fdf4", padding: "10px 12px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#166534", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Biometric Observation Date *
                </label>
                <input
                  type="date"
                  value={dateOfObs}
                  onChange={(e) => setDateOfObs(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #22c55e", fontSize: "14px", fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Plant Number (plant_num)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={plantNum}
                  onChange={(e) => setPlantNum(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Plant Height (plant_height) [cm]
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 185.5"
                  value={plantHeight}
                  onChange={(e) => setPlantHeight(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Tiller Count (number_of_tillers)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={numTillers}
                  onChange={(e) => setNumTillers(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Count (number_of_leaves)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={numLeaves}
                  onChange={(e) => setNumLeaves(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Height / Length (leaf_length) [cm]
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 110.2"
                  value={leafLength}
                  onChange={(e) => setLeafLength(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Width / Breadth (leaf_width) [cm]
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.5"
                  value={leafBreadth}
                  onChange={(e) => setLeafBreadth(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
            </div>

            {/* Sub-section: Location-Specific Plant Population & Node Characteristics */}
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Ruler size={15} />
                <span>
                  {isCollege
                    ? numericObsDay <= 70
                      ? "College Early Population Parameters (1m, 5m, 15m Plant Counts & Germination %)"
                      : "College Maturity Stage Parameters (1m Count, Node Count, Node Length & Germination %)"
                    : isAnthiyur
                    ? numericObsDay <= 40
                      ? "Anthiyur Early Stage Parameters (Number of Nodes)"
                      : "Anthiyur Advanced Stage Parameters (Millable Cane, 1m Row Length & Node Length)"
                    : "Node & Stem Characteristics"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                {/* 1m Plant Count */}
                {((isCollege) || (isAnthiyur && numericObsDay >= 50)) && (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Plant Count 1m Row (plant_count_1m)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={plantCount1m}
                      onChange={(e) => setPlantCount1m(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                )}

                {/* 5m Plant Count (College Days <= 70) */}
                {(isCollege && numericObsDay <= 70) && (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Plant Count 5m Row (plant_count_5m)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={plantCount5m}
                      onChange={(e) => setPlantCount5m(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                )}

                {/* 15m Plant Count (College Days <= 70) */}
                {(isCollege && numericObsDay <= 70) && (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Plant Count 15m Row (plant_count_15m)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 210"
                      value={plantCount15m}
                      onChange={(e) => setPlantCount15m(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                )}

                {/* Number of Nodes */}
                {(!isCollege && !isAnthiyur) || (isCollege && numericObsDay >= 80) || (isAnthiyur && numericObsDay <= 40) ? (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Number of Nodes (number_of_nodes)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 14"
                      value={numNodes}
                      onChange={(e) => setNumNodes(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                ) : null}

                {/* Node Length */}
                {(!isCollege && !isAnthiyur) || (isCollege && numericObsDay >= 80) || (isAnthiyur && numericObsDay >= 50) ? (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Node Length [cm] (node_length)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12.4"
                      value={nodeLength}
                      onChange={(e) => setNodeLength(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                ) : null}

                {/* Millable Cane */}
                {(!isCollege && !isAnthiyur) || (isAnthiyur && numericObsDay >= 50) ? (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Millable Cane Count (millable_cane)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 6"
                      value={millableCaneCount}
                      onChange={(e) => setMillableCaneCount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                ) : null}

                {/* Germination % (College) */}
                {isCollege && (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Germination % (germination_pct)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 88.5"
                      value={germinationPct}
                      onChange={(e) => setGerminationPct(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY 3: FERTIGATION DOSE SCHEDULE & APPLICATION DATE */}
          <div
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              background: "#ffffff",
              border: "1px solid #7dd3fc",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Droplets size={20} style={{ color: "#0284c7" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0369a1" }}>
                  3. Fertigation Dosing Schedule (Day 1 to 240, 10-day Intervals)
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "12px" }}>
                  Target: {locationObj?.shortName} {plotObj?.name ? `(${plotObj.name})` : ""}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              {/* FERTIGATION APPLICATION DATE (Explicit Requirement in Category 3) */}
              <div style={{ background: "#e0f2fe", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #38bdf8" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Fertigation Application Date *
                </label>
                <input
                  type="date"
                  value={fertigationDate}
                  onChange={(e) => setFertigationDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #0284c7", fontSize: "14px", fontWeight: 600, color: "#0369a1" }}
                />
              </div>

              {/* white_potash_kg */}
              <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #86efac" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#166534", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  White Potash (white_potash_kg) [kg] *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.30"
                  value={whitePotashKg}
                  onChange={(e) => setWhitePotashKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #22c55e", fontSize: "14px", fontWeight: 600 }}
                />
              </div>

              {/* n_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  N (n_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.40"
                  value={nKg}
                  onChange={(e) => setNKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* p2o5_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  P2O5 (p2o5_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.41"
                  value={p2o5Kg}
                  onChange={(e) => setP2o5Kg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* k2o_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  K2O (k2o_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.38"
                  value={k2oKg}
                  onChange={(e) => setK2oKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* mn_mixture */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Mn Mixture (mn_mixture) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.60"
                  value={mnMixture}
                  onChange={(e) => setMnMixture(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* urea_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Urea (urea_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.66"
                  value={ureaKg}
                  onChange={(e) => setUreaKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* map_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  MAP (map_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.22"
                  value={mapKg}
                  onChange={(e) => setMapKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* dap_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  DAP (dap_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 57.39"
                  value={dapKg}
                  onChange={(e) => setDapKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* ssp_kg (Single Super Phosphate) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  SSP (ssp_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25.0"
                  value={sspKg}
                  onChange={(e) => setSspKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* mop_kg */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  MOP (mop_kg) [kg]
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.30"
                  value={mopKg}
                  onChange={(e) => setMopKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
            </div>
          </div>

          {/* ERROR / SUCCESS ALERTS */}
          {submitError && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 600,
              }}
            >
              <AlertCircle size={20} />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={20} />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* SINGLE COMMON SUBMIT BUTTON AT THE VERY END OF THE PAGE */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "32px",
              border: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Ready to Save Complete {locationObj?.shortName} Entry?
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Submits target allocation, biometric growth observations, and fertigation schedule entries in one unified record.
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: submitting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 6px 18px rgba(22, 128, 61, 0.35)",
                whiteSpace: "nowrap",
              }}
            >
              <Save size={20} />
              <span>{submitting ? "Saving Entry..." : "SUBMIT FIELD DATA RECORD"}</span>
            </button>
          </div>
        </form>

        {/* SUBMITTED RECORDS TABLE LOG */}
        {submittedEntries.length > 0 && (
          <div
            style={{
              borderRadius: "16px",
              padding: "24px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
              <span>Submitted Field Records Log ({submittedEntries.length})</span>
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Time</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Location</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Plot</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Day / Date</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Treatment</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Biometric Measurements</th>
                    <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Fertilizer Amounts (Date & White Potash)</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedEntries.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{entry.timestamp}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{entry.locationName}</td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}><b>{entry.plotName}</b></td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{entry.obsDay}<br/><span style={{ fontSize: "11px", color: "#64748b" }}>{entry.obsDate}</span></td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ background: "#eef6f0", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                          {entry.treatment}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        Obs Date: {entry.obsDate} | Plant #{entry.plantNum} | Height: {entry.plantHeight}cm | Tillers: {entry.numTillers} | Leaves: {entry.numLeaves}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#0369a1" }}>
                        Fert Date: {entry.fertDate} | <b>White Potash: {entry.whitePotashKg}kg</b> | N:{entry.nKg}kg | P2O5:{entry.p2o5Kg}kg | K2O:{entry.k2oKg}kg | Mn:{entry.mnMixture}kg | MAP:{entry.mapKg}kg | DAP:{entry.dapKg}kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDataEntry;
