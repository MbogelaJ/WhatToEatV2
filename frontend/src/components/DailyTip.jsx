import React, { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { DAILY_TIPS } from '../data/dailyTips';

const DailyTip = () => {
  const [tip, setTip] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get tip based on day of year for consistency
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    setTip(DAILY_TIPS[tipIndex]);
  }, []);

  if (dismissed || !tip) return null;

  return (
    <div className="daily-tip-card" data-testid="daily-tip">
      <div className="tip-header">
        <div className="tip-title">
          <Lightbulb size={18} />
          <span>Daily Tip</span>
        </div>
        <button 
          className="tip-dismiss" 
          onClick={() => setDismissed(true)}
          aria-label="Dismiss tip"
        >
          <X size={18} />
        </button>
      </div>
      <p className="tip-content">{tip.tip}</p>
    </div>
  );
};

export default DailyTip;
