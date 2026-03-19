import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, X, AlertCircle, Filter, Check, Clock, ChevronDown, ChevronUp, AlertTriangle, ArrowLeft, Share2, Settings, Home, HelpCircle, BookOpen, Info, User } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Safety badge config
const SAFETY_CONFIG = {
  SAFE: { color: '#16a34a', bgColor: 'rgba(34, 197, 94, 0.1)', label: 'Generally Safe' },
  LIMIT: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Limit Intake' },
  AVOID: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Avoid' },
};

// Dietary restrictions options
const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No gluten-containing foods' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No dairy products' },
  { id: 'nut-free', label: 'Nut-Free', description: 'No tree nuts or peanuts' },
  { id: 'shellfish-free', label: 'Shellfish-Free', description: 'No shellfish' },
  { id: 'egg-free', label: 'Egg-Free', description: 'No eggs' },
  { id: 'soy-free', label: 'Soy-Free', description: 'No soy products' },
  { id: 'low-sodium', label: 'Low Sodium', description: 'Limit salt intake' },
  { id: 'diabetic-friendly', label: 'Diabetic Friendly', description: 'Low sugar options' },
];

// Check if food has dietary concerns based on user restrictions
const checkDietaryConcerns = (food, restrictions) => {
  const concerns = [];
  const allergyWarning = (food.allergy_warning || '').toLowerCase();
  const name = (food.name || '').toLowerCase();
  const category = (food.category || '').toLowerCase();
  
  if (restrictions.includes('vegetarian') || restrictions.includes('vegan')) {
    if (category === 'proteins' && (name.includes('chicken') || name.includes('salmon') || name.includes('tuna') || name.includes('sushi') || name.includes('deli'))) {
      concerns.push('Contains meat/fish');
    }
  }
  if (restrictions.includes('vegan')) {
    if (category === 'dairy' || name.includes('egg') || name.includes('yogurt') || name.includes('cheese') || name.includes('milk')) {
      concerns.push('Contains animal products');
    }
  }
  if (restrictions.includes('gluten-free')) {
    if (allergyWarning.includes('gluten') || name.includes('bread') || name.includes('oatmeal')) {
      concerns.push('May contain gluten');
    }
  }
  if (restrictions.includes('dairy-free')) {
    if (category === 'dairy' || allergyWarning.includes('milk') || allergyWarning.includes('dairy') || allergyWarning.includes('lactose')) {
      concerns.push('Contains dairy');
    }
  }
  if (restrictions.includes('nut-free')) {
    if (category === 'nuts & seeds' || allergyWarning.includes('nut') || allergyWarning.includes('peanut') || name.includes('almond') || name.includes('walnut') || name.includes('peanut')) {
      concerns.push('Contains nuts');
    }
  }
  if (restrictions.includes('egg-free')) {
    if (name.includes('egg') || allergyWarning.includes('egg')) {
      concerns.push('Contains eggs');
    }
  }
  if (restrictions.includes('soy-free')) {
    if (name.includes('tofu') || name.includes('soy') || allergyWarning.includes('soy')) {
      concerns.push('Contains soy');
    }
  }
  
  return concerns;
};

// Safety Badge Component
const SafetyBadge = ({ safety, label }) => {
  const config = SAFETY_CONFIG[safety] || SAFETY_CONFIG.SAFE;
  const displayLabel = label || config.label;
  
  return (
    <span 
      className="safety-badge-inline"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <Check size={14} />
      {displayLabel}
    </span>
  );
};

// Food Card Component (for grid)
const FoodCard = ({ food, onClick, dietaryRestrictions = [] }) => {
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const dietaryConcerns = checkDietaryConcerns(food, dietaryRestrictions);
  
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className={`food-card ${dietaryConcerns.length > 0 ? 'has-dietary-concern' : ''}`}
      onClick={() => onClick(food)}
    >
      <div className="food-card-icon">
        <Utensils size={24} />
      </div>
      <div className="food-card-content">
        <h3 className="food-card-name">{food.name}</h3>
        <span className="food-card-category">{food.category}</span>
        <span 
          className="food-card-safety"
          style={{ backgroundColor: safetyConfig.bgColor, color: safetyConfig.color }}
        >
          <Check size={12} />
          {food.safety_label || safetyConfig.label}
        </span>
        {dietaryConcerns.length > 0 && (
          <div className="food-card-dietary-warning">
            <AlertTriangle size={12} />
            <span>{dietaryConcerns[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Food Detail Modal - Matching your design
const FoodDetailModal = ({ food, onClose, dietaryRestrictions = [] }) => {
  const [showReferences, setShowReferences] = useState(false);
  
  if (!food) return null;
  
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const dietaryConcerns = checkDietaryConcerns(food, dietaryRestrictions);

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="food-detail-modal">
      <div className="modal-content-detail" onClick={e => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div className="modal-header-bar">
          <button className="back-button" onClick={onClose} data-testid="back-to-home-btn">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <button className="share-button" data-testid="share-btn">
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>

        {/* Food Title Section */}
        <div className="food-title-section">
          <div className="food-title-content">
            <h1 data-testid="food-name">{food.name}</h1>
            <p className="food-category-label">{food.category}</p>
          </div>
          <span 
            className="safety-badge-large"
            style={{ backgroundColor: safetyConfig.bgColor, color: safetyConfig.color }}
            data-testid="safety-badge"
          >
            <Check size={16} />
            {food.safety_label || safetyConfig.label}
          </span>
        </div>

        {/* Dietary Concern Alert */}
        {dietaryConcerns.length > 0 && (
          <div className="dietary-concern-alert" data-testid="dietary-concern-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Dietary Alert</strong>
              <p>Based on your dietary preferences: {dietaryConcerns.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Nutritional Benefits */}
        {food.nutritional_benefits && food.nutritional_benefits.length > 0 && (
          <div className="info-card" data-testid="nutritional-benefits-section">
            <div className="info-card-header">
              <Check size={18} className="icon-green" />
              <h3>Nutritional Benefits</h3>
            </div>
            <div className="benefit-tags">
              {food.nutritional_benefits.map((benefit, index) => (
                <span key={index} className="benefit-tag">{benefit}</span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Consumption */}
        {food.recommended_consumption && food.recommended_consumption.length > 0 && (
          <div className="info-card" data-testid="recommended-consumption-section">
            <div className="info-card-header">
              <Clock size={18} className="icon-blue" />
              <h3>Recommended Consumption</h3>
            </div>
            <ul className="check-list">
              {food.recommended_consumption.map((item, index) => (
                <li key={index}>
                  <Check size={16} className="check-icon blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preparation Tips */}
        {food.preparation_tips && food.preparation_tips.length > 0 && (
          <div className="info-card" data-testid="preparation-tips-section">
            <div className="info-card-header">
              <Utensils size={18} className="icon-purple" />
              <h3>Preparation Tips</h3>
            </div>
            <ul className="check-list purple">
              {food.preparation_tips.map((tip, index) => (
                <li key={index}>
                  <Check size={16} className="check-icon purple" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Precautions */}
        {food.precautions && food.precautions.length > 0 && (
          <div className="info-card precautions-card" data-testid="precautions-section">
            <div className="info-card-header">
              <AlertCircle size={18} className="icon-red" />
              <h3>Precautions</h3>
            </div>
            <ul className="precaution-list">
              {food.precautions.map((item, index) => (
                <li key={index}>
                  <AlertTriangle size={14} className="warning-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Allergy Warning */}
        {food.allergy_warning && (
          <div className="allergy-alert" data-testid="allergy-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Allergy Warning</strong>
              <p>{food.allergy_warning}</p>
            </div>
          </div>
        )}

        {/* View References (Collapsible) */}
        <button 
          className="references-toggle"
          onClick={() => setShowReferences(!showReferences)}
          data-testid="references-toggle"
        >
          <span>View References</span>
          {showReferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {showReferences && (
          <div className="references-content" data-testid="references-content">
            <p>Sources: USDA FoodData Central, American College of Obstetricians and Gynecologists (ACOG), FDA Food Safety Guidelines for Pregnancy</p>
          </div>
        )}

        {/* Educational Disclaimer */}
        <div className="educational-disclaimer">
          <p><strong>Educational Information:</strong> This content is for general reference only and does not constitute medical advice. Consult a healthcare professional for personalized guidance.</p>
        </div>

      </div>
    </div>
  );
};

// Category Filter
const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="filter-section">
      <div className="filter-label">
        <Filter size={14} />
        <span>CATEGORIES</span>
      </div>
      <div className="filter-chips">
        <button
          className={`filter-chip ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

// Safety Filter
const SafetyFilter = ({ selectedSafety, onSelect }) => {
  const safetyLevels = [
    { key: 'SAFE', label: 'Safe' },
    { key: 'LIMIT', label: 'Limit' },
    { key: 'AVOID', label: 'Avoid' }
  ];
  
  return (
    <div className="filter-section">
      <div className="filter-label">
        <Check size={14} />
        <span>SAFETY LEVEL</span>
      </div>
      <div className="filter-chips">
        <button
          className={`filter-chip ${selectedSafety === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          All
        </button>
        {safetyLevels.map((level) => (
          <button
            key={level.key}
            className={`filter-chip ${selectedSafety === level.key ? 'active' : ''}`}
            onClick={() => onSelect(level.key)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Settings View Component
const SettingsView = ({ dietaryRestrictions, onUpdateRestrictions, onBack }) => {
  const [localRestrictions, setLocalRestrictions] = useState(dietaryRestrictions);

  const toggleRestriction = (id) => {
    if (localRestrictions.includes(id)) {
      setLocalRestrictions(localRestrictions.filter(r => r !== id));
    } else {
      setLocalRestrictions([...localRestrictions, id]);
    }
  };

  const handleSave = () => {
    onUpdateRestrictions(localRestrictions);
    onBack();
  };

  return (
    <div className="settings-view" data-testid="settings-view">
      <div className="settings-header">
        <button className="back-button" onClick={onBack} data-testid="settings-back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>Settings</h2>
        <div style={{width: '80px'}}></div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">
            <User size={20} />
            <h3>Dietary Restrictions</h3>
          </div>
          <p className="settings-description">
            Select your dietary restrictions to see personalized alerts on foods that may not be suitable for you.
          </p>

          <div className="dietary-options">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <label 
                key={restriction.id} 
                className={`dietary-option ${localRestrictions.includes(restriction.id) ? 'selected' : ''}`}
                data-testid={`dietary-option-${restriction.id}`}
              >
                <div className="dietary-option-content">
                  <span className="dietary-option-label">{restriction.label}</span>
                  <span className="dietary-option-description">{restriction.description}</span>
                </div>
                <div className={`dietary-checkbox ${localRestrictions.includes(restriction.id) ? 'checked' : ''}`}>
                  {localRestrictions.includes(restriction.id) && <Check size={14} />}
                </div>
                <input
                  type="checkbox"
                  checked={localRestrictions.includes(restriction.id)}
                  onChange={() => toggleRestriction(restriction.id)}
                  style={{display: 'none'}}
                />
              </label>
            ))}
          </div>
        </div>

        <button className="save-settings-btn" onClick={handleSave} data-testid="save-settings-btn">
          Save Preferences
        </button>

        {localRestrictions.length > 0 && (
          <div className="active-restrictions">
            <h4>Active Restrictions:</h4>
            <div className="restriction-tags">
              {localRestrictions.map(id => {
                const restriction = DIETARY_RESTRICTIONS.find(r => r.id === id);
                return (
                  <span key={id} className="restriction-tag">
                    {restriction?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// FAQ View Component
const FAQView = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    {
      question: "Is this app a replacement for medical advice?",
      answer: "No. WhatToEat provides general educational information about food safety during pregnancy. Always consult your healthcare provider, OB-GYN, or registered dietitian for personalized medical advice."
    },
    {
      question: "How are foods categorized as Safe, Limit, or Avoid?",
      answer: "Our classifications are based on guidelines from major health organizations including ACOG (American College of Obstetricians and Gynecologists), FDA, and CDC. Foods marked 'Safe' are generally considered low-risk when properly prepared. 'Limit' foods should be consumed in moderation. 'Avoid' foods carry higher risks during pregnancy."
    },
    {
      question: "Can I eat sushi during pregnancy?",
      answer: "Raw fish sushi should be avoided during pregnancy due to risk of parasites and bacteria. However, cooked sushi rolls (like shrimp tempura or fully cooked fish) and vegetable rolls are generally safe options."
    },
    {
      question: "How much caffeine is safe during pregnancy?",
      answer: "Most health organizations recommend limiting caffeine to 200mg per day during pregnancy. This is roughly equivalent to one 12oz cup of coffee. Remember that caffeine is also found in tea, chocolate, and some sodas."
    },
    {
      question: "Why should I avoid certain cheeses?",
      answer: "Soft cheeses made from unpasteurized milk may contain Listeria bacteria, which can cause serious complications during pregnancy. Always choose pasteurized cheeses. Hard cheeses like cheddar and parmesan are generally safe."
    },
    {
      question: "Are artificial sweeteners safe during pregnancy?",
      answer: "Most artificial sweeteners (aspartame, sucralose, stevia) are considered safe in moderation during pregnancy. However, saccharin should be avoided. When in doubt, natural sweeteners in moderation are preferable."
    },
    {
      question: "How do I know if fish is low in mercury?",
      answer: "Low-mercury fish include salmon, tilapia, cod, shrimp, and sardines. High-mercury fish to avoid include shark, swordfish, king mackerel, and tilefish. The FDA recommends 2-3 servings of low-mercury fish per week during pregnancy."
    },
    {
      question: "What does the dietary restrictions feature do?",
      answer: "When you set dietary restrictions in Settings, the app will show you personalized alerts on foods that may not be suitable for your dietary needs, in addition to the standard pregnancy safety information."
    }
  ];

  return (
    <div className="page-view" data-testid="faq-view">
      <div className="page-header">
        <button className="back-button" onClick={onBack} data-testid="faq-back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>FAQ</h2>
        <div style={{width: '80px'}}></div>
      </div>

      <div className="page-content">
        <p className="page-intro">Common questions about food safety during pregnancy.</p>
        
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item" data-testid={`faq-item-${index}`}>
              <button 
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Topics View Component
const TopicsView = ({ onBack, onNavigateHome }) => {
  const topics = [
    {
      title: "First Trimester Nutrition",
      icon: "🌱",
      description: "Essential nutrients for early pregnancy development",
      tips: ["Focus on folate-rich foods like leafy greens", "Stay hydrated to combat morning sickness", "Eat small, frequent meals", "Prioritize protein for baby's cell growth"]
    },
    {
      title: "Foods to Avoid",
      icon: "⚠️",
      description: "Important restrictions during pregnancy",
      tips: ["Raw or undercooked meats and eggs", "High-mercury fish (shark, swordfish)", "Unpasteurized dairy products", "Alcohol - no safe amount established", "Excessive caffeine (limit to 200mg/day)"]
    },
    {
      title: "Managing Morning Sickness",
      icon: "🍋",
      description: "Foods that may help ease nausea",
      tips: ["Ginger tea or ginger candies", "Plain crackers before getting up", "Cold foods may be more tolerable", "Avoid strong-smelling foods", "Eat small portions frequently"]
    },
    {
      title: "Iron & Preventing Anemia",
      icon: "💪",
      description: "Building healthy blood for you and baby",
      tips: ["Red meat is the best iron source", "Pair plant iron with vitamin C", "Cook in cast iron when possible", "Avoid calcium with iron-rich meals", "Consider iron-fortified cereals"]
    },
    {
      title: "Calcium & Bone Health",
      icon: "🦴",
      description: "Supporting baby's skeletal development",
      tips: ["Dairy products are excellent sources", "Fortified plant milks work too", "Sardines with bones are calcium-rich", "Leafy greens provide some calcium", "Vitamin D helps calcium absorption"]
    },
    {
      title: "Third Trimester Focus",
      icon: "👶",
      description: "Preparing for delivery and breastfeeding",
      tips: ["Omega-3s for brain development", "Dates may help with labor prep", "Keep protein intake high", "Stay hydrated for amniotic fluid", "Prepare freezer meals for postpartum"]
    }
  ];

  return (
    <div className="page-view" data-testid="topics-view">
      <div className="page-header">
        <button className="back-button" onClick={onBack} data-testid="topics-back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>Topics</h2>
        <div style={{width: '80px'}}></div>
      </div>

      <div className="page-content">
        <p className="page-intro">Learn about pregnancy nutrition topics.</p>
        
        <div className="topics-grid">
          {topics.map((topic, index) => (
            <div key={index} className="topic-card" data-testid={`topic-card-${index}`}>
              <div className="topic-header">
                <span className="topic-icon">{topic.icon}</span>
                <h3>{topic.title}</h3>
              </div>
              <p className="topic-description">{topic.description}</p>
              <ul className="topic-tips">
                {topic.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>
                    <Check size={14} className="tip-check" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// About View Component
const AboutView = ({ onBack }) => {
  return (
    <div className="page-view" data-testid="about-view">
      <div className="page-header">
        <button className="back-button" onClick={onBack} data-testid="about-back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>About</h2>
        <div style={{width: '80px'}}></div>
      </div>

      <div className="page-content">
        <div className="about-hero">
          <div className="about-logo">
            <div className="logo-icon large">W</div>
          </div>
          <h1>WhatToEat</h1>
          <p className="version">Version 1.0.0</p>
        </div>

        <div className="about-section">
          <h3>About This App</h3>
          <p>
            WhatToEat is a pregnancy nutrition guide designed to help expectant mothers make informed food choices. 
            Browse our database of 235+ foods with pregnancy-specific safety information, nutritional benefits, 
            and preparation tips.
          </p>
        </div>

        <div className="about-section">
          <h3>Features</h3>
          <ul className="feature-list">
            <li><Check size={16} /> 235+ foods with pregnancy safety ratings</li>
            <li><Check size={16} /> Instant search and filtering</li>
            <li><Check size={16} /> Personalized dietary restriction alerts</li>
            <li><Check size={16} /> Nutritional benefits and precautions</li>
            <li><Check size={16} /> Preparation tips for safe consumption</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>Data Sources</h3>
          <p>
            Our information is compiled from reputable sources including the USDA FoodData Central, 
            American College of Obstetricians and Gynecologists (ACOG), FDA Food Safety Guidelines, 
            and CDC pregnancy nutrition recommendations.
          </p>
        </div>

        <div className="about-section disclaimer-section">
          <h3>Medical Disclaimer</h3>
          <p>
            <strong>Important:</strong> This app is for educational purposes only and does not constitute medical advice. 
            The information provided should not be used for diagnosing or treating health problems. 
            Always consult with a qualified healthcare provider about your specific situation.
          </p>
          <p>
            Every pregnancy is unique. What is safe for one person may not be appropriate for another 
            based on individual health conditions, allergies, or medical history.
          </p>
        </div>

        <div className="about-section">
          <h3>Privacy</h3>
          <p>
            Your dietary preferences are stored locally on your device and are not transmitted to any server. 
            We respect your privacy and do not collect personal health information.
          </p>
        </div>

        <div className="about-footer">
          <p>Made with ❤️ for expectant mothers</p>
          <p className="copyright">© 2026 WhatToEat. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

// Bottom Navigation
const BottomNav = ({ activeView, onChangeView }) => {
  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <button 
        className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
        onClick={() => onChangeView('home')}
        data-testid="nav-home"
      >
        <Home size={20} />
        <span>Home</span>
      </button>
      <button 
        className={`nav-item ${activeView === 'faq' ? 'active' : ''}`}
        onClick={() => onChangeView('faq')}
        data-testid="nav-faq"
      >
        <HelpCircle size={20} />
        <span>FAQ</span>
      </button>
      <button 
        className={`nav-item ${activeView === 'topics' ? 'active' : ''}`}
        onClick={() => onChangeView('topics')}
        data-testid="nav-topics"
      >
        <BookOpen size={20} />
        <span>Topics</span>
      </button>
      <button 
        className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
        onClick={() => onChangeView('about')}
        data-testid="nav-about"
      >
        <Info size={20} />
        <span>About</span>
      </button>
      <button 
        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => onChangeView('settings')}
        data-testid="nav-settings"
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </nav>
  );
};

// Main App
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSafety, setSelectedSafety] = useState('');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [dietaryRestrictions, setDietaryRestrictions] = useState(() => {
    const saved = localStorage.getItem('dietaryRestrictions');
    return saved ? JSON.parse(saved) : [];
  });

  // Save dietary restrictions to localStorage
  useEffect(() => {
    localStorage.setItem('dietaryRestrictions', JSON.stringify(dietaryRestrictions));
  }, [dietaryRestrictions]);

  useEffect(() => {
    const loadFoods = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/foods/all?page_size=250`);
        const loadedFoods = response.data.foods || [];
        setFoods(loadedFoods);
        
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

  // Client-side filtering
  const filteredFoods = (foods || []).filter((food) => {
    const name = (food.name || '').toLowerCase();
    const category = (food.category || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase().trim();
    
    const matchesSearch = query === '' || name.includes(query) || category.includes(query);
    const matchesCategory = selectedCategory === '' || food.category === selectedCategory;
    const matchesSafety = selectedSafety === '' || food.safety === selectedSafety;
    
    return matchesSearch && matchesCategory && matchesSafety;
  });

  // Render Settings View
  if (activeView === 'settings') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header compact">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">W</div>
              <h1>WhatToEat</h1>
            </div>
          </div>
        </header>
        <SettingsView 
          dietaryRestrictions={dietaryRestrictions}
          onUpdateRestrictions={setDietaryRestrictions}
          onBack={() => setActiveView('home')}
        />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  // Render FAQ View
  if (activeView === 'faq') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header compact">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">W</div>
              <h1>WhatToEat</h1>
            </div>
          </div>
        </header>
        <FAQView onBack={() => setActiveView('home')} />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  // Render Topics View
  if (activeView === 'topics') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header compact">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">W</div>
              <h1>WhatToEat</h1>
            </div>
          </div>
        </header>
        <TopicsView 
          onBack={() => setActiveView('home')}
          onNavigateHome={() => setActiveView('home')}
        />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  // Render About View
  if (activeView === 'about') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header compact">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">W</div>
              <h1>WhatToEat</h1>
            </div>
          </div>
        </header>
        <AboutView onBack={() => setActiveView('home')} />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  return (
    <div className="app" data-testid="food-search-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">W</div>
            <h1>WhatToEat</h1>
          </div>
          <p className="tagline">Find nutritional info for any food</p>
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        {/* Search */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search foods... (e.g., apple, chicken, pasta)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                data-testid="food-search-input"
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Active Dietary Restrictions Indicator */}
          {dietaryRestrictions.length > 0 && (
            <div className="active-dietary-indicator" data-testid="active-dietary-indicator">
              <AlertTriangle size={14} />
              <span>{dietaryRestrictions.length} dietary restriction{dietaryRestrictions.length > 1 ? 's' : ''} active</span>
              <button onClick={() => setActiveView('settings')} className="manage-btn">Manage</button>
            </div>
          )}

          {/* Filters */}
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <SafetyFilter 
            selectedSafety={selectedSafety}
            onSelect={setSelectedSafety}
          />
        </div>

        {/* Results */}
        <div className="results-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading foods...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>No foods found</h3>
              <p>Try a different search term</p>
            </div>
          ) : (
            <>
              <p className="results-count">Showing {filteredFoods.length} foods</p>
              <div className="foods-grid">
                {filteredFoods.map((food) => (
                  <FoodCard 
                    key={food.id} 
                    food={food} 
                    onClick={setSelectedFood}
                    dietaryRestrictions={dietaryRestrictions}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedFood && (
        <FoodDetailModal 
          food={selectedFood} 
          onClose={() => setSelectedFood(null)}
          dietaryRestrictions={dietaryRestrictions}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeView={activeView} onChangeView={setActiveView} />
    </div>
  );
}

export default App;
