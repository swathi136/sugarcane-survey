import { Search, LogIn, LogOut, UserCheck } from "lucide-react";

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
})  {
  const loggedInRole = authSession?.role || authSession?.user?.user_metadata?.role || "User";
  const userEmail = authSession?.user?.email || "";

  return (
    <header className="top-header">
      <div>
        <p className="eyebrow">Agricultural Research Platform</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
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
  );
}

export default Header;