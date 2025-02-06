import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function getRiskLevelLabel(score) {
  if (score <= 4) return "Very Low";
  else if (score <= 8) return "Low";
  else if (score <= 12) return "Medium";
  else if (score <= 16) return "High";
  else if (score <= 20) return "Very High";
  else return "Extreme";
}

function getCellColor(score) {
  if (score <= 4) return "#a8e6a3"; // Very Low – pastel green
  else if (score <= 8) return "#d4f7a3"; // Low – light green/yellow
  else if (score <= 12) return "#f7f7a3"; // Medium – yellow
  else if (score <= 16) return "#f7d4a3"; // High – light orange
  else if (score <= 20) return "#f7b8a3"; // Very High – orange/red
  else return "#f7a8a8"; // Extreme – pastel red
}

/*
  A simple weighted average: it takes the arithmetic mean and then adds
  25% of the gap between the max and the mean.
*/
function computeWeightedAverage(ratings) {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  const mean = sum / ratings.length;
  const max = Math.max(...ratings);
  return mean + 0.25 * (max - mean);
}

function generateMarkdownTable(likelihoodRisks, severityRisks) {
  const header = "| Type | Category | Explanation | Rating |\n| --- | --- | --- | --- |\n";
  const rows = [];
  likelihoodRisks.forEach(risk => {
    rows.push(`| Likelihood | ${risk.category} | ${risk.explanation} | ${risk.rating} |`);
  });
  severityRisks.forEach(risk => {
    rows.push(`| Severity | ${risk.category} | ${risk.explanation} | ${risk.rating} |`);
  });
  return header + rows.join("\n");
}

// --- Components ---

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
        margin: "10px 0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
        width: "100%",
      }}
    >
      <h3>{type}</h3>
      <div style={{ marginBottom: "8px" }}>
        <label>Category: </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ width: "60%" }}
        >
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
          style={{ width: "60%" }}
        />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label>Rating: </label>
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          style={{ width: "60%" }}
        >
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
                <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "center" }}>
                  {risk.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Risk Matrix with wider cells and highlighted cell.
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

  // Increased cell width from 80px to 100px.
  const cellStyle = {
    width: "100px",
    height: "60px",
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
    transition: "opacity 0.3s",
  };

  return (
    <div>
      <h3>Risk Matrix</h3>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: "5px" }}>Likelihood</div>
        <div style={{ display: "flex" }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", marginRight: "5px" }}>
            Impact (Severity)
          </div>
          <div>
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} style={{ display: "flex" }}>
                {row.map((cell, cellIndex) => {
                  const isHighlighted =
                    highlightCoordinates &&
                    highlightCoordinates.likelihood === cell.likelihood &&
                    highlightCoordinates.severity === cell.severity;
                  return (
                    <div
                      key={cellIndex}
                      style={{
                        ...cellStyle,
                        backgroundColor: cell.color,
                        opacity: isHighlighted ? 1 : 0.25,
                      }}
                    >
                      <div>{cell.label}</div>
                      <div>{cell.score}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Risk Spectrum with increased width, vertical line indicator, and label.
const RiskSpectrum = ({ overallRisk }) => {
  const sliderWidth = 700; // 75% wider than 400px.
  // Map overall risk (range: 1-25) to a position on the slider.
  const position = ((overallRisk - 1) / (25 - 1)) * sliderWidth;

  const displayedScore = Math.round(overallRisk) || 0;
  const riskLabel = overallRisk > 0 ? getRiskLevelLabel(displayedScore) : "N/A";

  const sliderContainerStyle = {
    width: sliderWidth,
    margin: "0 auto",
    position: "relative",
    height: "60px",
  };

  const sliderStyle = {
    position: "absolute",
    bottom: "0",
    width: "100%",
    height: "30px",
    background:
      "linear-gradient(to right, #a8e6a3 0%, #d4f7a3 20%, #f7f7a3 50%, #f7d4a3 80%, #f7a8a8 100%)",
    borderRadius: "10px",
  };

  const indicatorStyle = {
    position: "absolute",
    left: position - 1, // centered line (2px wide)
    top: 0,
    bottom: 0,
    width: "2px",
    backgroundColor: "black",
  };

  const labelStyle = {
    position: "absolute",
    left: position - 40,
    top: -25,
    width: "80px",
    textAlign: "center",
    fontWeight: "bold",
  };

  const labelContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    position: "absolute",
    bottom: -25,
    width: "100%",
  };

  return (
    <div>
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

  // Determine the cell to highlight based on rounded average values.
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
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2>Legal Risk Assessment Matrix Tool</h2>
      {/* Matter Name & Save/Load Controls */}
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

      {/* Stacked Input Sections */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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

      {/* Display Saved Risk Factors */}
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>
        <RiskFactorsTable title="Likelihood" risks={likelihoodRisks} />
        <RiskFactorsTable title="Severity" risks={severityRisks} />
      </div>

      {/* Exportable Area: Matrix & Spectrum */}
      <div
        ref={exportRef}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginTop: "20px",
          borderRadius: "8px",
        }}
      >
        <RiskMatrix highlightCoordinates={highlightCoordinates} />
        <RiskSpectrum overallRisk={overallRisk} />
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <strong>Overall Risk Score: {overallRisk.toFixed(2)}</strong>
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={handleExportPNG}
          style={{
            borderRadius: "8px",
            padding: "8px 16px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Export as PNG
        </button>
      </div>

      {/* Markdown Export Section */}
      {markdownText && (
        <div style={{ marginTop: "20px" }}>
          <h3>Risk Factors (Markdown Export)</h3>
          <div
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              borderRadius: "4px",
              overflowX: "auto",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownText}
            </ReactMarkdown>
          </div>
          <button
            onClick={copyMarkdownToClipboard}
            style={{
              borderRadius: "8px",
              padding: "5px 10px",
              boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Copy Markdown to Clipboard
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
