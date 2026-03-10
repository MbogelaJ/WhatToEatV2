from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import hashlib
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import jwt

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from push_notifications import get_daily_tip, get_all_tips, get_tips_count, get_tip_by_index
from health_filters import (
    get_food_health_tags, 
    get_personalized_recommendations, 
    filter_food_for_user,
    TRIMESTER_PRIORITIES,
    HEALTH_CONDITION_TAGS
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
payment_transactions_collection = db["payment_transactions"]
foods_collection = db["foods"]
users_collection = db["users"]

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
PREMIUM_PRICE = 0.99  # Fixed price for premium - one-time payment

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== AUTH MODELS ==============

class UserRegister(BaseModel):
    email: str
    password: str
    age: Optional[int] = None
    trimester: Optional[int] = None
    pregnancy_stage_label: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    age: Optional[int] = None
    trimester: Optional[int] = None
    pregnancy_stage_label: Optional[str] = None
    dietary_restrictions: List[str] = []
    is_premium: bool = False
    created_at: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

class UserUpdate(BaseModel):
    age: Optional[int] = None
    trimester: Optional[int] = None
    pregnancy_stage_label: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None


# ============== AUTH HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    """Hash password with SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for user"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[Dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict]:
    """Get current user from JWT token"""
    if not credentials:
        return None
    
    payload = decode_jwt_token(credentials.credentials)
    if not payload:
        return None
    
    user = await users_collection.find_one(
        {"_id": payload["user_id"]},
        {"password": 0}
    )
    return user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown"""
    # Startup
    logger.info("Starting WhatToEat API...")
    
    # Seed foods collection if empty (migrate from in-memory to MongoDB)
    foods_count = await foods_collection.count_documents({})
    if foods_count == 0:
        logger.info("Seeding foods collection with initial data...")
        # Create index on food id
        await foods_collection.create_index("id", unique=True)
        # Insert all foods
        await foods_collection.insert_many(FOOD_DATABASE)
        logger.info(f"Seeded {len(FOOD_DATABASE)} foods to MongoDB")
    else:
        logger.info(f"Foods collection already has {foods_count} documents")
    
    yield
    
    # Shutdown
    logger.info("Shutting down WhatToEat API...")
    client.close()


# Create the main app with lifespan handler
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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
    topic_matched: Optional[str] = None
    information: str
    is_symptom_detected: bool = False
    is_personal_question: bool = False
    sources: List[str] = ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
    disclaimer: str = "This is general educational reference information only and does not constitute medical advice, diagnosis, or treatment."

class SearchQuery(BaseModel):
    query: str

# Payment models
class CheckoutRequest(BaseModel):
    origin_url: str = Field(..., description="Frontend origin URL for redirect")
    user_id: Optional[str] = Field(default=None, description="User identifier")

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

# Comprehensive food database with educational language - 85 items
FOOD_DATABASE = [
    # ===== FISH & SEAFOOD (12 items) =====
    {"id": "1", "name": "Salmon", "category": "Fish & Seafood", "safety_level": "safe", "description": "Rich in omega-3 fatty acids and protein", "nutrition_note": "Commonly included in balanced pregnancy diets when thoroughly cooked. Contains nutrients often mentioned in prenatal nutrition literature.", "context": "Fish like salmon are frequently referenced in public health nutrition guidance as a source of omega-3 fatty acids.", "alternatives": None, "nutrients": ["Omega-3", "Protein", "Vitamin D", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "2", "name": "Sushi (Raw Fish)", "category": "Fish & Seafood", "safety_level": "avoid", "description": "Raw or undercooked fish dishes", "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial and parasitic contamination concerns.", "context": "Public health organizations often note that raw fish may carry parasites or bacteria.", "alternatives": ["Cooked sushi rolls", "Vegetable sushi", "Fully cooked shrimp tempura rolls"], "nutrients": ["Protein", "Omega-3"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "3", "name": "High Mercury Fish", "category": "Fish & Seafood", "safety_level": "avoid", "description": "Shark, swordfish, king mackerel, tilefish, bigeye tuna", "nutrition_note": "Sometimes restricted in food safety guidance due to mercury content concerns noted in public health literature.", "context": "Mercury accumulation is a topic discussed in environmental health and nutrition literature.", "alternatives": ["Salmon", "Sardines", "Anchovies", "Tilapia", "Cod"], "nutrients": ["Protein", "Omega-3"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "4", "name": "Shrimp", "category": "Fish & Seafood", "safety_level": "safe", "description": "Low-mercury shellfish high in protein", "nutrition_note": "Commonly included in balanced pregnancy diets when fully cooked. Referenced as a lower-mercury seafood option in public health guidance.", "context": "Shrimp is noted in nutrition literature as a protein source with relatively low mercury content.", "alternatives": None, "nutrients": ["Protein", "Selenium", "B12", "Zinc"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "5", "name": "Canned Tuna", "category": "Fish & Seafood", "safety_level": "limit", "description": "Light canned tuna (skipjack)", "nutrition_note": "Often limited in public health guidance. Light tuna noted as having lower mercury than albacore varieties.", "context": "Nutrition literature commonly distinguishes between tuna varieties based on mercury content.", "alternatives": ["Canned salmon", "Sardines"], "nutrients": ["Protein", "Omega-3", "Selenium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "6", "name": "Sardines", "category": "Fish & Seafood", "safety_level": "safe", "description": "Small oily fish, often canned", "nutrition_note": "May be included as part of a varied diet. Noted as a lower-mercury fish with omega-3 content in nutrition literature.", "context": "Small fish like sardines are referenced in public health guidance as having lower mercury accumulation.", "alternatives": None, "nutrients": ["Omega-3", "Calcium", "Vitamin D", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "7", "name": "Cod", "category": "Fish & Seafood", "safety_level": "safe", "description": "Mild white fish, low in mercury", "nutrition_note": "Commonly included in balanced pregnancy diets when fully cooked. Referenced as a lean protein source.", "context": "White fish like cod are noted in nutrition literature for their protein content.", "alternatives": None, "nutrients": ["Protein", "B12", "Phosphorus", "Selenium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "8", "name": "Raw Oysters", "category": "Fish & Seafood", "safety_level": "avoid", "description": "Uncooked shellfish", "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial contamination concerns.", "context": "Raw shellfish are noted in public health literature as potential carriers of harmful bacteria.", "alternatives": ["Cooked oysters", "Cooked mussels"], "nutrients": ["Zinc", "Iron", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "9", "name": "Tilapia", "category": "Fish & Seafood", "safety_level": "safe", "description": "Mild freshwater fish", "nutrition_note": "May be included as part of a varied diet when fully cooked. Referenced as a lower-mercury option.", "context": "Tilapia is noted in nutrition guidance as a lean protein source.", "alternatives": None, "nutrients": ["Protein", "B12", "Selenium", "Phosphorus"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "10", "name": "Smoked Salmon (Cold)", "category": "Fish & Seafood", "safety_level": "limit", "description": "Cold-smoked or lox-style salmon", "nutrition_note": "Often limited in public health guidance. Hot smoking or heating noted as reducing certain food safety concerns.", "context": "Cold-smoked fish is discussed in food safety literature regarding listeria concerns.", "alternatives": ["Hot-smoked salmon", "Fully cooked salmon"], "nutrients": ["Omega-3", "Protein", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "11", "name": "Crab", "category": "Fish & Seafood", "safety_level": "safe", "description": "Cooked crab meat", "nutrition_note": "May be included as part of a varied diet when fully cooked. Noted as a protein and zinc source.", "context": "Cooked shellfish are referenced in nutrition literature as protein sources.", "alternatives": None, "nutrients": ["Protein", "Zinc", "B12", "Selenium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "12", "name": "Anchovies", "category": "Fish & Seafood", "safety_level": "safe", "description": "Small preserved fish", "nutrition_note": "May be included as part of a varied diet. Referenced as a lower-mercury fish with omega-3 content.", "context": "Small fish are noted in public health guidance as having lower mercury accumulation.", "alternatives": None, "nutrients": ["Omega-3", "Calcium", "Iron", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== DAIRY (10 items) =====
    {"id": "13", "name": "Soft Cheese (Unpasteurized)", "category": "Dairy", "safety_level": "avoid", "description": "Brie, camembert, blue cheese made from unpasteurized milk", "nutrition_note": "Sometimes restricted in food safety guidance due to potential listeria contamination concerns.", "context": "Unpasteurized soft cheeses are noted in public health literature as potential carriers of listeria bacteria.", "alternatives": ["Hard cheeses", "Pasteurized soft cheeses", "Cream cheese"], "nutrients": ["Calcium", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "14", "name": "Greek Yogurt", "category": "Dairy", "safety_level": "safe", "description": "Pasteurized yogurt high in protein and probiotics", "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as a calcium and protein source in nutrition literature.", "context": "Dairy products are frequently referenced in prenatal nutrition educational materials.", "alternatives": None, "nutrients": ["Calcium", "Protein", "Probiotics", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "15", "name": "Milk (Pasteurized)", "category": "Dairy", "safety_level": "safe", "description": "Pasteurized cow's milk", "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as a calcium and vitamin D source in nutrition literature.", "context": "Pasteurized dairy is referenced in public health guidance as a calcium source.", "alternatives": None, "nutrients": ["Calcium", "Vitamin D", "Protein", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "16", "name": "Raw Milk", "category": "Dairy", "safety_level": "avoid", "description": "Unpasteurized milk products", "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial contamination concerns.", "context": "Raw milk is discussed in public health literature regarding various bacterial risks.", "alternatives": ["Pasteurized milk", "Pasteurized dairy products"], "nutrients": ["Calcium", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "17", "name": "Hard Cheese", "category": "Dairy", "safety_level": "safe", "description": "Cheddar, parmesan, swiss, gouda", "nutrition_note": "May be included as part of a varied diet. Noted as a calcium source in nutrition literature.", "context": "Hard cheeses are referenced in food safety guidance as having lower moisture content.", "alternatives": None, "nutrients": ["Calcium", "Protein", "Vitamin A", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "18", "name": "Cottage Cheese", "category": "Dairy", "safety_level": "safe", "description": "Fresh pasteurized cheese curds", "nutrition_note": "May be included as part of a varied diet when pasteurized. Noted as a protein source.", "context": "Cottage cheese is referenced in nutrition literature for its protein content.", "alternatives": None, "nutrients": ["Protein", "Calcium", "B12", "Phosphorus"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "19", "name": "Ice Cream", "category": "Dairy", "safety_level": "safe", "description": "Commercially prepared pasteurized ice cream", "nutrition_note": "May be included as part of a varied diet in moderation. Commercial varieties typically use pasteurized ingredients.", "context": "Store-bought ice cream is generally made with pasteurized dairy.", "alternatives": None, "nutrients": ["Calcium", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "20", "name": "Soft-Serve Ice Cream", "category": "Dairy", "safety_level": "limit", "description": "Machine-dispensed soft ice cream", "nutrition_note": "Often limited in public health guidance. Machine cleanliness noted as a consideration in food safety literature.", "context": "Soft-serve machines are discussed in food safety guidance regarding hygiene practices.", "alternatives": ["Pre-packaged ice cream", "Hard-serve ice cream"], "nutrients": ["Calcium", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "21", "name": "Feta Cheese (Pasteurized)", "category": "Dairy", "safety_level": "safe", "description": "Pasteurized feta cheese", "nutrition_note": "May be included as part of a varied diet when made from pasteurized milk. Check labels for pasteurization status.", "context": "Pasteurization status is noted as important in food safety guidance for soft cheeses.", "alternatives": None, "nutrients": ["Calcium", "Protein", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "22", "name": "Butter", "category": "Dairy", "safety_level": "safe", "description": "Pasteurized butter", "nutrition_note": "May be included as part of a varied diet in moderation. Noted as a fat source.", "context": "Butter made from pasteurized cream is referenced in nutrition guidance.", "alternatives": None, "nutrients": ["Vitamin A", "Vitamin D"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== MEAT & PROTEIN (12 items) =====
    {"id": "23", "name": "Eggs", "category": "Meat & Protein", "safety_level": "safe", "description": "Source of protein and choline", "nutrition_note": "Commonly included in balanced pregnancy diets when fully cooked. Eggs are noted as a choline source in nutrition literature.", "context": "Choline is a nutrient frequently mentioned in prenatal nutrition educational materials.", "alternatives": None, "nutrients": ["Protein", "Choline", "B12", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "24", "name": "Raw Eggs", "category": "Meat & Protein", "safety_level": "avoid", "description": "Found in homemade mayonnaise, some desserts, raw cookie dough", "nutrition_note": "Sometimes restricted in food safety guidance due to salmonella concerns.", "context": "Food safety literature notes that raw eggs may contain salmonella bacteria.", "alternatives": ["Fully cooked eggs", "Pasteurized egg products", "Store-bought pasteurized mayonnaise"], "nutrients": ["Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "25", "name": "Deli Meats", "category": "Meat & Protein", "safety_level": "limit", "description": "Pre-packaged or deli-sliced cold cuts", "nutrition_note": "Often limited in public health guidance. Typically prepared carefully (heated until steaming) according to food safety literature.", "context": "Food safety literature notes that deli meats may contain listeria bacteria which can survive refrigeration.", "alternatives": ["Freshly cooked meats", "Heated deli meats (steaming hot)"], "nutrients": ["Protein", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "26", "name": "Chicken (Cooked)", "category": "Meat & Protein", "safety_level": "safe", "description": "Fully cooked poultry", "nutrition_note": "Commonly included in balanced pregnancy diets when cooked to proper internal temperature. Noted as a lean protein source.", "context": "Poultry is referenced in nutrition literature for its protein content.", "alternatives": None, "nutrients": ["Protein", "B6", "Niacin", "Selenium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "27", "name": "Beef (Well-Done)", "category": "Meat & Protein", "safety_level": "safe", "description": "Thoroughly cooked beef", "nutrition_note": "May be included as part of a varied diet when cooked thoroughly. Noted as an iron source in nutrition literature.", "context": "Well-cooked meats are referenced in food safety guidance.", "alternatives": None, "nutrients": ["Iron", "Protein", "B12", "Zinc"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "28", "name": "Rare/Undercooked Meat", "category": "Meat & Protein", "safety_level": "avoid", "description": "Pink or undercooked beef, lamb, pork", "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial and parasitic concerns.", "context": "Undercooked meats are discussed in public health literature regarding various pathogens.", "alternatives": ["Well-done cooked meats"], "nutrients": ["Protein", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "29", "name": "Liver", "category": "Meat & Protein", "safety_level": "limit", "description": "All types of liver and liver products like pate", "nutrition_note": "Often limited in public health guidance due to very high vitamin A content noted in nutrition literature.", "context": "Vitamin A intake thresholds are discussed in prenatal nutrition educational materials.", "alternatives": ["Lean beef", "Chicken breast", "Legumes for iron"], "nutrients": ["Iron", "Vitamin A", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "30", "name": "Pork (Cooked)", "category": "Meat & Protein", "safety_level": "safe", "description": "Thoroughly cooked pork", "nutrition_note": "May be included as part of a varied diet when cooked to proper internal temperature.", "context": "Well-cooked pork is referenced in food safety guidance.", "alternatives": None, "nutrients": ["Protein", "Thiamine", "B6", "Zinc"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "31", "name": "Turkey (Cooked)", "category": "Meat & Protein", "safety_level": "safe", "description": "Fully cooked turkey", "nutrition_note": "May be included as part of a varied diet when fully cooked. Noted as a lean protein source.", "context": "Poultry is referenced in nutrition literature for its protein content.", "alternatives": None, "nutrients": ["Protein", "B6", "Selenium", "Zinc"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "32", "name": "Tofu", "category": "Meat & Protein", "safety_level": "safe", "description": "Soybean curd, plant-based protein", "nutrition_note": "May be included as part of a varied diet. Noted as a plant-based protein source in nutrition literature.", "context": "Tofu is referenced in vegetarian nutrition guidance as a protein option.", "alternatives": None, "nutrients": ["Protein", "Calcium", "Iron", "Magnesium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "33", "name": "Legumes", "category": "Meat & Protein", "safety_level": "safe", "description": "Beans, lentils, chickpeas, peas", "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as sources of plant protein, fiber, and folate.", "context": "Legumes are frequently referenced in prenatal nutrition educational materials.", "alternatives": None, "nutrients": ["Protein", "Fiber", "Folate", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "34", "name": "Pate", "category": "Meat & Protein", "safety_level": "avoid", "description": "Meat or vegetable paste spreads", "nutrition_note": "Sometimes restricted in food safety guidance. Meat pates noted for vitamin A and listeria concerns.", "context": "Refrigerated pates are discussed in food safety literature regarding listeria.", "alternatives": ["Hummus", "Bean dips"], "nutrients": ["Protein", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== FRUITS (12 items) =====
    {"id": "35", "name": "Berries", "category": "Fruits", "safety_level": "safe", "description": "Strawberries, blueberries, raspberries, blackberries", "nutrition_note": "May be included as part of a varied diet when washed thoroughly. Noted for antioxidant content in nutrition literature.", "context": "Berries are referenced in general nutrition guidance as sources of fiber and vitamin C.", "alternatives": None, "nutrients": ["Vitamin C", "Fiber", "Antioxidants", "Folate"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "36", "name": "Avocado", "category": "Fruits", "safety_level": "safe", "description": "Nutrient-dense fruit rich in healthy fats", "nutrition_note": "May be included as part of a varied diet. Noted as a folate and potassium source in nutrition literature.", "context": "Avocados are referenced in general nutrition guidance for their nutrient density.", "alternatives": None, "nutrients": ["Folate", "Potassium", "Fiber", "Healthy Fats", "Vitamin K"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "37", "name": "Bananas", "category": "Fruits", "safety_level": "safe", "description": "Potassium-rich tropical fruit", "nutrition_note": "May be included as part of a varied diet. Noted as a potassium and B6 source in nutrition literature.", "context": "Bananas are referenced in general nutrition guidance for their potassium content.", "alternatives": None, "nutrients": ["Potassium", "B6", "Fiber", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "38", "name": "Oranges", "category": "Fruits", "safety_level": "safe", "description": "Citrus fruit high in vitamin C", "nutrition_note": "May be included as part of a varied diet. Noted as a vitamin C and folate source in nutrition literature.", "context": "Citrus fruits are referenced in nutrition guidance for their vitamin C content.", "alternatives": None, "nutrients": ["Vitamin C", "Folate", "Fiber", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "39", "name": "Apples", "category": "Fruits", "safety_level": "safe", "description": "Common fruit, wash thoroughly", "nutrition_note": "May be included as part of a varied diet when washed thoroughly. Noted as a fiber source.", "context": "Washing produce thoroughly is commonly noted in food safety guidance.", "alternatives": None, "nutrients": ["Fiber", "Vitamin C", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "40", "name": "Papaya (Ripe)", "category": "Fruits", "safety_level": "safe", "description": "Fully ripe papaya fruit", "nutrition_note": "Ripe papaya may be included as part of a varied diet. Literature distinguishes between ripe and unripe papaya.", "context": "Papaya ripeness is a topic noted in some nutrition discussions.", "alternatives": None, "nutrients": ["Vitamin C", "Folate", "Fiber", "Vitamin A"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "41", "name": "Papaya (Unripe/Green)", "category": "Fruits", "safety_level": "avoid", "description": "Unripe or semi-ripe papaya", "nutrition_note": "Sometimes restricted in public health guidance. Unripe papaya contains different compounds than ripe fruit.", "context": "Unripe papaya is discussed in some traditional and scientific literature.", "alternatives": ["Ripe papaya", "Other ripe fruits"], "nutrients": ["Fiber", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "42", "name": "Mango", "category": "Fruits", "safety_level": "safe", "description": "Tropical fruit rich in vitamins", "nutrition_note": "May be included as part of a varied diet when washed and peeled. Noted as a vitamin A source.", "context": "Tropical fruits are referenced in nutrition guidance for their vitamin content.", "alternatives": None, "nutrients": ["Vitamin A", "Vitamin C", "Folate", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "43", "name": "Watermelon", "category": "Fruits", "safety_level": "safe", "description": "Hydrating summer fruit", "nutrition_note": "May be included as part of a varied diet. Noted for its hydrating properties and lycopene content.", "context": "Watermelon is referenced in nutrition literature for hydration.", "alternatives": None, "nutrients": ["Vitamin C", "Lycopene", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "44", "name": "Grapes", "category": "Fruits", "safety_level": "safe", "description": "Fresh grapes, wash thoroughly", "nutrition_note": "May be included as part of a varied diet when washed thoroughly.", "context": "Fresh produce washing is commonly noted in food safety guidance.", "alternatives": None, "nutrients": ["Vitamin C", "Vitamin K", "Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "45", "name": "Pineapple", "category": "Fruits", "safety_level": "safe", "description": "Tropical fruit with bromelain enzyme", "nutrition_note": "May be included as part of a varied diet in typical food amounts. Contains vitamin C and manganese.", "context": "Pineapple is referenced in general nutrition guidance as a fruit option.", "alternatives": None, "nutrients": ["Vitamin C", "Manganese", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "46", "name": "Dried Fruits", "category": "Fruits", "safety_level": "safe", "description": "Raisins, dates, apricots, prunes", "nutrition_note": "May be included as part of a varied diet in moderation. Noted as concentrated sources of nutrients and natural sugars.", "context": "Dried fruits are referenced in nutrition literature for their iron and fiber content.", "alternatives": None, "nutrients": ["Iron", "Fiber", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== VEGETABLES (12 items) =====
    {"id": "47", "name": "Leafy Greens", "category": "Vegetables", "safety_level": "safe", "description": "Spinach, kale, swiss chard, collards", "nutrition_note": "Commonly included in balanced pregnancy diets when washed thoroughly. Noted as a folate source in nutrition literature.", "context": "Leafy greens are frequently referenced in prenatal nutrition educational materials.", "alternatives": None, "nutrients": ["Folate", "Iron", "Fiber", "Vitamin K", "Calcium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "48", "name": "Sprouts (Raw)", "category": "Vegetables", "safety_level": "avoid", "description": "Raw alfalfa, clover, radish, mung bean sprouts", "nutrition_note": "Sometimes restricted in food safety guidance when raw due to bacterial concerns noted in public health literature.", "context": "Food safety literature notes that sprout growing conditions may also support bacterial growth.", "alternatives": ["Cooked sprouts", "Leafy greens"], "nutrients": ["Fiber", "Vitamins"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "49", "name": "Broccoli", "category": "Vegetables", "safety_level": "safe", "description": "Cruciferous vegetable high in nutrients", "nutrition_note": "May be included as part of a varied diet. Noted as a folate and vitamin C source in nutrition literature.", "context": "Cruciferous vegetables are referenced in nutrition guidance for their nutrient density.", "alternatives": None, "nutrients": ["Folate", "Vitamin C", "Fiber", "Vitamin K"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "50", "name": "Sweet Potatoes", "category": "Vegetables", "safety_level": "safe", "description": "Orange-fleshed root vegetable", "nutrition_note": "May be included as part of a varied diet. Noted as a vitamin A and fiber source in nutrition literature.", "context": "Sweet potatoes are referenced in nutrition guidance for their beta-carotene content.", "alternatives": None, "nutrients": ["Vitamin A", "Fiber", "Potassium", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "51", "name": "Carrots", "category": "Vegetables", "safety_level": "safe", "description": "Root vegetable rich in beta-carotene", "nutrition_note": "May be included as part of a varied diet when washed or peeled. Noted as a vitamin A source.", "context": "Carrots are referenced in nutrition guidance for their beta-carotene content.", "alternatives": None, "nutrients": ["Vitamin A", "Fiber", "Vitamin K"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "52", "name": "Bell Peppers", "category": "Vegetables", "safety_level": "safe", "description": "Colorful peppers high in vitamin C", "nutrition_note": "May be included as part of a varied diet. Noted as a vitamin C source in nutrition literature.", "context": "Bell peppers are referenced in nutrition guidance for their vitamin C content.", "alternatives": None, "nutrients": ["Vitamin C", "Vitamin A", "B6", "Folate"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "53", "name": "Tomatoes", "category": "Vegetables", "safety_level": "safe", "description": "Fresh or cooked tomatoes", "nutrition_note": "May be included as part of a varied diet when washed. Noted as a lycopene source in nutrition literature.", "context": "Tomatoes are referenced in nutrition guidance for their lycopene content.", "alternatives": None, "nutrients": ["Vitamin C", "Lycopene", "Potassium", "Folate"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "54", "name": "Asparagus", "category": "Vegetables", "safety_level": "safe", "description": "Green vegetable high in folate", "nutrition_note": "May be included as part of a varied diet when cooked. Noted as a folate source in nutrition literature.", "context": "Asparagus is referenced in nutrition guidance for its folate content.", "alternatives": None, "nutrients": ["Folate", "Vitamin K", "Fiber", "Vitamin A"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "55", "name": "Cauliflower", "category": "Vegetables", "safety_level": "safe", "description": "White cruciferous vegetable", "nutrition_note": "May be included as part of a varied diet. Noted as a vitamin C source.", "context": "Cruciferous vegetables are referenced in nutrition guidance.", "alternatives": None, "nutrients": ["Vitamin C", "Vitamin K", "Folate", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "56", "name": "Corn", "category": "Vegetables", "safety_level": "safe", "description": "Yellow vegetable/grain", "nutrition_note": "May be included as part of a varied diet. Noted as a fiber source.", "context": "Corn is referenced in nutrition literature as a starchy vegetable.", "alternatives": None, "nutrients": ["Fiber", "B vitamins", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "57", "name": "Mushrooms", "category": "Vegetables", "safety_level": "safe", "description": "Commercially grown edible mushrooms, cooked", "nutrition_note": "May be included as part of a varied diet when cooked. Noted as a vitamin D source (if exposed to UV).", "context": "Cooked commercial mushrooms are referenced in nutrition guidance.", "alternatives": None, "nutrients": ["Vitamin D", "B vitamins", "Selenium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "58", "name": "Zucchini", "category": "Vegetables", "safety_level": "safe", "description": "Summer squash vegetable", "nutrition_note": "May be included as part of a varied diet. Low-calorie vegetable option.", "context": "Zucchini is referenced in nutrition literature as a vegetable option.", "alternatives": None, "nutrients": ["Vitamin C", "Potassium", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== BEVERAGES (10 items) =====
    {"id": "59", "name": "Coffee", "category": "Beverages", "safety_level": "limit", "description": "Caffeinated beverage", "nutrition_note": "Often limited in public health guidance. Many organizations reference 200mg caffeine daily as a common threshold.", "context": "Research studies have examined associations between caffeine intake and pregnancy outcomes.", "alternatives": ["Decaf coffee", "Herbal teas"], "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "60", "name": "Alcohol", "category": "Beverages", "safety_level": "avoid", "description": "All alcoholic beverages including wine, beer, spirits", "nutrition_note": "Public health organizations consistently note that no amount has been established as without risk during pregnancy.", "context": "Alcohol is noted in medical literature to cross the placenta.", "alternatives": ["Sparkling water", "Mocktails", "Fruit juices"], "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "61", "name": "Herbal Tea", "category": "Beverages", "safety_level": "limit", "description": "Various herbal infusions", "nutrition_note": "Often limited in public health guidance. Individual herbs have different profiles noted in literature.", "context": "Herbal teas vary widely; some are discussed differently than others in nutrition literature.", "alternatives": ["Ginger tea", "Peppermint tea", "Rooibos tea"], "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "62", "name": "Green Tea", "category": "Beverages", "safety_level": "limit", "description": "Tea containing caffeine and catechins", "nutrition_note": "Often limited due to caffeine content. Contains less caffeine than coffee per cup.", "context": "Green tea caffeine content is noted in nutrition literature.", "alternatives": ["Decaf green tea"], "nutrients": ["Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "63", "name": "Fresh Juice (Pasteurized)", "category": "Beverages", "safety_level": "safe", "description": "Commercially pasteurized fruit juices", "nutrition_note": "May be included as part of a varied diet. Pasteurized varieties noted as processed for food safety.", "context": "Pasteurization of juices is referenced in food safety guidance.", "alternatives": None, "nutrients": ["Vitamin C", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "64", "name": "Fresh Juice (Unpasteurized)", "category": "Beverages", "safety_level": "avoid", "description": "Raw, unpasteurized fruit or vegetable juices", "nutrition_note": "Sometimes restricted in food safety guidance due to potential bacterial contamination concerns.", "context": "Unpasteurized juices are discussed in food safety literature.", "alternatives": ["Pasteurized juices", "Whole fruits"], "nutrients": ["Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "65", "name": "Water", "category": "Beverages", "safety_level": "safe", "description": "Plain or filtered water", "nutrition_note": "Commonly referenced in hydration guidance. Adequate hydration noted as important during pregnancy.", "context": "Water intake is discussed in prenatal nutrition educational materials.", "alternatives": None, "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "66", "name": "Energy Drinks", "category": "Beverages", "safety_level": "avoid", "description": "High-caffeine beverages with additives", "nutrition_note": "Sometimes restricted in public health guidance due to high caffeine and other ingredient content.", "context": "Energy drinks are discussed in public health literature regarding caffeine and additive content.", "alternatives": ["Water", "Diluted fruit juice"], "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "67", "name": "Soda/Soft Drinks", "category": "Beverages", "safety_level": "limit", "description": "Carbonated sweetened beverages", "nutrition_note": "Often limited in general nutrition guidance due to sugar content. Some contain caffeine.", "context": "Soft drinks are discussed in nutrition literature regarding sugar intake.", "alternatives": ["Sparkling water", "Water with fruit"], "nutrients": None, "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "68", "name": "Coconut Water", "category": "Beverages", "safety_level": "safe", "description": "Natural coconut liquid", "nutrition_note": "May be included as part of a varied diet. Noted for electrolyte content in nutrition literature.", "context": "Coconut water is referenced in nutrition guidance as a hydration option.", "alternatives": None, "nutrients": ["Potassium", "Magnesium", "Electrolytes"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== GRAINS & CARBS (7 items) =====
    {"id": "69", "name": "Whole Grains", "category": "Grains & Carbs", "safety_level": "safe", "description": "Brown rice, quinoa, oats, whole wheat", "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as fiber and B vitamin sources in nutrition literature.", "context": "Whole grains are referenced in prenatal nutrition educational materials.", "alternatives": None, "nutrients": ["Fiber", "B vitamins", "Iron", "Magnesium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "70", "name": "White Rice", "category": "Grains & Carbs", "safety_level": "safe", "description": "Refined white rice", "nutrition_note": "May be included as part of a varied diet. Contains less fiber than whole grain alternatives.", "context": "Rice is a staple food referenced in nutrition literature.", "alternatives": None, "nutrients": ["Carbohydrates", "B vitamins"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "71", "name": "Bread", "category": "Grains & Carbs", "safety_level": "safe", "description": "Commercially baked bread products", "nutrition_note": "May be included as part of a varied diet. Whole grain varieties noted for higher fiber content.", "context": "Bread is referenced in nutrition guidance as a grain food.", "alternatives": None, "nutrients": ["Carbohydrates", "Fiber", "B vitamins"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "72", "name": "Pasta", "category": "Grains & Carbs", "safety_level": "safe", "description": "Cooked pasta products", "nutrition_note": "May be included as part of a varied diet. Whole wheat varieties noted for higher fiber.", "context": "Pasta is referenced in nutrition literature as a grain food.", "alternatives": None, "nutrients": ["Carbohydrates", "Fiber", "B vitamins"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "73", "name": "Oatmeal", "category": "Grains & Carbs", "safety_level": "safe", "description": "Cooked oats", "nutrition_note": "Commonly included in balanced diets. Noted as a fiber and iron source in nutrition literature.", "context": "Oats are referenced in nutrition guidance for their soluble fiber content.", "alternatives": None, "nutrients": ["Fiber", "Iron", "B vitamins", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "74", "name": "Cereal (Fortified)", "category": "Grains & Carbs", "safety_level": "safe", "description": "Fortified breakfast cereals", "nutrition_note": "May be included as part of a varied diet. Fortified cereals noted as sources of added nutrients.", "context": "Fortified cereals are referenced in nutrition guidance for their added vitamins.", "alternatives": None, "nutrients": ["Iron", "Folate", "B vitamins", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "75", "name": "Popcorn", "category": "Grains & Carbs", "safety_level": "safe", "description": "Air-popped or lightly prepared popcorn", "nutrition_note": "May be included as part of a varied diet as a whole grain snack.", "context": "Popcorn is referenced as a whole grain snack option.", "alternatives": None, "nutrients": ["Fiber", "Carbohydrates"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== HERBS & SPICES (6 items) =====
    {"id": "76", "name": "Ginger", "category": "Herbs & Spices", "safety_level": "safe", "description": "Fresh or dried ginger root", "nutrition_note": "May be included in typical culinary amounts. Often discussed in relation to digestive comfort.", "context": "Ginger is referenced in some pregnancy literature regarding nausea.", "alternatives": None, "nutrients": ["Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "77", "name": "Garlic", "category": "Herbs & Spices", "safety_level": "safe", "description": "Common culinary herb", "nutrition_note": "May be included in typical culinary amounts as part of a varied diet.", "context": "Garlic is a common culinary ingredient.", "alternatives": None, "nutrients": ["Vitamin C", "Manganese"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "78", "name": "Turmeric", "category": "Herbs & Spices", "safety_level": "safe", "description": "Yellow spice from turmeric root", "nutrition_note": "May be included in typical culinary amounts. Contains curcumin compound.", "context": "Turmeric is referenced as a common culinary spice.", "alternatives": None, "nutrients": ["Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "79", "name": "Cinnamon", "category": "Herbs & Spices", "safety_level": "safe", "description": "Common baking spice", "nutrition_note": "May be included in typical culinary amounts as part of a varied diet.", "context": "Cinnamon is a common culinary spice.", "alternatives": None, "nutrients": ["Antioxidants", "Manganese"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "80", "name": "Parsley", "category": "Herbs & Spices", "safety_level": "safe", "description": "Fresh herb for garnishing and cooking", "nutrition_note": "May be included in typical culinary amounts. Noted for vitamin K content.", "context": "Parsley is a common culinary herb.", "alternatives": None, "nutrients": ["Vitamin K", "Vitamin C", "Folate"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "81", "name": "Basil", "category": "Herbs & Spices", "safety_level": "safe", "description": "Fresh herb commonly used in cooking", "nutrition_note": "May be included in typical culinary amounts as part of a varied diet.", "context": "Basil is a common culinary herb.", "alternatives": None, "nutrients": ["Vitamin K", "Vitamin A"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== STREET FOODS & PREPARED FOODS (4 items) =====
    {"id": "82", "name": "Hot Dogs", "category": "Street Foods & Prepared", "safety_level": "limit", "description": "Processed meat products", "nutrition_note": "Often limited in public health guidance. Noted to be heated until steaming in food safety literature.", "context": "Processed meats are discussed in food safety guidance regarding listeria.", "alternatives": ["Freshly grilled meats"], "nutrients": ["Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "83", "name": "Pre-made Salads", "category": "Street Foods & Prepared", "safety_level": "limit", "description": "Store-bought or buffet salads", "nutrition_note": "Often noted in food safety guidance. Freshness and storage conditions are considerations.", "context": "Pre-prepared salads are discussed regarding food handling practices.", "alternatives": ["Freshly made salads at home"], "nutrients": ["Vitamins", "Fiber"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "84", "name": "Street Vendor Food", "category": "Street Foods & Prepared", "safety_level": "limit", "description": "Food from outdoor vendors", "nutrition_note": "Food safety varies by vendor. Freshly cooked, hot foods generally noted as lower risk.", "context": "Food handling and temperature control are discussed in food safety literature.", "alternatives": ["Restaurant food with visible kitchen", "Home-cooked meals"], "nutrients": ["Varies"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "85", "name": "Buffet Foods", "category": "Street Foods & Prepared", "safety_level": "limit", "description": "Self-serve buffet items", "nutrition_note": "Often noted in food safety guidance. Temperature maintenance and freshness are considerations.", "context": "Buffet food safety is discussed regarding holding temperatures and cross-contamination.", "alternatives": ["Made-to-order foods", "Freshly prepared meals"], "nutrients": ["Varies"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    
    # ===== INTERNATIONAL FOODS - North America, Australia, New Zealand, Europe (15 items) =====
    {"id": "86", "name": "Maple Syrup", "category": "Condiments & Sweeteners", "safety_level": "safe", "description": "Pure maple syrup from Canada", "nutrition_note": "May be included in moderation as part of a varied diet. Contains natural sugars and trace minerals like manganese and zinc.", "context": "Natural sweeteners like maple syrup are referenced in nutrition literature as alternatives to refined sugars.", "alternatives": None, "nutrients": ["Manganese", "Zinc", "Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "87", "name": "Peanut Butter", "category": "Nuts & Seeds", "safety_level": "safe", "description": "Ground peanut spread, popular in North America", "nutrition_note": "May be included as part of a varied diet unless allergy is present. Noted as a protein and healthy fat source in nutrition literature.", "context": "Nut butters are referenced in nutrition guidance for their protein and nutrient content.", "alternatives": ["Almond butter", "Sunflower seed butter"], "nutrients": ["Protein", "Healthy Fats", "Vitamin E", "Magnesium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "88", "name": "Sweet Potato", "category": "Vegetables", "safety_level": "safe", "description": "Orange-fleshed root vegetable", "nutrition_note": "Commonly included in balanced pregnancy diets. Noted as an excellent source of beta-carotene and fiber.", "context": "Sweet potatoes are referenced in prenatal nutrition materials for their vitamin A content.", "alternatives": None, "nutrients": ["Vitamin A", "Fiber", "Potassium", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance", "ACOG"]},
    {"id": "89", "name": "Lamb (Cooked)", "category": "Meat & Protein", "safety_level": "safe", "description": "Popular meat in New Zealand, Australia, and Europe", "nutrition_note": "May be included as part of a varied diet when thoroughly cooked. Noted as an iron and zinc source.", "context": "Well-cooked meats are referenced in food safety and nutrition guidance.", "alternatives": None, "nutrients": ["Protein", "Iron", "Zinc", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "90", "name": "Vegemite/Marmite", "category": "Condiments & Sweeteners", "safety_level": "safe", "description": "Yeast extract spreads popular in Australia/NZ/UK", "nutrition_note": "May be included in small amounts as part of a varied diet. Noted as a B-vitamin source, particularly B12 for fortified versions.", "context": "Yeast extracts are referenced in nutrition literature for their B-vitamin content.", "alternatives": None, "nutrients": ["B vitamins", "Folate", "Niacin"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "91", "name": "Barramundi", "category": "Fish & Seafood", "safety_level": "safe", "description": "Australian/Asian sea bass, low mercury fish", "nutrition_note": "May be included as part of a varied diet when fully cooked. Noted as a lean protein and omega-3 source.", "context": "White fish are referenced in nutrition guidance for their protein content.", "alternatives": None, "nutrients": ["Protein", "Omega-3", "Selenium", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "92", "name": "Kiwi Fruit", "category": "Fruits", "safety_level": "safe", "description": "Vitamin C-rich fruit from New Zealand", "nutrition_note": "May be included as part of a varied diet when washed. Noted as an excellent source of vitamin C and fiber.", "context": "Kiwi fruit is referenced in nutrition literature for its high vitamin C content.", "alternatives": None, "nutrients": ["Vitamin C", "Fiber", "Vitamin K", "Potassium"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "93", "name": "Olive Oil", "category": "Fats & Oils", "safety_level": "safe", "description": "Mediterranean staple, extra virgin preferred", "nutrition_note": "Commonly included in balanced diets. Noted as a healthy monounsaturated fat source in Mediterranean diet research.", "context": "Olive oil is frequently referenced in nutrition guidance for heart-healthy fats.", "alternatives": None, "nutrients": ["Healthy Fats", "Vitamin E", "Antioxidants"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "94", "name": "Sauerkraut (Pasteurized)", "category": "Vegetables", "safety_level": "safe", "description": "Fermented cabbage, European origin", "nutrition_note": "May be included as part of a varied diet when pasteurized. Contains probiotics and vitamin C.", "context": "Fermented foods are discussed in nutrition literature for their probiotic content.", "alternatives": None, "nutrients": ["Probiotics", "Vitamin C", "Fiber", "Vitamin K"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "95", "name": "Hummus", "category": "Legumes & Dips", "safety_level": "safe", "description": "Chickpea dip, Middle Eastern/Mediterranean origin", "nutrition_note": "May be included as part of a varied diet. Noted as a plant protein and fiber source.", "context": "Hummus is referenced in nutrition guidance as a healthy dip option.", "alternatives": None, "nutrients": ["Protein", "Fiber", "Iron", "Folate"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "96", "name": "Prosciutto", "category": "Meat & Protein", "safety_level": "limit", "description": "Italian cured ham", "nutrition_note": "Often limited in public health guidance due to being uncooked. Heating until steaming is noted in food safety literature.", "context": "Cured meats are discussed in food safety guidance regarding listeria concerns.", "alternatives": ["Cooked ham", "Freshly cooked meats"], "nutrients": ["Protein", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "97", "name": "Beets/Beetroot", "category": "Vegetables", "safety_level": "safe", "description": "Root vegetable popular in Europe and Australia", "nutrition_note": "May be included as part of a varied diet. Noted for folate and nitrate content in nutrition literature.", "context": "Beetroot is referenced in nutrition guidance for its nutrient density.", "alternatives": None, "nutrients": ["Folate", "Fiber", "Potassium", "Iron"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "98", "name": "Pumpkin/Squash", "category": "Vegetables", "safety_level": "safe", "description": "Various squash varieties common worldwide", "nutrition_note": "May be included as part of a varied diet. Noted as a vitamin A and fiber source.", "context": "Orange vegetables are referenced in nutrition materials for beta-carotene content.", "alternatives": None, "nutrients": ["Vitamin A", "Fiber", "Potassium", "Vitamin C"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "99", "name": "Chia Seeds", "category": "Nuts & Seeds", "safety_level": "safe", "description": "Nutrient-dense seeds popular in health foods", "nutrition_note": "May be included as part of a varied diet. Noted as a plant-based omega-3 and fiber source.", "context": "Seeds are referenced in nutrition guidance for their nutrient density.", "alternatives": None, "nutrients": ["Omega-3", "Fiber", "Calcium", "Protein"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]},
    {"id": "100", "name": "Halloumi Cheese", "category": "Dairy", "safety_level": "safe", "description": "Cypriot/Mediterranean grilling cheese", "nutrition_note": "May be included as part of a varied diet when made from pasteurized milk. Noted as a calcium and protein source.", "context": "Grilling cheeses made from pasteurized milk are referenced in food safety guidance.", "alternatives": None, "nutrients": ["Calcium", "Protein", "B12"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]}
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

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    # Validate email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, user_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check password length
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{int(datetime.now(timezone.utc).timestamp())}_{secrets.token_hex(4)}"
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "age": user_data.age,
        "trimester": user_data.trimester,
        "pregnancy_stage_label": user_data.pregnancy_stage_label,
        "dietary_restrictions": user_data.dietary_restrictions or [],
        "is_premium": False,
        "created_at": now,
        "updated_at": now
    }
    
    await users_collection.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, user_data.email.lower())
    
    return AuthResponse(
        user=UserResponse(
            id=user_id,
            email=user_data.email.lower(),
            age=user_data.age,
            trimester=user_data.trimester,
            pregnancy_stage_label=user_data.pregnancy_stage_label,
            dietary_restrictions=user_data.dietary_restrictions or [],
            is_premium=False,
            created_at=now
        ),
        token=token,
        message="Registration successful"
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login_user(credentials: UserLogin):
    """Login user with email and password"""
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check premium status from payments
    paid_transaction = await payment_transactions_collection.find_one({
        "user_id": user["_id"],
        "payment_status": "paid"
    })
    
    is_premium = paid_transaction is not None
    
    # Update premium status if changed
    if is_premium != user.get("is_premium", False):
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_premium": is_premium, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Create JWT token
    token = create_jwt_token(user["_id"], user["email"])
    
    return AuthResponse(
        user=UserResponse(
            id=user["_id"],
            email=user["email"],
            age=user.get("age"),
            trimester=user.get("trimester"),
            pregnancy_stage_label=user.get("pregnancy_stage_label"),
            dietary_restrictions=user.get("dietary_restrictions", []),
            is_premium=is_premium,
            created_at=user.get("created_at", "")
        ),
        token=token,
        message="Login successful"
    )

@api_router.get("/auth/me")
async def get_current_user_profile(current_user: Dict = Depends(get_current_user)):
    """Get current user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check premium status
    paid_transaction = await payment_transactions_collection.find_one({
        "user_id": current_user["_id"],
        "payment_status": "paid"
    })
    is_premium = paid_transaction is not None
    
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        age=current_user.get("age"),
        trimester=current_user.get("trimester"),
        pregnancy_stage_label=current_user.get("pregnancy_stage_label"),
        dietary_restrictions=current_user.get("dietary_restrictions", []),
        is_premium=is_premium,
        created_at=current_user.get("created_at", "")
    )

@api_router.put("/auth/profile")
async def update_user_profile(
    update_data: UserUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Update current user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update_data.age is not None:
        update_fields["age"] = update_data.age
    if update_data.trimester is not None:
        update_fields["trimester"] = update_data.trimester
    if update_data.pregnancy_stage_label is not None:
        update_fields["pregnancy_stage_label"] = update_data.pregnancy_stage_label
    if update_data.dietary_restrictions is not None:
        update_fields["dietary_restrictions"] = update_data.dietary_restrictions
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields}
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": current_user["_id"]})
    
    # Check premium status
    paid_transaction = await payment_transactions_collection.find_one({
        "user_id": current_user["_id"],
        "payment_status": "paid"
    })
    is_premium = paid_transaction is not None
    
    return UserResponse(
        id=updated_user["_id"],
        email=updated_user["email"],
        age=updated_user.get("age"),
        trimester=updated_user.get("trimester"),
        pregnancy_stage_label=updated_user.get("pregnancy_stage_label"),
        dietary_restrictions=updated_user.get("dietary_restrictions", []),
        is_premium=is_premium,
        created_at=updated_user.get("created_at", "")
    )

# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "WhatToEat - Pregnancy Nutrition Education API"}

@api_router.get("/foods", response_model=List[dict])
async def get_all_foods():
    """Get all foods in the database"""
    foods = await foods_collection.find({}, {"_id": 0}).to_list(length=None)
    # Fallback to in-memory if MongoDB is empty
    if not foods:
        return FOOD_DATABASE
    return foods

@api_router.get("/foods/search")
async def search_foods(q: str = ""):
    """Search foods by name or category"""
    if not q:
        foods = await foods_collection.find({}, {"_id": 0}).to_list(length=None)
        return foods if foods else FOOD_DATABASE
    
    # Use MongoDB text search or regex
    query_regex = {"$regex": q, "$options": "i"}
    foods = await foods_collection.find(
        {
            "$or": [
                {"name": query_regex},
                {"category": query_regex},
                {"description": query_regex}
            ]
        },
        {"_id": 0}
    ).to_list(length=None)
    return foods

@api_router.get("/foods/{food_id}")
async def get_food_detail(food_id: str):
    """Get detailed information about a specific food"""
    food = await foods_collection.find_one({"id": food_id}, {"_id": 0})
    if food:
        return food
    # Fallback to in-memory
    for f in FOOD_DATABASE:
        if f["id"] == food_id:
            return f
    raise HTTPException(status_code=404, detail="Food not found")

@api_router.get("/foods/category/{category}")
async def get_foods_by_category(category: str):
    """Get foods by category"""
    query_regex = {"$regex": category, "$options": "i"}
    foods = await foods_collection.find({"category": query_regex}, {"_id": 0}).to_list(length=None)
    return foods

@api_router.get("/foods/safety/{safety_level}")
async def get_foods_by_safety(safety_level: str):
    """Get foods by safety level (safe, limit, avoid)"""
    if safety_level not in ["safe", "limit", "avoid"]:
        raise HTTPException(status_code=400, detail="Invalid safety level. Use: safe, limit, or avoid")
    
    foods = await foods_collection.find({"safety_level": safety_level}, {"_id": 0}).to_list(length=None)
    return foods

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
    # Use MongoDB distinct to get unique categories
    categories = await foods_collection.distinct("category")
    if not categories:
        # Fallback to in-memory
        categories = list(set(food["category"] for food in FOOD_DATABASE))
    return sorted(categories)

@api_router.get("/about")
async def get_about():
    """Get about page information"""
    return {
        "app_name": "WhatToEat",
        "purpose": "Educational Pregnancy Nutrition Reference",
        "description": "WhatToEat provides general educational reference information about nutrition during pregnancy. It is designed as an informational resource to help users learn about nutrition topics commonly discussed in public health literature.",
        "data_sources": [
            "World Health Organization (WHO)",
            "Centers for Disease Control and Prevention (CDC)",
            "National Health Service (NHS) Pregnancy Nutrition Guidance",
            "American College of Obstetricians and Gynecologists (ACOG)"
        ],
        "disclaimer": "This app provides general educational reference information about pregnancy nutrition. It does not provide medical advice, diagnosis, or treatment. This content is not a substitute for professional medical guidance. Consulting a qualified healthcare professional is suggested for personal health concerns.",
        "non_medical_statement": "WhatToEat is not a medical app and does not provide medical advice. The information provided is general educational reference material compiled from public health sources. It is not intended for use in making health decisions. Individual circumstances vary; consulting healthcare professionals is suggested for personalized guidance. Do not disregard professional medical advice or delay seeking it because of information in this app.",
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

# ===== PERSONALIZATION ENDPOINTS =====

class PersonalizationRequest(BaseModel):
    health_conditions: List[str] = Field(default=[], description="User's health conditions and dietary restrictions")
    trimester: Optional[int] = Field(default=None, ge=1, le=4, description="User's pregnancy trimester (1-4, 4=postpartum)")

@api_router.post("/foods/personalized")
async def get_personalized_foods(request: PersonalizationRequest):
    """
    Get all foods with personalization flags based on user's health conditions and trimester.
    Returns foods with recommendation/caution flags.
    """
    health_conditions = request.health_conditions
    trimester = request.trimester
    
    # Get personalization recommendations
    recommendations = get_personalized_recommendations(health_conditions, trimester)
    
    # Get all foods from MongoDB
    foods = await foods_collection.find({}, {"_id": 0}).to_list(length=None)
    # Fallback to in-memory if MongoDB is empty
    if not foods:
        foods = FOOD_DATABASE
    
    # Filter and enhance each food
    personalized_foods = []
    for food in foods:
        enhanced_food = filter_food_for_user(food, health_conditions, trimester)
        personalized_foods.append(enhanced_food)
    
    # Sort: recommended first, then should_limit last
    personalized_foods.sort(key=lambda x: (
        -1 if x["is_recommended"] else (1 if x["should_limit"] else 0),
        x["name"]
    ))
    
    return {
        "foods": personalized_foods,
        "recommendations": recommendations,
        "total_count": len(personalized_foods),
        "recommended_count": sum(1 for f in personalized_foods if f["is_recommended"]),
        "caution_count": sum(1 for f in personalized_foods if f["should_limit"]),
        "disclaimer": "This information is for educational purposes only. Consult your healthcare provider for personalized dietary advice."
    }


@api_router.get("/foods/recommended/{condition}")
async def get_foods_for_condition(condition: str):
    """
    Get foods recommended for a specific health condition.
    """
    if condition not in HEALTH_CONDITION_TAGS:
        raise HTTPException(status_code=404, detail=f"Unknown condition: {condition}")
    
    config = HEALTH_CONDITION_TAGS[condition]
    
    # Get all foods from MongoDB
    foods = await foods_collection.find({}, {"_id": 0}).to_list(length=None)
    if not foods:
        foods = FOOD_DATABASE
    
    # Filter foods for this condition
    recommended_foods = []
    avoid_foods = []
    
    for food in foods:
        enhanced = filter_food_for_user(food, [condition])
        if enhanced["is_recommended"]:
            recommended_foods.append(enhanced)
        elif enhanced["should_limit"]:
            avoid_foods.append(enhanced)
    
    return {
        "condition": condition,
        "description": config.get("description", ""),
        "highlight_nutrients": config.get("highlight_nutrients", []),
        "recommended_foods": recommended_foods,
        "foods_to_limit": avoid_foods,
        "disclaimer": "This information is for educational purposes only. Consult your healthcare provider for personalized dietary advice."
    }


@api_router.get("/recommendations/trimester/{trimester}")
async def get_trimester_recommendations(trimester: int):
    """
    Get nutrition recommendations for a specific trimester.
    """
    if trimester not in TRIMESTER_PRIORITIES:
        raise HTTPException(status_code=404, detail="Trimester must be 1, 2, 3, or 4 (postpartum)")
    
    config = TRIMESTER_PRIORITIES[trimester]
    
    # Get all foods from MongoDB
    foods = await foods_collection.find({}, {"_id": 0}).to_list(length=None)
    if not foods:
        foods = FOOD_DATABASE
    
    # Get recommended foods for this trimester
    recommended_tags = config.get("recommended_tags", [])
    recommended_foods = []
    
    for food in foods:
        enhanced = filter_food_for_user(food, [], trimester)
        if enhanced["is_recommended"] or any(tag in enhanced.get("health_tags", []) for tag in recommended_tags):
            enhanced["is_recommended"] = True
            recommended_foods.append(enhanced)
    
    # Get trimester-specific tips
    if trimester == 1:
        tips = FIRST_TRIMESTER_TIPS[:5]
    elif trimester == 2:
        tips = SECOND_TRIMESTER_TIPS[:5]
    elif trimester == 3:
        tips = THIRD_TRIMESTER_TIPS[:5]
    else:
        tips = THIRD_TRIMESTER_TIPS[:5]  # Postpartum uses third trimester tips as base
    
    return {
        "trimester": trimester,
        "name": config["name"],
        "weeks": config["weeks"],
        "priority_nutrients": config["priority_nutrients"],
        "focus_areas": config["focus_areas"],
        "recommended_foods": recommended_foods[:20],  # Top 20
        "daily_tips": tips,
        "disclaimer": "This information is for educational purposes only. Consult your healthcare provider for personalized dietary advice."
    }


@api_router.get("/health-conditions")
async def get_health_conditions():
    """
    Get list of all supported health conditions with their descriptions.
    """
    conditions = []
    for condition_id, config in HEALTH_CONDITION_TAGS.items():
        conditions.append({
            "id": condition_id,
            "description": config.get("description", ""),
            "highlight_nutrients": config.get("highlight_nutrients", []),
            "recommended_tags": config.get("recommended_tags", [])
        })
    
    return {
        "conditions": conditions,
        "total": len(conditions)
    }


# ===== DAILY TIPS ENDPOINTS =====

@api_router.get("/tips/today")
async def get_todays_tip(trimester: Optional[int] = None):
    """
    Get today's daily tip with full expanded content
    
    Args:
        trimester: Optional filter (1, 2, or 3) to get trimester-specific tip
    """
    if trimester is not None and trimester not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Trimester must be 1, 2, or 3")
    
    tip = get_daily_tip(trimester)
    return {
        "tip": tip,
        "trimester_filter": trimester,
        "disclaimer": "This is general educational reference information only and does not constitute medical advice."
    }


@api_router.get("/tips/all")
async def get_all_nutrition_tips(trimester: Optional[int] = None):
    """
    Get all daily tips, optionally filtered by trimester
    
    Args:
        trimester: Optional filter (1, 2, or 3)
    """
    if trimester is not None and trimester not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Trimester must be 1, 2, or 3")
    
    tips = get_all_tips(trimester)
    counts = get_tips_count(trimester)
    
    return {
        "tips": tips,
        "counts": counts,
        "trimester_filter": trimester,
        "disclaimer": "This is general educational reference information only and does not constitute medical advice."
    }


@api_router.get("/tips/{tip_index}")
async def get_tip_by_number(tip_index: int, trimester: Optional[int] = None):
    """
    Get a specific tip by index (0-29 for all, 0-9 for trimester-specific)
    
    Args:
        tip_index: Index of the tip to retrieve
        trimester: Optional filter (1, 2, or 3)
    """
    if trimester is not None and trimester not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Trimester must be 1, 2, or 3")
    
    tip = get_tip_by_index(tip_index, trimester)
    counts = get_tips_count(trimester)
    
    return {
        "tip": tip,
        "tip_index": tip_index % counts["selected_count"],
        "total_tips": counts["selected_count"],
        "trimester_filter": trimester,
        "disclaimer": "This is general educational reference information only and does not constitute medical advice."
    }


# ===== STRIPE PAYMENT ENDPOINTS =====

@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """
    Create a Stripe checkout session for premium purchase
    """
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build URLs from frontend origin
        origin_url = request.origin_url.rstrip('/')
        success_url = f"{origin_url}/subscribe?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/subscribe"
        
        # Create checkout session with fixed price
        checkout_request = CheckoutSessionRequest(
            amount=PREMIUM_PRICE,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "product": "whattoeat_premium",
                "user_id": request.user_id or "guest",
                "type": "one_time_pregnancy"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "session_id": session.session_id,
            "user_id": request.user_id or "guest",
            "amount": PREMIUM_PRICE,
            "currency": "usd",
            "product": "whattoeat_premium",
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await payment_transactions_collection.insert_one(transaction)
        
        logger.info(f"Checkout session created: {session.session_id}")
        
        return CheckoutResponse(url=session.url, session_id=session.session_id)
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request):
    """
    Get the status of a checkout session
    """
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get checkout status from Stripe
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        update_data = {
            "payment_status": status.payment_status,
            "status": status.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Only update if not already processed (prevent duplicate credits)
        existing = await payment_transactions_collection.find_one({"session_id": session_id})
        if existing and existing.get("payment_status") != "paid":
            await payment_transactions_collection.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
            logger.info(f"Payment status updated: {session_id} -> {status.payment_status}")
        
        return {
            "session_id": session_id,
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Error getting payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment status")


@api_router.get("/payments/user/{user_id}/premium-status")
async def check_premium_status(user_id: str):
    """
    Check if a user has premium status based on successful payments.
    Returns premium status and purchase date.
    """
    try:
        # Find any paid transaction for this user
        paid_transaction = await payment_transactions_collection.find_one(
            {
                "user_id": user_id,
                "payment_status": "paid"
            },
            {"_id": 0, "session_id": 1, "created_at": 1, "updated_at": 1}
        )
        
        if paid_transaction:
            return {
                "is_premium": True,
                "purchased_at": paid_transaction.get("updated_at") or paid_transaction.get("created_at"),
                "session_id": paid_transaction.get("session_id")
            }
        
        return {
            "is_premium": False,
            "purchased_at": None,
            "session_id": None
        }
        
    except Exception as e:
        logger.error(f"Error checking premium status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check premium status")


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events
    """
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # Get request body
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on event
        if webhook_response.session_id:
            update_data = {
                "payment_status": webhook_response.payment_status,
                "webhook_event_id": webhook_response.event_id,
                "webhook_event_type": webhook_response.event_type,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await payment_transactions_collection.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": update_data}
            )
            logger.info(f"Webhook processed: {webhook_response.event_type} for {webhook_response.session_id}")
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
