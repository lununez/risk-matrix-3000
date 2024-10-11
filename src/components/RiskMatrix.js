import React, { useState, useEffect, useRef } from 'react';
import { Style, List, Shape, Color } from '@makeswift/runtime/controls';
import { ReactRuntime } from '@makeswift/runtime/react';
import html2canvas from 'html2canvas';

function RiskMatrix(props) {
  const {
    className,
    style,
    matrixTitle,
    likelihoodLabel,
    impactLabel,
    saveButtonText,
    exportButtonText,
    matrixColors,
  } = props;

  const [likelihood, setLikelihood] = useState(1);
  const [impact, setImpact] = useState(1);
  const [riskValue, setRiskValue] = useState(1);
  const [matterName, setMatterName] = useState('');
  const [savedAssessments, setSavedAssessments] = useState([]);
  const [exportedImageUrl, setExportedImageUrl] = useState(null);
  const exportRef = useRef(null);

  const likelihoodLabels = ['Almost Certain (5)', 'Likely (4)', 'Foreseeable (3)', 'Unlikely (2)', 'Rare (1)'];
  const impactLabels = ['Insignificant (1)', 'Minor (2)', 'Significant (3)', 'Major (4)', 'Severe (5)'];

  const matrix = [
    ['Medium (5)', 'High (10)', 'Very High (15)', 'Extreme (20)', 'Extreme (25)'],
    ['Low (4)', 'Medium (8)', 'High (12)', 'Very High (16)', 'Extreme (20)'],
    ['Low (3)', 'Medium (6)', 'Medium (9)', 'High (12)', 'Very High (15)'],
    ['Very Low (2)', 'Low (4)', 'Medium (6)', 'Medium (8)', 'High (10)'],
    ['Very Low (1)', 'Very Low (2)', 'Low (3)', 'Low (4)', 'Medium (5)'],
  ];

  const getRiskColor = (value) => {
    if (typeof value === 'string') {
      const numberMatch = value.match(/\d+/);
      if (numberMatch) {
        return matrixColors[parseInt(numberMatch[0]) - 1] || '#ffffff';
      }
    }
    return matrixColors[value - 1] || '#ffffff';
  };

  const getRiskLabel = (value) => {
    if (value >= 1 && value < 3) return 'Very Low';
    if (value >= 3 && value < 5) return 'Low';
    if (value >= 5 && value < 10) return 'Medium';
    if (value >= 10 && value < 15) return 'High';
    if (value >= 15 && value < 20) return 'Very High';
    if (value >= 20 && value <= 25) return 'Extreme';
    return 'Invalid Risk';
  };

  useEffect(() => {
    const calculatedRisk = likelihood * impact;
    setRiskValue(calculatedRisk);
  }, [likelihood, impact]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedAssessments') || '[]');
    setSavedAssessments(saved);
  }, []);

  const saveAssessment = () => {
    if (matterName) {
      const assessment = { matterName, likelihood, impact, riskValue };
      const updated = [...savedAssessments.filter(a => a.matterName !== matterName), assessment];
      setSavedAssessments(updated);
      localStorage.setItem('savedAssessments', JSON.stringify(updated));
    }
  };

  const loadAssessment = (selected) => {
    const assessment = savedAssessments.find(a => a.matterName === selected);
    if (assessment) {
      setMatterName(assessment.matterName);
      setLikelihood(assessment.likelihood);
      setImpact(assessment.impact);
      setRiskValue(assessment.riskValue);
    }
  };

  const exportAsPNG = () => {
    if (exportRef.current) {
      html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: null,
      }).then(canvas => {
        const imageUrl = canvas.toDataURL("image/png");
        setExportedImageUrl(imageUrl);
      });
    }
  };

  return (
    <div className={className} style={style}>
      <h1>{matrixTitle}</h1>
      
      <input
        type="text"
        value={matterName}
        onChange={(e) => setMatterName(e.target.value)}
        placeholder="Enter Matter Name"
      />

      <select onChange={(e) => loadAssessment(e.target.value)}>
        <option value="">Load Saved Assessment</option>
        {savedAssessments.map(a => (
          <option key={a.matterName} value={a.matterName}>{a.matterName}</option>
        ))}
      </select>
      
      <div ref={exportRef}>
        <div>
          Assessed Risk: 
          <span style={{ backgroundColor: getRiskColor(riskValue) }}>
            {getRiskLabel(riskValue)}, Degree: {riskValue}
          </span>
        </div>

        <div>
          <h2>{likelihoodLabel}</h2>
          {likelihoodLabels.map((label, index) => (
            <button 
              key={index} 
              onClick={() => setLikelihood(5 - index)}
              style={{ backgroundColor: likelihood === 5 - index ? '#007bff' : '#f0f0f0' }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div>
          <h2>{impactLabel}</h2>
          {impactLabels.map((label, index) => (
            <button 
              key={index} 
              onClick={() => setImpact(index + 1)}
              style={{ backgroundColor: impact === index + 1 ? '#007bff' : '#f0f0f0' }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div>
          {matrix.map((row, rowIndex) => (
            <div key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  style={{
                    backgroundColor: getRiskColor(cell),
                    border: 5 - rowIndex === likelihood && cellIndex + 1 === impact ? '3px solid black' : '1px solid #ddd',
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveAssessment}>{saveButtonText}</button>
      <button onClick={exportAsPNG}>{exportButtonText}</button>

      {exportedImageUrl && (
        <div>
          <h2>Exported Image</h2>
          <img src={exportedImageUrl} alt="Exported Risk Matrix" />
        </div>
      )}
    </div>
  );
}

RiskMatrix.makeswift = {
  name: 'Risk Matrix',
  image: 'https://example.com/risk-matrix-thumbnail.png',
  props: {
    className: Type.string(),
    style: Style(),
    matrixTitle: Type.string({ default: 'Risk Assessment Matrix' }),
    likelihoodLabel: Type.string({ default: 'Likelihood' }),
    impactLabel: Type.string({ default: 'Impact' }),
    saveButtonText: Type.string({ default: 'Save Assessment' }),
    exportButtonText: Type.string({ default: 'Export as PNG' }),
    matrixColors: List({
      label: 'Matrix Colors',
      type: Color(),
      defaultValue: [
        '#C6EFCE', '#C9F2D0', '#CCFFCC', '#E5FFD6', '#FFFFCC',
        '#FFFEBF', '#FFFEB2', '#FFED9C', '#FFEA8A', '#FFD966',
        '#FFD157', '#FFC848', '#FFBF39', '#FFB62A', '#F4B084',
        '#F3A677', '#F29C6A', '#F1925D', '#F08851', '#FF9999',
        '#FF8A8A', '#FF7B7B', '#FF6C6C', '#FF5D5D', '#FF4E4E'
      ],
    }),
  },
};

export default ReactRuntime.registerComponent(RiskMatrix);