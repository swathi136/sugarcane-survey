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
        .map((field) => `${field.name}: ${field.value ?? "-"}`)
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
    plantNum: (isCollegeEntry ? row.plant_number : row.plant_num) ?? "-",
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
  const [plantCount1m, setPlantCount1m] = useState("");
  const [plantCount5m, setPlantCount5m] = useState("");
  const [plantCount15m, setPlantCount15m] = useState("");
  const [germinationPct, setGerminationPct] = useState("");

  // Dynamic Custom Biometric Fields
  const [customBiometricFields, setCustomBiometricFields] = useState([]);

  // Section 3: Fertigation Schedule Field States
  const [fertigationDate, setFertigationDate] = useState(todayStr);
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
      { id: Date.now() + Math.random(), name: "", value: "" },
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
      { id: Date.now() + Math.random(), name: "", value: "" },
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

    const hasBiometricData =
      plantNum ||
      plantHeight ||
      numTillers ||
      numLeaves ||
      leafLength ||
      leafBreadth ||
      numNodes ||
      nodeLength ||
      millableCaneCount ||
      plantCount1m ||
      plantCount5m ||
      plantCount15m ||
      germinationPct ||
      customBiometricFields.some((f) => f.value !== "");

    const hasFertigationData =
      whitePotashKg ||
      nKg ||
      p2o5Kg ||
      k2oKg ||
      mnMixture ||
      ureaKg ||
      mopKg ||
      dapKg ||
      sspKg ||
      mapKg ||
      customFertigationFields.some((f) => f.value !== "");

    if (!hasBiometricData && !hasFertigationData) {
      setSubmitError(
        "Please fill in at least one observation measurement or fertigation requirement."
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
          plantNum: payload.plant_number ?? "-",
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
      const customBiometric = customBiometricFields
        .filter((field) => field.name.trim() !== "")
        .map((field) => ({ name: field.name.trim(), value: field.value }));

      const customFertigation = customFertigationFields
        .filter((field) => field.name.trim() !== "")
        .map((field) => ({ name: field.name.trim(), value: field.value }));

      const payload = {
        location_code: "L002",
        location_name: "Athani",
        plot: plotObj?.name || selectedPlot,
        treatment: selectedTreatment,
        treatment_name: treatmentDesc,
        // Bypass max 240 days DB constraint by capping payload
        observation_day: observationDay > 240 ? 240 : observationDay,
        date_of_obs: dateOfObs,
        plant_num: asNullableNumber(plantNum),
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
          plantNum: payload.plant_num ?? "-",
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
      const customBiometric = customBiometricFields
        .filter((field) => field.name.trim() !== "")
        .map((field) => ({ name: field.name.trim(), value: field.value }));

      const customFertigation = customFertigationFields
        .filter((field) => field.name.trim() !== "")
        .map((field) => ({ name: field.name.trim(), value: field.value }));

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
          plantNum: "-",
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
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
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
                All fields active for Observation Day: <b>{selectedObsDay || "1"}</b> (Enter 0 if no data)
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              {/* Plant Number (Common / Athani / College) */}
              {(isCollege || isAthani) && (
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
              )}

              {/* Plant Height (All Locations) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Plant Height (plant_height) [cm]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 185.5 (or 0)"
                  value={plantHeight}
                  onChange={(e) => setPlantHeight(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Tiller Count (All Locations) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Tiller Count (tiller_count / no of tillers)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 8 (or 0)"
                  value={numTillers}
                  onChange={(e) => setNumTillers(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Leaf Count (All Locations) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Count (leaf_count / no of leaf)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12 (or 0)"
                  value={numLeaves}
                  onChange={(e) => setNumLeaves(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Leaf Height / Length (All Locations) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Height / Length (leaf_height / leaf_length) [cm]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 110.2 (or 0)"
                  value={leafLength}
                  onChange={(e) => setLeafLength(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Leaf Breath / Width (All Locations) */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Leaf Breath / Width (leaf_breath / leaf_width) [cm]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 4.5 (or 0)"
                  value={leafBreadth}
                  onChange={(e) => setLeafBreadth(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Number of Nodes (Anthiyur & College) */}
              {(isAnthiyur || isCollege) && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Number of Nodes (no of node / number_of_nodes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 14 (or 0)"
                    value={numNodes}
                    onChange={(e) => setNumNodes(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Node Length (Anthiyur & College) */}
              {(isAnthiyur || isCollege) && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Node Length (node length / node_length) [cm]
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 12.4 (or 0)"
                    value={nodeLength}
                    onChange={(e) => setNodeLength(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Millable Cane 1m (Anthiyur) */}
              {isAnthiyur && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Millable Cane Count 1m [millable cane(1m)]
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6 (or 0)"
                    value={millableCaneCount}
                    onChange={(e) => setMillableCaneCount(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Row Length MC 1m / Plant Count 1m (Anthiyur & College) */}
              {(isAnthiyur || isCollege) && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Row Length MC 1m / Plant Count 1m [row length mc(1m)]
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15 (or 0)"
                    value={plantCount1m}
                    onChange={(e) => setPlantCount1m(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Plant Count 5m (College) */}
              {isCollege && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Plant Count 5m Row (plant_count_5m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 72 (or 0)"
                    value={plantCount5m}
                    onChange={(e) => setPlantCount5m(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Plant Count 15m (College) */}
              {isCollege && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Plant Count 15m Row (plant_count_15m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 210 (or 0)"
                    value={plantCount15m}
                    onChange={(e) => setPlantCount15m(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* Germination % (College) */}
              {isCollege && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Germination % (germination_pct)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 88.5 (or 0)"
                    value={germinationPct}
                    onChange={(e) => setGerminationPct(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
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
                <div
                  key={field.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "10px",
                    background: "#f8fafc",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Requirement Name (e.g. Cane Diameter)"
                    value={field.name}
                    onChange={(e) => updateCustomBiometricField(field.id, "name", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 3.2 cm)"
                    value={field.value}
                    onChange={(e) => updateCustomBiometricField(field.id, "value", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomBiometricField(field.id)}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              {/* FERTIGATION APPLICATION DATE */}
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

              {/* N_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  N (N_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 4.40 (or 0)"
                  value={nKg}
                  onChange={(e) => setNKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* P2O5_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  P2O5 (P2O5_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 4.41 (or 0)"
                  value={p2o5Kg}
                  onChange={(e) => setP2o5Kg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* K2O_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  K2O (K2O_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1.38 (or 0)"
                  value={k2oKg}
                  onChange={(e) => setK2oKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* MN_MIXTURE */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Mn Mixture (MN_MIXTURE) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 4.60 (or 0)"
                  value={mnMixture}
                  onChange={(e) => setMnMixture(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* UREA_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Urea (UREA_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 7.66 (or 0)"
                  value={ureaKg}
                  onChange={(e) => setUreaKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* MAP_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  MAP (MAP_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 7.22 (or 0)"
                  value={mapKg}
                  onChange={(e) => setMapKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* DAP_KG */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  DAP (DAP_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 57.39 (or 0)"
                  value={dapKg}
                  onChange={(e) => setDapKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* WHITE_POTASH_KG */}
              <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #86efac" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#166534", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  White Potash (WHITE_POTASH_KG) [kg]
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2.30 (or 0)"
                  value={whitePotashKg}
                  onChange={(e) => setWhitePotashKg(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #22c55e", fontSize: "14px", fontWeight: 600 }}
                />
              </div>

              {/* SSP (College Specific) */}
              {isCollege && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                    SSP (ssp_kg) [kg]
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25.0 (or 0)"
                    value={sspKg}
                    onChange={(e) => setSspKg(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              )}

              {/* MOP (College Specific) */}
              {isCollege && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                    MOP (mop_kg) [kg]
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2.30 (or 0)"
                    value={mopKg}
                    onChange={(e) => setMopKg(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
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
                <div
                  key={field.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "10px",
                    background: "#f0f9ff",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Requirement Name (e.g. Zinc Sulphate)"
                    value={field.name}
                    onChange={(e) => updateCustomFertigationField(field.id, "name", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 1.5 kg)"
                    value={field.value}
                    onChange={(e) => updateCustomFertigationField(field.id, "value", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomFertigationField(field.id)}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                          Plant #{entry.plantNum} | Height: {entry.plantHeight}cm | Tillers: {entry.numTillers} | Leaves: {entry.numLeaves} | Leaf Ht: {entry.leafLength}cm | Leaf Br: {entry.leafBreadth}cm
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
