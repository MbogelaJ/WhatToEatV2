import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Search, Utensils, X, AlertCircle, Filter, Check, Clock, ChevronDown, ChevronUp, ChevronRight, AlertTriangle, ArrowLeft, Share2, Settings, Home, HelpCircle, BookOpen, Info, User, Lock, Star, Sparkles, Shield, Heart, Lightbulb, Crown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Daily tips for pregnancy nutrition
const DAILY_TIPS = [
  { tip: "Stay hydrated! Aim for 8-10 glasses of water daily during pregnancy.", icon: "💧" },
  { tip: "Folate is crucial in the first trimester. Eat leafy greens like spinach and kale.", icon: "🥬" },
  { tip: "Protein helps baby grow. Include eggs, lean meat, or legumes in every meal.", icon: "🥚" },
  { tip: "Calcium builds strong bones. Greek yogurt is an excellent source!", icon: "🦴" },
  { tip: "Omega-3s support brain development. Enjoy salmon 2-3 times per week.", icon: "🐟" },
  { tip: "Iron prevents anemia. Pair iron-rich foods with vitamin C for better absorption.", icon: "💪" },
  { tip: "Small, frequent meals can help with morning sickness and heartburn.", icon: "🍽️" },
  { tip: "Ginger tea is a natural remedy for pregnancy nausea.", icon: "🫚" },
  { tip: "Fiber prevents constipation. Include whole grains, fruits, and vegetables.", icon: "🌾" },
  { tip: "Limit caffeine to 200mg daily - about one cup of coffee.", icon: "☕" },
  { tip: "Wash all fruits and vegetables thoroughly before eating.", icon: "🍎" },
  { tip: "Vitamin D helps calcium absorption. Get some safe sun exposure!", icon: "☀️" },
  { tip: "Avoid raw fish and undercooked meat to prevent foodborne illness.", icon: "⚠️" },
  { tip: "Nuts and seeds are great snacks - rich in healthy fats and protein.", icon: "🥜" },
  { tip: "Listen to your body's hunger cues, but remember you're not eating for two adults!", icon: "🤰" }
];

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

// Comprehensive FAQ data with food tags and premium status
const ALL_FAQS = [
  // ==================== FREE QUESTIONS (Sample answers available) ====================
  {
    id: 'salmon-safe',
    question: "Is salmon safe during pregnancy?",
    answer: "Yes! Salmon is one of the best fish choices during pregnancy. It's low in mercury and high in omega-3 fatty acids (DHA and EPA) which are crucial for baby's brain and eye development. Aim for 2-3 servings per week. Always cook to 145°F/63°C - no raw salmon or sushi during pregnancy.",
    category: 'seafood',
    foodTags: ['salmon'],
    isPremium: false
  },
  {
    id: 'yogurt-safe',
    question: "Is yogurt safe during pregnancy?",
    answer: "Yes! Pasteurized yogurt is excellent during pregnancy. It provides calcium, protein, and probiotics for gut health. Greek yogurt has even more protein. Choose plain varieties and add your own fruit to avoid excess sugar. Always check that it's made from pasteurized milk.",
    category: 'dairy',
    foodTags: ['yogurt'],
    isPremium: false
  },
  {
    id: 'shrimp-safe',
    question: "Is shrimp safe during pregnancy?",
    answer: "Yes! Shrimp is safe and nutritious during pregnancy when thoroughly cooked. It's low in mercury, high in protein, and provides iodine for thyroid health. Cook until pink and opaque. Avoid raw shrimp, shrimp cocktail with raw shrimp, or ceviche.",
    category: 'seafood',
    foodTags: ['shrimp'],
    isPremium: false
  },

  // ==================== PREMIUM QUESTIONS (Locked) ====================
  // Top Questions
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
            <p>Sources: World Health Organization (WHO), USDA FoodData Central, American College of Obstetricians and Gynecologists (ACOG), FDA Food Safety Guidelines for Pregnancy, CDC Pregnancy Nutrition Guidelines</p>
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
        <div className="header-logo">
          <div className="logo-icon-sm">W</div>
          <h2>WhatToEat</h2>
        </div>
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
      <div className="page-header">
        <button className="back-button" onClick={onBack} data-testid="faq-back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-logo">
          <div className="logo-icon-sm">W</div>
          <h2>WhatToEat</h2>
        </div>
        <button className="profile-btn" data-testid="profile-btn">
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
            <p>Get detailed answers to all pregnancy food questions with a one-time purchase.</p>
            <ul className="premium-features">
              <li><Check size={16} /> Full answers to 40+ expert-reviewed questions</li>
              <li><Check size={16} /> Detailed food safety guidelines</li>
              <li><Check size={16} /> Nutrition recommendations by trimester</li>
              <li><Check size={16} /> Ad-free experience</li>
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
        <div className="header-logo">
          <div className="logo-icon-sm">W</div>
          <h2>WhatToEat</h2>
        </div>
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
        <div className="header-logo">
          <div className="logo-icon-sm">W</div>
          <h2>WhatToEat</h2>
        </div>
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
          <p className="copyright">© 2026 WhatToEat. All rights reserved.</p>
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

        <p className="disclaimer-copyright">© PenX Technologies</p>
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

// Onboarding Page Component
const OnboardingPage = ({ page, onNext, onSkip }) => {
  const pages = [
    {
      icon: <Utensils size={64} />,
      title: "Welcome to WhatToEat",
      subtitle: "Your trusted pregnancy nutrition guide",
      description: "Browse 235+ foods with pregnancy-specific safety information, nutritional benefits, and preparation tips.",
      features: [
        { icon: <Check size={18} />, text: "Instant food safety lookup" },
        { icon: <Check size={18} />, text: "Personalized dietary alerts" },
        { icon: <Check size={18} />, text: "Expert-reviewed information" }
      ]
    },
    {
      icon: <Heart size={64} />,
      title: "Personalized for You",
      subtitle: "Set your dietary preferences",
      description: "Tell us about your dietary restrictions and we'll highlight foods that may not be suitable for you.",
      features: [
        { icon: <Check size={18} />, text: "Vegetarian, vegan, gluten-free options" },
        { icon: <Check size={18} />, text: "Allergy warnings" },
        { icon: <Check size={18} />, text: "Daily nutrition tips" }
      ]
    }
  ];

  const currentPage = pages[page];

  return (
    <div className="onboarding-page" data-testid={`onboarding-page-${page + 1}`}>
      <div className="onboarding-content">
        <div className="onboarding-icon">
          {currentPage.icon}
        </div>
        <h1>{currentPage.title}</h1>
        <p className="onboarding-subtitle">{currentPage.subtitle}</p>
        <p className="onboarding-description">{currentPage.description}</p>
        <ul className="onboarding-features">
          {currentPage.features.map((feature, index) => (
            <li key={index}>
              {feature.icon}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <div className="onboarding-dots">
          {pages.map((_, index) => (
            <span key={index} className={`dot ${index === page ? 'active' : ''}`} />
          ))}
        </div>
        <div className="onboarding-buttons">
          <button className="onboarding-btn secondary" onClick={onSkip} data-testid="onboarding-skip-btn">
            Skip
          </button>
          <button className="onboarding-btn primary" onClick={onNext} data-testid="onboarding-next-btn">
            {page === pages.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Premium Page Component
const PremiumPage = ({ onBack, onPurchase, isPremium }) => {
  return (
    <div className="premium-page-v2" data-testid="premium-page">
      {/* Header */}
      <div className="premium-page-header">
        <div className="premium-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
      </div>

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
            <p className="premium-card-subtitle">Expand your pregnancy nutrition reference library</p>

            <div className="premium-features-v2">
              <h3>Premium Features</h3>
              <ul>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Curated food ideas for each trimester (based on general public health guidelines)</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Smart filter to browse foods by trimester stage</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Expanded food database with detailed nutritional notes</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Weekly pregnancy nutrition tip library</span>
                </li>
                <li>
                  <Check size={18} className="check-icon" />
                  <span>Priority support</span>
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
            data-testid="premium-purchase-btn"
          >
            Get Premium for $1.99
          </button>

          <button className="premium-free-btn" onClick={onBack}>
            Continue with Free Version
          </button>

          <button className="premium-restore-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>Restore Purchases</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Daily Tip Component
const DailyTip = () => {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    // Get tip based on day of year for consistency
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    setTip(DAILY_TIPS[tipIndex]);
  }, []);

  if (!tip) return null;

  return (
    <div className="daily-tip" data-testid="daily-tip">
      <div className="daily-tip-header">
        <Lightbulb size={16} />
        <span>Daily Tip</span>
      </div>
      <div className="daily-tip-content">
        <span className="tip-icon">{tip.icon}</span>
        <p>{tip.tip}</p>
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
  
  // Onboarding and Premium states
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    return localStorage.getItem('disclaimerAccepted') === 'true';
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('onboardingCompleted') === 'true';
  });
  const [onboardingPage, setOnboardingPage] = useState(0);
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('isPremium') === 'true';
  });
  
  const [dietaryRestrictions, setDietaryRestrictions] = useState(() => {
    const saved = localStorage.getItem('dietaryRestrictions');
    return saved ? JSON.parse(saved) : [];
  });

  // Handle disclaimer acceptance
  const handleDisclaimerAccept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setHasAcceptedDisclaimer(true);
  };

  // Handle onboarding navigation
  const handleOnboardingNext = () => {
    if (onboardingPage < 1) {
      setOnboardingPage(onboardingPage + 1);
    } else {
      localStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
    }
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setHasCompletedOnboarding(true);
  };

  // Handle premium purchase
  const handlePremiumPurchase = () => {
    // In a real app, this would integrate with payment provider
    localStorage.setItem('isPremium', 'true');
    setIsPremium(true);
    alert('Thank you for purchasing Premium! You now have full access to all features.');
  };

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

  // Handle navigation from FAQ to Food
  const handleNavigateToFood = (food) => {
    setActiveView('home');
    // Small delay to ensure view has changed before opening modal
    setTimeout(() => {
      setSelectedFood(food);
    }, 100);
  };

  // Render Disclaimer Page (First time only)
  if (!hasAcceptedDisclaimer) {
    return <DisclaimerPage onAccept={handleDisclaimerAccept} />;
  }

  // Render Onboarding Pages (First time only)
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingPage 
        page={onboardingPage} 
        onNext={handleOnboardingNext} 
        onSkip={handleOnboardingSkip} 
      />
    );
  }

  // Render Premium Page
  if (activeView === 'premium') {
    return (
      <PremiumPage 
        onBack={() => setActiveView('home')}
        onPurchase={handlePremiumPurchase}
        isPremium={isPremium}
      />
    );
  }

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
        {/* Daily Tip */}
        <DailyTip />
        
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
