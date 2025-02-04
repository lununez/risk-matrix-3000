import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const riskLabels = [
  'Legal Requirements', 'Prior Commitment', 'Strength of our Argument',
  'Financial', 'Consumer Protection', 'Reputational', 'Operational'
];

const likelihoodOptions = [
  { label: 'Rare', value: 1 },
  { label: 'Unlikely', value: 2 },
  { label: 'Possible', value: 3 },
  { label: 'Likely', value: 4 },
  { label: 'Almost Certain', value: 5 }
];

const severityOptions = [
  { label: 'Insignificant', value: 1 },
  { label: 'Minor', value: 2 },
  { label: 'Significant', value: 3 },
  { label: 'Major', value: 4 },
  { label: 'Severe', value: 5 }
];

const RiskMatrixApp = () => {
  const [riskFactors, setRiskFactors] = useState([{ label: '', description: '', likelihood: 1, severity: 1 }]);
  const [overallRisk, setOverallRisk] = useState(1);

  useEffect(() => {
    const totalRisk = riskFactors.reduce((acc, factor) => acc + (factor.likelihood * factor.severity), 0);
    setOverallRisk(totalRisk);
  }, [riskFactors]);

  const handleAddRow = () => {
    setRiskFactors([...riskFactors, { label: '', description: '', likelihood: 1, severity: 1 }]);
  };

  const handleChange = (index, field, value) => {
    const newFactors = [...riskFactors];
    newFactors[index][field] = value;
    setRiskFactors(newFactors);
  };

  const calculateRisk = (likelihood, severity) => likelihood * severity;

  const exportAsImage = () => {
    const element = document.getElementById('risk-output');
    html2canvas(element).then(canvas => {
      const link = document.createElement('a');
      link.download = 'risk-matrix.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const getRiskLabel = (value) => {
    if (value <= 4) return 'Very Low';
    if (value <= 8) return 'Low';
    if (value <= 12) return 'Medium';
    if (value <= 16) return 'High';
    if (value <= 20) return 'Very High';
    return 'Extreme';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Legal Risk Matrix Tool</h1>
      <table border="1" cellPadding="8" style={{ width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>Risk Label</th>
            <th>Description</th>
            <th>Likelihood</th>
            <th>Severity</th>
            <th>Risk Value</th>
          </tr>
        </thead>
        <tbody>
          {riskFactors.map((factor, index) => (
            <tr key={index}>
              <td>
                <select value={factor.label} onChange={(e) => handleChange(index, 'label', e.target.value)}>
                  <option value="">Select...</option>
                  {riskLabels.map(label => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </td>
              <td>
                <textarea
                  value={factor.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  style={{ width: '100%' }}
                />
              </td>
              <td>
                <select value={factor.likelihood} onChange={(e) => handleChange(index, 'likelihood', parseInt(e.target.value))}>
                  {likelihoodOptions.map(opt => (
                    <option key={opt.label} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td>
                <select value={factor.severity} onChange={(e) => handleChange(index, 'severity', parseInt(e.target.value))}>
                  {severityOptions.map(opt => (
                    <option key={opt.label} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td>{calculateRisk(factor.likelihood, factor.severity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddRow}>Add Risk Factor</button>
      <button onClick={exportAsImage} style={{ marginLeft: '10px' }}>Export Risk Matrix as PNG</button>

      <div id="risk-output" style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9' }}>
        <h2>Risk Matrix & Spectrum</h2>
        <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th>Likelihood \ Severity</th>
              {severityOptions.map(opt => (
                <th key={opt.label}>{opt.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likelihoodOptions.map(likeOpt => (
              <tr key={likeOpt.label}>
                <td><strong>{likeOpt.label}</strong></td>
                {severityOptions.map(sevOpt => {
                  const riskValue = calculateRisk(likeOpt.value, sevOpt.value);
                  const bgColor = `hsl(${120 - (riskValue * 4.8)}, 100%, 75%)`;
                  return (
                    <td key={sevOpt.label} style={{ backgroundColor: bgColor, textAlign: 'center' }}>
                      {riskValue} ({getRiskLabel(riskValue)})
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '20px', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(to right, #90ee90, #ffff00, #ffa500, #ff4500, #ff0000)', height: '20px' }}></div>
          <div style={{ position: 'absolute', left: `${(overallRisk / 25) * 100}%`, top: '-10px', transform: 'translateX(-50%)', fontWeight: 'bold' }}>
            ▲
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            Overall Risk: {overallRisk} ({getRiskLabel(overallRisk)})
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrixApp;
