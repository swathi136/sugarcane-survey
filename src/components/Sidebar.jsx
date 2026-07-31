import {
  LayoutDashboard,
  Leaf,
  FlaskConical,
  Droplets,
  Bell,
  FileText,
  Sprout,
  TrendingUp,
  DatabaseZap,
  GitCompare,
} from "lucide-react";

const menuItems = [
  {
    id: "overview",
    label: "Dashboard Overview",
    icon: LayoutDashboard,
  },
  {
    id: "treatment-master",
    label: "Treatment Master",
    icon: FlaskConical,
  },
  {
    id: "biometric-growth",
    label: "Biometric Growth",
    icon: Leaf,
  },
  {
    id: "fertigation-tracking",
    label: "Fertigation Tracking",
    icon: Droplets,
  },
  {
    id: "treatment-comparison",
    label: "Treatment Comparison",
    icon: TrendingUp,
  },
  {
    id: "comparative-analysis",
    label: "Comparative Analysis",
    icon: GitCompare,
  },
  {
    id: "smart-alerts",
    label: "Smart Alerts",
    icon: Bell,
  },
  {
    id: "data-quality",
    label: "Data Quality",
    icon: DatabaseZap,
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
  },
];

function Sidebar({ activePage, setActivePage, onBackToLanding, onOpenDataEntry }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Sprout size={22} />
        </div>
        <div>
          <h2>Sugarcane</h2>
          <p>Research Analytics</p>
        </div>
      </div>

      {onBackToLanding && (
        <div style={{ padding: '0 12px 12px 12px' }}>
          <button
            className="nav-item"
            style={{
              width: '100%',
              backgroundColor: 'rgba(79, 122, 74, 0.1)',
              border: '1px solid rgba(79, 122, 74, 0.25)',
              color: '#223A24',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={onBackToLanding}
          >
            ← Back to Landing Page
          </button>
        </div>
      )}

      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => {
                if (item.id === "student-data-entry" && onOpenDataEntry) {
                  onOpenDataEntry();
                } else {
                  setActivePage(item.id);
                }
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>Dynamic monthly official data monitoring</p>
      </div>
    </aside>
  );
}

export default Sidebar;
