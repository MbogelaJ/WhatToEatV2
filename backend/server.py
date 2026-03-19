from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Enhanced Food Database with structured pregnancy content
LOCAL_FOODS = [
    # ==================== FRUITS ====================
    {"id": "apple-1", "name": "Apple", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin C", "Fiber", "Antioxidants", "Potassium"],
     "benefits_summary": "Apples provide fiber for digestive health and vitamin C for immune support during pregnancy.",
     "recommended_consumption": ["Great as a daily snack", "Helps with pregnancy constipation", "Supports immune function"],
     "preparation_tips": ["Wash thoroughly before eating", "Can enjoy raw or cooked", "Pair with peanut butter for protein"],
     "precautions": ["Wash thoroughly to remove pesticide residue", "Avoid apple seeds (contain trace cyanide)", "May cause heartburn if eaten before bed"],
     "allergy_warning": None},
    
    {"id": "banana-1", "name": "Banana", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Potassium", "Vitamin B6", "Fiber", "Magnesium"],
     "benefits_summary": "Bananas help prevent leg cramps with potassium and support baby's brain development with vitamin B6.",
     "recommended_consumption": ["Excellent for morning sickness relief", "Good pre/post workout snack", "Helps maintain energy levels"],
     "preparation_tips": ["Eat fresh or frozen in smoothies", "Ripe bananas are sweeter", "Can be mashed for baking"],
     "precautions": ["High in natural sugars - limit if managing gestational diabetes", "Very ripe bananas have higher sugar content"],
     "allergy_warning": "Rare banana allergy exists. Cross-reactivity possible with latex allergy."},
    
    {"id": "orange-1", "name": "Orange", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin C", "Folate", "Fiber", "Thiamine"],
     "benefits_summary": "Oranges boost iron absorption with vitamin C and support baby's tissue growth with folate.",
     "recommended_consumption": ["Excellent source of folate", "Boosts iron absorption", "Supports immune health"],
     "preparation_tips": ["Eat fresh for maximum fiber", "Fresh juice is better than store-bought", "Zest adds flavor to dishes"],
     "precautions": ["High acidity may worsen heartburn", "Limit if you have citrus sensitivity", "May interact with certain medications"],
     "allergy_warning": "Citrus allergy is uncommon but possible. Stop if you notice mouth tingling or hives."},
    
    {"id": "avocado-1", "name": "Avocado", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Healthy Fats", "Folate", "Potassium", "Fiber"],
     "benefits_summary": "Avocados support baby's brain and tissue development with healthy fats and folate.",
     "recommended_consumption": ["Excellent pregnancy superfood", "Supports baby's brain development", "Helps with nutrient absorption"],
     "preparation_tips": ["Enjoy in salads or on toast", "Guacamole is a great option", "Ripe when slightly soft"],
     "precautions": ["High in calories - watch portions if managing weight", "Can cause digestive issues in large amounts"],
     "allergy_warning": "Cross-reactivity possible with latex allergy. Monitor for symptoms if latex-sensitive."},
    
    {"id": "strawberry-1", "name": "Strawberries", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin C", "Manganese", "Folate", "Antioxidants"],
     "benefits_summary": "Strawberries support baby's bone development with manganese and provide antioxidants for cell protection.",
     "recommended_consumption": ["Rich in antioxidants", "Supports collagen production", "Low calorie sweet treat"],
     "preparation_tips": ["Wash just before eating", "Store in refrigerator", "Great in smoothies or yogurt"],
     "precautions": ["Wash very thoroughly (high pesticide residue risk)", "Consider buying organic when possible"],
     "allergy_warning": "Strawberry allergy is common. Introduce carefully if you have food allergies."},
    
    {"id": "blueberry-1", "name": "Blueberries", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Antioxidants", "Vitamin C", "Vitamin K", "Fiber"],
     "benefits_summary": "Blueberries protect brain health with antioxidants and support healthy blood pressure during pregnancy.",
     "recommended_consumption": ["Brain-boosting superfood", "Excellent for smoothies", "Supports heart health"],
     "preparation_tips": ["Wash before eating", "Frozen retains nutrients well", "Add to oatmeal or yogurt"],
     "precautions": ["Wash thoroughly before eating", "May interact with blood-thinning medications"],
     "allergy_warning": None},
    
    {"id": "mango-1", "name": "Mango", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin A", "Vitamin C", "Folate", "Fiber"],
     "benefits_summary": "Mangoes support baby's eye development with vitamin A and boost immunity with vitamin C.",
     "recommended_consumption": ["Rich in beta-carotene", "Supports eye health", "Natural sweetness for cravings"],
     "preparation_tips": ["Choose ripe mangoes (fragrant smell)", "Peel before eating", "Great in smoothies"],
     "precautions": ["High in natural sugars - limit with gestational diabetes", "Mango skin can cause contact dermatitis"],
     "allergy_warning": "Cross-reactivity possible with poison ivy/oak allergy. Avoid skin contact if sensitive."},
    
    {"id": "watermelon-1", "name": "Watermelon", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Hydration", "Vitamin C", "Lycopene", "Potassium"],
     "benefits_summary": "Watermelon helps with hydration and reduces swelling with its natural diuretic properties.",
     "recommended_consumption": ["Excellent for hydration", "May reduce pregnancy swelling", "Refreshing summer snack"],
     "preparation_tips": ["Best eaten fresh", "Refrigerate cut pieces", "Seeds are safe to eat"],
     "precautions": ["May increase bathroom frequency", "Consume fresh - bacterial growth risk when cut and left out"],
     "allergy_warning": None},
    
    {"id": "grapes-1", "name": "Grapes", "category": "Fruits", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Resveratrol", "Vitamin K", "Vitamin C", "Antioxidants"],
     "benefits_summary": "Grapes provide resveratrol for heart health and natural sugars for quick energy during pregnancy.",
     "recommended_consumption": ["Quick energy snack", "Contains heart-healthy compounds", "Frozen grapes are refreshing"],
     "preparation_tips": ["Wash thoroughly", "Store in refrigerator", "Freeze for a cool treat"],
     "precautions": ["Wash thoroughly to remove pesticides", "Higher sugar content - moderate if managing blood sugar"],
     "allergy_warning": None},
    
    {"id": "papaya-1", "name": "Papaya (Ripe)", "category": "Fruits", "safety": "SAFE", "safety_label": "Ripe Only",
     "nutritional_benefits": ["Vitamin C", "Folate", "Fiber", "Enzymes"],
     "benefits_summary": "Ripe papaya aids digestion with enzymes and provides folate for baby's neural development.",
     "recommended_consumption": ["Choose only RIPE papaya", "Aids digestion naturally", "Good source of folate"],
     "preparation_tips": ["Must be fully ripe (yellow/orange)", "Scoop out and discard seeds", "Eat fresh"],
     "precautions": ["AVOID unripe/green papaya during pregnancy (may cause contractions)", "Only eat fully ripe papaya"],
     "allergy_warning": "Cross-reactivity with latex allergy. Avoid if latex-sensitive."},

    # ==================== VEGETABLES ====================
    {"id": "spinach-1", "name": "Spinach", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Iron", "Folate", "Vitamin K", "Calcium"],
     "benefits_summary": "Spinach prevents anemia with iron and supports baby's brain development with folate.",
     "recommended_consumption": ["Excellent folate source", "Helps prevent anemia", "Supports baby's development"],
     "preparation_tips": ["Wash very thoroughly", "Can eat raw or cooked", "Cooking reduces oxalate content"],
     "precautions": ["High in oxalates - may affect kidney stone formation", "Wash very thoroughly"],
     "allergy_warning": None},
    
    {"id": "broccoli-1", "name": "Broccoli", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin C", "Vitamin K", "Folate", "Fiber"],
     "benefits_summary": "Broccoli supports baby's bone development with calcium and provides folate for neural tube health.",
     "recommended_consumption": ["Pregnancy superfood", "Supports bone development", "Rich in vitamins"],
     "preparation_tips": ["Steam or roast to retain nutrients", "Wash thoroughly", "Don't overcook"],
     "precautions": ["May cause gas and bloating", "Cook to reduce gas-causing compounds if needed"],
     "allergy_warning": None},
    
    {"id": "carrot-1", "name": "Carrots", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Beta-Carotene", "Vitamin A", "Fiber", "Potassium"],
     "benefits_summary": "Carrots support baby's eye and skin development with beta-carotene.",
     "recommended_consumption": ["Supports baby's eye development", "Good for skin health", "Healthy crunchy snack"],
     "preparation_tips": ["Wash and peel if not organic", "Raw or cooked both nutritious", "Great with hummus"],
     "precautions": ["Excessive intake can cause temporary orange skin tint (harmless)"],
     "allergy_warning": "Carrot allergy possible. Cross-reactive with birch pollen."},
    
    {"id": "sweetpotato-1", "name": "Sweet Potato", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin A", "Fiber", "Potassium", "Vitamin C"],
     "benefits_summary": "Sweet potatoes support baby's eye development with vitamin A and provide sustained energy.",
     "recommended_consumption": ["Excellent vitamin A source", "Provides sustained energy", "Lower glycemic than regular potato"],
     "preparation_tips": ["Bake, roast, or mash", "Skin is nutritious and edible", "Cook thoroughly"],
     "precautions": ["Cook thoroughly before eating", "Very high vitamin A - balance with other sources"],
     "allergy_warning": None},
    
    {"id": "tomato-1", "name": "Tomatoes", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Lycopene", "Vitamin C", "Potassium", "Folate"],
     "benefits_summary": "Tomatoes support heart health with lycopene and provide vitamin C for immune function.",
     "recommended_consumption": ["Rich in antioxidants", "Supports heart health", "Versatile in cooking"],
     "preparation_tips": ["Wash before eating", "Cooked tomatoes release more lycopene", "Store at room temperature"],
     "precautions": ["High acidity may worsen heartburn", "Some people sensitive to nightshades"],
     "allergy_warning": "Nightshade sensitivity possible. Tomato allergy is uncommon."},
    
    {"id": "kale-1", "name": "Kale", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin K", "Vitamin A", "Calcium", "Folate"],
     "benefits_summary": "Kale supports bone health with calcium and vitamin K, and provides folate for baby.",
     "recommended_consumption": ["Nutrient-dense superfood", "Supports bone health", "High in antioxidants"],
     "preparation_tips": ["Massage raw kale to soften", "Remove tough stems", "Great in smoothies"],
     "precautions": ["High in vitamin K - may affect blood thinners", "High in oxalates"],
     "allergy_warning": None},
    
    {"id": "asparagus-1", "name": "Asparagus", "category": "Vegetables", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Folate", "Vitamin K", "Fiber", "Vitamin A"],
     "benefits_summary": "Asparagus is one of the best folate sources, crucial for preventing neural tube defects.",
     "recommended_consumption": ["Excellent folate source", "Supports neural tube development", "Low calorie vegetable"],
     "preparation_tips": ["Snap off woody ends", "Roast or grill for best flavor", "Store upright in water"],
     "precautions": ["May cause strong-smelling urine (harmless)"],
     "allergy_warning": None},

    # ==================== PROTEINS ====================
    {"id": "chicken-breast-1", "name": "Chicken Breast", "category": "Proteins", "safety": "SAFE", "safety_label": "Cook Thoroughly",
     "nutritional_benefits": ["Protein", "B Vitamins", "Selenium", "Phosphorus"],
     "benefits_summary": "Chicken breast provides lean protein for baby's growth and B vitamins for energy.",
     "recommended_consumption": ["Excellent lean protein source", "Supports muscle development", "Versatile cooking options"],
     "preparation_tips": ["Cook to 165°F/74°C internal temp", "No pink in the middle", "Avoid cross-contamination"],
     "precautions": ["MUST be cooked to 165°F/74°C internal temperature", "No pink in the middle", "Avoid cross-contamination with raw chicken"],
     "allergy_warning": "Chicken allergy rare but possible."},
    
    {"id": "salmon-1", "name": "Salmon", "category": "Proteins", "safety": "SAFE", "safety_label": "2-3x Per Week",
     "nutritional_benefits": ["Omega-3 DHA", "Protein", "Vitamin D", "B Vitamins"],
     "benefits_summary": "Salmon provides DHA for baby's brain and eye development and omega-3s for your heart.",
     "recommended_consumption": ["Best fish for pregnancy", "Supports baby's brain development", "Excellent omega-3 source"],
     "preparation_tips": ["Cook to 145°F/63°C", "Choose wild-caught when possible", "No raw/sushi during pregnancy"],
     "precautions": ["Limit to 2-3 servings per week (mercury)", "Cook to 145°F/63°C - no raw salmon during pregnancy"],
     "allergy_warning": "Fish allergy is common. Avoid if allergic to fish."},
    
    {"id": "egg-1", "name": "Eggs", "category": "Proteins", "safety": "SAFE", "safety_label": "Cook Fully",
     "nutritional_benefits": ["Choline", "Protein", "Vitamin D", "B12"],
     "benefits_summary": "Eggs provide choline for baby's brain development and complete protein for growth.",
     "recommended_consumption": ["Excellent choline source", "Complete protein", "Supports brain development"],
     "preparation_tips": ["Cook until yolk and white are firm", "No runny eggs during pregnancy", "Check for cracks before buying"],
     "precautions": ["Cook until yolk and white are firm", "No runny eggs during pregnancy"],
     "allergy_warning": "Egg allergy is one of the most common food allergies."},
    
    {"id": "lentils-1", "name": "Lentils", "category": "Proteins", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Folate", "Iron", "Protein", "Fiber"],
     "benefits_summary": "Lentils prevent anemia with iron and support baby's growth with folate and protein.",
     "recommended_consumption": ["Plant-based protein powerhouse", "Excellent iron and folate source", "Budget-friendly nutrition"],
     "preparation_tips": ["Rinse before cooking", "No soaking needed for most types", "Great in soups and salads"],
     "precautions": ["May cause gas - introduce gradually", "Cook thoroughly"],
     "allergy_warning": "Legume allergy possible. Cross-reactive with peanut allergy in some cases."},
    
    {"id": "tofu-1", "name": "Tofu", "category": "Proteins", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Protein", "Calcium", "Iron", "Magnesium"],
     "benefits_summary": "Tofu provides plant protein and calcium for bone health during pregnancy.",
     "recommended_consumption": ["Good plant-based protein", "Contains calcium for bones", "Versatile ingredient"],
     "preparation_tips": ["Press to remove excess water", "Firm tofu best for stir-fry", "Silken tofu great for smoothies"],
     "precautions": ["Choose organic to avoid GMO if preferred", "Moderate intake - soy contains phytoestrogens"],
     "allergy_warning": "Soy allergy is one of the top 8 allergens. Avoid completely if allergic."},
    
    {"id": "tuna-1", "name": "Tuna (Light, Canned)", "category": "Proteins", "safety": "LIMIT", "safety_label": "Limit Intake",
     "nutritional_benefits": ["Protein", "Omega-3s", "Selenium", "Vitamin D"],
     "benefits_summary": "Tuna provides lean protein and omega-3s for baby's brain development.",
     "recommended_consumption": ["Choose 'light' tuna (lower mercury)", "Good protein source", "Convenient option"],
     "preparation_tips": ["Limit to 2-3 cans per WEEK", "Light tuna has less mercury than albacore", "Drain well before use"],
     "precautions": ["Limit to 2-3 cans per WEEK due to mercury", "Choose 'light' tuna (lower mercury than albacore)", "Avoid bigeye tuna entirely"],
     "allergy_warning": "Fish allergy is common. Tuna is a major allergen."},

    # ==================== NUTS & SEEDS ====================
    {"id": "almonds-1", "name": "Almonds", "category": "Nuts & Seeds", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Vitamin E", "Calcium", "Protein", "Fiber"],
     "benefits_summary": "Almonds support strong bones, prevent anemia, and boost your baby's brain growth.",
     "recommended_consumption": ["Excellent pregnancy snack", "Rich in vitamin E and calcium", "Supports bone health"],
     "preparation_tips": ["Enjoy raw or roasted", "Almond butter is a good option", "About 23 almonds = 1 serving"],
     "precautions": ["High in calories - watch portion sizes (1oz = ~23 almonds)", "Can be a choking hazard - chew thoroughly", "Store properly to prevent rancidity"],
     "allergy_warning": "Tree nut allergy is common and can be severe. Not safe if allergic to nuts. Always check with your doctor if you have allergies or concerns."},
    
    {"id": "walnuts-1", "name": "Walnuts", "category": "Nuts & Seeds", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Omega-3 ALA", "Protein", "Antioxidants", "Magnesium"],
     "benefits_summary": "Walnuts provide omega-3 fatty acids for baby's brain development and antioxidants for cell health.",
     "recommended_consumption": ["Best nut for omega-3s", "Supports brain development", "Heart-healthy snack"],
     "preparation_tips": ["Store in refrigerator", "Add to salads or oatmeal", "Raw or lightly toasted"],
     "precautions": ["Highest calorie nut - small portions recommended", "Store in refrigerator to prevent rancidity"],
     "allergy_warning": "Tree nut allergy is common and can be life-threatening. Not safe if allergic to tree nuts."},
    
    {"id": "chia-seeds-1", "name": "Chia Seeds", "category": "Nuts & Seeds", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Omega-3 ALA", "Fiber", "Calcium", "Protein"],
     "benefits_summary": "Chia seeds provide omega-3s for baby's brain and fiber for pregnancy constipation relief.",
     "recommended_consumption": ["Excellent fiber source", "Helps with constipation", "Provides omega-3s"],
     "preparation_tips": ["Always soak or add to liquid", "Great in puddings and smoothies", "Start with small amounts"],
     "precautions": ["Always soak or add to liquid (can expand and cause choking if dry)", "Very high fiber - start with small amounts"],
     "allergy_warning": "Chia seed allergy is rare but possible."},
    
    {"id": "peanut-butter-1", "name": "Peanut Butter", "category": "Nuts & Seeds", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Protein", "Healthy Fats", "Folate", "Niacin"],
     "benefits_summary": "Peanut butter provides protein and healthy fats, and may help reduce baby's allergy risk when eaten during pregnancy.",
     "recommended_consumption": ["Good protein source", "May reduce baby's allergy risk", "Satisfying snack"],
     "preparation_tips": ["Choose natural without added sugar", "Pair with apples or celery", "Store natural PB in fridge"],
     "precautions": ["High calorie - stick to 2 tbsp serving", "Check for recalls"],
     "allergy_warning": "Peanut allergy is very common and severe. Not safe if allergic to peanuts. Consult your doctor about peanut consumption during pregnancy if allergy history."},

    # ==================== DAIRY ====================
    {"id": "yogurt-greek-1", "name": "Greek Yogurt", "category": "Dairy", "safety": "SAFE", "safety_label": "Pasteurized Only",
     "nutritional_benefits": ["Protein", "Calcium", "Probiotics", "Vitamin B12"],
     "benefits_summary": "Greek yogurt supports gut health with probiotics and provides protein for baby's growth.",
     "recommended_consumption": ["Excellent protein source", "Supports gut health", "Rich in calcium"],
     "preparation_tips": ["Choose plain and add fruit", "Check for live cultures", "Pasteurized varieties only"],
     "precautions": ["Choose pasteurized", "Plain has no added sugar"],
     "allergy_warning": "Milk allergy is common. Greek yogurt is lower in lactose than regular yogurt."},
    
    {"id": "cheese-cheddar-1", "name": "Cheddar Cheese", "category": "Dairy", "safety": "SAFE", "safety_label": "Hard Cheese Safe",
     "nutritional_benefits": ["Calcium", "Protein", "Vitamin A", "Phosphorus"],
     "benefits_summary": "Cheddar provides calcium for bones and protein for baby's development. Hard cheese is safe during pregnancy.",
     "recommended_consumption": ["Good calcium source", "Safe hard cheese option", "Satisfying snack"],
     "preparation_tips": ["Hard cheeses are pregnancy-safe", "Check it's pasteurized", "Moderate portions"],
     "precautions": ["High in sodium and saturated fat", "Watch portion sizes"],
     "allergy_warning": "Milk/dairy allergy common. Aged cheeses are lower in lactose."},
    
    {"id": "milk-1", "name": "Milk", "category": "Dairy", "safety": "SAFE", "safety_label": "Pasteurized Only",
     "nutritional_benefits": ["Calcium", "Vitamin D", "Protein", "Phosphorus"],
     "benefits_summary": "Milk provides calcium for baby's bone development and protein for growth.",
     "recommended_consumption": ["Essential for bone health", "Good protein source", "Choose fortified varieties"],
     "preparation_tips": ["Must be pasteurized", "Check vitamin D fortification", "Store properly refrigerated"],
     "precautions": ["ONLY pasteurized milk during pregnancy", "Choose low-fat if watching calories"],
     "allergy_warning": "Milk allergy is one of the most common food allergies. Lactose intolerance is also common."},

    # ==================== GRAINS ====================
    {"id": "oatmeal-1", "name": "Oatmeal", "category": "Grains", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Fiber", "Iron", "B Vitamins", "Magnesium"],
     "benefits_summary": "Oatmeal provides fiber for digestive health and iron to prevent pregnancy anemia.",
     "recommended_consumption": ["Great breakfast option", "Helps with constipation", "Sustained energy"],
     "preparation_tips": ["Steel-cut oats most nutritious", "Add fruit and nuts", "Avoid heavily sweetened instant"],
     "precautions": ["Choose plain varieties", "Watch added sugars in flavored types"],
     "allergy_warning": "May contain gluten from cross-contamination. Choose certified gluten-free if celiac."},
    
    {"id": "quinoa-1", "name": "Quinoa", "category": "Grains", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Complete Protein", "Fiber", "Iron", "Magnesium"],
     "benefits_summary": "Quinoa is a complete protein with all essential amino acids, supporting baby's growth.",
     "recommended_consumption": ["Complete protein source", "Excellent for vegetarians", "Supports baby's growth"],
     "preparation_tips": ["Rinse before cooking", "Use as rice substitute", "Great in salads cold"],
     "precautions": ["Rinse well to remove bitter coating"],
     "allergy_warning": None},
    
    {"id": "bread-whole-wheat-1", "name": "Whole Wheat Bread", "category": "Grains", "safety": "SAFE", "safety_label": "Generally Safe",
     "nutritional_benefits": ["Fiber", "B Vitamins", "Iron", "Folate"],
     "benefits_summary": "Whole wheat bread provides fiber and B vitamins for energy and digestion.",
     "recommended_consumption": ["Better than white bread", "Good fiber source", "Provides sustained energy"],
     "preparation_tips": ["Check for 'whole wheat' as first ingredient", "Store in cool, dry place", "Toast for easier digestion"],
     "precautions": ["Check labels for added sugars", "Choose 100% whole wheat"],
     "allergy_warning": "Contains gluten. Not safe for celiac disease or gluten sensitivity."},

    # ==================== BEVERAGES ====================
    {"id": "water-1", "name": "Water", "category": "Beverages", "safety": "SAFE", "safety_label": "Essential",
     "nutritional_benefits": ["Hydration", "Zero Calories", "Supports All Functions"],
     "benefits_summary": "Water is essential for maintaining amniotic fluid and supporting increased blood volume during pregnancy.",
     "recommended_consumption": ["Aim for 8-10 glasses daily", "Essential for pregnancy", "Prevents dehydration"],
     "preparation_tips": ["Carry a reusable bottle", "Add lemon for flavor", "Drink consistently throughout day"],
     "precautions": ["Ensure water is clean and filtered"],
     "allergy_warning": None},
    
    {"id": "coffee-1", "name": "Coffee", "category": "Beverages", "safety": "LIMIT", "safety_label": "Limit Caffeine",
     "nutritional_benefits": ["Antioxidants", "Mental Alertness"],
     "benefits_summary": "Coffee provides antioxidants and may help with alertness during pregnancy fatigue.",
     "recommended_consumption": ["Limit to 200mg caffeine/day", "About 12oz brewed coffee", "Can help with fatigue"],
     "preparation_tips": ["Track total caffeine intake", "Consider half-caf", "Avoid late in day"],
     "precautions": ["Limit to 200mg caffeine per day (about 12oz coffee)", "Caffeine crosses placenta", "Avoid in late evening"],
     "allergy_warning": None},
    
    {"id": "orange-juice-1", "name": "Orange Juice", "category": "Beverages", "safety": "SAFE", "safety_label": "Pasteurized Only",
     "nutritional_benefits": ["Vitamin C", "Folate", "Potassium"],
     "benefits_summary": "Orange juice provides vitamin C for iron absorption and folate for baby's development.",
     "recommended_consumption": ["Good vitamin C source", "Choose calcium-fortified", "Limit due to sugar"],
     "preparation_tips": ["MUST be pasteurized", "Fresh-squeezed needs pasteurization", "Limit to 1 glass daily"],
     "precautions": ["MUST be pasteurized during pregnancy", "High in sugar - limit portions", "Whole oranges are better"],
     "allergy_warning": "Citrus allergy is uncommon but possible."},

    # ==================== FOODS TO LIMIT/AVOID ====================
    {"id": "sushi-raw-1", "name": "Raw Sushi/Sashimi", "category": "Proteins", "safety": "AVOID", "safety_label": "Avoid During Pregnancy",
     "nutritional_benefits": ["Protein", "Omega-3s (if eaten)"],
     "benefits_summary": "While nutritious, raw fish poses risks during pregnancy and should be avoided.",
     "recommended_consumption": ["Avoid during pregnancy", "Choose cooked rolls instead", "Vegetable rolls are safe"],
     "preparation_tips": ["Opt for cooked sushi rolls", "Tempura or veggie rolls are safe", "Wait until after pregnancy for raw"],
     "precautions": ["Risk of parasites and bacteria", "Listeria risk", "Mercury concerns with some fish"],
     "allergy_warning": "Fish and shellfish allergies are common."},
    
    {"id": "soft-cheese-1", "name": "Soft Cheese (Unpasteurized)", "category": "Dairy", "safety": "AVOID", "safety_label": "Check Label",
     "nutritional_benefits": ["Calcium", "Protein"],
     "benefits_summary": "Unpasteurized soft cheeses can contain harmful bacteria. Choose pasteurized versions.",
     "recommended_consumption": ["Only eat if pasteurized", "Check labels carefully", "Hard cheeses are safer"],
     "preparation_tips": ["Always check 'pasteurized' on label", "Brie, feta, blue cheese need checking", "When in doubt, skip it"],
     "precautions": ["Listeria risk in unpasteurized varieties", "Includes brie, camembert, blue cheese", "Always verify pasteurization"],
     "allergy_warning": "Milk/dairy allergy is common."},
    
    {"id": "deli-meat-1", "name": "Deli Meat/Cold Cuts", "category": "Proteins", "safety": "LIMIT", "safety_label": "Heat Before Eating",
     "nutritional_benefits": ["Protein", "Iron"],
     "benefits_summary": "Deli meats can harbor listeria. Heat until steaming before eating during pregnancy.",
     "recommended_consumption": ["Heat until steaming if eating", "Limit processed meats", "Fresh-cooked is better"],
     "preparation_tips": ["Heat to 165°F/74°C before eating", "Avoid eating cold", "Choose freshly cooked meats instead"],
     "precautions": ["Listeria risk if eaten cold", "High sodium content", "Contains nitrates"],
     "allergy_warning": None},
    
    {"id": "alcohol-1", "name": "Alcohol", "category": "Beverages", "safety": "AVOID", "safety_label": "No Safe Amount",
     "nutritional_benefits": [],
     "benefits_summary": "There is no known safe amount of alcohol during pregnancy. Complete avoidance is recommended.",
     "recommended_consumption": ["Avoid completely during pregnancy", "No safe amount established", "Choose mocktails instead"],
     "preparation_tips": ["Try alcohol-free alternatives", "Sparkling water with fruit", "Non-alcoholic beer/wine available"],
     "precautions": ["No safe level during pregnancy", "Can cause fetal alcohol spectrum disorders", "Crosses placenta directly"],
     "allergy_warning": None},
]

# Models
class FoodItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    category: Optional[str] = None
    safety: Optional[str] = "SAFE"
    safety_label: Optional[str] = "Generally Safe"
    nutritional_benefits: Optional[List[str]] = []
    benefits_summary: Optional[str] = None
    recommended_consumption: Optional[List[str]] = []
    preparation_tips: Optional[List[str]] = []
    precautions: Optional[List[str]] = []
    allergy_warning: Optional[str] = None

class FoodSearchResponse(BaseModel):
    foods: List[FoodItem]
    total: int
    page: int
    page_size: int


def search_local_foods(query: str, page: int = 1, page_size: int = 100) -> FoodSearchResponse:
    query_lower = query.lower().strip() if query else ""
    
    if not query_lower:
        foods = [FoodItem(**food) for food in LOCAL_FOODS]
    else:
        foods = []
        for food in LOCAL_FOODS:
            name = (food.get("name") or "").lower()
            category = (food.get("category") or "").lower()
            if query_lower in name or query_lower in category:
                foods.append(FoodItem(**food))
    
    total = len(foods)
    start = (page - 1) * page_size
    end = start + page_size
    
    return FoodSearchResponse(foods=foods[start:end], total=total, page=page, page_size=page_size)


@api_router.get("/")
async def root():
    return {"message": "WhatToEat Food API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/foods/search", response_model=FoodSearchResponse)
async def search_foods(query: str = Query("", max_length=200), page: int = Query(1, ge=1), page_size: int = Query(100, ge=1, le=100)):
    return search_local_foods(query, page, page_size)

@api_router.get("/foods/all", response_model=FoodSearchResponse)
async def get_all_foods(page: int = Query(1, ge=1), page_size: int = Query(100, ge=1, le=100)):
    return search_local_foods("", page, page_size)

@api_router.get("/foods/{food_id}", response_model=FoodItem)
async def get_food_by_id(food_id: str):
    for food in LOCAL_FOODS:
        if food["id"] == food_id:
            return FoodItem(**food)
    raise HTTPException(status_code=404, detail="Food item not found")

@api_router.get("/categories")
async def get_categories():
    categories = list(set(food["category"] for food in LOCAL_FOODS if food.get("category")))
    return {"categories": sorted(categories)}

@api_router.get("/safety-levels")
async def get_safety_levels():
    return {"safety_levels": ["SAFE", "LIMIT", "AVOID"]}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
