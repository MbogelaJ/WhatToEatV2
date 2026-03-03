import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { foodsApi } from '../api';
import { SafetyBadge, NutrientTag } from '../components/food/FoodCard';
import { Disclaimer } from '../components/common/Filters';

export default function FoodDetailPage() {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    async function fetchFood() {
      try {
        const response = await foodsApi.getById(id);
        setFood(response.data);
      } catch (err) {
        setError('Food not found');
        console.error('Error fetching food:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFood();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-1/4" />
          <div className="h-12 bg-stone-200 rounded w-3/4" />
          <div className="h-32 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 mb-6">
          <ArrowLeft size={20} />
          Back to Home
        </Link>
        <div className="text-center py-12">
          <p className="text-stone-500">{error || 'Food not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="food-detail-page">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-emerald-600 mb-6 hover:text-emerald-700"
        data-testid="back-btn"
      >
        <ArrowLeft size={20} />
        Back to Home
      </Link>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold text-stone-800">{food.name}</h1>
            <SafetyBadge level={food.safety_level} size="md" />
          </div>
          <p className="text-stone-500">{food.category}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4 border border-stone-200">
          <p className="text-stone-700">{food.description}</p>
        </div>

        {/* Nutrition Note */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <h2 className="font-semibold text-stone-800 mb-2">Nutrition Information</h2>
          <p className="text-stone-600 text-sm">{food.nutrition_note}</p>
          {food.context && (
            <p className="text-stone-500 text-sm mt-2 italic">{food.context}</p>
          )}
        </div>

        {/* Nutrients */}
        {food.nutrients && food.nutrients.length > 0 && (
          <div>
            <h2 className="font-semibold text-stone-800 mb-3">Key Nutrients</h2>
            <div className="flex flex-wrap gap-2">
              {food.nutrients.map((nutrient) => (
                <NutrientTag key={nutrient} nutrient={nutrient} />
              ))}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {food.alternatives && food.alternatives.length > 0 && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h2 className="font-semibold text-emerald-800 mb-2">Alternatives to Consider</h2>
            <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
              {food.alternatives.map((alt) => (
                <li key={alt}>{alt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
            data-testid="sources-toggle-btn"
          >
            <span className="font-medium text-stone-700">View References</span>
            {showSources ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showSources && (
            <div className="p-4 bg-white border-t border-stone-200">
              <ul className="space-y-2">
                {food.sources?.map((source, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                    <ExternalLink size={14} className="text-stone-400" />
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <Disclaimer variant="warning" />
      </div>
    </div>
  );
}
