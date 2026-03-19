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

// Comprehensive FAQ data with food tags
const ALL_FAQS = [
  // General FAQs
  {
    id: 'medical-advice',
    question: "Is this app a replacement for medical advice?",
    answer: "No. WhatToEat provides general educational information about food safety during pregnancy. Always consult your healthcare provider, OB-GYN, or registered dietitian for personalized medical advice.",
    category: 'general',
    foodTags: []
  },
  {
    id: 'safety-categories',
    question: "How are foods categorized as Safe, Limit, or Avoid?",
    answer: "Our classifications are based on guidelines from major health organizations including ACOG (American College of Obstetricians and Gynecologists), FDA, and CDC. Foods marked 'Safe' are generally considered low-risk when properly prepared. 'Limit' foods should be consumed in moderation. 'Avoid' foods carry higher risks during pregnancy.",
    category: 'general',
    foodTags: []
  },
  {
    id: 'dietary-restrictions',
    question: "What does the dietary restrictions feature do?",
    answer: "When you set dietary restrictions in Settings, the app will show you personalized alerts on foods that may not be suitable for your dietary needs, in addition to the standard pregnancy safety information.",
    category: 'general',
    foodTags: []
  },

  // Seafood & Fish FAQs
  {
    id: 'sushi-safety',
    question: "Can I eat sushi during pregnancy?",
    answer: "Raw fish sushi should be avoided during pregnancy due to risk of parasites and bacteria. However, cooked sushi rolls (like shrimp tempura, eel, or fully cooked fish) and vegetable rolls are generally safe options. Many sushi restaurants offer pregnancy-safe options - just ask!",
    category: 'seafood',
    foodTags: ['salmon', 'tuna', 'shrimp', 'sushi']
  },
  {
    id: 'mercury-fish',
    question: "How do I know if fish is low in mercury?",
    answer: "Low-mercury fish include salmon, tilapia, cod, shrimp, sardines, anchovies, and trout. High-mercury fish to AVOID include shark, swordfish, king mackerel, tilefish, and bigeye tuna. The FDA recommends 2-3 servings of low-mercury fish per week during pregnancy for omega-3 benefits.",
    category: 'seafood',
    foodTags: ['salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'sardines', 'trout', 'swordfish', 'shark', 'mackerel']
  },
  {
    id: 'smoked-salmon',
    question: "Is smoked salmon safe during pregnancy?",
    answer: "Cold-smoked salmon (lox) carries a risk of Listeria and should be avoided unless heated to steaming hot. Hot-smoked salmon that's been cooked to 145°F is safe. Canned salmon is also a safe option as it's been heat-processed.",
    category: 'seafood',
    foodTags: ['salmon']
  },
  {
    id: 'shellfish-pregnancy',
    question: "Can I eat shellfish during pregnancy?",
    answer: "Yes, shellfish like shrimp, crab, lobster, and scallops are safe and nutritious during pregnancy when thoroughly cooked. They're low in mercury and high in protein. Avoid raw shellfish like raw oysters. Cook shellfish until the flesh is opaque and shells open.",
    category: 'seafood',
    foodTags: ['shrimp', 'crab', 'lobster', 'scallops', 'oysters', 'mussels', 'clams']
  },
  {
    id: 'canned-tuna',
    question: "How much canned tuna can I eat during pregnancy?",
    answer: "Light canned tuna (skipjack) is lower in mercury - you can have 2-3 servings per week. Albacore (white) tuna has more mercury - limit to 1 serving per week. Avoid bigeye tuna entirely. One serving is about 4 ounces (113g).",
    category: 'seafood',
    foodTags: ['tuna']
  },

  // Dairy FAQs
  {
    id: 'cheese-safety',
    question: "Why should I avoid certain cheeses?",
    answer: "Soft cheeses made from unpasteurized milk may contain Listeria bacteria, which can cause serious complications during pregnancy. SAFE cheeses include: hard cheeses (cheddar, parmesan, swiss), pasteurized soft cheeses, and any cheese cooked until steaming. AVOID: unpasteurized feta, brie, camembert, blue cheese, and queso fresco unless labeled pasteurized.",
    category: 'dairy',
    foodTags: ['cheese', 'feta', 'mozzarella', 'parmesan', 'ricotta', 'cream-cheese', 'goat-cheese']
  },
  {
    id: 'pasteurized-dairy',
    question: "What does pasteurized mean and why does it matter?",
    answer: "Pasteurization is a heat treatment that kills harmful bacteria like Listeria, Salmonella, and E. coli. During pregnancy, your immune system is suppressed, making you more susceptible to foodborne illness. Always check labels for 'pasteurized' on milk, cheese, and juice products.",
    category: 'dairy',
    foodTags: ['milk', 'yogurt', 'cheese', 'butter', 'cream-cheese', 'ricotta']
  },
  {
    id: 'yogurt-pregnancy',
    question: "Is yogurt safe during pregnancy?",
    answer: "Yes! Pasteurized yogurt is excellent during pregnancy. It provides calcium, protein, and probiotics for gut health. Greek yogurt has even more protein. Choose plain varieties and add your own fruit to avoid excess sugar. Avoid unpasteurized or raw milk yogurts.",
    category: 'dairy',
    foodTags: ['yogurt']
  },

  // Caffeine FAQs
  {
    id: 'caffeine-limit',
    question: "How much caffeine is safe during pregnancy?",
    answer: "Most health organizations recommend limiting caffeine to 200mg per day during pregnancy. This equals about: one 12oz coffee (95-200mg), two 8oz cups of black tea (47mg each), or four 12oz colas (34mg each). Remember caffeine is also in chocolate, energy drinks, and some medications.",
    category: 'beverages',
    foodTags: ['coffee', 'tea', 'green-tea', 'chocolate', 'dark-chocolate']
  },
  {
    id: 'decaf-coffee',
    question: "Is decaf coffee completely caffeine-free?",
    answer: "No, decaf coffee still contains 2-15mg of caffeine per cup. It's a good option to reduce intake but shouldn't be considered caffeine-free. Herbal teas (like rooibos or peppermint) are truly caffeine-free alternatives.",
    category: 'beverages',
    foodTags: ['coffee']
  },
  {
    id: 'herbal-tea-safety',
    question: "Which herbal teas are safe during pregnancy?",
    answer: "SAFE: Ginger tea (great for nausea), peppermint, rooibos, and lemon balm in moderation. LIMIT: Chamomile (1-2 cups daily). AVOID: Licorice root, dong quai, pennyroyal, blue/black cohosh, and excessive amounts of any single herb. Always check with your provider about specific herbal teas.",
    category: 'beverages',
    foodTags: ['tea', 'ginger-tea', 'peppermint-tea', 'chamomile-tea', 'rooibos-tea']
  },

  // Meat & Eggs FAQs
  {
    id: 'meat-cooking',
    question: "How should I cook meat during pregnancy?",
    answer: "All meat should be cooked to safe internal temperatures: Beef/Pork/Lamb: 145°F (63°C) with 3-minute rest, or 160°F for ground meat. Poultry: 165°F (74°C). Use a meat thermometer - color alone isn't reliable. Avoid rare or medium-rare meat during pregnancy.",
    category: 'proteins',
    foodTags: ['beef', 'pork', 'chicken', 'turkey', 'lamb']
  },
  {
    id: 'deli-meat',
    question: "Can I eat deli meat/cold cuts during pregnancy?",
    answer: "Deli meats can harbor Listeria bacteria. To be safe: heat deli meats until steaming hot (165°F) before eating, or avoid them entirely. This includes turkey, ham, salami, bologna, and hot dogs. Freshly cooked meat sliced at home is safer.",
    category: 'proteins',
    foodTags: ['deli', 'turkey', 'ham']
  },
  {
    id: 'egg-safety',
    question: "How should eggs be prepared during pregnancy?",
    answer: "Eggs should be cooked until both the white and yolk are firm to avoid Salmonella. Avoid: runny yolks, sunny-side up, soft-boiled, raw cookie dough, homemade mayo, and Caesar dressing with raw egg. Pasteurized eggs are safe for recipes requiring less cooking.",
    category: 'proteins',
    foodTags: ['eggs']
  },
  {
    id: 'liver-pregnancy',
    question: "Should I avoid liver during pregnancy?",
    answer: "Liver should be limited during pregnancy due to very high vitamin A content. Too much vitamin A (retinol form) can cause birth defects. If you eat liver, limit to very small portions (1-2 oz) once a month. Avoid liver supplements entirely.",
    category: 'proteins',
    foodTags: ['liver']
  },

  // Fruits & Vegetables FAQs
  {
    id: 'washing-produce',
    question: "How should I wash fruits and vegetables?",
    answer: "Wash ALL produce under running water, even if you plan to peel it (bacteria can transfer when cutting). Use a brush for firm produce like melons and potatoes. Don't use soap or produce washes. Cut away any damaged or bruised areas. Pre-washed salads should still be rinsed.",
    category: 'produce',
    foodTags: ['apple', 'lettuce', 'cantaloupe', 'watermelon', 'strawberries', 'spinach']
  },
  {
    id: 'sprouts-safety',
    question: "Are sprouts safe during pregnancy?",
    answer: "Raw sprouts (alfalfa, clover, radish, mung bean) should be AVOIDED during pregnancy. They're grown in warm, humid conditions ideal for bacteria like E. coli and Salmonella. Cook sprouts thoroughly if you want to eat them.",
    category: 'produce',
    foodTags: ['sprouts']
  },
  {
    id: 'papaya-pregnancy',
    question: "Is papaya safe during pregnancy?",
    answer: "Ripe papaya is SAFE and nutritious during pregnancy, providing vitamin C and folate. However, UNRIPE (green) papaya contains papain and latex which may cause contractions and should be avoided. Ensure papaya is fully ripe (yellow/orange skin, soft flesh) before eating.",
    category: 'produce',
    foodTags: ['papaya']
  },
  {
    id: 'pineapple-pregnancy',
    question: "Does pineapple cause miscarriage?",
    answer: "No, this is a myth. Pineapple is safe during pregnancy in normal food amounts. It contains bromelain, which in VERY large concentrated amounts could theoretically affect the cervix, but you would need to eat 7-10 whole pineapples at once. Enjoy pineapple as part of a balanced diet.",
    category: 'produce',
    foodTags: ['pineapple']
  },

  // Nuts & Seeds FAQs
  {
    id: 'peanuts-pregnancy',
    question: "Can eating peanuts during pregnancy cause allergies in my baby?",
    answer: "Current research suggests that eating peanuts during pregnancy does NOT increase allergy risk in your baby and may actually help prevent allergies. Unless you have a peanut allergy yourself, peanuts are a healthy protein source during pregnancy.",
    category: 'nuts',
    foodTags: ['peanuts', 'peanut-butter']
  },
  {
    id: 'brazil-nuts',
    question: "How many Brazil nuts can I eat during pregnancy?",
    answer: "Limit Brazil nuts to 1-2 per day maximum. They're extremely high in selenium - just one nut provides your entire daily need. Too much selenium can be harmful. Other nuts like almonds, walnuts, and cashews can be eaten more freely.",
    category: 'nuts',
    foodTags: ['brazil-nuts']
  },

  // Sweeteners & Additives FAQs
  {
    id: 'artificial-sweeteners',
    question: "Are artificial sweeteners safe during pregnancy?",
    answer: "SAFE in moderation: Aspartame (Equal), Sucralose (Splenda), Stevia, Acesulfame-K. AVOID: Saccharin. LIMIT: Sugar alcohols (sorbitol, xylitol) can cause digestive issues. Natural sugars in moderation are preferable when possible.",
    category: 'general',
    foodTags: []
  },
  {
    id: 'honey-pregnancy',
    question: "Is honey safe during pregnancy?",
    answer: "Yes, honey is safe for pregnant women. The concern about infant botulism only applies to babies under 1 year old, not adults or pregnant women. Your digestive system can handle the botulinum spores. Enjoy honey in moderation as a natural sweetener.",
    category: 'general',
    foodTags: ['honey']
  },

  // Alcohol FAQs
  {
    id: 'alcohol-pregnancy',
    question: "Is any amount of alcohol safe during pregnancy?",
    answer: "No safe amount of alcohol during pregnancy has been established. Alcohol crosses the placenta directly to the baby and can cause Fetal Alcohol Spectrum Disorders (FASD). This includes beer, wine, and spirits. If you drank before knowing you were pregnant, stop now and talk to your provider.",
    category: 'beverages',
    foodTags: ['alcohol', 'wine', 'beer']
  },
  {
    id: 'cooking-wine',
    question: "Is cooking with wine safe during pregnancy?",
    answer: "Most alcohol evaporates during cooking, especially with longer cooking times and high heat. A dish simmered for 2+ hours retains minimal alcohol. Quick dishes like wine sauces retain more. When in doubt, substitute with broth, juice, or non-alcoholic wine.",
    category: 'beverages',
    foodTags: ['alcohol', 'wine']
  },

  // Iron & Nutrition FAQs
  {
    id: 'iron-foods',
    question: "What are the best iron-rich foods during pregnancy?",
    answer: "BEST sources (heme iron, easily absorbed): Red meat, poultry, fish. PLANT sources (need vitamin C for absorption): Spinach, lentils, fortified cereals, beans, tofu. Tip: Eat vitamin C foods with iron sources to boost absorption. Avoid calcium/coffee/tea with iron-rich meals.",
    category: 'nutrition',
    foodTags: ['beef', 'spinach', 'lentils', 'beans', 'tofu']
  },
  {
    id: 'folate-foods',
    question: "What foods are high in folate/folic acid?",
    answer: "Folate is crucial for preventing neural tube defects. Best sources: Dark leafy greens (spinach, kale), legumes (lentils, black beans), asparagus, broccoli, citrus fruits, fortified cereals and breads, avocado. Most women also need a prenatal vitamin with 400-800mcg folic acid.",
    category: 'nutrition',
    foodTags: ['spinach', 'kale', 'lentils', 'asparagus', 'broccoli', 'orange', 'avocado']
  },
  {
    id: 'omega3-pregnancy',
    question: "Why are omega-3s important during pregnancy?",
    answer: "Omega-3 fatty acids (especially DHA) are crucial for baby's brain and eye development. Best sources: Fatty fish (salmon, sardines, trout), fish oil supplements, algae-based DHA supplements (vegan option), walnuts, chia seeds, flaxseeds. Aim for 2-3 fish servings weekly.",
    category: 'nutrition',
    foodTags: ['salmon', 'sardines', 'trout', 'walnuts', 'chia-seeds', 'flax-seeds']
  },
  {
    id: 'calcium-pregnancy',
    question: "How much calcium do I need during pregnancy?",
    answer: "You need about 1000mg of calcium daily. Sources: Dairy (milk, yogurt, cheese), fortified plant milks, calcium-set tofu, sardines with bones, leafy greens (kale, bok choy), almonds. If you're not getting enough from food, consider a supplement. Vitamin D helps calcium absorption.",
    category: 'nutrition',
    foodTags: ['milk', 'yogurt', 'cheese', 'tofu', 'sardines', 'kale', 'almonds']
  },

  // Food Safety FAQs
  {
    id: 'listeria-foods',
    question: "What foods carry the highest Listeria risk?",
    answer: "Listeria can grow even in refrigerated foods. HIGH RISK: Deli meats, hot dogs (unless heated), soft cheeses from unpasteurized milk, refrigerated pâtés, smoked seafood, unpasteurized milk/juice, raw sprouts, pre-made salads. When in doubt, heat foods to steaming hot.",
    category: 'safety',
    foodTags: ['deli', 'cheese', 'milk']
  },
  {
    id: 'food-poisoning',
    question: "What should I do if I get food poisoning during pregnancy?",
    answer: "Stay hydrated with water, clear broths, and electrolyte drinks. Contact your healthcare provider if you have: fever over 101.5°F, bloody stool, severe vomiting, signs of dehydration, or symptoms lasting more than 2 days. Listeria requires antibiotic treatment.",
    category: 'safety',
    foodTags: []
  },
  {
    id: 'leftovers-safety',
    question: "How long can I keep leftovers during pregnancy?",
    answer: "Be extra careful with leftovers during pregnancy. Refrigerate within 2 hours of cooking. Eat refrigerated leftovers within 2-3 days (not 4-5 like usual). Reheat thoroughly to 165°F until steaming. When in doubt, throw it out.",
    category: 'safety',
    foodTags: []
  },

  // Specific Cravings FAQs
  {
    id: 'ice-cravings',
    question: "Why do I crave ice during pregnancy?",
    answer: "Craving ice (pica) during pregnancy can be a sign of iron deficiency anemia. Talk to your healthcare provider about getting your iron levels checked. In the meantime, try iron-rich foods like red meat, spinach, and fortified cereals.",
    category: 'general',
    foodTags: []
  },
  {
    id: 'spicy-food',
    question: "Is spicy food safe during pregnancy?",
    answer: "Yes, spicy food is safe during pregnancy and won't harm your baby. However, it may worsen heartburn and acid reflux, which are common in pregnancy. If you tolerate spicy food well, there's no need to avoid it.",
    category: 'general',
    foodTags: ['hot-sauce']
  },

  // Third Trimester Specific
  {
    id: 'dates-labor',
    question: "Do dates help with labor?",
    answer: "Research suggests eating 6 dates daily starting at 36 weeks may help: promote cervical ripening, reduce need for labor induction, and shorten early labor. While not guaranteed, dates are nutritious and worth trying. They're high in fiber, potassium, and natural sugars for energy.",
    category: 'nutrition',
    foodTags: ['dates']
  },
  {
    id: 'raspberry-leaf-tea',
    question: "Is raspberry leaf tea safe during pregnancy?",
    answer: "Raspberry leaf tea is traditionally used to tone the uterus. Most practitioners suggest: AVOID in first trimester, may be okay in moderation in second trimester, often recommended in third trimester (32+ weeks). Always consult your provider first as it may stimulate contractions.",
    category: 'beverages',
    foodTags: ['tea']
  }
];

// Helper function to get FAQs related to a food
const getRelatedFAQs = (foodName) => {
  const normalizedName = foodName.toLowerCase().replace(/\s+/g, '-');
  return ALL_FAQS.filter(faq => 
    faq.foodTags.some(tag => 
      normalizedName.includes(tag) || tag.includes(normalizedName.split('-')[0])
    )
  );
};

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
  const [showFAQs, setShowFAQs] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  
  if (!food) return null;
  
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const dietaryConcerns = checkDietaryConcerns(food, dietaryRestrictions);
  const relatedFAQs = getRelatedFAQs(food.name);

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

        {/* Related FAQs Section */}
        {relatedFAQs.length > 0 && (
          <div className="info-card faq-card" data-testid="related-faqs-section">
            <button 
              className="info-card-header clickable"
              onClick={() => setShowFAQs(!showFAQs)}
            >
              <div className="header-left">
                <HelpCircle size={18} className="icon-blue" />
                <h3>Common Questions about {food.name}</h3>
              </div>
              {showFAQs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showFAQs && (
              <div className="related-faqs-list">
                {relatedFAQs.map((faq, index) => (
                  <div key={faq.id} className="related-faq-item">
                    <button 
                      className="related-faq-question"
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      {expandedFAQ === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedFAQ === index && (
                      <div className="related-faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'seafood', label: 'Seafood & Fish' },
    { id: 'dairy', label: 'Dairy & Cheese' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'proteins', label: 'Meat & Eggs' },
    { id: 'produce', label: 'Fruits & Vegetables' },
    { id: 'nuts', label: 'Nuts & Seeds' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'safety', label: 'Food Safety' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? ALL_FAQS 
    : ALL_FAQS.filter(faq => faq.category === selectedCategory);

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
        
        {/* Category Filter */}
        <div className="faq-category-filter">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`faq-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setOpenIndex(null);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <p className="faq-count">{filteredFAQs.length} questions</p>
        
        <div className="faq-list">
          {filteredFAQs.map((faq, index) => (
            <div key={faq.id} className="faq-item" data-testid={`faq-item-${faq.id}`}>
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
                  {faq.foodTags.length > 0 && (
                    <div className="faq-related-foods">
                      <span className="related-label">Related foods:</span>
                      {faq.foodTags.slice(0, 5).map(tag => (
                        <span key={tag} className="food-tag">{tag}</span>
                      ))}
                    </div>
                  )}
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
