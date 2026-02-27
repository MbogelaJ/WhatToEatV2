from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Symptom keywords for safety guard
SYMPTOM_KEYWORDS = [
    'bleeding', 'bleed', 'blood', 'bloody',
    'severe pain', 'sharp pain', 'extreme pain', 'intense pain',
    'fever', 'high temperature', 'chills',
    'vomiting', 'nausea', 'throwing up', 'can\'t keep food down',
    'dizzy', 'dizziness', 'faint', 'fainting', 'lightheaded',
    'headache', 'migraine', 'head hurts',
    'cramps', 'cramping', 'contractions',
    'swelling', 'swollen',
    'chest pain', 'difficulty breathing', 'shortness of breath'
]

# Personal question indicators - questions seeking individualized guidance
PERSONAL_INDICATORS = [
    'i am', 'i\'m', 'im ', 'i have', 'i\'ve',
    'my doctor', 'my pregnancy', 'my baby', 'my condition',
    'should i', 'can i', 'is it safe for me', 'is it ok for me',
    'weeks pregnant', 'trimester', 'due date',
    'diabetes', 'diabetic', 'gestational diabetes',
    'high blood pressure', 'hypertension', 'preeclampsia',
    'anemia', 'anemic',
    'allergic', 'allergy', 'allergies',
    'medication', 'medicine', 'prescription',
    'diagnosed', 'diagnosis',
    'my weight', 'my age', 'my health',
    'for me', 'in my case', 'my situation',
    'what should i do', 'what do you recommend', 'what do you suggest',
    'is it okay if i', 'am i allowed'
]

PERSONAL_RESPONSE = "This app cannot provide individualized guidance. Please consult a healthcare professional."

SYMPTOM_RESPONSE = {
    "is_symptom_detected": True,
    "message": "We cannot assess symptoms. Please contact a healthcare provider or local emergency service.",
    "emergency_note": "If you are experiencing a medical emergency, please call emergency services immediately."
}

# Models
class FoodItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    safety_level: str  # "safe", "limit", "avoid"
    description: str
    nutrition_note: str  # Educational reference information
    context: Optional[str] = None
    alternatives: Optional[List[str]] = None
    nutrients: Optional[List[str]] = None
    sources: List[str] = ["WHO", "CDC", "NHS pregnancy nutrition guidance"]

class QAQuestion(BaseModel):
    query: str

class QAResponse(BaseModel):
    query: str
    topic_matched: str = None
    information: str
    is_symptom_detected: bool = False
    is_personal_question: bool = False
    sources: List[str] = ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    disclaimer: str = "This is general educational reference information only and does not constitute medical advice, diagnosis, or treatment."

class SearchQuery(BaseModel):
    query: str

# Sample food database with educational language
FOOD_DATABASE = [
    {
        "id": "1",
        "name": "Salmon",
        "category": "Fish & Seafood",
        "safety_level": "safe",
        "description": "Rich in omega-3 fatty acids and protein",
        "nutrition_note": "Commonly included in balanced pregnancy diets when thoroughly cooked. Contains nutrients often mentioned in prenatal nutrition literature.",
        "context": "Fish like salmon are frequently referenced in public health nutrition guidance as a source of omega-3 fatty acids.",
        "alternatives": None,
        "nutrients": ["Omega-3", "Protein", "Vitamin D", "B12"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "2",
        "name": "Sushi (Raw Fish)",
        "category": "Fish & Seafood",
        "safety_level": "avoid",
        "description": "Raw or undercooked fish dishes",
        "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial and parasitic contamination concerns.",
        "context": "Public health organizations often note that raw fish may carry parasites or bacteria.",
        "alternatives": ["Cooked sushi rolls", "Vegetable sushi", "Fully cooked shrimp tempura rolls"],
        "nutrients": ["Protein", "Omega-3"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "3",
        "name": "Soft Cheese (Unpasteurized)",
        "category": "Dairy",
        "safety_level": "avoid",
        "description": "Includes brie, camembert, blue cheese made from unpasteurized milk",
        "nutrition_note": "Sometimes restricted in food safety guidance due to potential listeria contamination concerns.",
        "context": "Unpasteurized soft cheeses are noted in public health literature as potential carriers of listeria bacteria.",
        "alternatives": ["Hard cheeses", "Pasteurized soft cheeses", "Cream cheese"],
        "nutrients": ["Calcium", "Protein"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "4",
        "name": "Eggs",
        "category": "Protein",
        "safety_level": "safe",
        "description": "Source of protein and choline",
        "nutrition_note": "Commonly included in balanced pregnancy diets when fully cooked. Eggs are noted as a choline source in nutrition literature.",
        "context": "Choline is a nutrient frequently mentioned in prenatal nutrition educational materials.",
        "alternatives": None,
        "nutrients": ["Protein", "Choline", "B12", "Iron"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "5",
        "name": "Raw Eggs",
        "category": "Protein",
        "safety_level": "avoid",
        "description": "Found in homemade mayonnaise, some desserts, raw cookie dough",
        "nutrition_note": "Sometimes restricted in food safety guidance due to salmonella concerns.",
        "context": "Food safety literature notes that raw eggs may contain salmonella bacteria.",
        "alternatives": ["Fully cooked eggs", "Pasteurized egg products", "Store-bought pasteurized mayonnaise"],
        "nutrients": ["Protein"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "6",
        "name": "Caffeine",
        "category": "Beverages",
        "safety_level": "limit",
        "description": "Found in coffee, tea, chocolate, and some sodas",
        "nutrition_note": "Often limited in public health guidance. Many organizations reference 200mg daily as a common threshold mentioned in literature.",
        "context": "Research studies have examined associations between caffeine intake and pregnancy outcomes.",
        "alternatives": ["Decaf coffee", "Herbal teas (verify individual types)", "Water with lemon"],
        "nutrients": None,
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "7",
        "name": "Alcohol",
        "category": "Beverages",
        "safety_level": "avoid",
        "description": "All alcoholic beverages including wine, beer, and spirits",
        "nutrition_note": "Public health organizations consistently note that no amount has been established as without risk during pregnancy.",
        "context": "Alcohol is noted in medical literature to cross the placenta.",
        "alternatives": ["Sparkling water", "Mocktails", "Fruit juices"],
        "nutrients": None,
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "8",
        "name": "Leafy Greens",
        "category": "Vegetables",
        "safety_level": "safe",
        "description": "Spinach, kale, swiss chard, and other dark leafy vegetables",
        "nutrition_note": "Commonly included in balanced pregnancy diets when washed thoroughly. Noted as a folate source in nutrition literature.",
        "context": "Leafy greens are frequently referenced in prenatal nutrition educational materials for their nutrient content.",
        "alternatives": None,
        "nutrients": ["Folate", "Iron", "Fiber", "Vitamin K", "Calcium"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "9",
        "name": "Deli Meats",
        "category": "Meat",
        "safety_level": "limit",
        "description": "Pre-packaged or deli-sliced cold cuts",
        "nutrition_note": "Often limited in public health guidance. Typically prepared carefully (heated until steaming) according to food safety literature.",
        "context": "Food safety literature notes that deli meats may contain listeria bacteria which can survive refrigeration.",
        "alternatives": ["Freshly cooked meats", "Heated deli meats (steaming hot)", "Canned chicken or tuna"],
        "nutrients": ["Protein", "Iron"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "10",
        "name": "Berries",
        "category": "Fruits",
        "safety_level": "safe",
        "description": "Strawberries, blueberries, raspberries, and blackberries",
        "nutrition_note": "May be included as part of a varied diet when washed thoroughly. Noted for antioxidant content in nutrition literature.",
        "context": "Berries are referenced in general nutrition guidance as sources of fiber and vitamin C.",
        "alternatives": None,
        "nutrients": ["Vitamin C", "Fiber", "Antioxidants", "Folate"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "11",
        "name": "High Mercury Fish",
        "category": "Fish & Seafood",
        "safety_level": "avoid",
        "description": "Shark, swordfish, king mackerel, tilefish, bigeye tuna",
        "nutrition_note": "Sometimes restricted in food safety guidance due to mercury content concerns noted in public health literature.",
        "context": "Mercury accumulation is a topic discussed in environmental health and nutrition literature.",
        "alternatives": ["Salmon", "Sardines", "Anchovies", "Tilapia", "Cod"],
        "nutrients": ["Protein", "Omega-3"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "12",
        "name": "Greek Yogurt",
        "category": "Dairy",
        "safety_level": "safe",
        "description": "Pasteurized yogurt high in protein and probiotics",
        "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as a calcium and protein source in nutrition literature.",
        "context": "Dairy products are frequently referenced in prenatal nutrition educational materials.",
        "alternatives": None,
        "nutrients": ["Calcium", "Protein", "Probiotics", "B12"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "13",
        "name": "Liver",
        "category": "Meat",
        "safety_level": "limit",
        "description": "All types of liver and liver products like pate",
        "nutrition_note": "Often limited in public health guidance due to very high vitamin A content noted in nutrition literature.",
        "context": "Vitamin A intake thresholds are discussed in prenatal nutrition educational materials.",
        "alternatives": ["Lean beef", "Chicken breast", "Legumes for iron"],
        "nutrients": ["Iron", "Vitamin A", "B12"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "14",
        "name": "Avocado",
        "category": "Fruits",
        "safety_level": "safe",
        "description": "Nutrient-dense fruit rich in healthy fats",
        "nutrition_note": "May be included as part of a varied diet. Noted as a folate and potassium source in nutrition literature.",
        "context": "Avocados are referenced in general nutrition guidance for their nutrient density.",
        "alternatives": None,
        "nutrients": ["Folate", "Potassium", "Fiber", "Healthy Fats", "Vitamin K"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "15",
        "name": "Sprouts (Raw)",
        "category": "Vegetables",
        "safety_level": "avoid",
        "description": "Raw alfalfa, clover, radish, and mung bean sprouts",
        "nutrition_note": "Sometimes restricted in food safety guidance when raw due to bacterial concerns noted in public health literature.",
        "context": "Food safety literature notes that sprout growing conditions may also support bacterial growth.",
        "alternatives": ["Cooked sprouts", "Leafy greens", "Other cooked vegetables"],
        "nutrients": ["Fiber", "Vitamins"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    }
]

# Educational Q&A responses - General nutrition information only
QA_DATABASE = {
    "folate": "General nutrition information: Folate is a B-vitamin discussed extensively in prenatal nutrition literature, particularly regarding neural tube formation in early pregnancy. Public health guidance commonly references 400-800mcg daily. Food sources noted in educational materials include leafy greens, legumes, and fortified cereals.",
    "folic acid": "General nutrition information: Folic acid is the synthetic form of folate found in supplements and fortified foods. Prenatal nutrition literature frequently discusses supplementation timing. For personalized guidance, consulting a healthcare provider is suggested.",
    "iron": "General nutrition information: Iron is discussed in prenatal literature in relation to blood volume changes during pregnancy. Food sources commonly noted include lean meats, beans, fortified cereals, and leafy greens. Vitamin C is referenced as supporting iron absorption.",
    "calcium": "General nutrition information: Calcium is discussed in nutrition literature regarding bone and teeth formation. Food sources commonly noted include dairy products, fortified plant milks, leafy greens, and almonds. Public health materials often reference 1000mg daily as a common threshold.",
    "vitamin d": "General nutrition information: Vitamin D is discussed in nutrition literature regarding calcium absorption and bone health. Sources noted include sunlight exposure, fortified foods, and fatty fish. Individual needs vary; consulting a healthcare provider is suggested for personalized guidance.",
    "omega-3": "General nutrition information: Omega-3 fatty acids, particularly DHA, are frequently discussed in prenatal nutrition literature. Food sources commonly noted include fatty fish (like salmon), walnuts, and flaxseeds.",
    "protein": "General nutrition information: Protein needs are discussed in prenatal nutrition literature as typically increasing during pregnancy. Food sources commonly noted include lean meats, poultry, fish, eggs, dairy, legumes, and nuts.",
    "water": "General nutrition information: Hydration is discussed in prenatal literature regarding various bodily functions. Educational materials commonly reference 8-12 glasses daily, though individual needs vary.",
    "morning sickness": "General nutrition information: Morning sickness is commonly discussed in pregnancy literature. Dietary strategies noted in educational materials include small, frequent meals, avoiding strong smells, and crackers before rising. Individual experiences vary; consulting a healthcare provider is suggested for persistent concerns.",
    "cravings": "General nutrition information: Food cravings are commonly discussed in pregnancy literature and may relate to hormonal changes. Educational materials generally note maintaining overall nutritional variety. Consulting a healthcare provider is suggested for unusual or persistent cravings.",
    "weight gain": "General nutrition information: Weight changes during pregnancy are discussed in prenatal literature and vary based on individual factors. For personalized guidance, consulting a healthcare provider is suggested.",
    "fish": "General nutrition information: Fish is discussed in prenatal nutrition literature as a source of omega-3 fatty acids. Public health guidance commonly references 2-3 servings weekly of lower-mercury varieties. Mercury content varies by fish type and is discussed in food safety literature.",
    "vegetarian": "General nutrition information: Vegetarian diets are discussed in prenatal nutrition literature. Key nutrients commonly noted include protein, iron, B12, calcium, and omega-3s. Consulting a registered dietitian is suggested for personalized meal planning.",
    "organic": "General nutrition information: Organic and conventional foods are both discussed in nutrition literature. Thorough washing of all produce is commonly noted in food safety guidance. Food choice is a personal decision.",
    "default": "Thank you for your question about pregnancy nutrition. This app provides general educational nutrition information only. For personalized guidance tailored to your specific situation, consulting with a healthcare provider or registered dietitian is suggested."
}

def detect_symptoms(text: str) -> bool:
    """Check if the text contains symptom-related keywords"""
    text_lower = text.lower()
    for keyword in SYMPTOM_KEYWORDS:
        if keyword in text_lower:
            return True
    return False

def detect_personal_question(text: str) -> bool:
    """Check if the question is seeking personalized/individualized guidance"""
    text_lower = text.lower()
    for indicator in PERSONAL_INDICATORS:
        if indicator in text_lower:
            return True
    return False

def get_topic_info(query: str) -> tuple:
    """Map query to existing nutrition topics and return educational information"""
    query_lower = query.lower()
    
    # First check QA database for topic matches
    for key, answer in QA_DATABASE.items():
        if key != "default" and key in query_lower:
            return (key, answer)
    
    # Check if query matches any food items
    for food in FOOD_DATABASE:
        food_name_lower = food["name"].lower()
        if food_name_lower in query_lower or any(word in query_lower for word in food_name_lower.split()):
            return (food["name"], f"Food item: {food['name']} ({food['category']}). {food['nutrition_note']} {food.get('context', '')}")
    
    # Check category matches
    categories = ["fish", "seafood", "dairy", "protein", "beverages", "vegetables", "fruits", "meat"]
    for cat in categories:
        if cat in query_lower:
            matching_foods = [f for f in FOOD_DATABASE if cat in f["category"].lower()]
            if matching_foods:
                food_list = ", ".join([f["name"] for f in matching_foods[:3]])
                return (cat, f"Category: {cat.title()}. Related items in our database include: {food_list}. Each food item has specific information noted in public health literature.")
    
    return (None, QA_DATABASE["default"])

# API Routes
@api_router.get("/")
async def root():
    return {"message": "NurtureNote - Pregnancy Nutrition Education API"}

@api_router.get("/foods", response_model=List[dict])
async def get_all_foods():
    """Get all foods in the database"""
    return FOOD_DATABASE

@api_router.get("/foods/search")
async def search_foods(q: str = ""):
    """Search foods by name or category"""
    if not q:
        return FOOD_DATABASE
    
    query_lower = q.lower()
    results = [
        food for food in FOOD_DATABASE
        if query_lower in food["name"].lower() 
        or query_lower in food["category"].lower()
        or query_lower in food.get("description", "").lower()
    ]
    return results

@api_router.get("/foods/{food_id}")
async def get_food_detail(food_id: str):
    """Get detailed information about a specific food"""
    for food in FOOD_DATABASE:
        if food["id"] == food_id:
            return food
    raise HTTPException(status_code=404, detail="Food not found")

@api_router.get("/foods/category/{category}")
async def get_foods_by_category(category: str):
    """Get foods by category"""
    results = [
        food for food in FOOD_DATABASE
        if category.lower() in food["category"].lower()
    ]
    return results

@api_router.get("/foods/safety/{safety_level}")
async def get_foods_by_safety(safety_level: str):
    """Get foods by safety level (safe, limit, avoid)"""
    if safety_level not in ["safe", "limit", "avoid"]:
        raise HTTPException(status_code=400, detail="Invalid safety level. Use: safe, limit, or avoid")
    
    results = [
        food for food in FOOD_DATABASE
        if food["safety_level"] == safety_level
    ]
    return results

@api_router.post("/nutrition-topics/search", response_model=QAResponse)
async def search_nutrition_topics(query_data: QAQuestion):
    """Search nutrition topics - returns general educational information only"""
    query = query_data.query
    
    # Check for symptom keywords first (safety)
    if detect_symptoms(query):
        return QAResponse(
            query=query,
            topic_matched=None,
            information="We cannot assess symptoms. Please contact a healthcare provider or local emergency service.",
            is_symptom_detected=True,
            is_personal_question=False,
            sources=["Medical Professional Consultation Suggested"],
            disclaimer="If you are experiencing a medical emergency, please call emergency services immediately."
        )
    
    # Check for personal/individualized questions
    if detect_personal_question(query):
        return QAResponse(
            query=query,
            topic_matched=None,
            information=PERSONAL_RESPONSE,
            is_symptom_detected=False,
            is_personal_question=True,
            sources=["Healthcare Professional Consultation Suggested"],
            disclaimer="This app provides general educational information only. Individual circumstances require professional guidance."
        )
    
    # Map to nutrition topics and return general information
    topic, info = get_topic_info(query)
    
    # Format response with required prefix
    formatted_info = f"Here is general nutrition information related to your question.\n\n{info}"
    
    return QAResponse(
        query=query,
        topic_matched=topic,
        information=formatted_info,
        is_symptom_detected=False,
        is_personal_question=False,
        sources=["WHO", "CDC", "NHS pregnancy nutrition guidance"],
        disclaimer="This is general educational reference information only. It does not constitute individualized advice. Consulting a qualified healthcare professional is suggested for personal guidance."
    )

# Keep old endpoint for backwards compatibility but redirect
@api_router.post("/qa/ask", response_model=QAResponse)
async def ask_question_legacy(question_data: QAQuestion):
    """Legacy endpoint - redirects to nutrition topics search"""
    return await search_nutrition_topics(question_data)

@api_router.get("/categories")
async def get_categories():
    """Get all food categories"""
    categories = list(set(food["category"] for food in FOOD_DATABASE))
    return sorted(categories)

@api_router.get("/about")
async def get_about():
    """Get about page information"""
    return {
        "app_name": "NurtureNote",
        "purpose": "Educational Pregnancy Nutrition Reference",
        "description": "NurtureNote provides general educational reference information about nutrition during pregnancy. It is designed as an informational resource to help users learn about nutrition topics commonly discussed in public health literature.",
        "data_sources": [
            "World Health Organization (WHO)",
            "Centers for Disease Control and Prevention (CDC)",
            "National Health Service (NHS) Pregnancy Nutrition Guidance",
            "American College of Obstetricians and Gynecologists (ACOG)"
        ],
        "disclaimer": "This app provides general educational reference information about pregnancy nutrition. It does not provide medical advice, diagnosis, or treatment. This content is not a substitute for professional medical guidance. Consulting a qualified healthcare professional is suggested for personal health concerns.",
        "non_medical_statement": "NurtureNote is not a medical app and does not provide medical advice. The information provided is general educational reference material compiled from public health sources. It is not intended for use in making health decisions. Individual circumstances vary; consulting healthcare professionals is suggested for personalized guidance. Do not disregard professional medical advice or delay seeking it because of information in this app.",
        "version": "1.0.0",
        "last_updated": "January 2026"
    }

@api_router.get("/emergency-info")
async def get_emergency_info():
    """Get emergency/when to seek care information"""
    return {
        "title": "When to Seek Medical Care",
        "intro": "While this app provides educational nutrition information, there are symptoms during pregnancy that require immediate medical attention.",
        "symptoms": [
            {
                "symptom": "Persistent vomiting",
                "description": "If you cannot keep food or liquids down for more than 24 hours, or if vomiting is accompanied by fever or pain"
            },
            {
                "symptom": "Vaginal bleeding",
                "description": "Any vaginal bleeding during pregnancy should be evaluated by a healthcare provider"
            },
            {
                "symptom": "Severe headache",
                "description": "Especially if persistent, sudden, or accompanied by vision changes or swelling"
            },
            {
                "symptom": "Fever",
                "description": "Temperature above 100.4°F (38°C) should be evaluated promptly"
            },
            {
                "symptom": "Severe abdominal pain",
                "description": "Sharp or persistent abdominal pain requires immediate evaluation"
            },
            {
                "symptom": "Changes in baby's movement",
                "description": "Significant decrease in fetal movement after 28 weeks"
            },
            {
                "symptom": "Signs of preterm labor",
                "description": "Regular contractions, pressure, or fluid leakage before 37 weeks"
            }
        ],
        "action": "If you experience any of these symptoms, please contact your healthcare provider immediately or call emergency services.",
        "disclaimer": "This information is for educational purposes. Always err on the side of caution and seek medical care if you are concerned."
    }

# Include the router in the main app
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
