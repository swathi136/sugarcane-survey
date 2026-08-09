import { useEffect, useState } from "react";
import { Search, LogIn, LogOut, UserCheck, Menu, Bell, Clock3, ArrowLeft } from "lucide-react";

function Header({
  title,
  subtitle,
  locations,
  selectedLocation,
  setSelectedLocation,
  searchTerm,
  setSearchTerm,
  onLogin,
  authSession,
  onSignOut,
  onOpenMobileMenu,
  isMobileSidebarOpen,
  onBackToPortal,
  portalName,
})  {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const loggedInRole = authSession?.role || authSession?.user?.user_metadata?.role || "User";
  const userEmail = authSession?.user?.email || "";

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <header className="top-header">
        <div className="header-title-row">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation"
          aria-controls="dashboard-navigation"
          aria-expanded={isMobileSidebarOpen}
        >
          <Menu size={22} />
        </button>
        {onBackToPortal && (
          <button type="button" className="header-portal-back" onClick={onBackToPortal}>
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Back to {portalName}</span>
          </button>
        )}
        </div>

        <div className="header-actions">
        <div className="search-box">
          <Search size={16} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plot, treatment..."
          />
        </div>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="All">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.location_id} value={loc.location_id}>
              {loc.location_short_name}
            </option>
          ))}
        </select>

        <div className="header-utilities" aria-label="Dashboard utilities">
          <span className="header-clock" title="Local time">
            <Clock3 size={15} aria-hidden="true" />
            <time dateTime={currentTime.toISOString()}>
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
          </span>
          <span className="notification-indicator" title="Notifications" aria-label="Notifications">
            <Bell size={17} aria-hidden="true" />
          </span>
        </div>

        {authSession ? (
          <div className="user-profile-badge" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="logged-in-tag" style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "#eef6f0",
              color: "#15803d",
              fontWeight: 600,
              border: "1px solid rgba(22, 128, 61, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}>
              <UserCheck size={14} />
              {loggedInRole === "admin" ? "Admin" : "Student"}: {userEmail.split("@")[0] || "Logged In"}
            </span>
            <button className="login-btn logout-mode" onClick={onSignOut} title="Sign Out">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button className="login-btn" onClick={onLogin}>
            <LogIn size={18} />
            <span>Login</span>
          </button>
        )}

        </div>
      </header>

      <section className="dashboard-hero" aria-labelledby="dashboard-page-title">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Agricultural Research Platform</p>
          <h1 id="dashboard-page-title">{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </section>
    </>
  );
}

export default Header;
