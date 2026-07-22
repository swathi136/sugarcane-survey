import { Search, MapPin } from "lucide-react";

function Header({
  title,
  subtitle,
  locations,
  selectedLocation,
  setSelectedLocation,
  searchTerm,
  setSearchTerm,
}) {
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
      </div>
    </header>
  );
}

export default Header;