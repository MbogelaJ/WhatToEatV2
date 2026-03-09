import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, AlertTriangle, X, Sparkles, Info } from 'lucide-react';

const safetyConfig = {
  safe: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Check,
    label: 'Generally Safe',
  },
  limit: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: AlertTriangle,
    label: 'Limit Intake',
  },
  avoid: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: X,
    label: 'Best Avoided',
  },
};

export function SafetyBadge({ level, size = 'sm' }) {
  const config = safetyConfig[level] || safetyConfig.safe;
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      <Icon size={size === 'xs' ? 10 : 12} />
      {config.label}
    </span>
  );
}

export function FoodCard({ food }) {
  const config = safetyConfig[food.safety_level] || safetyConfig.safe;
  const isRecommended = food.is_recommended;
  const shouldLimit = food.should_limit;

  // Determine card styling based on personalization
  let cardBg = config.bg;
  let cardBorder = config.border;
  
  if (isRecommended) {
    cardBg = 'bg-gradient-to-r from-emerald-50 to-teal-50';
    cardBorder = 'border-emerald-300';
  } else if (shouldLimit) {
    cardBg = 'bg-gradient-to-r from-amber-50 to-orange-50';
    cardBorder = 'border-amber-300';
  }

  return (
    <Link
      to={`/food/${food.id}`}
      className={`block p-4 rounded-xl border ${cardBorder} ${cardBg} hover:shadow-md transition-shadow relative`}
      data-testid={`food-card-${food.id}`}
    >
      {/* Recommendation Badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
          <Sparkles size={12} />
        </div>
      )}
      
      {/* Caution Badge */}
      {shouldLimit && !isRecommended && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-sm">
          <AlertTriangle size={12} />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-800 truncate">{food.name}</h3>
          <p className="text-xs text-stone-500 mt-0.5">{food.category}</p>
          <p className="text-sm text-stone-600 mt-2 line-clamp-2">{food.description}</p>
          
          {/* Personalization Reasons */}
          {(food.recommendation_reasons?.length > 0 || food.caution_reasons?.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {food.recommendation_reasons?.slice(0, 2).map((reason, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  <Check size={10} />
                  {reason}
                </span>
              ))}
              {food.caution_reasons?.slice(0, 1).map((reason, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <Info size={10} />
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SafetyBadge level={food.safety_level} size="xs" />
          <ChevronRight size={16} className="text-stone-400" />
        </div>
      </div>
    </Link>
  );
}

export function FoodGrid({ foods, loading }) {
  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!foods || foods.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        No foods found
      </div>
    );
  }

  return (
    <div className="grid gap-3" data-testid="food-grid">
      {foods.map((food) => (
        <FoodCard key={food.id} food={food} />
      ))}
    </div>
  );
}

export function NutrientTag({ nutrient, highlighted = false }) {
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded-full ${
      highlighted 
        ? 'bg-emerald-100 text-emerald-700 font-medium' 
        : 'bg-stone-100 text-stone-600'
    }`}>
      {nutrient}
    </span>
  );
}
