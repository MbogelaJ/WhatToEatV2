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

# Local Food Database - Reliable, instant results without API rate limits
LOCAL_FOODS = [
    # Fruits
    {"id": "apple-1", "name": "Apple, raw, with skin", "brand": None, "category": "Fruits", "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2, "fiber": 2.4, "serving_size": "100g"},
    {"id": "banana-1", "name": "Banana, raw", "brand": None, "category": "Fruits", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "fiber": 2.6, "serving_size": "100g"},
    {"id": "orange-1", "name": "Orange, raw", "brand": None, "category": "Fruits", "calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1, "fiber": 2.4, "serving_size": "100g"},
    {"id": "strawberry-1", "name": "Strawberries, raw", "brand": None, "category": "Fruits", "calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "fiber": 2, "serving_size": "100g"},
    {"id": "grapes-1", "name": "Grapes, red or green", "brand": None, "category": "Fruits", "calories": 69, "protein": 0.7, "carbs": 18, "fat": 0.2, "fiber": 0.9, "serving_size": "100g"},
    {"id": "mango-1", "name": "Mango, raw", "brand": None, "category": "Fruits", "calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4, "fiber": 1.6, "serving_size": "100g"},
    {"id": "pineapple-1", "name": "Pineapple, raw", "brand": None, "category": "Fruits", "calories": 50, "protein": 0.5, "carbs": 13, "fat": 0.1, "fiber": 1.4, "serving_size": "100g"},
    {"id": "watermelon-1", "name": "Watermelon, raw", "brand": None, "category": "Fruits", "calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "fiber": 0.4, "serving_size": "100g"},
    {"id": "blueberry-1", "name": "Blueberries, raw", "brand": None, "category": "Fruits", "calories": 57, "protein": 0.7, "carbs": 14, "fat": 0.3, "fiber": 2.4, "serving_size": "100g"},
    {"id": "avocado-1", "name": "Avocado, raw", "brand": None, "category": "Fruits", "calories": 160, "protein": 2, "carbs": 9, "fat": 15, "fiber": 7, "serving_size": "100g"},
    {"id": "peach-1", "name": "Peach, raw", "brand": None, "category": "Fruits", "calories": 39, "protein": 0.9, "carbs": 10, "fat": 0.3, "fiber": 1.5, "serving_size": "100g"},
    {"id": "pear-1", "name": "Pear, raw", "brand": None, "category": "Fruits", "calories": 57, "protein": 0.4, "carbs": 15, "fat": 0.1, "fiber": 3.1, "serving_size": "100g"},
    {"id": "cherry-1", "name": "Cherries, sweet, raw", "brand": None, "category": "Fruits", "calories": 63, "protein": 1.1, "carbs": 16, "fat": 0.2, "fiber": 2.1, "serving_size": "100g"},
    {"id": "kiwi-1", "name": "Kiwi fruit, raw", "brand": None, "category": "Fruits", "calories": 61, "protein": 1.1, "carbs": 15, "fat": 0.5, "fiber": 3, "serving_size": "100g"},
    {"id": "grapefruit-1", "name": "Grapefruit, raw", "brand": None, "category": "Fruits", "calories": 42, "protein": 0.8, "carbs": 11, "fat": 0.1, "fiber": 1.6, "serving_size": "100g"},
    
    # Vegetables
    {"id": "broccoli-1", "name": "Broccoli, raw", "brand": None, "category": "Vegetables", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "fiber": 2.6, "serving_size": "100g"},
    {"id": "carrot-1", "name": "Carrots, raw", "brand": None, "category": "Vegetables", "calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2, "fiber": 2.8, "serving_size": "100g"},
    {"id": "spinach-1", "name": "Spinach, raw", "brand": None, "category": "Vegetables", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "fiber": 2.2, "serving_size": "100g"},
    {"id": "tomato-1", "name": "Tomatoes, raw", "brand": None, "category": "Vegetables", "calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2, "serving_size": "100g"},
    {"id": "cucumber-1", "name": "Cucumber, raw", "brand": None, "category": "Vegetables", "calories": 15, "protein": 0.7, "carbs": 3.6, "fat": 0.1, "fiber": 0.5, "serving_size": "100g"},
    {"id": "lettuce-1", "name": "Lettuce, romaine", "brand": None, "category": "Vegetables", "calories": 17, "protein": 1.2, "carbs": 3.3, "fat": 0.3, "fiber": 2.1, "serving_size": "100g"},
    {"id": "potato-1", "name": "Potato, raw", "brand": None, "category": "Vegetables", "calories": 77, "protein": 2, "carbs": 17, "fat": 0.1, "fiber": 2.2, "serving_size": "100g"},
    {"id": "sweetpotato-1", "name": "Sweet potato, raw", "brand": None, "category": "Vegetables", "calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1, "fiber": 3, "serving_size": "100g"},
    {"id": "onion-1", "name": "Onion, raw", "brand": None, "category": "Vegetables", "calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1, "fiber": 1.7, "serving_size": "100g"},
    {"id": "bellpepper-1", "name": "Bell pepper, raw", "brand": None, "category": "Vegetables", "calories": 31, "protein": 1, "carbs": 6, "fat": 0.3, "fiber": 2.1, "serving_size": "100g"},
    {"id": "celery-1", "name": "Celery, raw", "brand": None, "category": "Vegetables", "calories": 16, "protein": 0.7, "carbs": 3, "fat": 0.2, "fiber": 1.6, "serving_size": "100g"},
    {"id": "cauliflower-1", "name": "Cauliflower, raw", "brand": None, "category": "Vegetables", "calories": 25, "protein": 1.9, "carbs": 5, "fat": 0.3, "fiber": 2, "serving_size": "100g"},
    {"id": "mushroom-1", "name": "Mushrooms, white, raw", "brand": None, "category": "Vegetables", "calories": 22, "protein": 3.1, "carbs": 3.3, "fat": 0.3, "fiber": 1, "serving_size": "100g"},
    {"id": "zucchini-1", "name": "Zucchini, raw", "brand": None, "category": "Vegetables", "calories": 17, "protein": 1.2, "carbs": 3.1, "fat": 0.3, "fiber": 1, "serving_size": "100g"},
    {"id": "corn-1", "name": "Corn, sweet, raw", "brand": None, "category": "Vegetables", "calories": 86, "protein": 3.3, "carbs": 19, "fat": 1.4, "fiber": 2.7, "serving_size": "100g"},
    
    # Proteins
    {"id": "chicken-breast-1", "name": "Chicken breast, cooked", "brand": None, "category": "Proteins", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0, "serving_size": "100g"},
    {"id": "salmon-1", "name": "Salmon, cooked", "brand": None, "category": "Proteins", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "fiber": 0, "serving_size": "100g"},
    {"id": "beef-1", "name": "Beef, ground, cooked", "brand": None, "category": "Proteins", "calories": 250, "protein": 26, "carbs": 0, "fat": 15, "fiber": 0, "serving_size": "100g"},
    {"id": "egg-1", "name": "Egg, whole, cooked", "brand": None, "category": "Proteins", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "fiber": 0, "serving_size": "100g"},
    {"id": "tuna-1", "name": "Tuna, canned in water", "brand": None, "category": "Proteins", "calories": 116, "protein": 26, "carbs": 0, "fat": 0.8, "fiber": 0, "serving_size": "100g"},
    {"id": "shrimp-1", "name": "Shrimp, cooked", "brand": None, "category": "Proteins", "calories": 99, "protein": 24, "carbs": 0.2, "fat": 0.3, "fiber": 0, "serving_size": "100g"},
    {"id": "turkey-1", "name": "Turkey breast, cooked", "brand": None, "category": "Proteins", "calories": 135, "protein": 30, "carbs": 0, "fat": 0.7, "fiber": 0, "serving_size": "100g"},
    {"id": "pork-1", "name": "Pork loin, cooked", "brand": None, "category": "Proteins", "calories": 143, "protein": 26, "carbs": 0, "fat": 3.5, "fiber": 0, "serving_size": "100g"},
    {"id": "tofu-1", "name": "Tofu, firm", "brand": None, "category": "Proteins", "calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8, "fiber": 0.3, "serving_size": "100g"},
    {"id": "lentils-1", "name": "Lentils, cooked", "brand": None, "category": "Proteins", "calories": 116, "protein": 9, "carbs": 20, "fat": 0.4, "fiber": 8, "serving_size": "100g"},
    {"id": "chickpeas-1", "name": "Chickpeas, cooked", "brand": None, "category": "Proteins", "calories": 164, "protein": 9, "carbs": 27, "fat": 2.6, "fiber": 8, "serving_size": "100g"},
    {"id": "black-beans-1", "name": "Black beans, cooked", "brand": None, "category": "Proteins", "calories": 132, "protein": 9, "carbs": 24, "fat": 0.5, "fiber": 8.7, "serving_size": "100g"},
    {"id": "cod-1", "name": "Cod, cooked", "brand": None, "category": "Proteins", "calories": 105, "protein": 23, "carbs": 0, "fat": 0.9, "fiber": 0, "serving_size": "100g"},
    {"id": "lamb-1", "name": "Lamb, cooked", "brand": None, "category": "Proteins", "calories": 294, "protein": 25, "carbs": 0, "fat": 21, "fiber": 0, "serving_size": "100g"},
    
    # Grains
    {"id": "rice-white-1", "name": "Rice, white, cooked", "brand": None, "category": "Grains", "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "fiber": 0.4, "serving_size": "100g"},
    {"id": "rice-brown-1", "name": "Rice, brown, cooked", "brand": None, "category": "Grains", "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9, "fiber": 1.8, "serving_size": "100g"},
    {"id": "bread-white-1", "name": "Bread, white", "brand": None, "category": "Grains", "calories": 265, "protein": 9, "carbs": 49, "fat": 3.2, "fiber": 2.7, "serving_size": "100g"},
    {"id": "bread-wheat-1", "name": "Bread, whole wheat", "brand": None, "category": "Grains", "calories": 247, "protein": 13, "carbs": 41, "fat": 3.4, "fiber": 7, "serving_size": "100g"},
    {"id": "pasta-1", "name": "Pasta, cooked", "brand": None, "category": "Grains", "calories": 131, "protein": 5, "carbs": 25, "fat": 1.1, "fiber": 1.8, "serving_size": "100g"},
    {"id": "oatmeal-1", "name": "Oatmeal, cooked", "brand": None, "category": "Grains", "calories": 68, "protein": 2.4, "carbs": 12, "fat": 1.4, "fiber": 1.7, "serving_size": "100g"},
    {"id": "quinoa-1", "name": "Quinoa, cooked", "brand": None, "category": "Grains", "calories": 120, "protein": 4.4, "carbs": 21, "fat": 1.9, "fiber": 2.8, "serving_size": "100g"},
    {"id": "cereal-1", "name": "Cereal, corn flakes", "brand": None, "category": "Grains", "calories": 357, "protein": 7, "carbs": 84, "fat": 0.4, "fiber": 3.3, "serving_size": "100g"},
    {"id": "tortilla-1", "name": "Tortilla, flour", "brand": None, "category": "Grains", "calories": 312, "protein": 8, "carbs": 52, "fat": 8, "fiber": 2.1, "serving_size": "100g"},
    {"id": "bagel-1", "name": "Bagel, plain", "brand": None, "category": "Grains", "calories": 257, "protein": 10, "carbs": 50, "fat": 1.5, "fiber": 2.1, "serving_size": "100g"},
    
    # Dairy
    {"id": "milk-whole-1", "name": "Milk, whole", "brand": None, "category": "Dairy", "calories": 61, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0, "serving_size": "100ml"},
    {"id": "milk-skim-1", "name": "Milk, skim", "brand": None, "category": "Dairy", "calories": 34, "protein": 3.4, "carbs": 5, "fat": 0.1, "fiber": 0, "serving_size": "100ml"},
    {"id": "cheese-cheddar-1", "name": "Cheese, cheddar", "brand": None, "category": "Dairy", "calories": 403, "protein": 25, "carbs": 1.3, "fat": 33, "fiber": 0, "serving_size": "100g"},
    {"id": "yogurt-1", "name": "Yogurt, plain", "brand": None, "category": "Dairy", "calories": 61, "protein": 3.5, "carbs": 4.7, "fat": 3.3, "fiber": 0, "serving_size": "100g"},
    {"id": "yogurt-greek-1", "name": "Greek yogurt, plain", "brand": None, "category": "Dairy", "calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.7, "fiber": 0, "serving_size": "100g"},
    {"id": "butter-1", "name": "Butter, salted", "brand": None, "category": "Dairy", "calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81, "fiber": 0, "serving_size": "100g"},
    {"id": "cottage-cheese-1", "name": "Cottage cheese", "brand": None, "category": "Dairy", "calories": 98, "protein": 11, "carbs": 3.4, "fat": 4.3, "fiber": 0, "serving_size": "100g"},
    {"id": "cream-cheese-1", "name": "Cream cheese", "brand": None, "category": "Dairy", "calories": 342, "protein": 6, "carbs": 4, "fat": 34, "fiber": 0, "serving_size": "100g"},
    {"id": "mozzarella-1", "name": "Mozzarella cheese", "brand": None, "category": "Dairy", "calories": 280, "protein": 28, "carbs": 2.2, "fat": 17, "fiber": 0, "serving_size": "100g"},
    
    # Nuts & Seeds
    {"id": "almonds-1", "name": "Almonds, raw", "brand": None, "category": "Nuts & Seeds", "calories": 579, "protein": 21, "carbs": 22, "fat": 50, "fiber": 12, "serving_size": "100g"},
    {"id": "peanuts-1", "name": "Peanuts, raw", "brand": None, "category": "Nuts & Seeds", "calories": 567, "protein": 26, "carbs": 16, "fat": 49, "fiber": 8.5, "serving_size": "100g"},
    {"id": "walnuts-1", "name": "Walnuts, raw", "brand": None, "category": "Nuts & Seeds", "calories": 654, "protein": 15, "carbs": 14, "fat": 65, "fiber": 6.7, "serving_size": "100g"},
    {"id": "chia-seeds-1", "name": "Chia seeds", "brand": None, "category": "Nuts & Seeds", "calories": 486, "protein": 17, "carbs": 42, "fat": 31, "fiber": 34, "serving_size": "100g"},
    {"id": "sunflower-seeds-1", "name": "Sunflower seeds", "brand": None, "category": "Nuts & Seeds", "calories": 584, "protein": 21, "carbs": 20, "fat": 51, "fiber": 8.6, "serving_size": "100g"},
    {"id": "cashews-1", "name": "Cashews, raw", "brand": None, "category": "Nuts & Seeds", "calories": 553, "protein": 18, "carbs": 30, "fat": 44, "fiber": 3.3, "serving_size": "100g"},
    {"id": "pistachios-1", "name": "Pistachios, raw", "brand": None, "category": "Nuts & Seeds", "calories": 560, "protein": 20, "carbs": 28, "fat": 45, "fiber": 10, "serving_size": "100g"},
    {"id": "peanut-butter-1", "name": "Peanut butter", "brand": None, "category": "Nuts & Seeds", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "fiber": 6, "serving_size": "100g"},
    
    # Beverages
    {"id": "coffee-1", "name": "Coffee, brewed", "brand": None, "category": "Beverages", "calories": 2, "protein": 0.3, "carbs": 0, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "tea-1", "name": "Tea, brewed", "brand": None, "category": "Beverages", "calories": 1, "protein": 0, "carbs": 0.3, "fat": 0, "fiber": 0, "serving_size": "100ml"},
    {"id": "orange-juice-1", "name": "Orange juice", "brand": None, "category": "Beverages", "calories": 45, "protein": 0.7, "carbs": 10, "fat": 0.2, "fiber": 0.2, "serving_size": "100ml"},
    {"id": "apple-juice-1", "name": "Apple juice", "brand": None, "category": "Beverages", "calories": 46, "protein": 0.1, "carbs": 11, "fat": 0.1, "fiber": 0.1, "serving_size": "100ml"},
    {"id": "almond-milk-1", "name": "Almond milk, unsweetened", "brand": None, "category": "Beverages", "calories": 15, "protein": 0.6, "carbs": 0.3, "fat": 1.2, "fiber": 0, "serving_size": "100ml"},
    {"id": "coconut-water-1", "name": "Coconut water", "brand": None, "category": "Beverages", "calories": 19, "protein": 0.7, "carbs": 3.7, "fat": 0.2, "fiber": 1.1, "serving_size": "100ml"},
    
    # Snacks
    {"id": "popcorn-1", "name": "Popcorn, air-popped", "brand": None, "category": "Snacks", "calories": 387, "protein": 13, "carbs": 78, "fat": 4.5, "fiber": 15, "serving_size": "100g"},
    {"id": "chips-potato-1", "name": "Potato chips", "brand": None, "category": "Snacks", "calories": 536, "protein": 7, "carbs": 53, "fat": 35, "fiber": 4.4, "serving_size": "100g"},
    {"id": "chocolate-dark-1", "name": "Dark chocolate (70%)", "brand": None, "category": "Snacks", "calories": 598, "protein": 7.8, "carbs": 46, "fat": 43, "fiber": 11, "serving_size": "100g"},
    {"id": "granola-bar-1", "name": "Granola bar", "brand": None, "category": "Snacks", "calories": 471, "protein": 10, "carbs": 64, "fat": 20, "fiber": 4, "serving_size": "100g"},
    {"id": "pretzels-1", "name": "Pretzels", "brand": None, "category": "Snacks", "calories": 381, "protein": 10, "carbs": 79, "fat": 3.5, "fiber": 2.8, "serving_size": "100g"},
    {"id": "crackers-1", "name": "Crackers, saltine", "brand": None, "category": "Snacks", "calories": 421, "protein": 9, "carbs": 74, "fat": 9, "fiber": 2.5, "serving_size": "100g"},
    {"id": "trail-mix-1", "name": "Trail mix", "brand": None, "category": "Snacks", "calories": 462, "protein": 13, "carbs": 45, "fat": 29, "fiber": 5, "serving_size": "100g"},
    {"id": "hummus-1", "name": "Hummus", "brand": None, "category": "Snacks", "calories": 166, "protein": 8, "carbs": 14, "fat": 10, "fiber": 6, "serving_size": "100g"},
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

class FoodSearchResponse(BaseModel):
    foods: List[FoodItem]
    total: int
    page: int
    page_size: int
    source: str = "local"

class SearchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    results_count: int


def search_local_foods(query: str, page: int = 1, page_size: int = 100) -> FoodSearchResponse:
    """Search the local food database - instant filtering"""
    query_lower = query.lower().strip() if query else ""
    
    if not query_lower:
        # Return all foods if no query
        foods = [FoodItem(**food) for food in LOCAL_FOODS]
    else:
        # Filter foods by query - matches name or category
        foods = []
        for food in LOCAL_FOODS:
            name = (food.get("name") or "").lower()
            category = (food.get("category") or "").lower()
            if query_lower in name or query_lower in category:
                foods.append(FoodItem(**food))
    
    # Pagination
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
    query: str = Query("", max_length=200, description="Search query for food items"),
    page: int = Query(1, ge=1, le=100, description="Page number"),
    page_size: int = Query(100, ge=1, le=100, description="Number of results per page")
):
    """Search for food items - instant local database search"""
    return search_local_foods(query, page, page_size)


@api_router.get("/foods/all", response_model=FoodSearchResponse)
async def get_all_foods(
    page: int = Query(1, ge=1, le=100, description="Page number"),
    page_size: int = Query(100, ge=1, le=100, description="Number of results per page")
):
    """Get all foods from local database"""
    return search_local_foods("", page, page_size)


@api_router.get("/foods/{food_id}", response_model=FoodItem)
async def get_food_by_id(food_id: str):
    """Get detailed information about a specific food item by ID"""
    for food in LOCAL_FOODS:
        if food["id"] == food_id:
            return FoodItem(**food)
    raise HTTPException(status_code=404, detail="Food item not found")


@api_router.get("/categories")
async def get_categories():
    """Get all available food categories"""
    categories = list(set(food["category"] for food in LOCAL_FOODS if food.get("category")))
    return {"categories": sorted(categories)}


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
