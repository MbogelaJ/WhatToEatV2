import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Search, Info, AlertTriangle, CheckCircle, MessageCircle, BookOpen, ChevronRight, ChevronDown, Shield, Heart, Phone, X, ArrowLeft, ExternalLink, Settings, FileText } from "lucide-react";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DISCLAIMER_TEXT = "This app provides general educational reference information about pregnancy nutrition. It does not provide medical advice, diagnosis, or treatment. Consulting a qualified healthcare professional is suggested for personal health concerns.";

// Disclaimer Modal Component
const DisclaimerModal = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF8]" data-testid="disclaimer-modal">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F5F2] to-[#E8E6E1]"></div>
      <div className="relative max-w-md mx-auto px-8 py-12 text-center animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#7C9A92]/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-[#7C9A92]" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#2D3748] mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
          Educational Use Only
        </h1>
        
        <div className="disclaimer-banner rounded-2xl p-6 mb-8">
          <p className="text-[#2D3748] leading-relaxed text-base" data-testid="disclaimer-text">
            {DISCLAIMER_TEXT}
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onAccept}
            className="w-full py-4 px-8 bg-[#7C9A92] text-white font-semibold rounded-full btn-transition hover:bg-[#6B8A82] shadow-lg hover:shadow-xl"
            data-testid="disclaimer-accept-btn"
          >
            I Understand
          </button>
          <p className="text-sm text-[#64748B]">
            By continuing, you acknowledge this is educational content only
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline Disclaimer Banner
const DisclaimerBanner = () => (
  <div className="disclaimer-banner rounded-xl p-4 mb-6" data-testid="inline-disclaimer">
    <div className="flex items-start gap-3">
      <Info className="w-5 h-5 text-[#7C9A92] flex-shrink-0 mt-0.5" />
      <p className="text-sm text-[#2D3748] leading-relaxed">
        {DISCLAIMER_TEXT}
      </p>
    </div>
  </div>
);

// Safety Badge Component
const SafetyBadge = ({ level }) => {
  const config = {
    safe: { label: "Generally Safe", icon: CheckCircle, className: "badge-safe" },
    limit: { label: "Often Limited", icon: AlertTriangle, className: "badge-limit" },
    avoid: { label: "Generally Avoid", icon: AlertTriangle, className: "badge-avoid" }
  };
  
  const { label, icon: Icon, className } = config[level] || config.safe;
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 ${className}`} data-testid={`safety-badge-${level}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

// Food Card Component
const FoodCard = ({ food, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(124,154,146,0.1)] border border-slate-100 cursor-pointer card-hover"
    data-testid={`food-card-${food.id}`}
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
        {food.name}
      </h3>
      <SafetyBadge level={food.safety_level} />
    </div>
    <p className="text-sm text-[#64748B] mb-3">{food.category}</p>
    <p className="text-sm text-[#2D3748] line-clamp-2">{food.nutrition_note}</p>
    <div className="mt-4 flex items-center text-[#7C9A92] text-sm font-medium">
      Learn more <ChevronRight className="w-4 h-4 ml-1" />
    </div>
  </div>
);

// Reference Block Component
const ReferenceBlock = ({ sources }) => (
  <div className="reference-block rounded-xl p-4 mt-8" data-testid="reference-block">
    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Sources</p>
    <p className="text-sm text-[#64748B]">{sources.join(", ")}</p>
  </div>
);

// Collapsible References Component for Food Detail Page
const CollapsibleReferences = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-8 border-t border-slate-100 pt-6" data-testid="collapsible-references">
      {/* Label */}
      <p className="text-xs text-[#64748B] mb-3" data-testid="references-label">
        Based on public health guidance (educational summary).
      </p>
      
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl btn-transition hover:bg-slate-100"
        data-testid="references-toggle"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#7C9A92]" />
          <span className="text-sm font-medium text-[#2D3748]">View References</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-[#64748B] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-slate-50 rounded-xl animate-fade-in" data-testid="references-content">
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#64748B]">
                <span className="text-[#7C9A92] mt-1">•</span>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Home Page
const HomePage = () => {
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFoods();
    fetchCategories();
  }, []);

  const fetchFoods = async (query = "") => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/foods/search`, { params: { q: query } });
      setFoods(response.data);
    } catch (error) {
      console.error("Error fetching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFoods(searchQuery);
  };

  const filteredFoods = selectedCategory 
    ? foods.filter(f => f.category === selectedCategory)
    : foods;

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="home-page">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#7C9A92]/10 to-[#F7F5F2] py-12 px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#7C9A92]/20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-[#7C9A92]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            NurtureNote
          </h1>
          <p className="text-[#64748B] mb-6">Pregnancy Nutrition Education</p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full py-4 px-6 pr-14 bg-white rounded-full border border-slate-200 shadow-sm input-transition focus:border-[#7C9A92] focus:ring-2 focus:ring-[#7C9A92]/20"
              data-testid="search-input"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#7C9A92] text-white rounded-full flex items-center justify-center btn-transition hover:bg-[#6B8A82]"
              data-testid="search-btn"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <DisclaimerBanner />

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-6 px-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap btn-transition ${
              selectedCategory === "" 
                ? "bg-[#7C9A92] text-white" 
                : "bg-white border border-slate-200 text-[#2D3748]"
            }`}
            data-testid="category-all"
          >
            All Foods
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap btn-transition ${
                selectedCategory === cat 
                  ? "bg-[#7C9A92] text-white" 
                  : "bg-white border border-slate-200 text-[#2D3748]"
              }`}
              data-testid={`category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4" data-testid="search-results">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#7C9A92] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[#64748B] mt-4">Loading...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">No foods found. Try a different search.</p>
            </div>
          ) : (
            filteredFoods.map((food, index) => (
              <div key={food.id} className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`} style={{ opacity: 0 }}>
                <FoodCard food={food} onClick={() => navigate(`/food/${food.id}`)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Food Detail Page
const FoodDetailPage = () => {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFood();
  }, [id]);

  const fetchFood = async () => {
    try {
      const response = await axios.get(`${API}/foods/${id}`);
      setFood(response.data);
    } catch (error) {
      console.error("Error fetching food:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C9A92] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <p className="text-[#64748B]">Food not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="food-detail-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Food Details
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <DisclaimerBanner />

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-scale-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-[#64748B] mb-1">{food.category}</p>
              <h2 className="text-2xl font-bold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }} data-testid="food-name">
                {food.name}
              </h2>
            </div>
            <SafetyBadge level={food.safety_level} />
          </div>

          <p className="text-[#2D3748] mb-6">{food.description}</p>

          {/* General Nutrition Note */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-2">General Nutrition Note</p>
            <p className="text-[#2D3748]" data-testid="food-nutrition-note">{food.nutrition_note}</p>
          </div>

          {/* Context */}
          {food.context && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-2">Educational Context</p>
              <p className="text-[#2D3748]">{food.context}</p>
            </div>
          )}

          {/* Nutrients */}
          {food.nutrients && food.nutrients.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">Nutrients</p>
              <div className="flex flex-wrap gap-2">
                {food.nutrients.map((nutrient) => (
                  <span key={nutrient} className="px-3 py-1.5 bg-[#7C9A92]/10 text-[#7C9A92] rounded-full text-sm font-medium">
                    {nutrient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {food.alternatives && food.alternatives.length > 0 && (
            <div className="bg-[#5D8AA8]/5 rounded-xl p-4 mb-6 border border-[#5D8AA8]/10">
              <p className="text-sm font-semibold text-[#5D8AA8] uppercase tracking-wider mb-2">Alternative Options Noted in Literature</p>
              <ul className="space-y-2">
                {food.alternatives.map((alt) => (
                  <li key={alt} className="flex items-center gap-2 text-[#2D3748]">
                    <CheckCircle className="w-4 h-4 text-[#5D8AA8]" />
                    {alt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible References Section */}
          <CollapsibleReferences sources={food.sources} />
        </div>
      </div>
    </div>
  );
};

// Nutrition Topics Search Page (formerly Q&A)
const NutritionTopicsPage = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmergencyInfo();
  }, []);

  const fetchEmergencyInfo = async () => {
    try {
      const response = await axios.get(`${API}/emergency-info`);
      setEmergencyInfo(response.data);
    } catch (error) {
      console.error("Error fetching emergency info:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/nutrition-topics/search`, { query });
      setResult(response.data);
    } catch (error) {
      console.error("Error searching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="nutrition-topics-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Search Nutrition Topics
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <DisclaimerBanner />

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <label className="block text-sm font-semibold text-[#2D3748] mb-3">
              Search for nutrition topics
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., folate, iron, calcium, fish"
              rows={3}
              className="w-full p-4 border border-slate-200 rounded-xl resize-none input-transition focus:border-[#7C9A92] focus:ring-2 focus:ring-[#7C9A92]/20"
              data-testid="topic-search-input"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full mt-4 py-4 px-8 bg-[#7C9A92] text-white font-semibold rounded-full btn-transition hover:bg-[#6B8A82] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="find-info-btn"
            >
              {loading ? "Searching..." : "Find Information"}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className={`bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 animate-slide-up ${result.is_symptom_detected ? 'border-[#E07A5F]' : ''} ${result.is_personal_question ? 'border-[#D97706]' : ''}`} data-testid="search-result">
            
            {/* Symptom Warning */}
            {result.is_symptom_detected && (
              <div className="bg-[#E07A5F]/10 rounded-xl p-4 mb-4 border border-[#E07A5F]/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#E07A5F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#E07A5F] mb-1">Medical Attention Needed</p>
                    <p className="text-sm text-[#2D3748]" data-testid="symptom-warning">{result.information}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Personal Question Notice */}
            {result.is_personal_question && !result.is_symptom_detected && (
              <div className="bg-[#D97706]/10 rounded-xl p-4 mb-4 border border-[#D97706]/20">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#D97706] mb-1">Individualized Guidance Not Available</p>
                    <p className="text-sm text-[#2D3748]" data-testid="personal-notice">{result.information}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* General Information */}
            {!result.is_symptom_detected && !result.is_personal_question && (
              <>
                {result.topic_matched && (
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-[#7C9A92]/10 text-[#7C9A92] rounded-full text-sm font-medium">
                      Topic: {result.topic_matched}
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-2">General Information</p>
                <p className="text-[#2D3748] mb-4 whitespace-pre-line">{result.information}</p>
              </>
            )}
            
            <div className="disclaimer-banner rounded-xl p-4 mt-4">
              <p className="text-sm text-[#2D3748]">{result.disclaimer}</p>
            </div>
            
            <ReferenceBlock sources={result.sources} />
          </div>
        )}

        {/* When to Seek Care Section */}
        {emergencyInfo && (
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100" data-testid="emergency-info">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <h2 className="text-xl font-bold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
                {emergencyInfo.title}
              </h2>
            </div>
            
            <p className="text-[#64748B] mb-6">{emergencyInfo.intro}</p>
            
            <div className="space-y-4">
              {emergencyInfo.symptoms.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-[#E07A5F]/5 rounded-xl border border-[#E07A5F]/10">
                  <AlertTriangle className="w-5 h-5 text-[#E07A5F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#2D3748]">{item.symptom}</p>
                    <p className="text-sm text-[#64748B]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-[#7C9A92]/10 rounded-xl border border-[#7C9A92]/20">
              <p className="text-sm font-medium text-[#2D3748]">{emergencyInfo.action}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// About Page
const AboutPage = () => {
  const [about, setAbout] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await axios.get(`${API}/about`);
      setAbout(response.data);
    } catch (error) {
      console.error("Error fetching about:", error);
    }
  };

  if (!about) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C9A92] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="about-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            About
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#7C9A92]/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#7C9A92]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2D3748] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
            {about.app_name}
          </h2>
          <p className="text-[#64748B]">{about.purpose}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            What We Do
          </h3>
          <p className="text-[#2D3748]">{about.description}</p>
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Our Data Sources
          </h3>
          <ul className="space-y-2">
            {about.data_sources.map((source, index) => (
              <li key={index} className="flex items-center gap-3 text-[#2D3748]">
                <CheckCircle className="w-5 h-5 text-[#7C9A92]" />
                {source}
              </li>
            ))}
          </ul>
        </div>

        {/* Non-Medical Statement */}
        <div className="bg-[#E07A5F]/5 rounded-3xl p-6 border border-[#E07A5F]/10 mb-6 animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-[#E07A5F] flex-shrink-0" />
            <h3 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
              Important Notice
            </h3>
          </div>
          <p className="text-[#2D3748]" data-testid="non-medical-statement">{about.non_medical_statement}</p>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-banner rounded-3xl p-6 animate-slide-up stagger-3" style={{ opacity: 0 }} data-testid="about-disclaimer">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-[#7C9A92] flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-[#2D3748] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                Disclaimer
              </h3>
              <p className="text-[#2D3748]">{about.disclaimer}</p>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center mt-8 text-sm text-[#64748B]">
          <p>Version {about.version}</p>
          <p>Last updated: {about.last_updated}</p>
        </div>

        {/* Links */}
        <div className="mt-8 space-y-3">
          <Link 
            to="/sources" 
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100 btn-transition hover:shadow-md"
            data-testid="link-to-sources"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#7C9A92]" />
              <span className="font-medium text-[#2D3748]">Sources & References</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#64748B]" />
          </Link>
          <Link 
            to="/settings" 
            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100 btn-transition hover:shadow-md"
            data-testid="link-to-settings"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#7C9A92]" />
              <span className="font-medium text-[#2D3748]">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#64748B]" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Sources & References Page
const SourcesPage = () => {
  const navigate = useNavigate();

  const sources = [
    {
      org: "WHO",
      title: "Healthy diet during pregnancy",
      description: "World Health Organization guidance on maternal nutrition"
    },
    {
      org: "CDC",
      title: "Food safety during pregnancy",
      description: "Centers for Disease Control and Prevention food safety information"
    },
    {
      org: "NHS",
      title: "Foods to avoid in pregnancy",
      description: "National Health Service pregnancy nutrition guidance"
    },
    {
      org: "ACOG",
      title: "Nutrition during pregnancy",
      description: "American College of Obstetricians and Gynecologists nutritional guidance"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="sources-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Sources & References
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Icon */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#7C9A92]/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#7C9A92]" />
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up">
          <p className="text-[#2D3748] leading-relaxed" data-testid="sources-intro">
            This app summarizes publicly available guidance for educational use. 
            The information presented is compiled from established public health organizations 
            and is intended as general reference material only.
          </p>
        </div>

        {/* Sources List */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <h3 className="text-lg font-semibold text-[#2D3748] mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Reference Sources
          </h3>
          <ul className="space-y-4" data-testid="sources-list">
            {sources.map((source, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#7C9A92]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#7C9A92]">{source.org}</span>
                </div>
                <div>
                  <p className="font-medium text-[#2D3748]">{source.title}</p>
                  <p className="text-sm text-[#64748B]">{source.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Last Reviewed */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 text-[#64748B]">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm" data-testid="last-reviewed">
              <span className="font-medium">Last reviewed:</span> January 2026
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-banner rounded-2xl p-4 animate-slide-up stagger-3" style={{ opacity: 0 }} data-testid="sources-disclaimer">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#7C9A92] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#2D3748]">
              This content is for educational purposes only. It does not constitute medical advice, 
              diagnosis, or treatment. Individual circumstances vary; consulting healthcare 
              professionals is suggested for personalized guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const navigate = useNavigate();
  const [pregnancyStage, setPregnancyStage] = useState(() => {
    return sessionStorage.getItem("pregnancyStage") || "";
  });
  const [conditions, setConditions] = useState(() => {
    const saved = sessionStorage.getItem("conditions");
    return saved ? JSON.parse(saved) : [];
  });

  const pregnancyStages = [
    { value: "", label: "Not specified" },
    { value: "planning", label: "Planning pregnancy" },
    { value: "trimester1", label: "First trimester (weeks 1-12)" },
    { value: "trimester2", label: "Second trimester (weeks 13-26)" },
    { value: "trimester3", label: "Third trimester (weeks 27-40)" },
    { value: "postpartum", label: "Postpartum" }
  ];

  const conditionOptions = [
    { value: "gestational_diabetes", label: "Gestational diabetes" },
    { value: "hypertension", label: "High blood pressure" },
    { value: "anemia", label: "Anemia" },
    { value: "food_allergies", label: "Food allergies" },
    { value: "vegetarian", label: "Vegetarian diet" },
    { value: "vegan", label: "Vegan diet" },
    { value: "gluten_free", label: "Gluten-free diet" },
    { value: "lactose_intolerant", label: "Lactose intolerance" }
  ];

  const handleStageChange = (value) => {
    setPregnancyStage(value);
    sessionStorage.setItem("pregnancyStage", value);
  };

  const handleConditionToggle = (value) => {
    const newConditions = conditions.includes(value)
      ? conditions.filter(c => c !== value)
      : [...conditions, value];
    setConditions(newConditions);
    sessionStorage.setItem("conditions", JSON.stringify(newConditions));
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="settings-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Pregnancy Stage Selector */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
            Pregnancy Stage
          </h3>
          <p className="text-sm text-[#64748B] mb-4">
            Select your current stage for personalized content display (optional).
          </p>
          <div className="space-y-2" data-testid="pregnancy-stage-selector">
            {pregnancyStages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => handleStageChange(stage.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl btn-transition ${
                  pregnancyStage === stage.value
                    ? 'bg-[#7C9A92]/10 border-2 border-[#7C9A92]'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
                data-testid={`stage-${stage.value || 'none'}`}
              >
                <span className={`font-medium ${pregnancyStage === stage.value ? 'text-[#7C9A92]' : 'text-[#2D3748]'}`}>
                  {stage.label}
                </span>
                {pregnancyStage === stage.value && (
                  <CheckCircle className="w-5 h-5 text-[#7C9A92]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions Selector */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up stagger-1" style={{ opacity: 0 }}>
          <h3 className="text-lg font-semibold text-[#2D3748] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
            Dietary Considerations
          </h3>
          <p className="text-sm text-[#64748B] mb-4">
            Select any that apply to help filter content (optional). This does not replace medical advice.
          </p>
          <div className="flex flex-wrap gap-2" data-testid="conditions-selector">
            {conditionOptions.map((condition) => (
              <button
                key={condition.value}
                onClick={() => handleConditionToggle(condition.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium btn-transition ${
                  conditions.includes(condition.value)
                    ? 'bg-[#7C9A92] text-white'
                    : 'bg-slate-100 text-[#2D3748] hover:bg-slate-200'
                }`}
                data-testid={`condition-${condition.value}`}
              >
                {condition.label}
              </button>
            ))}
          </div>
        </div>

        {/* Information Links */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up stagger-2" style={{ opacity: 0 }}>
          <h3 className="text-lg font-semibold text-[#2D3748] mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Information
          </h3>
          <div className="space-y-3">
            <Link 
              to="/sources" 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl btn-transition hover:bg-slate-100"
              data-testid="settings-link-sources"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#7C9A92]" />
                <span className="font-medium text-[#2D3748]">Sources & References</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </Link>
            <Link 
              to="/about" 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl btn-transition hover:bg-slate-100"
              data-testid="settings-link-about"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#7C9A92]" />
                <span className="font-medium text-[#2D3748]">About Our Information</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 animate-slide-up stagger-3" style={{ opacity: 0 }}>
          <h3 className="text-lg font-semibold text-[#2D3748] mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Legal
          </h3>
          <div className="space-y-3">
            <Link 
              to="/terms" 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl btn-transition hover:bg-slate-100"
              data-testid="settings-link-terms"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#7C9A92]" />
                <span className="font-medium text-[#2D3748]">Terms of Use</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </Link>
            <Link 
              to="/privacy" 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl btn-transition hover:bg-slate-100"
              data-testid="settings-link-privacy"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#7C9A92]" />
                <span className="font-medium text-[#2D3748]">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </Link>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-[#64748B] animate-slide-up stagger-4" style={{ opacity: 0 }}>
          <p>NurtureNote v1.0.0</p>
          <p>Educational Reference Only</p>
        </div>
      </div>
    </div>
  );
};

// Terms of Use Page
const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="terms-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Terms of Use
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          <p className="text-sm text-[#64748B] mb-4">Last updated: January 2026</p>
          
          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            1. Educational Purpose
          </h3>
          <p className="text-[#2D3748] mb-6">
            NurtureNote provides general educational reference information about nutrition during pregnancy. 
            This app is intended for informational purposes only and does not provide medical advice, 
            diagnosis, or treatment.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            2. No Medical Advice
          </h3>
          <p className="text-[#2D3748] mb-6">
            The content in this app is not intended to be a substitute for professional medical advice, 
            diagnosis, or treatment. Always seek the advice of your physician or other qualified health 
            provider with any questions you may have regarding a medical condition or dietary choices.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            3. Use of Information
          </h3>
          <p className="text-[#2D3748] mb-6">
            You acknowledge that any information provided in this app is general in nature and may not 
            apply to your specific circumstances. You use this information at your own risk.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            4. Information Sources
          </h3>
          <p className="text-[#2D3748] mb-6">
            Information in this app is compiled from publicly available guidance from organizations 
            including WHO, CDC, NHS, and ACOG. We strive for accuracy but cannot guarantee that all 
            information is current or complete.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            5. Acceptance
          </h3>
          <p className="text-[#2D3748]">
            By using this app, you acknowledge that you have read and understood these terms and agree 
            to be bound by them.
          </p>
        </div>
      </div>
    </div>
  );
};

// Privacy Policy Page
const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="privacy-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center btn-transition hover:bg-slate-200"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#2D3748]" />
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]" style={{ fontFamily: 'Merriweather, serif' }}>
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          <p className="text-sm text-[#64748B] mb-4">Last updated: January 2026</p>
          
          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            1. Information We Collect
          </h3>
          <p className="text-[#2D3748] mb-6">
            NurtureNote stores your preferences (pregnancy stage, dietary considerations) locally on 
            your device using session storage. This information is not transmitted to any server and 
            is cleared when you close your browser session.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            2. Data Storage
          </h3>
          <p className="text-[#2D3748] mb-6">
            All preference data is stored locally on your device only. We do not collect, store, or 
            process any personal health information on our servers.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            3. No Account Required
          </h3>
          <p className="text-[#2D3748] mb-6">
            This app does not require you to create an account or provide any personal information 
            to use its features.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            4. Third-Party Services
          </h3>
          <p className="text-[#2D3748] mb-6">
            This app does not share any information with third-party services or advertisers.
          </p>

          <h3 className="text-lg font-semibold text-[#2D3748] mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            5. Contact
          </h3>
          <p className="text-[#2D3748]">
            If you have questions about this privacy policy, please contact us through the app store 
            listing or our website.
          </p>
        </div>

        <div className="disclaimer-banner rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#7C9A92] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#2D3748]">
              Your privacy is important to us. This app is designed to work without collecting 
              personal data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Footer Navigation
const Footer = () => (
  <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
    <div className="max-w-md mx-auto px-6 py-3">
      <nav className="flex justify-around items-center">
        <Link 
          to="/" 
          className="flex flex-col items-center gap-1 py-2 px-4 text-[#64748B] hover:text-[#7C9A92] btn-transition"
          data-testid="nav-home"
        >
          <Search className="w-5 h-5" />
          <span className="text-xs font-medium">Search</span>
        </Link>
        <Link 
          to="/topics" 
          className="flex flex-col items-center gap-1 py-2 px-4 text-[#64748B] hover:text-[#7C9A92] btn-transition"
          data-testid="nav-topics"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-medium">Topics</span>
        </Link>
        <Link 
          to="/about" 
          className="flex flex-col items-center gap-1 py-2 px-4 text-[#64748B] hover:text-[#7C9A92] btn-transition"
          data-testid="nav-about"
        >
          <Info className="w-5 h-5" />
          <span className="text-xs font-medium">About</span>
        </Link>
      </nav>
    </div>
  </footer>
);

// Main Layout with Footer
const MainLayout = ({ children }) => (
  <div className="pb-20">
    {children}
    <Footer />
  </div>
);

// Main App Component
function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Check session storage on mount (session-only storage)
  useEffect(() => {
    const accepted = sessionStorage.getItem("disclaimerAccepted");
    if (accepted === "true") {
      setDisclaimerAccepted(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    sessionStorage.setItem("disclaimerAccepted", "true");
    setDisclaimerAccepted(true);
  };

  if (!disclaimerAccepted) {
    return <DisclaimerModal onAccept={handleAcceptDisclaimer} />;
  }

  return (
    <div className="App grain-overlay">
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/food/:id" element={<FoodDetailPage />} />
            <Route path="/topics" element={<NutritionTopicsPage />} />
            <Route path="/qa" element={<NutritionTopicsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </div>
  );
}

export default App;
