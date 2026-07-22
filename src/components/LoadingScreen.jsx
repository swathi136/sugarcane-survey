import { Sprout, Database, Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="screen-state">
      <div className="screen-state-card">
        <div className="screen-state-icon loading-icon">
          <Sprout size={34} />
        </div>

        <h2>Loading Sugarcane Research Dashboard</h2>

        <p>
          Processing biometric observations, fertigation schedules, treatment
          references, and fertilizer records.
        </p>

        <div className="loading-row">
          <Loader2 size={18} className="spinner" />
          <span>Preparing dashboard analytics...</span>
        </div>

        <div className="loading-data-row">
          <Database size={16} />
          <span>Reading processed CSV files from public data folder</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;