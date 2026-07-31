import ComparativeAnalysis from "./pages/ComparativeAnalysis";
import DataQuality from "./pages/DataQuality";/*data-quality*/
import { useEffect, useMemo, useState } from "react";
import { X, Sprout, Mail, Lock, GraduationCap, ShieldCheck, Loader2, CheckCircle2, AlertCircle, MailCheck, KeyRound, UserPlus, LogIn, ArrowRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./utils/supabaseClient";
import "./App.css";

import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { loadDashboardData } from "./utils/dataLoader";

import Overview from "./pages/Overview";
import TreatmentMaster from "./pages/TreatmentMaster";
import BiometricGrowth from "./pages/BiometricGrowth";
import TreatmentComparison from "./pages/TreatmentComparison";
import FertigationTracking from "./pages/FertigationTracking";
import SmartAlerts from "./pages/SmartAlerts";
import Reports from "./pages/Reports";
import StudentDataEntry from "./pages/StudentDataEntry";
import AdminApprovalPortal from "./pages/AdminApprovalPortal";
import LandingPage from "./components/LandingPage";

import { sendRejectionNotification } from "./utils/emailService";
import { fetchAllSubmissions, updateSubmissionStatus, updateSubmissionData } from "./services/fieldEntryService";

function App() {
  const [view, setView] = useState("landing");
  const [activePage, setActivePage] = useState("overview");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [loginRole, setLoginRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const [submissionsList, setSubmissionsList] = useState([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      const data = await fetchAllSubmissions();
      setSubmissionsList(data);
    };
    if (isSupabaseConfigured) {
      loadSubmissions();
    }
  }, []);

  const handleSubmitNewEntry = (newEntry) => {
    setSubmissionsList((prev) => [
      { ...newEntry, status: "PENDING" },
      ...prev,
    ]);
  };

  const handleApproveSubmission = async (id) => {
    const targetItem = submissionsList.find((s) => s.id === id);
    if (!targetItem) return;

    if (isSupabaseConfigured && targetItem.tableName) {
      try {
        await updateSubmissionStatus(id, targetItem.tableName, "APPROVED");
      } catch (error) {
        console.error("Failed to update status in backend", error);
        alert("Failed to approve in database.");
        return;
      }
    }

    setSubmissionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
    );

    const approvedItem = targetItem;
    if (approvedItem && data) {
      // 1. Biometric Calculations
      const pHeight = parseFloat(approvedItem.plantHeight) || 0;
      const numTillers = parseInt(approvedItem.numTillers, 10) || 0;
      const numLeaves = parseInt(approvedItem.numLeaves, 10) || 0;
      const lLength = parseFloat(approvedItem.leafLength) || 0;
      const lBreadth = parseFloat(approvedItem.leafBreadth) || 0;
      const nNodes = parseInt(approvedItem.numNodes, 10) || 0;
      const nLength = parseFloat(approvedItem.nodeLength) || 0;
      const mCaneCount = parseInt(approvedItem.millableCaneCount, 10) || 0;
      const pCount1m = parseInt(approvedItem.plantCount1m, 10) || 0;
      const pCount5m = parseInt(approvedItem.plantCount5m, 10) || 0;
      const pCount15m = parseInt(approvedItem.plantCount15m, 10) || 0;
      const germPct = parseFloat(approvedItem.germinationPct) || 0;
      const obsDayNum = parseInt(String(approvedItem.obsDay || "30").replace(/[^0-9]/g, ""), 10) || 30;

      // Derived Biometric Calculations
      const leafAreaCalc = parseFloat((lLength * lBreadth * 0.75).toFixed(2));
      const tillerRatioCalc = parseFloat((numTillers / Math.max(1, pCount1m || 1)).toFixed(2));

      const newBioObs = {
        observation_id: `BIO_NEW_${Date.now()}`,
        location_id: approvedItem.locationId || "L001",
        location_name: approvedItem.locationName,
        plot_id: approvedItem.plotName,
        plot_name: approvedItem.plotName,
        treatment_id: approvedItem.treatment,
        observation_day: obsDayNum,
        date_of_observation: approvedItem.obsDate || approvedItem.date || new Date().toISOString().split("T")[0],

        // Snake_case & camelCase aliases for dashboard views
        plant_height: pHeight,
        plant_height_cm: pHeight,
        plantHeight: pHeight,

        tiller_count: numTillers,
        number_of_tillers: numTillers,
        numTillers: numTillers,

        leaf_count: numLeaves,
        number_of_leaves: numLeaves,
        numLeaves: numLeaves,

        leaf_height: lLength,
        leaf_length_cm: lLength,
        leafLength: lLength,

        leaf_width: lBreadth,
        leaf_breadth_cm: lBreadth,
        leafBreadth: lBreadth,

        leaf_area: leafAreaCalc,
        leafArea: leafAreaCalc,

        number_of_nodes: nNodes,
        numNodes: nNodes,

        node_length: nLength,
        node_length_cm: nLength,
        nodeLength: nLength,

        millable_cane_count: mCaneCount,
        millableCaneCount: mCaneCount,

        plant_count_1m: pCount1m,
        plantCount1m: pCount1m,

        plant_count_5m: pCount5m,
        plantCount5m: pCount5m,

        plant_count_15m: pCount15m,
        plantCount15m: pCount15m,

        germination_pct: germPct,
        germinationPct: germPct,

        tiller_ratio: tillerRatioCalc,
        tillerRatio: tillerRatioCalc,

        customBiometrics: approvedItem.customBiometrics || "",
      };

      // 2. Fertigation Nutrient Calculations
      const wPotash = parseFloat(approvedItem.whitePotashKg) || 0;
      const urea = parseFloat(approvedItem.ureaKg) || 0;
      const map = parseFloat(approvedItem.mapKg) || 0;
      const dap = parseFloat(approvedItem.dapKg) || 0;
      const ssp = parseFloat(approvedItem.sspKg) || 0;
      const mop = parseFloat(approvedItem.mopKg) || 0;
      const mnMix = parseFloat(approvedItem.mnMixture) || 0;

      let nKgVal = parseFloat(approvedItem.nKg) || 0;
      if (!nKgVal && (urea || dap || map)) {
        nKgVal = parseFloat(((urea * 0.46) + (dap * 0.18) + (map * 0.11)).toFixed(2));
      }

      let p2o5KgVal = parseFloat(approvedItem.p2o5Kg) || 0;
      if (!p2o5KgVal && (dap || map || ssp)) {
        p2o5KgVal = parseFloat(((dap * 0.46) + (map * 0.52) + (ssp * 0.16)).toFixed(2));
      }

      let k2oKgVal = parseFloat(approvedItem.k2oKg) || 0;
      if (!k2oKgVal && (wPotash || mop)) {
        k2oKgVal = parseFloat(((wPotash * 0.60) + (mop * 0.60)).toFixed(2));
      }

      const newFertSched = {
        schedule_id: `FERT_NEW_${Date.now()}`,
        location_id: approvedItem.locationId || "L001",
        location_name: approvedItem.locationName,
        plot_id: approvedItem.plotName,
        plot_name: approvedItem.plotName,
        treatment_id: approvedItem.treatment,
        observation_day: obsDayNum,
        date_of_observation: approvedItem.fertDate || approvedItem.obsDate || approvedItem.date,

        white_potash_kg: wPotash,
        whitePotashKg: wPotash,

        n_kg: nKgVal,
        nKg: nKgVal,

        p2o5_kg: p2o5KgVal,
        p2o5Kg: p2o5KgVal,

        k2o_kg: k2oKgVal,
        k2oKg: k2oKgVal,

        mn_mixture: mnMix,
        mnMixture: mnMix,

        urea_kg: urea,
        ureaKg: urea,

        map_kg: map,
        mapKg: map,

        dap_kg: dap,
        dapKg: dap,

        ssp_kg: ssp,
        sspKg: ssp,

        mop_kg: mop,
        mopKg: mop,

        customFertigation: approvedItem.customFertigation || "",
      };

      setData((prevData) => {
        const prevBio = prevData?.biometric || [];
        const prevBioObs = prevData?.biometricObservations || [];
        const prevFert = prevData?.fertigation || [];
        const prevFertSched = prevData?.fertigationSchedule || [];

        return {
          ...prevData,
          biometric: [newBioObs, ...prevBio],
          biometricObservations: [newBioObs, ...prevBioObs],
          fertigation: [newFertSched, ...prevFert],
          fertigationSchedule: [newFertSched, ...prevFertSched],
        };
      });
    }
  };

  const handleRejectSubmission = async (id, feedback = "") => {
    const targetItem = submissionsList.find((s) => s.id === id);

    if (isSupabaseConfigured && targetItem && targetItem.tableName) {
      try {
        await updateSubmissionStatus(id, targetItem.tableName, "REJECTED", feedback);
      } catch (error) {
        console.error("Failed to update status in backend", error);
        alert("Failed to reject in database.");
        return;
      }
    }

    setSubmissionsList((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "REJECTED",
              rejectionFeedback: feedback,
              rejectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          : s
      )
    );

    // Send email notification to student email
    if (targetItem && targetItem.studentEmail) {
      await sendRejectionNotification({
        studentEmail: targetItem.studentEmail,
        plotName: targetItem.plotName,
        locationName: targetItem.locationName,
        feedback: feedback || "Rejection specified by Admin without extra comment.",
        submissionId: id,
      });
    }
  };

  const handleUpdateSubmission = async (id, updatedFields) => {
    const targetItem = submissionsList.find((s) => s.id === id);

    if (isSupabaseConfigured && targetItem && targetItem.tableName) {
      try {
        await updateSubmissionData(id, targetItem.tableName, updatedFields);
      } catch (error) {
        console.error("Failed to update data in backend", error);
        alert("Failed to update data in database.");
        return;
      }
    }

    setSubmissionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
    );
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 1. REGISTER HANDLER (Email + Password Registration)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regEmail || !regPassword) {
      setAuthError("Please fill in both Email Address and Password.");
      return;
    }

    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match. Please re-enter.");
      return;
    }

    setAuthLoading(true);

    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setAuthSuccess(`Registered ${regEmail}! Switch to Sign In to log in.`);
        setEmail(regEmail);
        setPassword(regPassword);
        setTimeout(() => {
          setAuthMode("login");
          setAuthSuccess("");
        }, 1200);
        return;
      }

      // Register user account in Supabase Database
      const redirectUrl = window.location.origin + window.location.pathname;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: { role: loginRole },
        },
      });

      if (signUpError) {
        setAuthError(signUpError.message || "Failed to register account.");
      } else {
        setAuthSuccess(`Account registered for ${regEmail}! A confirmation email has been sent to your inbox.`);
        setEmail(regEmail);
        setPassword(regPassword);
        setTimeout(() => {
          setAuthMode("login");
        }, 1500);
      }
    } catch (err) {
      setAuthError(err?.message || "An error occurred during registration.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. LOGIN HANDLER (Enforces Email Confirmation Check)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setUnconfirmedEmail("");

    if (!email || !password) {
      setAuthError("Please fill in both Email Address and Password.");
      return;
    }

    setAuthLoading(true);

    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const isAdmin = loginRole === "admin" || email.toLowerCase().includes("admin");
        const demoUser = {
          user: { id: "demo-user-1", email: email },
          role: isAdmin ? "admin" : "student",
        };
        setAuthSession(demoUser);
        setAuthSuccess(`Logged in successfully as ${isAdmin ? "Admin" : "Student"}! Redirecting...`);
        setTimeout(() => {
          setShowLogin(false);
          setAuthSuccess("");
          setEmail("");
          setPassword("");

          setView(isAdmin ? "admin-approval" : "data-entry");
        }, 1000);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || "";
        if (msg.includes("confirm") || msg.includes("not confirmed")) {
          setUnconfirmedEmail(email);
          setAuthError("Email Confirmation Required! Please check your email inbox and click 'Confirm your email' / 'Yes it is me' before logging in.");
        } else {
          setAuthError(signInError.message || "Invalid login credentials. Please check your email and password.");
        }
        return;
      }

      if (data?.user && !data.user.email_confirmed_at && data.user.confirmation_sent_at) {
        setUnconfirmedEmail(email);
        setAuthError("Email Confirmation Required! Please check your email inbox and click the confirmation link before logging in.");
        return;
      }

      const isAdmin = loginRole === "admin" || email.toLowerCase().includes("admin");
      setAuthSession({ ...data.session, role: isAdmin ? "admin" : "student", user: data.user || data.session?.user });
      setAuthSuccess(`Login successful! Redirecting...`);
      setTimeout(() => {
        setShowLogin(false);
        setAuthSuccess("");
        setEmail("");
        setPassword("");

        setView(isAdmin ? "admin-approval" : "data-entry");
      }, 1000);
    } catch (err) {
      setAuthError(err?.message || "Failed to log in via Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. RESEND CONFIRMATION EMAIL HANDLER
  const handleResendConfirmation = async () => {
    const targetEmail = unconfirmedEmail || email || regEmail;
    if (!targetEmail) return;

    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setAuthSuccess(`Confirmation email resent to ${targetEmail}!`);
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
      });

      if (resendError) {
        setAuthError(resendError.message || "Failed to resend confirmation email.");
      } else {
        setAuthSuccess(`Confirmation email resent to ${targetEmail}! Please check your inbox.`);
      }
    } catch (err) {
      setAuthError(err?.message || "Failed to resend email.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthSession(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [activePage, view]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const result = await loadDashboardData();
        setData(result);
      } catch (err) {
        console.error("Dashboard data loading error:", err);
        setError(
          err?.message ||
            "Unable to load dashboard data. Please check the CSV files."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const pageInfo = useMemo(() => {
    const info = {
      overview: {
        title: "Sugarcane Survey Visualization Dashboard",
        subtitle:
          "Automated biometric analysis, fertigation tracking, and treatment-based decision support.",
      },
      "treatment-master": {
        title: "Treatment Master",
        subtitle:
          "Location-wise treatment definitions used across college and farmer plots.",
      },
      "biometric-growth": {
        title: "Biometric Growth Analysis",
        subtitle:
          "Growth trends based on plant height, tillers, leaves, and leaf measurements.",
      },
      "fertigation-tracking": {
        title: "Fertigation Tracking",
        subtitle:
          "Treatment-wise fertilizer schedule and crop-stage nutrient tracking.",
      },
      "treatment-comparison": {
        title: "Treatment Comparison",
        subtitle:
          "Compare treatments across location, plot, and observation day.",
      },
      "comparative-analysis": {
        title: "Comparative Analysis",
        subtitle:
          "Location-wise, treatment-wise, day-wise biometric, and fertigation comparison."
      },
      "smart-alerts": {
        title: "Smart Alerts",
        subtitle:
          "Rule-based alerts for low growth and field inspection support.",
      },
      "data-quality": {
        title: "Data Quality & Completeness",
        subtitle:
          "Assessment of data completeness and accuracy across all datasets.",
      },
      reports: {
        title: "Reports",
        subtitle:
          "Monthly summary reports and downloadable project documentation.",
      },
      "student-data-entry": {
        title: "Student Field Data Entry Portal",
        subtitle:
          "Field data collection for Athani (and all plots) for Biometric Plant Growth and Fertigation Schedules.",
      },
    };

    return info[activePage] || info.overview;
  }, [activePage]);

  function renderPage() {
    if (activePage === "overview") {
      return <Overview data={data} selectedLocation={selectedLocation} />;
    }

    if (activePage === "treatment-master") {
      return (
        <TreatmentMaster data={data} selectedLocation={selectedLocation} />
      );
    }

    if (activePage === "biometric-growth") {
      return (
        <BiometricGrowth data={data} selectedLocation={selectedLocation} />
      );
    }

    if (activePage === "treatment-comparison") {
      return (
        <TreatmentComparison data={data} selectedLocation={selectedLocation} />
      );
    }

    if (activePage === "fertigation-tracking") {
      return (
        <FertigationTracking data={data} selectedLocation={selectedLocation} />
      );
    }
    if (activePage === "comparative-analysis") {
      return (
        <ComparativeAnalysis data={data} selectedLocation={selectedLocation} />
      );
    }

    if (activePage === "smart-alerts") {
      return <SmartAlerts data={data} selectedLocation={selectedLocation} />;
    }
    if (activePage === "data-quality") {
      return <DataQuality data={data} selectedLocation={selectedLocation} />;
    }

    if (activePage === "reports") {
      return <Reports data={data} selectedLocation={selectedLocation} />;
    }

    return <Overview data={data} selectedLocation={selectedLocation} />;
  }

  if (view === "landing") {
    return <LandingPage onViewDashboard={() => setView("dashboard")} />;
  }

  if (view === "data-entry") {
    return (
      <StudentDataEntry
        authSession={authSession}
        submissions={submissionsList}
        onBackToDashboard={() => setView("dashboard")}
        onBackToLanding={() => setView("landing")}
        onSignOut={handleSignOut}
        onSubmitNewEntry={handleSubmitNewEntry}
      />
    );
  }

  if (view === "admin-approval") {
    return (
      <AdminApprovalPortal
        authSession={authSession}
        submissions={submissionsList}
        onApproveSubmission={handleApproveSubmission}
        onRejectSubmission={handleRejectSubmission}
        onUpdateSubmission={handleUpdateSubmission}
        onBackToDashboard={() => setView("dashboard")}
        onSignOut={handleSignOut}
      />
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!data) {
    return (
      <ErrorScreen message="Dashboard data is empty. Please check processed CSV files." />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onBackToLanding={() => setView("landing")}
      />

      <main className="main-content">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          locations={data.locations || []}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onLogin={() => {
            setAuthError("");
            setAuthSuccess("");
            setShowLogin(true);
          }}
          authSession={authSession}
          onSignOut={handleSignOut}
        />

        {renderPage()}
        {showLogin && (
          <div className="login-overlay" onClick={() => setShowLogin(false)}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
              
              <button
                type="button"
                className="close-x-btn"
                onClick={() => setShowLogin(false)}
                title="Close modal"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Main Auth Flow Mode Selector: Sign In vs Register */}
              <div className="auth-mode-selector" style={{
                display: "flex",
                gap: "12px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "12px",
                marginBottom: "4px"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError("");
                    setAuthSuccess("");
                    setUnconfirmedEmail("");
                    setAuthMode("login");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    background: authMode === "login" ? "#eef6f0" : "transparent",
                    color: authMode === "login" ? "#14532d" : "#64748b",
                    fontWeight: authMode === "login" ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError("");
                    setAuthSuccess("");
                    setUnconfirmedEmail("");
                    setAuthMode("register");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    background: authMode === "register" ? "#eef6f0" : "transparent",
                    color: authMode === "register" ? "#14532d" : "#64748b",
                    fontWeight: authMode === "register" ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <UserPlus size={15} />
                  <span>Register</span>
                </button>
              </div>

              {/* Header section based on mode */}
              <div className="login-header">
                <div className={`login-icon-badge ${loginRole === "admin" ? "admin-badge" : "student-badge"}`}>
                  {loginRole === "student" ? (
                    <GraduationCap size={26} />
                  ) : (
                    <ShieldCheck size={26} />
                  )}
                </div>
                <h2>
                  {authMode === "register"
                    ? `Register ${loginRole === "student" ? "Student" : "Admin"}`
                    : `${loginRole === "student" ? "Student" : "Admin"} Login`}
                </h2>
                <p className="login-subtitle">
                  {authMode === "register"
                    ? "Create an account with Email & Password"
                    : loginRole === "student"
                    ? "Access Student Biometric & Survey Portal"
                    : "Administrator Controls & Field Data Management"}
                </p>
              </div>

              {/* Role Selector Tabs */}
              <div className="login-role-tabs">
                <button
                  type="button"
                  className={`role-tab ${loginRole === "student" ? "active" : ""}`}
                  onClick={() => {
                    setAuthError("");
                    setLoginRole("student");
                  }}
                >
                  <GraduationCap size={16} />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-tab ${loginRole === "admin" ? "active" : ""}`}
                  onClick={() => {
                    setAuthError("");
                    setLoginRole("admin");
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Admin</span>
                </button>
              </div>

              {/* Alerts */}
              {authError && (
                <div className="login-alert error-alert" style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "13px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} style={{ shrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                  {unconfirmedEmail && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: "4px",
                        padding: "4px 10px",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Resend Confirmation Email
                    </button>
                  )}
                </div>
              )}

              {authSuccess && (
                <div className="login-alert success-alert" style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <CheckCircle2 size={16} style={{ shrink: 0 }} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* VIEW 1: SIGN IN FORM */}
              {authMode === "login" && (
                <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="login-field-group">
                    <label className="login-input-label" htmlFor="login-email">
                      {loginRole === "student" ? "Student Email / ID" : "Admin Username / Email"}
                    </label>
                    <div className="login-input-wrapper">
                      <Mail size={18} className="login-field-icon" />
                      <input
                        id="login-email"
                        type="text"
                        placeholder={loginRole === "student" ? "Enter Student ID / Email" : "Enter Admin Username / Email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label className="login-input-label" htmlFor="login-password">Password</label>
                    <div className="login-input-wrapper">
                      <Lock size={18} className="login-field-icon" />
                      <input
                        id="login-password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`login-submit-btn ${loginRole === "admin" ? "admin-submit" : "student-submit"}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 size={18} className="spin-loader" style={{ animation: "spin 1s linear infinite" }} />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <span>{loginRole === "student" ? "Login as Student" : "Login as Admin"}</span>
                    )}
                  </button>

                  <div style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError("");
                        setAuthMode("register");
                      }}
                      style={{ background: "none", border: "none", color: "#16a34a", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Register here
                    </button>
                  </div>
                </form>
              )}

              {/* VIEW 2: REGISTER FORM (Enter Email & Password) */}
              {authMode === "register" && (
                <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="login-field-group">
                    <label className="login-input-label" htmlFor="reg-email">
                      {loginRole === "student" ? "Student Email Address" : "Admin Email Address"}
                    </label>
                    <div className="login-input-wrapper">
                      <Mail size={18} className="login-field-icon" />
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label className="login-input-label" htmlFor="reg-password">Create Password</label>
                    <div className="login-input-wrapper">
                      <Lock size={18} className="login-field-icon" />
                      <input
                        id="reg-password"
                        type="password"
                        placeholder="Create a password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label className="login-input-label" htmlFor="reg-confirm-password">Confirm Password</label>
                    <div className="login-input-wrapper">
                      <Lock size={18} className="login-field-icon" />
                      <input
                        id="reg-confirm-password"
                        type="password"
                        placeholder="Re-enter password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`login-submit-btn ${loginRole === "admin" ? "admin-submit" : "student-submit"}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 size={18} className="spin-loader" style={{ animation: "spin 1s linear infinite" }} />
                        <span>Registering Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Register Account</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError("");
                        setAuthMode("login");
                      }}
                      style={{ background: "none", border: "none", color: "#16a34a", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              <button
                type="button"
                className="close-btn"
                onClick={() => setShowLogin(false)}
              >
                Close
              </button>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
