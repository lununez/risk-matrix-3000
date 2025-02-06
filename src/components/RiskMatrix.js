// RiskMatrix.js
import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import Select from "react-select";
import "./RiskMatrix.css"; // Ensure your CSS is updated accordingly

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
    const categoryText = Array.isArray(risk.categories) ? risk.categories.join(", ") : risk.category;
    rows.push(`| Likelihood | ${categoryText} | ${risk.explanation} | ${risk.ratingLabel} (${risk.rating}) |`);
  });
  severityRisks.forEach((risk) => {
    const categoryText = Array.isArray(risk.categories) ? risk.categories.join(", ") : risk.category;
    rows.push(`| Severity | ${categoryText} | ${risk.explanation} | ${risk.ratingLabel} (${risk.rating}) |`);
  });
  return header + rows.join("\n");
}

// Utility to return the pill style for risk rating (used in table rendering)
function getRiskRatingStyle(value) {
  let backgroundColor = "#fff",
    textColor = "#333",
    borderColor = "#ccc";
  switch (value) {
    case 1:
      backgroundColor = "#4CAF50";
      textColor = "#FFFFFF";
      borderColor = "#4CAF50";
      break;
    case 2:
      backgroundColor = "#8BC34A";
      textColor = "#FFFFFF";
      borderColor = "#8BC34A";
      break;
    case 3:
      backgroundColor = "#FFEB3B";
      textColor = "#000000";
      borderColor = "#FFEB3B";
      break;
    case 4:
      backgroundColor = "#FF9800";
      textColor = "#000000";
      borderColor = "#FF9800";
      break;
    case 5:
      backgroundColor = "#F44336";
      textColor = "#FFFFFF";
      borderColor = "#F44336";
      break;
    default:
      break;
  }
  return {
    backgroundColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "16px",
    padding: "2px 8px",
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-block",
  };
}

// --- Components ---

// Updated RiskInputSection using react-select for polished multi‑select and single‑select fields.
const RiskInputSection = ({ type, categories, ratingOptions, onAddRisk }) => {
  // Map categories to include color for styling.
  const categoryOptions = categories.map((cat) => {
    let color;
    if (cat === "Legal Requirements") color = "#E91E63";
    else if (cat === "Prior Commitment") color = "#9C27B0";
    else if (cat === "3rd Party Rights") color = "#3F51B5";
    else if (cat === "Defensibility") color = "#00BCD4";
    else if (cat === "Regulatory Interest") color = "#8BC34A";
    else if (cat === "Regulatory Engagement") color = "#CDDC39";
    else if (cat === "Enforcement History") color = "#FFC107";
    else if (cat === "Discoverability") color = "#FF5722";
    else if (cat === "Market Practices") color = "#795548";
    else color = "#ccc";
    return { value: cat, label: cat, color };
  });

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

  const ratingSelectOptions = effectiveRatingOptions.map((opt) => ({
    value: opt.value,
    label: `${opt.label} (${opt.value})`,
  }));

  // Custom react-select styles for multi-select.
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
      "&:hover": { border: "1px solid #aaa" },
      fontSize: "16px",
    }),
    multiValue: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color || "#e0e0e0",
      borderRadius: "2px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#fff",
      fontSize: "14px",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#fff",
      ":hover": { backgroundColor: "#ccc", color: "#222" },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      color: state.data.color ? "#fff" : "#333",
      backgroundColor: state.isSelected
        ? state.data.color || "#4CAF50"
        : state.isFocused
        ? "#f0f0f0"
        : "#fff",
      ":hover": {
        backgroundColor: state.isSelected
          ? state.data.color || "#4CAF50"
          : "#ddd",
      },
    }),
  };

  // Custom react-select styles for single-select.
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
      "&:hover": { border: "1px solid #aaa" },
      fontSize: "16px",
      padding: "2px",
    }),
    singleValue: (provided, state) => {
      // Customize the pill appearance based on the rating value.
      let backgroundColor = "#fff",
        textColor = "#333",
        borderColor = "#ccc";
      switch (state.data.value) {
        case 1:
          backgroundColor = "#4CAF50";
          textColor = "#fff";
          borderColor = "#4CAF50";
          break;
        case 2:
          backgroundColor = "#8BC34A";
          textColor = "#fff";
          borderColor = "#8BC34A";
          break;
        case 3:
          backgroundColor = "#FFEB3B";
          textColor = "#000";
          borderColor = "#FFEB3B";
          break;
        case 4:
          backgroundColor = "#FF9800";
          textColor = "#000";
          borderColor = "#FF9800";
          break;
        case 5:
          backgroundColor = "#F44336";
          textColor = "#fff";
          borderColor = "#F44336";
          break;
        default:
          break;
      }
      return {
        ...provided,
        fontSize: "16px",
        fontWeight: 700,
        color: textColor,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "16px",
        padding: "2px 8px",
        display: "inline-block",
      };
    },
    option: (provided, state) => {
      let backgroundColor = "#fff";
      let textColor = "#333";
      if (state.isSelected) {
        switch (state.data.value) {
          case 1:
            backgroundColor = "#4CAF50";
            textColor = "#fff";
            break;
          case 2:
            backgroundColor = "#8BC34A";
            textColor = "#fff";
            break;
          case 3:
            backgroundColor = "#FFEB3B";
            textColor = "#000";
            break;
          case 4:
            backgroundColor = "#FF9800";
            textColor = "#000";
            break;
          case 5:
            backgroundColor = "#F44336";
            textColor = "#fff";
            break;
          default:
            backgroundColor = "#fff";
            textColor = "#333";
        }
      } else if (state.isFocused) {
        backgroundColor = "#f0f0f0";
      }
      return {
        ...provided,
        fontSize: "14px",
        color: textColor,
        backgroundColor,
        transition: "background-color 0.2s ease",
        ":hover": {
          backgroundColor: state.isSelected ? backgroundColor : "#ddd",
        },
      };
    },
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
      ratingLabel: selectedRating.label.split(" ")[0],
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
              <th className="category-cell">Category</th>
              <th className="explanation-cell">Explanation</th>
              <th className="risk-rating-cell">Risk Rating</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, idx) => (
              <tr key={idx}>
                <td className="category-cell">
                  {Array.isArray(risk.categories)
                    ? risk.categories.map((cat, index) => (
                        <span key={index} className="category-tag">
                          {cat}
                        </span>
                      ))
                    : risk.category}
                </td>
                <td className="explanation-cell">{risk.explanation}</td>
                <td className="risk-rating-cell">
                  <span style={getRiskRatingStyle(risk.rating)}>
                    {risk.ratingLabel} ({risk.rating})
                  </span>
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

const RiskSpectrum = ({ overallRisk }) => {
  const sliderWidth = 520; // Match matrix grid width
  const position = ((overallRisk - 1) / (25 - 1)) * sliderWidth;
  const displayedScore = Math.round(overallRisk) || 0;
  const riskLabel = overallRisk > 0 ? getRiskLevelLabel(displayedScore) : "N/A";

  // Increase container height and allow overflow
  const sliderContainerStyle = {
    width: sliderWidth,
    margin: "0 auto",
    position: "relative",
    height: "80px", // Increased height to ensure bottom labels show
    overflow: "visible", // Prevent clipping of bottom labels
  };

  // Floating label (current risk) positioned at the top
  const floatingLabelStyle = {
    position: "absolute",
    left: position - 40, // Centers the label over the indicator
    top: "0px",
    width: "80px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
  };

  // The slider line, now positioned a bit lower
  const sliderStyle = {
    position: "absolute",
    top: "30px", // Position the slider line so there's room above and below
    width: "100%",
    height: "20px",
    background:
      "linear-gradient(to right, #a8e6a3 0%, #d4f7a3 20%, #f7f7a3 50%, #f7d4a3 80%, #f7a8a8 100%)",
    borderRadius: "10px",
  };

  // Indicator line with reduced height so it doesn't bump into labels
  const indicatorStyle = {
    position: "absolute",
    left: position - 1,
    top: "32px", // Slightly offset within the slider line
    width: "2px",
    height: "12px", // Reduced height
    backgroundColor: "black",
  };

  // Container for the bottom labels
  const labelContainerStyle = {
    position: "absolute",
    bottom: "0px",
    left: "0",
    right: "0",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    overflow: "visible",
  };

  return (
    <div className="risk-spectrum">
      <h3>Risk Spectrum</h3>
      <div style={sliderContainerStyle}>
        <div style={floatingLabelStyle}>
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
