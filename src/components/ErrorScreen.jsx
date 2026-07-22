import { AlertTriangle, RefreshCcw, FileWarning } from "lucide-react";

function ErrorScreen({ message }) {
  return (
    <div className="screen-state">
      <div className="screen-state-card error-card">
        <div className="screen-state-icon error-icon">
          <AlertTriangle size={34} />
        </div>

        <h2>Dashboard Data Loading Failed</h2>

        <p>
          The dashboard could not load one or more required CSV files. Please
          check whether all processed data files are available in the correct
          folder.
        </p>

        <div className="error-detail-box">
          <FileWarning size={18} />
          <span>{message || "Unknown data loading error."}</span>
        </div>

        <button className="retry-btn" onClick={() => window.location.reload()}>
          <RefreshCcw size={16} />
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}

export default ErrorScreen;