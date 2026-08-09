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
  X,
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

function Sidebar({ activePage, setActivePage, onBackToLanding, onOpenDataEntry, isExpanded, setIsExpanded, isMobileOpen, closeMobile }) {
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
      id="dashboard-navigation"
      className={`sidebar ${showExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: showExpanded ? '16px 14px' : '16px 0', transition: 'padding var(--sidebar-motion)' }}>
        <div className="brand-copy-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', width: showExpanded ? '230px' : '0px', opacity: showExpanded ? 1 : 0, transition: 'width var(--sidebar-motion), opacity 0.22s ease', whiteSpace: 'nowrap' }}>
          <div className="brand-icon">
            <Sprout size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', letterSpacing: '-0.4px', color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>Sugarcane</h2>
            <p style={{ fontSize: '12px', color: 'var(--sage)', margin: '2px 0 0 0', fontWeight: 500 }}>Research Analytics</p>
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
        <button className="mobile-sidebar-close" type="button" onClick={closeMobile} aria-label="Close navigation">
          <X size={22} />
        </button>
      </div>

      {onBackToLanding && (
        <div className="sidebar-return-wrap" style={{
          padding: showExpanded ? '0 14px 14px 14px' : '0 14px 0 14px',
          maxHeight: showExpanded ? '80px' : '0px',
          opacity: showExpanded ? 1 : 0, 
          overflow: 'hidden', 
          transition: 'padding var(--sidebar-motion), max-height var(--sidebar-motion), opacity 0.22s ease'
        }}>
          <button
            className="nav-item"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#223A24',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
            onClick={() => { onBackToLanding(); closeMobile?.(); }}
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
              aria-current={activePage === item.id ? "page" : undefined}
              onClick={() => {
                if (item.id === "student-data-entry" && onOpenDataEntry) {
                  onOpenDataEntry();
                } else {
                  setActivePage(item.id);
                }
                closeMobile?.();
              }}
            >
              <Icon size={18} style={{ minWidth: '18px' }} />
              <span className="nav-label" style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                opacity: showExpanded ? 1 : 0,
                maxWidth: showExpanded ? '250px' : '0px',
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
