import React, { useState, useEffect, useMemo } from 'react';
import { foodsApi, categoriesApi } from '../api';
import { FoodGrid } from '../components/food/FoodCard';
import { SearchBar, CategoryFilter, SafetyFilter, Disclaimer } from '../components/common/Filters';
import DailyTip from '../components/common/DailyTip';
import { useUser } from '../context/UserContext';
import { Sparkles, AlertTriangle, Info } from 'lucide-react';

export default function HomePage() {
  const { user, getTrimester, getDietaryRestrictions } = useUser();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSafety, setSelectedSafety] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showPersonalized, setShowPersonalized] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const trimester = getTrimester();
        const healthConditions = getDietaryRestrictions();
        
        // Fetch personalized foods if user has conditions, otherwise fetch all
        if (showPersonalized && (healthConditions.length > 0 || trimester)) {
          const [personalizedRes, categoriesRes] = await Promise.all([
            foodsApi.getPersonalized(healthConditions, trimester),
            categoriesApi.getAll(),
          ]);
          setFoods(personalizedRes.data.foods);
          setRecommendations(personalizedRes.data.recommendations);
          setCategories(categoriesRes.data);
        } else {
          const [foodsRes, categoriesRes] = await Promise.all([
            foodsApi.getAll(),
            categoriesApi.getAll(),
          ]);
          setFoods(foodsRes.data);
          setRecommendations(null);
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to non-personalized
        try {
          const [foodsRes, categoriesRes] = await Promise.all([
            foodsApi.getAll(),
            categoriesApi.getAll(),
          ]);
          setFoods(foodsRes.data);
          setCategories(categoriesRes.data);
        } catch (e) {
          console.error('Fallback fetch failed:', e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showPersonalized, getTrimester, getDietaryRestrictions]);

  const filteredFoods = useMemo(() => {
    let result = foods;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.category.toLowerCase().includes(query) ||
          food.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((food) => food.category === selectedCategory);
    }

    // Safety filter
    if (selectedSafety) {
      result = result.filter((food) => food.safety_level === selectedSafety);
    }

    return result;
  }, [foods, searchQuery, selectedCategory, selectedSafety]);

  const recommendedCount = useMemo(() => 
    filteredFoods.filter(f => f.is_recommended).length, 
    [filteredFoods]
  );

  const cautionCount = useMemo(() => 
    filteredFoods.filter(f => f.should_limit).length, 
    [filteredFoods]
  );

  const hasPersonalization = user && (getDietaryRestrictions().length > 0 || getTrimester());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="home-page">
      <div className="space-y-4 mb-6">
        <h2 className="text-2xl font-bold text-stone-800">
          Pregnancy Nutrition Guide
        </h2>
        <p className="text-stone-600 text-sm">
          Educational reference information about foods during pregnancy
        </p>
        <Disclaimer />
      </div>

      {/* Daily Tip */}
      <DailyTip />

      {/* Personalization Banner */}
      {hasPersonalization && recommendations && (
        <div className="mb-6 space-y-3">
          {/* Trimester Info */}
          {recommendations.trimester_info && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-emerald-800">
                    {recommendations.trimester_info.name}
                  </h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Focus on: {recommendations.trimester_info.priority_nutrients.slice(0, 4).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Health Conditions Info */}
          {recommendations.conditions_info?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-800">
                    Personalized for Your Needs
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {recommendations.conditions_info.map(c => c.description).join('. ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex gap-3">
            {recommendedCount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm">
                <Sparkles size={14} />
                {recommendedCount} recommended
              </div>
            )}
            {cautionCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm">
                <AlertTriangle size={14} />
                {cautionCount} to limit
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search foods..."
        />

        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <SafetyFilter
          selected={selectedSafety}
          onSelect={setSelectedSafety}
        />

        {/* Toggle Personalization */}
        {hasPersonalization && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPersonalized(!showPersonalized)}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                showPersonalized 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {showPersonalized ? 'Personalized View' : 'Show All Foods'}
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-stone-500">
          Showing {filteredFoods.length} of {foods.length} foods
        </p>
      </div>

      <FoodGrid foods={filteredFoods} loading={loading} />
    </div>
  );
}
