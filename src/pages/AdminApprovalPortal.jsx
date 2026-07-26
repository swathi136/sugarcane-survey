import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  GraduationCap,
  ArrowLeft,
  Filter,
  MapPin,
  Calendar,
  Grid,
  FlaskConical,
  Save,
  Clock,
  AlertCircle,
  Sparkles,
  Search,
  Check,
} from "lucide-react";

const LOCATIONS = [
  { id: "ALL", name: "All Locations" },
  { id: "L001", name: "Kumaraguru Agricultural College", shortName: "College" },
  { id: "L003", name: "Anthiyur", shortName: "Anthiyur" },
  { id: "L002", name: "Athani", shortName: "Athani" },
];

function AdminApprovalPortal({
  authSession,
  submissions,
  onApproveSubmission,
  onRejectSubmission,
  onUpdateSubmission,
  onBackToDashboard,
  onSignOut,
}) {
  const [selectedLocFilter, setSelectedLocFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Filter submissions
  const filteredSubmissions = submissions.filter((item) => {
    const matchesLoc =
      selectedLocFilter === "ALL" ||
      item.locationId === selectedLocFilter ||
      item.locationName?.toLowerCase().includes(selectedLocFilter.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      item.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plotName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.treatment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLoc && matchesStatus && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  // Open Edit Modal
  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEditFormData({ ...entry });
  };

  // Save Edits
  const handleSaveEdit = (e) => {
    e.preventDefault();
    onUpdateSubmission(editingEntry.id, editFormData);
    setActionSuccess(`Record #${editingEntry.id} updated successfully by Admin!`);
    setEditingEntry(null);
    setTimeout(() => setActionSuccess(""), 4000);
  };

  // Handle Approve
  const handleApprove = (entry) => {
    onApproveSubmission(entry.id);
    setActionSuccess(`Record for ${entry.plotName} (${entry.locationName}) APPROVED and merged into Dashboard!`);
    setTimeout(() => setActionSuccess(""), 4000);
  };

  // Handle Reject
  const handleReject = (entry) => {
    onRejectSubmission(entry.id);
    setActionSuccess(`Record for ${entry.plotName} (${entry.locationName}) rejected.`);
    setTimeout(() => setActionSuccess(""), 4000);
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
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* TOP ADMIN HEADER */}
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
                  color: "#15803d",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <ShieldCheck size={16} />
                <span>Admin Governance & Approval Portal</span>
              </div>
              <h1
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Student Field Submissions Approval Dashboard
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "#f0fdf4",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid #bbf7d0",
                fontSize: "13px",
                fontWeight: 700,
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ShieldCheck size={14} color="#16a34a" />
              <span>Admin: {authSession?.user?.email || "Administrator"}</span>
            </div>

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
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        {/* HERO METRICS BANNER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "white",
              padding: "20px 24px",
              borderRadius: "16px",
              boxShadow: "0 4px 14px rgba(3, 105, 161, 0.2)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>Pending Approvals</div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "4px 0" }}>{pendingCount}</div>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>Awaiting Admin review & approval</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
              color: "white",
              padding: "20px 24px",
              borderRadius: "16px",
              boxShadow: "0 4px 14px rgba(22, 101, 52, 0.2)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>Approved & Published</div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "4px 0" }}>{approvedCount}</div>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>Merged live into Dashboard dataset</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
              color: "white",
              padding: "20px 24px",
              borderRadius: "16px",
              boxShadow: "0 4px 14px rgba(153, 27, 27, 0.2)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>Rejected Submissions</div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "4px 0" }}>{rejectedCount}</div>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>Returned or invalid entries</div>
          </div>
        </div>

        {actionSuccess && (
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
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* FILTERS & SEARCH TOOLBAR */}
        <div
          style={{
            background: "#ffffff",
            padding: "18px 24px",
            borderRadius: "16px",
            border: "1px solid #cbd5e1",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>Status:</span>
              {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: statusFilter === st ? "#166534" : "#f1f5f9",
                    color: statusFilter === st ? "white" : "#475569",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Location Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} style={{ color: "#166534" }} />
              <select
                value={selectedLocFilter}
                onChange={(e) => setSelectedLocFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "240px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              placeholder="Search Student Email / Plot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* SUBMISSIONS LISTING */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredSubmissions.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                padding: "48px 24px",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              <CheckCircle2 size={36} style={{ color: "#22c55e", marginBottom: "12px" }} />
              <h3 style={{ margin: 0, color: "#0f172a" }}>No Submissions Found</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                There are currently no student records matching the active status filter.
              </p>
            </div>
          ) : (
            filteredSubmissions.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border:
                    entry.status === "PENDING"
                      ? "2px solid #38bdf8"
                      : entry.status === "APPROVED"
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                {/* CARD HEADER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "10px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: "12px",
                        background:
                          entry.status === "PENDING"
                            ? "#e0f2fe"
                            : entry.status === "APPROVED"
                            ? "#f0fdf4"
                            : "#fef2f2",
                        color:
                          entry.status === "PENDING"
                            ? "#0369a1"
                            : entry.status === "APPROVED"
                            ? "#166534"
                            : "#991b1b",
                      }}
                    >
                      {entry.status}
                    </span>

                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                      {entry.locationName} — {entry.plotName}
                    </span>

                    <span
                      style={{
                        background: "#eef6f0",
                        color: "#166534",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Treatment: {entry.treatment}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span>
                      <b>Submitted By:</b> {entry.studentEmail}
                    </span>
                    <span>
                      <b>Submitted At:</b> {entry.timestamp}
                    </span>
                  </div>
                </div>

                {/* CARD CONTENT GRID */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  {/* Biometric Growth Details */}
                  <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
                      Biometric Growth Observations (Obs Date: {entry.obsDate || entry.date})
                    </div>
                    <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                      <div><b>Obs Day:</b> {entry.obsDay}</div>
                      <div><b>Plant Height:</b> {entry.plantHeight} cm</div>
                      <div><b>Tillers Count:</b> {entry.numTillers}</div>
                      <div><b>Leaves Count:</b> {entry.numLeaves}</div>
                      <div><b>Leaf Length x Breadth:</b> {entry.leafLength}cm x {entry.leafBreadth}cm</div>
                      {entry.germinationPct !== "-" && <div><b>Germination %:</b> {entry.germinationPct}%</div>}
                      {entry.plantCount1m !== "-" && <div><b>1m Plant Count:</b> {entry.plantCount1m}</div>}
                      {entry.numNodes !== "-" && <div><b>Nodes Count:</b> {entry.numNodes}</div>}
                    </div>
                  </div>

                  {/* Fertigation Doses Details */}
                  <div style={{ background: "#f0f9ff", padding: "12px 16px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", marginBottom: "6px" }}>
                      Fertigation Dose Inputs (Fert Date: {entry.fertDate || entry.date})
                    </div>
                    <div style={{ fontSize: "13px", color: "#0369a1", lineHeight: "1.6" }}>
                      <div style={{ fontWeight: 800, color: "#15803d" }}>
                        White Potash: {entry.whitePotashKg} kg
                      </div>
                      <div>DAP: {entry.dapKg} kg | SSP: {entry.sspKg} kg</div>
                      <div>N: {entry.nKg} kg | P2O5: {entry.p2o5Kg} kg | K2O: {entry.k2oKg} kg</div>
                      <div>Urea: {entry.ureaKg} kg | MAP: {entry.mapKg} kg | Mn: {entry.mnMixture} kg</div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (EDIT, APPROVE, REJECT) */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(entry)}
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Edit3 size={15} />
                    <span>Edit Record Data</span>
                  </button>

                  {entry.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleReject(entry)}
                      style={{
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <XCircle size={15} />
                      <span>Reject</span>
                    </button>
                  )}

                  {entry.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleApprove(entry)}
                      style={{
                        background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
                        color: "white",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(22, 101, 52, 0.25)",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve & Merge to Dashboard</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      {editingEntry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Edit3 size={20} style={{ color: "#166534" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Admin Edit Student Submission (#{editingEntry.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {/* SECTION A: EDIT BIOMETRIC OBSERVATION DATA */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#166534", borderBottom: "1px solid #bbf7d0", paddingBottom: "6px" }}>
                  A. Biometric Growth Observation Fields
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Obs Date</label>
                    <input
                      type="date"
                      value={editFormData.obsDate || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, obsDate: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Plant Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.plantHeight || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, plantHeight: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Tillers Count</label>
                    <input
                      type="number"
                      value={editFormData.numTillers || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, numTillers: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Leaves Count</label>
                    <input
                      type="number"
                      value={editFormData.numLeaves || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, numLeaves: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Leaf Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.leafLength || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, leafLength: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Leaf Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.leafBreadth || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, leafBreadth: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Node Count</label>
                    <input
                      type="text"
                      value={editFormData.numNodes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, numNodes: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Node Length (cm)</label>
                    <input
                      type="text"
                      value={editFormData.nodeLength || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nodeLength: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Millable Cane Count</label>
                    <input
                      type="text"
                      value={editFormData.millableCaneCount || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, millableCaneCount: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>1m Plant Count</label>
                    <input
                      type="text"
                      value={editFormData.plantCount1m || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, plantCount1m: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>5m Plant Count</label>
                    <input
                      type="text"
                      value={editFormData.plantCount5m || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, plantCount5m: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>15m Plant Count</label>
                    <input
                      type="text"
                      value={editFormData.plantCount15m || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, plantCount15m: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Germination %</label>
                    <input
                      type="text"
                      value={editFormData.germinationPct || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, germinationPct: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: EDIT FERTIGATION DOSE SCHEDULE DATA */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#0369a1", borderBottom: "1px solid #7dd3fc", paddingBottom: "6px" }}>
                  B. Fertigation Dose Schedule Fields
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#0369a1" }}>Fert Application Date</label>
                    <input
                      type="date"
                      value={editFormData.fertDate || editFormData.obsDate || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, fertDate: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #7dd3fc", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#166534" }}>White Potash (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.whitePotashKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, whitePotashKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1.5px solid #22c55e", fontWeight: 700, fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>DAP (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.dapKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, dapKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>SSP (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.sspKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, sspKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Mn Mixture (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.mnMixture || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mnMixture: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>N (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.nKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, nKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>P2O5 (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.p2o5Kg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, p2o5Kg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>K2O (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.k2oKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, k2oKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>MAP (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.mapKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mapKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Urea (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.ureaKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, ureaKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>MOP (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.mopKg || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mopKg: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#166534", color: "white", fontWeight: 800 }}
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApprovalPortal;
