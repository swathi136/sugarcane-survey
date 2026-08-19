const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentDataEntry.jsx', 'utf8');

// Normalize line endings for reliable matching
content = content.replace(/\r\n/g, '\n');

// Chunk 1: MultiInput
content = content.replace(
  "};\n\nfunction StudentDataEntry({\n  authSession,",
  `};

const MultiInput = ({ label, values, setValues, type = "number", step, min, placeholder }) => {
  const count = values.filter((v) => v !== "").length;
  const validVals = values
    .filter((v) => v !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  const avg = validVals.length
    ? (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2)
    : "";

  return (
    <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span>{label}</span>
        <span style={{ color: "#166534" }}>Obs Count: {count} | Avg: {avg || "-"}</span>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {values.map((v, i) => (
          <input
            key={i}
            type={type}
            min={min}
            step={step}
            placeholder={i === 0 ? placeholder : 'Obs ' + (i + 1)}
            value={v}
            onChange={(e) => {
              const newVals = [...values];
              newVals[i] = e.target.value;
              setValues(newVals);
            }}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "center" }}
          />
        ))}
      </div>
    </div>
  );
};

function StudentDataEntry({
  authSession,`
);

// Chunk 2: State
content = content.replace(
`  // Section 2: Biometric Observation Field States
  const [plantNum, setPlantNum] = useState("1");
  const [plantHeight, setPlantHeight] = useState("");
  const [numTillers, setNumTillers] = useState("");
  const [numLeaves, setNumLeaves] = useState("");
  const [leafLength, setLeafLength] = useState("");
  const [leafBreadth, setLeafBreadth] = useState("");
  const [numNodes, setNumNodes] = useState("");
  const [nodeLength, setNodeLength] = useState("");
  const [millableCaneCount, setMillableCaneCount] = useState("");
  const [plantCount1m, setPlantCount1m] = useState("");
  const [plantCount5m, setPlantCount5m] = useState("");
  const [plantCount15m, setPlantCount15m] = useState("");
  const [germinationPct, setGerminationPct] = useState("");

  // Dynamic Custom Biometric Fields
  const [customBiometricFields, setCustomBiometricFields] = useState([]);

  // Section 3: Fertigation Schedule Field States
  const [fertigationDate, setFertigationDate] = useState(todayStr);
  const [whitePotashKg, setWhitePotashKg] = useState("");
  const [dapKg, setDapKg] = useState("");
  const [sspKg, setSspKg] = useState("");
  const [mnMixture, setMnMixture] = useState("");
  const [nKg, setNKg] = useState("");
  const [p2o5Kg, setP2o5Kg] = useState("");
  const [k2oKg, setK2oKg] = useState("");
  const [mapKg, setMapKg] = useState("");
  const [ureaKg, setUreaKg] = useState("");
  const [mopKg, setMopKg] = useState("");`,
`  const emptyFive = () => ["", "", "", "", ""];
  // Section 2: Biometric Observation Field States
  const [plantNum, setPlantNum] = useState(emptyFive());
  const [plantHeight, setPlantHeight] = useState(emptyFive());
  const [numTillers, setNumTillers] = useState(emptyFive());
  const [numLeaves, setNumLeaves] = useState(emptyFive());
  const [leafLength, setLeafLength] = useState(emptyFive());
  const [leafBreadth, setLeafBreadth] = useState(emptyFive());
  const [numNodes, setNumNodes] = useState(emptyFive());
  const [nodeLength, setNodeLength] = useState(emptyFive());
  const [millableCaneCount, setMillableCaneCount] = useState(emptyFive());
  const [plantCount1m, setPlantCount1m] = useState(emptyFive());
  const [plantCount5m, setPlantCount5m] = useState(emptyFive());
  const [plantCount15m, setPlantCount15m] = useState(emptyFive());
  const [germinationPct, setGerminationPct] = useState(emptyFive());

  // Dynamic Custom Biometric Fields
  const [customBiometricFields, setCustomBiometricFields] = useState([]);

  // Section 3: Fertigation Schedule Field States
  const [fertigationDate, setFertigationDate] = useState(todayStr);
  const [whitePotashKg, setWhitePotashKg] = useState(emptyFive());
  const [dapKg, setDapKg] = useState(emptyFive());
  const [sspKg, setSspKg] = useState(emptyFive());
  const [mnMixture, setMnMixture] = useState(emptyFive());
  const [nKg, setNKg] = useState(emptyFive());
  const [p2o5Kg, setP2o5Kg] = useState(emptyFive());
  const [k2oKg, setK2oKg] = useState(emptyFive());
  const [mapKg, setMapKg] = useState(emptyFive());
  const [ureaKg, setUreaKg] = useState(emptyFive());
  const [mopKg, setMopKg] = useState(emptyFive());`
);

// Chunk 3: hasData
content = content.replace(
`    const hasBiometricData =
      plantNum ||
      plantHeight ||
      numTillers ||
      numLeaves ||
      leafLength ||
      leafBreadth ||
      numNodes ||
      nodeLength ||
      millableCaneCount ||
      plantCount1m ||
      plantCount5m ||
      plantCount15m ||
      germinationPct ||
      customBiometricFields.some((f) => f.value !== "");

    const hasFertigationData =
      whitePotashKg ||
      nKg ||
      p2o5Kg ||
      k2oKg ||
      mnMixture ||
      ureaKg ||
      mopKg ||
      dapKg ||
      sspKg ||
      mapKg ||
      customFertigationFields.some((f) => f.value !== "");`,
`    const hasData = (arr) => Array.isArray(arr) ? arr.some(v => v !== "") : !!arr;

    const hasBiometricData =
      hasData(plantNum) ||
      hasData(plantHeight) ||
      hasData(numTillers) ||
      hasData(numLeaves) ||
      hasData(leafLength) ||
      hasData(leafBreadth) ||
      hasData(numNodes) ||
      hasData(nodeLength) ||
      hasData(millableCaneCount) ||
      hasData(plantCount1m) ||
      hasData(plantCount5m) ||
      hasData(plantCount15m) ||
      hasData(germinationPct) ||
      customBiometricFields.some((f) => f.value !== "");

    const hasFertigationData =
      hasData(whitePotashKg) ||
      hasData(nKg) ||
      hasData(p2o5Kg) ||
      hasData(k2oKg) ||
      hasData(mnMixture) ||
      hasData(ureaKg) ||
      hasData(mopKg) ||
      hasData(dapKg) ||
      hasData(sspKg) ||
      hasData(mapKg) ||
      customFertigationFields.some((f) => f.value !== "");`
);

// Chunk 4: invalidNumericField
content = content.replace(
`    const invalidNumericField = numericFields.find(({ value }) => {
      if (value === "" || value === null || value === undefined) return false;
      const numericValue = Number(value);
      return !Number.isFinite(numericValue) || numericValue < 0;
    });`,
`    const invalidNumericField = numericFields.find(({ value }) => {
      if (Array.isArray(value)) {
        return value.some((v) => {
          if (v === "" || v === null || v === undefined) return false;
          const numericValue = Number(v);
          return !Number.isFinite(numericValue) || numericValue < 0;
        });
      }
      if (value === "" || value === null || value === undefined) return false;
      const numericValue = Number(value);
      return !Number.isFinite(numericValue) || numericValue < 0;
    });`
);

// Chunk 5: asNullableNumber
content = content.replace(
`    const asNullableNumber = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    };`,
`    const asNullableNumber = (value) => {
      if (Array.isArray(value)) {
        const valid = value.filter(v => v !== "").map(Number).filter(n => Number.isFinite(n) && n >= 0);
        if (valid.length === 0) return null;
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
        return Number(avg.toFixed(2));
      }
      if (value === "" || value === null || value === undefined) return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    };`
);

// Chunk 6: clearFormInputs
content = content.replace(
`  const clearFormInputs = () => {
    setPlantHeight("");
    setNumTillers("");
    setNumLeaves("");
    setLeafLength("");
    setLeafBreadth("");
    setNumNodes("");
    setNodeLength("");
    setMillableCaneCount("");
    setPlantCount1m("");
    setPlantCount5m("");
    setPlantCount15m("");
    setGerminationPct("");
    setWhitePotashKg("");
    setNKg("");
    setP2o5Kg("");
    setK2oKg("");
    setMnMixture("");
    setUreaKg("");
    setMopKg("");
    setDapKg("");
    setSspKg("");
    setMapKg("");
    setCustomBiometricFields([]);
    setCustomFertigationFields([]);
  };`,
`  const clearFormInputs = () => {
    const empty = ["", "", "", "", ""];
    setPlantNum(empty);
    setPlantHeight(empty);
    setNumTillers(empty);
    setNumLeaves(empty);
    setLeafLength(empty);
    setLeafBreadth(empty);
    setNumNodes(empty);
    setNodeLength(empty);
    setMillableCaneCount(empty);
    setPlantCount1m(empty);
    setPlantCount5m(empty);
    setPlantCount15m(empty);
    setGerminationPct(empty);
    setWhitePotashKg(empty);
    setNKg(empty);
    setP2o5Kg(empty);
    setK2oKg(empty);
    setMnMixture(empty);
    setUreaKg(empty);
    setMopKg(empty);
    setDapKg(empty);
    setSspKg(empty);
    setMapKg(empty);
    setCustomBiometricFields([]);
    setCustomFertigationFields([]);
  };`
);

// Chunk 7: Bio Grid
const bioStartStr = `                display: "grid",\n                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",\n                gap: "18px",\n                marginBottom: "20px",\n              }}\n            >\n              {/* Plant Number (Common / Athani / College) */}`;
const bioGridStart = content.indexOf(bioStartStr);
const customBioStart = content.indexOf(`Additional Biometric Requirements (Custom Parameters)`);
const bioGridEnd = content.lastIndexOf('</div>', customBioStart - 100); // points to the </div> that closes the grid

const bioNewGrid = `                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              {(isCollege || isAthani) && (
                <MultiInput label="Plant Number (plant_num)" values={plantNum} setValues={setPlantNum} min="1" placeholder="e.g. 1" />
              )}
              <MultiInput label="Plant Height (plant_height) [cm]" values={plantHeight} setValues={setPlantHeight} min="0" step="0.1" placeholder="e.g. 185.5" />
              <MultiInput label="Tiller Count (tiller_count / no of tillers)" values={numTillers} setValues={setNumTillers} min="0" placeholder="e.g. 8" />
              <MultiInput label="Leaf Count (leaf_count / no of leaf)" values={numLeaves} setValues={setNumLeaves} min="0" placeholder="e.g. 12" />
              <MultiInput label="Leaf Height / Length (leaf_height / leaf_length) [cm]" values={leafLength} setValues={setLeafLength} min="0" step="0.1" placeholder="e.g. 110.2" />
              <MultiInput label="Leaf Breath / Width (leaf_breath / leaf_width) [cm]" values={leafBreadth} setValues={setLeafBreadth} min="0" step="0.1" placeholder="e.g. 4.5" />
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Number of Nodes (no of node / number_of_nodes)" values={numNodes} setValues={setNumNodes} min="0" placeholder="e.g. 14" />
              )}
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Node Length (node length / node_length) [cm]" values={nodeLength} setValues={setNodeLength} min="0" step="0.1" placeholder="e.g. 12.4" />
              )}
              {isAnthiyur && (
                <MultiInput label="Millable Cane Count 1m [millable cane(1m)]" values={millableCaneCount} setValues={setMillableCaneCount} min="0" placeholder="e.g. 6" />
              )}
              {(isAnthiyur || isCollege) && (
                <MultiInput label="Row Length MC 1m / Plant Count 1m [row length mc(1m)]" values={plantCount1m} setValues={setPlantCount1m} min="0" placeholder="e.g. 15" />
              )}
              {isCollege && (
                <MultiInput label="Plant Count 5m Row (plant_count_5m)" values={plantCount5m} setValues={setPlantCount5m} min="0" placeholder="e.g. 72" />
              )}
              {isCollege && (
                <MultiInput label="Plant Count 15m Row (plant_count_15m)" values={plantCount15m} setValues={setPlantCount15m} min="0" placeholder="e.g. 210" />
              )}
              {isCollege && (
                <MultiInput label="Germination % (germination_pct)" values={germinationPct} setValues={setGerminationPct} min="0" step="0.1" placeholder="e.g. 88.5" />
              )}
            </div>`;

content = content.substring(0, bioGridStart) + bioNewGrid + content.substring(bioGridEnd + 6);

// Chunk 8: Fertigation Grid
const fertStartStr = `                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",\n                gap: "18px",\n              }}\n            >\n              {/* FERTIGATION APPLICATION DATE */}`;
const fertGridStart = content.indexOf(fertStartStr);
const customFertStart = content.indexOf(`Additional Fertigation Requirements (Custom Parameters)`);
const fertGridEnd = content.lastIndexOf('</div>', customFertStart - 100);

const fertNewGrid = `                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "18px",
              }}
            >
              {/* FERTIGATION APPLICATION DATE */}
              <div style={{ background: "#e0f2fe", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #38bdf8", marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", display: "block", marginBottom: "4px", whiteSpace: "nowrap" }}>
                  Fertigation Application Date *
                </label>
                <input
                  type="date"
                  value={fertigationDate}
                  onChange={(e) => setFertigationDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #0284c7", fontSize: "14px", fontWeight: 600, color: "#0369a1" }}
                />
              </div>

              <MultiInput label="N (N_KG) [kg]" values={nKg} setValues={setNKg} min="0" step="0.01" placeholder="e.g. 4.40" />
              <MultiInput label="P2O5 (P2O5_KG) [kg]" values={p2o5Kg} setValues={setP2o5Kg} min="0" step="0.01" placeholder="e.g. 4.41" />
              <MultiInput label="K2O (K2O_KG) [kg]" values={k2oKg} setValues={setK2oKg} min="0" step="0.01" placeholder="e.g. 1.38" />
              <MultiInput label="Mn Mixture (MN_MIXTURE) [kg]" values={mnMixture} setValues={setMnMixture} min="0" step="0.01" placeholder="e.g. 4.60" />
              <MultiInput label="Urea (UREA_KG) [kg]" values={ureaKg} setValues={setUreaKg} min="0" step="0.01" placeholder="e.g. 7.66" />
              <MultiInput label="MAP (MAP_KG) [kg]" values={mapKg} setValues={setMapKg} min="0" step="0.01" placeholder="e.g. 7.22" />
              <MultiInput label="DAP (DAP_KG) [kg]" values={dapKg} setValues={setDapKg} min="0" step="0.01" placeholder="e.g. 57.39" />
              <MultiInput label="White Potash (WHITE_POTASH_KG) [kg]" values={whitePotashKg} setValues={setWhitePotashKg} min="0" step="0.01" placeholder="e.g. 2.30" />
              
              {isCollege && (
                <MultiInput label="SSP (ssp_kg) [kg]" values={sspKg} setValues={setSspKg} min="0" step="0.01" placeholder="e.g. 25.0" />
              )}
              {isCollege && (
                <MultiInput label="MOP (mop_kg) [kg]" values={mopKg} setValues={setMopKg} min="0" step="0.01" placeholder="e.g. 2.30" />
              )}
            </div>`;

content = content.substring(0, fertGridStart) + fertNewGrid + content.substring(fertGridEnd + 6);

fs.writeFileSync('src/pages/StudentDataEntry.jsx', content);
console.log('Done!');
