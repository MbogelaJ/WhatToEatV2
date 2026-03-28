import { useState, useEffect, useRef, Component } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, X, AlertCircle, Filter, Check, Clock, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, AlertTriangle, ArrowLeft, Share2, Settings, Home, HelpCircle, BookOpen, Info, User, Lock, Star, Sparkles, Shield, Heart, Lightbulb, Crown, RefreshCw } from "lucide-react";
import { BillingProvider, useBilling } from './context/BillingContext';
import { AppUpdateProvider } from './context/AppUpdateContext';
import UpdatePrompt from './components/UpdatePrompt';
import './components/PremiumUpgrade.css';

// Log app startup
console.log('=== WhatToEat App Starting ===');
console.log('Timestamp:', new Date().toISOString());

// Global Error Boundary for production stability
// CRITICAL: Must catch ALL errors and provide recovery
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
    console.log('ErrorBoundary: Initialized');
  }

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary: getDerivedStateFromError called');
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ALWAYS log errors for debugging
    console.error('=== APP CRASH DETECTED ===');
    console.error('Error:', error?.message || error);
    console.error('Stack:', error?.stack);
    console.error('Component Stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    console.log('ErrorBoundary: Retry clicked, count:', this.state.retryCount + 1);
    
    // Clear all state and force hard reload
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
    
    // Force a complete page reload
    try {
      // Clear any cached state that might cause issues
      sessionStorage.clear();
      
      // Hard reload - bypass cache
      window.location.href = window.location.href;
    } catch (e) {
      console.error('ErrorBoundary: Reload failed:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#fff',
          textAlign: 'center'
        }}>
          <div className="error-content">
            <div className="error-icon" style={{ marginBottom: '20px' }}>
              <AlertCircle size={48} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>Something went wrong</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>The app encountered an unexpected error.</p>
            <button 
              onClick={this.handleRetry} 
              className="retry-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} />
              <span>Reload App</span>
            </button>
            {this.state.retryCount > 0 && (
              <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Import static foods data for offline/production use
// Using try-catch to handle potential import failures in native builds
let STATIC_FOODS_DATA = [];
try {
  const staticFoodsModule = require('./data/staticFoods');
  STATIC_FOODS_DATA = staticFoodsModule.STATIC_FOODS_DATA || staticFoodsModule.default || [];
} catch (e) {
  // Silent fail - static data not available
  STATIC_FOODS_DATA = [];
}

// CRITICAL: For native apps, DO NOT use backend API - it won't be accessible
// The preview URL only works during development, not in production builds
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '';

// Capacitor detection for native app - check multiple ways for reliability
const isCapacitorNative = () => {
  try {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           window.Capacitor.isNativePlatform && 
           window.Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

// Check if we should use offline mode (native app or no backend configured)
const shouldUseOfflineMode = () => {
  try {
    // Always use offline for native apps
    if (isCapacitorNative()) return true;
    // Use offline if no backend URL configured
    if (!BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('preview.emergentagent')) {
      return true;
    }
    return false;
  } catch (e) {
    return true; // Default to offline on any error
  }
};

// iOS platform detection
const isIOS = () => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === 'ios';
};

// Android platform detection
const isAndroid = () => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === 'android';
};

// Apple Sign-In handler for native iOS
const handleNativeAppleSignIn = async () => {
  try {
    if (!window.Capacitor?.Plugins?.SignInWithApple) {
      throw new Error('SignInWithApple plugin not available');
    }
    
    const SignInWithApple = window.Capacitor.Plugins.SignInWithApple;
    
    const response = await SignInWithApple.authorize({
      clientId: 'com.whattoeat.penx.app',
      redirectURI: '',
      scopes: 'email name',
      state: 'state' + Date.now(),
      nonce: 'nonce' + Date.now()
    });
    
    const user = {
      user_id: `apple_${response.response.user}`,
      email: response.response.email || `private.${response.response.user}@privaterelay.appleid.com`,
      name: response.response.givenName 
        ? `${response.response.givenName} ${response.response.familyName || ''}`.trim()
        : 'Apple User',
      picture: null,
      auth_provider: 'apple'
    };
    
    return { success: true, user };
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    return { success: false, error: error.message };
  }
};

// Auth Callback Component - handles OAuth redirect
const AuthCallback = ({ onAuthSuccess, onAuthError }) => {
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          throw new Error('No session_id found in URL');
        }
        
        const sessionId = sessionIdMatch[1];
        
        // Exchange session_id for session token
        const response = await axios.post(`${API}/auth/session`, {
          session_id: sessionId
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('isAuthenticated', 'true');
          
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          // Call success callback
          onAuthSuccess(response.data.user);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        if (onAuthError) {
          onAuthError(error);
        }
      }
    };

    processAuth();
  }, [onAuthSuccess, onAuthError]);

  if (status === 'error') {
    return (
      <div className="auth-callback-page">
        <div className="auth-callback-content">
          <div className="auth-error-icon">❌</div>
          <h2>Authentication Failed</h2>
          <p>Something went wrong. Please try again.</p>
          <button 
            className="auth-retry-btn"
            onClick={() => window.location.href = '/'}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-content">
        <div className="auth-spinner"></div>
        <h2>Signing you in...</h2>
        <p>Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
};

// Daily tips for pregnancy nutrition
const DAILY_TIPS = [
  { 
    tip: "Stay hydrated! Aim for 8-10 glasses of water daily during pregnancy.", 
    icon: "💧",
    fullContent: "Proper hydration during pregnancy is essential. Water helps form amniotic fluid, carry nutrients to your baby, helps with digestion, and prevents common pregnancy issues like constipation, hemorrhoids, and UTIs. Signs of dehydration include dark urine, dizziness, and headaches. If plain water is boring, try adding lemon, cucumber, or fresh fruit. Herbal teas (like ginger or peppermint) can also count toward your daily intake."
  },
  { 
    tip: "Folate is crucial in the first trimester. Eat leafy greens like spinach and kale.", 
    icon: "🥬",
    fullContent: "Folate (vitamin B9) is essential for preventing neural tube defects in your baby's brain and spine. You need 600-800 mcg daily during pregnancy. Best food sources include: spinach, kale, broccoli, asparagus, Brussels sprouts, lentils, chickpeas, fortified cereals, and citrus fruits. Most prenatal vitamins contain folic acid (synthetic folate), but eating folate-rich foods provides additional benefits."
  },
  { 
    tip: "Protein helps baby grow. Include eggs, lean meat, or legumes in every meal.", 
    icon: "🥚",
    fullContent: "Protein is the building block for your baby's growth. Aim for 75-100 grams daily during pregnancy. Good sources include: eggs (fully cooked), lean chicken and turkey, fish (low-mercury varieties), beans and lentils, Greek yogurt, nuts and seeds, and tofu. Protein also helps maintain your muscle mass and supports your growing blood supply."
  },
  { 
    tip: "Calcium builds strong bones. Greek yogurt is an excellent source!", 
    icon: "🦴",
    fullContent: "You need 1,000mg of calcium daily during pregnancy for your baby's bone, teeth, heart, muscle, and nerve development. If you don't get enough calcium, your body will take it from your bones. Best sources: dairy products (milk, cheese, yogurt), fortified plant milks, sardines with bones, almonds, leafy greens, and fortified orange juice. Vitamin D helps calcium absorption."
  },
  { 
    tip: "Omega-3s support brain development. Enjoy salmon 2-3 times per week.", 
    icon: "🐟",
    fullContent: "DHA and EPA (omega-3 fatty acids) are crucial for your baby's brain and eye development. Safe fish options include: salmon, sardines, herring, and anchovies. Aim for 8-12 oz of low-mercury fish weekly. If you don't eat fish, consider a DHA supplement. Plant sources like walnuts, chia seeds, and flaxseeds provide ALA, which your body partially converts to DHA."
  },
  { 
    tip: "Iron prevents anemia. Pair iron-rich foods with vitamin C for better absorption.", 
    icon: "💪",
    fullContent: "Your blood volume increases 50% during pregnancy, making iron essential. You need 27mg daily. Heme iron (from meat) absorbs best: lean beef, chicken, turkey. Plant iron sources: spinach, beans, fortified cereals. Pair with vitamin C (citrus, bell peppers, tomatoes) to boost absorption. Avoid calcium and coffee with iron-rich meals as they block absorption."
  },
  { 
    tip: "Small, frequent meals can help with morning sickness and heartburn.", 
    icon: "🍽️",
    fullContent: "Eating 5-6 small meals instead of 3 large ones helps manage nausea, heartburn, and blood sugar. Keep crackers by your bed for morning sickness. Avoid lying down right after eating. Foods to try: bland carbs (crackers, toast), ginger (tea, candies), cold foods (less smell), and protein snacks. Avoid spicy, fatty, and acidic foods if heartburn is an issue."
  },
  { 
    tip: "Ginger tea is a natural remedy for pregnancy nausea.", 
    icon: "🫚",
    fullContent: "Ginger is one of the safest and most effective natural remedies for morning sickness. Try: fresh ginger tea, ginger candies, ginger ale (real ginger), or ginger capsules. Limit to 1-2 grams of ginger daily. Other nausea helpers include: peppermint, lemon, vitamin B6, and acupressure wristbands. If nausea is severe, consult your healthcare provider."
  },
  { 
    tip: "Fiber prevents constipation. Include whole grains, fruits, and vegetables.", 
    icon: "🌾",
    fullContent: "Constipation is common during pregnancy due to hormonal changes and iron supplements. Aim for 25-30 grams of fiber daily. Good sources: whole grain bread and pasta, oatmeal, brown rice, fruits (especially prunes, pears, apples), vegetables, beans, and lentils. Increase water intake as you increase fiber. Light exercise also helps keep things moving."
  },
  { 
    tip: "Limit caffeine to 200mg daily - about one cup of coffee.", 
    icon: "☕",
    fullContent: "High caffeine intake is linked to miscarriage risk and low birth weight. Stick to under 200mg daily. Caffeine amounts: 8oz brewed coffee (95-200mg), 8oz black tea (47mg), 8oz green tea (30-50mg), 12oz cola (34mg), 1oz dark chocolate (20mg). Remember caffeine is also in energy drinks, some medications, and chocolate. Decaf still has 2-15mg."
  },
  { 
    tip: "Wash all fruits and vegetables thoroughly before eating.", 
    icon: "🍎",
    fullContent: "Washing produce removes dirt, bacteria, and pesticide residues. Rinse under running water for at least 30 seconds. Use a brush for firm produce like melons and potatoes. Don't use soap - it's not more effective and leaves residue. Cut away any damaged areas. Even if you'll peel it, wash first (bacteria transfers when cutting). Rewash pre-packaged salads."
  },
  { 
    tip: "Vitamin D helps calcium absorption. Get some safe sun exposure!", 
    icon: "☀️",
    fullContent: "Vitamin D is crucial for calcium absorption and your baby's bone development. You need 600 IU daily. Sources: 10-15 minutes of sunlight on arms/face, fortified milk and orange juice, fatty fish (salmon, sardines), egg yolks, and supplements. Many women need supplementation as food sources are limited. Have your levels checked if concerned."
  },
  { 
    tip: "Avoid raw fish and undercooked meat to prevent foodborne illness.", 
    icon: "⚠️",
    fullContent: "Foodborne illnesses are more dangerous during pregnancy and can harm your baby. Avoid: raw sushi/sashimi, raw oysters, rare/medium meat, raw eggs (cookie dough, homemade mayo), unpasteurized dairy and juice. Cook meat to proper temperatures: poultry 165°F, ground meat 160°F, whole cuts 145°F. Use a food thermometer to be sure."
  },
  { 
    tip: "Nuts and seeds are great snacks - rich in healthy fats and protein.", 
    icon: "🥜",
    fullContent: "Nuts and seeds provide protein, healthy fats, fiber, and important minerals. Good choices: almonds (calcium), walnuts (omega-3s), pumpkin seeds (iron, zinc), sunflower seeds (vitamin E), chia seeds (fiber, omega-3s). Eat unsalted varieties when possible. Note: if you have nut allergies, avoid. There's no evidence that eating nuts during pregnancy causes allergies in babies."
  },
  { 
    tip: "Listen to your body's hunger cues, but remember you're not eating for two adults!", 
    icon: "🤰",
    fullContent: "Calorie needs only increase by about 340-450 calories in 2nd/3rd trimester - not double! Focus on nutrient-dense foods rather than quantity. Normal weight gain: 25-35 lbs total. Eat when hungry, stop when satisfied. Cravings are normal but try to balance treats with nutritious foods. If you're constantly hungry, ensure you're getting enough protein and fiber."
  }
];

// Safety badge config
const SAFETY_CONFIG = {
  SAFE: { color: '#16a34a', bgColor: 'rgba(34, 197, 94, 0.1)', label: 'Generally Safe' },
  LIMIT: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Limit Intake' },
  AVOID: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Best Avoided' },
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

// Comprehensive FAQ data with food tags and premium status
const ALL_FAQS = [
  // ==================== FREE QUESTIONS (4 Basic/Obvious Questions) ====================
  {
    id: 'water-hydration',
    question: "How much water should I drink during pregnancy?",
    answer: "Aim for 8-10 glasses (about 2.3 liters) of water daily during pregnancy. Proper hydration helps form amniotic fluid, carry nutrients to your baby, aids digestion, and prevents constipation. Signs you need more water: dark urine, dizziness, dry mouth. If plain water is boring, add lemon or cucumber slices.",
    category: 'nutrition',
    foodTags: ['water'],
    isPremium: false
  },
  {
    id: 'fruits-vegetables-safe',
    question: "Are fruits and vegetables safe during pregnancy?",
    answer: "Yes! Fruits and vegetables are essential during pregnancy, providing vitamins, minerals, and fiber. Just wash them thoroughly under running water before eating to remove bacteria and pesticide residue. Cut away any bruised or damaged areas. Enjoy a variety of colorful produce daily.",
    category: 'produce',
    foodTags: ['vegetables', 'fruits'],
    isPremium: false
  },
  {
    id: 'cooked-meat-safe',
    question: "Is well-cooked meat safe to eat during pregnancy?",
    answer: "Yes! Well-cooked meat is safe and nutritious during pregnancy. Always cook meat to proper internal temperatures: chicken/poultry to 165°F (74°C), ground meat to 160°F (71°C), whole cuts like steak to 145°F (63°C). Avoid pink or red meat, and use a food thermometer to be sure.",
    category: 'proteins',
    foodTags: ['chicken', 'beef', 'meat'],
    isPremium: false
  },
  {
    id: 'prenatal-vitamins',
    question: "Should I take prenatal vitamins?",
    answer: "Yes! Prenatal vitamins are recommended for all pregnant women. They ensure you get adequate folic acid (prevents birth defects), iron (prevents anemia), calcium (for baby's bones), and DHA (for brain development). Start taking them as soon as you're trying to conceive or find out you're pregnant. Ask your healthcare provider for recommendations.",
    category: 'nutrition',
    foodTags: [],
    isPremium: false
  },

  // ==================== PREMIUM QUESTIONS (All detailed/specific questions) ====================
  {
    id: 'foods-avoid-completely',
    question: "What foods should I avoid completely during pregnancy?",
    answer: "AVOID COMPLETELY: 1) Raw/undercooked meat, poultry, eggs, and seafood. 2) High-mercury fish: shark, swordfish, king mackerel, tilefish, bigeye tuna. 3) Unpasteurized dairy products and juices. 4) Raw sprouts (alfalfa, clover, mung bean). 5) Deli meats and hot dogs unless heated to steaming. 6) Refrigerated smoked seafood (lox) unless cooked. 7) Alcohol - no safe amount. 8) Raw cookie dough/batter. 9) Soft cheeses from unpasteurized milk. These foods carry risks of Listeria, Salmonella, Toxoplasma, or mercury exposure which can harm your baby.",
    category: 'safety',
    foodTags: ['tuna', 'sprouts', 'cheese', 'eggs'],
    isPremium: true
  },
  {
    id: 'deli-meat-safety',
    question: "Can I eat deli meats, hot dogs, or cold cuts?",
    answer: "Deli meats, hot dogs, and cold cuts can harbor Listeria bacteria which is dangerous during pregnancy. TO EAT SAFELY: Heat deli meats and hot dogs until steaming hot (165°F/74°C) before eating. This kills any potential Listeria. AVOID: Cold deli sandwiches, unheated hot dogs, bologna, salami eaten cold. SAFER OPTIONS: Freshly cooked meat sliced at home, or heated deli meat in hot sandwiches. Listeria can grow even at refrigerator temperatures, making these foods higher risk.",
    category: 'proteins',
    foodTags: ['deli', 'hot-dogs'],
    isPremium: true
  },
  {
    id: 'soft-cheese-brie',
    question: "Can I eat soft cheeses like brie, feta, or blue cheese?",
    answer: "SAFE: Soft cheeses made from PASTEURIZED milk (check the label). In the US, most commercial brie, feta, and blue cheese are pasteurized. AVOID: Unpasteurized or raw milk soft cheeses, often found at farmers markets or imported. Mold-ripened cheeses (brie, camembert) and blue-veined cheeses from unpasteurized milk carry Listeria risk. ALWAYS SAFE: Hard cheeses (cheddar, parmesan, swiss) regardless of pasteurization, as their low moisture prevents bacterial growth. When in doubt, heat cheese until bubbling hot.",
    category: 'dairy',
    foodTags: ['cheese', 'brie', 'feta', 'blue-cheese'],
    isPremium: true
  },
  {
    id: 'fish-seafood-guide',
    question: "What fish and seafood can I eat, and how much?",
    answer: "EAT 8-12 oz (2-3 servings) per week of LOW-MERCURY fish: salmon, shrimp, pollock, tilapia, cod, catfish, sardines, anchovies, trout. LIMIT: Albacore tuna to 6 oz/week (higher mercury than light tuna). AVOID COMPLETELY: Shark, swordfish, king mackerel, tilefish, bigeye tuna - these have dangerous mercury levels. All fish must be cooked to 145°F. No raw fish, sushi, sashimi, or ceviche. Mercury accumulates and can harm baby's developing brain and nervous system. Omega-3s from safe fish are crucial for baby's development.",
    category: 'seafood',
    foodTags: ['salmon', 'shrimp', 'tilapia', 'cod', 'tuna', 'sardines'],
    isPremium: true
  },
  {
    id: 'raw-eggs-safety',
    question: "Are raw eggs or foods with raw eggs safe?",
    answer: "NO - avoid raw or undercooked eggs due to Salmonella risk. AVOID: Runny yolks, sunny-side up, soft-boiled eggs, raw cookie dough/cake batter, homemade mayonnaise, homemade Caesar dressing, homemade eggnog, mousse, tiramisu. SAFE: Fully cooked eggs (firm whites AND yolks), commercial mayonnaise (made with pasteurized eggs), store-bought Caesar dressing, pasteurized egg products. EXCEPTION: Pasteurized eggs (sold in cartons) are safe for recipes requiring less cooking. Cook eggs to 160°F/71°C to be safe.",
    category: 'proteins',
    foodTags: ['eggs'],
    isPremium: true
  },
  {
    id: 'caffeine-limit',
    question: "How much caffeine is safe during pregnancy?",
    answer: "Limit caffeine to 200mg per day maximum. APPROXIMATE AMOUNTS: 12 oz brewed coffee = 95-200mg, 12 oz black tea = 47mg, 12 oz green tea = 30-50mg, 12 oz cola = 34mg, 1 oz dark chocolate = 20mg. High caffeine intake is linked to increased miscarriage risk and low birth weight. Remember caffeine is also in energy drinks, some medications, and chocolate. Decaf coffee still has 2-15mg. SAFEST: Limit to 1 cup of coffee daily and count other caffeine sources. If you're having difficulty conceiving or have history of miscarriage, consider avoiding caffeine entirely.",
    category: 'beverages',
    foodTags: ['coffee', 'tea', 'chocolate'],
    isPremium: true
  },
  {
    id: 'alcohol-pregnancy',
    question: "Can I drink any alcohol during pregnancy?",
    answer: "NO SAFE AMOUNT of alcohol has been established during pregnancy. Complete avoidance is recommended by all major health organizations (CDC, ACOG, WHO). Alcohol crosses the placenta directly to baby and can cause Fetal Alcohol Spectrum Disorders (FASD), leading to physical abnormalities, learning disabilities, and behavioral problems. This includes beer, wine, and spirits - no type is safer. If you drank before knowing you were pregnant, stop now and talk to your healthcare provider. Cooking with wine: most alcohol cooks off if simmered 2+ hours, but avoid wine sauces with less cooking time.",
    category: 'beverages',
    foodTags: ['alcohol', 'wine', 'beer'],
    isPremium: true
  },
  {
    id: 'unpasteurized-juice-milk',
    question: "Is unpasteurized juice, cider, or raw milk safe?",
    answer: "NO - avoid all unpasteurized/raw products. This includes: raw milk, raw milk cheese, fresh-squeezed unpasteurized juice, fresh cider from farm stands. These can contain dangerous bacteria including Listeria, Salmonella, and E. coli. ALWAYS CHOOSE: Pasteurized milk and dairy, pasteurized 100% juice (check labels), commercially bottled juice. If you're unsure about cider or juice freshness, boil it first. Farmers market products are higher risk unless specifically labeled pasteurized. Pasteurization kills harmful bacteria without significantly affecting nutrition.",
    category: 'dairy',
    foodTags: ['milk', 'cheese'],
    isPremium: true
  },
  {
    id: 'washing-produce-sprouts',
    question: "How should I wash produce, and are raw sprouts safe?",
    answer: "WASHING PRODUCE: Rinse all fruits and vegetables under running water, even if you'll peel them (bacteria transfers when cutting). Use a brush for firm produce like melons and potatoes. Don't use soap or commercial produce washes - they're not more effective. Cut away damaged areas. Wash prepackaged salads again. RAW SPROUTS: AVOID COMPLETELY during pregnancy. All raw sprouts (alfalfa, clover, radish, mung bean) are grown in warm, humid conditions where bacteria thrive. Even 'clean' looking sprouts can harbor Salmonella or E. coli. Only eat sprouts if thoroughly cooked until steaming.",
    category: 'produce',
    foodTags: ['sprouts', 'vegetables'],
    isPremium: true
  },
  {
    id: 'eating-for-two-myth',
    question: "How many extra calories do I need? Am I 'eating for two'?",
    answer: "MYTH BUSTED: You're not eating for two adults! ACTUAL NEEDS: First trimester - no extra calories needed. Second trimester - about 340 extra calories/day. Third trimester - about 450 extra calories/day. That's roughly equivalent to a yogurt parfait with fruit and granola - not double portions! FOCUS ON: Quality over quantity. Nutrient-dense foods, adequate protein (75-100g daily), iron, folate, calcium, omega-3s. WEIGHT GAIN GUIDELINES (varies by pre-pregnancy BMI): Underweight 28-40 lbs, Normal weight 25-35 lbs, Overweight 15-25 lbs, Obese 11-20 lbs. Consult your provider for personalized guidance.",
    category: 'nutrition',
    foodTags: ['yogurt'],
    isPremium: true
  },
  {
    id: 'liver-vitamin-a',
    question: "Is liver or high-vitamin-A foods safe?",
    answer: "LIMIT liver during pregnancy. Liver is extremely high in retinol (preformed vitamin A). Too much retinol can cause birth defects, especially in the first trimester. RECOMMENDATIONS: Avoid liver pâté entirely. If eating liver, limit to very small portions (1-2 oz) no more than once a month. Avoid vitamin A supplements (retinol form). SAFE: Beta-carotene from plants (carrots, sweet potatoes) - your body converts only what it needs. Prenatal vitamins with vitamin A as beta-carotene, not retinol. Check supplement labels carefully.",
    category: 'proteins',
    foodTags: ['liver', 'carrots', 'sweet potato'],
    isPremium: true
  },
  {
    id: 'food-handling-safety',
    question: "What about eating out, buffets, and food handling safety?",
    answer: "EATING OUT: Choose restaurants with good hygiene ratings. Avoid rare/medium meat - request well-done. Skip raw bars, sushi restaurants (unless cooked options), and soft-serve ice cream machines. BUFFETS: Higher risk - food may sit at unsafe temperatures. If eating buffet, choose freshly replenished hot items. LEFTOVERS: Refrigerate within 2 hours. Eat within 2-3 days (not 4-5). Reheat to 165°F/74°C until steaming. FOOD HANDLING: Follow 'Clean, Separate, Cook, Chill.' Wash hands often, separate raw meat from other foods, cook to safe temps, refrigerate promptly. Avoid pre-cut melons left out, food from dented cans.",
    category: 'safety',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'sushi-sashimi-ceviche',
    question: "Can I eat sushi, sashimi, ceviche, or raw shellfish?",
    answer: "AVOID all raw and undercooked seafood during pregnancy. This includes: sushi with raw fish, sashimi, raw oysters, raw clams, ceviche (acid doesn't kill parasites), poke bowls with raw fish, tartare. RISKS: Parasites, Vibrio, Listeria, and other bacteria that can cause serious illness in pregnancy. SAFE ALTERNATIVES: Cooked sushi rolls (shrimp tempura, eel, cooked crab), vegetable rolls, fully cooked poke bowls. Many sushi restaurants offer 'pregnancy-safe' options - just ask! All fish should be cooked to 145°F/63°C internal temperature.",
    category: 'seafood',
    foodTags: ['sushi', 'shrimp', 'crab'],
    isPremium: true
  },
  {
    id: 'smoked-salmon-lox',
    question: "Can I eat smoked salmon, lox, or smoked seafood?",
    answer: "REFRIGERATED smoked seafood (lox, nova-style salmon, kippered fish, smoked trout) should be AVOIDED unless cooked into a dish to 165°F. It can contain Listeria which grows even at refrigerator temperatures. SAFE OPTIONS: Canned or shelf-stable smoked fish (heat-processed). Smoked salmon cooked in a hot dish (casserole, quiche, hot bagel with melted cream cheese and heated lox). Hot-smoked fish that reached 145°F during smoking process. When in doubt, heat smoked fish until steaming before eating.",
    category: 'seafood',
    foodTags: ['salmon', 'smoked-fish'],
    isPremium: true
  },
  {
    id: 'nuts-seeds-safety',
    question: "Are nuts and seeds safe during pregnancy?",
    answer: "YES! Nuts and seeds are excellent during pregnancy - rich in healthy fats, protein, fiber, and minerals. SAFE OPTIONS: Almonds, walnuts, cashews, peanuts, sunflower seeds, pumpkin seeds, chia seeds, flax seeds (ground). EXCEPTION: Brazil nuts - limit to 1-2 per day due to very high selenium content. ALLERGY NOTE: Current research suggests eating nuts during pregnancy does NOT increase baby's allergy risk and may actually help prevent allergies. Avoid if YOU have a nut allergy. Choose unsalted when possible to limit sodium.",
    category: 'nuts',
    foodTags: ['almonds', 'walnuts', 'peanuts', 'chia seeds', 'flax seeds'],
    isPremium: true
  },
  {
    id: 'premade-deli-salads',
    question: "Are premade deli salads safe (tuna, egg, chicken salad)?",
    answer: "HIGHER RISK - best to avoid or make fresh at home. Store-made deli salads (tuna salad, egg salad, chicken salad, potato salad) have higher Listeria risk due to: handling by multiple people, time sitting at deli counter, mayo-based mixture at variable temperatures. SAFER OPTIONS: Make your own at home with fresh ingredients. If buying premade, choose sealed packages with clear dates, eat immediately, and ensure it's been properly refrigerated. Avoid deli salads from salad bars or that have been sitting out.",
    category: 'safety',
    foodTags: ['tuna', 'chicken', 'eggs', 'potato'],
    isPremium: true
  },
  {
    id: 'important-nutrients',
    question: "What nutrients are most important during pregnancy?",
    answer: "KEY NUTRIENTS: 1) FOLIC ACID (400-800mcg) - prevents neural tube defects; leafy greens, fortified cereals, prenatal vitamin. 2) IRON (27mg) - prevents anemia, supports blood volume; red meat, spinach, beans, fortified cereals. 3) CALCIUM (1000mg) - builds baby's bones; dairy, fortified plant milk, leafy greens. 4) DHA/OMEGA-3 (200-300mg) - brain development; fatty fish, fish oil, algae supplements. 5) PROTEIN (75-100g) - tissue growth; meat, eggs, dairy, legumes. 6) VITAMIN D (600IU) - calcium absorption; sunlight, fortified foods, supplements. 7) CHOLINE (450mg) - brain development; eggs, liver, soybeans. Take prenatal vitamins to cover gaps.",
    category: 'nutrition',
    foodTags: ['spinach', 'eggs', 'salmon', 'beans', 'milk'],
    isPremium: true
  },
  {
    id: 'pregnancy-cravings',
    question: "What do pregnancy cravings mean?",
    answer: "Cravings are extremely common - up to 90% of pregnant women experience them. COMMON CRAVINGS: Sweet foods, salty/savory foods, sour/citrus, spicy foods, specific textures. WHAT THEY MAY MEAN: Often hormone-driven rather than nutrient deficiency. Some theories: craving dairy = calcium need, craving red meat = iron need. But there's limited scientific evidence for this. ICE CRAVINGS (pica): May indicate iron deficiency - tell your provider. MANAGING CRAVINGS: Indulge in moderation when cravings are for safe foods. Find healthier alternatives when possible. If craving non-food items (dirt, clay), talk to your doctor immediately.",
    category: 'general',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'seafood-benefits',
    question: "Should I avoid all seafood, or is some beneficial?",
    answer: "DON'T avoid all seafood - low-mercury fish is HIGHLY BENEFICIAL! Omega-3 fatty acids (DHA, EPA) from fish are crucial for baby's brain and eye development. Studies show babies of mothers who ate fish have better developmental outcomes. EAT 8-12 oz weekly of: salmon, sardines, anchovies, herring, trout, shrimp, tilapia, cod, pollock. AVOID: High-mercury fish (shark, swordfish, king mackerel, tilefish, bigeye tuna) and all raw fish. If you don't eat fish, consider a DHA supplement from fish oil or algae. The benefits of low-mercury fish far outweigh the risks.",
    category: 'seafood',
    foodTags: ['salmon', 'sardines', 'shrimp', 'tilapia', 'cod'],
    isPremium: true
  },
  {
    id: 'spicy-food-pregnancy',
    question: "Can I eat spicy food during pregnancy?",
    answer: "YES - spicy food is safe during pregnancy and won't harm your baby. However, it may worsen common pregnancy symptoms: HEARTBURN: Spicy foods can trigger or worsen acid reflux, which is already common in pregnancy. DIGESTIVE DISCOMFORT: May cause stomach upset or diarrhea in some. If you tolerated spicy food before pregnancy and still enjoy it, continue eating it. TIPS: Have smaller portions of spicy food. Avoid lying down right after eating spicy meals. Keep antacids handy. Spicy food does NOT induce labor (despite the old wives' tale) and does NOT affect baby's temperament.",
    category: 'general',
    foodTags: ['spicy'],
    isPremium: true
  },
  {
    id: 'herbal-tea-supplements',
    question: "Are herbal teas and supplements safe during pregnancy?",
    answer: "SOME are safe, others should be avoided. GENERALLY SAFE: Ginger tea (great for nausea - limit to 1g dried ginger daily), peppermint, rooibos, lemon balm in moderation. USE WITH CAUTION: Chamomile (limit 1-2 cups daily), raspberry leaf (usually only in third trimester). AVOID: Licorice root, dong quai, pennyroyal, blue/black cohosh, St. John's wort, ginseng, comfrey, ephedra, kava. SUPPLEMENTS: Only take supplements approved by your provider. Avoid herbal weight loss or cleansing products. Prenatal vitamins are safe and recommended. 'Natural' doesn't mean safe during pregnancy.",
    category: 'beverages',
    foodTags: ['ginger', 'tea', 'peppermint'],
    isPremium: true
  },
  {
    id: 'fast-food-processed',
    question: "Is fast food or processed food safe during pregnancy?",
    answer: "OCCASIONAL fast food and processed food is okay, but limit it. CONCERNS: High sodium can worsen pregnancy swelling and blood pressure. High saturated fat doesn't support optimal health. Empty calories without nutrients baby needs. Hidden ingredients (MSG, excess sugar). BETTER CHOICES: Grilled options over fried. Skip raw salads at fast food (contamination risk). Choose restaurants with visible kitchen/hygiene. Avoid soft-serve ice cream machines (bacterial growth risk). BALANCE: If eating fast food, balance with nutrient-dense foods rest of day. Meal prep when possible for healthier convenient options.",
    category: 'general',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'prenatal-vitamins-detailed',
    question: "Do I need prenatal vitamins, and when should I start?",
    answer: "YES - prenatal vitamins are strongly recommended. START: Ideally 1-3 months before conception, but start as soon as you know you're pregnant. KEY NUTRIENTS IN PRENATALS: Folic acid (400-800mcg) - critical for preventing neural tube defects in first 28 days. Iron - prevents anemia. Calcium - bones. DHA - brain development. Vitamin D, B vitamins, iodine. FOOD ISN'T ENOUGH: Even with perfect diet, it's hard to get adequate folic acid and iron. Prenatal vitamins are an insurance policy. TIPS: Take with food if nauseous. If you can't tolerate pills, try gummies (check they contain iron). Continue through breastfeeding.",
    category: 'nutrition',
    foodTags: [],
    isPremium: true
  },
  {
    id: 'foods-for-symptoms',
    question: "What foods help with nausea, constipation, or anemia?",
    answer: "FOR NAUSEA: Ginger (tea, candies, ale), plain crackers before rising, cold foods (less smell), small frequent meals, lemon/citrus, bland foods (BRAT: bananas, rice, applesauce, toast), protein snacks. FOR CONSTIPATION: High-fiber foods (fruits, vegetables, whole grains, beans), prunes/prune juice (natural laxative), plenty of water, physical activity. FOR ANEMIA: Iron-rich foods - red meat (best absorbed), spinach, lentils, fortified cereals, beans. Pair plant iron with vitamin C for absorption. Avoid calcium/coffee/tea with iron-rich meals. Your provider may recommend iron supplements.",
    category: 'nutrition',
    foodTags: ['ginger', 'banana', 'rice', 'spinach', 'lentils', 'beans'],
    isPremium: true
  },
  {
    id: 'miscarriage-foods',
    question: "Can certain foods cause miscarriage or preterm birth?",
    answer: "HIGH-RISK FOODS TO AVOID: 1) Alcohol - linked to miscarriage, stillbirth, FASD. 2) High-mercury fish - can affect fetal brain development. 3) Listeria sources (deli meat, unpasteurized products) - can cause miscarriage, stillbirth, severe illness. 4) Raw/undercooked foods - infection risk. LESS CLEAR EVIDENCE: Very high caffeine (>300mg) may increase miscarriage risk. Pineapple, papaya, spicy food - myths with no solid evidence when eaten in normal amounts. IMPORTANT: Most miscarriages are due to chromosomal abnormalities, not food. Focus on avoiding clearly risky foods and eating a balanced diet. Talk to your provider about specific concerns.",
    category: 'safety',
    foodTags: ['pineapple', 'papaya', 'coffee'],
    isPremium: true
  },
  // Additional specific food questions
  {
    id: 'sushi-pregnancy',
    question: "Can I eat sushi while pregnant?",
    answer: "Raw fish sushi should be avoided during pregnancy due to risk of parasites and bacteria. However, cooked sushi rolls (like shrimp tempura, eel, or fully cooked fish) and vegetable rolls are generally safe options. Many sushi restaurants offer pregnancy-safe options - just ask!",
    category: 'seafood',
    foodTags: ['sushi', 'salmon', 'tuna', 'shrimp'],
    isPremium: true
  },
  {
    id: 'tuna-pregnancy',
    question: "Can I eat tuna while pregnant?",
    answer: "Light canned tuna (skipjack) is lower in mercury - you can have 2-3 servings per week. Albacore (white) tuna has more mercury - limit to 1 serving per week. Avoid bigeye tuna entirely. One serving is about 4 ounces (113g). Always choose cooked tuna, never raw.",
    category: 'seafood',
    foodTags: ['tuna'],
    isPremium: true
  },
  {
    id: 'rare-steak',
    question: "Can I eat rare steak while pregnant?",
    answer: "NO - all beef should be cooked to at least 145°F (63°C) with a 3-minute rest time during pregnancy. Medium-rare and rare steaks may contain harmful bacteria like Toxoplasma and E. coli. Order steaks medium-well or well-done. Use a meat thermometer to check. Ground beef should reach 160°F.",
    category: 'proteins',
    foodTags: ['beef', 'steak'],
    isPremium: true
  },
  {
    id: 'coffee-pregnancy',
    question: "Can I drink coffee while pregnant?",
    answer: "Yes, in moderation. Limit caffeine to 200mg per day - about one 12oz cup of brewed coffee. High caffeine intake is linked to increased miscarriage risk. Count caffeine from all sources including tea, cola, and chocolate. Consider switching to half-caff or decaf. Some women are more sensitive to caffeine during pregnancy.",
    category: 'beverages',
    foodTags: ['coffee'],
    isPremium: true
  },
  {
    id: 'herbal-tea-safety',
    question: "Can I drink herbal tea while pregnant?",
    answer: "SAFE in moderation: Ginger (great for nausea), peppermint, rooibos, lemon balm. LIMIT: Chamomile to 1-2 cups daily. AVOID: Licorice root, dong quai, pennyroyal, blue/black cohosh, excessive amounts of any single herb. Herbal teas are unregulated - choose reputable brands. Always check with your provider about specific herbal teas.",
    category: 'beverages',
    foodTags: ['tea', 'ginger', 'peppermint'],
    isPremium: true
  },
  {
    id: 'pineapple-myth',
    question: "Is pineapple safe during pregnancy?",
    answer: "YES - this is a myth. Pineapple is safe during pregnancy in normal food amounts. It contains bromelain, which in VERY large concentrated amounts could theoretically affect the cervix, but you would need to eat 7-10 whole pineapples at once. Enjoy pineapple as part of a balanced diet - it's a good source of vitamin C and manganese.",
    category: 'produce',
    foodTags: ['pineapple'],
    isPremium: true
  },
  {
    id: 'papaya-safety',
    question: "Can I eat papaya while pregnant?",
    answer: "RIPE papaya is SAFE and nutritious during pregnancy, providing vitamin C and folate. However, UNRIPE (green) papaya contains papain and latex which may cause uterine contractions and should be avoided. Ensure papaya is fully ripe (yellow/orange skin, soft flesh) before eating. Avoid papaya enzyme supplements.",
    category: 'produce',
    foodTags: ['papaya'],
    isPremium: true
  },
  {
    id: 'grapes-pregnancy',
    question: "Are grapes safe during pregnancy?",
    answer: "YES - grapes are safe during pregnancy! They provide vitamins, antioxidants (especially red/purple grapes), and hydration. Wash thoroughly before eating. The myth about grapes causing miscarriage has no scientific basis. Some women avoid grapes in late pregnancy due to natural compounds, but normal consumption is fine. Don't eat excessive amounts due to sugar content.",
    category: 'produce',
    foodTags: ['grapes'],
    isPremium: true
  },
  {
    id: 'sprouts-safety',
    question: "Are sprouts safe during pregnancy?",
    answer: "NO - raw sprouts should be AVOIDED entirely during pregnancy. All raw sprouts (alfalfa, clover, radish, mung bean, broccoli sprouts) are grown in warm, humid conditions ideal for bacterial growth. Even 'clean' looking sprouts can harbor Salmonella, E. coli, or Listeria. Only eat sprouts if thoroughly cooked until steaming hot. This includes sprouts on sandwiches and in salads.",
    category: 'produce',
    foodTags: ['sprouts'],
    isPremium: true
  },
  {
    id: 'brie-cheese',
    question: "Is brie cheese safe during pregnancy?",
    answer: "Brie made from PASTEURIZED milk is safe during pregnancy. In the US, most commercial brie is pasteurized - check the label. AVOID unpasteurized brie or imported soft-ripened cheeses unless you're certain they're pasteurized. Even pasteurized brie should be avoided from deli counters (Listeria risk). When in doubt, heat until bubbling hot - this kills any potential bacteria.",
    category: 'dairy',
    foodTags: ['brie', 'cheese'],
    isPremium: true
  }
];

// Helper function to get FAQs related to a food
const getRelatedFAQs = (foodName) => {
  const normalizedName = foodName.toLowerCase().replace(/\s+/g, '-');
  const foodWords = normalizedName.split('-');
  
  return ALL_FAQS.filter(faq => 
    faq.foodTags.some(tag => {
      const normalizedTag = tag.toLowerCase();
      // Exact match or the food name exactly matches a tag
      // Avoid partial matches like "water" matching "watermelon"
      return foodWords.includes(normalizedTag) || 
             normalizedTag === normalizedName ||
             faq.foodTags.map(t => t.toLowerCase()).includes(normalizedName);
    })
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

// Food Category Icons - Simple symbols for each category
const CATEGORY_ICONS = {
  'Fruits': '🍎',
  'Vegetables': '🥬',
  'Proteins': '🍗',
  'Meat & Protein': '🥩',
  'Fish & Seafood': '🐟',
  'Dairy': '🥛',
  'Grains': '🌾',
  'Beverages': '🥤',
  'Condiments': '🧂',
  'Desserts & Sweets': '🍰',
  'Nuts & Seeds': '🥜',
  'Legumes': '🫘',
  'Herbs & Spices': '🌿',
  'Street & Processed Foods': '🍔',
  'Eggs': '🥚',
  'Seafood': '🦐',
  'Poultry': '🍗',
  'default': '🍽️'
};

// Get icon for food category
const getCategoryIcon = (category) => {
  if (!category) return CATEGORY_ICONS.default;
  
  // Check for exact match first
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  
  // Check for partial matches
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('fruit')) return '🍎';
  if (lowerCat.includes('vegetable') || lowerCat.includes('veg')) return '🥬';
  if (lowerCat.includes('fish') || lowerCat.includes('seafood')) return '🐟';
  if (lowerCat.includes('meat') || lowerCat.includes('protein')) return '🥩';
  if (lowerCat.includes('dairy') || lowerCat.includes('milk') || lowerCat.includes('cheese')) return '🥛';
  if (lowerCat.includes('grain') || lowerCat.includes('bread') || lowerCat.includes('cereal')) return '🌾';
  if (lowerCat.includes('beverage') || lowerCat.includes('drink')) return '🥤';
  if (lowerCat.includes('nut') || lowerCat.includes('seed')) return '🥜';
  if (lowerCat.includes('egg')) return '🥚';
  if (lowerCat.includes('herb') || lowerCat.includes('spice')) return '🌿';
  if (lowerCat.includes('dessert') || lowerCat.includes('sweet')) return '🍰';
  if (lowerCat.includes('processed') || lowerCat.includes('fast') || lowerCat.includes('street')) return '🍔';
  if (lowerCat.includes('legume') || lowerCat.includes('bean')) return '🫘';
  if (lowerCat.includes('condiment') || lowerCat.includes('sauce')) return '🧂';
  
  return CATEGORY_ICONS.default;
};

// Food Card Component (for grid)
const FoodCard = ({ food, onClick, onNavigateToPremium, dietaryRestrictions = [], isPremiumUser = false }) => {
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const showLock = food.is_premium && !isPremiumUser;
  
  // Always use the standard label: "Generally Safe", "Limit Intake", or "Best Avoided"
  const safetyLabel = safetyConfig.label;
  
  // Get category icon
  const categoryIcon = getCategoryIcon(food.category);
  
  // Dynamic teaser messages based on safety level for premium foods
  const getTeaserMessage = () => {
    switch (food.safety) {
      case 'AVOID':
        return 'High-risk food — Unlock full safety details';
      case 'LIMIT':
        return 'Unlock portions, safe swaps & timing tips';
      case 'SAFE':
      default:
        return 'Unlock nutrition facts & preparation tips';
    }
  };

  // Handle click - if locked, go to premium page; otherwise open food detail
  const handleClick = () => {
    if (showLock && onNavigateToPremium) {
      onNavigateToPremium();
    } else {
      onClick(food);
    }
  };
  
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className={`food-list-item ${showLock ? 'premium-locked' : ''}`}
      onClick={handleClick}
    >
      <div className="food-list-icon">
        <span>{categoryIcon}</span>
      </div>
      <div className="food-list-left">
        <h3 className={`food-list-name ${showLock ? 'locked' : ''}`}>{food.name}</h3>
        <span className="food-list-category">{food.category}</span>
        {showLock && (
          <span className="food-list-upgrade-text">{getTeaserMessage()}</span>
        )}
      </div>
      <div className="food-list-right">
        <div className="food-list-safety" style={{ color: safetyConfig.color }}>
          <Check size={16} />
          <span>{safetyLabel}</span>
        </div>
        {showLock ? (
          <Lock size={18} className="food-list-lock" />
        ) : (
          <ChevronRight size={18} className="food-list-chevron" />
        )}
      </div>
      {showLock && (
        <div className="premium-corner-badge">
          <Lock size={14} />
        </div>
      )}
    </div>
  );
};

// Food Detail Modal - Matching your design
const FoodDetailModal = ({ food, onClose, dietaryRestrictions = [], openedFrom = null, isPremiumUser = false, onNavigateToPremium }) => {
  const [showFAQs, setShowFAQs] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!food) return null;
  
  // Check if this food requires premium access
  const isLocked = food.is_premium && !isPremiumUser;
  
  const safetyConfig = SAFETY_CONFIG[food.safety] || SAFETY_CONFIG.SAFE;
  const dietaryConcerns = checkDietaryConcerns(food, dietaryRestrictions);
  const relatedFAQs = getRelatedFAQs(food.name);

  // Determine back button text based on where modal was opened from
  const backButtonText = openedFrom === 'faq' ? 'Back to FAQ' : 'Back to Home';

  // Share data
  const shareTitle = `${food.name} - Pregnancy Food Safety`;
  const shareText = `Is ${food.name} safe during pregnancy? ${food.safety_label || safetyConfig.label}. Check out WhatToEat for pregnancy nutrition guidance!`;
  const shareUrl = window.location.href;

  // Share handlers
  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = { title: shareTitle, text: shareText, url: shareUrl };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
    } catch (error) {
      
    }
    // Show custom share menu
    setShowShareMenu(true);
  };

  const handleCopyLink = async () => {
    const fullText = `${shareTitle}\n\n${shareText}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      prompt('Copy this text to share:', fullText);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareText}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareText}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="food-detail-modal">
      <div className="modal-content-detail" onClick={e => e.stopPropagation()}>
        
        {/* Share Menu Modal */}
        {showShareMenu && (
          <div className="share-menu-overlay" onClick={() => setShowShareMenu(false)}>
            <div className="share-menu" onClick={e => e.stopPropagation()}>
              <div className="share-menu-header">
                <h3>Share "{food.name}"</h3>
                <button className="share-menu-close" onClick={() => setShowShareMenu(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="share-menu-options">
                <button className="share-option whatsapp" onClick={shareToWhatsApp}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
                <button className="share-option twitter" onClick={shareToTwitter}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>X (Twitter)</span>
                </button>
                <button className="share-option facebook" onClick={shareToFacebook}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
                <button className="share-option email" onClick={shareToEmail}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#EA4335">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>Email</span>
                </button>
                <button className="share-option copy" onClick={handleCopyLink}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#666">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Bar */}
        <div className="modal-header-bar">
          <button className="back-button" onClick={onClose} data-testid="back-to-home-btn">
            <ArrowLeft size={20} />
            <span>{backButtonText}</span>
          </button>
          <button 
            className="share-button" 
            data-testid="share-btn"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>

        {/* Food Title Section */}
        <div className="food-title-section">
          <div className="food-detail-icon">
            <span>{getCategoryIcon(food.category)}</span>
          </div>
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

        {/* Premium Lock Overlay - Show when content is premium but user is not subscribed */}
        {isLocked && (
          <div className="premium-lock-overlay" data-testid="premium-lock-overlay">
            <div className="premium-lock-content">
              <div className="premium-lock-icon">
                <Lock size={48} />
              </div>
              <h2>Premium Content</h2>
              <p>Get detailed nutrition facts, preparation tips, and safety information for {food.name}.</p>
              <p className="premium-lock-teaser">
                {food.safety === 'AVOID' 
                  ? 'Learn exactly why this food should be avoided and safe alternatives.'
                  : food.safety === 'LIMIT'
                  ? 'Get portion guidance, timing tips, and safer alternatives.'
                  : 'Unlock complete nutritional benefits and preparation guidance.'}
              </p>
              <button 
                className="premium-unlock-btn"
                onClick={() => {
                  onClose();
                  if (onNavigateToPremium) onNavigateToPremium();
                }}
                data-testid="unlock-premium-btn"
              >
                <Crown size={18} />
                <span>Unlock for $1.99</span>
              </button>
              <button className="premium-close-btn" onClick={onClose}>
                Maybe Later
              </button>
            </div>
          </div>
        )}

        {/* Only show detailed content if NOT locked */}
        {!isLocked && (
          <>
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

        {/* Medical Disclaimer Footer */}
        <div className="medical-disclaimer-footer" data-testid="medical-disclaimer">
          <div className="disclaimer-icon">
            <Info size={18} />
          </div>
          <div className="disclaimer-content">
            <p className="disclaimer-text">
              This is general nutrition guidance only — not medical advice. Consult your doctor, midwife, or healthcare provider for personalized advice.
            </p>
            <p className="disclaimer-sources">
              <strong>Sources:</strong> WHO (World Health Organization), FDA (Food and Drug Administration), CDC (Centers for Disease Control and Prevention), ACOG (American College of Obstetricians and Gynecologists), NHS (National Health Service)
            </p>
          </div>
        </div>
          </>
        )}

      </div>
    </div>
  );
};

// Category Filter
const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="category-filter-section">
      <div className="category-pills">
        <button
          className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
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
    <div className="safety-filter-section">
      <div className="safety-filter-label">
        <span>Filter by safety:</span>
        <Info size={14} className="info-icon" />
      </div>
      <div className="safety-pills">
        <button
          className={`safety-pill ${selectedSafety === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          All
        </button>
        {safetyLevels.map((level) => (
          <button
            key={level.key}
            className={`safety-pill ${selectedSafety === level.key ? 'active' : ''}`}
            onClick={() => onSelect(level.key)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// FAQ View Component with Premium Feature
const FAQView = ({ onBack, onNavigateToFood, onNavigateToCategory, onNavigateHome, foods, isPremium, onNavigateToPremium }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Food categories that map to home page filters
  const categoryMapping = {
    'vegetables': 'Vegetables',
    'vegetable': 'Vegetables',
    'fruits': 'Fruits',
    'fruit': 'Fruits',
    'dairy': 'Dairy',
    'proteins': 'Proteins',
    'protein': 'Proteins',
    'meat': 'Proteins',
    'meats': 'Proteins',
    'fish': 'Fish & Seafood',
    'seafood': 'Fish & Seafood',
    'grains': 'Grains',
    'grain': 'Grains',
    'beverages': 'Beverages',
    'beverage': 'Beverages',
    'drinks': 'Beverages',
    'nuts': 'Nuts & Seeds',
    'seeds': 'Nuts & Seeds',
    'condiments': 'Condiments',
    'desserts': 'Desserts & Sweets',
    'sweets': 'Desserts & Sweets',
    'legumes': 'Legumes',
    'herbs': 'Herbs & Spices',
    'spices': 'Herbs & Spices'
  };
  
  // Mapping of tags to actual food names in database
  const tagToFoodName = {
    'salmon': 'Salmon',
    'yogurt': 'Greek Yogurt',
    'shrimp': 'Shrimp',
    'cheese': 'Cheddar Cheese',
    'brie': 'Soft Cheese (Unpasteurized)',
    'feta': 'Feta Cheese (Pasteurized)',
    'tuna': 'Tuna (Light, Canned)',
    'eggs': 'Eggs',
    'coffee': 'Coffee',
    'tea': 'Green Tea',
    'chocolate': 'Dark Chocolate',
    'milk': 'Milk',
    'sprouts': 'Bean Sprouts',
    'liver': 'Liver',
    'sushi': 'Raw Sushi/Sashimi',
    'almonds': 'Almonds',
    'walnuts': 'Walnuts',
    'peanuts': 'Peanuts',
    'chia seeds': 'Chia Seeds',
    'flax seeds': 'Flax Seeds',
    'chicken': 'Chicken Breast',
    'beef': 'Beef (Lean)',
    'steak': 'Beef (Lean)',
    'pineapple': 'Pineapple',
    'papaya': 'Papaya (Ripe)',
    'grapes': 'Grapes',
    'ginger': 'Ginger',
    'spinach': 'Spinach',
    'lentils': 'Lentils',
    'beans': 'Black Beans',
    'banana': 'Banana',
    'rice': 'Brown Rice',
    'carrots': 'Carrots',
    'sweet potato': 'Sweet Potato',
    'tilapia': 'Tilapia',
    'cod': 'Cod',
    'sardines': 'Sardines',
    'crab': 'Crab',
    'potato': 'Potatoes',
    'peppermint': 'Peppermint Tea'
  };
  
  // Find food by tag name
  const findFoodByTag = (tag) => {
    if (!foods || foods.length === 0) return null;
    const normalizedTag = tag.toLowerCase();
    
    // First try exact mapping
    const mappedName = tagToFoodName[normalizedTag];
    if (mappedName) {
      const exactMatch = foods.find(food => 
        (food.name || '').toLowerCase() === mappedName.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }
    
    // Then try partial match
    return foods.find(food => {
      const foodName = (food.name || '').toLowerCase();
      return foodName.includes(normalizedTag) || normalizedTag.includes(foodName.split(' ')[0].toLowerCase());
    });
  };
  
  // Handle food tag click - either navigate to food or category
  const handleFoodTagClick = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Check if it's a category first
    const mappedCategory = categoryMapping[normalizedTag];
    if (mappedCategory && onNavigateToCategory) {
      onNavigateToCategory(mappedCategory);
      return;
    }
    
    // Otherwise, try to find the specific food
    const food = findFoodByTag(tag);
    if (food && onNavigateToFood) {
      onNavigateToFood(food);
    } else if (onNavigateToCategory) {
      // If no specific food found, try to match as a category search
      // This handles cases like "cheese" which could be a category-like search
      onNavigateToCategory(tag);
    }
  };
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'safety', label: 'Food Safety' },
    { id: 'seafood', label: 'Seafood' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'proteins', label: 'Meat & Eggs' },
    { id: 'produce', label: 'Produce' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'nuts', label: 'Nuts' },
    { id: 'general', label: 'General' }
  ];

  // Filter FAQs by category and search query
  const filteredFAQs = ALL_FAQS.filter(faq => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    // Search filter - only search in question and foodTags (not answer)
    if (!searchQuery.trim()) return matchesCategory;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      faq.question.toLowerCase().includes(query) ||
      (faq.foodTags && faq.foodTags.some(tag => tag.toLowerCase().includes(query)));
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    // Sort to prioritize matches in question over tag-only matches
    if (!searchQuery.trim()) return 0;
    
    const query = searchQuery.toLowerCase();
    
    const aInQuestion = a.question.toLowerCase().includes(query);
    const aInTags = a.foodTags && a.foodTags.some(tag => tag.toLowerCase().includes(query));
    const bInQuestion = b.question.toLowerCase().includes(query);
    const bInTags = b.foodTags && b.foodTags.some(tag => tag.toLowerCase().includes(query));
    
    // Priority: question match > tag match
    const aScore = (aInQuestion ? 2 : 0) + (aInTags ? 1 : 0);
    const bScore = (bInQuestion ? 2 : 0) + (bInTags ? 1 : 0);
    
    return bScore - aScore;
  });

  const handleFAQClick = (index, faq) => {
    if (faq.isPremium && !isPremium) {
      setShowPremiumModal(true);
    } else {
      setOpenIndex(openIndex === index ? null : index);
    }
  };

  return (
    <div className="page-view" data-testid="faq-view">
      <div className="page-content">
        <div className="faq-title-section">
          <h1>Most Asked Pregnancy Food Questions</h1>
          <p>Quick answers to the most common questions about food safety during pregnancy.</p>
        </div>

        {/* Search Bar */}
        <div className="faq-search-container">
          <div className="faq-search-wrapper">
            <Search size={18} className="faq-search-icon" />
            <input
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
              className="faq-search-input"
              data-testid="faq-search-input"
            />
            {searchQuery && (
              <button 
                className="faq-search-clear" 
                onClick={() => setSearchQuery('')}
                data-testid="faq-search-clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="faq-search-results">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        {/* Disclaimer Banner */}
        <div className="faq-disclaimer-banner">
          <p>This section provides educational nutrition information compiled from public health sources (WHO, CDC, NHS, ACOG). It does not replace professional medical advice.</p>
        </div>
        
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
        
        <div className="faq-list">
          {filteredFAQs.map((faq, index) => (
            <div key={faq.id} className={`faq-item ${faq.isPremium && !isPremium ? 'premium' : ''}`} data-testid={`faq-item-${faq.id}`}>
              <button 
                className="faq-question"
                onClick={() => handleFAQClick(index, faq)}
              >
                <div className="faq-question-content">
                  <span className="faq-question-text">{faq.question}</span>
                  {faq.isPremium && !isPremium && (
                    <span className="faq-premium-label">Tap to unlock with Premium</span>
                  )}
                </div>
                {faq.isPremium && !isPremium ? (
                  <div className="lock-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                ) : (
                  openIndex === index ? <ChevronUp size={20} /> : <ChevronRight size={20} />
                )}
              </button>
              {((!faq.isPremium || isPremium) && openIndex === index) && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                  {faq.foodTags.length > 0 && (
                    <div className="faq-related-foods">
                      <span className="related-label">Related foods:</span>
                      {faq.foodTags.slice(0, 5).map(tag => (
                        <button 
                          key={tag} 
                          className="food-tag clickable"
                          onClick={() => handleFoodTagClick(tag)}
                          data-testid={`food-tag-${tag}`}
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setShowPremiumModal(false)}>
              <X size={24} />
            </button>
            <div className="premium-modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Unlock Premium Access</h2>
            <p>Get complete pregnancy nutrition guidance with detailed safety information.</p>
            <ul className="premium-features">
              <li><Check size={16} /> <strong>All 24 high-risk foods</strong> — Full safety details & reasons to avoid</li>
              <li><Check size={16} /> <strong>39 limit foods</strong> — Exact portions, safe swaps & timing</li>
              <li><Check size={16} /> <strong>186 safe foods</strong> — Nutrition facts & preparation tips</li>
              <li><Check size={16} /> Source references (ACOG, CDC, FDA, WHO)</li>
            </ul>
            <button 
              className="premium-subscribe-btn"
              onClick={() => {
                setShowPremiumModal(false);
                if (onNavigateToPremium) onNavigateToPremium();
              }}
            >
              Unlock Premium - US$1.99
            </button>
            <p className="premium-price">One-time purchase • Access forever</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Topics View Component
const TopicsView = ({ onBack, onNavigateHome, isPremium, onNavigateToPremium }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  
  const topics = [
    {
      title: "First Trimester Nutrition",
      icon: "🌱",
      description: "Essential nutrients for early pregnancy development",
      tips: ["Focus on folate-rich foods like leafy greens", "Stay hydrated to combat morning sickness", "Eat small, frequent meals", "Prioritize protein for baby's cell growth"],
      isPremium: false  // FREE - First topic available to all
    },
    {
      title: "Foods to Avoid",
      icon: "⚠️",
      description: "Important restrictions during pregnancy",
      tips: ["Raw or undercooked meats and eggs", "High-mercury fish (shark, swordfish)", "Unpasteurized dairy products", "Alcohol - no safe amount established", "Excessive caffeine (limit to 200mg/day)"],
      isPremium: true  // PREMIUM
    },
    {
      title: "Managing Morning Sickness",
      icon: "🍋",
      description: "Foods that may help ease nausea",
      tips: ["Ginger tea or ginger candies", "Plain crackers before getting up", "Cold foods may be more tolerable", "Avoid strong-smelling foods", "Eat small portions frequently"],
      isPremium: true  // PREMIUM
    },
    {
      title: "Iron & Preventing Anemia",
      icon: "💪",
      description: "Building healthy blood for you and baby",
      tips: ["Red meat is the best iron source", "Pair plant iron with vitamin C", "Cook in cast iron when possible", "Avoid calcium with iron-rich meals", "Consider iron-fortified cereals"],
      isPremium: true  // PREMIUM
    },
    {
      title: "Gestational Diabetes Nutrition",
      icon: "🩺",
      description: "Managing blood sugar through diet during pregnancy",
      tips: [
        "Choose complex carbs over simple sugars",
        "Pair carbs with protein and healthy fats",
        "Eat smaller, more frequent meals",
        "Monitor portion sizes of starchy foods",
        "Include fiber-rich vegetables at every meal",
        "Limit fruit juice and sugary drinks",
        "Choose whole grains over refined grains"
      ],
      isPremium: false  // FREE - Important health condition
    },
    {
      title: "Preeclampsia & Nutrition",
      icon: "❤️",
      description: "Dietary factors for blood pressure management",
      tips: [
        "Adequate calcium intake (1000mg daily)",
        "Foods rich in potassium (bananas, potatoes)",
        "Limit sodium/salt intake",
        "Include magnesium-rich foods (nuts, seeds)",
        "Stay well hydrated",
        "Eat plenty of fruits and vegetables",
        "Include lean protein at each meal"
      ],
      isPremium: true  // PREMIUM
    },
    {
      title: "Calcium & Bone Health",
      icon: "🦴",
      description: "Supporting baby's skeletal development",
      tips: ["Dairy products are excellent sources", "Fortified plant milks work too", "Sardines with bones are calcium-rich", "Leafy greens provide some calcium", "Vitamin D helps calcium absorption"],
      isPremium: true  // PREMIUM
    },
    {
      title: "Third Trimester Focus",
      icon: "👶",
      description: "Preparing for delivery and breastfeeding",
      tips: ["Omega-3s for brain development", "Dates may help with labor prep", "Keep protein intake high", "Stay hydrated for amniotic fluid", "Prepare freezer meals for postpartum"],
      isPremium: true  // PREMIUM
    }
  ];

  const handleTopicClick = (index, topic) => {
    if (topic.isPremium && !isPremium) {
      // Show premium modal
      if (onNavigateToPremium) {
        onNavigateToPremium();
      }
      return;
    }
    // Toggle expanded state
    setExpandedTopic(expandedTopic === index ? null : index);
  };

  return (
    <div className="page-view" data-testid="topics-view">
      <div className="page-content">
        <p className="page-intro">Learn about pregnancy nutrition topics.</p>
        
        <div className="topics-grid">
          {topics.map((topic, index) => {
            const isLocked = topic.isPremium && !isPremium;
            const isExpanded = expandedTopic === index && !isLocked;
            
            return (
              <div 
                key={index} 
                className={`topic-card ${isLocked ? 'locked' : ''} ${isExpanded ? 'expanded' : ''}`}
                data-testid={`topic-card-${index}`}
                onClick={() => handleTopicClick(index, topic)}
              >
                {isLocked && (
                  <div className="topic-premium-badge">
                    <Lock size={14} />
                    <span>Premium</span>
                  </div>
                )}
                <div className="topic-header">
                  <span className="topic-icon">{topic.icon}</span>
                  <h3>{topic.title}</h3>
                </div>
                <p className="topic-description">{topic.description}</p>
                
                {isLocked ? (
                  <div className="topic-locked-content">
                    <p className="topic-locked-message">Unlock premium to access this topic</p>
                    <button className="topic-unlock-btn">
                      <Lock size={14} />
                      Unlock Premium
                    </button>
                  </div>
                ) : (
                  <ul className={`topic-tips ${isExpanded ? 'show' : ''}`}>
                    {topic.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>
                        <Check size={14} className="tip-check" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {!isLocked && (
                  <button className="topic-expand-btn">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {isExpanded ? 'Show less' : 'Show tips'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// About View Component
const AboutView = ({ onBack, onNavigateHome }) => {
  const [showSources, setShowSources] = useState(false);
  const [sourcesError, setSourcesError] = useState(false);
  
  if (showSources) {
    // Import MedicalSources directly instead of lazy loading to avoid production issues
    const MedicalSourcesComponent = require('./components/MedicalSources').default;
    
    if (!MedicalSourcesComponent) {
      console.error('MedicalSources component failed to load');
      return (
        <div className="page-view" data-testid="sources-view">
          <div className="page-content">
            <div className="about-section">
              <h3>Medical Sources</h3>
              <p>Unable to load medical sources. Please try again later.</p>
              <button 
                className="sources-link"
                onClick={() => setShowSources(false)}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="page-view" data-testid="sources-view">
        <div className="page-content">
          <MedicalSourcesComponent onClose={() => setShowSources(false)} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-view" data-testid="about-view">
      <div className="page-content">
        <div className="about-section">
          <p className="version" style={{textAlign: 'center', marginBottom: '1rem'}}>Version 1.0.7</p>
        </div>

        <div className="about-section">
          <h3>About This App</h3>
          <p>
            WhatToEat is a pregnancy nutrition guide designed to help expectant mothers make informed food choices. 
            Browse our database of 288+ foods with pregnancy-specific safety information, nutritional benefits, 
            and preparation tips.
          </p>
        </div>

        <div className="about-section">
          <h3>Features</h3>
          <ul className="feature-list">
            <li><Check size={16} /> 288+ foods with pregnancy safety ratings</li>
            <li><Check size={16} /> Instant search and filtering</li>
            <li><Check size={16} /> Personalized dietary restriction alerts</li>
            <li><Check size={16} /> Nutritional benefits and precautions</li>
            <li><Check size={16} /> Preparation tips for safe consumption</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>Medical Sources & References</h3>
          <p>
            Our food safety information is compiled from trusted medical sources including ACOG, FDA, CDC, WHO, and more.
          </p>
          <button 
            className="sources-link"
            onClick={() => setShowSources(true)}
            data-testid="view-sources-btn"
          >
            <BookOpen size={18} />
            View All Medical Sources & Citations
          </button>
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
          <p className="copyright">© 2026 PenX Technologies. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

// Disclaimer Page Component
const DisclaimerPage = ({ onAccept }) => {
  return (
    <div className="onboarding-page disclaimer-page-v2" data-testid="disclaimer-page">
      {/* Header */}
      <div className="disclaimer-header">
        <div className="disclaimer-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
        <p className="disclaimer-subtitle">Pregnancy Nutrition Guide</p>
        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      {/* Content Card */}
      <div className="disclaimer-card">
        <div className="disclaimer-card-header">
          <div className="notice-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>Important Notice</h2>
            <p>Please read before continuing</p>
          </div>
        </div>

        <div className="disclaimer-points">
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>This app provides <strong>general educational information</strong> about nutrition during pregnancy compiled from public health sources.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>This is <strong>not medical advice</strong>. It does not replace consultation with qualified healthcare professionals.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>Individual circumstances vary. Please consult your healthcare provider for personalized guidance about your diet and nutrition.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>If you experience any concerning symptoms, <strong>seek medical attention immediately</strong>. Do not rely on this app for medical decisions.</p>
          </div>
        </div>

        <div className="disclaimer-agreement">
          <p>By continuing, you acknowledge that you have read and understood this disclaimer, and agree that this app is for educational purposes only.</p>
        </div>

        <p className="disclaimer-copyright">© 2026 PenX Technologies. All Rights Reserved.</p>
      </div>

      {/* Button */}
      <button 
        className="disclaimer-btn"
        onClick={onAccept}
        data-testid="disclaimer-accept-btn"
      >
        <span>I Understand</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// Create Account Page Component - Enhanced with Reviewer Login for Apple Review
const CreateAccountPage = ({ onNext, onBack, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Email validation
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // DIRECT LOGIN FUNCTION - No delays, no blockers
  const loginUser = async (loginEmail, loginPassword) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', loginEmail);
    console.log('API URL:', process.env.REACT_APP_BACKEND_URL);
    
    setIsLoading(true);
    setError('');
    
    try {
      // Build API URL - ensure it's production URL
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const loginUrl = `${apiUrl}/api/login`;
      
      console.log('Calling:', loginUrl);
      
      // Make the API call
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword 
        }),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Success - store user data
      const userData = {
        user_id: data.user?.user_id || 'user_' + Date.now(),
        email: data.user?.email || loginEmail,
        name: data.user?.name || 'User',
        auth_provider: 'email',
        token: data.token
      };
      
      console.log('Storing user data:', userData);
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userEmail', loginEmail);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', data.token);
      
      // Try Capacitor Preferences (non-blocking)
      try {
        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({ key: 'auth_user', value: JSON.stringify(userData) });
        }
      } catch (e) {
        console.log('Preferences save skipped:', e);
      }
      
      console.log('=== LOGIN SUCCESS ===');
      
      // Navigate to next screen
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      } else {
        onNext();
      }
      
      return true;
      
    } catch (err) {
      console.error('=== LOGIN ERROR ===', err);
      setError(err.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // REVIEWER LOGIN - Direct, no delays
  const handleReviewerLogin = () => {
    console.log('Reviewer button clicked');
    setEmail('reviewer@whattoeatapp.com');
    setPassword('Test12345');
    loginUser('reviewer@whattoeatapp.com', 'Test12345');
  };

  // EMAIL LOGIN - From form fields
  const handleEmailLogin = () => {
    console.log('Email login button clicked');
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    loginUser(email, password);
  };

  // SKIP LOGIN - Continue as guest
  const handleSkipLogin = () => {
    console.log('Skip login clicked');
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.setItem('user', JSON.stringify({ 
      user_id: 'guest_' + Date.now(),
      name: 'Guest',
      auth_provider: 'guest' 
    }));
    onNext();
  };

  return (
    <div className="onboarding-page" data-testid="create-account-page">
      {/* Back button at top for easy navigation */}
      <button 
        className="onboarding-back-arrow" 
        onClick={onBack}
        data-testid="create-account-top-back"
        aria-label="Go back"
      >
        <ChevronLeft size={24} />
      </button>
      
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
        <p className="onboarding-subtitle">Pregnancy Nutrition Guide</p>
        <div className="progress-dots">
          <span className="dot"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <div className="onboarding-card">
        <h2>Sign In</h2>
        <p className="card-subtitle">Sign in to access your preferences</p>

        {error && (
          <div className="auth-error-message" data-testid="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* REVIEWER LOGIN BUTTON - CRITICAL FOR APPLE REVIEW */}
        <button 
          className="social-btn reviewer" 
          onClick={handleReviewerLogin}
          disabled={isLoading}
          data-testid="reviewer-signin-btn"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            marginBottom: '16px',
            fontWeight: '600'
          }}
        >
          <User size={20} />
          <span>{isLoading ? 'Signing in...' : 'Continue as Reviewer'}</span>
        </button>

        <div className="divider">
          <span>Or sign in with email</span>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="reviewer@whattoeatapp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            data-testid="email-input"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="text"
            autoComplete="off"
            placeholder="Test12345"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            data-testid="password-input"
            style={{ WebkitTextSecurity: 'disc' }}
          />
        </div>

        <button 
          className="social-btn email-login" 
          onClick={handleEmailLogin}
          disabled={isLoading}
          data-testid="email-signin-btn"
          style={{
            background: '#1a1a2e',
            color: 'white',
            marginTop: '8px'
          }}
        >
          <span>{isLoading ? 'Signing in...' : 'Sign In with Email'}</span>
        </button>

        <div className="divider">
          <span>Or skip for now</span>
        </div>

        <button 
          className="social-btn skip" 
          onClick={handleSkipLogin}
          disabled={isLoading}
          data-testid="skip-signin-btn"
          style={{
            background: 'transparent',
            border: '1px solid #ddd',
            color: '#666'
          }}
        >
          <span>Continue as Guest</span>
        </button>

        <p className="security-note" style={{ marginTop: '16px' }}>Your data is stored securely</p>
      </div>

      <div className="onboarding-buttons">
        <button className="onboarding-btn secondary" onClick={onBack} data-testid="create-account-back-btn">
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <button 
          className="onboarding-btn primary" 
          onClick={handleEmailLogin} 
          data-testid="create-account-next-btn"
        >
          <span>Continue</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// Dietary Considerations Page Component
const DietaryConsiderationsPage = ({ onNext, onBack, dietaryRestrictions, onUpdateRestrictions }) => {
  const dietaryOptions = [
    { id: 'none', label: 'No Dietary Restrictions' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'halal', label: 'Halal' },
    { id: 'kosher', label: 'Kosher' },
    { id: 'nut-allergy', label: 'Nut Allergy' },
    { id: 'shellfish-allergy', label: 'Shellfish Allergy' },
    { id: 'food-allergies', label: 'Food Allergies' },
    { id: 'lactose-intolerance', label: 'Lactose Intolerance' },
    { id: 'gestational-diabetes', label: 'Gestational Diabetes' },
    { id: 'high-blood-pressure', label: 'High Blood Pressure' },
    { id: 'anemia', label: 'Anemia' }
  ];

  const toggleRestriction = (id) => {
    if (id === 'none') {
      // Clear all restrictions when "No Dietary Restrictions" is selected
      onUpdateRestrictions([]);
    } else {
      if (dietaryRestrictions.includes(id)) {
        onUpdateRestrictions(dietaryRestrictions.filter(r => r !== id));
      } else {
        onUpdateRestrictions([...dietaryRestrictions, id]);
      }
    }
  };

  const isNoneSelected = dietaryRestrictions.length === 0;

  return (
    <div className="onboarding-page" data-testid="dietary-considerations-page">
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
        <p className="onboarding-subtitle">Pregnancy Nutrition Guide</p>
        <div className="progress-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
        </div>
      </div>

      <div className="onboarding-card dietary-card-v2">
        <div className="dietary-card-header">
          <div className="dietary-icon">
            <Utensils size={24} />
          </div>
          <div>
            <h2>Dietary Considerations</h2>
            <p className="card-subtitle">Select any that apply to you</p>
          </div>
        </div>

        <div className="dietary-grid">
          {dietaryOptions.map(option => (
            <button 
              key={option.id}
              className={`dietary-grid-option ${option.id === 'none' ? (isNoneSelected ? 'selected' : '') : (dietaryRestrictions.includes(option.id) ? 'selected' : '')}`}
              onClick={() => toggleRestriction(option.id)}
              data-testid={`dietary-${option.id}`}
            >
              <span>{option.label}</span>
              {(option.id === 'none' ? isNoneSelected : dietaryRestrictions.includes(option.id)) && (
                <Check size={16} className="check-mark" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-buttons">
        <button className="onboarding-btn secondary" onClick={onBack} data-testid="dietary-back-btn">
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <button className="onboarding-btn primary" onClick={onNext} data-testid="dietary-next-btn">
          <span>Continue</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// Age and Pregnancy Stage Page Component
const AgePregnancyPage = ({ onNext, onBack, userAge, setUserAge, trimester, setTrimester }) => {
  const trimesters = [
    { id: 'first', label: 'First Trimester (Week 1 - 12)' },
    { id: 'second', label: 'Second Trimester (Week 13 - 26)' },
    { id: 'third', label: 'Third Trimester (Week 27 - 40)' },
    { id: 'postpartum', label: 'Postpartum (After birth)' },
    { id: 'planning', label: 'Planning/Trying (Before pregnancy)' }
  ];

  const handleAgeChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 2 digits
    if (value === '' || (/^\d{1,2}$/.test(value) && parseInt(value) <= 99)) {
      setUserAge(value);
    }
  };

  return (
    <div className="onboarding-page" data-testid="age-pregnancy-page">
      <div className="onboarding-header">
        <div className="onboarding-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
        <p className="onboarding-subtitle">Pregnancy Nutrition Guide</p>
        <div className="progress-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <div className="onboarding-card age-pregnancy-card">
        <h2>About You</h2>
        <p className="card-subtitle">Help us personalize your experience</p>

        <div className="form-section">
          <label className="section-label">Your Age (Years)</label>
          <div className="age-input-wrapper">
            <input
              type="number"
              min="13"
              max="60"
              placeholder=""
              value={userAge}
              onChange={handleAgeChange}
              className="age-input"
              data-testid="age-input"
            />
            <span className="age-suffix">years old</span>
          </div>
        </div>

        <div className="form-section">
          <label className="section-label">Pregnancy Stage</label>
          <div className="trimester-options">
            {trimesters.map(tri => (
              <button 
                key={tri.id}
                className={`trimester-option ${trimester === tri.id ? 'selected' : ''}`}
                onClick={() => setTrimester(tri.id)}
                data-testid={`trimester-${tri.id}`}
              >
                <span className="trimester-label">{tri.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="onboarding-buttons">
        <button className="onboarding-btn secondary" onClick={onBack} data-testid="age-pregnancy-back-btn">
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <button className="onboarding-btn primary" onClick={onNext} data-testid="age-pregnancy-next-btn">
          <span>Continue</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

// Premium Page Component
const PremiumPage = ({ onBack, onPurchase, onRestore, isPremium, isProcessing, paymentError }) => {
  return (
    <div className="premium-page-v2" data-testid="premium-page">
      {/* Back Button */}
      <button 
        className="premium-top-back-btn"
        onClick={onBack}
        data-testid="premium-back-btn"
        aria-label="Go back"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Header */}
      <div className="premium-page-header">
        <div 
          className="premium-logo-wrapper clickable" 
          onClick={onBack}
          role="button"
          tabIndex={0}
          title="Go to Home"
        >
          <div className="premium-logo">
            <span>W</span>
          </div>
          <h1>WhatToEat</h1>
        </div>
      </div>

      {/* Processing Payment Overlay */}
      {isProcessing && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-content">
            <div className="payment-spinner"></div>
            <h3>Processing Purchase...</h3>
            <p>Please wait while we complete your purchase.</p>
          </div>
        </div>
      )}

      {/* Payment Error */}
      {paymentError && (
        <div className="payment-error-banner">
          <span>{paymentError}</span>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {isPremium ? (
        <div className="premium-active-v2">
          <div className="premium-badge-large">
            <Crown size={48} />
          </div>
          <h1>You're Premium!</h1>
          <p>Thank you for supporting WhatToEat. You have full access to all features.</p>
          <div className="premium-benefits-list">
            <div className="benefit-item active">
              <Check size={20} />
              <span>Curated food ideas for each trimester</span>
            </div>
            <div className="benefit-item active">
              <Check size={20} />
              <span>Smart filter to browse foods by trimester stage</span>
            </div>
            <div className="benefit-item active">
              <Check size={20} />
              <span>Expanded food database with detailed nutritional notes</span>
            </div>
            <div className="benefit-item active">
              <Check size={20} />
              <span>Weekly pregnancy nutrition tip library</span>
            </div>
            <div className="benefit-item active">
              <Check size={20} />
              <span>Priority support</span>
            </div>
          </div>
          <button className="premium-back-btn" onClick={onBack}>
            Back to Home
          </button>
        </div>
      ) : (
        <div className="premium-content-v2">
          {/* Main Card */}
          <div className="premium-card-v2">
            <h2>Unlock Premium Pregnancy Nutrition</h2>
            <p className="premium-card-subtitle">Complete access to 249 expert-reviewed food guides</p>

            <div className="premium-features-v2">
              <h3>What You'll Unlock</h3>
              <ul>
                <li>
                  <Check size={18} className="check-icon" />
                  <span><strong>24 high-risk foods</strong> — Full safety details & why to avoid</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span><strong>39 limit foods</strong> — Exact portions, timing & safe alternatives</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span><strong>186 safe foods</strong> — Complete nutrition facts & preparation tips</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Source references (ACOG, CDC, FDA, WHO guidelines)</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Trimester-specific nutrition recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Price Card */}
          <div className="premium-price-card-v2">
            <div className="price-info">
              <span className="price-label">Premium Access</span>
              <span className="price-amount-v2">$1.99</span>
              <span className="price-duration">for your entire pregnancy</span>
              <span className="price-terms">One-time purchase • 12 months access • No subscription</span>
            </div>
            <div className="price-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 9.5 11 12 11C14.5 11 16.5 9 16.5 6.5C16.5 4 14.5 2 12 2Z"/>
                <path d="M12 11V22"/>
                <path d="M8 15C6.5 15.5 5 17 5 19"/>
                <path d="M16 15C17.5 15.5 19 17 19 19"/>
              </svg>
            </div>
          </div>

          {/* Buttons */}
          <button 
            className="premium-buy-btn"
            onClick={onPurchase}
            disabled={isProcessing}
            data-testid="premium-purchase-btn"
          >
            {isProcessing ? 'Processing...' : 'Get Premium for $1.99'}
          </button>

          <button className="premium-free-btn" onClick={onBack}>
            Continue with Free Version
          </button>

          <button 
            className="premium-restore-btn" 
            onClick={onRestore}
            disabled={isProcessing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>{isProcessing ? 'Restoring...' : 'Restore Purchases'}</span>
          </button>

          {/* App Store notice */}
          <p className="app-store-notice">
            Secure payment via App Store. Your purchase supports continued development.
          </p>
        </div>
      )}
    </div>
  );
};

// Daily Tip Component - Personalized based on dietary restrictions
const DailyTip = ({ dietaryRestrictions = [] }) => {
  const [tip, setTip] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Personalized tips based on dietary restrictions
  const PERSONALIZED_TIPS = {
    'vegetarian': {
      tip: "As a vegetarian, focus on iron-rich plant foods like lentils, spinach, and fortified cereals.",
      icon: "🥬",
      fullContent: "Vegetarian diets can provide all nutrients needed during pregnancy. Key nutrients to focus on: Iron (beans, lentils, tofu, spinach - pair with vitamin C), Protein (eggs, dairy, legumes, nuts), B12 (eggs, dairy, fortified foods), Zinc (whole grains, nuts, seeds). Consider a prenatal vitamin with B12 and iron."
    },
    'vegan': {
      tip: "Vegan moms: Ensure you're getting B12, iron, and omega-3s from fortified foods or supplements.",
      icon: "🌱",
      fullContent: "A vegan pregnancy requires careful planning. Critical nutrients: B12 (MUST supplement - no reliable plant sources), Iron (legumes, fortified cereals, leafy greens), Calcium (fortified plant milks, tofu, almonds), Omega-3 DHA (algae-based supplements), Zinc (beans, nuts, whole grains). Work with a dietitian to ensure all needs are met."
    },
    'gluten-free': {
      tip: "Going gluten-free? Choose naturally gluten-free grains like quinoa, rice, and certified oats.",
      icon: "🌾",
      fullContent: "Maintaining a gluten-free diet during pregnancy: Focus on naturally gluten-free whole grains (rice, quinoa, buckwheat, certified oats), Read labels carefully - gluten hides in many products, Choose gluten-free fortified cereals for iron and B vitamins, Ensure adequate fiber from fruits, vegetables, and legumes."
    },
    'dairy-free': {
      tip: "Without dairy, get calcium from fortified plant milks, leafy greens, and canned fish with bones.",
      icon: "🥛",
      fullContent: "Getting enough calcium without dairy (need 1000mg daily): Fortified plant milks and juices (check labels - not all are fortified), Calcium-set tofu, Canned sardines/salmon with bones, Leafy greens (bok choy, kale, broccoli), Almonds and almond butter. Vitamin D helps absorption - get sunshine or supplement."
    },
    'nut-allergy': {
      tip: "With a nut allergy, get healthy fats from seeds, avocados, olive oil, and fatty fish.",
      icon: "🥜",
      fullContent: "Healthy fats without nuts: Seeds (sunflower, pumpkin, chia, flax) provide similar nutrients, Avocados and olive oil for monounsaturated fats, Fatty fish (salmon, sardines) for omega-3s, Sunflower seed butter as a nut butter alternative. Always carry your EpiPen and inform your healthcare team."
    }
  };

  useEffect(() => {
    // Check if user has dietary restrictions that warrant a personalized tip
    const personalizedTip = dietaryRestrictions.find(r => PERSONALIZED_TIPS[r]);
    
    if (personalizedTip && Math.random() < 0.5) { // 50% chance to show personalized tip
      setTip({
        ...PERSONALIZED_TIPS[personalizedTip],
        isPersonalized: true
      });
    } else {
      // Get regular tip based on day of year
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const tipIndex = dayOfYear % DAILY_TIPS.length;
      setTip(DAILY_TIPS[tipIndex]);
    }
  }, [dietaryRestrictions]);

  if (!tip) return null;

  return (
    <div className={`daily-tip-v2 ${expanded ? 'expanded' : ''} ${tip.isPersonalized ? 'personalized' : ''}`} data-testid="daily-tip">
      <div className="tip-icon-v2">
        <Lightbulb size={24} />
      </div>
      <div className="tip-content-v2">
        <span className="tip-label">
          {tip.isPersonalized ? '✨ PERSONALIZED TIP' : 'DAILY TIP'}
        </span>
        <p className="tip-text">{tip.tip}</p>
        
        {expanded && tip.fullContent && (
          <div className="tip-expanded-content">
            <p>{tip.fullContent}</p>
          </div>
        )}
        
        <p className="tip-source">(Source: CDC Nutrition During Pregnancy Guidelines)</p>
        
        {tip.fullContent && (
          <button 
            className="tip-readmore" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '← Show less' : 'Read more →'}
          </button>
        )}
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
    </nav>
  );
};

// Main App
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSafety, setSelectedSafety] = useState('');
  // Initialize foods with static data immediately (for iOS/Android builds)
  const [foods, setFoods] = useState(() => {
    // Try to use static data immediately for native apps
    if (STATIC_FOODS_DATA && STATIC_FOODS_DATA.length > 0) {
      return STATIC_FOODS_DATA;
    }
    return [];
  });
  // Initialize categories from static data immediately
  const [categories, setCategories] = useState(() => {
    if (STATIC_FOODS_DATA && STATIC_FOODS_DATA.length > 0) {
      const uniqueCategories = [...new Set(
        STATIC_FOODS_DATA.map(food => food.category).filter(Boolean)
      )].sort();
      return uniqueCategories;
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodOpenedFrom, setFoodOpenedFrom] = useState(null); // Track where food modal was opened from
  const [activeView, setActiveView] = useState('home');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthCallback, setIsAuthCallback] = useState(() => {
    // Check if we're returning from OAuth callback
    return window.location.hash?.includes('session_id=') || 
           window.location.pathname === '/auth/callback';
  });
  
  // Onboarding flow: Disclaimer -> CreateAccount -> AgePregnancy -> DietaryConsiderations -> Premium -> Home
  // Step tracking: 0=Disclaimer, 1=CreateAccount, 2=AgePregnancy, 3=DietaryConsiderations, 4=Premium, 5=Home
  
  // Track if disclaimer was accepted THIS SESSION (not persisted)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const step = localStorage.getItem('onboardingStep');
    return step ? parseInt(step, 10) : 0;
  });
  
  // Get premium status from BillingContext
  // Note: We still keep local state for backward compatibility, but BillingContext is the source of truth
  const billingContext = useBilling();
  const isPremium = billingContext?.isPremium || localStorage.getItem('isPremium') === 'true';
  
  const [dietaryRestrictions, setDietaryRestrictions] = useState(() => {
    const saved = localStorage.getItem('dietaryRestrictions');
    return saved ? JSON.parse(saved) : [];
  });

  // User profile states for onboarding
  const [userAge, setUserAge] = useState(() => {
    return localStorage.getItem('userAge') || '';
  });
  const [trimester, setTrimester] = useState(() => {
    return localStorage.getItem('trimester') || '';
  });
  
  // Personalized view state
  const [personalizedView, setPersonalizedView] = useState(false);

  // Handle successful auth
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthCallback(false);
    // Skip to Age/Pregnancy step after successful auth
    const nextStep = 2;
    localStorage.setItem('onboardingStep', nextStep.toString());
    setOnboardingStep(nextStep);
  };

  // Handle auth error
  const handleAuthError = (error) => {
    console.error('Auth error:', error);
    setIsAuthCallback(false);
    // Go back to create account page
    localStorage.setItem('onboardingStep', '1');
    setOnboardingStep(1);
  };

  // Handle logout - Clear all auth state including Capacitor storage
  const handleLogout = async () => {
    // Clear local state FIRST (ensures logout completes even if plugins fail)
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setCurrentUser(null);
    
    // Clear Capacitor Preferences storage on native
    if (isCapacitorNative()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'auth_user' });
      } catch (prefErr) {
        // Ignore - preferences may not exist
      }
    }

    // Call backend logout (non-blocking)
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore API errors - local logout already completed
    }
    
    // Reset to Disclaimer page
    localStorage.setItem('onboardingStep', '0');
    setOnboardingStep(0);
    setDisclaimerAccepted(false); // This will show Disclaimer page
  };

  // Persist user profile to localStorage
  useEffect(() => {
    if (userAge) localStorage.setItem('userAge', userAge);
  }, [userAge]);

  useEffect(() => {
    if (trimester) localStorage.setItem('trimester', trimester);
  }, [trimester]);

  // Handle onboarding step progression
  const goToNextStep = () => {
    const nextStep = onboardingStep + 1;
    localStorage.setItem('onboardingStep', nextStep.toString());
    setOnboardingStep(nextStep);
  };

  const goToPreviousStep = () => {
    if (onboardingStep === 1) {
      // Going back from Create Account should show Disclaimer
      setDisclaimerAccepted(false);
      setOnboardingStep(0);
      localStorage.setItem('onboardingStep', '0');
    } else {
      const prevStep = Math.max(1, onboardingStep - 1);
      localStorage.setItem('onboardingStep', prevStep.toString());
      setOnboardingStep(prevStep);
    }
  };

  // Handle premium page close (skip premium)
  const handlePremiumClose = () => {
    const nextStep = 5; // Go to Home
    localStorage.setItem('onboardingStep', nextStep.toString());
    setOnboardingStep(nextStep);
  };

  // Handle going back to Age/Pregnancy onboarding from Home
  const goBackToOnboarding = () => {
    localStorage.setItem('onboardingStep', '2'); // Go to Age/Pregnancy step
    setOnboardingStep(2);
  };

  // Handle closing/exiting the app
  const handleCloseApp = () => {
    if (window.confirm('Are you sure you want to close the app?')) {
      // For web, we can close the window if it was opened by script
      // For Capacitor/mobile, this would use App.exitApp()
      window.close();
    }
  };

  // Handle premium purchase - Apple In-App Purchase
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Apple IAP Product ID - Must match App Store Connect configuration
  const APPLE_IAP_PRODUCT_ID = 'com.whattoeat.penx.premium.v2';

  const handlePremiumPurchase = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    try {
      // Check if running on iOS native app
      if (isCapacitorNative() && isIOS()) {
        // Use cordova-plugin-purchase (CdvPurchase)
        const CdvPurchase = window.CdvPurchase;
        
        if (CdvPurchase && CdvPurchase.store) {
          try {
            // Check if store is ready
            const product = CdvPurchase.store.get(APPLE_IAP_PRODUCT_ID);
            
            if (product) {
              console.log('Product found:', product);
              
              // Get the offer and initiate purchase
              const offer = product.getOffer();
              if (offer) {
                console.log('Initiating purchase for offer:', offer);
                
                // Set up one-time handlers for this purchase
                const purchasePromise = new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error('Purchase timeout - please try again'));
                  }, 120000); // 2 minute timeout
                  
                  CdvPurchase.store.when()
                    .approved(transaction => {
                      console.log('Purchase approved:', transaction);
                      transaction.verify();
                    })
                    .verified(receipt => {
                      console.log('Purchase verified:', receipt);
                      clearTimeout(timeout);
                      receipt.finish();
                      resolve(receipt);
                    })
                    .error(err => {
                      console.error('Purchase error:', err);
                      clearTimeout(timeout);
                      reject(err);
                    });
                });
                
                // Order the product
                await offer.order();
                
                // Wait for purchase completion
                await purchasePromise;
                
                // Grant premium access
                localStorage.setItem('isPremium', 'true');
                setIsPremium(true);
                setIsProcessingPayment(false);
                
                alert('🎉 Purchase successful! You now have premium access to all 249 foods.');
                setActiveView('home');
                return;
              } else {
                throw new Error('No offer available for this product');
              }
            } else {
              // Product not loaded yet - try to refresh
              console.log('Product not found, available products:', CdvPurchase.store.products);
              throw new Error('Product not available. Please try again in a moment.');
            }
          } catch (iapError) {
            console.error('IAP Error:', iapError);
            throw new Error(iapError.message || 'Purchase failed. Please try again.');
          }
        } else {
          // CdvPurchase not available - show message
          setPaymentError(
            'In-App Purchase is loading. Please wait a moment and try again.'
          );
          setIsProcessingPayment(false);
          return;
        }
      } else {
        // Web version - show message to download iOS app
        setPaymentError(null);
        alert(
          '📱 Premium Purchase\n\n' +
          'To purchase premium access, please download the WhatToEat app from the App Store.\n\n' +
          'The App Store handles all payments securely through Apple Pay.'
        );
        setIsProcessingPayment(false);
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Failed to complete purchase. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    try {
      if (isCapacitorNative() && isIOS()) {
        const CdvPurchase = window.CdvPurchase;
        
        if (CdvPurchase && CdvPurchase.store) {
          try {
            console.log('Restoring purchases...');
            await CdvPurchase.store.restorePurchases();
            
            // Check if any owned products exist after restore
            const product = CdvPurchase.store.get(APPLE_IAP_PRODUCT_ID);
            if (product && product.owned) {
              localStorage.setItem('isPremium', 'true');
              setIsPremium(true);
              alert('🎉 Purchases restored! Premium access activated.');
            } else {
              setPaymentError('No previous purchases found.');
            }
          } catch (restoreError) {
            console.error('Restore error:', restoreError);
            setPaymentError('Failed to restore purchases. Please try again.');
          }
        } else {
          // CdvPurchase not available - check local storage or backend
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (user?.user_id) {
            try {
              const response = await axios.get(`${API}/iap/premium-status`);
              if (response.data.is_premium) {
                localStorage.setItem('isPremium', 'true');
                setIsPremium(true);
                alert('🎉 Premium access restored!');
              } else {
                setPaymentError('No previous purchases found for this account.');
              }
            } catch {
              setPaymentError('Store is loading. Please wait and try again.');
            }
          } else {
            setPaymentError('Please sign in to restore purchases.');
          }
        }
      } else {
        // Web version
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.user_id) {
          try {
            const response = await axios.get(`${API}/iap/premium-status`);
            if (response.data.is_premium) {
              localStorage.setItem('isPremium', 'true');
              setIsPremium(true);
              alert('🎉 Premium access restored!');
            } else {
              setPaymentError('No previous purchases found. Purchase premium on the iOS app.');
            }
          } catch {
            setPaymentError('Unable to check purchase status. Please try again.');
          }
        } else {
          setPaymentError('Please sign in to restore purchases.');
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      setPaymentError('Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Save dietary restrictions to localStorage
  useEffect(() => {
    localStorage.setItem('dietaryRestrictions', JSON.stringify(dietaryRestrictions));
  }, [dietaryRestrictions]);

  // Initialize auth and restore session on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Restore session from Capacitor Preferences if not already logged in
        if (!currentUser) {
          try {
            const { Preferences } = await import('@capacitor/preferences');
            const { value: storedUser } = await Preferences.get({ key: 'auth_user' });
            
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              setCurrentUser(userData);
              localStorage.setItem('user', storedUser);
              localStorage.setItem('isAuthenticated', 'true');
              
              // If user is authenticated but onboarding not complete, skip to appropriate step
              if (onboardingStep < 2) {
                setOnboardingStep(2);
                localStorage.setItem('onboardingStep', '2');
              }
            }
          } catch (prefErr) {
            
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Initialize In-App Purchases for iOS - SAFE VERSION
  // This is handled by BillingContext now, but keep logging here
  useEffect(() => {
    console.log('App: IAP initialization effect running');
    console.log('App: isCapacitorNative:', isCapacitorNative());
    console.log('App: isIOS:', isIOS());
    
    // All IAP handling is now done by BillingContext
    // This effect just logs for debugging
    
    const logIAPStatus = () => {
      try {
        if (window.CdvPurchase && window.CdvPurchase.store) {
          console.log('App: CdvPurchase store is available');
          console.log('App: Products:', window.CdvPurchase.store.products?.length || 0);
        } else {
          console.log('App: CdvPurchase store not yet available');
        }
      } catch (e) {
        console.log('App: Error checking IAP status:', e);
      }
    };
    
    // Log after a delay to allow store to initialize
    const timer = setTimeout(logIAPStatus, 3000);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  useEffect(() => {
    const loadFoods = async () => {
      setLoading(true);
      
      // CRITICAL: Use offline mode for native apps - API URLs don't work in production
      const useOffline = shouldUseOfflineMode();
      
      // If offline mode, use static data immediately (no API calls)
      if (useOffline) {
        try {
          if (STATIC_FOODS_DATA && STATIC_FOODS_DATA.length > 0) {
            setFoods(STATIC_FOODS_DATA);
            const uniqueCategories = [...new Set(
              STATIC_FOODS_DATA.map(food => food.category).filter(Boolean)
            )].sort();
            setCategories(uniqueCategories);
          } else {
            setFoods([]);
          }
        } catch (e) {
          // Even if static data fails, don't crash
          setFoods([]);
        }
        setLoading(false);
        return;
      }
      
      // For web with valid backend, try API first with fallback to static
      try {
        let allFoods = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await axios.get(`${API}/foods/all?page=${page}&page_size=250`, {
            timeout: 5000
          });
          const pageFoods = response.data.foods || [];
          allFoods = [...allFoods, ...pageFoods];
          
          const total = response.data.total || 0;
          hasMore = allFoods.length < total && pageFoods.length > 0;
          page++;
        }
        
        if (allFoods.length > 0) {
          setFoods(allFoods);
          const uniqueCategories = [...new Set(
            allFoods.map(food => food.category).filter(Boolean)
          )].sort();
          setCategories(uniqueCategories);
        } else {
          // API returned empty, use static data
          setFoods(STATIC_FOODS_DATA || []);
          const uniqueCategories = [...new Set(
            (STATIC_FOODS_DATA || []).map(food => food.category).filter(Boolean)
          )].sort();
          setCategories(uniqueCategories);
        }
      } catch (e) {
        // API failed, use static data silently
        setFoods(STATIC_FOODS_DATA || []);
        const uniqueCategories = [...new Set(
          (STATIC_FOODS_DATA || []).map(food => food.category).filter(Boolean)
        )].sort();
        setCategories(uniqueCategories);
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
  }).sort((a, b) => {
    // Sort alphabetically by name
    return (a.name || '').localeCompare(b.name || '');
  });

  // Handle navigation from FAQ to Food
  const handleNavigateToFood = (food) => {
    // If premium food and user is not premium, redirect to premium page
    if (food.is_premium && !isPremium) {
      setActiveView('premium');
      return;
    }
    // Track that we came from FAQ
    setFoodOpenedFrom('faq');
    setSelectedFood(food);
  };

  // Handle closing food modal - return to where we came from
  const handleCloseFoodModal = () => {
    if (foodOpenedFrom === 'faq') {
      setActiveView('faq');
    }
    setSelectedFood(null);
    setFoodOpenedFrom(null);
  };

  // Auth Callback - handle OAuth redirect FIRST before any other routing
  if (isAuthCallback) {
    return (
      <AuthCallback 
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
    );
  }

  // ALWAYS show Disclaimer first on every app launch
  // Must accept disclaimer before accessing ANY part of the app
  if (!disclaimerAccepted) {
    return (
      <DisclaimerPage 
        onAccept={() => {
          setDisclaimerAccepted(true);
          // ALWAYS go to step 1 (Create Account) - no skipping for anyone
          setOnboardingStep(1);
          localStorage.setItem('onboardingStep', '1');
        }} 
      />
    );
  }

  // Onboarding Flow: Step 0 = Disclaimer (legacy - redirect to step 1)
  if (onboardingStep === 0) {
    // Move to Create Account page
    setOnboardingStep(1);
    localStorage.setItem('onboardingStep', '1');
    return null;
  }

  // Onboarding Flow: Step 1 = Create Account
  if (onboardingStep === 1) {
    return (
      <CreateAccountPage 
        onNext={goToNextStep} 
        onBack={goToPreviousStep} 
      />
    );
  }

  // Onboarding Flow: Step 2 = Age and Pregnancy Stage
  if (onboardingStep === 2) {
    return (
      <AgePregnancyPage 
        onNext={goToNextStep} 
        onBack={goToPreviousStep}
        userAge={userAge}
        setUserAge={setUserAge}
        trimester={trimester}
        setTrimester={setTrimester}
      />
    );
  }

  // Onboarding Flow: Step 3 = Dietary Considerations
  if (onboardingStep === 3) {
    return (
      <DietaryConsiderationsPage 
        onNext={goToNextStep} 
        onBack={goToPreviousStep}
        dietaryRestrictions={dietaryRestrictions}
        onUpdateRestrictions={setDietaryRestrictions}
      />
    );
  }

  // Onboarding Flow: Step 4 = Premium Offer
  if (onboardingStep === 4) {
    return (
      <PremiumPage 
        onBack={handlePremiumClose}
        onPurchase={handlePremiumPurchase}
        onRestore={handleRestorePurchases}
        isPremium={isPremium}
        isProcessing={isProcessingPayment}
        paymentError={paymentError}
      />
    );
  }

  // Render Premium Page (from nav - after onboarding completed)
  // Always navigate to Home when closing premium page (not back to previous view)
  if (activeView === 'premium') {
    return (
      <PremiumPage 
        onBack={() => {
          // Always go to home page, regardless of where user came from
          setActiveView('home');
          // Ensure no food modal is open
          setSelectedFood(null);
        }}
        onPurchase={handlePremiumPurchase}
        onRestore={handleRestorePurchases}
        isPremium={isPremium}
        isProcessing={isProcessingPayment}
        paymentError={paymentError}
      />
    );
  }

  // Render FAQ View
  if (activeView === 'faq') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header home-header-v2">
          <div className="header-content-v2 with-back">
            <button className="header-back-btn" onClick={() => setActiveView('home')} title="Back to Home">
              <ArrowLeft size={22} />
            </button>
            <div 
              className="header-logo-v2 clickable" 
              onClick={() => setActiveView('home')}
              data-testid="faq-header-logo"
              role="button"
              tabIndex={0}
            >
              <div className="logo-icon-v2">W</div>
              <span className="logo-text-v2">WhatToEat</span>
              <span className="logo-tagline-v2">Pregnancy Nutrition Guide</span>
            </div>
            <div className="header-actions-v2">
              <button className="header-action-btn" onClick={handleLogout} data-testid="logout-btn" title="Logout">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
        <FAQView 
          onBack={() => setActiveView('home')} 
          onNavigateToFood={handleNavigateToFood}
          onNavigateToCategory={(category) => {
            // Navigate to home page with the category selected or as search query
            setSelectedCategory(category);
            setSearchQuery(category.toLowerCase());
            setActiveView('home');
          }}
          onNavigateHome={() => setActiveView('home')}
          foods={foods}
          isPremium={isPremium}
          onNavigateToPremium={() => setActiveView('premium')}
        />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
        
        {/* Modal for food detail when opened from FAQ */}
        {selectedFood && (
          <FoodDetailModal 
            food={selectedFood} 
            onClose={handleCloseFoodModal}
            dietaryRestrictions={dietaryRestrictions}
            openedFrom={foodOpenedFrom}
          />
        )}
      </div>
    );
  }

  // Render Topics View
  if (activeView === 'topics') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header home-header-v2">
          <div className="header-content-v2 with-back">
            <button className="header-back-btn" onClick={() => setActiveView('home')} title="Back to Home">
              <ArrowLeft size={22} />
            </button>
            <div 
              className="header-logo-v2 clickable" 
              onClick={() => setActiveView('home')}
              data-testid="topics-header-logo"
              role="button"
              tabIndex={0}
            >
              <div className="logo-icon-v2">W</div>
              <span className="logo-text-v2">WhatToEat</span>
              <span className="logo-tagline-v2">Pregnancy Nutrition Guide</span>
            </div>
            <div className="header-actions-v2">
              <button className="header-action-btn" onClick={handleLogout} data-testid="logout-btn" title="Logout">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
        <TopicsView 
          onBack={() => setActiveView('home')}
          onNavigateHome={() => setActiveView('home')}
          isPremium={isPremium}
          onNavigateToPremium={() => setActiveView('premium')}
        />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  // Render About View
  if (activeView === 'about') {
    return (
      <div className="app" data-testid="food-search-app">
        <header className="app-header home-header-v2">
          <div className="header-content-v2 with-back">
            <button className="header-back-btn" onClick={() => setActiveView('home')} title="Back to Home">
              <ArrowLeft size={22} />
            </button>
            <div 
              className="header-logo-v2 clickable" 
              onClick={() => setActiveView('home')}
              data-testid="about-header-logo"
              role="button"
              tabIndex={0}
            >
              <div className="logo-icon-v2">W</div>
              <span className="logo-text-v2">WhatToEat</span>
              <span className="logo-tagline-v2">Pregnancy Nutrition Guide</span>
            </div>
            <div className="header-actions-v2">
              <button className="header-action-btn" onClick={handleLogout} data-testid="logout-btn" title="Logout">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
        <AboutView onBack={() => setActiveView('home')} onNavigateHome={() => setActiveView('home')} />
        <BottomNav activeView={activeView} onChangeView={setActiveView} />
      </div>
    );
  }

  // Trimester info mapping
  const trimesterInfo = {
    'first': { label: 'First Trimester', focus: 'Folate, Vitamin B6, Protein' },
    'second': { label: 'Second Trimester', focus: 'Calcium, Vitamin D, Omega-3s' },
    'third': { label: 'Third Trimester', focus: 'Iron, Calcium, DHA, Protein' },
    'postpartum': { label: 'Postpartum', focus: 'Iron, Protein, Calcium, Hydration' },
    'planning': { label: 'Planning/Trying', focus: 'Folate, Iron, Zinc' }
  };

  // Calculate free vs premium food counts from actual data
  const freeCount = filteredFoods.filter(f => !f.is_premium).length;
  const premiumCount = filteredFoods.filter(f => f.is_premium).length;

  return (
    <div className="app" data-testid="food-search-app">
      {/* Header */}
      <header className="app-header home-header-v2">
        <div className="header-content-v2">
          <div 
            className="header-logo-v2 clickable" 
            onClick={() => setActiveView('home')}
            data-testid="home-logo"
            role="button"
            tabIndex={0}
            title="Go to Home"
          >
            <div className="logo-icon-v2">W</div>
            <span className="logo-text-v2">WhatToEat</span>
            <span className="logo-tagline-v2">Pregnancy Nutrition Guide</span>
          </div>
          <div className="header-actions-v2">
            <button className="header-action-btn" onClick={handleLogout} data-testid="logout-btn" title="Logout">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="app-main home-main-v3">

        {/* Educational Information Banner */}
        <div className="educational-info-banner">
          <p><span className="edu-label">Educational Information:</span> This content is for general reference only and does not constitute medical advice. Consult a healthcare professional for personalized guidance.</p>
        </div>

        {/* Daily Tip - Personalized based on dietary restrictions */}
        <DailyTip dietaryRestrictions={dietaryRestrictions} />

        {/* Trimester Section - Now shows Age and Pregnancy Stage */}
        {(userAge || trimester) && (
          <div className="trimester-card" data-testid="trimester-card">
            <Sparkles size={22} className="trimester-sparkle" />
            <div className="trimester-card-content">
              <span className="trimester-card-title">
                {userAge && `Age ${userAge}`}
                {userAge && trimester && trimesterInfo[trimester] && ', '}
                {trimester && trimesterInfo[trimester] && trimesterInfo[trimester].label}
              </span>
              {trimester && trimesterInfo[trimester] && (
                <span className="trimester-card-focus">Focus on: {trimesterInfo[trimester].focus}</span>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-bar-card">
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar-input"
            data-testid="food-search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Category Pills */}
        <div className="filters-container">
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          
          {/* Safety Filter */}
          <SafetyFilter 
            selectedSafety={selectedSafety}
            onSelect={setSelectedSafety}
          />

          {/* Personalized View Toggle */}
          <button 
            className={`personalized-view-btn-v3 ${personalizedView ? 'active' : ''}`}
            onClick={() => setPersonalizedView(!personalizedView)}
            data-testid="personalized-view-btn"
          >
            Personalized View
          </button>
        </div>

        {/* Results */}
        <div className="results-section-v3">
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
              <p className="results-count">{freeCount} free foods · {premiumCount} premium foods</p>
              <div className="foods-list">
                {filteredFoods.map((food) => (
                  <FoodCard 
                    key={food.id} 
                    food={food} 
                    onClick={setSelectedFood}
                    onNavigateToPremium={() => setActiveView('premium')}
                    dietaryRestrictions={dietaryRestrictions}
                    isPremiumUser={isPremium}
                  />
                ))}
              </div>
              
              {/* Premium Upsell Banner - Show when there are premium foods and user is not premium */}
              {!isPremium && premiumCount > 0 && (
                <div className="premium-upsell-banner" onClick={() => setActiveView('premium')}>
                  <div className="upsell-icon">
                    <Lock size={24} />
                  </div>
                  <div className="upsell-content">
                    <h3>Unlock {premiumCount} Premium Foods</h3>
                    <p>
                      {selectedSafety === 'AVOID' 
                        ? 'Get answers to common questions about Energy Drinks, High Mercury Fish, Deli Meats, and more.'
                        : selectedSafety === 'LIMIT'
                        ? 'Get detailed portions, safe alternatives, and timing tips for caffeine, soft cheeses, and more.'
                        : 'Get complete nutrition facts, preparation tips, and health benefits for all foods.'}
                    </p>
                  </div>
                  <button className="upsell-btn">
                    Unlock All Foods - $1.99
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedFood && (
        <FoodDetailModal 
          food={selectedFood} 
          onClose={handleCloseFoodModal}
          dietaryRestrictions={dietaryRestrictions}
          openedFrom={foodOpenedFrom}
          isPremiumUser={isPremium}
          onNavigateToPremium={() => setActiveView('premium')}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeView={activeView} onChangeView={setActiveView} />
    </div>
  );
}

// Wrap App with ErrorBoundary, AppUpdateProvider, and BillingProvider for production stability
// CRITICAL: Each provider wrapped in try-catch via their own error handling
const AppWithErrorBoundary = () => {
  console.log('AppWithErrorBoundary: Rendering...');
  
  return (
    <ErrorBoundary>
      <AppUpdateProvider>
        <BillingProvider>
          <UpdatePrompt />
          <App />
        </BillingProvider>
      </AppUpdateProvider>
    </ErrorBoundary>
  );
};

export default AppWithErrorBoundary;
