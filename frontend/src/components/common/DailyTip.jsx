import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, X } from 'lucide-react';
import { tipsApi } from '../../api';
import { useUser } from '../../context/UserContext';

export default function DailyTip() {
  const { getTrimester } = useUser();
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed today
    const lastDismissed = localStorage.getItem('daily_tip_dismissed');
    const today = new Date().toDateString();
    if (lastDismissed === today) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    fetchDailyTip();
  }, []);

  const fetchDailyTip = async () => {
    try {
      const trimester = getTrimester();
      const response = await tipsApi.getToday(trimester);
      setTip(response.data.tip);
    } catch (err) {
      console.error('Error fetching daily tip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('daily_tip_dismissed', new Date().toDateString());
    setDismissed(true);
  };

  if (loading || dismissed || !tip) {
    return null;
  }

  return (
    <>
      {/* Compact Card */}
      <div 
        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 mb-6"
        data-testid="daily-tip-card"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="text-amber-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Daily Tip</span>
              <button 
                onClick={handleDismiss}
                className="text-amber-400 hover:text-amber-600 p-1"
                data-testid="dismiss-tip-btn"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-stone-700 font-medium mb-2">{tip.body}</p>
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              data-testid="read-more-btn"
            >
              Read more
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {expanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Lightbulb className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800">{tip.title}</h3>
                    <span className="text-xs text-amber-600">Daily Nutrition Tip</span>
                  </div>
                </div>
                <button 
                  onClick={() => setExpanded(false)}
                  className="text-stone-400 hover:text-stone-600 p-2"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-stone-700 font-medium mb-4">{tip.body}</p>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-stone-600 leading-relaxed">{tip.expanded_content}</p>
              </div>

              {tip.sources && tip.sources.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-stone-500 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {tip.sources.map((source, idx) => (
                      <span key={idx} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-lg">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-stone-400 italic border-t border-stone-100 pt-3">
                This is general educational reference information only and does not constitute medical advice.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
