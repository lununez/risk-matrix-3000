// RiskMatrix.js
import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import Select from "react-select";
import "./RiskMatrix.css"; // Ensure this file contains your styling (updated below as needed)

// --- Constants & Utility Functions ---

const riskCategories = {
  likelihood: [
    "Legal Requirements",
    "Prior Commitment",
    "3rd Party Rights",
    "Defensibility", // Special handling below.
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

// New rating options for Defensibility – note the inverted risk perspective.
const defensibilityRatingOptions = [
  { label: "Very Strong", value: 1 },
  { label: "Strong", value: 2 },
  { label: "Moderate", value: 3 },
  { label: "Weak", value: 4 },
  { label: "Very Weak", value: 5 },
];

function getRiskLevelLabel(score) {
  if (score <= 4) return "Very Low";
  else if (score <= 8) return "Low";
  else if (score <= 12) return "Medium";
  else if (score <= 16) return "High";
  else if (score <= 20) return "Very High";
  else return "Extreme";
}

function getCellColor(score) {
  if (score <= 4) return "#a8e6a3"; // Pastel green.
  else if (score <= 8) return "#d4f7a3"; // Light green/yellow.
  else if (score <= 12) return "#f7f7a3"; // Yellow.
  else if (score <= 16) return "#f7d4a3"; // Light orange.
  else if (score <= 20) return "#f7b8a3"; // Orange/red.
  else return "#f7a8a8"; // Pastel red.
}

/*
  Simple weighted average: computes the arithmetic mean and adds
  25% of the difference between the maximum rating and the mean.
*/
function computeWeightedAverage(ratings) {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  const mean = sum / ratings.length;
  const max = Math.max(...ratings);
  return mean + 0.25 * (max - mean);
}

function generateMarkdownTable(likelihoodRisks, severityRisks) {
  const header = "| Type | Category | Explanation | Risk Rating |\n| --- | --- | --- | --- |\n";
  const rows = [];
  likelihoodRisks.forEach((risk) => {
    // If risk.categories is an array, join them.
    const categoryText = Array.isArray(risk.categories) ? risk.categories.join(", ") : risk.category;
    rows.push(`| Likelihood | ${categoryText} | ${risk.explanation} | ${risk.ratingLabel} (${risk.rating}) |`);
  });
  severityRisks.forEach((risk) => {
    const categoryText = Array.isArray(risk.categories) ? risk.categories.join(", ") : risk.category;
    rows.push(`| Severity | ${categoryText} | ${risk.explanation} | ${risk.ratingLabel} (${risk.rating}) |`);
  });
  return header + rows.join("\n");
}

// --- Components ---

// Updated RiskInputSection using react-select for polished multi‑select and single‑select fields.
const RiskInputSection = ({ type, categories, ratingOptions, onAddRisk }) => {
  // For Category, use react-select multi-select.
  const [selectedCategories, setSelectedCategories] = useState([
    { value: categories[0], label: categories[0] },
  ]);
  // For Risk Rating, use react-select single-select.
  const [selectedRating, setSelectedRating] = useState({
    value: ratingOptions.likelihood[0].value,
    label: `${ratingOptions.likelihood[0].label} (${ratingOptions.likelihood[0].value})`,
  });
  const [explanation, setExplanation] = useState("");

  // Determine effective rating options.
  const effectiveRatingOptions =
    type === "Likelihood" &&
    selectedCategories.some((opt) => opt.value === "Defensibility")
      ? defensibilityRatingOptions
      : type === "Likelihood"
      ? ratingOptions.likelihood
      : ratingOptions.severity;

  // Update rating select when effective options change.
  useEffect(() => {
    const defaultOption = effectiveRatingOptions[0];
    setSelectedRating({
      value: defaultOption.value,
      label: `${defaultOption.label} (${defaultOption.value})`,
    });
  }, [selectedCategories, effectiveRatingOptions]);

  // Prepare options for react-select.
  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: cat,
  }));
  const ratingSelectOptions = effectiveRatingOptions.map((opt) => ({
    value: opt.value,
    label: `${opt.label} (${opt.value})`,
  }));

  // Custom react-select styles (adjust these as needed).
  const customStylesMulti = {
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
    control: (provided, state) => ({
      ...provided,
      borderRadius: "4px",
      border: "1px solid #ccc",
      boxShadow: state.isFocused ? "0 0 5px rgba(0,0,0,0.3)" : "none",
      "&:hover": {
        border: "1px solid #aaa",
      },
      fontSize: "16px",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#e0e0e0",
      borderRadius: "2px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#333",
      fontSize: "14px",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#666",
      ":hover": {
        backgroundColor: "#ccc",
        color: "#222",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      color: state.isSelected ? "#fff" : "#333",
      backgroundColor: state.isSelected
        ? "#4CAF50"
        : state.isFocused
        ? "#f0f0f0"
        : "#fff",
      ":hover": {
        backgroundColor: "#ddd",
      },
    }),
  };

  const customStylesSingle = {
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
    control: (provided, state) => ({
      ...provided,
      borderRadius: "4px",
      border: "1px solid #ccc",
      boxShadow: state.isFocused ? "0 0 5px rgba(0,0,0,0.3)" : "none",
      "&:hover": {
        border: "1px solid #aaa",
      },
      fontSize: "16px",
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: "16px",
      fontWeight: 700,
      color: "#000",
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      color: state.isSelected ? "#fff" : "#333",
      backgroundColor: state.isSelected
        ? "#4CAF50"
        : state.isFocused
        ? "#f0f0f0"
        : "#fff",
      ":hover": {
        backgroundColor: "#ddd",
      },
    }),
  };

  const handleSave = () => {
    if (!explanation.trim()) {
      alert("Please enter an explanation.");
      return;
    }
    const riskData = {
      categories: selectedCategories.map((opt) => opt.value),
      explanation,
      rating: selectedRating.value,
      ratingLabel: selectedRating.label.split(" ")[0], // Extract the label (e.g., "Rare")
    };
    onAddRisk(riskData);
    setExplanation("");
    setSelectedCategories([{ value: categories[0], label: categories[0] }]);
    const defaultOption = effectiveRatingOptions[0];
    setSelectedRating({
      value: defaultOption.value,
      label: `${defaultOption.label} (${defaultOption.value})`,
    });
  };

  return (
    <div className="risk-input-section">
      <h3>{type}</h3>
      <div className="inline-group">
        <div className="input-item">
          <label>Category:</label>
          <Select
            isMulti
            options={categoryOptions}
            value={selectedCategories}
            onChange={setSelectedCategories}
            styles={customStylesMulti}
            placeholder="Select categories..."
          />
          <small className="help-text">[Enter help text for category]</small>
        </div>
        <div className="input-item">
          <label>Risk Rating:</label>
          <Select
            options={ratingSelectOptions}
            value={selectedRating}
            onChange={setSelectedRating}
            styles={customStylesSingle}
            placeholder="Select a rating..."
          />
        </div>
      </div>
      <div className="input-group">
        <label>Explanation:</label>
        <textarea
          className="custom-textarea"
          rows="3"
          placeholder="Enter a detailed explanation here..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>
      <button className="save-button" onClick={handleSave}>
        Save
      </button>
    </div>
  );
};

// RiskFactorsTable now shows the full rating string.
const RiskFactorsTable = ({ title, risks }) => {
  return (
    <div className="risk-factors-table">
      <h4>{title} Factors</h4>
      {risks.length === 0 ? (
        <p>No risk factors added.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Explanation</th>
              <th>Risk Rating</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, idx) => (
              <tr key={idx}>
                <td>
                  {Array.isArray(risk.categories)
                    ? risk.categories.join(", ")
                    : risk.category}
                </td>
                <td>{risk.explanation}</td>
                <td style={{ textAlign: "center" }}>
                  {risk.ratingLabel} ({risk.rating})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Updated RiskMatrix: centered with formatted cell content.
const RiskMatrix = ({ highlightCoordinates }) => {
  const grid = [];
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const row = [];
    for (let severity = 1; severity <= 5; severity++) {
      const score = likelihood * severity;
      row.push({
        score,
        label: getRiskLevelLabel(score),
        color: getCellColor(score),
        likelihood,
        severity,
      });
    }
    grid.push(row);
  }
  // Reverse rows so that the lowest likelihood appears at the bottom.
  grid.reverse();
  const cells = grid.flat();

  return (
    <div className="risk-matrix">
      <h3>Risk Matrix</h3>
      <div className="matrix-wrapper">
        <div className="vertical-label">Likelihood</div>
        <div className="matrix-content">
          <div className="horizontal-label">Severity</div>
          <div className="matrix-grid">
            {cells.map((cell, index) => {
              const isHighlighted =
                highlightCoordinates &&
                highlightCoordinates.likelihood === cell.likelihood &&
                highlightCoordinates.severity === cell.severity;
              return (
                <div
                  key={index}
                  className="matrix-cell"
                  style={{
                    backgroundColor: cell.color,
                    opacity: isHighlighted ? 1 : 0.25,
                  }}
                >
                  <div className="cell-label">{cell.label}</div>
                  <div className="cell-score">({cell.score})</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated RiskSpectrum with adjusted dimensions and label positions.
const RiskSpectrum = ({ overallRisk }) => {
  const sliderWidth = 520; // Match matrix grid width
  const position = ((overallRisk - 1) / (25 - 1)) * sliderWidth;
  const displayedScore = Math.round(overallRisk) || 0;
  const riskLabel = overallRisk > 0 ? getRiskLevelLabel(displayedScore) : "N/A";

  const sliderContainerStyle = {
    width: sliderWidth,
    margin: "0 auto",
    position: "relative",
    height: "40px", // Reduced height
  };

  const labelStyle = {
    position: "absolute",
    left: position - 40,
    top: -20, // Adjusted to avoid overlapping title
    width: "80px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const sliderStyle = {
    position: "absolute",
    bottom: "0",
    width: "100%",
    height: "20px", // Reduced slider line height
    background:
      "linear-gradient(to right, #a8e6a3 0%, #d4f7a3 20%, #f7f7a3 50%, #f7d4a3 80%, #f7a8a8 100%)",
    borderRadius: "10px",
  };

  const indicatorStyle = {
    position: "absolute",
    left: position - 1,
    top: 0,
    bottom: 0,
    width: "2px",
    backgroundColor: "black",
  };

  const labelContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    position: "absolute",
    bottom: -20,
    width: "100%",
    fontSize: "12px",
  };

  return (
    <div className="risk-spectrum">
      <h3>Risk Spectrum</h3>
      <div style={sliderContainerStyle}>
        <div style={labelStyle}>
          {riskLabel} ({displayedScore})
        </div>
        <div style={sliderStyle}></div>
        <div style={indicatorStyle}></div>
        <div style={labelContainerStyle}>
          <span>Very Low</span>
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Very High</span>
          <span>Extreme</span>
        </div>
      </div>
    </div>
  );
};

// Main App component assembling everything.
const App = () => {
  const [matterName, setMatterName] = useState("");
  const [likelihoodRisks, setLikelihoodRisks] = useState([]);
  const [severityRisks, setSeverityRisks] = useState([]);
  const exportRef = useRef();

  const handleAddLikelihoodRisk = (risk) => {
    setLikelihoodRisks([...likelihoodRisks, risk]);
  };

  const handleAddSeverityRisk = (risk) => {
    setSeverityRisks([...severityRisks, risk]);
  };

  const likelihoodRatings = likelihoodRisks.map((risk) => risk.rating);
  const severityRatings = severityRisks.map((risk) => risk.rating);
  const avgLikelihood = computeWeightedAverage(likelihoodRatings) || 0;
  const avgSeverity = computeWeightedAverage(severityRatings) || 0;
  const overallRisk = avgLikelihood * avgSeverity;

  const highlightedLikelihood = Math.min(5, Math.max(1, Math.round(avgLikelihood)));
  const highlightedSeverity = Math.min(5, Math.max(1, Math.round(avgSeverity)));
  const highlightCoordinates = {
    likelihood: highlightedLikelihood,
    severity: highlightedSeverity,
  };

  const handleExportPNG = () => {
    if (!exportRef.current) return;
    html2canvas(exportRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${matterName || "assessment"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

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

  const markdownText = generateMarkdownTable(likelihoodRisks, severityRisks);

  const copyMarkdownToClipboard = () => {
    navigator.clipboard.writeText(markdownText);
    alert("Markdown copied to clipboard!");
  };

  return (
    <div className="app-container">
      <h2>Legal Risk Assessment Matrix Tool</h2>
      {/* Matter Name & Save/Load Controls */}
      <div className="matter-controls">
        <label>Matter Name: </label>
        <input
          type="text"
          className="custom-input"
          value={matterName}
          onChange={(e) => setMatterName(e.target.value)}
        />
        <button onClick={saveAssessment}>Save Assessment</button>
        <button onClick={loadAssessment}>Load Assessment</button>
      </div>

      {/* Stacked Input Sections */}
      <div className="input-sections">
        <RiskInputSection
          type="Likelihood"
          categories={riskCategories.likelihood}
          ratingOptions={ratingOptions}
          onAddRisk={handleAddLikelihoodRisk}
        />
        <RiskInputSection
          type="Severity"
          categories={riskCategories.severity}
          ratingOptions={ratingOptions}
          onAddRisk={handleAddSeverityRisk}
        />
      </div>

      {/* Stacked Risk Factor Tables */}
      <div className="tables-container">
        <RiskFactorsTable title="Likelihood" risks={likelihoodRisks} />
        <RiskFactorsTable title="Severity" risks={severityRisks} />
      </div>

      {/* Exportable Area: Matrix & Spectrum */}
      <div ref={exportRef} className="exportable-area">
        <RiskMatrix highlightCoordinates={highlightCoordinates} />
        <RiskSpectrum overallRisk={overallRisk} />
      </div>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button onClick={handleExportPNG}>Export as PNG</button>
      </div>

      {/* Markdown Export Section */}
      {markdownText && (
        <div className="markdown-export">
          <h3>Risk Factors (Markdown Export)</h3>
          <pre>{markdownText}</pre>
          <button onClick={copyMarkdownToClipboard}>Copy Markdown to Clipboard</button>
        </div>
      )}
    </div>
  );
};

export default App;
