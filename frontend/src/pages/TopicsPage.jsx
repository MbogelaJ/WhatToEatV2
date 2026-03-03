import React, { useState } from 'react';
import { Search, AlertCircle, BookOpen } from 'lucide-react';
import { topicsApi } from '../api';
import { Disclaimer } from '../components/common/Filters';

export default function TopicsPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await topicsApi.search(query);
      setResult(response.data);
    } catch (error) {
      console.error('Error searching topics:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const suggestedTopics = [
    'Folate',
    'Iron',
    'Calcium',
    'Omega-3',
    'Protein',
    'Vitamin D',
    'Morning sickness',
    'Hydration',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="topics-page">
      <div className="space-y-4 mb-6">
        <h2 className="text-2xl font-bold text-stone-800">Nutrition Topics</h2>
        <p className="text-stone-600 text-sm">
          Search for educational information about pregnancy nutrition topics
        </p>
        <Disclaimer />
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nutrition topics..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              data-testid="topics-search-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="topics-search-btn"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Suggested Topics */}
      {!searched && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-stone-500 mb-3">Suggested Topics</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setQuery(topic);
                }}
                className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full text-sm hover:bg-stone-200 transition-colors"
                data-testid={`suggested-topic-${topic.toLowerCase()}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && result && (
        <div className="space-y-4" data-testid="topics-result">
          {/* Symptom Detection Warning */}
          {result.is_symptom_detected && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Medical Attention Needed</h3>
                  <p className="text-red-700 text-sm">{result.information}</p>
                  {result.disclaimer && (
                    <p className="text-red-600 text-xs mt-2">{result.disclaimer}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Personal Question Notice */}
          {result.is_personal_question && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Personal Guidance Needed</h3>
                  <p className="text-amber-700 text-sm">{result.information}</p>
                </div>
              </div>
            </div>
          )}

          {/* Normal Result */}
          {!result.is_symptom_detected && !result.is_personal_question && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  {result.topic_matched && (
                    <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full mb-2">
                      Topic: {result.topic_matched}
                    </span>
                  )}
                  <p className="text-stone-700 whitespace-pre-line">{result.information}</p>
                  
                  {/* Sources */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-xs text-stone-500">
                        Sources: {result.sources.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && !result.is_symptom_detected && (
            <p className="text-xs text-stone-500 italic">{result.disclaimer}</p>
          )}
        </div>
      )}

      {/* No Results */}
      {searched && !result && !loading && (
        <div className="text-center py-12 text-stone-500">
          No information found for "{query}"
        </div>
      )}
    </div>
  );
}
