import { AlertCircle } from "lucide-react";

function EmptyState({
  title = "No data available",
  message = "No records are available for the selected filter.",
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        <AlertCircle size={22} />
      </div>

      <div>
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default EmptyState;