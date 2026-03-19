import React from 'react';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { SAFETY_CONFIG } from '../utils/constants';

const FoodCard = ({ food, onClick, dietaryRestrictions = [], isPremiumUser = false }) => {
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const showLock = food.is_premium && !isPremiumUser;
  const safetyLabel = safetyConfig.label;
  
  // Dynamic teaser messages based on safety level for premium foods
  const getTeaserMessage = () => {
    switch (food.safety) {
      case 'AVOID':
        return 'High-risk food — Unlock full safety details';
      case 'LIMIT':
        return 'Unlock portions, safe swaps & timing tips';
      case 'SAFE':
      default:
        return 'Unlock nutrition facts & preparation tips';
    }
  };
  
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className={`food-list-item ${showLock ? 'premium-locked' : ''}`}
      onClick={() => onClick(food)}
    >
      <div className="food-list-left">
        <h3 className={`food-list-name ${showLock ? 'locked' : ''}`}>{food.name}</h3>
        <span className="food-list-category">{food.category}</span>
        {showLock && (
          <span className="food-list-upgrade-text">{getTeaserMessage()}</span>
        )}
      </div>
      <div className="food-list-right">
        <div className="food-list-safety" style={{ color: safetyConfig.color }}>
          <Check size={16} />
          <span>{safetyLabel}</span>
        </div>
        {showLock ? (
          <Lock size={18} className="food-list-lock" />
        ) : (
          <ChevronRight size={18} className="food-list-chevron" />
        )}
      </div>
      {showLock && (
        <div className="premium-corner-badge">
          <Lock size={14} />
        </div>
      )}
    </div>
  );
};

export default FoodCard;
