import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { supabase } from "../utils/supabaseClient";

const TABLES = {
  field_entries: { location: "College", dateColumn: "observation_date" },
  athani_field_entries: { location: "Athani", dateColumn: "date_of_obs" },
  anthiyur_field_entries: { location: "Anthiyur", dateColumn: "date_of_obs" },
};

const PROTECTED_FIELDS = new Set([
  "id", "location_code", "location_name", "created_by", "created_at", "updated_at",
  "status", "approved_by", "approved_at", "rejected_by", "rejected_at",
  "rejection_feedback", "rejection_email_sent_at",
]);

const fields = (names, group, types = {}) =>
  names.map((name) => ({ name, group, type: types[name] || "text" }));

const commonMetadataFields = fields(
  [
    "id", "created_by", "created_at", "updated_at",
    "status", "approved_by", "approved_at", "rejected_by", "rejected_at",
    "rejection_feedback", "rejection_email_sent_at",
  ],
  "Submission Metadata",
);

const collegeFieldGroups = [
  ...fields(
    ["location_code", "location_name", "plot", "treatment", "observation_day", "observation_date"],
    "Common Information",
    { observation_day: "integer", observation_date: "date" },
  ),
  ...fields(
    [
      "plant_height", "tiller_count", "leaf_count", "leaf_length", "leaf_width",
      "plant_count_1m", "plant_count_5m", "plant_count_15m", "number_of_nodes", "node_length",
      "germination_pct",
    ],
    "Biometric Observations",
    {
      plant_height: "numeric", tiller_count: "integer", leaf_count: "integer",
      leaf_length: "numeric", leaf_width: "numeric", plant_count_1m: "integer", plant_count_5m: "integer",
      plant_count_15m: "integer", number_of_nodes: "integer", node_length: "numeric", germination_pct: "numeric",
    },
  ),
  ...fields(
    ["fertigation_date", "white_potash_kg", "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea", "map", "dap", "ssp", "mop"],
    "Fertigation Details",
    {
      fertigation_date: "date", white_potash_kg: "numeric", n_kg: "numeric", p2o5_kg: "numeric",
      k2o_kg: "numeric", mn_mixture: "numeric", urea: "numeric", map: "numeric", dap: "numeric",
      ssp: "numeric", mop: "numeric",
    },
  ),
  { name: "custom_biometric", group: "Custom Biometric Observations", type: "jsonb" },
  { name: "custom_fertigation", group: "Custom Fertigation Details", type: "jsonb" },
  ...commonMetadataFields,
];

const athaniFieldGroups = [
  ...fields(
    ["location_code", "location_name", "plot", "treatment", "treatment_name", "observation_day", "date_of_obs"],
    "Common Information",
    { observation_day: "integer", date_of_obs: "date" },
  ),
  ...fields(
    ["plant_height", "tiller_count", "leaf_count", "leaf_height", "leaf_breath"],
    "Biometric Observations",
    {
      plant_height: "numeric", tiller_count: "integer", leaf_count: "integer",
      leaf_height: "numeric", leaf_breath: "numeric",
    },
  ),
  ...fields(
    ["fertigation_date", "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea_kg", "map_kg", "dap_kg", "white_potash_kg"],
    "Fertigation Details",
    {
      fertigation_date: "date", n_kg: "numeric", p2o5_kg: "numeric", k2o_kg: "numeric",
      mn_mixture: "numeric", urea_kg: "numeric", map_kg: "numeric", dap_kg: "numeric",
      white_potash_kg: "numeric",
    },
  ),
  { name: "custom_biometric", group: "Custom Biometric Observations", type: "jsonb" },
  { name: "custom_fertigation", group: "Custom Fertigation Details", type: "jsonb" },
  ...commonMetadataFields,
];

const anthiyurFieldGroups = [
  ...fields(
    ["location_code", "location_name", "plot", "treatment", "treatment_name", "observation_day", "date_of_obs"],
    "Common Information",
    { observation_day: "integer", date_of_obs: "date" },
  ),
  ...fields(
    [
      "plant_height", "tiller_count", "leaf_count", "leaf_height", "leaf_breath", "number_of_nodes",
      "node_length", "millable_cane_count_1m", "plant_count_1m",
    ],
    "Biometric Observations",
    {
      plant_height: "numeric", tiller_count: "integer", leaf_count: "integer", leaf_height: "numeric",
      leaf_breath: "numeric", number_of_nodes: "integer", node_length: "numeric",
      millable_cane_count_1m: "integer", plant_count_1m: "integer",
    },
  ),
  ...fields(
    ["fertigation_date", "n_kg", "p2o5_kg", "k2o_kg", "mn_mixture", "urea_kg", "map_kg", "dap_kg", "white_potash_kg"],
    "Fertigation Details",
    {
      fertigation_date: "date", n_kg: "numeric", p2o5_kg: "numeric", k2o_kg: "numeric",
      mn_mixture: "numeric", urea_kg: "numeric", map_kg: "numeric", dap_kg: "numeric",
      white_potash_kg: "numeric",
    },
  ),
  { name: "custom_biometric", group: "Custom Biometric Observations", type: "jsonb" },
  { name: "custom_fertigation", group: "Custom Fertigation Details", type: "jsonb" },
  ...commonMetadataFields,
];

const fieldGroupsByTable = {
  field_entries: collegeFieldGroups,
  athani_field_entries: athaniFieldGroups,
  anthiyur_field_entries: anthiyurFieldGroups,
};

const requiredFieldsByTable = {
  field_entries: new Set(["plot", "treatment", "observation_day", "observation_date"]),
  athani_field_entries: new Set(["plot", "treatment", "observation_day", "date_of_obs", "fertigation_date"]),
  anthiyur_field_entries: new Set(["plot", "treatment", "observation_day", "date_of_obs", "fertigation_date"]),
};

const labelFor = (name) => name.split("_").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
const isAbsent = (value) => value === null || value === undefined || value === "";
const displayValue = (value) => isAbsent(value) ? "—" : typeof value === "boolean" ? String(value) : String(value);

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeRow(sourceTable, row) {
  const source = TABLES[sourceTable];
  return {
    id: row.id,
    source_table: sourceTable,
    source_location: source.location,
    location_name: row.location_name,
    plot: row.plot,
    treatment: row.treatment,
    treatment_name: row.treatment_name,
    observation_day: row.observation_day,
    observation_date: row[source.dateColumn],
    created_by: row.created_by,
    created_at: row.created_at,
    status: row.status || "Pending",
    original_row: row,
  };
}

const EXPORT_IDENTITY_COLUMNS = ["source_location", "source_table"];

const exportValue = (value) => {
  if (isAbsent(value)) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

function exportEntryRows(entry) {
  return [
    ...EXPORT_IDENTITY_COLUMNS.map((field) => ({ Field: labelFor(field), Value: exportValue(entry[field]) })),
    ...Object.entries(entry.original_row || {}).map(([field, value]) => ({ Field: labelFor(field), Value: exportValue(value) })),
  ];
}

const exportFilename = (entry, extension) => {
  const safePart = (value) => String(value || "entry").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  return `${safePart(entry.source_location)}-${safePart(entry.plot)}-${safePart(entry.id)}.${extension}`;
};

const cardStyle = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)" };
const buttonStyle = { border: "1px solid transparent", borderRadius: 9, padding: "8px 12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" };
const inputStyle = { width: "100%", padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 };
const tableCellStyle = { padding: "13px 12px", borderBottom: "1px solid #eef2f7", verticalAlign: "middle" };
const statusStyles = {
  Pending: { background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" },
  Approved: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
  Rejected: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
};

function JsonRows({ value }) {
  const rows = parseJsonArray(value);
  if (!rows.length) return <span style={{ color: "#64748b" }}>No custom entries</span>;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {rows.map((item, index) => (
        <div key={index} style={{ background: "#f8fafc", borderRadius: 7, padding: "7px 9px" }}>
          <div><b>{displayValue(item?.name)}</b></div>
          <div>Average: {displayValue(item?.value)}{!isAbsent(item?.unit) ? ` ${item.unit}` : ""}</div>
          {Array.isArray(item?.observations) && (
            <div style={{ color: "#64748b", marginTop: 3 }}>
              Observations: {item.observations.map((observation) => displayValue(observation)).join(" · ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function JsonEditor({ value, onChange }) {
  const rows = parseJsonArray(value);
  const update = (index, key, nextValue) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: nextValue } : row));
  const updateObservation = (index, observationIndex, nextValue) => {
    const nextRows = rows.map((row, i) => {
      if (i !== index) return row;
      const observations = Array.from({ length: 5 }, (_, position) => row?.observations?.[position] ?? null);
      observations[observationIndex] = nextValue === "" ? null : Number(nextValue);
      const populated = observations.filter((observation) => Number.isFinite(observation));
      const average = populated.length
        ? Number((populated.reduce((sum, observation) => sum + observation, 0) / populated.length).toFixed(2))
        : null;
      return { ...row, observations, value: average };
    });
    onChange(nextRows);
  };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row, index) => (
        <div key={index} style={{ display: "grid", gap: 8, padding: 10, border: "1px solid #e2e8f0", borderRadius: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
            <input style={inputStyle} value={row?.name ?? ""} placeholder="Custom requirement name" onChange={(e) => update(index, "name", e.target.value)} />
            <span style={{ color: "#475569", fontWeight: 700 }}>Avg: {displayValue(row?.value)}</span>
            <button type="button" style={{ ...buttonStyle, background: "#fee2e2", color: "#991b1b" }} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</button>
          </div>
          {Array.isArray(row?.observations) ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(72px, 1fr))", gap: 8 }}>
              {Array.from({ length: 5 }, (_, observationIndex) => (
                <input
                  key={observationIndex}
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="any"
                  value={row.observations?.[observationIndex] ?? ""}
                  placeholder={`Obs ${observationIndex + 1}`}
                  onChange={(event) => updateObservation(index, observationIndex, event.target.value)}
                />
              ))}
            </div>
          ) : (
            <input style={inputStyle} value={row?.value ?? ""} placeholder="Legacy value" onChange={(e) => update(index, "value", e.target.value)} />
          )}
        </div>
      ))}
      <button type="button" style={{ ...buttonStyle, background: "#e0f2fe", color: "#0369a1", justifySelf: "start" }} onClick={() => onChange([...rows, { name: "", observations: [null, null, null, null, null], value: null }])}>Add row</button>
    </div>
  );
}

function AdminApprovalPortal({ authSession, onBackToDashboard, onSignOut }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tableErrors, setTableErrors] = useState({});
  const [authorized, setAuthorized] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [rejectingSubmission, setRejectingSubmission] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [exporting, setExporting] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setTableErrors({});
    try {
      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
      if (adminError) throw new Error(`Unable to verify administrator access: ${adminError.message}`);
      if (!isAdmin) {
        setAuthorized(false);
        setSubmissions([]);
        return;
      }
      setAuthorized(true);
      const tableNames = Object.keys(TABLES);
      const settled = await Promise.allSettled(
        tableNames.map((table) => supabase.from(table).select("*").order("created_at", { ascending: false })),
      );
      const errors = {};
      const combined = [];
      settled.forEach((result, index) => {
        const table = tableNames[index];
        if (result.status === "rejected") {
          errors[table] = result.reason?.message || "Query failed";
          return;
        }
        if (result.value.error) {
          errors[table] = result.value.error.message;
          return;
        }
        (result.value.data || []).forEach((row) => combined.push(normalizeRow(table, row)));
      });
      combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setTableErrors(errors);
      setSubmissions(combined);
      if (!combined.length && Object.keys(errors).length === tableNames.length) setLoadError("All submission tables failed to load.");
    } catch (error) {
      setAuthorized(false);
      setLoadError(error.message || "Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return submissions.filter((entry) => {
      const locationMatches = locationFilter === "ALL" || entry.source_location === locationFilter;
      const statusMatches = statusFilter === "ALL" || entry.status === statusFilter;
      const searchMatches = !query || [entry.source_location, entry.location_name, entry.plot, entry.treatment, entry.treatment_name]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return locationMatches && statusMatches && searchMatches;
    });
  }, [submissions, searchTerm, locationFilter, statusFilter]);

  const counts = useMemo(() => ({
    Total: submissions.length,
    Pending: submissions.filter((item) => item.status === "Pending").length,
    Approved: submissions.filter((item) => item.status === "Approved").length,
    Rejected: submissions.filter((item) => item.status === "Rejected").length,
  }), [submissions]);

  const replaceRow = (sourceTable, row) => {
    const normalized = normalizeRow(sourceTable, row);
    setSubmissions((current) => current.map((item) => item.id === row.id && item.source_table === sourceTable ? normalized : item));
    setSelectedSubmission((current) => current?.id === row.id && current?.source_table === sourceTable ? normalized : current);
  };

  const runUpdate = async (entry, payload, action) => {
    if (!TABLES[entry.source_table]) throw new Error("Unknown source table.");
    setBusyKey(`${action}:${entry.source_table}:${entry.id}`);
    setActionError("");
    setActionMessage("");
    try {
      const { data, error } = await supabase.from(entry.source_table).update(payload).eq("id", entry.id).select().single();
      if (error) throw error;
      replaceRow(entry.source_table, data);
      return data;
    } finally {
      setBusyKey("");
    }
  };

  const openEdit = (entry) => {
    const editableFields = fieldGroupsByTable[entry.source_table].filter((field) => !PROTECTED_FIELDS.has(field.name));
    setEditValues(Object.fromEntries(editableFields.map((field) => [field.name, field.type === "jsonb" ? parseJsonArray(entry.original_row[field.name]) : entry.original_row[field.name] ?? ""])));
    setEditingSubmission(entry);
    setSelectedSubmission(null);
    setActionError("");
  };

  const convertValue = (field, value) => {
    if (field.type === "jsonb") return parseJsonArray(value).filter((item) => !isAbsent(item?.name));
    if (field.type === "integer" || field.type === "numeric") {
      if (isAbsent(value)) return null;
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || (field.type === "integer" && !Number.isInteger(number))) {
        throw new Error(`${labelFor(field.name)} must be a valid non-negative ${field.type}.`);
      }
      return number;
    }
    return value;
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const entry = editingSubmission;
    try {
      const allowed = fieldGroupsByTable[entry.source_table].filter((field) => !PROTECTED_FIELDS.has(field.name));
      const payload = {};
      allowed.forEach((field) => {
        const converted = convertValue(field, editValues[field.name]);
        if (requiredFieldsByTable[entry.source_table].has(field.name) && isAbsent(converted)) {
          throw new Error(`${labelFor(field.name)} is required.`);
        }
        const original = field.type === "jsonb" ? parseJsonArray(entry.original_row[field.name]) : entry.original_row[field.name];
        if (JSON.stringify(converted) !== JSON.stringify(original)) payload[field.name] = converted;
      });
      if (!Object.keys(payload).length) {
        setEditingSubmission(null);
        setActionMessage("No changes were detected.");
        return;
      }
      payload.updated_at = new Date().toISOString();
      await runUpdate(entry, payload, "edit");
      setEditingSubmission(null);
      setActionMessage("Submission updated successfully.");
    } catch (error) {
      setActionError(error.message || "Unable to update the submission.");
    }
  };

  const approve = async (entry) => {
    if (!window.confirm(`Approve ${entry.source_location} / ${entry.plot}?`)) return;
    try {
      await runUpdate(entry, {
        status: "Approved",
        approved_by: authSession?.user?.id,
        approved_at: new Date().toISOString(),
        rejected_by: null,
        rejected_at: null,
        rejection_feedback: null,
        updated_at: new Date().toISOString(),
      }, "approve");
      setSelectedSubmission(null);
      setActionMessage("Submission approved successfully.");
    } catch (error) {
      setActionError(error.message || "Unable to approve the submission.");
    }
  };

  const sendRejectionEmail = async (entry) => {
    const { data, error } = await supabase.functions.invoke("send-rejection-email", {
      body: { source_table: entry.source_table, record_id: entry.id },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Email service did not confirm delivery.");
    return data;
  };

  const reject = async (event) => {
    event.preventDefault();
    const feedback = rejectionFeedback.trim();
    if (!feedback) {
      setRejectionError("Rejection feedback is required.");
      return;
    }
    if (!window.confirm("Save this rejection and notify the submitter?")) return;
    const entry = rejectingSubmission;
    setRejectionError("");
    try {
      const row = await runUpdate(entry, {
        status: "Rejected",
        rejection_feedback: feedback,
        rejected_by: authSession?.user?.id,
        rejected_at: new Date().toISOString(),
        approved_by: null,
        approved_at: null,
        updated_at: new Date().toISOString(),
      }, "reject");
      const updatedEntry = normalizeRow(entry.source_table, row);
      setRejectingSubmission(null);
      setSelectedSubmission(null);
      try {
        await sendRejectionEmail(updatedEntry);
        setActionMessage("Rejection saved and email sent.");
        await fetchSubmissions();
      } catch (emailError) {
        setActionMessage("Rejection saved, but email sending failed. Use Retry Email to try again.");
        setActionError(emailError.message || "Email delivery failed.");
      }
    } catch (error) {
      setRejectionError(error.message || "Unable to reject the submission.");
    }
  };

  const retryEmail = async (entry) => {
    setBusyKey(`email:${entry.source_table}:${entry.id}`);
    setActionError("");
    try {
      await sendRejectionEmail(entry);
      setActionMessage("Rejection email sent successfully.");
      await fetchSubmissions();
    } catch (error) {
      setActionError(error.message || "Email delivery failed.");
    } finally {
      setBusyKey("");
    }
  };

  const groupedFields = (entry) => fieldGroupsByTable[entry.source_table].reduce((groups, field) => {
    const group = field.name.startsWith("approved_") || field.name.startsWith("rejected_") || field.name === "rejection_feedback"
      ? "Approval or Rejection Information" : field.group;
    (groups[group] ||= []).push(field);
    return groups;
  }, {});

  const downloadExcel = (entry) => {
    const exportKey = `excel:${entry.source_table}:${entry.id}`;
    setExporting(exportKey);
    setActionError("");
    try {
      const columns = [...EXPORT_IDENTITY_COLUMNS, ...Object.keys(entry.original_row || {})];
      const values = columns.map((column) => exportValue(
        EXPORT_IDENTITY_COLUMNS.includes(column) ? entry[column] : entry.original_row?.[column],
      ));
      const worksheet = XLSX.utils.aoa_to_sheet([columns.map(labelFor), values]);
      worksheet["!autofilter"] = { ref: worksheet["!ref"] };
      worksheet["!cols"] = columns.map((column, index) => ({
        wch: Math.min(60, Math.max(14, labelFor(column).length + 2, String(values[index] ?? "").length + 2)),
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submission");
      XLSX.writeFile(workbook, exportFilename(entry, "xlsx"), { compression: true });
      setActionMessage(`Excel report downloaded for ${entry.source_location} / ${displayValue(entry.plot)}.`);
    } catch (error) {
      setActionError(error.message || "Unable to create the Excel report.");
    } finally {
      setExporting("");
    }
  };

  const downloadPdf = (entry) => {
    const exportKey = `pdf:${entry.source_table}:${entry.id}`;
    setExporting(exportKey);
    setActionError("");
    try {
      const rows = exportEntryRows(entry);
      const document = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      document.setFontSize(18);
      document.text(`${entry.source_location} Field Submission`, 32, 32);
      document.setFontSize(9);
      document.setTextColor(71, 85, 105);
      document.text(`Generated: ${new Date().toLocaleString()} | Entry ID: ${entry.id}`, 32, 48);
      autoTable(document, {
        startY: 60,
        head: [["Field", "Value"]],
        body: rows.map((row) => [row.Field, String(row.Value ?? "")]),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak", valign: "top" },
        headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold" },
        margin: { left: 32, right: 32 },
        columnStyles: { 0: { cellWidth: 170, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
        didDrawPage: ({ pageNumber }) => {
          document.setFontSize(8);
          document.setTextColor(100);
          document.text(`Page ${pageNumber}`, document.internal.pageSize.getWidth() - 70, document.internal.pageSize.getHeight() - 16);
        },
      });
      document.save(exportFilename(entry, "pdf"));
      setActionMessage(`PDF report downloaded for ${entry.source_location} / ${displayValue(entry.plot)}.`);
    } catch (error) {
      setActionError(error.message || "Unable to create the PDF report.");
    } finally {
      setExporting("");
    }
  };

  const downloadEntry = (entry, format) => {
    if (format === "pdf") downloadPdf(entry);
    if (format === "excel") downloadExcel(entry);
  };

  return (
    <div className="admin-approval-page" style={{ minHeight: "100vh", background: "linear-gradient(145deg, #f8fafc 0%, #f0fdf4 100%)", padding: "28px 32px 48px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header className="admin-approval-header" style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap", borderTop: "4px solid #15803d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onBackToDashboard && <button type="button" style={{ ...buttonStyle, background: "#f1f5f9" }} onClick={onBackToDashboard}><ArrowLeft size={16} /> Dashboard</button>}
            <div><div style={{ color: "#15803d", fontWeight: 800, fontSize: 12 }}><ShieldCheck size={15} /> VERIFIED ADMIN WORKFLOW</div><h1 style={{ margin: "3px 0 0", fontSize: 21 }}>Field Submissions Approval</h1></div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 13 }}>{authSession?.user?.email}</span>{onSignOut && <button type="button" style={{ ...buttonStyle, background: "#fee2e2", color: "#991b1b" }} onClick={onSignOut}>Sign Out</button>}</div>
        </header>

        {loadError && <div style={{ ...cardStyle, color: "#991b1b", marginBottom: 16 }}><AlertCircle size={18} /> {loadError}</div>}
        {authorized === false && !loading && <div style={{ ...cardStyle, color: "#991b1b" }}><b>Access denied.</b> This account is authenticated but is not assigned a verified database administrator role.</div>}

        {authorized && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
            {Object.entries(counts).map(([label, count]) => <div className="admin-summary-card" key={label} style={{ ...cardStyle, padding: "16px 18px" }}><div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div><div style={{ fontSize: 30, fontWeight: 800, color: label === "Approved" ? "#166534" : label === "Rejected" ? "#991b1b" : label === "Pending" ? "#9a3412" : "#0f172a", marginTop: 3 }}>{count}</div></div>)}
          </div>

          {Object.keys(tableErrors).length > 0 && <div style={{ ...cardStyle, marginBottom: 16, color: "#92400e" }}><b>Some tables could not be loaded:</b>{Object.entries(tableErrors).map(([table, message]) => <div key={table}>{table}: {message}</div>)}</div>}
          {actionMessage && <div style={{ ...cardStyle, marginBottom: 16, color: "#166534" }}><CheckCircle2 size={18} /> {actionMessage}</div>}
          {actionError && <div style={{ ...cardStyle, marginBottom: 16, color: "#991b1b" }}><AlertCircle size={18} /> {actionError}</div>}

          <div className="admin-filter-bar" style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}><Search size={16} style={{ position: "absolute", left: 10, top: 11, color: "#94a3b8" }} /><input style={{ ...inputStyle, paddingLeft: 34 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search location, plot, or treatment" /></div>
            <select style={{ ...inputStyle, width: 180 }} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="ALL">All locations</option><option>College</option><option>Athani</option><option>Anthiyur</option></select>
            <select style={{ ...inputStyle, width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>
            <button type="button" disabled={loading} style={{ ...buttonStyle, background: "#e0f2fe", color: "#0369a1" }} onClick={fetchSubmissions}><RefreshCw size={16} /> Refresh</button>
          </div>

          <div style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Submission Records</h2><p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Review and manage individual field submissions</p></div><span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 800 }}>{filteredSubmissions.length} shown</span></div>
            <div style={{ overflowX: "auto" }}>
            {loading ? <div style={{ padding: 35, textAlign: "center" }}><Loader2 size={24} /> Loading submissions…</div> : filteredSubmissions.length === 0 ? <div style={{ padding: 35, textAlign: "center", color: "#64748b" }}>No submissions found.</div> :
              <table className="admin-submissions-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}><thead><tr>{["Location", "Plot", "Treatment", "Observation Day", "Observation Date", "Submitted Date", "Status", "Actions"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "11px 12px", borderBottom: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{heading}</th>)}</tr></thead><tbody>
                {filteredSubmissions.map((entry) => {
                  const isBusy = busyKey.endsWith(`${entry.source_table}:${entry.id}`);
                  return <tr key={`${entry.source_table}:${entry.id}`}><td style={{ ...tableCellStyle, fontWeight: 800, color: "#166534" }}>{entry.source_location}</td><td style={tableCellStyle}>{displayValue(entry.plot)}</td><td style={tableCellStyle}>{displayValue(entry.treatment)}</td><td style={tableCellStyle}>{displayValue(entry.observation_day)}</td><td style={tableCellStyle}>{displayValue(entry.observation_date)}</td><td style={{ ...tableCellStyle, whiteSpace: "nowrap", color: "#475569" }}>{entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}</td><td style={tableCellStyle}><span style={{ ...(statusStyles[entry.status] || statusStyles.Pending), display: "inline-flex", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800 }}>{entry.status}</span></td><td style={tableCellStyle}><div className="admin-row-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" style={{ ...buttonStyle, background: "#e0f2fe" }} onClick={() => setSelectedSubmission(entry)}><Eye size={14} /> Details</button>
                    <label style={{ ...buttonStyle, background: "#dcfce7", color: "#166534", padding: "0 8px" }}><FileText size={14} /><select aria-label={`Download ${entry.source_location} entry`} disabled={Boolean(exporting)} value="" onChange={(event) => downloadEntry(entry, event.target.value)} style={{ border: 0, background: "transparent", color: "inherit", fontWeight: 700, padding: "8px 2px", cursor: "pointer" }}><option value="" disabled>{exporting.endsWith(`${entry.source_table}:${entry.id}`) ? "Preparing..." : "Download"}</option><option value="pdf">PDF</option><option value="excel">Excel</option></select></label>
                    <button type="button" style={{ ...buttonStyle, background: "#f1f5f9" }} onClick={() => openEdit(entry)}><Edit3 size={14} /> Edit</button>
                    <button type="button" disabled={isBusy || entry.status === "Approved"} style={{ ...buttonStyle, background: "#dcfce7", color: "#166534" }} onClick={() => approve(entry)}>Approve</button>
                    <button type="button" disabled={isBusy || entry.status === "Rejected"} style={{ ...buttonStyle, background: "#fee2e2", color: "#991b1b" }} onClick={() => { setRejectingSubmission(entry); setRejectionFeedback(""); setRejectionError(""); }}>Reject</button>
                    {entry.status === "Rejected" && !entry.original_row.rejection_email_sent_at && <button type="button" disabled={isBusy} style={{ ...buttonStyle, background: "#fef3c7", color: "#92400e" }} onClick={() => retryEmail(entry)}>Retry Email</button>}
                  </div></td></tr>;
                })}
              </tbody></table>}
            </div>
          </div>
        </>}
      </div>

      {selectedSubmission && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 1000, padding: 20, overflowY: "auto" }}><div style={{ ...cardStyle, maxWidth: 900, margin: "20px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><div><h2 style={{ margin: 0 }}>Submission Details</h2><div style={{ color: "#64748b", fontSize: 13 }}>Source table: <b>{selectedSubmission.source_table}</b></div></div><button type="button" style={{ ...buttonStyle, background: "transparent" }} onClick={() => setSelectedSubmission(null)}><XCircle /></button></div>
        {Object.entries(groupedFields(selectedSubmission)).map(([group, groupFields]) => <section key={group} style={{ marginTop: 20 }}><h3 style={{ fontSize: 14, color: "#166534", borderBottom: "1px solid #e2e8f0", paddingBottom: 6 }}>{group}</h3>
          {groupFields[0]?.type === "jsonb" ? <JsonRows value={selectedSubmission.original_row[groupFields[0].name]} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>{groupFields.map((field) => <div key={field.name} style={{ background: "#f8fafc", padding: 9, borderRadius: 7 }}><b>{labelFor(field.name)}:</b> {displayValue(selectedSubmission.original_row[field.name])}</div>)}</div>}
        </section>)}
      </div></div>}

      {editingSubmission && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 1000, padding: 20, overflowY: "auto" }}><form onSubmit={saveEdit} style={{ ...cardStyle, maxWidth: 900, margin: "20px auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><div><h2 style={{ margin: 0 }}>Edit {editingSubmission.source_location}</h2><div style={{ fontSize: 12, color: "#64748b" }}>{editingSubmission.source_table}</div></div><button type="button" style={{ ...buttonStyle, background: "transparent" }} onClick={() => setEditingSubmission(null)}><XCircle /></button></div>
        {Object.entries(fieldGroupsByTable[editingSubmission.source_table].filter((field) => !PROTECTED_FIELDS.has(field.name)).reduce((groups, field) => { (groups[field.group] ||= []).push(field); return groups; }, {})).map(([group, groupFields]) => <section key={group} style={{ marginTop: 18 }}><h3 style={{ fontSize: 14, color: "#166534" }}>{group}</h3>{groupFields[0]?.type === "jsonb" ? <JsonEditor value={editValues[groupFields[0].name]} onChange={(value) => setEditValues((current) => ({ ...current, [groupFields[0].name]: value }))} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>{groupFields.map((field) => <label key={field.name} style={{ fontSize: 12, fontWeight: 700 }}>{labelFor(field.name)}<input style={inputStyle} type={field.type === "date" ? "date" : field.type === "integer" || field.type === "numeric" ? "number" : "text"} step={field.type === "numeric" ? "any" : undefined} min={field.type === "integer" || field.type === "numeric" ? "0" : undefined} value={editValues[field.name] ?? ""} onChange={(e) => setEditValues((current) => ({ ...current, [field.name]: e.target.value }))} /></label>)}</div>}</section>)}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}><button type="button" style={{ ...buttonStyle, background: "#f1f5f9" }} onClick={() => setEditingSubmission(null)}>Cancel</button><button disabled={busyKey.startsWith("edit:")} style={{ ...buttonStyle, background: "#166534", color: "white" }}><Save size={15} /> Save</button></div>
      </form></div>}

      {rejectingSubmission && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 1000, padding: 20 }}><form onSubmit={reject} style={{ ...cardStyle, maxWidth: 540, margin: "80px auto" }}><h2 style={{ marginTop: 0 }}>Reject Submission</h2><p>{rejectingSubmission.source_location} · {rejectingSubmission.plot} · {rejectingSubmission.treatment} · {rejectingSubmission.observation_date}</p><label style={{ fontSize: 13, fontWeight: 700 }}>Rejection feedback *</label><textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={rejectionFeedback} onChange={(e) => setRejectionFeedback(e.target.value)} />{rejectionError && <p style={{ color: "#991b1b" }}>{rejectionError}</p>}<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><button type="button" style={{ ...buttonStyle, background: "#f1f5f9" }} onClick={() => setRejectingSubmission(null)}>Cancel</button><button disabled={!rejectionFeedback.trim() || busyKey.startsWith("reject:")} style={{ ...buttonStyle, background: "#b91c1c", color: "white" }}>Confirm Reject</button></div></form></div>}
    </div>
  );
}

export default AdminApprovalPortal;
