import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, AlertTriangle, X } from 'lucide-react';

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

  return (
    <Link
      to={`/food/${food.id}`}
      className={`block p-4 rounded-xl border ${config.border} ${config.bg} hover:shadow-md transition-shadow`}
      data-testid={`food-card-${food.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-800 truncate">{food.name}</h3>
          <p className="text-xs text-stone-500 mt-0.5">{food.category}</p>
          <p className="text-sm text-stone-600 mt-2 line-clamp-2">{food.description}</p>
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

export function NutrientTag({ nutrient }) {
  return (
    <span className="inline-block bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">
      {nutrient}
    </span>
  );
}
