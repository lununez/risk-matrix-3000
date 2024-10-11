import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const RiskMatrix = () => {
  const [likelihood, setLikelihood] = useState(1);
  const [impact, setImpact] = useState(1);
  const [riskValue, setRiskValue] = useState(1);
  const [matterName, setMatterName] = useState('');
  const [savedAssessments, setSavedAssessments] = useState([]);
  const exportRef = useRef(null);

  const likelihoodLabels = ['Almost Certain (5)', 'Likely (4)', 'Possible (3)', 'Unlikely (2)', 'Rare (1)'];
  const impactLabels = ['Insignificant (1)', 'Minor (2)', 'Significant (3)', 'Major (4)', 'Severe (5)'];

  const matrix = [
    ['Medium (5)', 'High (10)', 'Very High (15)', 'Extreme (20)', 'Extreme (25)'],
    ['Low (4)', 'Medium (8)', 'High (12)', 'Very High (16)', 'Extreme (20)'],
    ['Low (3)', 'Medium (6)', 'Medium (9)', 'High (12)', 'Very High (15)'],
    ['Very Low (2)', 'Low (4)', 'Medium (6)', 'Medium (8)', 'High (10)'],
    ['Very Low (1)', 'Very Low (2)', 'Low (3)', 'Low (4)', 'Medium (5)'],
  ];

  const riskColors = {
    1: '#C6EFCE', 2: '#C9F2D0', 3: '#CCFFCC', 4: '#E5FFD6', 5: '#FFFFCC',
    6: '#FFFEBF', 7: '#FFFEB2', 8: '#FFED9C', 9: '#FFEA8A', 10: '#FFD966',
    11: '#FFD157', 12: '#FFC848', 13: '#FFBF39', 14: '#FFB62A', 15: '#F4B084',
    16: '#F3A677', 17: '#F29C6A', 18: '#F1925D', 19: '#F08851', 20: '#FF9999',
    21: '#FF8A8A', 22: '#FF7B7B', 23: '#FF6C6C', 24: '#FF5D5D', 25: '#FF4E4E'
  };

  const getRiskColor = (value) => {
    if (typeof value === 'string') {
      const numberMatch = value.match(/\d+/);
      if (numberMatch) {
        return riskColors[parseInt(numberMatch[0])] || '#ffffff';
      }
    }
    return riskColors[value] || '#ffffff';
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
      // First, try to copy a text representation
      const textRepresentation = `Risk Assessment for ${matterName}\nLikelihood: ${likelihoodLabels[5 - likelihood]}\nImpact: ${impactLabels[impact - 1]}\nRisk Value: ${riskValue}\nAssessed Risk: ${getRiskLabel(riskValue)}`;
      
      navigator.clipboard.writeText(textRepresentation)
        .then(() => {
          alert('Risk assessment details copied to clipboard! Image will be downloaded separately.');
          // Proceed with image download
          downloadImage(canvas);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Failed to copy to clipboard. Image will be downloaded.');
          downloadImage(canvas);
        });
    });
  }
};

const downloadImage = (canvas) => {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${matterName || 'risk-assessment'}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

  const getSliderPosition = (value) => {
    const riskToPercentage = {
      1: 0, 2: 10, 3: 21, 4: 21.6, 5: 39.6, 6: 40, 8: 45, 9: 49,
      10: 58, 12: 59, 15: 77, 16: 82, 20: 90, 25: 100
    };

    if (value in riskToPercentage) {
      return riskToPercentage[value];
    }

    const lowerBound = Math.max(...Object.keys(riskToPercentage).map(Number).filter(k => k <= value));
    const upperBound = Math.min(...Object.keys(riskToPercentage).map(Number).filter(k => k >= value));

    const lowerPercentage = riskToPercentage[lowerBound];
    const upperPercentage = riskToPercentage[upperBound];
    const valueRange = upperBound - lowerBound;
    const percentageRange = upperPercentage - lowerPercentage;

    return lowerPercentage + (value - lowerBound) / valueRange * percentageRange;
  };

  const buttonStyle = {
    padding: '5px',
    margin: '2px',
    fontSize: '12px',
    cursor: 'pointer',
  };

  const cellStyle = {
    padding: '5px',
    textAlign: 'center',
    fontSize: '12px',
    border: '1px solid #ddd',
  };

  const spectrumStyle = {
    width: '100%',
    height: '20px',
    background: 'linear-gradient(to right, #C6EFCE, #CCFFCC, #FFFFCC, #FFD966, #F4B084, #FF9999)',
    position: 'relative',
    marginTop: '20px',
  };

  const sliderStyle = {
    width: '10px',
    height: '30px',
    backgroundColor: 'black',
    position: 'absolute',
    top: '-5px',
    left: `${getSliderPosition(riskValue)}%`,
    transform: 'translateX(-50%)',
  };

  const labelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '5px',
    fontSize: '12px',
  };

  const pillStyle = {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '20px',
    color: '#000000',
    fontWeight: 'bold',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Risk Assessment Matrix</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={matterName}
          onChange={(e) => setMatterName(e.target.value)}
          placeholder="Enter Matter Name"
          style={{ width: '100%', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <select onChange={(e) => loadAssessment(e.target.value)} style={{ width: '100%', padding: '5px' }}>
          <option value="">Load Saved Assessment</option>
          {savedAssessments.map(a => (
            <option key={a.matterName} value={a.matterName}>{a.matterName}</option>
          ))}
        </select>
      </div>
      
      <div ref={exportRef} style={{ backgroundColor: 'white', padding: '20px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          Assessed Risk: 
          <span style={{
            ...pillStyle,
            backgroundColor: getRiskColor(riskValue),
            marginLeft: '5px'
          }}>
            {getRiskLabel(riskValue)}, Degree: {riskValue}
          </span>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <div style={spectrumStyle}>
            <div style={sliderStyle}></div>
          </div>
          <div style={labelStyle}>
            <span>Very Low</span>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Very High</span>
            <span>Extreme</span>
          </div>
        </div>
        
        <div style={{ display: 'flex' }}>
          <div style={{ position: 'relative', width: '40px' }}>
            <div style={{ position: 'absolute', top: '70%', left: '-40px', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center', width: '100px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Likelihood</h2>
            </div>
          </div>
          
          <div style={{ flexGrow: 1 }}>
            <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Impact</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: '5px' }}>
              <div></div>
              {impactLabels.map((label, index) => (
                <button 
                  key={index} 
                  onClick={() => setImpact(index + 1)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: impact === index + 1 ? '#007bff' : '#f0f0f0',
                    color: impact === index + 1 ? 'white' : 'black',
                  }}
                >
                  {label}
                </button>
              ))}
              
              {likelihoodLabels.map((label, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <button 
                    onClick={() => setLikelihood(5 - rowIndex)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: likelihood === 5 - rowIndex ? '#007bff' : '#f0f0f0',
                      color: likelihood === 5 - rowIndex ? 'white' : 'black',
                    }}
                  >
                    {label}
                  </button>
                  {matrix[rowIndex].map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      style={{
                        ...cellStyle,
                        backgroundColor: getRiskColor(cell),
                        border: 5 - rowIndex === likelihood && cellIndex + 1 === impact ? '3px solid black' : '1px solid #ddd',
                      }}
                    >
                      {cell}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={saveAssessment} style={{ marginRight: '10px' }}>Save Assessment</button>
        <button onClick={exportAsPNG}>Export as PNG</button>
      </div>
    </div>
  );
};

export default RiskMatrix;
