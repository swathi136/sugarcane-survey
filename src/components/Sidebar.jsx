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
  ChartNoAxesCombined,
  Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    id: "advanced-comparison",
    label: "Advanced Comparison",
    icon: ChartNoAxesCombined,
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

function Sidebar({ activePage, setActivePage, onBackToLanding, onOpenDataEntry, onBackToPortal, portalName, isExpanded, setIsExpanded }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverLeaveTimer = useRef(null);
  const showExpanded = isExpanded || isHovered;

  useEffect(() => () => clearTimeout(hoverLeaveTimer.current), []);

  function handleMouseEnter() {
    clearTimeout(hoverLeaveTimer.current);
    setIsHovered(true);
  }

  function handleMouseLeave() {
    clearTimeout(hoverLeaveTimer.current);
    hoverLeaveTimer.current = setTimeout(() => setIsHovered(false), 120);
  }

  return (
    <aside 
      className={`sidebar ${showExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: showExpanded ? '14px 12px' : '14px 0', transition: 'padding var(--sidebar-motion)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', width: showExpanded ? '160px' : '0px', opacity: showExpanded ? 1 : 0, transition: 'width var(--sidebar-motion), opacity 0.22s ease', whiteSpace: 'nowrap' }}>
          <div className="brand-icon">
            <Sprout size={22} />
          </div>
          <div>
            <h2>Sugarcane</h2>
            <p>Research Analytics</p>
          </div>
        </div>
        <button 
          className="menu-btn" 
          onClick={() => setIsExpanded(!isExpanded)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}
          title="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      {onBackToPortal && (
        <div style={{ 
          padding: showExpanded ? '0 12px 12px 12px' : '0 12px 0 12px', 
          maxHeight: showExpanded ? '60px' : '0px', 
          opacity: showExpanded ? 1 : 0, 
          overflow: 'hidden', 
          transition: 'padding var(--sidebar-motion), max-height var(--sidebar-motion), opacity 0.22s ease'
        }}>
          <button
            className="nav-item"
            style={{
              width: '100%',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#0284c7',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onClick={onBackToPortal}
          >
            ← Back to {portalName}
          </button>
        </div>
      )}

      {onBackToLanding && (
        <div style={{ 
          padding: showExpanded ? '0 12px 12px 12px' : '0 12px 0 12px', 
          maxHeight: showExpanded ? '60px' : '0px', 
          opacity: showExpanded ? 1 : 0, 
          overflow: 'hidden', 
          transition: 'padding var(--sidebar-motion), max-height var(--sidebar-motion), opacity 0.22s ease'
        }}>
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
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
              <Icon size={18} style={{ minWidth: '18px' }} />
              <span style={{
                overflow: 'hidden',
                opacity: showExpanded ? 1 : 0,
                maxWidth: showExpanded ? '200px' : '0px',
                transform: showExpanded ? 'translateX(0)' : 'translateX(-10px)',
                transition: 'max-width var(--sidebar-motion), transform var(--sidebar-motion), opacity 0.2s ease',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{
        opacity: showExpanded ? 1 : 0,
        maxHeight: showExpanded ? '50px' : '0px',
        overflow: 'hidden',
        transition: 'max-height var(--sidebar-motion), padding-top var(--sidebar-motion), opacity 0.22s ease',
        paddingTop: showExpanded ? '16px' : '0px',
        borderTop: showExpanded ? '1px solid var(--border)' : 'none',
        whiteSpace: 'nowrap'
      }}>
        <p>Dynamic monthly official data monitoring</p>
      </div>
    </aside>
  );
}

export default Sidebar;
