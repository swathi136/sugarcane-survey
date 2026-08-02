import React, { useState, useMemo } from "react";
import {
  MapPin,
  Grid,
  Calendar,
  FlaskConical,
  Sparkles,
  RefreshCw,
  Save,
  Info,
  Leaf,
  Ruler,
  TrendingUp,
  Sliders,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { insertFieldEntry } from "../services/fieldEntryService";

// Master Location mappings
const LOCATIONS = [
  { id: "L001", name: "Kumaraguru Agricultural College", shortName: "College" },
  { id: "L002", name: "Athani", shortName: "Athani" },
  { id: "L003", name: "Anthiyur", shortName: "Anthiyur" },
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
    { plot_id: "P034", name: "Plot A", plot_label: "A", treatment_id: "T1" },
    { plot_id: "P035", name: "Plot B", plot_label: "B", treatment_id: "T2" },
    { plot_id: "P036", name: "Plot C", plot_label: "C", treatment_id: "T3" },
    { plot_id: "P037", name: "Plot D", plot_label: "D", treatment_id: "T4" },
    { plot_id: "P038", name: "Plot E", plot_label: "E", treatment_id: "T5" },
  ],
  L002: [
    { plot_id: "P029", name: "Plot A", plot_label: "A" },
    { plot_id: "P030", name: "Plot B", plot_label: "B" },
    { plot_id: "P031", name: "Plot C", plot_label: "C" },
    { plot_id: "P032", name: "Plot D", plot_label: "D" },
    { plot_id: "P033", name: "Plot E", plot_label: "E" },
  ],
};

// Observation Days
const OBSERVATION_DAYS = [
  { value: "30", label: "30 DAY" },
  { value: "40", label: "40 DAY" },
  { value: "50", label: "50 DAY" },
  { value: "60", label: "60 DAY" },
  { value: "70", label: "70 DAY" },
  { value: "80", label: "80 DAY" },
  { value: "90", label: "90 DAY" },
  { value: "100", label: "100 DAY" },
  { value: "110", label: "110 DAY" },
  { value: "120", label: "120 DAY" },
];

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
  L002: {
    T1: "100% SSL High Yield CoE (568:284:296)",
    T2: "75% RDF + 25% N Enriched Bio Compost",
    T3: "100% RDF STCR-IPNS (Target 200 t/ha)",
    T4: "100% RDF TNAU CPG + 12.5t FYM",
    T5: "100% RDF SSL + 12.5t FYM",
  },
  L003: {
    T1: "100% SSL High Yield CoE (568:284:296)",
    T2: "75% RDF + 25% N Enriched Bio Compost",
    T3: "100% RDF STCR-IPNS (Target 200 t/ha)",
    T4: "100% RDF TNAU CPG + 12.5t FYM",
    T5: "100% RDF SSL + 12.5t FYM",
  },
};

function StudentDataEntry({ data, authSession }) {
  // Cascaded Dropdown States
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedPlot, setSelectedPlot] = useState("");
  const [selectedObsDay, setSelectedObsDay] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");

  // Form Field States
  const [dateOfObs, setDateOfObs] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [plantHeight, setPlantHeight] = useState("");
  const [numTillers, setNumTillers] = useState("");
  const [numLeaves, setNumLeaves] = useState("");
  const [leafLength, setLeafLength] = useState("");
  const [leafBreadth, setLeafBreadth] = useState("");
  const [numNodes, setNumNodes] = useState("");
  const [nodeLength, setNodeLength] = useState("");
  const [millableCaneCount, setMillableCaneCount] = useState("");
  const [plantCount1m, setPlantCount1m] = useState("");
  const [plantCount5m, setPlantCount5m] = useState("");
  const [plantCount15m, setPlantCount15m] = useState("");
  const [germinationPct, setGerminationPct] = useState("");

  // Submission Status State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedEntries, setSubmittedEntries] = useState([]);

  // Filtered Plots based on Location
  const availablePlots = useMemo(() => {
    return PLOTS_BY_LOCATION[selectedLocation] || [];
  }, [selectedLocation]);

  // Available Treatments for Location
  const availableTreatments = useMemo(() => {
    if (selectedLocation === "L001") {
      return Array.from({ length: 14 }, (_, i) => `T${i + 1}`);
    }
    return ["T1", "T2", "T3", "T4", "T5"];
  }, [selectedLocation]);

  // Handle Location Change (Resets dependent dropdowns)
  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    setSelectedPlot("");
    setSelectedTreatment("");
    setSubmitSuccess("");
    setSubmitError("");
  };

  // Handle Plot Change (Auto populates Treatment if applicable)
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

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitError("");
    setSubmitSuccess("");

    if (!selectedLocation || !selectedPlot || !selectedTreatment) {
      setSubmitError(
        "Please select Location, Plot Allocation, and Treatment."
      );
      return;
    }

    if (!plantHeight || !numTillers || !numLeaves) {
      setSubmitError(
        "Please fill in the core observations: Plant Height, Tillers, and Leaves."
      );
      return;
    }

    // Validate main numerical fields
    const numericFields = [
      { label: "Plant number", value: plantNum },
      { label: "Plant height", value: plantHeight },
      { label: "Tiller count", value: numTillers },
      { label: "Leaf count", value: numLeaves },
      { label: "Leaf length", value: leafLength },
      { label: "Leaf width", value: leafBreadth },
      { label: "Number of nodes", value: numNodes },
      { label: "Node length", value: nodeLength },
      { label: "Millable cane count", value: millableCaneCount },
      { label: "Plant count (1m)", value: plantCount1m },
      { label: "Plant count (5m)", value: plantCount5m },
      { label: "Plant count (15m)", value: plantCount15m },
      { label: "Germination percentage", value: germinationPct },
      { label: "White potash", value: whitePotashKg },
      { label: "N", value: nKg },
      { label: "P2O5", value: p2o5Kg },
      { label: "K2O", value: k2oKg },
      { label: "Mn mixture", value: mnMixture },
      { label: "Urea", value: ureaKg },
      { label: "MAP", value: mapKg },
      { label: "DAP", value: dapKg },
      { label: "SSP", value: sspKg },
      { label: "MOP", value: mopKg },
    ];

    const invalidNumericField = numericFields.find(({ value }) => {
      if (value === "" || value === null || value === undefined) return false;
      const numericValue = Number(value);
      return !Number.isFinite(numericValue) || numericValue < 0;
    });

    if (invalidNumericField) {
      setSubmitError(
        `${invalidNumericField.label} must be a valid number that is zero or greater.`
      );
      return;
    }

    const asNullableNumber = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    };

    // Format custom fields summary for logging
    const customBioSummary = customBiometricFields
      .filter((f) => f.name.trim() !== "")
      .map((f) => `${f.name}: ${f.value || "0"}`)
      .join(", ");

    const customFertSummary = customFertigationFields
      .filter((f) => f.name.trim() !== "")
      .map((f) => `${f.name}: ${f.value || "0"}`)
      .join(", ");

    // College Supabase database submission
    if (isCollege) {
      const collegePlotPattern = /^R[12]T(?:[1-9]|1[0-4])$/;
      const collegeTreatmentPattern = /^T(?:[1-9]|1[0-4])$/;

      if (!collegePlotPattern.test(plotObj?.name || "")) {
        setSubmitError("Please select a valid College plot (R1T1 to R2T14).");
        return;
      }

      if (!collegeTreatmentPattern.test(selectedTreatment)) {
        setSubmitError("Please select a valid College treatment (T1 to T14).");
        return;
      }

      const payload = {
        location_code: "L001",
        location_name: "Kumaraguru Agricultural College",
        plot: plotObj.name,
        treatment: selectedTreatment,
        observation_day: observationDay,
        observation_date: dateOfObs,

        plant_number: asNullableNumber(plantNum),
        plant_height: asNullableNumber(plantHeight),
        tiller_count: asNullableNumber(numTillers),
        leaf_count: asNullableNumber(numLeaves),
        leaf_length: asNullableNumber(leafLength),
        leaf_width: asNullableNumber(leafBreadth),
        plant_count_1m: asNullableNumber(plantCount1m),
        plant_count_5m: asNullableNumber(plantCount5m),
        plant_count_15m: asNullableNumber(plantCount15m),
        number_of_nodes: asNullableNumber(numNodes),
        node_length: asNullableNumber(nodeLength),
        germination_pct: asNullableNumber(germinationPct),

        fertigation_date: fertigationDate,
        white_potash_kg: asNullableNumber(whitePotashKg),
        n_kg: asNullableNumber(nKg),
        p2o5_kg: asNullableNumber(p2o5Kg),
        k2o_kg: asNullableNumber(k2oKg),
        mn_mixture: asNullableNumber(mnMixture),
        urea: asNullableNumber(ureaKg),
        map: asNullableNumber(mapKg),
        dap: asNullableNumber(dapKg),
        ssp: asNullableNumber(sspKg),
        mop: asNullableNumber(mopKg),
      };

      // Save student email to localStorage since we can't alter Supabase schema
      const tempEmail = authSession?.user?.email || "";
      
      setSubmitting(true);

    // Simulate entry save (could also save to Supabase database table)
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
        date: dateOfObs,
        plantHeight: parseFloat(plantHeight) || 0,
        numTillers: parseInt(numTillers, 10) || 0,
        numLeaves: parseInt(numLeaves, 10) || 0,
        leafLength: leafLength ? parseFloat(leafLength) : "-",
        leafBreadth: leafBreadth ? parseFloat(leafBreadth) : "-",
        studentEmail: authSession?.user?.email || "Student",
      };

      setSubmittedEntries((prev) => [newEntry, ...prev]);
      setSubmitSuccess(
        `Biometric record submitted successfully for ${newEntry.plotName} (${newEntry.locationName} - Day ${selectedObsDay})!`
      );
      setSubmitting(false);

      // Reset numerical fields for next sample
      setPlantHeight("");
      setNumTillers("");
      setNumLeaves("");
      setLeafLength("");
      setLeafBreadth("");
      setNumNodes("");
      setNodeLength("");
      setMillableCaneCount("");
      setCaneGirth("");
    }, 600);
  };

  const handleClearForm = () => {
    setSelectedLocation("");
    setSelectedPlot("");
    setSelectedObsDay("");
    setSelectedTreatment("");
    setPlantHeight("");
    setNumTillers("");
    setNumLeaves("");
    setLeafLength("");
    setLeafBreadth("");
    setNumNodes("");
    setNodeLength("");
    setMillableCaneCount("");
    setPlantCount1m("");
    setPlantCount5m("");
    setPlantCount15m("");
    setGerminationPct("");
    setSubmitSuccess("");
    setSubmitError("");
  };

  return (
    <div className="student-entry-container" style={{ padding: "8px 0" }}>
      {/* Banner / Header Card */}
      <div
        className="card student-entry-header-card"
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "24px",
          boxShadow: "0 10px 25px -5px rgba(20, 83, 45, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "10px",
                backdropFilter: "blur(4px)",
              }}
            >
              <Sparkles size={14} color="#fde047" />
              <span>Student Field Observation Entry</span>
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "white",
                margin: "0 0 6px 0",
              }}
            >
              Sugarcane Biometric Data Entry Portal
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#e2e8f0",
                margin: 0,
                maxWidth: "680px",
              }}
            >
              Select the <b>Location</b>, <b>Plot</b>, <b>Observation Day</b>,
              and <b>Treatment</b> below. The data entry form will unlock
              automatically once all four selections are confirmed.
            </p>
          </div>

          {authSession?.user && (
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: "13px",
              }}
            >
              <div style={{ color: "#86efac", fontSize: "11px", fontWeight: 700 }}>
                LOGGED IN STUDENT
              </div>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                {authSession.user.email}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 1: CASCADED DROPDOWN SELECTION PANEL */}
      <div
        className="card"
        style={{
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "12px",
          }}
        >
          <Sliders size={20} className="accent-color" />
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
            1. Target Plot & Observation Selection
          </h3>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              fontWeight: 600,
              color: isHeaderSelectionComplete ? "#15803d" : "#64748b",
              background: isHeaderSelectionComplete ? "#dcfce7" : "#f1f5f9",
              padding: "4px 12px",
              borderRadius: "12px",
            }}
          >
            {isHeaderSelectionComplete
              ? "✓ Selection Complete - Form Unlocked"
              : "Step 1 of 2: Make Selections Below"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Dropdown 1: Location */}
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "6px",
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
                outline: "none",
                fontWeight: 600,
                fontSize: "14px",
                background: selectedLocation ? "#f0fdf4" : "white",
              }}
            >
              <option value="">-- Select Location --</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.shortName} ({loc.name})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Plot */}
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              <Grid size={15} style={{ color: "#166534" }} />
              <span>Plot *</span>
            </label>
            <select
              value={selectedPlot}
              onChange={handlePlotChange}
              disabled={!selectedLocation}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: selectedPlot ? "2px solid #22c55e" : "1px solid #cbd5e1",
                outline: "none",
                fontWeight: 600,
                fontSize: "14px",
                background: !selectedLocation
                  ? "#f8fafc"
                  : selectedPlot
                  ? "#f0fdf4"
                  : "white",
                cursor: !selectedLocation ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {!selectedLocation
                  ? "-- Select Location First --"
                  : "-- Select Plot --"}
              </option>
              {availablePlots.map((plot) => (
                <option key={plot.plot_id} value={plot.plot_id}>
                  {plot.name}{" "}
                  {plot.rep ? `(${plot.rep})` : ""}{" "}
                  {plot.treatment_id ? `[${plot.treatment_id}]` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Observation Day */}
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              <Calendar size={15} style={{ color: "#166534" }} />
              <span>Observation Day *</span>
            </label>
            <select
              value={selectedObsDay}
              onChange={(e) => setSelectedObsDay(e.target.value)}
              disabled={!selectedLocation}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: selectedObsDay ? "2px solid #22c55e" : "1px solid #cbd5e1",
                outline: "none",
                fontWeight: 600,
                fontSize: "14px",
                background: !selectedLocation
                  ? "#f8fafc"
                  : selectedObsDay
                  ? "#f0fdf4"
                  : "white",
                cursor: !selectedLocation ? "not-allowed" : "pointer",
              }}
            >
              <option value="">-- Select Day --</option>
              {OBSERVATION_DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 4: Treatment */}
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              <FlaskConical size={15} style={{ color: "#166534" }} />
              <span>Treatment *</span>
            </label>
            <select
              value={selectedTreatment}
              onChange={(e) => setSelectedTreatment(e.target.value)}
              disabled={!selectedLocation}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: selectedTreatment
                  ? "2px solid #22c55e"
                  : "1px solid #cbd5e1",
                outline: "none",
                fontWeight: 600,
                fontSize: "14px",
                background: !selectedLocation
                  ? "#f8fafc"
                  : selectedTreatment
                  ? "#f0fdf4"
                  : "white",
                cursor: !selectedLocation ? "not-allowed" : "pointer",
              }}
            >
              <option value="">-- Select Treatment --</option>
              {availableTreatments.map((t) => (
                <option key={t} value={t}>
                  {t} - {TREATMENT_DESCRIPTIONS[selectedLocation]?.[t] || ""}
                </option>
              ))}
            </select>
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

      {/* STEP 2: CONDITIONAL DATA ENTRY FORM SECTION */}
      {!isHeaderSelectionComplete ? (
        <div
          className="card"
          style={{
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            background: "#f8fafc",
            border: "2px dashed #cbd5e1",
            color: "#64748b",
          }}
        >
          <ClipboardList
            size={48}
            style={{ color: "#94a3b8", marginBottom: "12px" }}
          />
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#334155",
              margin: "0 0 8px 0",
            }}
          >
            Biometric Data Entry Form Locked
          </h3>
          <p
            style={{
              maxWidth: "500px",
              margin: "0 auto 16px auto",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Please select the <b>Location</b>, <b>Plot</b>, <b>Observation Day</b>
            , and <b>Treatment</b> in the selection panel above to reveal the data entry fields.
          </p>

          <div
            style={{
              display: "inline-flex",
              gap: "12px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                color: selectedLocation ? "#16a34a" : "#94a3b8",
                background: selectedLocation ? "#dcfce7" : "#e2e8f0",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              1. Location {selectedLocation ? "✓" : ""}
            </span>
            <span
              style={{
                color: selectedPlot ? "#16a34a" : "#94a3b8",
                background: selectedPlot ? "#dcfce7" : "#e2e8f0",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              2. Plot {selectedPlot ? "✓" : ""}
            </span>
            <span
              style={{
                color: selectedObsDay ? "#16a34a" : "#94a3b8",
                background: selectedObsDay ? "#dcfce7" : "#e2e8f0",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              3. Day {selectedObsDay ? "✓" : ""}
            </span>
            <span
              style={{
                color: selectedTreatment ? "#16a34a" : "#94a3b8",
                background: selectedTreatment ? "#dcfce7" : "#e2e8f0",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              4. Treatment {selectedTreatment ? "✓" : ""}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            className="card"
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
              <div>
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#14532d",
                  }}
                >
                  2. Enter Biometric Observation Measurements
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClearForm}
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
                <span>Reset Selections</span>
              </button>
            </div>

            {/* Error & Success Alert Banners */}
            {submitError && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={18} style={{ shrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={18} style={{ shrink: 0 }} />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Form Section 1: Date & Metadata */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Calendar size={16} className="accent-color" />
                <span>Observation Date</span>
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Date of Observation
                  </label>
                  <input
                    type="date"
                    value={dateOfObs}
                    onChange={(e) => setDateOfObs(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Form Section 2: Primary Vegetative Growth Parameters */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#15803d",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <Leaf size={16} />
                <span>Primary Biometric Observations</span>
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Plant Height (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 185.5"
                    value={plantHeight}
                    onChange={(e) => setPlantHeight(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Number of Tillers per clump *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8"
                    value={numTillers}
                    onChange={(e) => setNumTillers(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Number of Leaves per plant *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={numLeaves}
                    onChange={(e) => setNumLeaves(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Leaf Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 110.2"
                    value={leafLength}
                    onChange={(e) => setLeafLength(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Leaf Breadth (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={leafBreadth}
                    onChange={(e) => setLeafBreadth(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Form Section 3: Stem & Node Characteristics */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#15803d",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <Ruler size={16} />
                <span>Node & Stem Parameters</span>
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Number of Nodes
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 14"
                    value={numNodes}
                    onChange={(e) => setNumNodes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Node Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 12.4"
                    value={nodeLength}
                    onChange={(e) => setNodeLength(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Millable Cane Count
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 6"
                    value={millableCaneCount}
                    onChange={(e) => setMillableCaneCount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Cane Girth (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.2"
                    value={caneGirth}
                    onChange={(e) => setCaneGirth(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Form Section 4: Plant Population & Establishment */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#15803d",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <TrendingUp size={16} />
                <span>Plant Population & Germination</span>
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Plant Count (1m row)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={plantCount1m}
                    onChange={(e) => setPlantCount1m(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Plant Count (5m row)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={plantCount5m}
                    onChange={(e) => setPlantCount5m(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Plant Count (15m row)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 210"
                    value={plantCount15m}
                    onChange={(e) => setPlantCount15m(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Germination %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 88.5"
                    value={germinationPct}
                    onChange={(e) => setGerminationPct(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "16px",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: submitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(22, 128, 61, 0.3)",
                }}
              >
                <Save size={18} />
                <span>{submitting ? "Saving Entry..." : "Submit Biometric Record"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* RECENT SUBMISSIONS LOG TABLE */}
      {submittedEntries.length > 0 && (
        <div
          className="card"
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
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
            <span>Recently Submitted Student Entries ({submittedEntries.length})</span>
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Plot</th>
                  <th>Day</th>
                  <th>Treatment</th>
                  <th>Height (cm)</th>
                  <th>Tillers</th>
                  <th>Leaves</th>
                  <th>Student</th>
                </tr>
              </thead>
              <tbody>
                {submittedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                      {entry.timestamp}
                    </td>
                    <td>
                      <span className="badge location-badge">
                        {entry.locationName}
                      </span>
                    </td>
                    <td>
                      <b>{entry.plotName}</b>
                    </td>
                    <td>{entry.obsDay}</td>
                    <td>
                      <span className="badge treatment-badge">
                        {entry.treatment}
                      </span>
                    </td>
                    <td>
                      <b>{entry.plantHeight} cm</b>
                    </td>
                    <td>{entry.numTillers}</td>
                    <td>{entry.numLeaves}</td>
                    <td style={{ fontSize: "12px" }}>{entry.studentEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDataEntry;
