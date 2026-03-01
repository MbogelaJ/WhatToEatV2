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
from contextlib import asynccontextmanager
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from push_notifications import get_fcm_service, get_daily_tip

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
device_tokens_collection = db["device_tokens"]

# Timezone for scheduler
SCHEDULER_TIMEZONE = pytz.timezone('Africa/Dar_es_Salaam')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# APScheduler instance
scheduler = AsyncIOScheduler(timezone=SCHEDULER_TIMEZONE)


async def send_daily_notifications():
    """
    Scheduled job to send daily pregnancy nutrition tips to all registered devices
    Runs at 3:00 PM Africa/Dar_es_Salaam timezone
    """
    logger.info("Starting daily notification job...")
    
    try:
        # Get today's tip
        tip = get_daily_tip()
        title = tip["title"]
        body = tip["body"]
        data = tip.get("data", {})
        
        # Get all registered device tokens
        tokens = []
        async for doc in device_tokens_collection.find({}, {"_id": 0, "token": 1}):
            tokens.append(doc["token"])
        
        if not tokens:
            logger.info("No registered device tokens found. Skipping notification.")
            return
        
        logger.info(f"Sending daily tip to {len(tokens)} devices: {title}")
        
        # Send notifications
        fcm = get_fcm_service()
        results = fcm.send_multicast(tokens, title, body, data)
        
        logger.info(f"Notification results: {results['success_count']} success, {results['failure_count']} failures")
        
        # Remove invalid tokens from database
        if results["invalid_tokens"]:
            logger.info(f"Removing {len(results['invalid_tokens'])} invalid tokens")
            for invalid_token in results["invalid_tokens"]:
                await device_tokens_collection.delete_one({"token": invalid_token})
            logger.info(f"Removed {len(results['invalid_tokens'])} invalid tokens from database")
        
    except Exception as e:
        logger.error(f"Error in daily notification job: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown"""
    # Startup
    logger.info("Starting NurtureNote API...")
    
    # Initialize FCM service
    fcm = get_fcm_service()
    if fcm.project_id:
        logger.info(f"FCM service initialized for project: {fcm.project_id}")
    else:
        logger.warning("FCM service not configured - push notifications disabled")
    
    # Create index on device_tokens collection
    await device_tokens_collection.create_index("token", unique=True)
    logger.info("Device tokens collection index created")
    
    # Schedule daily notification job at 3:00 PM Africa/Dar_es_Salaam
    scheduler.add_job(
        send_daily_notifications,
        trigger=CronTrigger(hour=15, minute=0, timezone=SCHEDULER_TIMEZONE),
        id="daily_notification",
        name="Daily Pregnancy Nutrition Tip",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Daily notification scheduler started - scheduled for 3:00 PM Africa/Dar_es_Salaam")
    
    yield
    
    # Shutdown
    logger.info("Shutting down NurtureNote API...")
    scheduler.shutdown()
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

# Device token models for push notifications
class DeviceTokenRequest(BaseModel):
    token: str = Field(..., min_length=1, description="FCM device token")
    platform: Optional[str] = Field(default="ios", description="Device platform (ios/android)")
    trimester: Optional[int] = Field(default=None, ge=1, le=3, description="User's trimester (1, 2, or 3)")

class DeviceTokenResponse(BaseModel):
    success: bool
    message: str
    token_id: Optional[str] = None

class NotificationTestRequest(BaseModel):
    token: str = Field(..., min_length=1, description="FCM device token to test")
    title: Optional[str] = Field(default="Test Notification", description="Notification title")
    body: Optional[str] = Field(default="This is a test notification from NurtureNote", description="Notification body")

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
    {"id": "85", "name": "Buffet Foods", "category": "Street Foods & Prepared", "safety_level": "limit", "description": "Self-serve buffet items", "nutrition_note": "Often noted in food safety guidance. Temperature maintenance and freshness are considerations.", "context": "Buffet food safety is discussed regarding holding temperatures and cross-contamination.", "alternatives": ["Made-to-order foods", "Freshly prepared meals"], "nutrients": ["Varies"], "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]}
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
