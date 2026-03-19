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

# EXPANDED Food Database with safety ratings
# Safety: SAFE (healthy), LIMIT (moderate), AVOID (unhealthy)
LOCAL_FOODS = [
    # ==================== FRUITS (30 items) ====================
    {"id": "apple-1", "name": "Apple, raw, with skin", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2, "fiber": 2.4, "serving_size": "100g"},
    {"id": "banana-1", "name": "Banana, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "fiber": 2.6, "serving_size": "100g"},
    {"id": "orange-1", "name": "Orange, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1, "fiber": 2.4, "serving_size": "100g"},
    {"id": "strawberry-1", "name": "Strawberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "fiber": 2, "serving_size": "100g"},
    {"id": "grapes-1", "name": "Grapes, red or green", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 69, "protein": 0.7, "carbs": 18, "fat": 0.2, "fiber": 0.9, "serving_size": "100g"},
    {"id": "mango-1", "name": "Mango, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4, "fiber": 1.6, "serving_size": "100g"},
    {"id": "pineapple-1", "name": "Pineapple, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 50, "protein": 0.5, "carbs": 13, "fat": 0.1, "fiber": 1.4, "serving_size": "100g"},
    {"id": "watermelon-1", "name": "Watermelon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "fiber": 0.4, "serving_size": "100g"},
    {"id": "blueberry-1", "name": "Blueberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 57, "protein": 0.7, "carbs": 14, "fat": 0.3, "fiber": 2.4, "serving_size": "100g"},
    {"id": "avocado-1", "name": "Avocado, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 160, "protein": 2, "carbs": 9, "fat": 15, "fiber": 7, "serving_size": "100g"},
    {"id": "peach-1", "name": "Peach, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 39, "protein": 0.9, "carbs": 10, "fat": 0.3, "fiber": 1.5, "serving_size": "100g"},
    {"id": "pear-1", "name": "Pear, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 57, "protein": 0.4, "carbs": 15, "fat": 0.1, "fiber": 3.1, "serving_size": "100g"},
    {"id": "cherry-1", "name": "Cherries, sweet, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 63, "protein": 1.1, "carbs": 16, "fat": 0.2, "fiber": 2.1, "serving_size": "100g"},
    {"id": "kiwi-1", "name": "Kiwi fruit, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 61, "protein": 1.1, "carbs": 15, "fat": 0.5, "fiber": 3, "serving_size": "100g"},
    {"id": "grapefruit-1", "name": "Grapefruit, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 42, "protein": 0.8, "carbs": 11, "fat": 0.1, "fiber": 1.6, "serving_size": "100g"},
    {"id": "raspberry-1", "name": "Raspberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 52, "protein": 1.2, "carbs": 12, "fat": 0.7, "fiber": 6.5, "serving_size": "100g"},
    {"id": "blackberry-1", "name": "Blackberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 43, "protein": 1.4, "carbs": 10, "fat": 0.5, "fiber": 5.3, "serving_size": "100g"},
    {"id": "cantaloupe-1", "name": "Cantaloupe, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 34, "protein": 0.8, "carbs": 8, "fat": 0.2, "fiber": 0.9, "serving_size": "100g"},
    {"id": "honeydew-1", "name": "Honeydew melon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 36, "protein": 0.5, "carbs": 9, "fat": 0.1, "fiber": 0.8, "serving_size": "100g"},
    {"id": "papaya-1", "name": "Papaya, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 43, "protein": 0.5, "carbs": 11, "fat": 0.3, "fiber": 1.7, "serving_size": "100g"},
    {"id": "pomegranate-1", "name": "Pomegranate, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 83, "protein": 1.7, "carbs": 19, "fat": 1.2, "fiber": 4, "serving_size": "100g"},
    {"id": "plum-1", "name": "Plum, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 46, "protein": 0.7, "carbs": 11, "fat": 0.3, "fiber": 1.4, "serving_size": "100g"},
    {"id": "apricot-1", "name": "Apricot, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 48, "protein": 1.4, "carbs": 11, "fat": 0.4, "fiber": 2, "serving_size": "100g"},
    {"id": "nectarine-1", "name": "Nectarine, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 44, "protein": 1.1, "carbs": 11, "fat": 0.3, "fiber": 1.7, "serving_size": "100g"},
    {"id": "coconut-1", "name": "Coconut meat, raw", "brand": None, "category": "Fruits", "safety": "LIMIT", "calories": 354, "protein": 3.3, "carbs": 15, "fat": 33, "fiber": 9, "serving_size": "100g"},
    {"id": "fig-1", "name": "Figs, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 74, "protein": 0.8, "carbs": 19, "fat": 0.3, "fiber": 2.9, "serving_size": "100g"},
    {"id": "dates-1", "name": "Dates, medjool", "brand": None, "category": "Fruits", "safety": "LIMIT", "calories": 277, "protein": 1.8, "carbs": 75, "fat": 0.2, "fiber": 6.7, "serving_size": "100g"},
    {"id": "cranberry-1", "name": "Cranberries, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 46, "protein": 0.5, "carbs": 12, "fat": 0.1, "fiber": 4.6, "serving_size": "100g"},
    {"id": "lemon-1", "name": "Lemon, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 29, "protein": 1.1, "carbs": 9, "fat": 0.3, "fiber": 2.8, "serving_size": "100g"},
    {"id": "lime-1", "name": "Lime, raw", "brand": None, "category": "Fruits", "safety": "SAFE", "calories": 30, "protein": 0.7, "carbs": 11, "fat": 0.2, "fiber": 2.8, "serving_size": "100g"},

    # ==================== VEGETABLES (35 items) ====================
    {"id": "broccoli-1", "name": "Broccoli, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "fiber": 2.6, "serving_size": "100g"},
    {"id": "carrot-1", "name": "Carrots, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2, "fiber": 2.8, "serving_size": "100g"},
    {"id": "spinach-1", "name": "Spinach, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "fiber": 2.2, "serving_size": "100g"},
    {"id": "tomato-1", "name": "Tomatoes, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2, "serving_size": "100g"},
    {"id": "cucumber-1", "name": "Cucumber, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 15, "protein": 0.7, "carbs": 3.6, "fat": 0.1, "fiber": 0.5, "serving_size": "100g"},
    {"id": "lettuce-1", "name": "Lettuce, romaine", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 17, "protein": 1.2, "carbs": 3.3, "fat": 0.3, "fiber": 2.1, "serving_size": "100g"},
    {"id": "potato-1", "name": "Potato, raw", "brand": None, "category": "Vegetables", "safety": "LIMIT", "calories": 77, "protein": 2, "carbs": 17, "fat": 0.1, "fiber": 2.2, "serving_size": "100g"},
    {"id": "sweetpotato-1", "name": "Sweet potato, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1, "fiber": 3, "serving_size": "100g"},
    {"id": "onion-1", "name": "Onion, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1, "fiber": 1.7, "serving_size": "100g"},
    {"id": "bellpepper-1", "name": "Bell pepper, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 31, "protein": 1, "carbs": 6, "fat": 0.3, "fiber": 2.1, "serving_size": "100g"},
    {"id": "celery-1", "name": "Celery, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 16, "protein": 0.7, "carbs": 3, "fat": 0.2, "fiber": 1.6, "serving_size": "100g"},
    {"id": "cauliflower-1", "name": "Cauliflower, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1.9, "carbs": 5, "fat": 0.3, "fiber": 2, "serving_size": "100g"},
    {"id": "mushroom-1", "name": "Mushrooms, white, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 22, "protein": 3.1, "carbs": 3.3, "fat": 0.3, "fiber": 1, "serving_size": "100g"},
    {"id": "zucchini-1", "name": "Zucchini, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 17, "protein": 1.2, "carbs": 3.1, "fat": 0.3, "fiber": 1, "serving_size": "100g"},
    {"id": "corn-1", "name": "Corn, sweet, raw", "brand": None, "category": "Vegetables", "safety": "LIMIT", "calories": 86, "protein": 3.3, "carbs": 19, "fat": 1.4, "fiber": 2.7, "serving_size": "100g"},
    {"id": "asparagus-1", "name": "Asparagus, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 20, "protein": 2.2, "carbs": 3.9, "fat": 0.1, "fiber": 2.1, "serving_size": "100g"},
    {"id": "greenbeans-1", "name": "Green beans, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 31, "protein": 1.8, "carbs": 7, "fat": 0.1, "fiber": 2.7, "serving_size": "100g"},
    {"id": "peas-1", "name": "Green peas, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 81, "protein": 5.4, "carbs": 14, "fat": 0.4, "fiber": 5.7, "serving_size": "100g"},
    {"id": "kale-1", "name": "Kale, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 49, "protein": 4.3, "carbs": 9, "fat": 0.9, "fiber": 3.6, "serving_size": "100g"},
    {"id": "cabbage-1", "name": "Cabbage, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1.3, "carbs": 6, "fat": 0.1, "fiber": 2.5, "serving_size": "100g"},
    {"id": "brusselssprouts-1", "name": "Brussels sprouts, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 43, "protein": 3.4, "carbs": 9, "fat": 0.3, "fiber": 3.8, "serving_size": "100g"},
    {"id": "eggplant-1", "name": "Eggplant, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 1, "carbs": 6, "fat": 0.2, "fiber": 3, "serving_size": "100g"},
    {"id": "artichoke-1", "name": "Artichoke, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 47, "protein": 3.3, "carbs": 11, "fat": 0.2, "fiber": 5.4, "serving_size": "100g"},
    {"id": "beet-1", "name": "Beets, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 43, "protein": 1.6, "carbs": 10, "fat": 0.2, "fiber": 2.8, "serving_size": "100g"},
    {"id": "radish-1", "name": "Radish, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 16, "protein": 0.7, "carbs": 3.4, "fat": 0.1, "fiber": 1.6, "serving_size": "100g"},
    {"id": "turnip-1", "name": "Turnip, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 28, "protein": 0.9, "carbs": 6, "fat": 0.1, "fiber": 1.8, "serving_size": "100g"},
    {"id": "leek-1", "name": "Leek, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 61, "protein": 1.5, "carbs": 14, "fat": 0.3, "fiber": 1.8, "serving_size": "100g"},
    {"id": "garlic-1", "name": "Garlic, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 149, "protein": 6.4, "carbs": 33, "fat": 0.5, "fiber": 2.1, "serving_size": "100g"},
    {"id": "ginger-1", "name": "Ginger root, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 80, "protein": 1.8, "carbs": 18, "fat": 0.8, "fiber": 2, "serving_size": "100g"},
    {"id": "squash-1", "name": "Butternut squash, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 45, "protein": 1, "carbs": 12, "fat": 0.1, "fiber": 2, "serving_size": "100g"},
    {"id": "pumpkin-1", "name": "Pumpkin, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 26, "protein": 1, "carbs": 7, "fat": 0.1, "fiber": 0.5, "serving_size": "100g"},
    {"id": "okra-1", "name": "Okra, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 33, "protein": 1.9, "carbs": 7, "fat": 0.2, "fiber": 3.2, "serving_size": "100g"},
    {"id": "bokchoy-1", "name": "Bok choy, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 13, "protein": 1.5, "carbs": 2.2, "fat": 0.2, "fiber": 1, "serving_size": "100g"},
    {"id": "arugula-1", "name": "Arugula, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 25, "protein": 2.6, "carbs": 3.7, "fat": 0.7, "fiber": 1.6, "serving_size": "100g"},
    {"id": "watercress-1", "name": "Watercress, raw", "brand": None, "category": "Vegetables", "safety": "SAFE", "calories": 11, "protein": 2.3, "carbs": 1.3, "fat": 0.1, "fiber": 0.5, "serving_size": "100g"},

    # ==================== PROTEINS (40 items) ====================
    {"id": "chicken-breast-1", "name": "Chicken breast, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0, "serving_size": "100g"},
    {"id": "chicken-thigh-1", "name": "Chicken thigh, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 209, "protein": 26, "carbs": 0, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "chicken-wing-1", "name": "Chicken wing, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 203, "protein": 30, "carbs": 0, "fat": 8, "fiber": 0, "serving_size": "100g"},
    {"id": "salmon-1", "name": "Salmon, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "fiber": 0, "serving_size": "100g"},
    {"id": "beef-ground-1", "name": "Beef, ground, 90% lean", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 176, "protein": 26, "carbs": 0, "fat": 8, "fiber": 0, "serving_size": "100g"},
    {"id": "beef-sirloin-1", "name": "Beef sirloin, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 183, "protein": 27, "carbs": 0, "fat": 8, "fiber": 0, "serving_size": "100g"},
    {"id": "beef-ribeye-1", "name": "Beef ribeye, cooked", "brand": None, "category": "Proteins", "safety": "AVOID", "calories": 291, "protein": 24, "carbs": 0, "fat": 21, "fiber": 0, "serving_size": "100g"},
    {"id": "egg-1", "name": "Egg, whole, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "egg-white-1", "name": "Egg white, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 52, "protein": 11, "carbs": 0.7, "fat": 0.2, "fiber": 0, "serving_size": "100g"},
    {"id": "tuna-1", "name": "Tuna, canned in water", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 116, "protein": 26, "carbs": 0, "fat": 0.8, "fiber": 0, "serving_size": "100g"},
    {"id": "tuna-fresh-1", "name": "Tuna, fresh, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 184, "protein": 30, "carbs": 0, "fat": 6, "fiber": 0, "serving_size": "100g"},
    {"id": "shrimp-1", "name": "Shrimp, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 99, "protein": 24, "carbs": 0.2, "fat": 0.3, "fiber": 0, "serving_size": "100g"},
    {"id": "turkey-breast-1", "name": "Turkey breast, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 135, "protein": 30, "carbs": 0, "fat": 0.7, "fiber": 0, "serving_size": "100g"},
    {"id": "turkey-ground-1", "name": "Turkey, ground, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 170, "protein": 27, "carbs": 0, "fat": 6, "fiber": 0, "serving_size": "100g"},
    {"id": "pork-loin-1", "name": "Pork loin, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 143, "protein": 26, "carbs": 0, "fat": 3.5, "fiber": 0, "serving_size": "100g"},
    {"id": "pork-tenderloin-1", "name": "Pork tenderloin, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 143, "protein": 26, "carbs": 0, "fat": 4, "fiber": 0, "serving_size": "100g"},
    {"id": "bacon-1", "name": "Bacon, cooked", "brand": None, "category": "Proteins", "safety": "AVOID", "calories": 541, "protein": 37, "carbs": 1.4, "fat": 42, "fiber": 0, "serving_size": "100g"},
    {"id": "ham-1", "name": "Ham, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 145, "protein": 21, "carbs": 1.5, "fat": 6, "fiber": 0, "serving_size": "100g"},
    {"id": "tofu-1", "name": "Tofu, firm", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8, "fiber": 0.3, "serving_size": "100g"},
    {"id": "tofu-silken-1", "name": "Tofu, silken", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 55, "protein": 5, "carbs": 2.4, "fat": 3, "fiber": 0.2, "serving_size": "100g"},
    {"id": "tempeh-1", "name": "Tempeh", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 192, "protein": 20, "carbs": 8, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "lentils-1", "name": "Lentils, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4, "fiber": 8, "serving_size": "100g"},
    {"id": "chickpeas-1", "name": "Chickpeas, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 164, "protein": 9, "carbs": 27, "fat": 2.6, "fiber": 8, "serving_size": "100g"},
    {"id": "black-beans-1", "name": "Black beans, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 132, "protein": 9, "carbs": 24, "fat": 0.5, "fiber": 8.7, "serving_size": "100g"},
    {"id": "kidney-beans-1", "name": "Kidney beans, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 127, "protein": 9, "carbs": 23, "fat": 0.5, "fiber": 6.4, "serving_size": "100g"},
    {"id": "navy-beans-1", "name": "Navy beans, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 140, "protein": 8, "carbs": 26, "fat": 0.6, "fiber": 10, "serving_size": "100g"},
    {"id": "cod-1", "name": "Cod, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 105, "protein": 23, "carbs": 0, "fat": 0.9, "fiber": 0, "serving_size": "100g"},
    {"id": "tilapia-1", "name": "Tilapia, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 128, "protein": 26, "carbs": 0, "fat": 2.7, "fiber": 0, "serving_size": "100g"},
    {"id": "halibut-1", "name": "Halibut, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 140, "protein": 27, "carbs": 0, "fat": 3, "fiber": 0, "serving_size": "100g"},
    {"id": "mackerel-1", "name": "Mackerel, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 262, "protein": 24, "carbs": 0, "fat": 18, "fiber": 0, "serving_size": "100g"},
    {"id": "sardines-1", "name": "Sardines, canned", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 208, "protein": 25, "carbs": 0, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "crab-1", "name": "Crab meat, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 97, "protein": 19, "carbs": 0, "fat": 1.5, "fiber": 0, "serving_size": "100g"},
    {"id": "lobster-1", "name": "Lobster, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 98, "protein": 21, "carbs": 0, "fat": 0.6, "fiber": 0, "serving_size": "100g"},
    {"id": "scallops-1", "name": "Scallops, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 111, "protein": 21, "carbs": 3, "fat": 1, "fiber": 0, "serving_size": "100g"},
    {"id": "lamb-1", "name": "Lamb, leg, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 243, "protein": 26, "carbs": 0, "fat": 15, "fiber": 0, "serving_size": "100g"},
    {"id": "duck-1", "name": "Duck breast, cooked", "brand": None, "category": "Proteins", "safety": "LIMIT", "calories": 201, "protein": 24, "carbs": 0, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "venison-1", "name": "Venison, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 158, "protein": 30, "carbs": 0, "fat": 3.2, "fiber": 0, "serving_size": "100g"},
    {"id": "bison-1", "name": "Bison, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 143, "protein": 28, "carbs": 0, "fat": 2.4, "fiber": 0, "serving_size": "100g"},
    {"id": "seitan-1", "name": "Seitan (wheat gluten)", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 370, "protein": 75, "carbs": 14, "fat": 2, "fiber": 0.6, "serving_size": "100g"},
    {"id": "edamame-1", "name": "Edamame, cooked", "brand": None, "category": "Proteins", "safety": "SAFE", "calories": 121, "protein": 11, "carbs": 10, "fat": 5, "fiber": 5, "serving_size": "100g"},

    # ==================== GRAINS (25 items) ====================
    {"id": "rice-white-1", "name": "Rice, white, cooked", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "fiber": 0.4, "serving_size": "100g"},
    {"id": "rice-brown-1", "name": "Rice, brown, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9, "fiber": 1.8, "serving_size": "100g"},
    {"id": "rice-basmati-1", "name": "Rice, basmati, cooked", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 121, "protein": 3.5, "carbs": 25, "fat": 0.4, "fiber": 0.6, "serving_size": "100g"},
    {"id": "rice-wild-1", "name": "Wild rice, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 101, "protein": 4, "carbs": 21, "fat": 0.3, "fiber": 1.8, "serving_size": "100g"},
    {"id": "bread-white-1", "name": "Bread, white", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 265, "protein": 9, "carbs": 49, "fat": 3.2, "fiber": 2.7, "serving_size": "100g"},
    {"id": "bread-wheat-1", "name": "Bread, whole wheat", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 247, "protein": 13, "carbs": 41, "fat": 3.4, "fiber": 7, "serving_size": "100g"},
    {"id": "bread-rye-1", "name": "Bread, rye", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 259, "protein": 9, "carbs": 48, "fat": 3.3, "fiber": 5.8, "serving_size": "100g"},
    {"id": "bread-sourdough-1", "name": "Bread, sourdough", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 270, "protein": 10, "carbs": 50, "fat": 3, "fiber": 2.5, "serving_size": "100g"},
    {"id": "pasta-1", "name": "Pasta, cooked", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 131, "protein": 5, "carbs": 25, "fat": 1.1, "fiber": 1.8, "serving_size": "100g"},
    {"id": "pasta-whole-wheat-1", "name": "Pasta, whole wheat, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 124, "protein": 5, "carbs": 24, "fat": 0.5, "fiber": 4.5, "serving_size": "100g"},
    {"id": "oatmeal-1", "name": "Oatmeal, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 68, "protein": 2.4, "carbs": 12, "fat": 1.4, "fiber": 1.7, "serving_size": "100g"},
    {"id": "oats-rolled-1", "name": "Oats, rolled, dry", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 389, "protein": 17, "carbs": 66, "fat": 7, "fiber": 11, "serving_size": "100g"},
    {"id": "quinoa-1", "name": "Quinoa, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 120, "protein": 4.4, "carbs": 21, "fat": 1.9, "fiber": 2.8, "serving_size": "100g"},
    {"id": "barley-1", "name": "Barley, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 123, "protein": 2.3, "carbs": 28, "fat": 0.4, "fiber": 3.8, "serving_size": "100g"},
    {"id": "bulgur-1", "name": "Bulgur, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 83, "protein": 3.1, "carbs": 19, "fat": 0.2, "fiber": 4.5, "serving_size": "100g"},
    {"id": "couscous-1", "name": "Couscous, cooked", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 112, "protein": 3.8, "carbs": 23, "fat": 0.2, "fiber": 1.4, "serving_size": "100g"},
    {"id": "farro-1", "name": "Farro, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 170, "protein": 7, "carbs": 34, "fat": 1.5, "fiber": 5, "serving_size": "100g"},
    {"id": "millet-1", "name": "Millet, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 119, "protein": 3.5, "carbs": 23, "fat": 1, "fiber": 1.3, "serving_size": "100g"},
    {"id": "buckwheat-1", "name": "Buckwheat, cooked", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 92, "protein": 3.4, "carbs": 20, "fat": 0.6, "fiber": 2.7, "serving_size": "100g"},
    {"id": "cereal-cornflakes-1", "name": "Cereal, corn flakes", "brand": None, "category": "Grains", "safety": "AVOID", "calories": 357, "protein": 7, "carbs": 84, "fat": 0.4, "fiber": 3.3, "serving_size": "100g"},
    {"id": "cereal-granola-1", "name": "Granola cereal", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 471, "protein": 10, "carbs": 64, "fat": 20, "fiber": 6, "serving_size": "100g"},
    {"id": "tortilla-flour-1", "name": "Tortilla, flour", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 312, "protein": 8, "carbs": 52, "fat": 8, "fiber": 2.1, "serving_size": "100g"},
    {"id": "tortilla-corn-1", "name": "Tortilla, corn", "brand": None, "category": "Grains", "safety": "SAFE", "calories": 218, "protein": 6, "carbs": 45, "fat": 3, "fiber": 6, "serving_size": "100g"},
    {"id": "bagel-1", "name": "Bagel, plain", "brand": None, "category": "Grains", "safety": "LIMIT", "calories": 257, "protein": 10, "carbs": 50, "fat": 1.5, "fiber": 2.1, "serving_size": "100g"},
    {"id": "croissant-1", "name": "Croissant", "brand": None, "category": "Grains", "safety": "AVOID", "calories": 406, "protein": 8, "carbs": 45, "fat": 21, "fiber": 2.5, "serving_size": "100g"},

    # ==================== DAIRY (20 items) ====================
    {"id": "milk-whole-1", "name": "Milk, whole", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0, "serving_size": "100ml"},
    {"id": "milk-2percent-1", "name": "Milk, 2% reduced fat", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 50, "protein": 3.3, "carbs": 5, "fat": 2, "fiber": 0, "serving_size": "100ml"},
    {"id": "milk-skim-1", "name": "Milk, skim", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 34, "protein": 3.4, "carbs": 5, "fat": 0.1, "fiber": 0, "serving_size": "100ml"},
    {"id": "cheese-cheddar-1", "name": "Cheese, cheddar", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 403, "protein": 25, "carbs": 1.3, "fat": 33, "fiber": 0, "serving_size": "100g"},
    {"id": "cheese-swiss-1", "name": "Cheese, Swiss", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 380, "protein": 27, "carbs": 5, "fat": 28, "fiber": 0, "serving_size": "100g"},
    {"id": "cheese-parmesan-1", "name": "Cheese, Parmesan", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 431, "protein": 38, "carbs": 4, "fat": 29, "fiber": 0, "serving_size": "100g"},
    {"id": "cheese-feta-1", "name": "Cheese, feta", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 264, "protein": 14, "carbs": 4, "fat": 21, "fiber": 0, "serving_size": "100g"},
    {"id": "yogurt-plain-1", "name": "Yogurt, plain, low-fat", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 63, "protein": 5, "carbs": 7, "fat": 1.6, "fiber": 0, "serving_size": "100g"},
    {"id": "yogurt-greek-1", "name": "Greek yogurt, plain", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.7, "fiber": 0, "serving_size": "100g"},
    {"id": "yogurt-flavored-1", "name": "Yogurt, flavored", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 99, "protein": 4, "carbs": 18, "fat": 1, "fiber": 0, "serving_size": "100g"},
    {"id": "butter-1", "name": "Butter, salted", "brand": None, "category": "Dairy", "safety": "AVOID", "calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81, "fiber": 0, "serving_size": "100g"},
    {"id": "cottage-cheese-1", "name": "Cottage cheese, low-fat", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 72, "protein": 12, "carbs": 2.7, "fat": 1, "fiber": 0, "serving_size": "100g"},
    {"id": "cream-cheese-1", "name": "Cream cheese", "brand": None, "category": "Dairy", "safety": "AVOID", "calories": 342, "protein": 6, "carbs": 4, "fat": 34, "fiber": 0, "serving_size": "100g"},
    {"id": "mozzarella-1", "name": "Mozzarella cheese", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 280, "protein": 28, "carbs": 2.2, "fat": 17, "fiber": 0, "serving_size": "100g"},
    {"id": "ricotta-1", "name": "Ricotta cheese, part-skim", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 138, "protein": 11, "carbs": 5, "fat": 8, "fiber": 0, "serving_size": "100g"},
    {"id": "sour-cream-1", "name": "Sour cream", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 198, "protein": 2.4, "carbs": 4.6, "fat": 20, "fiber": 0, "serving_size": "100g"},
    {"id": "heavy-cream-1", "name": "Heavy cream", "brand": None, "category": "Dairy", "safety": "AVOID", "calories": 340, "protein": 2, "carbs": 3, "fat": 36, "fiber": 0, "serving_size": "100ml"},
    {"id": "kefir-1", "name": "Kefir, plain", "brand": None, "category": "Dairy", "safety": "SAFE", "calories": 41, "protein": 3.3, "carbs": 4.5, "fat": 1, "fiber": 0, "serving_size": "100ml"},
    {"id": "brie-1", "name": "Cheese, Brie", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 334, "protein": 21, "carbs": 0.5, "fat": 28, "fiber": 0, "serving_size": "100g"},
    {"id": "goat-cheese-1", "name": "Cheese, goat", "brand": None, "category": "Dairy", "safety": "LIMIT", "calories": 364, "protein": 22, "carbs": 0.1, "fat": 30, "fiber": 0, "serving_size": "100g"},

    # ==================== NUTS & SEEDS (20 items) ====================
    {"id": "almonds-1", "name": "Almonds, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 579, "protein": 21, "carbs": 22, "fat": 50, "fiber": 12, "serving_size": "100g"},
    {"id": "almonds-roasted-1", "name": "Almonds, roasted", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 598, "protein": 21, "carbs": 21, "fat": 53, "fiber": 11, "serving_size": "100g"},
    {"id": "peanuts-1", "name": "Peanuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 567, "protein": 26, "carbs": 16, "fat": 49, "fiber": 8.5, "serving_size": "100g"},
    {"id": "walnuts-1", "name": "Walnuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 654, "protein": 15, "carbs": 14, "fat": 65, "fiber": 6.7, "serving_size": "100g"},
    {"id": "cashews-1", "name": "Cashews, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 553, "protein": 18, "carbs": 30, "fat": 44, "fiber": 3.3, "serving_size": "100g"},
    {"id": "pistachios-1", "name": "Pistachios, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 560, "protein": 20, "carbs": 28, "fat": 45, "fiber": 10, "serving_size": "100g"},
    {"id": "pecans-1", "name": "Pecans, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 691, "protein": 9, "carbs": 14, "fat": 72, "fiber": 10, "serving_size": "100g"},
    {"id": "hazelnuts-1", "name": "Hazelnuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 628, "protein": 15, "carbs": 17, "fat": 61, "fiber": 10, "serving_size": "100g"},
    {"id": "macadamia-1", "name": "Macadamia nuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "LIMIT", "calories": 718, "protein": 8, "carbs": 14, "fat": 76, "fiber": 8.6, "serving_size": "100g"},
    {"id": "brazil-nuts-1", "name": "Brazil nuts, raw", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 656, "protein": 14, "carbs": 12, "fat": 66, "fiber": 7.5, "serving_size": "100g"},
    {"id": "chia-seeds-1", "name": "Chia seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 486, "protein": 17, "carbs": 42, "fat": 31, "fiber": 34, "serving_size": "100g"},
    {"id": "flaxseeds-1", "name": "Flaxseeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 534, "protein": 18, "carbs": 29, "fat": 42, "fiber": 27, "serving_size": "100g"},
    {"id": "sunflower-seeds-1", "name": "Sunflower seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 584, "protein": 21, "carbs": 20, "fat": 51, "fiber": 8.6, "serving_size": "100g"},
    {"id": "pumpkin-seeds-1", "name": "Pumpkin seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 559, "protein": 30, "carbs": 11, "fat": 49, "fiber": 6, "serving_size": "100g"},
    {"id": "sesame-seeds-1", "name": "Sesame seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 573, "protein": 18, "carbs": 23, "fat": 50, "fiber": 12, "serving_size": "100g"},
    {"id": "hemp-seeds-1", "name": "Hemp seeds", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 553, "protein": 32, "carbs": 9, "fat": 49, "fiber": 4, "serving_size": "100g"},
    {"id": "peanut-butter-1", "name": "Peanut butter, natural", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "fiber": 6, "serving_size": "100g"},
    {"id": "almond-butter-1", "name": "Almond butter", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 614, "protein": 21, "carbs": 19, "fat": 56, "fiber": 10, "serving_size": "100g"},
    {"id": "tahini-1", "name": "Tahini (sesame paste)", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 595, "protein": 17, "carbs": 21, "fat": 54, "fiber": 9, "serving_size": "100g"},
    {"id": "pine-nuts-1", "name": "Pine nuts", "brand": None, "category": "Nuts & Seeds", "safety": "SAFE", "calories": 673, "protein": 14, "carbs": 13, "fat": 68, "fiber": 3.7, "serving_size": "100g"},

    # ==================== BEVERAGES (20 items) ====================
    {"id": "coffee-1", "name": "Coffee, brewed, black", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 2, "protein": 0.3, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "espresso-1", "name": "Espresso", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 9, "protein": 0.1, "carbs": 1.7, "fat": 0.2, "fiber": 0, "serving_size": "100ml"},
    {"id": "tea-black-1", "name": "Tea, black, brewed", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 1, "protein": 0, "carbs": 0.3, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "tea-green-1", "name": "Tea, green, brewed", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 1, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "tea-herbal-1", "name": "Tea, herbal, brewed", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 1, "protein": 0, "carbs": 0.2, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "orange-juice-1", "name": "Orange juice, fresh", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 45, "protein": 0.7, "carbs": 10, "fat": 0.2, "fiber": 0.2, "serving_size": "100ml"},
    {"id": "apple-juice-1", "name": "Apple juice", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 46, "protein": 0.1, "carbs": 11, "fat": 0.1, "fiber": 0.1, "serving_size": "100ml"},
    {"id": "grape-juice-1", "name": "Grape juice", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 60, "protein": 0.4, "carbs": 15, "fat": 0.1, "fiber": 0.1, "serving_size": "100ml"},
    {"id": "cranberry-juice-1", "name": "Cranberry juice", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 46, "protein": 0, "carbs": 12, "fat": 0.1, "fiber": 0, "serving_size": "100ml"},
    {"id": "almond-milk-1", "name": "Almond milk, unsweetened", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 15, "protein": 0.6, "carbs": 0.3, "fat": 1.2, "fiber": 0, "serving_size": "100ml"},
    {"id": "oat-milk-1", "name": "Oat milk, unsweetened", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 45, "protein": 1, "carbs": 7, "fat": 1.5, "fiber": 0.8, "serving_size": "100ml"},
    {"id": "soy-milk-1", "name": "Soy milk, unsweetened", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 33, "protein": 2.9, "carbs": 1.2, "fat": 1.8, "fiber": 0.4, "serving_size": "100ml"},
    {"id": "coconut-milk-1", "name": "Coconut milk beverage", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 19, "protein": 0.2, "carbs": 2.8, "fat": 0.9, "fiber": 0, "serving_size": "100ml"},
    {"id": "coconut-water-1", "name": "Coconut water", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 19, "protein": 0.7, "carbs": 3.7, "fat": 0.2, "fiber": 1.1, "serving_size": "100ml"},
    {"id": "soda-cola-1", "name": "Cola, regular", "brand": None, "category": "Beverages", "safety": "AVOID", "calories": 42, "protein": 0, "carbs": 11, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "soda-diet-1", "name": "Cola, diet", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "energy-drink-1", "name": "Energy drink", "brand": None, "category": "Beverages", "safety": "AVOID", "calories": 45, "protein": 0, "carbs": 11, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "sports-drink-1", "name": "Sports drink", "brand": None, "category": "Beverages", "safety": "LIMIT", "calories": 26, "protein": 0, "carbs": 7, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "kombucha-1", "name": "Kombucha", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 20, "protein": 0, "carbs": 4, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "smoothie-green-1", "name": "Green smoothie", "brand": None, "category": "Beverages", "safety": "SAFE", "calories": 60, "protein": 2, "carbs": 12, "fat": 0.5, "fiber": 2, "serving_size": "100ml"},

    # ==================== SNACKS (25 items) ====================
    {"id": "popcorn-1", "name": "Popcorn, air-popped", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 387, "protein": 13, "carbs": 78, "fat": 4.5, "fiber": 15, "serving_size": "100g"},
    {"id": "popcorn-butter-1", "name": "Popcorn, buttered", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 535, "protein": 9, "carbs": 58, "fat": 31, "fiber": 10, "serving_size": "100g"},
    {"id": "chips-potato-1", "name": "Potato chips, regular", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 536, "protein": 7, "carbs": 53, "fat": 35, "fiber": 4.4, "serving_size": "100g"},
    {"id": "chips-baked-1", "name": "Potato chips, baked", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 457, "protein": 6, "carbs": 65, "fat": 20, "fiber": 4, "serving_size": "100g"},
    {"id": "chips-tortilla-1", "name": "Tortilla chips", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 489, "protein": 7, "carbs": 63, "fat": 24, "fiber": 5, "serving_size": "100g"},
    {"id": "chocolate-dark-1", "name": "Dark chocolate (70%)", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 598, "protein": 7.8, "carbs": 46, "fat": 43, "fiber": 11, "serving_size": "100g"},
    {"id": "chocolate-milk-1", "name": "Milk chocolate", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 535, "protein": 8, "carbs": 60, "fat": 30, "fiber": 3.4, "serving_size": "100g"},
    {"id": "granola-bar-1", "name": "Granola bar", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 471, "protein": 10, "carbs": 64, "fat": 20, "fiber": 4, "serving_size": "100g"},
    {"id": "pretzels-1", "name": "Pretzels", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 381, "protein": 10, "carbs": 79, "fat": 3.5, "fiber": 2.8, "serving_size": "100g"},
    {"id": "crackers-whole-wheat-1", "name": "Crackers, whole wheat", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 421, "protein": 9, "carbs": 67, "fat": 14, "fiber": 6, "serving_size": "100g"},
    {"id": "crackers-saltine-1", "name": "Crackers, saltine", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 421, "protein": 9, "carbs": 74, "fat": 9, "fiber": 2.5, "serving_size": "100g"},
    {"id": "trail-mix-1", "name": "Trail mix", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 462, "protein": 13, "carbs": 45, "fat": 29, "fiber": 5, "serving_size": "100g"},
    {"id": "hummus-1", "name": "Hummus", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 166, "protein": 8, "carbs": 14, "fat": 10, "fiber": 6, "serving_size": "100g"},
    {"id": "guacamole-1", "name": "Guacamole", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 157, "protein": 2, "carbs": 9, "fat": 15, "fiber": 6, "serving_size": "100g"},
    {"id": "salsa-1", "name": "Salsa", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 36, "protein": 2, "carbs": 7, "fat": 0.2, "fiber": 2, "serving_size": "100g"},
    {"id": "rice-cakes-1", "name": "Rice cakes", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 387, "protein": 8, "carbs": 81, "fat": 2.8, "fiber": 4.2, "serving_size": "100g"},
    {"id": "candy-bar-1", "name": "Candy bar, chocolate", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 535, "protein": 7, "carbs": 60, "fat": 30, "fiber": 2, "serving_size": "100g"},
    {"id": "gummy-bears-1", "name": "Gummy bears", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 343, "protein": 7, "carbs": 77, "fat": 0, "fiber": 0, "serving_size": "100g"},
    {"id": "ice-cream-1", "name": "Ice cream, vanilla", "brand": None, "category": "Snacks", "safety": "AVOID", "calories": 207, "protein": 3.5, "carbs": 24, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "frozen-yogurt-1", "name": "Frozen yogurt", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 159, "protein": 4, "carbs": 35, "fat": 0.6, "fiber": 0, "serving_size": "100g"},
    {"id": "protein-bar-1", "name": "Protein bar", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 373, "protein": 30, "carbs": 35, "fat": 12, "fiber": 5, "serving_size": "100g"},
    {"id": "jerky-beef-1", "name": "Beef jerky", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 410, "protein": 33, "carbs": 11, "fat": 25, "fiber": 0.5, "serving_size": "100g"},
    {"id": "dried-fruit-1", "name": "Dried fruit mix", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 359, "protein": 3, "carbs": 94, "fat": 0.5, "fiber": 6.5, "serving_size": "100g"},
    {"id": "seaweed-snacks-1", "name": "Seaweed snacks", "brand": None, "category": "Snacks", "safety": "SAFE", "calories": 280, "protein": 6, "carbs": 28, "fat": 17, "fiber": 3, "serving_size": "100g"},
    {"id": "veggie-chips-1", "name": "Vegetable chips", "brand": None, "category": "Snacks", "safety": "LIMIT", "calories": 500, "protein": 3, "carbs": 55, "fat": 30, "fiber": 3.5, "serving_size": "100g"},

    # ==================== CONDIMENTS & OILS (20 items) ====================
    {"id": "olive-oil-1", "name": "Olive oil, extra virgin", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "serving_size": "100ml"},
    {"id": "coconut-oil-1", "name": "Coconut oil", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 862, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "serving_size": "100ml"},
    {"id": "avocado-oil-1", "name": "Avocado oil", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "serving_size": "100ml"},
    {"id": "canola-oil-1", "name": "Canola oil", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "serving_size": "100ml"},
    {"id": "vegetable-oil-1", "name": "Vegetable oil", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "serving_size": "100ml"},
    {"id": "honey-1", "name": "Honey", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 304, "protein": 0.3, "carbs": 82, "fat": 0, "fiber": 0.2, "serving_size": "100g"},
    {"id": "maple-syrup-1", "name": "Maple syrup", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 260, "protein": 0, "carbs": 67, "fat": 0.1, "fiber": 0, "serving_size": "100ml"},
    {"id": "ketchup-1", "name": "Ketchup", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 112, "protein": 1.7, "carbs": 26, "fat": 0.3, "fiber": 0.3, "serving_size": "100g"},
    {"id": "mustard-1", "name": "Mustard, yellow", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 66, "protein": 4.4, "carbs": 5, "fat": 4, "fiber": 3.3, "serving_size": "100g"},
    {"id": "mayonnaise-1", "name": "Mayonnaise", "brand": None, "category": "Condiments & Oils", "safety": "AVOID", "calories": 680, "protein": 1, "carbs": 1, "fat": 75, "fiber": 0, "serving_size": "100g"},
    {"id": "mayo-light-1", "name": "Mayonnaise, light", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 325, "protein": 1, "carbs": 5, "fat": 33, "fiber": 0, "serving_size": "100g"},
    {"id": "soy-sauce-1", "name": "Soy sauce", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 53, "protein": 5, "carbs": 5, "fat": 0, "fiber": 0.4, "serving_size": "100ml"},
    {"id": "vinegar-1", "name": "Vinegar, balsamic", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 88, "protein": 0.5, "carbs": 17, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "hot-sauce-1", "name": "Hot sauce", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 11, "protein": 1, "carbs": 1, "fat": 0.4, "fiber": 0.8, "serving_size": "100ml"},
    {"id": "bbq-sauce-1", "name": "BBQ sauce", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 172, "protein": 0.8, "carbs": 41, "fat": 0.6, "fiber": 0.9, "serving_size": "100g"},
    {"id": "ranch-dressing-1", "name": "Ranch dressing", "brand": None, "category": "Condiments & Oils", "safety": "AVOID", "calories": 460, "protein": 1.5, "carbs": 5, "fat": 48, "fiber": 0.3, "serving_size": "100g"},
    {"id": "italian-dressing-1", "name": "Italian dressing, light", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 60, "protein": 0.3, "carbs": 6, "fat": 4, "fiber": 0.1, "serving_size": "100ml"},
    {"id": "sriracha-1", "name": "Sriracha sauce", "brand": None, "category": "Condiments & Oils", "safety": "SAFE", "calories": 93, "protein": 2, "carbs": 19, "fat": 1, "fiber": 2, "serving_size": "100g"},
    {"id": "pesto-1", "name": "Pesto sauce", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 465, "protein": 6, "carbs": 6, "fat": 46, "fiber": 1, "serving_size": "100g"},
    {"id": "teriyaki-sauce-1", "name": "Teriyaki sauce", "brand": None, "category": "Condiments & Oils", "safety": "LIMIT", "calories": 89, "protein": 6, "carbs": 16, "fat": 0, "fiber": 0.1, "serving_size": "100ml"},
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
    """Search for food items - instant local database search"""
    return search_local_foods(query, page, page_size)


@api_router.get("/foods/all", response_model=FoodSearchResponse)
async def get_all_foods(
    page: int = Query(1, ge=1, le=100),
    page_size: int = Query(300, ge=1, le=300)
):
    """Get all foods from local database"""
    return search_local_foods("", page, page_size)


@api_router.get("/foods/{food_id}", response_model=FoodItem)
async def get_food_by_id(food_id: str):
    """Get food item by ID"""
    for food in LOCAL_FOODS:
        if food["id"] == food_id:
            return FoodItem(**food)
    raise HTTPException(status_code=404, detail="Food item not found")


@api_router.get("/categories")
async def get_categories():
    """Get all food categories"""
    categories = list(set(food["category"] for food in LOCAL_FOODS if food.get("category")))
    return {"categories": sorted(categories)}


@api_router.get("/safety-levels")
async def get_safety_levels():
    """Get all safety levels"""
    return {"safety_levels": ["SAFE", "LIMIT", "AVOID"]}


@api_router.get("/stats")
async def get_stats():
    """Get database statistics"""
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


# Include the router
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
