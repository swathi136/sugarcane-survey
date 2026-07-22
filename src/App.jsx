import ComparativeAnalysis from "./pages/ComparativeAnalysis";
import DataQuality from "./pages/DataQuality";/*data-quality*/
import { useEffect, useMemo, useState } from "react";
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
import LandingPage from "./components/LandingPage";

function App() {
  const [view, setView] = useState("landing");
  const [activePage, setActivePage] = useState("overview");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

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
        />

        {renderPage()}
      </main>
    </div>
  );
}

export default App;
