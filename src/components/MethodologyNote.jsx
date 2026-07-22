import { Info, Database, CalendarDays, Bell, BarChart3 } from "lucide-react";

function MethodologyNote() {
  return (
    <div className="methodology-note">
      <div className="methodology-note-header">
        <div className="methodology-icon">
          <Info size={20} />
        </div>
        <div>
          <h3>Dashboard Methodology Note</h3>
          <p>
            This dashboard uses processed official Excel survey records for
            visualization and decision support.
          </p>
        </div>
      </div>

      <div className="methodology-grid">
        <div className="methodology-item">
          <Database size={18} />
          <div>
            <strong>Data Source</strong>
            <span>
              Data is processed from biometric observation, fertigation schedule,
              treatment reference, and fertilizer records.
            </span>
          </div>
        </div>

        <div className="methodology-item">
          <CalendarDays size={18} />
          <div>
            <strong>Time Axis</strong>
            <span>
              Observation day is used as the main time axis because date values
              are incomplete in some source sheets.
            </span>
          </div>
        </div>

        <div className="methodology-item">
          <BarChart3 size={18} />
          <div>
            <strong>Treatment Ranking</strong>
            <span>
              Ranking is calculated from available biometric parameters such as
              plant height, tillers, leaves, leaf length, and leaf breadth.
            </span>
          </div>
        </div>

        <div className="methodology-item">
          <Bell size={18} />
          <div>
            <strong>Smart Alerts</strong>
            <span>
              Alerts are rule-based decision support alerts, not sensor-based or
              AI-predicted alerts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MethodologyNote;