import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Sparkles, AlertTriangle, Check, Info } from 'lucide-react';
import { foodsApi } from '../api';
import { SafetyBadge, NutrientTag } from '../components/food/FoodCard';
import { Disclaimer } from '../components/common/Filters';
import { useUser } from '../context/UserContext';

export default function FoodDetailPage() {
  const { id } = useParams();
  const { getTrimester, getDietaryRestrictions } = useUser();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    async function fetchFood() {
      try {
        // Try to get personalized food data first
        const trimester = getTrimester();
        const healthConditions = getDietaryRestrictions();
        
        if (healthConditions.length > 0 || trimester) {
          const response = await foodsApi.getPersonalized(healthConditions, trimester);
          const foundFood = response.data.foods.find(f => f.id === id);
          if (foundFood) {
            setFood(foundFood);
          } else {
            // Fallback to regular endpoint
            const regularResponse = await foodsApi.getById(id);
            setFood(regularResponse.data);
          }
        } else {
          const response = await foodsApi.getById(id);
          setFood(response.data);
        }
      } catch (err) {
        setError('Food not found');
        console.error('Error fetching food:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFood();
  }, [id, getTrimester, getDietaryRestrictions]);

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

  const isRecommended = food.is_recommended;
  const shouldLimit = food.should_limit;

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

        {/* Personalization Banners */}
        {isRecommended && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-emerald-800">Recommended for You</h3>
                {food.recommendation_reasons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {food.recommendation_reasons.map((reason, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        <Check size={12} />
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {shouldLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-800">Consider Limiting</h3>
                {food.caution_reasons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {food.caution_reasons.map((reason, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        <Info size={12} />
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Health Tags */}
        {food.health_tags?.length > 0 && (
          <div>
            <h2 className="font-semibold text-stone-800 mb-3">Health Properties</h2>
            <div className="flex flex-wrap gap-2">
              {food.health_tags.map((tag) => (
                <span 
                  key={tag} 
                  className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
            
            {/* Iron/Sugar/Sodium Levels */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {food.iron_level && food.iron_level !== 'unknown' && (
                <span className={`px-2 py-1 rounded ${
                  food.iron_level === 'high' || food.iron_level === 'very-high' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  Iron: {food.iron_level}
                </span>
              )}
              {food.sugar_level && food.sugar_level !== 'unknown' && (
                <span className={`px-2 py-1 rounded ${
                  food.sugar_level === 'high' || food.sugar_level === 'very-high' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Sugar: {food.sugar_level}
                </span>
              )}
              {food.sodium_level && food.sodium_level !== 'unknown' && (
                <span className={`px-2 py-1 rounded ${
                  food.sodium_level === 'high' || food.sodium_level === 'very-high' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Sodium: {food.sodium_level}
                </span>
              )}
            </div>
          </div>
        )}

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
