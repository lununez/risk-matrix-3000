import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";

// --- Constants & Utility Functions ---

const riskCategories = {
  likelihood: [
    "Legal Requirements",
    "Prior Commitment",
    "3rd Party Rights",
    "Defensibility",
    "Regulatory Interest",
    "Regulatory Engagement",
    "Enforcement History",
    "Discoverability",
    "Market Practices",
  ],
  severity: [
    "Financial",
    "Consumer Protection",
    "Reputational",
    "Operational",
    "Compliance",
    "Legal Exposure",
  ],
};

const ratingOptions = {
  likelihood: [
    { label: "Rare", value: 1 },
    { label: "Unlikely", value: 2 },
    { label: "Possible", value: 3 },
    { label: "Likely", value: 4 },
    { label: "Almost Certain", value: 5 },
  ],
  severity: [
    { label: "Insignificant", value: 1 },
    { label: "Minor", value: 2 },
    { label: "Significant", value: 3 },
    { label: "Major", value: 4 },
    { label: "Severe", value: 5 },
  ],
};

// Map a score (1–25) to a risk level label.
function getRiskLevelLabel(score) {
  if (score <= 4) return "Very Low";
  else if (score <= 8) return "Low";
  else if (score <= 12) return "Medium";
  else if (score <= 16) return "High";
  else if (score <= 20) return "Very High";
  else return "Extreme";
}

// Map a score to a pastel color gradient (green-to-red).
function getCellColor(score) {
  if (score <= 4) return "#a8e6a3"; // Very Low – light green
  else if (score <= 8) return "#d4f7a3"; // Low – slightly different green/yellow
  else if (score <= 12) return "#f7f7a3"; // Medium – yellow
  else if (score <= 16) return "#f7d4a3"; // High – light orange
  else if (score <= 20) return "#f7b8a3"; // Very High – orange/red
  else return "#f7a8a8"; // Extreme – light red
}

/*
  A simple weighted averaging approach:
  It calculates the arithmetic mean then adjusts it upward slightly 
  by adding 25% of the difference between the maximum rating and the mean.
  (This gives extra weight to higher ratings without being too extreme.)
*/
function computeWeightedAverage(ratings) {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  const mean = sum / ratings.length;
  const max = Math.max(...ratings);
  const adjusted = mean + 0.25 * (max - mean);
  return adjusted;
}

// --- Components ---

// Input Section Component for a given risk type.
const RiskInputSection = ({ type, categories, ratingOptions, onAddRisk }) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [explanation, setExplanation] = useState("");
  const [selectedRating, setSelectedRating] = useState(ratingOptions[0].value);

  const handleSave = () => {
    if (!explanation.trim()) {
      alert("Please enter an explanation.");
      return;
    }
    onAddRisk({ category: selectedCategory, explanation, rating: Number(selectedRating) });
    setExplanation("");
    setSelectedCategory(categories[0]);
    setSelectedRating(ratingOptions[0].value);
  };

  return (
    <div
      style={{
        margin: "10px",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <h3>{type}</h3>
      <div style={{ marginBottom: "8px" }}>
        <label>Category: </label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label>Explanation: </label>
        <input
          type="text"
          placeholder="Please enter..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label>Rating: </label>
        <select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)}>
          {ratingOptions.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label} ({opt.value})
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleSave}
        style={{
          borderRadius: "8px",
          padding: "5px 10px",
          boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
};

// Table to display saved risk factors.
const RiskFactorsTable = ({ title, risks }) => {
  return (
    <div style={{ margin: "10px" }}>
      <h4>{title} Factors</h4>
      {risks.length === 0 ? (
        <p>No risk factors added.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Category</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Explanation</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>{risk.category}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>{risk.explanation}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "center" }}>{risk.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// The Risk Matrix component renders a 5x5 grid.
// Note: The grid is built so that the lowest likelihood is at the bottom.
const RiskMatrix = () => {
  // Build a 5x5 grid where each cell's score = likelihood * severity.
  const grid = [];
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const row = [];
    for (let severity = 1; severity <= 5; severity++) {
      const score = likelihood * severity;
      row.push({ score, label: getRiskLevelLabel(score), color: getCellColor(score) });
    }
    grid.push(row);
  }
  // Reverse rows so that lowest likelihood appears at the bottom.
  grid.reverse();

  const cellStyle = {
    width: "80px",
    height: "60px",
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
  };

  return (
    <div>
      <h3>Risk Matrix</h3>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Y-axis label */}
        <div style={{ marginBottom: "5px" }}>Likelihood</div>
        <div style={{ display: "flex" }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", marginRight: "5px" }}>
            Impact (Severity)
          </div>
          <div>
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} style={{ display: "flex" }}>
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} style={{ ...cellStyle, backgroundColor: cell.color }}>
                    <div>{cell.label}</div>
                    <div>{cell.score}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// The Risk Spectrum slider with a dynamic black triangle indicator.
const RiskSpectrum = ({ overallRisk }) => {
  const sliderWidth = 400; // pixels
  // Map overall risk (range: 1-25) to a position on the slider.
  const position = ((overallRisk - 1) / (25 - 1)) * sliderWidth;

  const sliderStyle = {
    position: "relative",
    width: sliderWidth,
    height: "20px",
    background: "linear-gradient(to right, #a8e6a3, #f7a8a8)",
    margin: "20px auto",
    borderRadius: "10px",
  };

  const indicatorStyle = {
    position: "absolute",
    left: position - 7, // adjust to center the triangle
    top: -10,
    width: "0",
    height: "0",
    borderLeft: "7px solid transparent",
    borderRight: "7px solid transparent",
    borderBottom: "10px solid black",
  };

  return (
    <div>
      <h3>Risk Spectrum</h3>
      <div style={sliderStyle}>
        <div style={indicatorStyle}></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: sliderWidth }}>
        <span>Very Low</span>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Very High</span>
        <span>Extreme</span>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [matterName, setMatterName] = useState("");
  const [likelihoodRisks, setLikelihoodRisks] = useState([]);
  const [severityRisks, setSeverityRisks] = useState([]);
  const exportRef = useRef();

  // Handlers for adding risk factors.
  const handleAddLikelihoodRisk = (risk) => {
    setLikelihoodRisks([...likelihoodRisks, risk]);
  };

  const handleAddSeverityRisk = (risk) => {
    setSeverityRisks([...severityRisks, risk]);
  };

  // Calculate overall risk: (weighted average likelihood) x (weighted average severity).
  const calculateOverallRisk = () => {
    const likelihoodRatings = likelihoodRisks.map((risk) => risk.rating);
    const severityRatings = severityRisks.map((risk) => risk.rating);

    const avgLikelihood = computeWeightedAverage(likelihoodRatings) || 0;
    const avgSeverity = computeWeightedAverage(severityRatings) || 0;

    return avgLikelihood * avgSeverity;
  };

  const overallRisk = calculateOverallRisk();

  // Export the risk matrix and spectrum as a PNG using html2canvas.
  const handleExportPNG = () => {
    if (!exportRef.current) return;
    html2canvas(exportRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${matterName || "assessment"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  // Save assessment data (matter name, likelihood and severity risks) to localStorage.
  const saveAssessment = () => {
    if (!matterName) {
      alert("Please enter a matter name before saving.");
      return;
    }
    const assessment = {
      matterName,
      likelihoodRisks,
      severityRisks,
    };
    localStorage.setItem(`assessment_${matterName}`, JSON.stringify(assessment));
    alert("Assessment saved!");
  };

  // Load assessment data from localStorage.
  const loadAssessment = () => {
    if (!matterName) {
      alert("Please enter the matter name to load.");
      return;
    }
    const data = localStorage.getItem(`assessment_${matterName}`);
    if (data) {
      const assessment = JSON.parse(data);
      setMatterName(assessment.matterName);
      setLikelihoodRisks(assessment.likelihoodRisks);
      setSeverityRisks(assessment.severityRisks);
      alert("Assessment loaded!");
    } else {
      alert("No saved assessment found for that matter name.");
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2>Legal Risk Assessment Matrix Tool</h2>
      {/* Matter name and save/load controls */}
      <div style={{ marginBottom: "20px" }}>
        <label>Matter Name: </label>
        <input
          type="text"
          value={matterName}
          onChange={(e) => setMatterName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button
          onClick={saveAssessment}
          style={{
            marginRight: "5px",
            borderRadius: "8px",
            padding: "5px 10px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          Save Assessment
        </button>
        <button
          onClick={loadAssessment}
          style={{
            borderRadius: "8px",
            padding: "5px 10px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          Load Assessment
        </button>
      </div>

      {/* Risk Factor Input Sections */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <RiskInputSection
          type="Likelihood"
          categories={riskCategories.likelihood}
          ratingOptions={ratingOptions.likelihood}
          onAddRisk={handleAddLikelihoodRisk}
        />
        <RiskInputSection
          type="Severity"
          categories={riskCategories.severity}
          ratingOptions={ratingOptions.severity}
          onAddRisk={handleAddSeverityRisk}
        />
      </div>

      {/* Display added risk factors */}
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <RiskFactorsTable title="Likelihood" risks={likelihoodRisks} />
        <RiskFactorsTable title="Severity" risks={severityRisks} />
      </div>

      {/* Exportable Area: Matrix and Spectrum */}
      <div
        ref={exportRef}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginTop: "20px",
          borderRadius: "8px",
        }}
      >
        <RiskMatrix />
        <RiskSpectrum overallRisk={overallRisk} />
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <strong>Overall Risk Score: {overallRisk.toFixed(2)}</strong>
        </div>
      </div>

      {/* Export Button */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={handleExportPNG}
          style={{
            borderRadius: "8px",
            padding: "8px 16px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          Export as PNG
        </button>
      </div>
    </div>
  );
};

export default App;
