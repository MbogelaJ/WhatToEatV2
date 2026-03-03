import React, { useState, useEffect, useMemo } from 'react';
import { foodsApi, categoriesApi } from '../api';
import { FoodGrid } from '../components/food/FoodCard';
import { SearchBar, CategoryFilter, SafetyFilter, Disclaimer } from '../components/common/Filters';

export default function HomePage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSafety, setSelectedSafety] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [foodsRes, categoriesRes] = await Promise.all([
          foodsApi.getAll(),
          categoriesApi.getAll(),
        ]);
        setFoods(foodsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
