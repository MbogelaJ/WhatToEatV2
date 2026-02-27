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

# Symptom keywords for Q&A safety guard
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
    recommendation: str  # Educational language
    reason: Optional[str] = None
    alternatives: Optional[List[str]] = None
    nutrients: Optional[List[str]] = None
    sources: List[str] = ["WHO", "CDC", "NHS pregnancy nutrition guidance"]

class QAQuestion(BaseModel):
    question: str

class QAResponse(BaseModel):
    question: str
    answer: str
    is_symptom_detected: bool = False
    sources: List[str] = ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    disclaimer: str = "This information is for educational purposes only and does not constitute medical advice."

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
        "recommendation": "Generally considered beneficial during pregnancy when cooked thoroughly",
        "reason": "Provides essential omega-3 fatty acids for fetal brain development",
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
        "recommendation": "Generally recommended to avoid during pregnancy due to potential bacterial and parasitic contamination",
        "reason": "Raw fish may contain parasites or bacteria that could affect pregnancy",
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
        "recommendation": "Generally recommended to avoid during pregnancy due to potential listeria contamination",
        "reason": "Unpasteurized soft cheeses may harbor listeria bacteria",
        "alternatives": ["Hard cheeses", "Pasteurized soft cheeses", "Cream cheese"],
        "nutrients": ["Calcium", "Protein"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "4",
        "name": "Eggs",
        "category": "Protein",
        "safety_level": "safe",
        "description": "Excellent source of protein and choline",
        "recommendation": "Generally considered beneficial during pregnancy when fully cooked",
        "reason": "Provides choline essential for fetal brain development",
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
        "recommendation": "Generally recommended to avoid during pregnancy due to salmonella risk",
        "reason": "Raw eggs may contain salmonella bacteria",
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
        "recommendation": "Often limited during pregnancy; many health organizations suggest keeping under 200mg daily",
        "reason": "High caffeine intake has been associated with increased pregnancy risks in some studies",
        "alternatives": ["Decaf coffee", "Herbal teas (check which are safe)", "Water with lemon"],
        "nutrients": None,
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    },
    {
        "id": "7",
        "name": "Alcohol",
        "category": "Beverages",
        "safety_level": "avoid",
        "description": "All alcoholic beverages including wine, beer, and spirits",
        "recommendation": "Generally recommended to avoid during pregnancy as no safe amount has been established",
        "reason": "Alcohol can cross the placenta and may affect fetal development",
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
        "recommendation": "Generally considered highly beneficial during pregnancy when washed thoroughly",
        "reason": "Excellent source of folate, iron, and fiber essential for pregnancy",
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
        "recommendation": "Often limited during pregnancy; consider safer alternatives or heat until steaming",
        "reason": "Deli meats may contain listeria bacteria which can survive refrigeration",
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
        "recommendation": "Generally considered highly beneficial during pregnancy when washed thoroughly",
        "reason": "Rich in antioxidants, fiber, and vitamin C",
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
        "recommendation": "Generally recommended to avoid during pregnancy due to high mercury content",
        "reason": "Mercury can accumulate and may affect fetal nervous system development",
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
        "recommendation": "Generally considered highly beneficial during pregnancy",
        "reason": "Excellent source of calcium, protein, and beneficial probiotics",
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
        "recommendation": "Often limited during pregnancy due to very high vitamin A content",
        "reason": "Excessive vitamin A intake has been associated with developmental concerns",
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
        "recommendation": "Generally considered highly beneficial during pregnancy",
        "reason": "Provides folate, potassium, and healthy monounsaturated fats",
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
        "recommendation": "Generally recommended to avoid raw during pregnancy due to bacterial risk",
        "reason": "The warm, humid conditions for growing sprouts are also ideal for bacteria",
        "alternatives": ["Cooked sprouts", "Leafy greens", "Other cooked vegetables"],
        "nutrients": ["Fiber", "Vitamins"],
        "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    }
]

# Educational Q&A responses
QA_DATABASE = {
    "folate": "Folate is essential during pregnancy, particularly in the first trimester, as it supports neural tube development. Many health organizations recommend 400-800mcg daily from food sources and supplements. Good sources include leafy greens, legumes, and fortified cereals.",
    "folic acid": "Folic acid is the synthetic form of folate. Most prenatal vitamins contain folic acid. Many health organizations recommend starting supplementation before conception and continuing through early pregnancy.",
    "iron": "Iron needs typically increase during pregnancy to support increased blood volume and fetal development. Good sources include lean meats, beans, fortified cereals, and leafy greens. Vitamin C can help with iron absorption.",
    "calcium": "Calcium is important during pregnancy for developing bones and teeth. Good sources include dairy products, fortified plant milks, leafy greens, and almonds. Many health organizations suggest 1000mg daily during pregnancy.",
    "vitamin d": "Vitamin D supports calcium absorption and bone health. Sources include sunlight exposure, fortified foods, and fatty fish. Discuss supplementation needs with your healthcare provider.",
    "omega-3": "Omega-3 fatty acids, particularly DHA, are associated with fetal brain and eye development. Good sources include fatty fish (like salmon), walnuts, and flaxseeds.",
    "protein": "Protein needs generally increase during pregnancy to support fetal growth. Good sources include lean meats, poultry, fish, eggs, dairy, legumes, and nuts.",
    "water": "Staying well-hydrated during pregnancy is important for many bodily functions including amniotic fluid maintenance. Many healthcare providers suggest drinking 8-12 glasses of water daily.",
    "morning sickness": "Morning sickness is common during pregnancy. Dietary strategies that some find helpful include eating small, frequent meals, avoiding strong smells, and having crackers before getting out of bed. Consult your healthcare provider if symptoms are severe.",
    "cravings": "Food cravings during pregnancy are common and may be related to hormonal changes. It's generally fine to indulge occasionally while maintaining overall nutritional balance. Discuss unusual cravings with your healthcare provider.",
    "weight gain": "Healthy weight gain varies based on pre-pregnancy weight. Your healthcare provider can give personalized guidance. Generally, balanced nutrition and regular physical activity as approved by your provider are recommended.",
    "fish": "Fish can be a nutritious part of pregnancy diet due to omega-3 content. Many health organizations recommend 2-3 servings weekly of low-mercury fish. Consider safer alternatives to high-mercury fish.",
    "vegetarian": "A well-planned vegetarian diet can meet pregnancy nutritional needs. Focus on getting adequate protein, iron, B12, calcium, and omega-3s from plant sources and/or supplements. Consult a registered dietitian if needed.",
    "organic": "Whether to choose organic foods is a personal decision. Both organic and conventionally grown foods can be part of a healthy pregnancy diet. Thorough washing of all produce is recommended.",
    "default": "Thank you for your question about pregnancy nutrition. For personalized guidance, we recommend consulting with your healthcare provider or a registered dietitian who can provide advice tailored to your specific situation."
}

def detect_symptoms(text: str) -> bool:
    """Check if the text contains symptom-related keywords"""
    text_lower = text.lower()
    for keyword in SYMPTOM_KEYWORDS:
        if keyword in text_lower:
            return True
    return False

def get_qa_answer(question: str) -> str:
    """Get an appropriate answer based on the question"""
    question_lower = question.lower()
    for key, answer in QA_DATABASE.items():
        if key in question_lower:
            return answer
    return QA_DATABASE["default"]

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

@api_router.post("/qa/ask", response_model=QAResponse)
async def ask_question(question_data: QAQuestion):
    """Ask a question about pregnancy nutrition with symptom detection"""
    question = question_data.question
    
    # Check for symptom keywords
    if detect_symptoms(question):
        return QAResponse(
            question=question,
            answer="We cannot assess symptoms. Please contact a healthcare provider or local emergency service.",
            is_symptom_detected=True,
            sources=["Medical Professional Consultation Recommended"],
            disclaimer="If you are experiencing a medical emergency, please call emergency services immediately."
        )
    
    # Get educational answer
    answer = get_qa_answer(question)
    
    return QAResponse(
        question=question,
        answer=answer,
        is_symptom_detected=False,
        sources=["WHO", "CDC", "NHS pregnancy nutrition guidance"],
        disclaimer="This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional regarding personal health concerns."
    )

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
        "description": "NurtureNote provides general educational nutrition information for pregnancy. It is designed to help expectant mothers learn about nutrition during pregnancy in an accessible and easy-to-understand format.",
        "data_sources": [
            "World Health Organization (WHO)",
            "Centers for Disease Control and Prevention (CDC)",
            "National Health Service (NHS) Pregnancy Nutrition Guidance",
            "American College of Obstetricians and Gynecologists (ACOG)"
        ],
        "disclaimer": "This app provides general educational nutrition information for pregnancy. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional regarding personal health concerns.",
        "non_medical_statement": "NurtureNote is not a medical app. The information provided is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read in this app.",
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
