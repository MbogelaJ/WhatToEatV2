import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="filter-section category-filter">
      <div className="filter-scroll">
        <button 
          className={`filter-chip ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
          data-testid="category-all"
        >
          All Foods
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelect(cat)}
            data-testid={`category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
