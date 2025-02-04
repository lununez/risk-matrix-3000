import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const RiskMatrix = () => {
  const [riskFactors, setRiskFactors] = useState([]);
  const [likelihood, setLikelihood] = useState(1);
  const [impact, setImpact] = useState(1);
  const [riskValue, setRiskValue] = useState(1);
  const [matterName, setMatterName] = useState('');
  const exportRef = useRef(null);

  const likelihoodLabels = ['Rare (1)', 'Unlikely (2)', 'Possible (3)', 'Likely (4)', 'Almost Certain (5)'];
  const impactLabels = ['Insignificant (1)', 'Minor (2)', 'Significant (3)', 'Major (4)', 'Severe (5)'];

  const matrix = [
    ['Medium (5)', 'High (10)', 'Very High (15)', 'Extreme (20)', 'Extreme (25)'],
    ['Low (4)', 'Medium (8)', 'High (12)', 'Very High (16)', 'Extreme (20)'],
    ['Low (3)', 'Medium (6)', 'Medium (9)', 'High (12)', 'Very High (15)'],
    ['Very Low (2)', 'Low (4)', 'Medium (6)', 'Medium (8)', 'High (10)'],
    ['Very Low (1)', 'Very Low (2)', 'Low (3)', 'Low (4)', 'Medium (5)'],
  ];

  const addRiskFactor = () => {
    setRiskFactors([...riskFactors, { category: '', explanation: '', likelihood: 1, impact: 1 }]);
  };

  const updateRiskFactor = (index, field, value) => {
    const updatedFactors = [...riskFactors];
    updatedFactors[index][field] = value;
    setRiskFactors(updatedFactors);
  };

  const calculateWeightedAverage = (values) => {
    if (values.length === 0) return 1;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    if (range >= 3) {
      return Math.round((max + min * 2) / 3);
    }
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  useEffect(() => {
    const likelihoodValues = riskFactors.map(factor => parseInt(factor.likelihood));
    const impactValues = riskFactors.map(factor => parseInt(factor.impact));

    setLikelihood(calculateWeightedAverage(likelihoodValues));
    setImpact(calculateWeightedAverage(impactValues));
  }, [riskFactors]);

  useEffect(() => {
    setRiskValue(likelihood * impact);
  }, [likelihood, impact]);

  const exportAsPNG = () => {
    if (exportRef.current) {
      html2canvas(exportRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `${matterName || 'risk-assessment'}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const getSliderPosition = (value) => (value - 1) * 20;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Risk Assessment Matrix</h1>

      <input
        type="text"
        value={matterName}
        onChange={(e) => setMatterName(e.target.value)}
        placeholder="Enter Matter Name"
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />

      <h2>Risk Factors</h2>
      <button onClick={addRiskFactor}>Add Risk Factor</button>
      {riskFactors.map((factor, index) => (
        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select
            value={factor.category}
            onChange={(e) => updateRiskFactor(index, 'category', e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select Category</option>
            <option value="Legal Requirements">Legal Requirements</option>
            <option value="Prior Commitment">Prior Commitment</option>
            <option value="Strength of Argument">Strength of Argument</option>
          </select>

          <input
            type="text"
            value={factor.explanation}
            onChange={(e) => updateRiskFactor(index, 'explanation', e.target.value)}
            placeholder="Explanation"
            style={{ flex: 2 }}
          />

          <select
            value={factor.likelihood}
            onChange={(e) => updateRiskFactor(index, 'likelihood', e.target.value)}
            style={{ flex: 0.5 }}
          >
            {likelihoodLabels.map((label, idx) => (
              <option key={idx} value={idx + 1}>{label}</option>
            ))}
          </select>

          <select
            value={factor.impact}
            onChange={(e) => updateRiskFactor(index, 'impact', e.target.value)}
            style={{ flex: 0.5 }}
          >
            {impactLabels.map((label, idx) => (
              <option key={idx} value={idx + 1}>{label}</option>
            ))}
          </select>
        </div>
      ))}

      <div ref={exportRef} style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>Assessed Risk: {riskValue}</h2>
        <div>Likelihood: {likelihood} | Impact: {impact}</div>

        <div style={{ margin: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Very Low</span>
            <span>Extreme</span>
          </div>
          <div style={{ background: 'linear-gradient(to right, green, yellow, red)', height: '20px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: `${getSliderPosition(riskValue)}%`,
                top: '-5px',
                width: '10px',
                height: '30px',
                backgroundColor: 'black'
              }}
            ></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
          {matrix.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{ padding: '20px', backgroundColor: '#eee', textAlign: 'center', border: '1px solid #ccc' }}
              >
                {cell}
              </div>
            ))
          ))}
        </div>
      </div>

      <button onClick={exportAsPNG} style={{ marginTop: '20px' }}>Export as PNG</button>
    </div>
  );
};

export default RiskMatrix;
