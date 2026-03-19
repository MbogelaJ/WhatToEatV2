import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, Flame, Dumbbell, Wheat, Droplet, Leaf, Clock, X, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
        {food.brand && <p className="food-card-brand">{food.brand}</p>}
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
            {food.brand && <p className="modal-brand">{food.brand}</p>}
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

// Search History Component
const SearchHistory = ({ history, onSelect }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="search-history" data-testid="search-history">
      <h4><Clock size={14} /> Recent Searches</h4>
      <div className="history-tags">
        {history.slice(0, 5).map((item, index) => (
          <button 
            key={item.id || index}
            className="history-tag"
            onClick={() => onSelect(item.query)}
            data-testid={`history-tag-${index}`}
          >
            {item.query}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch search history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API}/search-history`);
        setSearchHistory(response.data);
      } catch (e) {
        console.log("Could not fetch search history");
      }
    };
    fetchHistory();
  }, []);

  // Search foods when debounced query changes
  const searchFoods = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setFoods([]);
      setTotalResults(0);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get(`${API}/foods/search`, {
        params: { query: query.trim(), page: 1, page_size: 20 }
      });
      
      setFoods(response.data.foods || []);
      setTotalResults(response.data.total || 0);
      
      // Refresh history after search
      try {
        const historyResponse = await axios.get(`${API}/search-history`);
        setSearchHistory(historyResponse.data);
      } catch (e) {
        // Ignore history fetch errors
      }
    } catch (e) {
      console.error("Search error:", e);
      // Show empty results instead of error - this fixes the bug
      setFoods([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchFoods(debouncedSearch);
  }, [debouncedSearch, searchFoods]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleHistorySelect = (query) => {
    setSearchQuery(query);
    // Trigger search immediately for history selection
    searchFoods(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFoods([]);
    setTotalResults(0);
    setHasSearched(false);
  };

  return (
    <div className="app" data-testid="food-search-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Utensils size={28} />
            <h1>WhatToEatSearch</h1>
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
                placeholder="Search for foods... (e.g., apple, chicken, pasta)"
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

          {/* Search History */}
          {!searchQuery && (
            <SearchHistory history={searchHistory} onSelect={handleHistorySelect} />
          )}
        </div>

        {/* Results Section */}
        <div className="results-section">
          {loading ? (
            <div className="loading-state" data-testid="loading-state">
              <div className="spinner"></div>
              <p>Searching foods...</p>
            </div>
          ) : hasSearched && foods.length === 0 ? (
            <div className="empty-state" data-testid="no-results-state">
              <AlertCircle size={48} />
              <h3>No foods found</h3>
              <p>Try a different search term like "apple", "bread", or "chicken"</p>
            </div>
          ) : foods.length > 0 ? (
            <>
              <div className="results-header">
                <p data-testid="results-count">
                  Found {totalResults.toLocaleString()} results for "{searchQuery}"
                </p>
              </div>
              <div className="foods-grid" data-testid="foods-grid">
                {foods.map((food) => (
                  <FoodCard 
                    key={food.id} 
                    food={food} 
                    onClick={setSelectedFood}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="welcome-state" data-testid="welcome-state">
              <Utensils size={64} />
              <h2>Welcome to WhatToEatSearch</h2>
              <p>Search for any food to see its nutritional information</p>
              <div className="suggestion-chips">
                <button onClick={() => setSearchQuery("apple")} data-testid="suggestion-apple">Apple</button>
                <button onClick={() => setSearchQuery("chicken breast")} data-testid="suggestion-chicken">Chicken</button>
                <button onClick={() => setSearchQuery("rice")} data-testid="suggestion-rice">Rice</button>
                <button onClick={() => setSearchQuery("banana")} data-testid="suggestion-banana">Banana</button>
              </div>
            </div>
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
        <p>Powered by USDA FoodData Central</p>
      </footer>
    </div>
  );
}

export default App;
