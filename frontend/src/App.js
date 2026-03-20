import { useState, useEffect, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, X, AlertCircle, Filter, Check, Clock, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, AlertTriangle, ArrowLeft, Share2, Settings, Home, HelpCircle, BookOpen, Info, User, Lock, Star, Sparkles, Shield, Heart, Lightbulb, Crown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Capacitor detection and Apple Sign-In helper
const isCapacitorNative = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNativePlatform && 
         window.Capacitor.isNativePlatform();
};

const isIOS = () => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === 'ios';
};

// Apple Sign-In handler for native iOS
const handleNativeAppleSignIn = async () => {
  try {
    // Check if SignInWithApple plugin is available
    if (!window.Capacitor?.Plugins?.SignInWithApple) {
      throw new Error('SignInWithApple plugin not available');
    }
    
    const SignInWithApple = window.Capacitor.Plugins.SignInWithApple;
    
    // Request authorization
    const response = await SignInWithApple.authorize({
      clientId: 'com.whattoeat.penx.app',
      redirectURI: '', // Not needed for native
      scopes: 'email name',
      state: 'state' + Date.now(),
      nonce: 'nonce' + Date.now()
    });
    
    // Extract user data from Apple's response
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
    id: 'prenatal-vitamins',
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
const FoodCard = ({ food, onClick, dietaryRestrictions = [], isPremiumUser = false }) => {
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
  
  return (
    <div 
      data-testid={`food-card-${food.id}`}
      className={`food-list-item ${showLock ? 'premium-locked' : ''}`}
      onClick={() => onClick(food)}
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
const FoodDetailModal = ({ food, onClose, dietaryRestrictions = [] }) => {
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
          <button 
            className="share-button" 
            data-testid="share-btn"
            onClick={async () => {
              const shareData = {
                title: `${food.name} - Pregnancy Food Safety`,
                text: `Is ${food.name} safe during pregnancy? ${food.safety_label || safetyConfig.label}. ${food.benefits_summary || ''}`,
                url: window.location.href
              };
              
              try {
                if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                  // Native Web Share API (works on mobile and some desktop browsers)
                  await navigator.share(shareData);
                } else {
                  // Fallback: Copy to clipboard and show options
                  const shareText = `${shareData.title}\n\n${shareData.text}\n\nLearn more: ${shareData.url}`;
                  
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareText);
                    alert('Link copied to clipboard! You can now paste and share on your preferred platform.');
                  } else {
                    // Final fallback: prompt with text
                    prompt('Copy this to share:', shareText);
                  }
                }
              } catch (error) {
                console.log('Share cancelled or failed:', error);
              }
            }}
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
const FAQView = ({ onBack, onNavigateToFood, foods, isPremium, onNavigateToPremium }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
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
  
  // Handle food tag click
  const handleFoodTagClick = (tag) => {
    const food = findFoodByTag(tag);
    if (food && onNavigateToFood) {
      onNavigateToFood(food);
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

  const filteredFAQs = selectedCategory === 'all' 
    ? ALL_FAQS 
    : ALL_FAQS.filter(faq => faq.category === selectedCategory);

  const handleFAQClick = (index, faq) => {
    if (faq.isPremium && !isPremium) {
      setShowPremiumModal(true);
    } else {
      setOpenIndex(openIndex === index ? null : index);
    }
  };

  return (
    <div className="page-view" data-testid="faq-view">
      <div className="faq-header">
        <div 
          className="faq-header-left clickable" 
          onClick={onBack}
          role="button"
          tabIndex={0}
          title="Go to Home"
        >
          <div className="logo-icon-v2">W</div>
          <span className="logo-text-v2">WhatToEat</span>
        </div>
        <button className="header-action-btn" data-testid="faq-profile-btn">
          <User size={22} />
        </button>
      </div>

      <div className="page-content">
        <div className="faq-title-section">
          <h1>Most Asked Pregnancy Food Questions</h1>
          <p>Quick answers to the most common questions about food safety during pregnancy.</p>
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
          <p className="about-tagline">Pregnancy Nutrition Guide</p>
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
            Our information is compiled from reputable sources including the World Health Organization (WHO), 
            USDA FoodData Central, American College of Obstetricians and Gynecologists (ACOG), 
            FDA Food Safety Guidelines, CDC pregnancy nutrition recommendations, and NHS guidelines.
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
          <p className="copyright">(c) 2026 PenX Technologies. All Rights Reserved.</p>
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

        <p className="disclaimer-copyright">(c) 2026 PenX Technologies. All Rights Reserved.</p>
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

// Create Account Page Component
const CreateAccountPage = ({ onNext, onBack, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (email) {
      localStorage.setItem('userEmail', email);
    }
    onNext();
  };

  const handleGoogleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleAppleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Check if running on native iOS
      if (isIOS()) {
        // Use native Apple Sign-In
        const result = await handleNativeAppleSignIn();
        
        if (result.success) {
          // Store user data locally
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('isAuthenticated', 'true');
          
          // Call success callback if provided, otherwise proceed to next step
          if (onAuthSuccess) {
            onAuthSuccess(result.user);
          } else {
            onNext();
          }
        } else {
          setError(result.error || 'Apple Sign-In failed. Please try again.');
        }
      } else {
        // On web/non-iOS, show message that Apple Sign-In is only available on iOS
        setError('Apple Sign-In is available on the iOS app. Please use Google Sign-In on web.');
      }
    } catch (err) {
      console.error('Apple Sign-In error:', err);
      setError('Apple Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-page" data-testid="create-account-page">
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
        <h2>{isSignIn ? 'Welcome Back' : 'Create Your Account'}</h2>
        <p className="card-subtitle">{isSignIn ? 'Sign in to access your preferences' : 'Sign up to save your preferences'}</p>

        {error && (
          <div className="auth-error-message" data-testid="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            data-testid="email-input"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            data-testid="password-input"
          />
        </div>

        <p className="auth-toggle">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsSignIn(!isSignIn)} className="link-btn">
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <button 
          className="social-btn apple" 
          onClick={handleAppleSignIn} 
          disabled={isLoading}
          data-testid="apple-signin-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>{isLoading ? 'Signing in...' : 'Sign in with Apple'}</span>
        </button>

        <button className="social-btn google" onClick={handleGoogleSignIn} disabled={isLoading} data-testid="google-signin-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>

        <p className="security-note">Your data is stored securely</p>
      </div>

      <div className="onboarding-buttons">
        <button className="onboarding-btn secondary" onClick={onBack} data-testid="create-account-back-btn">
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <button className="onboarding-btn primary" onClick={handleContinue} data-testid="create-account-next-btn">
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
              placeholder="Enter your age"
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
  const [dismissed, setDismissed] = useState(false);
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

  if (!tip || dismissed) return null;

  return (
    <div className={`daily-tip-v2 ${expanded ? 'expanded' : ''} ${tip.isPersonalized ? 'personalized' : ''}`} data-testid="daily-tip">
      <button className="tip-dismiss" onClick={() => setDismissed(true)}>
        <X size={16} />
      </button>
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
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
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
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const step = localStorage.getItem('onboardingStep');
    return step ? parseInt(step, 10) : 0;
  });
  
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('isPremium') === 'true';
  });
  
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout error:', e);
    }
    // Clear local state regardless of API result
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setCurrentUser(null);
    // Reset to onboarding
    localStorage.setItem('onboardingStep', '0');
    setOnboardingStep(0);
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
    const prevStep = Math.max(0, onboardingStep - 1);
    localStorage.setItem('onboardingStep', prevStep.toString());
    setOnboardingStep(prevStep);
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
  const APPLE_IAP_PRODUCT_ID = 'com.whattoeat.premium';

  const handlePremiumPurchase = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    try {
      // Check if running on iOS native app
      if (isCapacitorNative() && isIOS()) {
        // Use Capacitor In-App Purchase plugin
        // Note: This requires @capgo/capacitor-purchases or similar plugin
        // For now, we show instructions for the user
        
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorPurchases) {
          const { CapacitorPurchases } = window.Capacitor.Plugins;
          
          try {
            // Get available products
            const products = await CapacitorPurchases.getProducts({
              productIdentifiers: [APPLE_IAP_PRODUCT_ID]
            });
            
            if (products && products.products && products.products.length > 0) {
              // Purchase the product
              const purchaseResult = await CapacitorPurchases.purchaseProduct({
                productIdentifier: APPLE_IAP_PRODUCT_ID
              });
              
              if (purchaseResult && purchaseResult.transactionId) {
                // Verify purchase with backend
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                
                await axios.post(`${API}/iap/verify-purchase`, {
                  receipt_data: purchaseResult.receipt || '',
                  user_id: user?.user_id
                });
                
                // Grant premium access
                localStorage.setItem('isPremium', 'true');
                setIsPremium(true);
                setIsProcessingPayment(false);
                
                alert('🎉 Purchase successful! You now have premium access to all 249 foods.');
                setActiveView('home');
                return;
              }
            }
          } catch (iapError) {
            console.error('IAP Error:', iapError);
            throw new Error('Purchase failed. Please try again.');
          }
        } else {
          // StoreKit not available - show manual instructions
          setPaymentError(
            'In-App Purchase will be available when you download the app from the App Store. ' +
            'For testing, premium access has been granted.'
          );
          // For development/testing, grant premium access
          localStorage.setItem('isPremium', 'true');
          setIsPremium(true);
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
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorPurchases) {
          const { CapacitorPurchases } = window.Capacitor.Plugins;
          
          const restoreResult = await CapacitorPurchases.restorePurchases();
          
          if (restoreResult && restoreResult.transactions && restoreResult.transactions.length > 0) {
            // Verify restored purchase with backend
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            
            await axios.post(`${API}/iap/restore-purchases`, {
              receipt_data: restoreResult.receipt || '',
              user_id: user?.user_id
            });
            
            localStorage.setItem('isPremium', 'true');
            setIsPremium(true);
            alert('🎉 Purchases restored! Premium access activated.');
          } else {
            setPaymentError('No previous purchases found.');
          }
        } else {
          // Check with backend for existing purchases
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (user?.user_id) {
            const response = await axios.get(`${API}/iap/premium-status`);
            if (response.data.is_premium) {
              localStorage.setItem('isPremium', 'true');
              setIsPremium(true);
              alert('🎉 Premium access restored!');
            } else {
              setPaymentError('No previous purchases found for this account.');
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

  useEffect(() => {
    const loadFoods = async () => {
      setLoading(true);
      try {
        // Fetch all foods (may need multiple pages)
        let allFoods = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await axios.get(`${API}/foods/all?page=${page}&page_size=250`);
          const pageFoods = response.data.foods || [];
          allFoods = [...allFoods, ...pageFoods];
          
          // Check if there are more pages
          const total = response.data.total || 0;
          hasMore = allFoods.length < total && pageFoods.length > 0;
          page++;
        }
        
        setFoods(allFoods);
        
        const uniqueCategories = [...new Set(
          allFoods.map(food => food.category).filter(Boolean)
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

  // Handle navigation from FAQ to Food
  const handleNavigateToFood = (food) => {
    setActiveView('home');
    // Small delay to ensure view has changed before opening modal
    setTimeout(() => {
      setSelectedFood(food);
    }, 100);
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

  // Onboarding Flow: Step 0 = Disclaimer
  if (onboardingStep === 0) {
    return <DisclaimerPage onAccept={goToNextStep} />;
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
  if (activeView === 'premium') {
    return (
      <PremiumPage 
        onBack={() => setActiveView('home')}
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
        <FAQView 
          onBack={() => setActiveView('home')} 
          onNavigateToFood={handleNavigateToFood}
          foods={foods}
          isPremium={isPremium}
          onNavigateToPremium={() => setActiveView('premium')}
        />
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
            <div 
              className="logo clickable"
              onClick={() => setActiveView('home')}
              role="button"
              tabIndex={0}
              title="Go to Home"
            >
              <div className="logo-icon">W</div>
              <h1>WhatToEat</h1>
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
        <AboutView onBack={() => setActiveView('home')} />
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
        {/* Title Section */}
        <div className="home-title-section">
          <h1 className="home-main-title">Pregnancy Nutrition Guide</h1>
          <p className="home-subtitle">Educational reference information about foods during pregnancy</p>
        </div>

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
            placeholder="Search foods..."
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
