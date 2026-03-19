import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, Flame, Dumbbell, Wheat, Droplet, Leaf, X, AlertCircle, Filter } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Food Card Component
const FoodCard = ({ food, onClick }) => {
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className="food-card"
      onClick={() => onClick(food)}
    >
      <div className="food-card-image">
        {food.image_url ? (
          <img src={food.image_url} alt={food.name} loading="lazy" />
        ) : (
          <div className="food-card-placeholder">
            <Utensils size={32} />
          </div>
        )}
      </div>
      <div className="food-card-content">
        <h3 className="food-card-name">{food.name}</h3>
        {food.category && <p className="food-card-category">{food.category}</p>}
        <div className="food-card-nutrients">
          {food.calories !== null && food.calories !== undefined && (
            <span className="nutrient-badge calories">
              <Flame size={12} /> {Math.round(food.calories)} kcal
            </span>
          )}
          {food.protein !== null && food.protein !== undefined && (
            <span className="nutrient-badge protein">
              <Dumbbell size={12} /> {food.protein.toFixed(1)}g
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Food Detail Modal
const FoodDetailModal = ({ food, onClose }) => {
  if (!food) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="food-detail-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="modal-close-btn">
          <X size={24} />
        </button>
        
        <div className="modal-header">
          {food.image_url ? (
            <img src={food.image_url} alt={food.name} className="modal-image" />
          ) : (
            <div className="modal-image-placeholder">
              <Utensils size={48} />
            </div>
          )}
          <div className="modal-title">
            <h2>{food.name}</h2>
            {food.category && <p className="modal-brand">{food.category}</p>}
            {food.serving_size && (
              <p className="modal-serving">Per {food.serving_size}</p>
            )}
          </div>
        </div>

        <div className="nutrition-grid">
          <div className="nutrition-item calories">
            <Flame size={24} />
            <div className="nutrition-value">{food.calories !== null ? Math.round(food.calories) : '-'}</div>
            <div className="nutrition-label">Calories</div>
          </div>
          <div className="nutrition-item protein">
            <Dumbbell size={24} />
            <div className="nutrition-value">{food.protein !== null ? food.protein.toFixed(1) : '-'}g</div>
            <div className="nutrition-label">Protein</div>
          </div>
          <div className="nutrition-item carbs">
            <Wheat size={24} />
            <div className="nutrition-value">{food.carbs !== null ? food.carbs.toFixed(1) : '-'}g</div>
            <div className="nutrition-label">Carbs</div>
          </div>
          <div className="nutrition-item fat">
            <Droplet size={24} />
            <div className="nutrition-value">{food.fat !== null ? food.fat.toFixed(1) : '-'}g</div>
            <div className="nutrition-label">Fat</div>
          </div>
          {food.fiber !== null && food.fiber !== undefined && (
            <div className="nutrition-item fiber">
              <Leaf size={24} />
              <div className="nutrition-value">{food.fiber.toFixed(1)}g</div>
              <div className="nutrition-label">Fiber</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Category Filter Component
const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="category-filter" data-testid="category-filter">
      <div className="filter-header">
        <Filter size={14} />
        <span>Categories</span>
      </div>
      <div className="filter-tags">
        <button
          className={`filter-tag ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
          data-testid="filter-all"
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-tag ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelect(category)}
            data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Search and filter state - these trigger instant re-renders
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
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
        // Load all foods from API
        const response = await axios.get(`${API}/foods/all`);
        const loadedFoods = response.data.foods || [];
        setFoods(loadedFoods);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(
          loadedFoods
            .map(food => food.category)
            .filter(Boolean)
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
  // This computes on EVERY render when searchQuery or selectedCategory changes
  const filteredFoods = (foods || []).filter((food) => {
    // Search filter - check name and category
    const name = (food.name || '').toLowerCase();
    const category = (food.category || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase().trim();
    
    const matchesSearch = query === '' || 
      name.includes(query) || 
      category.includes(query);
    
    // Category filter
    const matchesCategory = selectedCategory === '' || 
      food.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle search input - INSTANT UPDATE
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

  // Handle suggestion click
  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
  };

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

          {/* Category Filter */}
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
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
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : selectedCategory 
                    ? `No foods in ${selectedCategory} category.`
                    : 'Try searching for "apple", "chicken", or "rice"'}
              </p>
              <div className="suggestion-chips">
                <button onClick={() => handleSuggestionClick("apple")} data-testid="suggestion-apple">Apple</button>
                <button onClick={() => handleSuggestionClick("chicken")} data-testid="suggestion-chicken">Chicken</button>
                <button onClick={() => handleSuggestionClick("rice")} data-testid="suggestion-rice">Rice</button>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); }} data-testid="suggestion-clear">Show All</button>
              </div>
            </div>
          ) : (
            <>
              <div className="results-header">
                <p data-testid="results-count">
                  {searchQuery || selectedCategory 
                    ? `Found ${filteredFoods.length} result${filteredFoods.length !== 1 ? 's' : ''}${searchQuery ? ` for "${searchQuery}"` : ''}${selectedCategory ? ` in ${selectedCategory}` : ''}`
                    : `Showing all ${filteredFoods.length} foods`
                  }
                </p>
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
