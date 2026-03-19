import React from 'react';

const SafetyFilter = ({ selectedSafety, onSelect }) => {
  const safetyOptions = [
    { value: '', label: 'All', color: '#6b7280' },
    { value: 'SAFE', label: 'Safe', color: '#10b981' },
    { value: 'LIMIT', label: 'Limit', color: '#f59e0b' },
    { value: 'AVOID', label: 'Avoid', color: '#ef4444' }
  ];

  return (
    <div className="safety-filter-section">
      <div className="safety-filter-pills">
        {safetyOptions.map(option => (
          <button
            key={option.value}
            className={`safety-pill ${selectedSafety === option.value ? 'active' : ''}`}
            onClick={() => onSelect(option.value)}
            style={{
              '--pill-color': option.color,
              borderColor: selectedSafety === option.value ? option.color : 'transparent',
              color: selectedSafety === option.value ? option.color : '#6b7280',
              backgroundColor: selectedSafety === option.value ? `${option.color}15` : 'transparent'
            }}
            data-testid={`safety-filter-${option.label}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SafetyFilter;
