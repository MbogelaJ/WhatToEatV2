import React from 'react';
import { Check } from 'lucide-react';
import { SAFETY_CONFIG } from '../utils/constants';

export const SafetyBadge = ({ safety, label }) => {
  const config = SAFETY_CONFIG[safety] || SAFETY_CONFIG.SAFE;
  return (
    <span 
      className="safety-badge" 
      style={{ 
        backgroundColor: config.bgColor,
        color: config.color
      }}
      data-testid={`safety-badge-${safety}`}
    >
      <Check size={14} />
      <span>{label || config.label}</span>
    </span>
  );
};

export default SafetyBadge;
