import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Sliders,
  Droplets,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { insertFieldEntry, insertFieldEntryObservations } from "../services/fieldEntryService";
import { averageFilledObservations, buildObservationRows } from "../utils/fieldObservations";

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
  L002: [
    { plot_id: "P029", name: "Plot A", plot_label: "A", treatment_id: "T1" },
    { plot_id: "P030", name: "Plot B", plot_label: "B", treatment_id: "T2" },
    { plot_id: "P031", name: "Plot C", plot_label: "C", treatment_id: "T3" },
    { plot_id: "P032", name: "Plot D", plot_label: "D", treatment_id: "T4" },
    { plot_id: "P033", name: "Plot E", plot_label: "E", treatment_id: "T5" },
  ],
  L003: [
    { plot_id: "P034", name: "Plot A", plot_label: "A", treatment_id: "T1" },
    { plot_id: "P035", name: "Plot B", plot_label: "B", treatment_id: "T2" },
    { plot_id: "P036", name: "Plot C", plot_label: "C", treatment_id: "T3" },
    { plot_id: "P037", name: "Plot D", plot_label: "D", treatment_id: "T4" },
    { plot_id: "P038", name: "Plot E", plot_label: "E", treatment_id: "T5" },
  ],
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

const formatCustomFields = (fields) =>
  Array.isArray(fields)
    ? fields
        .filter((field) => field?.name)
        .map((field) => {
          const observations = Array.isArray(field.observations)
            ? ` (Obs: ${field.observations.map((value) => value ?? "-").join(", ")})`
            : "";
          return `${field.name}: Avg ${field.value ?? "-"}${observations}`;
        })
        .join(", ")
    : "";

const normalizeStudentEntry = (row, locationName, tableName) => {
  const isCollegeEntry = tableName === "field_entries";

  return {
    id: row.id,
    tableName,
    createdAt: row.created_at,
    timestamp: new Date(row.created_at).toLocaleString(),
    locationName,
    locationId: row.location_code,
    plotName: row.plot,
    obsDay: `DAY ${row.observation_day}`,
    treatment: row.treatment,
    obsDate: isCollegeEntry ? row.observation_date : row.date_of_obs,
    fertDate: row.fertigation_date,
    plantHeight: row.plant_height ?? "-",
    numTillers: row.tiller_count ?? "-",
    numLeaves: row.leaf_count ?? "-",
    leafLength: (isCollegeEntry ? row.leaf_length : row.leaf_height) ?? "-",
    leafBreadth: (isCollegeEntry ? row.leaf_width : row.leaf_breath) ?? "-",
    numNodes: row.number_of_nodes ?? "-",
    nodeLength: row.node_length ?? "-",
    millableCaneCount: row.millable_cane_count_1m ?? "-",
    plantCount1m: row.plant_count_1m ?? "-",
    plantCount5m: row.plant_count_5m ?? "-",
    plantCount15m: row.plant_count_15m ?? "-",
    germinationPct: row.germination_pct ?? "-",
    whitePotashKg: row.white_potash_kg ?? "-",
    nKg: row.n_kg ?? "-",
    p2o5Kg: row.p2o5_kg ?? "-",
    k2oKg: row.k2o_kg ?? "-",
    mnMixture: row.mn_mixture ?? "-",
    mapKg: (isCollegeEntry ? row.map : row.map_kg) ?? "-",
    dapKg: (isCollegeEntry ? row.dap : row.dap_kg) ?? "-",
    sspKg: row.ssp ?? "-",
    ureaKg: (isCollegeEntry ? row.urea : row.urea_kg) ?? "-",
    mopKg: row.mop ?? "-",
    customBiometrics: formatCustomFields(row.custom_biometric),
    customFertigation: formatCustomFields(row.custom_fertigation),
    status: String(row.status || "Pending").toUpperCase(),
    rejectionFeedback: row.rejection_feedback || "",
  };
};

const MultiInput = ({ label, values, setValues, type = "number", step, min, placeholder }) => {
  const count = values.filter((v) => v !== "").length;
  const validVals = values
    .filter((v) => v !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  const avg = validVals.length
    ? (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2)
    : "";

  const complete = count === 5;
  const progressColor = complete ? "#15803d" : count > 0 ? "#b45309" : "#64748b";

  return (
    <details style={{ marginBottom: "12px", background: "#ffffff", borderRadius: "12px", border: `1px solid ${complete ? "#bbf7d0" : "#e2e8f0"}`, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)", overflow: "hidden" }}>
      <summary style={{ listStyle: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", userSelect: "none" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155", lineHeight: 1.4 }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ color: progressColor, background: complete ? "#f0fdf4" : count > 0 ? "#fffbeb" : "#f8fafc", borderRadius: "999px", padding: "4px 9px", fontSize: "11px", fontWeight: 800 }}>
            {count}/5 entered
          </span>
          <span style={{ color: "#166534", fontSize: "12px", fontWeight: 800, minWidth: "82px", textAlign: "right" }}>Avg: {avg || "—"}</span>
          <ChevronDown className="multi-input-chevron" size={17} color="#64748b" />
        </span>
      </summary>
      <div style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc", padding: "14px 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "10px" }}>
        {values.map((v, i) => (
          <label key={i} style={{ display: "grid", gap: "5px", color: "#475569", fontSize: "11px", fontWeight: 700 }}>
            Observation {i + 1}
            <input
              type={type}
              min={min}
              step={step ?? "any"}
              placeholder={i === 0 ? placeholder : "Enter value"}
              value={v}
              onChange={(e) => {
                const newVals = [...values];
                newVals[i] = e.target.value;
                setValues(newVals);
              }}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "13px", textAlign: "center", outlineColor: "#16a34a" }}
            />
          </label>
        ))}
        </div>
        <div style={{ marginTop: "10px", color: "#64748b", fontSize: "11px" }}>Leave an observation blank when it was not recorded. Zero is treated as a recorded value.</div>
      </div>
    </details>
  );
};

const CustomObservationField = ({ field, onNameChange, onValuesChange, onRemove, accent = "green" }) => {
  const blue = accent === "blue";
  return (
    <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, border: `1px solid ${blue ? "#bae6fd" : "#bbf7d0"}`, background: blue ? "#f0f9ff" : "#f0fdf4" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) auto", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <input
          type="text"
          aria-label="Custom requirement name"
          placeholder={blue ? "Requirement name (e.g. Zinc Sulphate)" : "Requirement name (e.g. Cane Diameter)"}
          value={field.name}
          onChange={(event) => onNameChange(event.target.value)}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
        />
        <button type="button" aria-label={`Delete ${field.name || "custom requirement"}`} onClick={onRemove} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239", padding: "9px 11px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          <Trash2 size={15} /> Delete
        </button>
      </div>
      <MultiInput
        label={field.name.trim() || "Custom requirement observations"}
        values={field.values}
        setValues={onValuesChange}
        min="0"
        step="any"
        placeholder="Enter value"
      />
    </div>
  );
};

function StudentDataEntry({
  authSession,
  submissions = [],
  onBackToDashboard,
  onBackToLanding,
  onSignOut,
  onSubmitNewEntry,
}) {
  // Today's date default
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Section 1: Header Target Selection States (Default values pre-filled)
  const [selectedLocation, setSelectedLocation] = useState("L001");
  const [selectedPlot, setSelectedPlot] = useState("P001");
  const [selectedTreatment, setSelectedTreatment] = useState("T1");
  // Observation Day: Human-written typing input (defaulted to 30)
  const [selectedObsDay, setSelectedObsDay] = useState("30");
  const [dateOfObs, setDateOfObs] = useState(todayStr);

  const emptyFive = () => ["", "", "", "", ""];
  // Section 2: Biometric Observation Field States
  const [plantHeight, setPlantHeight] = useState(emptyFive());
  const [numTillers, setNumTillers] = useState(emptyFive());
  const [numLeaves, setNumLeaves] = useState(emptyFive());
  const [leafLength, setLeafLength] = useState(emptyFive());
  const [leafBreadth, setLeafBreadth] = useState(emptyFive());
  const [numNodes, setNumNodes] = useState(emptyFive());
  const [nodeLength, setNodeLength] = useState(emptyFive());
  const [millableCaneCount, setMillableCaneCount] = useState(emptyFive());
  const [plantCount1m, setPlantCount1m] = useState(emptyFive());
  const [plantCount5m, setPlantCount5m] = useState(emptyFive());
  const [plantCount15m, setPlantCount15m] = useState(emptyFive());
  const [germinationPct, setGerminationPct] = useState(emptyFive());

  // Dynamic Custom Biometric Fields
  const [customBiometricFields, setCustomBiometricFields] = useState([]);

  // Section 3: Fertigation Schedule Field States
  const [fertigationDate, setFertigationDate] = useState(todayStr);
  const [whitePotashKg, setWhitePotashKg] = useState(emptyFive());
  const [dapKg, setDapKg] = useState(emptyFive());
  const [sspKg, setSspKg] = useState(emptyFive());
  const [mnMixture, setMnMixture] = useState(emptyFive());
  const [nKg, setNKg] = useState(emptyFive());
  const [p2o5Kg, setP2o5Kg] = useState(emptyFive());
  const [k2oKg, setK2oKg] = useState(emptyFive());
  const [mapKg, setMapKg] = useState(emptyFive());
  const [ureaKg, setUreaKg] = useState(emptyFive());
  const [mopKg, setMopKg] = useState(emptyFive());

  // Dynamic Custom Fertigation Fields
  const [customFertigationFields, setCustomFertigationFields] = useState([]);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedEntries, setSubmittedEntries] = useState([]);
  const [databaseSubmissions, setDatabaseSubmissions] = useState([]);
  const [studentRecordsLoaded, setStudentRecordsLoaded] = useState(false);

  const loadStudentSubmissions = useCallback(async () => {
    const userId = authSession?.user?.id;
    if (!userId) {
      setDatabaseSubmissions([]);
      setStudentRecordsLoaded(false);
      return;
    }

    const sources = [
      ["field_entries", "College"],
      ["athani_field_entries", "Athani"],
      ["anthiyur_field_entries", "Anthiyur"],
    ];

    const results = await Promise.all(
      sources.map(async ([tableName, locationName]) => {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(`Unable to load student records from ${tableName}:`, error);
          return [];
        }

        return (data || []).map((row) => normalizeStudentEntry(row, locationName, tableName));
      }),
    );

    setDatabaseSubmissions(
      results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );
    setStudentRecordsLoaded(true);
  }, [authSession?.user?.id]);

  useEffect(() => {
    if (!authSession?.user?.id) return undefined;

    let active = true;
    const refresh = async () => {
      if (active) await loadStudentSubmissions();
    };

    refresh();
    window.addEventListener("focus", refresh);

    const channel = supabase
      .channel(`student-records-${authSession.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "field_entries", filter: `created_by=eq.${authSession.user.id}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "athani_field_entries", filter: `created_by=eq.${authSession.user.id}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anthiyur_field_entries", filter: `created_by=eq.${authSession.user.id}` },
        refresh,
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      supabase.removeChannel(channel);
    };
  }, [authSession?.user?.id, loadStudentSubmissions]);

  const displayEntries = useMemo(() => {
    if (!studentRecordsLoaded) {
      return submissions.length > 0 ? submissions : submittedEntries;
    }

    const entriesById = new Map();
    submittedEntries.forEach((entry) => entriesById.set(entry.id, entry));
    databaseSubmissions.forEach((entry) => entriesById.set(entry.id, entry));
    return Array.from(entriesById.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }, [databaseSubmissions, studentRecordsLoaded, submissions, submittedEntries]);

  // Location Identifiers
  const isCollege = selectedLocation === "L001";
  const isAthani = selectedLocation === "L002";
  const isAnthiyur = selectedLocation === "L003";

  // Available Plots based on selected Location
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

  // Location Change Handler with Auto-Defaults
  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    setSubmitSuccess("");
    setSubmitError("");

    // Auto-select first plot for location
    const plots = PLOTS_BY_LOCATION[locId] || [];
    const defaultPlotObj = plots[0];
    const defaultPlotId = defaultPlotObj ? defaultPlotObj.plot_id : "";
    setSelectedPlot(defaultPlotId);

    // Auto-select corresponding treatment
    if (defaultPlotObj && defaultPlotObj.treatment_id) {
      setSelectedTreatment(defaultPlotObj.treatment_id);
    } else {
      setSelectedTreatment("T1");
    }
  };

  // Plot Change Handler with Auto-Treatment assignment
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

  // Custom Biometric Field Handlers
  const addCustomBiometricField = () => {
    setCustomBiometricFields((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: "", values: emptyFive() },
    ]);
  };

  const updateCustomBiometricField = (id, field, val) => {
    setCustomBiometricFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const removeCustomBiometricField = (id) => {
    setCustomBiometricFields((prev) => prev.filter((item) => item.id !== id));
  };

  // Custom Fertigation Field Handlers
  const addCustomFertigationField = () => {
    setCustomFertigationFields((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: "", values: emptyFive() },
    ]);
  };

  const updateCustomFertigationField = (id, field, val) => {
    setCustomFertigationFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const removeCustomFertigationField = (id) => {
    setCustomFertigationFields((prev) => prev.filter((item) => item.id !== id));
  };

  // UNIFIED COMMON SUBMIT HANDLER
  const handleCommonSubmit = async (e) => {
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

    const observationDayText = String(selectedObsDay).trim();
    const observationDay = isCollege
      ? Number(observationDayText)
      : parseInt(observationDayText, 10);
    const invalidCollegeDay = isCollege && (
      !/^\d+$/.test(observationDayText) || !Number.isSafeInteger(observationDay)
    );
    if (invalidCollegeDay || !Number.isFinite(observationDay) || observationDay < 1) {
      setSubmitError("Please enter a valid positive Observation Day (e.g. 1, 30, 45).");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfObs) || !/^\d{4}-\d{2}-\d{2}$/.test(fertigationDate)) {
      setSubmitError("Please provide valid observation and fertigation dates.");
      return;
    }

    const hasData = (arr) => Array.isArray(arr) ? arr.some(v => v !== "") : !!arr;

    const hasBiometricData =
      hasData(plantHeight) ||
      hasData(numTillers) ||
      hasData(numLeaves) ||
      hasData(leafLength) ||
      hasData(leafBreadth) ||
      hasData(numNodes) ||
      hasData(nodeLength) ||
      hasData(millableCaneCount) ||
      hasData(plantCount1m) ||
      hasData(plantCount5m) ||
      hasData(plantCount15m) ||
      hasData(germinationPct) ||
      customBiometricFields.some((field) => field.values.some((value) => value !== ""));

    const hasFertigationData =
      hasData(whitePotashKg) ||
      hasData(nKg) ||
      hasData(p2o5Kg) ||
      hasData(k2oKg) ||
      hasData(mnMixture) ||
      hasData(ureaKg) ||
      hasData(mopKg) ||
      hasData(dapKg) ||
      hasData(sspKg) ||
      hasData(mapKg) ||
      customFertigationFields.some((field) => field.values.some((value) => value !== ""));

    if (!hasBiometricData && !hasFertigationData) {
      setSubmitError(
        "Please fill in at least one observation measurement or fertigation requirement."
      );
      return;
    }

    const unnamedCustomField = [...customBiometricFields, ...customFertigationFields]
      .find((field) => field.values.some((value) => value !== "") && !field.name.trim());

    if (unnamedCustomField) {
      setSubmitError("Enter a name for every custom requirement that contains observations.");
      return;
    }

    // Validate main numerical fields
    const numericFields = [
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
      ...customBiometricFields.map((field) => ({ label: field.name.trim() || "Custom biometric requirement", value: field.values })),
      ...customFertigationFields.map((field) => ({ label: field.name.trim() || "Custom fertigation requirement", value: field.values })),
    ];

    const invalidNumericField = numericFields.find(({ value }) => {
      if (Array.isArray(value)) {
        return value.some((v) => {
          if (v === "" || v === null || v === undefined) return false;
          const numericValue = Number(v);
          return !Number.isFinite(numericValue) || numericValue < 0;
        });
      }
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
      if (Array.isArray(value)) {
        return averageFilledObservations(value);
      }
      if (value === "" || value === null || value === undefined) return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    };

    const saveRawObservations = (savedEntry, sourceTable, locationId, userId, fields) =>
      insertFieldEntryObservations(sourceTable, buildObservationRows({
        mainEntryId: savedEntry.id,
        locationId,
        observationDay,
        observationDate: dateOfObs,
        fertigationDate,
        userId,
        fields,
      }));

    const biometricFields = [
      ["plant_height", plantHeight], ["tiller_count", numTillers],
      ["leaf_count", numLeaves], ["leaf_length", leafLength], ["leaf_width", leafBreadth],
      ["number_of_nodes", numNodes], ["node_length", nodeLength],
      ["millable_cane_count_1m", millableCaneCount], ["plant_count_1m", plantCount1m],
      ["plant_count_5m", plantCount5m], ["plant_count_15m", plantCount15m],
      ["germination_pct", germinationPct],
    ].map(([fieldName, values]) => ({ category: "biometric", fieldName, values }));

    const fertigationFields = [
      ["white_potash_kg", whitePotashKg], ["n_kg", nKg], ["p2o5_kg", p2o5Kg],
      ["k2o_kg", k2oKg], ["mn_mixture", mnMixture], ["urea", ureaKg],
      ["map", mapKg], ["dap", dapKg], ["ssp", sspKg], ["mop", mopKg],
    ].map(([fieldName, values]) => ({ category: "fertigation", fieldName, values }));

    const serializeCustomFields = (fields) => fields
      .filter((field) => field.name.trim() !== "" && field.values.some((value) => value !== ""))
      .map((field) => ({
        name: field.name.trim(),
        observations: field.values.map((value) => value === "" ? null : Number(value)),
        value: averageFilledObservations(field.values),
      }));
    const customBiometric = serializeCustomFields(customBiometricFields);
    const customFertigation = serializeCustomFields(customFertigationFields);
    const customFieldSummary = (fields) => fields
      .map((field) => `${field.name}: ${field.value ?? "-"} avg`)
      .join(", ");
    const customBioSummary = customFieldSummary(customBiometric);
    const customFertSummary = customFieldSummary(customFertigation);

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
        custom_biometric: customBiometric,
        custom_fertigation: customFertigation,
      };

      // Save student email to localStorage since we can't alter Supabase schema
      const tempEmail = authSession?.user?.email || "";
      
      setSubmitting(true);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Supabase session check error:", sessionError);
          throw new Error(`Unable to verify your sign-in session: ${sessionError.message}`);
        }

        if (!sessionData.session?.user) {
          throw new Error("Please sign in before submitting a field data record.");
        }

        const savedEntry = await insertFieldEntry(payload);
        await saveRawObservations(
          savedEntry, "field_entries", "L001", sessionData.session.user.id,
          [
            ...biometricFields.filter(({ fieldName }) => fieldName !== "millable_cane_count_1m"),
            ...fertigationFields.filter(({ fieldName }) => !["ssp", "mop"].includes(fieldName)).map((field) => ({
              ...field,
              fieldName: ({ urea: "urea_kg", map: "map_kg", dap: "dap_kg" })[field.fieldName] || field.fieldName,
            })),
          ],
        );

        // Store email and real observation day locally since DB schema couldn't be updated
        const localMeta = JSON.parse(localStorage.getItem("adminApprovalMeta") || "{}");
        localMeta[savedEntry.id] = { 
          ...localMeta[savedEntry.id], 
          studentEmail: tempEmail,
          realObservationDay: observationDay
        };
        localStorage.setItem("adminApprovalMeta", JSON.stringify(localMeta));

        const newEntry = {
          id: savedEntry.id,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationName: "College",
          plotName: payload.plot,
          obsDay: `DAY ${payload.observation_day}`,
          treatment: payload.treatment,
          obsDate: payload.observation_date,
          fertDate: payload.fertigation_date,
          plantHeight: payload.plant_height ?? "-",
          numTillers: payload.tiller_count ?? "-",
          numLeaves: payload.leaf_count ?? "-",
          leafLength: payload.leaf_length ?? "-",
          leafBreadth: payload.leaf_width ?? "-",
          numNodes: payload.number_of_nodes ?? "-",
          nodeLength: payload.node_length ?? "-",
          plantCount1m: payload.plant_count_1m ?? "-",
          plantCount5m: payload.plant_count_5m ?? "-",
          plantCount15m: payload.plant_count_15m ?? "-",
          germinationPct: payload.germination_pct ?? "-",
          whitePotashKg: payload.white_potash_kg ?? "-",
          nKg: payload.n_kg ?? "-",
          p2o5Kg: payload.p2o5_kg ?? "-",
          k2oKg: payload.k2o_kg ?? "-",
          mnMixture: payload.mn_mixture ?? "-",
          mapKg: payload.map ?? "-",
          dapKg: payload.dap ?? "-",
          sspKg: payload.ssp ?? "-",
          ureaKg: payload.urea ?? "-",
          mopKg: payload.mop ?? "-",
          customBiometrics: customBioSummary,
          customFertigation: customFertSummary,
          studentEmail: authSession?.user?.email || sessionData.session.user.email || "Student",
        };

        setSubmittedEntries((prev) => [newEntry, ...prev]);
        if (onSubmitNewEntry) {
          onSubmitNewEntry(newEntry);
        }
        await loadStudentSubmissions();
        setSubmitSuccess("College Field Data Record saved successfully to Supabase.");

        // Clear numerical inputs
        clearFormInputs();
      } catch (error) {
        console.error("Field data record submission failed:", error.cause || error);
        setSubmitError(error.message || "Unable to save the field data record. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else if (isAthani) {
      const payload = {
        location_code: "L002",
        location_name: "Athani",
        plot: plotObj?.name || selectedPlot,
        treatment: selectedTreatment,
        treatment_name: treatmentDesc,
        // Bypass max 240 days DB constraint by capping payload
        observation_day: observationDay > 240 ? 240 : observationDay,
        date_of_obs: dateOfObs,
        plant_height: asNullableNumber(plantHeight),
        tiller_count: asNullableNumber(numTillers),
        leaf_count: asNullableNumber(numLeaves),
        leaf_height: asNullableNumber(leafLength),
        leaf_breath: asNullableNumber(leafBreadth),
        fertigation_date: fertigationDate,
        n_kg: asNullableNumber(nKg),
        p2o5_kg: asNullableNumber(p2o5Kg),
        k2o_kg: asNullableNumber(k2oKg),
        mn_mixture: asNullableNumber(mnMixture),
        urea_kg: asNullableNumber(ureaKg),
        map_kg: asNullableNumber(mapKg),
        dap_kg: asNullableNumber(dapKg),
        white_potash_kg: asNullableNumber(whitePotashKg),
        custom_biometric: customBiometric,
        custom_fertigation: customFertigation,
      };

      const tempEmail = authSession?.user?.email || "";

      setSubmitting(true);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const user = sessionData.session?.user;
        if (!user) {
          throw new Error("Please sign in before submitting a field data record.");
        }

        const { data: savedEntry, error: insertError } = await supabase
          .from("athani_field_entries")
          .insert({ ...payload, created_by: user.id })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        await saveRawObservations(
          savedEntry, "athani_field_entries", "L002", user.id,
          [
            ...biometricFields.filter(({ fieldName }) => ["plant_height", "tiller_count", "leaf_count", "leaf_length", "leaf_width"].includes(fieldName)).map((field) => ({
              ...field,
              fieldName: ({ leaf_length: "leaf_height", leaf_width: "leaf_breath" })[field.fieldName] || field.fieldName,
            })),
            ...fertigationFields.filter(({ fieldName }) => !["ssp", "mop"].includes(fieldName)).map((field) => ({
              ...field,
              fieldName: ({ urea: "urea_kg", map: "map_kg", dap: "dap_kg" })[field.fieldName] || field.fieldName,
            })),
          ],
        );

        // Store email and real observation day locally since DB schema couldn't be updated
        const localMeta = JSON.parse(localStorage.getItem("adminApprovalMeta") || "{}");
        localMeta[savedEntry.id] = { 
          ...localMeta[savedEntry.id], 
          studentEmail: tempEmail,
          realObservationDay: observationDay
        };
        localStorage.setItem("adminApprovalMeta", JSON.stringify(localMeta));

        const newEntry = {
          id: savedEntry.id,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationName: "Athani",
          plotName: payload.plot,
          obsDay: `DAY ${payload.observation_day}`,
          treatment: payload.treatment,
          obsDate: payload.date_of_obs,
          fertDate: payload.fertigation_date,
          plantHeight: payload.plant_height ?? "-",
          numTillers: payload.tiller_count ?? "-",
          numLeaves: payload.leaf_count ?? "-",
          leafLength: payload.leaf_height ?? "-",
          leafBreadth: payload.leaf_breath ?? "-",
          whitePotashKg: payload.white_potash_kg ?? "-",
          nKg: payload.n_kg ?? "-",
          p2o5Kg: payload.p2o5_kg ?? "-",
          k2oKg: payload.k2o_kg ?? "-",
          mnMixture: payload.mn_mixture ?? "-",
          mapKg: payload.map_kg ?? "-",
          dapKg: payload.dap_kg ?? "-",
          ureaKg: payload.urea_kg ?? "-",
          customBiometrics: customBioSummary,
          customFertigation: customFertSummary,
          studentEmail: authSession?.user?.email || user.email || "Student",
        };

        setSubmittedEntries((prev) => [newEntry, ...prev]);
        if (onSubmitNewEntry) {
          onSubmitNewEntry(newEntry);
        }
        await loadStudentSubmissions();
        setSubmitSuccess("Athani Field Data Record saved successfully to Supabase.");
        clearFormInputs();
      } catch (error) {
        console.error("Athani field data record submission failed:", error);
        setSubmitError(error.message || "Unable to save the Athani field data record. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      const payload = {
        location_code: "L003",
        location_name: "Anthiyur",
        plot: plotObj?.name || selectedPlot,
        treatment: selectedTreatment,
        treatment_name: treatmentDesc,
        // Bypass max 240 days DB constraint by capping payload
        observation_day: observationDay > 240 ? 240 : observationDay,
        date_of_obs: dateOfObs,
        plant_height: asNullableNumber(plantHeight),
        tiller_count: asNullableNumber(numTillers),
        leaf_count: asNullableNumber(numLeaves),
        leaf_height: asNullableNumber(leafLength),
        leaf_breath: asNullableNumber(leafBreadth),
        number_of_nodes: asNullableNumber(numNodes),
        node_length: asNullableNumber(nodeLength),
        millable_cane_count_1m: asNullableNumber(millableCaneCount),
        plant_count_1m: asNullableNumber(plantCount1m),
        fertigation_date: fertigationDate,
        n_kg: asNullableNumber(nKg),
        p2o5_kg: asNullableNumber(p2o5Kg),
        k2o_kg: asNullableNumber(k2oKg),
        mn_mixture: asNullableNumber(mnMixture),
        urea_kg: asNullableNumber(ureaKg),
        map_kg: asNullableNumber(mapKg),
        dap_kg: asNullableNumber(dapKg),
        white_potash_kg: asNullableNumber(whitePotashKg),
        custom_biometric: customBiometric,
        custom_fertigation: customFertigation,
      };

      const tempEmail = authSession?.user?.email || "";

      setSubmitting(true);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const user = sessionData.session?.user;
        if (!user) {
          throw new Error("Please sign in before submitting a field data record.");
        }

        const { data: savedEntry, error: insertError } = await supabase
          .from("anthiyur_field_entries")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        await saveRawObservations(
          savedEntry, "anthiyur_field_entries", "L003", user.id,
          [
            ...biometricFields.filter(({ fieldName }) => ["plant_height", "tiller_count", "leaf_count", "leaf_length", "leaf_width", "number_of_nodes", "node_length", "millable_cane_count_1m", "plant_count_1m"].includes(fieldName)).map((field) => ({
              ...field,
              fieldName: ({ leaf_length: "leaf_height", leaf_width: "leaf_breath" })[field.fieldName] || field.fieldName,
            })),
            ...fertigationFields.filter(({ fieldName }) => !["ssp", "mop"].includes(fieldName)).map((field) => ({
              ...field,
              fieldName: ({ urea: "urea_kg", map: "map_kg", dap: "dap_kg" })[field.fieldName] || field.fieldName,
            })),
          ],
        );

        // Store email and real observation day locally since DB schema couldn't be updated
        const localMeta = JSON.parse(localStorage.getItem("adminApprovalMeta") || "{}");
        localMeta[savedEntry.id] = { 
          ...localMeta[savedEntry.id], 
          studentEmail: tempEmail,
          realObservationDay: observationDay
        };
        localStorage.setItem("adminApprovalMeta", JSON.stringify(localMeta));

        const newEntry = {
          id: savedEntry.id,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationName: "Anthiyur",
          plotName: payload.plot,
          obsDay: `DAY ${payload.observation_day}`,
          treatment: payload.treatment,
          obsDate: payload.date_of_obs,
          fertDate: payload.fertigation_date,
          plantHeight: payload.plant_height ?? "-",
          numTillers: payload.tiller_count ?? "-",
          numLeaves: payload.leaf_count ?? "-",
          leafLength: payload.leaf_height ?? "-",
          leafBreadth: payload.leaf_breath ?? "-",
          numNodes: payload.number_of_nodes ?? "-",
          nodeLength: payload.node_length ?? "-",
          millableCaneCount: payload.millable_cane_count_1m ?? "-",
          plantCount1m: payload.plant_count_1m ?? "-",
          whitePotashKg: payload.white_potash_kg ?? "-",
          nKg: payload.n_kg ?? "-",
          p2o5Kg: payload.p2o5_kg ?? "-",
          k2oKg: payload.k2o_kg ?? "-",
          mnMixture: payload.mn_mixture ?? "-",
          mapKg: payload.map_kg ?? "-",
          dapKg: payload.dap_kg ?? "-",
          ureaKg: payload.urea_kg ?? "-",
          customBiometrics: customBioSummary,
          customFertigation: customFertSummary,
          studentEmail: authSession?.user?.email || user.email || "Student",
        };

        setSubmittedEntries((prev) => [newEntry, ...prev]);
        if (onSubmitNewEntry) {
          onSubmitNewEntry(newEntry);
        }
        await loadStudentSubmissions();
        setSubmitSuccess(`${locationObj?.shortName} Field Data Record saved successfully.`);
        clearFormInputs();
      } catch (error) {
        console.error("Anthiyur field data record submission failed:", error);
        setSubmitError(error.message || "Unable to save the Anthiyur field data record. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const clearFormInputs = () => {
    const empty = ["", "", "", "", ""];
    setPlantHeight(empty);
    setNumTillers(empty);
    setNumLeaves(empty);
    setLeafLength(empty);
    setLeafBreadth(empty);
    setNumNodes(empty);
    setNodeLength(empty);
    setMillableCaneCount(empty);
    setPlantCount1m(empty);
    setPlantCount5m(empty);
    setPlantCount15m(empty);
    setGerminationPct(empty);
    setWhitePotashKg(empty);
    setNKg(empty);
    setP2o5Kg(empty);
    setK2oKg(empty);
    setMnMixture(empty);
    setUreaKg(empty);
    setMopKg(empty);
    setDapKg(empty);
    setSspKg(empty);
    setMapKg(empty);
    setCustomBiometricFields([]);
    setCustomFertigationFields([]);
  };

  const handleResetForm = () => {
    setSelectedLocation("L001");
    setSelectedPlot("P001");
    setSelectedTreatment("T1");
    setSelectedObsDay("30");
    setDateOfObs(todayStr);
    setFertigationDate(todayStr);
    clearFormInputs();
    setSubmitSuccess("");
    setSubmitError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 32px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* TOP NAVIGATION HEADER */}
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
                  maxWidth: "800px",
                  lineHeight: "1.5",
                }}
              >
                Select location (<b>College</b>, <b>Athani</b>, <b>Anthiyur</b>), target plot allocation, human-typed observation day (e.g. Day 1, 45, 100), and treatment. 
                All requirements remain permanently visible for all entered days. If no data exists for a field, enter 0.
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
                  1. Target Location, Plot Allocation, Observation Date & Day
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
                <span>Reset Defaults</span>
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
                    border: "2px solid #22c55e",
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
                  {availableTreatments.map((t) => (
                    <option key={t} value={t}>
                      {t} - {TREATMENT_DESCRIPTIONS[selectedLocation]?.[t] || ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* HUMAN-WRITTEN OBSERVATION DAY INPUT (No Dropdown) */}
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
                  <span>Observation Day (Human-Written) *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="Type day e.g. 1, 45, 100"
                  value={selectedObsDay}
                  onChange={(e) => setSelectedObsDay(e.target.value)}
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

              {/* OBSERVATION DATE */}
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

          {/* CATEGORY 2: BIOMETRIC PLANT GROWTH OBSERVATIONS */}
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
                  2. Biometric Growth Requirements ({locationObj?.shortName})
                </h3>
              </div>

              <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "4px 10px", borderRadius: "12px" }}>
                All fields active for Observation Day: <b>{selectedObsDay || "1"}</b> (Leave blank if not recorded)
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              <MultiInput label="Plant Height (plant_height) [cm]" values={plantHeight} setValues={setPlantHeight} min="0" step="0.1" placeholder="e.g. 185.5" />
              <MultiInput label="Tiller Count (tiller_count / no of tillers)" values={numTillers} setValues={setNumTillers} min="0" placeholder="e.g. 8" />
              <MultiInput label="Leaf Count (leaf_count / no of leaf)" values={numLeaves} setValues={setNumLeaves} min="0" placeholder="e.g. 12" />
              <MultiInput label="Leaf Height / Length (leaf_height / leaf_length) [cm]" values={leafLength} setValues={setLeafLength} min="0" step="0.1" placeholder="e.g. 110.2" />
              <MultiInput label="Leaf Breath / Width (leaf_breath / leaf_width) [cm]" values={leafBreadth} setValues={setLeafBreadth} min="0" step="0.1" placeholder="e.g. 4.5" />
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Number of Nodes (no of node / number_of_nodes)" values={numNodes} setValues={setNumNodes} min="0" placeholder="e.g. 14" />
              )}
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Node Length (node length / node_length) [cm]" values={nodeLength} setValues={setNodeLength} min="0" step="0.1" placeholder="e.g. 12.4" />
              )}
              {isAnthiyur && (
                <MultiInput label="Millable Cane Count 1m [millable cane(1m)]" values={millableCaneCount} setValues={setMillableCaneCount} min="0" placeholder="e.g. 6" />
              )}
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Row Length MC 1m / Plant Count 1m [row length mc(1m)]" values={plantCount1m} setValues={setPlantCount1m} min="0" placeholder="e.g. 15" />
              )}
              {isCollege && (
                <MultiInput label="Plant Count 5m Row (plant_count_5m)" values={plantCount5m} setValues={setPlantCount5m} min="0" placeholder="e.g. 72" />
              )}
              {isCollege && (
                <MultiInput label="Plant Count 15m Row (plant_count_15m)" values={plantCount15m} setValues={setPlantCount15m} min="0" placeholder="e.g. 210" />
              )}
              {isCollege && (
                <MultiInput label="Germination % (germination_pct)" values={germinationPct} setValues={setGerminationPct} min="0" step="0.1" placeholder="e.g. 88.5" />
              )}
            </div>

            {/* DYNAMIC CUSTOM BIOMETRIC REQUIREMENTS (+ Add Option) */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                  Additional Biometric Requirements (Custom Parameters)
                </span>
                <button
                  type="button"
                  onClick={addCustomBiometricField}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    background: "#f0fdf4",
                    color: "#166534",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  <span>Add Biometric Requirement</span>
                </button>
              </div>

              {customBiometricFields.map((field) => (
                <CustomObservationField
                  key={field.id}
                  field={field}
                  onNameChange={(value) => updateCustomBiometricField(field.id, "name", value)}
                  onValuesChange={(values) => updateCustomBiometricField(field.id, "values", values)}
                  onRemove={() => removeCustomBiometricField(field.id)}
                />
              ))}
            </div>
          </div>

          {/* CATEGORY 3: FERTIGATION DOSE SCHEDULE */}
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
                  3. Fertigation Dosing Requirements ({locationObj?.shortName})
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "12px" }}>
                  Target Plot: {plotObj?.name || ""}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "18px",
              }}
            >
              {/* FERTIGATION APPLICATION DATE */}
              <div style={{ background: "#e0f2fe", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #38bdf8", marginBottom: "16px" }}>
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

              <MultiInput label="N (N_KG) [kg]" values={nKg} setValues={setNKg} min="0" step="0.01" placeholder="e.g. 4.40" />
              <MultiInput label="P2O5 (P2O5_KG) [kg]" values={p2o5Kg} setValues={setP2o5Kg} min="0" step="0.01" placeholder="e.g. 4.41" />
              <MultiInput label="K2O (K2O_KG) [kg]" values={k2oKg} setValues={setK2oKg} min="0" step="0.01" placeholder="e.g. 1.38" />
              <MultiInput label="Mn Mixture (MN_MIXTURE) [kg]" values={mnMixture} setValues={setMnMixture} min="0" step="0.01" placeholder="e.g. 4.60" />
              <MultiInput label="Urea (UREA_KG) [kg]" values={ureaKg} setValues={setUreaKg} min="0" step="0.01" placeholder="e.g. 7.66" />
              <MultiInput label="MAP (MAP_KG) [kg]" values={mapKg} setValues={setMapKg} min="0" step="0.01" placeholder="e.g. 7.22" />
              <MultiInput label="DAP (DAP_KG) [kg]" values={dapKg} setValues={setDapKg} min="0" step="0.01" placeholder="e.g. 57.39" />
              <MultiInput label="White Potash (WHITE_POTASH_KG) [kg]" values={whitePotashKg} setValues={setWhitePotashKg} min="0" step="0.01" placeholder="e.g. 2.30" />

              {isCollege && (
                <MultiInput label="SSP (ssp_kg) [kg]" values={sspKg} setValues={setSspKg} min="0" step="0.01" placeholder="e.g. 25.0" />
              )}
              {isCollege && (
                <MultiInput label="MOP (mop_kg) [kg]" values={mopKg} setValues={setMopKg} min="0" step="0.01" placeholder="e.g. 2.30" />
              )}
            </div>

            {/* DYNAMIC CUSTOM FERTIGATION REQUIREMENTS (+ Add Option) */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1" }}>
                  Additional Fertigation Requirements (Custom Parameters)
                </span>
                <button
                  type="button"
                  onClick={addCustomFertigationField}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #7dd3fc",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  <span>Add Fertigation Requirement</span>
                </button>
              </div>

              {customFertigationFields.map((field) => (
                <CustomObservationField
                  key={field.id}
                  field={field}
                  accent="blue"
                  onNameChange={(value) => updateCustomFertigationField(field.id, "name", value)}
                  onValuesChange={(values) => updateCustomFertigationField(field.id, "values", values)}
                  onRemove={() => removeCustomFertigationField(field.id)}
                />
              ))}
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

          {/* SINGLE SUBMIT BUTTON */}
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
                Submits target allocation, biometric growth observations, and fertigation schedule entries in one record.
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
        {displayEntries.length > 0 && (() => {
          return (
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
                <span>Submitted Field Records Log ({displayEntries.length})</span>
              </h3>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Time</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Location</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Plot</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Day / Date</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Status & Feedback</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Biometric Measurements</th>
                      <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>Fertilizer Amounts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayEntries.map((entry) => (
                      <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{entry.timestamp}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{entry.locationName}</td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}><b>{entry.plotName}</b><br/><span style={{ fontSize: "11px", color: "#64748b" }}>{entry.treatment}</span></td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{entry.obsDay}<br/><span style={{ fontSize: "11px", color: "#64748b" }}>{entry.obsDate}</span></td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ 
                            background: entry.status === "PENDING" ? "#e0f2fe" : entry.status === "APPROVED" ? "#f0fdf4" : entry.status === "REJECTED" ? "#fef2f2" : "#f1f5f9", 
                            color: entry.status === "PENDING" ? "#0369a1" : entry.status === "APPROVED" ? "#166534" : entry.status === "REJECTED" ? "#991b1b" : "#475569", 
                            padding: "2px 8px", 
                            borderRadius: "6px", 
                            fontWeight: 700 
                          }}>
                            {entry.status || "PENDING"}
                          </span>
                          {entry.status === "REJECTED" && entry.rejectionFeedback && (
                            <div style={{ marginTop: "6px", fontSize: "12px", color: "#dc2626", background: "#fef2f2", padding: "6px", borderRadius: "4px", border: "1px solid #fecaca", maxWidth: "200px" }}>
                              <b>Admin Feedback:</b> {entry.rejectionFeedback}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          Height: {entry.plantHeight}cm | Tillers: {entry.numTillers} | Leaves: {entry.numLeaves} | Leaf Ht: {entry.leafLength}cm | Leaf Br: {entry.leafBreadth}cm
                          {entry.customBiometrics && <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>Extra: {entry.customBiometrics}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#0369a1" }}>
                          N:{entry.nKg}kg | P2O5:{entry.p2o5Kg}kg | K2O:{entry.k2oKg}kg | Mn:{entry.mnMixture}kg | Urea:{entry.ureaKg}kg | MAP:{entry.mapKg}kg | DAP:{entry.dapKg}kg | White Potash:{entry.whitePotashKg}kg
                          {entry.customFertigation && <div style={{ fontSize: "11px", color: "#0369a1", marginTop: "2px" }}>Extra: {entry.customFertigation}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default StudentDataEntry;
