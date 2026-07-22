import { useMemo, useState } from "react";
import {
  FlaskConical,
  MapPin,
  Layers,
  Search,
  Sprout,
  ClipboardList,
} from "lucide-react";

import KpiCard from "../components/KpiCard";
import kpiTmLocImg from "../assets/images/kpi_tm_loc.png";
import kpiTmTreatImg from "../assets/images/kpi_tm_treat.png";
import kpiCategoriesImg from "../assets/images/kpi_categories.png";
import kpiTmPlotsImg from "../assets/images/kpi_tm_plots.png";
import kpiRecordsImg from "../assets/images/kpi_records.png";

function TreatmentMaster({ data, selectedLocation }) {
  const [searchText, setSearchText] = useState("");

  const rows = useMemo(() => {
    const locationFiltered =
      selectedLocation === "All"
        ? data.treatments
        : data.treatments.filter(
            (row) => row.location_id === selectedLocation
          );

    if (!searchText.trim()) return locationFiltered;

    const query = searchText.toLowerCase();

    return locationFiltered.filter((row) => {
      return (
        String(row.location_id || "").toLowerCase().includes(query) ||
        String(row.treatment_id || "").toLowerCase().includes(query) ||
        String(row.plot_label || "").toLowerCase().includes(query) ||
        String(row.treatment_details || "").toLowerCase().includes(query)
      );
    });
  }, [data.treatments, selectedLocation, searchText]);

  const enhancedRows = useMemo(() => {
    return rows.map((row) => {
      const location = data.locations.find(
        (loc) => loc.location_id === row.location_id
      );

      return {
        ...row,
        location_name: location?.location_short_name || row.location_id,
        category: getTreatmentCategory(row.treatment_details),
      };
    });
  }, [rows, data.locations]);

  const summary = useMemo(() => {
    const locationSet = new Set(
      enhancedRows.map((row) => row.location_id).filter(Boolean)
    );

    const treatmentSet = new Set(
      enhancedRows
        .map((row) => `${row.location_id}-${row.treatment_id}`)
        .filter(Boolean)
    );

    const categorySet = new Set(
      enhancedRows.map((row) => row.category).filter(Boolean)
    );

    const plotLabelCount = enhancedRows.filter(
      (row) => row.plot_label && row.plot_label !== "-"
    ).length;

    return {
      totalLocations: locationSet.size,
      totalTreatments: treatmentSet.size,
      totalCategories: categorySet.size,
      plotMapped: plotLabelCount,
      totalRows: enhancedRows.length,
    };
  }, [enhancedRows]);

  const categorySummary = useMemo(() => {
    const grouped = {};

    enhancedRows.forEach((row) => {
      if (!grouped[row.category]) {
        grouped[row.category] = 0;
      }

      grouped[row.category] += 1;
    });

    return Object.entries(grouped)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [enhancedRows]);

  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Treatment Master</h2>
          <p>
            Location-wise treatment reference for college and farmer plot trials.
          </p>
        </div>

        <div className="toolbar-actions">
          <div className="mini-search-box">
            <Search size={17} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search treatment..."
            />
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          icon={<MapPin />}
          title="Locations"
          value={summary.totalLocations}
          note="Selected scope"
          variant="blue"
          imageSrc={kpiTmLocImg}
        />

        <KpiCard
          icon={<FlaskConical />}
          title="Treatments"
          value={summary.totalTreatments}
          note="Location-wise unique treatments"
          variant="purple"
          imageSrc={kpiTmTreatImg}
        />

        <KpiCard
          icon={<Layers />}
          title="Categories"
          value={summary.totalCategories}
          note="Detected treatment groups"
          variant="emerald"
          imageSrc={kpiCategoriesImg}
        />

        <KpiCard
          icon={<Sprout />}
          title="Plot Mapped"
          value={summary.plotMapped}
          note="Farmer plot labels available"
          variant="orange"
          imageSrc={kpiTmPlotsImg}
        />

        <KpiCard
          icon={<ClipboardList />}
          title="Records"
          value={summary.totalRows}
          note="Treatment reference rows"
          variant="blue"
          imageSrc={kpiRecordsImg}
        />
      </section>

      <section className="treatment-master-grid">
        <div className="card data-card treatment-main-card">
          <div className="card-header">
            <div>
              <h3>Treatment Reference Table</h3>
              <p>
                Use this page to understand what each treatment code represents.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Treatment ID</th>
                  <th>Plot Label</th>
                  <th>Category</th>
                  <th>Treatment Details</th>
                </tr>
              </thead>

              <tbody>
                {enhancedRows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No treatment records found.</td>
                  </tr>
                ) : (
                  enhancedRows.map((row, index) => (
                    <tr key={`${row.location_id}-${row.treatment_id}-${index}`}>
                      <td>{row.location_name}</td>
                      <td>
                        <strong>{row.treatment_id}</strong>
                      </td>
                      <td>{row.plot_label || "-"}</td>
                      <td>
                        <span className={`category-badge ${getCategoryClass(row.category)}`}>
                          {row.category}
                        </span>
                      </td>
                      <td>{row.treatment_details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card treatment-side-card">
          <div className="card-header">
            <div>
              <h3>Treatment Categories</h3>
              <p>Auto-grouped from treatment descriptions.</p>
            </div>
          </div>

          <div className="category-list">
            {categorySummary.length === 0 ? (
              <p className="empty-state">No categories available.</p>
            ) : (
              categorySummary.map((item) => (
                <div className="category-row" key={item.category}>
                  <span className={`category-badge ${getCategoryClass(item.category)}`}>
                    {item.category}
                  </span>
                  <strong>{item.count}</strong>
                </div>
              ))
            )}
          </div>

          <div className="treatment-note-box">
            <h4>Important Note</h4>
            <p>
              Treatment IDs must be interpreted location-wise. College plot uses
              T1 to T14, while Athani and Anthiyur farmer plots mainly use T1 to
              T5. So comparison should always consider the selected location.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function getTreatmentCategory(details) {
  const text = String(details || "").toLowerCase();

  if (text.includes("control")) return "Control";
  if (text.includes("stcr")) return "STCR-IPNS";
  if (text.includes("coe")) return "CoE Recommendation";
  if (text.includes("bioslurry")) return "Bioslurry";
  if (text.includes("pressmud")) return "Pressmud";
  if (text.includes("biocompost")) return "Biocompost";
  if (text.includes("trash")) return "Trash Compost";
  if (text.includes("fym")) return "RDF + FYM";
  if (text.includes("rdf")) return "RDF Based";

  return "Other";
}

function getCategoryClass(category) {
  const key = String(category || "").toLowerCase();

  if (key.includes("control")) return "control";
  if (key.includes("stcr")) return "stcr";
  if (key.includes("coe")) return "coe";
  if (
    key.includes("bioslurry") ||
    key.includes("pressmud") ||
    key.includes("biocompost") ||
    key.includes("trash")
  ) {
    return "organic";
  }
  if (key.includes("rdf")) return "rdf";

  return "other";
}

export default TreatmentMaster;