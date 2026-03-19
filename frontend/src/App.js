import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, X, AlertCircle, Filter, ShieldCheck, ShieldAlert, ShieldX, Heart, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Safety badge colors and icons
const SAFETY_CONFIG = {
  SAFE: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', label: 'Safe', Icon: ShieldCheck },
  LIMIT: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Limit', Icon: ShieldAlert },
  AVOID: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Avoid', Icon: ShieldX },
};

// Safety Badge Component
const SafetyBadge = ({ safety }) => {
  const config = SAFETY_CONFIG[safety] || SAFETY_CONFIG.SAFE;
  const { Icon } = config;
  
  return (
    <span 
      className="safety-badge"
      style={{ 
        backgroundColor: config.bgColor, 
        color: config.color,
        borderColor: config.color 
      }}
      data-testid={`safety-badge-${safety?.toLowerCase()}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// Food Card Component
const FoodCard = ({ food, onClick }) => {
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className="food-card"
      onClick={() => onClick(food)}
    >
      <div className="food-card-image">
        <div className="food-card-placeholder">
          <Utensils size={28} />
        </div>
      </div>
      <div className="food-card-content">
        <h3 className="food-card-name">{food.name}</h3>
        <div className="food-card-meta">
          {food.category && <span className="food-card-category">{food.category}</span>}
          {food.safety && <SafetyBadge safety={food.safety} />}
        </div>
      </div>
    </div>
  );
};

// Food Detail Modal
const FoodDetailModal = ({ food, onClose }) => {
  const [showPrecautions, setShowPrecautions] = useState(false);
  
  if (!food) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="food-detail-modal">
      <div className="modal-content modal-simple" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="modal-close-btn">
          <X size={24} />
        </button>
        
        <div className="modal-header-simple">
          <div className="modal-icon">
            <Utensils size={32} />
          </div>
          <h2>{food.name}</h2>
          <div className="modal-meta">
            {food.category && <span className="modal-category">{food.category}</span>}
            {food.safety && <SafetyBadge safety={food.safety} />}
          </div>
        </div>

        {/* Benefits One-Liner */}
        {food.benefits && (
          <div className="benefits-section" data-testid="benefits-section">
            <div className="benefits-content">
              <Heart size={18} className="benefits-icon" />
              <p>{food.benefits}</p>
            </div>
          </div>
        )}

        {/* Allergy Warning */}
        {food.allergy_warning && (
          <div className="allergy-warning" data-testid="allergy-warning">
            <AlertTriangle size={16} />
            <span>{food.allergy_warning}</span>
          </div>
        )}

        {/* Precautions Section - Collapsible */}
        {food.precautions && food.precautions.length > 0 && (
          <div className="precautions-section" data-testid="precautions-section">
            <button 
              className="precautions-toggle"
              onClick={() => setShowPrecautions(!showPrecautions)}
              data-testid="precautions-toggle"
            >
              <div className="precautions-header">
                <AlertCircle size={16} />
                <span>Things to Watch Out For</span>
              </div>
              {showPrecautions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showPrecautions && (
              <ul className="precautions-list" data-testid="precautions-list">
                {food.precautions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Doctor Disclaimer */}
        <div className="disclaimer-section">
          <p>Always check with your doctor if you have allergies or concerns.</p>
        </div>
      </div>
    </div>
  );
};

// Category Filter Component
const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="filter-section" data-testid="category-filter">
      <div className="filter-header">
        <Filter size={14} />
        <span>Categories</span>
      </div>
      <div className="filter-tags">
        <button
          className={`filter-tag ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
          data-testid="filter-category-all"
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-tag ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelect(category)}
            data-testid={`filter-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

// Safety Filter Component
const SafetyFilter = ({ selectedSafety, onSelect }) => {
  const safetyLevels = ['SAFE', 'LIMIT', 'AVOID'];
  
  return (
    <div className="filter-section" data-testid="safety-filter">
      <div className="filter-header">
        <ShieldCheck size={14} />
        <span>Safety Level</span>
      </div>
      <div className="filter-tags">
        <button
          className={`filter-tag ${selectedSafety === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
          data-testid="filter-safety-all"
        >
          All
        </button>
        {safetyLevels.map((level) => {
          const config = SAFETY_CONFIG[level];
          return (
            <button
              key={level}
              className={`filter-tag safety-tag ${selectedSafety === level ? 'active' : ''}`}
              onClick={() => onSelect(level)}
              data-testid={`filter-safety-${level.toLowerCase()}`}
              style={selectedSafety === level ? { 
                backgroundColor: config.bgColor, 
                borderColor: config.color,
                color: config.color 
              } : {}}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Search and filter state - INSTANT UPDATES
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSafety, setSelectedSafety] = useState('');
  
  // Data state
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedFood, setSelectedFood] = useState(null);

  // Load all foods on mount - ONE TIME LOAD
  useEffect(() => {
    const loadFoods = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/foods/all?page_size=300`);
        const loadedFoods = response.data.foods || [];
        setFoods(loadedFoods);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(
          loadedFoods.map(food => food.category).filter(Boolean)
        )].sort();
        setCategories(uniqueCategories);
        
      } catch (e) {
        console.error("Failed to load foods:", e);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
  }, []);

  // CLIENT-SIDE FILTERING - INSTANT, NO DEBOUNCE, NO API CALL
  // Filters: searchQuery + selectedCategory + selectedSafety
  const filteredFoods = (foods || []).filter((food) => {
    // 1. Search filter - matches name or category
    const name = (food.name || '').toLowerCase();
    const category = (food.category || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase().trim();
    
    const matchesSearch = query === '' || 
      name.includes(query) || 
      category.includes(query);
    
    // 2. Category filter
    const matchesCategory = selectedCategory === '' || 
      food.category === selectedCategory;
    
    // 3. Safety filter
    const matchesSafety = selectedSafety === '' || 
      food.safety === selectedSafety;
    
    // All filters must match
    return matchesSearch && matchesCategory && matchesSafety;
  });

  // Handle search input - INSTANT UPDATE, NO DEBOUNCE
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Handle safety selection
  const handleSafetySelect = (safety) => {
    setSelectedSafety(safety);
  };

  // Handle suggestion click
  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSafety('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedCategory || selectedSafety;

  return (
    <div className="app" data-testid="food-search-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Utensils size={28} />
            <h1>WhatToEat</h1>
          </div>
          <p className="tagline">Find nutritional info for any food</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search foods... (e.g., apple, chicken, pasta)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
                data-testid="food-search-input"
                autoComplete="off"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={handleClearSearch}
                  data-testid="clear-search-btn"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
            <SafetyFilter 
              selectedSafety={selectedSafety}
              onSelect={handleSafetySelect}
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          {loading ? (
            <div className="loading-state" data-testid="loading-state">
              <div className="spinner"></div>
              <p>Loading foods...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="empty-state" data-testid="no-results-state">
              <AlertCircle size={48} />
              <h3>No foods found</h3>
              <p>
                {searchQuery 
                  ? `No results for "${searchQuery}".`
                  : hasActiveFilters 
                    ? 'No foods match the selected filters.'
                    : 'Try searching for "apple", "chicken", or "rice"'}
              </p>
              <div className="suggestion-chips">
                <button onClick={() => handleSuggestionClick("apple")} data-testid="suggestion-apple">Apple</button>
                <button onClick={() => handleSuggestionClick("chicken")} data-testid="suggestion-chicken">Chicken</button>
                <button onClick={() => handleSuggestionClick("rice")} data-testid="suggestion-rice">Rice</button>
                <button onClick={handleClearFilters} data-testid="suggestion-clear">Clear Filters</button>
              </div>
            </div>
          ) : (
            <>
              <div className="results-header">
                <p data-testid="results-count">
                  {hasActiveFilters 
                    ? `Found ${filteredFoods.length} result${filteredFoods.length !== 1 ? 's' : ''}`
                    : `Showing all ${filteredFoods.length} foods`
                  }
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedCategory && ` in ${selectedCategory}`}
                  {selectedSafety && ` • ${SAFETY_CONFIG[selectedSafety]?.label || selectedSafety}`}
                </p>
                {hasActiveFilters && (
                  <button 
                    className="clear-filters-btn"
                    onClick={handleClearFilters}
                    data-testid="clear-filters-btn"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="foods-grid" data-testid="foods-grid">
                {filteredFoods.map((food) => (
                  <FoodCard 
                    key={food.id} 
                    food={food} 
                    onClick={setSelectedFood}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Food Detail Modal */}
      {selectedFood && (
        <FoodDetailModal 
          food={selectedFood} 
          onClose={() => setSelectedFood(null)} 
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>WhatToEat - Nutrition Database</p>
      </footer>
    </div>
  );
}

export default App;
