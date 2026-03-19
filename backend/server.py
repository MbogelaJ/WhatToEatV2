from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ENHANCED Food Database with pregnancy-specific info
# Fields: benefits (one-liner), precautions (array), allergy_warning (if applicable)
LOCAL_FOODS = [
    # ==================== FRUITS (30 items) ====================
    {"id": "apple-1", "name": "Apple, raw, with skin", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2, "fiber": 2.4, "serving_size": "100g",
     "benefits": "Apples provide fiber for digestive health and vitamin C for immune support during pregnancy.",
     "precautions": ["Wash thoroughly to remove pesticide residue", "Avoid apple seeds (contain trace amounts of cyanide)", "May cause heartburn in third trimester if eaten before bed"],
     "allergy_warning": None},
    
    {"id": "banana-1", "name": "Banana, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "fiber": 2.6, "serving_size": "100g",
     "benefits": "Bananas help prevent leg cramps with potassium and support baby's brain development with vitamin B6.",
     "precautions": ["High in natural sugars - limit if managing gestational diabetes", "Very ripe bananas have higher sugar content", "May cause constipation if eaten unripe"],
     "allergy_warning": "Rare banana allergy exists. Cross-reactivity possible with latex allergy."},
    
    {"id": "orange-1", "name": "Orange, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1, "fiber": 2.4, "serving_size": "100g",
     "benefits": "Oranges boost iron absorption with vitamin C and support baby's tissue growth with folate.",
     "precautions": ["High acidity may worsen heartburn or acid reflux", "Limit if you have citrus sensitivity", "May interact with certain medications"],
     "allergy_warning": "Citrus allergy is uncommon but possible. Stop if you notice mouth tingling or hives."},
    
    {"id": "strawberry-1", "name": "Strawberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "fiber": 2, "serving_size": "100g",
     "benefits": "Strawberries support baby's bone development with manganese and provide antioxidants for cell protection.",
     "precautions": ["Wash very thoroughly (high pesticide residue risk)", "Consider buying organic when possible", "May trigger allergic reactions in sensitive individuals"],
     "allergy_warning": "Strawberry allergy is common. Introduce carefully if you have food allergies."},
    
    {"id": "grapes-1", "name": "Grapes, red or green", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 69, "protein": 0.7, "carbs": 18, "fat": 0.2, "fiber": 0.9, "serving_size": "100g",
     "benefits": "Grapes provide resveratrol for heart health and natural sugars for quick energy during pregnancy.",
     "precautions": ["Wash thoroughly to remove pesticides", "Cut in half for older children (choking hazard)", "Higher sugar content - moderate if managing blood sugar"],
     "allergy_warning": None},
    
    {"id": "mango-1", "name": "Mango, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4, "fiber": 1.6, "serving_size": "100g",
     "benefits": "Mangoes support baby's eye development with vitamin A and boost immunity with vitamin C.",
     "precautions": ["High in natural sugars - limit with gestational diabetes", "Unripe mango may cause digestive upset", "Mango skin can cause contact dermatitis"],
     "allergy_warning": "Cross-reactivity possible with poison ivy/oak allergy. Avoid skin contact if sensitive."},
    
    {"id": "pineapple-1", "name": "Pineapple, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 50, "protein": 0.5, "carbs": 13, "fat": 0.1, "fiber": 1.4, "serving_size": "100g",
     "benefits": "Pineapple aids digestion with bromelain and supports immune function with vitamin C.",
     "precautions": ["Contains bromelain - avoid excessive amounts in early pregnancy", "High acidity may cause mouth sores or heartburn", "Canned pineapple has less bromelain but more sugar"],
     "allergy_warning": "Pineapple allergy is rare. May cause mouth tingling (not always allergic reaction)."},
    
    {"id": "watermelon-1", "name": "Watermelon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "fiber": 0.4, "serving_size": "100g",
     "benefits": "Watermelon helps with hydration and reduces swelling with its natural diuretic properties.",
     "precautions": ["May increase bathroom frequency", "Consume fresh - bacterial growth risk when cut", "Seeds are safe but can be a choking concern"],
     "allergy_warning": None},
    
    {"id": "blueberry-1", "name": "Blueberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 57, "protein": 0.7, "carbs": 14, "fat": 0.3, "fiber": 2.4, "serving_size": "100g",
     "benefits": "Blueberries protect brain health with antioxidants and support healthy blood pressure during pregnancy.",
     "precautions": ["Wash thoroughly before eating", "Can stain teeth and clothing", "May interact with blood-thinning medications"],
     "allergy_warning": None},
    
    {"id": "avocado-1", "name": "Avocado, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 160, "protein": 2, "carbs": 9, "fat": 15, "fiber": 7, "serving_size": "100g",
     "benefits": "Avocados support baby's brain and tissue development with healthy fats and folate.",
     "precautions": ["High in calories - watch portions if managing weight", "Ripeness matters for food safety", "Can cause digestive issues in large amounts"],
     "allergy_warning": "Cross-reactivity possible with latex allergy. Monitor for symptoms if latex-sensitive."},
    
    {"id": "peach-1", "name": "Peach, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 39, "protein": 0.9, "carbs": 10, "fat": 0.3, "fiber": 1.5, "serving_size": "100g",
     "benefits": "Peaches support skin health with vitamin A and aid digestion with natural fiber.",
     "precautions": ["Wash well - often on 'dirty dozen' pesticide list", "Pit contains amygdalin (do not eat)", "May cause allergic reactions in some people"],
     "allergy_warning": "Stone fruit allergy is possible. Related to birch pollen allergy (oral allergy syndrome)."},
    
    {"id": "pear-1", "name": "Pear, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 57, "protein": 0.4, "carbs": 15, "fat": 0.1, "fiber": 3.1, "serving_size": "100g",
     "benefits": "Pears provide gentle fiber for pregnancy constipation relief and potassium for heart health.",
     "precautions": ["High fiber may cause gas if not used to it", "Wash thoroughly", "Seeds contain trace cyanide (don't eat seeds)"],
     "allergy_warning": None},
    
    {"id": "cherry-1", "name": "Cherries, sweet, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 63, "protein": 1.1, "carbs": 16, "fat": 0.2, "fiber": 2.1, "serving_size": "100g",
     "benefits": "Cherries help improve sleep quality with natural melatonin and reduce inflammation.",
     "precautions": ["Remove pits before eating (choking hazard, toxic if crushed)", "May have laxative effect in large amounts", "Wash thoroughly"],
     "allergy_warning": "Stone fruit allergy possible. Cross-reactive with birch pollen."},
    
    {"id": "kiwi-1", "name": "Kiwi fruit, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 61, "protein": 1.1, "carbs": 15, "fat": 0.5, "fiber": 3, "serving_size": "100g",
     "benefits": "Kiwi supports immune function with vitamin C and aids digestion with natural enzymes.",
     "precautions": ["Common allergen - introduce carefully", "May cause mouth irritation (actinidin enzyme)", "Skin is edible but may cause irritation"],
     "allergy_warning": "Kiwi allergy is common. High cross-reactivity with latex allergy. Stop if lips/mouth tingle."},
    
    {"id": "grapefruit-1", "name": "Grapefruit, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 42, "protein": 0.8, "carbs": 11, "fat": 0.1, "fiber": 1.6, "serving_size": "100g",
     "benefits": "Grapefruit supports immune health with vitamin C and provides hydration during pregnancy.",
     "precautions": ["Interacts with MANY medications - check with pharmacist", "High acidity may worsen heartburn", "May affect blood pressure medications"],
     "allergy_warning": "Citrus allergy is uncommon but possible."},
    
    {"id": "raspberry-1", "name": "Raspberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 52, "protein": 1.2, "carbs": 12, "fat": 0.7, "fiber": 6.5, "serving_size": "100g",
     "benefits": "Raspberries support healthy digestion with high fiber and provide folate for baby's development.",
     "precautions": ["Wash gently but thoroughly", "High fiber may cause gas initially", "Fragile - check for mold before eating"],
     "allergy_warning": None},
    
    {"id": "blackberry-1", "name": "Blackberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 43, "protein": 1.4, "carbs": 10, "fat": 0.5, "fiber": 5.3, "serving_size": "100g",
     "benefits": "Blackberries support brain health with antioxidants and provide vitamin K for blood clotting.",
     "precautions": ["Wash thoroughly", "May stain teeth and clothing", "Seeds may irritate sensitive digestive systems"],
     "allergy_warning": None},
    
    {"id": "cantaloupe-1", "name": "Cantaloupe, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 34, "protein": 0.8, "carbs": 8, "fat": 0.2, "fiber": 0.9, "serving_size": "100g",
     "benefits": "Cantaloupe supports baby's eye development with beta-carotene and provides hydration.",
     "precautions": ["Scrub outer rind before cutting (listeria risk)", "Refrigerate cut melon immediately", "Discard if left at room temperature > 2 hours"],
     "allergy_warning": None},
    
    {"id": "honeydew-1", "name": "Honeydew melon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 36, "protein": 0.5, "carbs": 9, "fat": 0.1, "fiber": 0.8, "serving_size": "100g",
     "benefits": "Honeydew helps with hydration and provides potassium for healthy blood pressure.",
     "precautions": ["Wash outer rind thoroughly before cutting", "Refrigerate after cutting", "Discard if has off smell or slimy texture"],
     "allergy_warning": None},
    
    {"id": "papaya-1", "name": "Papaya, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 43, "protein": 0.5, "carbs": 11, "fat": 0.3, "fiber": 1.7, "serving_size": "100g",
     "benefits": "Ripe papaya aids digestion with enzymes and provides folate for baby's neural development.",
     "precautions": ["AVOID unripe/green papaya during pregnancy (may cause contractions)", "Only eat fully ripe papaya", "Seeds are edible but have strong peppery taste"],
     "allergy_warning": "Cross-reactivity with latex allergy. Avoid if latex-sensitive."},
    
    {"id": "pomegranate-1", "name": "Pomegranate, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 83, "protein": 1.7, "carbs": 19, "fat": 1.2, "fiber": 4, "serving_size": "100g",
     "benefits": "Pomegranate supports placental health with antioxidants and may help prevent preeclampsia.",
     "precautions": ["May interact with blood pressure medications", "Can stain clothing permanently", "Seeds are edible and nutritious"],
     "allergy_warning": None},
    
    {"id": "plum-1", "name": "Plum, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 46, "protein": 0.7, "carbs": 11, "fat": 0.3, "fiber": 1.4, "serving_size": "100g",
     "benefits": "Plums help relieve constipation naturally and provide vitamin C for immune support.",
     "precautions": ["Remove pit before eating", "May have laxative effect", "Wash thoroughly"],
     "allergy_warning": "Stone fruit allergy possible. Cross-reactive with birch pollen."},
    
    {"id": "apricot-1", "name": "Apricot, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 48, "protein": 1.4, "carbs": 11, "fat": 0.4, "fiber": 2, "serving_size": "100g",
     "benefits": "Apricots support baby's eye development with vitamin A and provide iron to prevent anemia.",
     "precautions": ["Pit contains amygdalin - do not eat", "Dried apricots higher in sugar", "May cause digestive upset in large amounts"],
     "allergy_warning": "Stone fruit allergy possible."},
    
    {"id": "nectarine-1", "name": "Nectarine, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 44, "protein": 1.1, "carbs": 11, "fat": 0.3, "fiber": 1.7, "serving_size": "100g",
     "benefits": "Nectarines support skin health with vitamin C and provide potassium for muscle function.",
     "precautions": ["Often on 'dirty dozen' list - wash well or buy organic", "Remove pit before eating", "May cause allergic reaction in some"],
     "allergy_warning": "Stone fruit allergy possible. Related to peach allergy."},
    
    {"id": "coconut-1", "name": "Coconut meat, raw", "brand": None, "category": "Fruits", "safety": "LIMIT", "calories": 354, "protein": 3.3, "carbs": 15, "fat": 33, "fiber": 9, "serving_size": "100g",
     "benefits": "Coconut provides quick energy with MCTs and supports hydration with electrolytes.",
     "precautions": ["Very high in saturated fat - use in moderation", "High calorie content", "May cause digestive issues in large amounts"],
     "allergy_warning": "Tree nut allergy classification varies. FDA classifies as tree nut - check with allergist."},
    
    {"id": "fig-1", "name": "Figs, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 74, "protein": 0.8, "carbs": 19, "fat": 0.3, "fiber": 2.9, "serving_size": "100g",
     "benefits": "Figs support bone health with calcium and help relieve constipation with natural fiber.",
     "precautions": ["High in natural sugars", "Dried figs much higher in sugar and calories", "May have laxative effect"],
     "allergy_warning": None},
    
    {"id": "dates-1", "name": "Dates, medjool", "brand": None, "category": "Fruits", "safety": "LIMIT", "calories": 277, "protein": 1.8, "carbs": 75, "fat": 0.2, "fiber": 6.7, "serving_size": "100g",
     "benefits": "Dates may help with natural labor induction when eaten in late pregnancy and provide quick energy.",
     "precautions": ["Very high in sugar - limit with gestational diabetes", "High calorie - watch portion sizes", "Studies suggest eating dates in late pregnancy only"],
     "allergy_warning": None},
    
    {"id": "cranberry-1", "name": "Cranberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 46, "protein": 0.5, "carbs": 12, "fat": 0.1, "fiber": 4.6, "serving_size": "100g",
     "benefits": "Cranberries help prevent UTIs, which are more common during pregnancy.",
     "precautions": ["Very tart raw - usually sweetened (watch added sugar)", "May interact with blood thinners", "Juice often has added sugar"],
     "allergy_warning": None},
    
    {"id": "lemon-1", "name": "Lemon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 29, "protein": 1.1, "carbs": 9, "fat": 0.3, "fiber": 2.8, "serving_size": "100g",
     "benefits": "Lemons help with morning sickness relief and support iron absorption with vitamin C.",
     "precautions": ["High acidity can damage tooth enamel", "May worsen heartburn", "Rinse mouth with water after consuming"],
     "allergy_warning": "Citrus allergy uncommon but possible."},
    
    {"id": "lime-1", "name": "Lime, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 30, "protein": 0.7, "carbs": 11, "fat": 0.2, "fiber": 2.8, "serving_size": "100g",
     "benefits": "Limes support immune function with vitamin C and add flavor without calories.",
     "precautions": ["High acidity - protect tooth enamel", "May cause sun sensitivity on skin (phytophotodermatitis)", "May worsen acid reflux"],
     "allergy_warning": "Citrus allergy uncommon but possible."},

    # ==================== VEGETABLES (35 items) ====================
    {"id": "broccoli-1", "name": "Broccoli, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "fiber": 2.6, "serving_size": "100g",
     "benefits": "Broccoli supports baby's bone development with calcium and provides folate for neural tube health.",
     "precautions": ["May cause gas and bloating", "Cook to reduce gas-causing compounds if needed", "Wash thoroughly"],
     "allergy_warning": None},
    
    {"id": "carrot-1", "name": "Carrots, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2, "fiber": 2.8, "serving_size": "100g",
     "benefits": "Carrots support baby's eye and skin development with beta-carotene.",
     "precautions": ["Excessive intake can cause temporary orange skin tint (harmless)", "Cut into small pieces for children", "Wash and peel if not organic"],
     "allergy_warning": "Carrot allergy possible. Cross-reactive with birch pollen (oral allergy syndrome)."},
    
    {"id": "spinach-1", "name": "Spinach, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "fiber": 2.2, "serving_size": "100g",
     "benefits": "Spinach prevents anemia with iron and supports baby's brain development with folate.",
     "precautions": ["High in oxalates - may affect kidney stone formation", "Wash very thoroughly (soil contamination risk)", "Cooking reduces oxalate content"],
     "allergy_warning": None},
    
    {"id": "tomato-1", "name": "Tomatoes, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2, "serving_size": "100g",
     "benefits": "Tomatoes support heart health with lycopene and provide vitamin C for immune function.",
     "precautions": ["High acidity may worsen heartburn", "Some people sensitive to nightshades", "Wash thoroughly"],
     "allergy_warning": "Nightshade sensitivity possible. Tomato allergy is uncommon."},
    
    {"id": "cucumber-1", "name": "Cucumber, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 15, "protein": 0.7, "carbs": 3.6, "fat": 0.1, "fiber": 0.5, "serving_size": "100g",
     "benefits": "Cucumbers help with hydration and may reduce pregnancy swelling.",
     "precautions": ["Wash thoroughly or peel if waxed", "May cause gas in some people", "Best eaten fresh"],
     "allergy_warning": None},
    
    {"id": "lettuce-1", "name": "Lettuce, romaine", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 17, "protein": 1.2, "carbs": 3.3, "fat": 0.3, "fiber": 2.1, "serving_size": "100g",
     "benefits": "Romaine provides folate for baby's development and hydration with high water content.",
     "precautions": ["Wash leaves thoroughly (E. coli, listeria risk)", "Avoid pre-cut bagged lettuce if immunocompromised", "Check for recalls before purchasing"],
     "allergy_warning": None},
    
    {"id": "potato-1", "name": "Potato, raw", "brand": None, "category": "Vegetables", "safety": "LIMIT", "calories": 77, "protein": 2, "carbs": 17, "fat": 0.1, "fiber": 2.2, "serving_size": "100g",
     "benefits": "Potatoes provide energy with complex carbs and potassium for blood pressure control.",
     "precautions": ["NEVER eat green potatoes (solanine toxin)", "Cook thoroughly - no raw potatoes", "High glycemic index - moderate with gestational diabetes"],
     "allergy_warning": "Potato allergy rare but possible. Cross-reactive with latex."},
    
    {"id": "sweetpotato-1", "name": "Sweet potato, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1, "fiber": 3, "serving_size": "100g",
     "benefits": "Sweet potatoes support baby's eye development with vitamin A and provide sustained energy.",
     "precautions": ["Cook thoroughly before eating", "Lower glycemic than regular potatoes but still moderate portions", "Very high vitamin A - balance with other sources"],
     "allergy_warning": None},
    
    {"id": "onion-1", "name": "Onion, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1, "fiber": 1.7, "serving_size": "100g",
     "benefits": "Onions support immune function and provide prebiotic fiber for gut health.",
     "precautions": ["May cause heartburn or indigestion", "Raw onion more likely to cause digestive upset", "Cooking mellows the effect"],
     "allergy_warning": "Onion allergy/intolerance possible. May cause digestive symptoms in sensitive individuals."},
    
    {"id": "bellpepper-1", "name": "Bell pepper, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 31, "protein": 1, "carbs": 6, "fat": 0.3, "fiber": 2.1, "serving_size": "100g",
     "benefits": "Bell peppers boost iron absorption with vitamin C and support immune health.",
     "precautions": ["Wash thoroughly", "Some people sensitive to nightshades", "Red peppers highest in nutrients"],
     "allergy_warning": "Nightshade sensitivity possible but uncommon."},
    
    {"id": "celery-1", "name": "Celery, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 16, "protein": 0.7, "carbs": 3, "fat": 0.2, "fiber": 1.6, "serving_size": "100g",
     "benefits": "Celery helps with hydration and may help reduce blood pressure during pregnancy.",
     "precautions": ["Wash thoroughly - can harbor bacteria in ribs", "High in sodium for a vegetable", "May cause allergic reaction in some"],
     "allergy_warning": "Celery allergy is common in Europe. Cross-reactive with birch pollen and mugwort."},
    
    {"id": "cauliflower-1", "name": "Cauliflower, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1.9, "carbs": 5, "fat": 0.3, "fiber": 2, "serving_size": "100g",
     "benefits": "Cauliflower supports brain development with choline and provides folate for neural tube health.",
     "precautions": ["May cause gas and bloating", "Wash thoroughly to remove insects", "Cooking reduces gas-causing compounds"],
     "allergy_warning": None},
    
    {"id": "mushroom-1", "name": "Mushrooms, white, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 22, "protein": 3.1, "carbs": 3.3, "fat": 0.3, "fiber": 1, "serving_size": "100g",
     "benefits": "Mushrooms support immune function with vitamin D (if sun-exposed) and provide B vitamins.",
     "precautions": ["ALWAYS cook mushrooms before eating when pregnant", "Never forage wild mushrooms", "Buy from reputable sources only"],
     "allergy_warning": "Mushroom allergy possible. May cause digestive or skin reactions."},
    
    {"id": "zucchini-1", "name": "Zucchini, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 17, "protein": 1.2, "carbs": 3.1, "fat": 0.3, "fiber": 1, "serving_size": "100g",
     "benefits": "Zucchini supports hydration with high water content and provides folate for baby's development.",
     "precautions": ["Wash thoroughly", "Avoid extremely large zucchini (may be bitter/toxic)", "Can be eaten raw or cooked"],
     "allergy_warning": None},
    
    {"id": "corn-1", "name": "Corn, sweet, raw", "brand": None, "category": "Vegetables", "safety": "LIMIT", "calories": 86, "protein": 3.3, "carbs": 19, "fat": 1.4, "fiber": 2.7, "serving_size": "100g",
     "benefits": "Corn provides energy and supports eye health with lutein and zeaxanthin.",
     "precautions": ["High glycemic index - limit with gestational diabetes", "Often GMO - buy organic if preferred", "Can cause bloating"],
     "allergy_warning": "Corn allergy is possible but uncommon."},
    
    {"id": "asparagus-1", "name": "Asparagus, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 20, "protein": 2.2, "carbs": 3.9, "fat": 0.1, "fiber": 2.1, "serving_size": "100g",
     "benefits": "Asparagus is one of the best folate sources, crucial for preventing neural tube defects.",
     "precautions": ["May cause strong-smelling urine (harmless)", "Wash thoroughly", "Cook to preferred tenderness"],
     "allergy_warning": None},
    
    {"id": "greenbeans-1", "name": "Green beans, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 31, "protein": 1.8, "carbs": 7, "fat": 0.1, "fiber": 2.7, "serving_size": "100g",
     "benefits": "Green beans support bone health with vitamin K and provide fiber for digestion.",
     "precautions": ["Wash thoroughly", "Trim ends before cooking", "Canned may be high in sodium"],
     "allergy_warning": None},
    
    {"id": "peas-1", "name": "Green peas, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 81, "protein": 5.4, "carbs": 14, "fat": 0.4, "fiber": 5.7, "serving_size": "100g",
     "benefits": "Peas support baby's growth with protein and provide folate for development.",
     "precautions": ["May cause gas", "Higher in carbs than most vegetables", "Frozen peas retain nutrients well"],
     "allergy_warning": "Pea allergy is increasing, especially in children. Related to legume family."},
    
    {"id": "kale-1", "name": "Kale, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 49, "protein": 4.3, "carbs": 9, "fat": 0.9, "fiber": 3.6, "serving_size": "100g",
     "benefits": "Kale supports bone health with calcium and vitamin K, and provides folate for baby.",
     "precautions": ["High in vitamin K - may affect blood thinners", "High in oxalates - moderate if prone to kidney stones", "Wash thoroughly"],
     "allergy_warning": None},
    
    {"id": "cabbage-1", "name": "Cabbage, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1.3, "carbs": 6, "fat": 0.1, "fiber": 2.5, "serving_size": "100g",
     "benefits": "Cabbage supports gut health with fiber and provides vitamin C for immune function.",
     "precautions": ["May cause gas and bloating", "Cooking reduces gas-causing compounds", "Wash thoroughly, check for insects"],
     "allergy_warning": None},
    
    {"id": "brusselssprouts-1", "name": "Brussels sprouts, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 43, "protein": 3.4, "carbs": 9, "fat": 0.3, "fiber": 3.8, "serving_size": "100g",
     "benefits": "Brussels sprouts support baby's brain development with folate and provide vitamin K for blood health.",
     "precautions": ["May cause significant gas", "High in vitamin K - consistent intake if on blood thinners", "Roasting reduces bitterness"],
     "allergy_warning": None},
    
    {"id": "eggplant-1", "name": "Eggplant, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1, "carbs": 6, "fat": 0.2, "fiber": 3, "serving_size": "100g",
     "benefits": "Eggplant provides fiber for digestion and antioxidants for cell protection.",
     "precautions": ["Cook before eating (contains solanine when raw)", "Some people sensitive to nightshades", "May cause allergic reactions"],
     "allergy_warning": "Nightshade sensitivity possible. Eggplant allergy related to latex allergy."},
    
    {"id": "artichoke-1", "name": "Artichoke, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 47, "protein": 3.3, "carbs": 11, "fat": 0.2, "fiber": 5.4, "serving_size": "100g",
     "benefits": "Artichokes support liver health and provide prebiotic fiber for gut health.",
     "precautions": ["Must be cooked properly - inedible parts can cause choking", "May increase bile flow", "Clean thoroughly"],
     "allergy_warning": "Artichoke allergy possible. Related to daisy/aster family (ragweed cross-reaction)."},
    
    {"id": "beet-1", "name": "Beets, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 43, "protein": 1.6, "carbs": 10, "fat": 0.2, "fiber": 2.8, "serving_size": "100g",
     "benefits": "Beets support healthy blood flow with nitrates and provide folate for baby's development.",
     "precautions": ["Will cause red/pink urine and stool (harmless)", "Can stain everything", "High in natural sugars compared to other vegetables"],
     "allergy_warning": None},
    
    {"id": "radish-1", "name": "Radish, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 16, "protein": 0.7, "carbs": 3.4, "fat": 0.1, "fiber": 1.6, "serving_size": "100g",
     "benefits": "Radishes support digestion and provide vitamin C for immune health.",
     "precautions": ["May cause gas", "Wash thoroughly - grows in soil", "Spiciness varies by variety"],
     "allergy_warning": None},
    
    {"id": "turnip-1", "name": "Turnip, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 28, "protein": 0.9, "carbs": 6, "fat": 0.1, "fiber": 1.8, "serving_size": "100g",
     "benefits": "Turnips support bone health with calcium and provide vitamin C for immune function.",
     "precautions": ["May cause gas", "Wash and peel before eating", "Can be eaten raw or cooked"],
     "allergy_warning": None},
    
    {"id": "leek-1", "name": "Leek, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 61, "protein": 1.5, "carbs": 14, "fat": 0.3, "fiber": 1.8, "serving_size": "100g",
     "benefits": "Leeks support gut health with prebiotic fiber and provide folate for baby's development.",
     "precautions": ["Wash very thoroughly - dirt hides between layers", "Similar to onion, may cause digestive upset", "Cook before eating if sensitive"],
     "allergy_warning": "Related to onion/garlic. May cause issues if sensitive to alliums."},
    
    {"id": "garlic-1", "name": "Garlic, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 149, "protein": 6.4, "carbs": 33, "fat": 0.5, "fiber": 2.1, "serving_size": "100g",
     "benefits": "Garlic supports immune function and may help with healthy blood pressure during pregnancy.",
     "precautions": ["May cause heartburn", "Strong smell can worsen morning sickness", "Large amounts may thin blood slightly"],
     "allergy_warning": "Garlic allergy/intolerance possible. Related to onion family."},
    
    {"id": "ginger-1", "name": "Ginger root, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 80, "protein": 1.8, "carbs": 18, "fat": 0.8, "fiber": 2, "serving_size": "100g",
     "benefits": "Ginger helps relieve morning sickness and supports digestion during pregnancy.",
     "precautions": ["Limit to 1-4g per day during pregnancy", "May interact with blood thinners", "High doses may affect contractions - stay within limits"],
     "allergy_warning": None},
    
    {"id": "squash-1", "name": "Butternut squash, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 45, "protein": 1, "carbs": 12, "fat": 0.1, "fiber": 2, "serving_size": "100g",
     "benefits": "Butternut squash supports baby's eye development with vitamin A and provides fiber for digestion.",
     "precautions": ["Cook before eating", "Can be difficult to cut - be careful", "Seeds are edible when roasted"],
     "allergy_warning": None},
    
    {"id": "pumpkin-1", "name": "Pumpkin, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 26, "protein": 1, "carbs": 7, "fat": 0.1, "fiber": 0.5, "serving_size": "100g",
     "benefits": "Pumpkin supports eye health with beta-carotene and provides potassium for muscle function.",
     "precautions": ["Cook before eating", "Canned pumpkin is nutritious option", "Avoid 'pumpkin pie mix' (has added sugar)"],
     "allergy_warning": None},
    
    {"id": "okra-1", "name": "Okra, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 33, "protein": 1.9, "carbs": 7, "fat": 0.2, "fiber": 3.2, "serving_size": "100g",
     "benefits": "Okra supports blood sugar control and provides folate for baby's neural development.",
     "precautions": ["Slimy texture when cooked may worsen nausea", "Wash thoroughly", "High-heat cooking reduces sliminess"],
     "allergy_warning": None},
    
    {"id": "bokchoy-1", "name": "Bok choy, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 13, "protein": 1.5, "carbs": 2.2, "fat": 0.2, "fiber": 1, "serving_size": "100g",
     "benefits": "Bok choy supports bone health with calcium and provides folate for baby's development.",
     "precautions": ["Wash thoroughly", "Contains goitrogens - cook if thyroid issues", "Very low calorie"],
     "allergy_warning": None},
    
    {"id": "arugula-1", "name": "Arugula, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 2.6, "carbs": 3.7, "fat": 0.7, "fiber": 1.6, "serving_size": "100g",
     "benefits": "Arugula provides folate for neural tube health and calcium for bone development.",
     "precautions": ["Wash thoroughly", "Peppery taste may trigger nausea", "Nitrate content is normal"],
     "allergy_warning": None},
    
    {"id": "watercress-1", "name": "Watercress, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 11, "protein": 2.3, "carbs": 1.3, "fat": 0.1, "fiber": 0.5, "serving_size": "100g",
     "benefits": "Watercress provides vitamin K for blood health and antioxidants for cell protection.",
     "precautions": ["MUST wash very thoroughly (parasite risk if wild)", "Only buy from reputable sources", "Never eat wild watercress raw"],
     "allergy_warning": None},

    # ==================== PROTEINS (40 items) ====================
    {"id": "chicken-breast-1", "name": "Chicken breast, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0, "serving_size": "100g",
     "benefits": "Chicken breast provides lean protein for baby's growth and B vitamins for energy.",
     "precautions": ["MUST be cooked to 165°F/74°C internal temperature", "No pink in the middle", "Avoid cross-contamination with raw chicken"],
     "allergy_warning": "Chicken allergy rare but possible."},
    
    {"id": "chicken-thigh-1", "name": "Chicken thigh, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 209, "protein": 26, "carbs": 0, "fat": 11, "fiber": 0, "serving_size": "100g",
     "benefits": "Chicken thighs provide iron and zinc for baby's development and protein for growth.",
     "precautions": ["Higher in fat than breast", "Cook to 165°F/74°C", "Remove skin to reduce fat content"],
     "allergy_warning": "Chicken allergy rare but possible."},
    
    {"id": "salmon-1", "name": "Salmon, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "fiber": 0, "serving_size": "100g",
     "benefits": "Salmon provides DHA for baby's brain and eye development and omega-3s for your heart.",
     "precautions": ["Limit to 2-3 servings per week (mercury)", "Choose wild-caught when possible", "Cook to 145°F/63°C - no raw salmon during pregnancy"],
     "allergy_warning": "Fish allergy is common. Salmon allergy possible if allergic to other fish."},
    
    {"id": "beef-ground-1", "name": "Beef, ground, 90% lean", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 176, "protein": 26, "carbs": 0, "fat": 8, "fiber": 0, "serving_size": "100g",
     "benefits": "Beef provides iron to prevent pregnancy anemia and zinc for baby's immune development.",
     "precautions": ["MUST be cooked to 160°F/71°C throughout", "No pink in ground beef", "Choose lean cuts to limit saturated fat"],
     "allergy_warning": "Beef allergy rare. Alpha-gal syndrome (from tick bites) can cause beef allergy."},
    
    {"id": "egg-1", "name": "Egg, whole, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "fiber": 0, "serving_size": "100g",
     "benefits": "Eggs provide choline for baby's brain development and complete protein for growth.",
     "precautions": ["Cook until yolk and white are firm", "No runny eggs during pregnancy", "Check for cracks before buying"],
     "allergy_warning": "Egg allergy is one of the most common food allergies. Introduce carefully."},
    
    {"id": "tuna-1", "name": "Tuna, canned in water", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 116, "protein": 26, "carbs": 0, "fat": 0.8, "fiber": 0, "serving_size": "100g",
     "benefits": "Tuna provides lean protein and omega-3s for baby's brain development.",
     "precautions": ["Limit to 2-3 cans per WEEK due to mercury", "Choose 'light' tuna (lower mercury than albacore)", "Avoid bigeye tuna entirely"],
     "allergy_warning": "Fish allergy is common. Tuna is a major allergen."},
    
    {"id": "shrimp-1", "name": "Shrimp, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 99, "protein": 24, "carbs": 0.2, "fat": 0.3, "fiber": 0, "serving_size": "100g",
     "benefits": "Shrimp provides protein with very low mercury and iodine for thyroid health.",
     "precautions": ["Cook until pink and opaque", "Low in mercury - safer than many fish", "Buy from reputable sources"],
     "allergy_warning": "Shellfish allergy is very common and often severe. Do not eat if allergic to shellfish."},
    
    {"id": "turkey-breast-1", "name": "Turkey breast, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 135, "protein": 30, "carbs": 0, "fat": 0.7, "fiber": 0, "serving_size": "100g",
     "benefits": "Turkey provides lean protein and tryptophan for mood support during pregnancy.",
     "precautions": ["Cook to 165°F/74°C", "Avoid deli turkey unless heated until steaming", "Fresh is better than processed"],
     "allergy_warning": "Poultry allergy rare but possible."},
    
    {"id": "bacon-1", "name": "Bacon, cooked", "brand": None, "category": "Proteins", "safety": "AVOID", "calories": 541, "protein": 37, "carbs": 1.4, "fat": 42, "fiber": 0, "serving_size": "100g",
     "benefits": "Bacon provides protein and B vitamins, but healthier options exist.",
     "precautions": ["Very high in sodium and saturated fat", "Contains nitrates/nitrites - limit exposure", "Cook until crispy to reduce bacteria risk"],
     "allergy_warning": None},
    
    {"id": "tofu-1", "name": "Tofu, firm", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8, "fiber": 0.3, "serving_size": "100g",
     "benefits": "Tofu provides plant protein and calcium for bone health during pregnancy.",
     "precautions": ["Choose organic to avoid GMO if preferred", "Press to remove excess water before cooking", "Moderate intake - soy contains phytoestrogens"],
     "allergy_warning": "Soy allergy is one of the top 8 allergens. Avoid completely if allergic."},
    
    {"id": "lentils-1", "name": "Lentils, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4, "fiber": 8, "serving_size": "100g",
     "benefits": "Lentils prevent anemia with iron and support baby's growth with folate and protein.",
     "precautions": ["May cause gas - introduce gradually", "Cook thoroughly", "Rinse before cooking"],
     "allergy_warning": "Legume allergy possible. Cross-reactive with peanut allergy in some cases."},
    
    {"id": "chickpeas-1", "name": "Chickpeas, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 164, "protein": 9, "carbs": 27, "fat": 2.6, "fiber": 8, "serving_size": "100g",
     "benefits": "Chickpeas provide plant protein and fiber for digestive health during pregnancy.",
     "precautions": ["May cause gas", "Canned are convenient but rinse to reduce sodium", "Cook dried chickpeas thoroughly"],
     "allergy_warning": "Legume allergy possible. Cross-reactive with other legumes and peanuts."},
    
    {"id": "black-beans-1", "name": "Black beans, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 132, "protein": 9, "carbs": 24, "fat": 0.5, "fiber": 8.7, "serving_size": "100g",
     "benefits": "Black beans support steady blood sugar with fiber and provide iron for blood health.",
     "precautions": ["May cause gas", "Rinse canned beans well", "Never eat raw or undercooked beans"],
     "allergy_warning": "Legume allergy possible."},
    
    {"id": "cod-1", "name": "Cod, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 105, "protein": 23, "carbs": 0, "fat": 0.9, "fiber": 0, "serving_size": "100g",
     "benefits": "Cod provides lean protein with very low mercury content, safe during pregnancy.",
     "precautions": ["Cook to 145°F/63°C", "Low mercury - one of the safest fish", "Choose Pacific cod when possible"],
     "allergy_warning": "Fish allergy is common. Cod is a major fish allergen."},
    
    {"id": "almonds-1", "name": "Almonds, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 579, "protein": 21, "carbs": 22, "fat": 50, "fiber": 12, "serving_size": "100g",
     "benefits": "Almonds support strong bones, prevent anemia, and boost your baby's brain growth.",
     "precautions": ["High in calories - watch portion sizes (1oz = ~23 almonds)", "Can be a choking hazard - chew thoroughly", "Store properly to prevent rancidity"],
     "allergy_warning": "Tree nut allergy is common and can be severe. Not safe if allergic to nuts. Always check with your doctor if you have allergies or concerns."},
    
    {"id": "peanuts-1", "name": "Peanuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 567, "protein": 26, "carbs": 16, "fat": 49, "fiber": 8.5, "serving_size": "100g",
     "benefits": "Peanuts provide folate for neural tube development and protein for baby's growth.",
     "precautions": ["High calorie - portion control important", "Research suggests eating peanuts during pregnancy may reduce baby's allergy risk", "Avoid if you have peanut allergy"],
     "allergy_warning": "Peanut allergy is one of the most common and severe food allergies. Not safe if allergic to peanuts. Always consult your doctor if you have a history of food allergies."},
    
    {"id": "walnuts-1", "name": "Walnuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 654, "protein": 15, "carbs": 14, "fat": 65, "fiber": 6.7, "serving_size": "100g",
     "benefits": "Walnuts provide omega-3 fatty acids for baby's brain development and antioxidants for cell health.",
     "precautions": ["Highest calorie nut - small portions recommended", "Store in refrigerator to prevent rancidity", "May interact with thyroid medications"],
     "allergy_warning": "Tree nut allergy is common and can be life-threatening. Not safe if allergic to tree nuts."},
    
    {"id": "chia-seeds-1", "name": "Chia seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 486, "protein": 17, "carbs": 42, "fat": 31, "fiber": 34, "serving_size": "100g",
     "benefits": "Chia seeds provide omega-3s for baby's brain and fiber for pregnancy constipation relief.",
     "precautions": ["Always soak or add to liquid (can expand and cause choking if dry)", "Very high fiber - start with small amounts", "Stay hydrated when eating"],
     "allergy_warning": "Chia seed allergy is rare but possible. Stop if you notice any allergic symptoms."},
    
    {"id": "sunflower-seeds-1", "name": "Sunflower seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 584, "protein": 21, "carbs": 20, "fat": 51, "fiber": 8.6, "serving_size": "100g",
     "benefits": "Sunflower seeds provide vitamin E for skin health and folate for baby's development.",
     "precautions": ["High in calories", "Shells are not edible", "Watch sodium in salted varieties"],
     "allergy_warning": "Sunflower seed allergy is uncommon but increasing. Often safe for those with tree nut allergies, but not always."},
    
    {"id": "peanut-butter-1", "name": "Peanut butter, natural", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "fiber": 6, "serving_size": "100g",
     "benefits": "Peanut butter provides protein and healthy fats, and may help reduce baby's allergy risk when eaten during pregnancy.",
     "precautions": ["High calorie - stick to 2 tbsp serving", "Choose natural without added sugar/oil", "Check for recalls - can harbor bacteria"],
     "allergy_warning": "Peanut allergy is very common and severe. Not safe if allergic to peanuts. Consult your doctor about peanut consumption during pregnancy if allergy history."},

    # ==================== DAIRY (15 items) ====================
    {"id": "milk-whole-1", "name": "Milk, whole", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0, "serving_size": "100ml",
     "benefits": "Milk provides calcium for baby's bone development and protein for growth.",
     "precautions": ["ONLY pasteurized milk during pregnancy", "Higher in saturated fat than low-fat options", "Consider fortified milk for extra vitamin D"],
     "allergy_warning": "Milk allergy is one of the most common food allergies. Lactose intolerance is also common."},
    
    {"id": "milk-skim-1", "name": "Milk, skim", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 34, "protein": 3.4, "carbs": 5, "fat": 0.1, "fiber": 0, "serving_size": "100ml",
     "benefits": "Skim milk provides calcium and protein without extra saturated fat.",
     "precautions": ["Must be pasteurized", "Lower in vitamins A and D than whole milk", "Check if fortified"],
     "allergy_warning": "Milk allergy is one of the most common food allergies. Lactose intolerance also affects many adults."},
    
    {"id": "cheese-cheddar-1", "name": "Cheese, cheddar", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 403, "protein": 25, "carbs": 1.3, "fat": 33, "fiber": 0, "serving_size": "100g",
     "benefits": "Cheddar provides calcium for bones and protein for baby's development. Safe hard cheese.",
     "precautions": ["High in sodium and saturated fat", "Hard cheeses are safe during pregnancy", "Watch portion sizes"],
     "allergy_warning": "Milk/dairy allergy common. Lactose content is lower in aged cheeses."},
    
    {"id": "yogurt-greek-1", "name": "Greek yogurt, plain", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.7, "fiber": 0, "serving_size": "100g",
     "benefits": "Greek yogurt supports gut health with probiotics and provides protein for baby's growth.",
     "precautions": ["Choose pasteurized", "Plain has no added sugar - add fruit yourself", "Check probiotic content"],
     "allergy_warning": "Milk allergy is common. Greek yogurt is lower in lactose than regular yogurt."},
    
    {"id": "butter-1", "name": "Butter, salted", "brand": None, "category": "Dairy", "safety": "AVOID", "calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81, "fiber": 0, "serving_size": "100g",
     "benefits": "Butter provides vitamin A but healthier fat sources are available.",
     "precautions": ["Very high in saturated fat", "High calorie", "Use sparingly - not a health food"],
     "allergy_warning": "Contains milk proteins. Not safe for milk allergy (different from lactose intolerance)."},
    
    {"id": "cottage-cheese-1", "name": "Cottage cheese, low-fat", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 72, "protein": 12, "carbs": 2.7, "fat": 1, "fiber": 0, "serving_size": "100g",
     "benefits": "Cottage cheese provides protein and calcium with less fat than many cheeses.",
     "precautions": ["Must be pasteurized", "Check sodium content", "Eat within a few days of opening"],
     "allergy_warning": "Milk allergy is common. Contains lactose."},

    # ==================== BEVERAGES (10 items) ====================
    {"id": "coffee-1", "name": "Coffee, brewed, black", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 2, "protein": 0.3, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml",
     "benefits": "Coffee provides antioxidants and may help with alertness during pregnancy fatigue.",
     "precautions": ["Limit to 200mg caffeine per day (about 12oz coffee)", "Caffeine crosses placenta", "Avoid in late evening to protect sleep"],
     "allergy_warning": None},
    
    {"id": "tea-green-1", "name": "Tea, green, brewed", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 1, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml",
     "benefits": "Green tea provides antioxidants and has less caffeine than coffee.",
     "precautions": ["Contains caffeine - count toward daily limit", "May reduce folate absorption in high amounts", "2-3 cups per day is generally safe"],
     "allergy_warning": None},
    
    {"id": "orange-juice-1", "name": "Orange juice, fresh", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 45, "protein": 0.7, "carbs": 10, "fat": 0.2, "fiber": 0.2, "serving_size": "100ml",
     "benefits": "Orange juice provides vitamin C for iron absorption and folate for baby's development.",
     "precautions": ["MUST be pasteurized during pregnancy", "High in sugar - limit portions", "Whole oranges are better (more fiber)"],
     "allergy_warning": "Citrus allergy is uncommon but possible."},
    
    {"id": "almond-milk-1", "name": "Almond milk, unsweetened", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 15, "protein": 0.6, "carbs": 0.3, "fat": 1.2, "fiber": 0, "serving_size": "100ml",
     "benefits": "Almond milk provides a low-calorie dairy alternative with vitamin E.",
     "precautions": ["Lower in protein than cow's milk", "Check if calcium/vitamin D fortified", "Not suitable for nut allergies"],
     "allergy_warning": "Tree nut allergy - not safe if allergic to almonds or tree nuts."},
    
    {"id": "soda-cola-1", "name": "Cola, regular", "brand": None, "category": "Beverages", "safety": "AVOID", "calories": 42, "protein": 0, "carbs": 11, "fat": 0, "fiber": 0, "serving_size": "100ml",
     "benefits": "None significant - provides only sugar and caffeine.",
     "precautions": ["High in sugar with no nutritional value", "Contains caffeine", "Linked to gestational diabetes risk when consumed frequently"],
     "allergy_warning": None},
    
    {"id": "coconut-water-1", "name": "Coconut water", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 19, "protein": 0.7, "carbs": 3.7, "fat": 0.2, "fiber": 1.1, "serving_size": "100ml",
     "benefits": "Coconut water helps with hydration and provides electrolytes for pregnancy.",
     "precautions": ["Natural sugars - don't overdo it", "Choose varieties without added sugar", "Not a complete hydration replacement"],
     "allergy_warning": "Coconut allergy is rare. FDA classifies as tree nut but most tree nut allergics can eat coconut."},

    # ==================== SNACKS (10 items) ====================
    {"id": "popcorn-1", "name": "Popcorn, air-popped", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 387, "protein": 13, "carbs": 78, "fat": 4.5, "fiber": 15, "serving_size": "100g",
     "benefits": "Popcorn provides whole grain fiber for digestive health during pregnancy.",
     "precautions": ["Avoid microwave popcorn (chemicals in lining)", "No butter = healthier", "Can be a choking hazard - chew well"],
     "allergy_warning": "Corn allergy is uncommon but possible."},
    
    {"id": "chips-potato-1", "name": "Potato chips, regular", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 536, "protein": 7, "carbs": 53, "fat": 35, "fiber": 4.4, "serving_size": "100g",
     "benefits": "Limited - provides some potassium but healthier options exist.",
     "precautions": ["Very high in sodium and fat", "Highly processed", "Easy to overeat - avoid if possible"],
     "allergy_warning": None},
    
    {"id": "chocolate-dark-1", "name": "Dark chocolate (70%)", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 598, "protein": 7.8, "carbs": 46, "fat": 43, "fiber": 11, "serving_size": "100g",
     "benefits": "Dark chocolate provides antioxidants and may improve mood during pregnancy.",
     "precautions": ["Contains caffeine - count toward daily limit", "High calorie - 1-2 squares is a serving", "Higher cocoa % = more caffeine"],
     "allergy_warning": "May contain milk. Check label for allergens."},
    
    {"id": "hummus-1", "name": "Hummus", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 166, "protein": 8, "carbs": 14, "fat": 10, "fiber": 6, "serving_size": "100g",
     "benefits": "Hummus provides plant protein and fiber, and is a nutritious pregnancy snack.",
     "precautions": ["Check refrigeration - perishable", "Commercial hummus safer than homemade during pregnancy", "Watch serving size (calorie-dense)"],
     "allergy_warning": "Sesame allergy is increasing - hummus contains tahini (sesame). Chickpea/legume allergy also possible."},
    
    {"id": "ice-cream-1", "name": "Ice cream, vanilla", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 207, "protein": 3.5, "carbs": 24, "fat": 11, "fiber": 0, "serving_size": "100g",
     "benefits": "Provides calcium but healthier sources are available.",
     "precautions": ["High in sugar and saturated fat", "Soft-serve may have listeria risk", "Stick to pre-packaged, commercial brands"],
     "allergy_warning": "Contains milk and often eggs. Common allergens."},
    
    {"id": "protein-bar-1", "name": "Protein bar", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 373, "protein": 30, "carbs": 35, "fat": 12, "fiber": 5, "serving_size": "100g",
     "benefits": "Protein bars provide convenient protein for pregnancy when whole foods aren't available.",
     "precautions": ["Read labels - many are high in sugar", "Not a meal replacement", "Some contain artificial sweeteners"],
     "allergy_warning": "Check labels carefully - often contain nuts, soy, milk, and other allergens."},
]

# Models
class FoodItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    serving_size: Optional[str] = None
    category: Optional[str] = None
    safety: Optional[str] = "SAFE"
    benefits: Optional[str] = None
    precautions: Optional[List[str]] = None
    allergy_warning: Optional[str] = None

class FoodSearchResponse(BaseModel):
    foods: List[FoodItem]
    total: int
    page: int
    page_size: int
    source: str = "local"


def search_local_foods(query: str, page: int = 1, page_size: int = 300) -> FoodSearchResponse:
    """Search the local food database - instant filtering"""
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
    paginated_foods = foods[start:end]
    
    return FoodSearchResponse(
        foods=paginated_foods,
        total=total,
        page=page,
        page_size=page_size,
        source="local"
    )


@api_router.get("/")
async def root():
    return {"message": "WhatToEat Food API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/foods/search", response_model=FoodSearchResponse)
async def search_foods(
    query: str = Query("", max_length=200),
    page: int = Query(1, ge=1, le=100),
    page_size: int = Query(300, ge=1, le=300)
):
    return search_local_foods(query, page, page_size)


@api_router.get("/foods/all", response_model=FoodSearchResponse)
async def get_all_foods(
    page: int = Query(1, ge=1, le=100),
    page_size: int = Query(300, ge=1, le=300)
):
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


@api_router.get("/stats")
async def get_stats():
    total = len(LOCAL_FOODS)
    by_category = {}
    by_safety = {"SAFE": 0, "LIMIT": 0, "AVOID": 0}
    
    for food in LOCAL_FOODS:
        cat = food.get("category", "Unknown")
        by_category[cat] = by_category.get(cat, 0) + 1
        safety = food.get("safety", "SAFE")
        by_safety[safety] = by_safety.get(safety, 0) + 1
    
    return {
        "total_foods": total,
        "by_category": by_category,
        "by_safety": by_safety
    }


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
