// RiskMatrix.js
import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import "./RiskMatrix.css"; // Make sure this file is in the same directory

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
    // If risk.categories is an array, join them by commas.
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

// Updated RiskInputSection Component with inline dropdowns, multi-select for category, and textarea for explanation.
const RiskInputSection = ({ type, categories, ratingOptions, onAddRisk }) => {
  // Use multi-select for category; store as array.
  const [selectedCategories, setSelectedCategories] = useState([categories[0]]);
  // Determine effective rating options.
  const effectiveRatingOptions =
    type === "Likelihood" && selectedCategories.includes("Defensibility")
      ? defensibilityRatingOptions
      : type === "Likelihood"
      ? ratingOptions.likelihood
      : ratingOptions.severity;

  const [explanation, setExplanation] = useState("");
  const [selectedRating, setSelectedRating] = useState(effectiveRatingOptions[0].value);

  // Update rating options if selectedCategories changes.
  useEffect(() => {
    setSelectedRating(effectiveRatingOptions[0].value);
  }, [selectedCategories, effectiveRatingOptions]);

  const handleSave = () => {
    if (!explanation.trim()) {
      alert("Please enter an explanation.");
      return;
    }
    const chosenOption = effectiveRatingOptions.find((opt) => opt.value === Number(selectedRating));
    const riskData = {
      // Save as an array of tags.
      categories: selectedCategories,
      explanation,
      rating: Number(selectedRating),
      ratingLabel: chosenOption.label,
    };
    onAddRisk(riskData);
    setExplanation("");
    setSelectedCategories([categories[0]]);
    setSelectedRating(effectiveRatingOptions[0].value);
  };

  return (
    <div className="risk-input-section">
      <h3>{type}</h3>
      <div className="input-group inline-group">
        <div className="input-item">
          <label>Category:</label>
          <select
            className="custom-select multi-select"
            multiple
            value={selectedCategories}
            onChange={(e) =>
              setSelectedCategories(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <small className="help-text">[Enter help text for each category here...]</small>
        </div>
        <div className="input-item">
          <label>Risk Rating:</label>
          <select
            className="custom-select risk-rating-select"
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            {effectiveRatingOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label} ({opt.value})
              </option>
            ))}
          </select>
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
                <td>{Array.isArray(risk.categories) ? risk.categories.join(", ") : risk.category}</td>
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

// Updated RiskMatrix: Centered and with formatted cell content.
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

  // Flatten the grid array so CSS grid can handle the layout.
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
  const sliderWidth = 520; // Adjusted to match matrix grid width
  const position = ((overallRisk - 1) / (25 - 1)) * sliderWidth;
  const displayedScore = Math.round(overallRisk) || 0;
  const riskLabel = overallRisk > 0 ? getRiskLevelLabel(displayedScore) : "N/A";

  const sliderContainerStyle = {
    width: sliderWidth,
    margin: "0 auto",
    position: "relative",
    height: "40px", // reduced height
  };

  const labelStyle = {
    position: "absolute",
    left: position - 40,
    top: -20, // adjusted to avoid overlap with the title
    width: "80px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const sliderStyle = {
    position: "absolute",
    bottom: "0",
    width: "100%",
    height: "20px", // reduced height for slider line
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
