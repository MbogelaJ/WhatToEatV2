import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search foods...' }) {
  return (
    <div className="relative">
      <SearchIcon 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        data-testid="search-input"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          data-testid="search-clear-btn"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" data-testid="category-filter">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !selected
            ? 'bg-emerald-600 text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        }`}
        data-testid="category-all-btn"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selected === category
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}-btn`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export function SafetyFilter({ selected, onSelect }) {
  const levels = [
    { value: null, label: 'All' },
    { value: 'safe', label: 'Safe' },
    { value: 'limit', label: 'Limit' },
    { value: 'avoid', label: 'Avoid' },
  ];

  return (
    <div className="flex gap-2" data-testid="safety-filter">
      {levels.map(({ value, label }) => (
        <button
          key={label}
          onClick={() => onSelect(value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selected === value
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          data-testid={`safety-${label.toLowerCase()}-btn`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Disclaimer({ variant = 'info' }) {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`p-3 rounded-lg border text-xs ${variants[variant]}`} data-testid="disclaimer-banner">
      <strong>Educational Information:</strong> This content is for general reference only 
      and does not constitute medical advice. Consult a healthcare professional for 
      personalized guidance.
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
