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
import httpx

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

# USDA FoodData Central API (free, requires API key - using demo key)
# Users can get their own key at: https://fdc.nal.usda.gov/api-key-signup.html
USDA_API_KEY = os.environ.get('USDA_API_KEY', 'DEMO_KEY')
USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1"

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

class SearchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    results_count: int


def extract_nutrient(nutrients: list, nutrient_name: str) -> Optional[float]:
    """Extract a specific nutrient value from USDA nutrient list"""
    nutrient_map = {
        "Energy": ["Energy"],
        "Protein": ["Protein"],
        "Carbohydrate": ["Carbohydrate, by difference", "Carbohydrates"],
        "Fat": ["Total lipid (fat)", "Fat"],
        "Fiber": ["Fiber, total dietary"]
    }
    
    names_to_check = nutrient_map.get(nutrient_name, [nutrient_name])
    
    for nutrient in nutrients:
        nutrient_actual_name = nutrient.get("nutrientName", "")
        for name in names_to_check:
            if name.lower() in nutrient_actual_name.lower():
                return nutrient.get("value")
    return None


def parse_usda_food(food: dict) -> FoodItem:
    """Parse USDA FoodData Central food item into our FoodItem model"""
    nutrients = food.get("foodNutrients", [])
    
    # Get brand/owner info
    brand = food.get("brandOwner") or food.get("brandName")
    
    # Get serving size
    serving_size = food.get("servingSize")
    serving_unit = food.get("servingSizeUnit", "g")
    serving_str = f"{serving_size}{serving_unit}" if serving_size else "100g"
    
    # Get category
    category = food.get("foodCategory") or food.get("brandedFoodCategory")
    
    return FoodItem(
        id=str(food.get("fdcId", uuid.uuid4())),
        name=food.get("description", "Unknown Food"),
        brand=brand,
        image_url=None,  # USDA API doesn't provide images
        calories=extract_nutrient(nutrients, "Energy"),
        protein=extract_nutrient(nutrients, "Protein"),
        carbs=extract_nutrient(nutrients, "Carbohydrate"),
        fat=extract_nutrient(nutrients, "Fat"),
        fiber=extract_nutrient(nutrients, "Fiber"),
        serving_size=serving_str,
        category=category
    )


@api_router.get("/")
async def root():
    return {"message": "NutriSearch Food API - Powered by USDA FoodData Central"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/foods/search", response_model=FoodSearchResponse)
async def search_foods(
    query: str = Query(..., min_length=1, max_length=200, description="Search query for food items"),
    page: int = Query(1, ge=1, le=100, description="Page number"),
    page_size: int = Query(20, ge=1, le=50, description="Number of results per page")
):
    """
    Search for food items using USDA FoodData Central API.
    Returns nutritional information for matching foods.
    """
    if not query or not query.strip():
        return FoodSearchResponse(foods=[], total=0, page=page, page_size=page_size)
    
    query = query.strip()
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as http_client:
            # Search USDA FoodData Central API
            search_url = f"{USDA_API_BASE}/foods/search"
            
            payload = {
                "query": query,
                "pageSize": page_size,
                "pageNumber": page,
                "dataType": ["Foundation", "SR Legacy", "Branded"],
                "sortBy": "dataType.keyword",
                "sortOrder": "asc"
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Api-Key": USDA_API_KEY
            }
            
            response = await http_client.post(search_url, json=payload, headers=headers)
            
            if response.status_code == 429:
                logger.warning("USDA API rate limited")
                return FoodSearchResponse(foods=[], total=0, page=page, page_size=page_size)
            
            response.raise_for_status()
            data = response.json()
            
            foods_data = data.get("foods", [])
            total = data.get("totalHits", 0)
            
            # Parse foods into FoodItem models
            foods = []
            for food in foods_data:
                try:
                    food_item = parse_usda_food(food)
                    if food_item.name and food_item.name != "Unknown Food":
                        foods.append(food_item)
                except Exception as e:
                    logger.warning(f"Failed to parse food: {e}")
                    continue
            
            # Save search to history (non-blocking)
            try:
                history_entry = {
                    "id": str(uuid.uuid4()),
                    "query": query,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "results_count": len(foods)
                }
                await db.search_history.insert_one(history_entry)
            except Exception as e:
                logger.warning(f"Failed to save search history: {e}")
            
            return FoodSearchResponse(
                foods=foods,
                total=total,
                page=page,
                page_size=page_size
            )
            
    except httpx.TimeoutException:
        logger.error(f"Timeout searching for: {query}")
        return FoodSearchResponse(foods=[], total=0, page=page, page_size=page_size)
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error searching for {query}: {e}")
        return FoodSearchResponse(foods=[], total=0, page=page, page_size=page_size)
    except Exception as e:
        logger.error(f"Unexpected error searching for {query}: {e}")
        return FoodSearchResponse(foods=[], total=0, page=page, page_size=page_size)

@api_router.get("/foods/{food_id}", response_model=FoodItem)
async def get_food_by_id(food_id: str):
    """Get detailed information about a specific food item by ID"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            url = f"{USDA_API_BASE}/food/{food_id}"
            headers = {"X-Api-Key": USDA_API_KEY}
            
            response = await http_client.get(url, headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Food item not found")
            
            response.raise_for_status()
            food = response.json()
            
            return parse_usda_food(food)
            
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out. Please try again.")
    except Exception as e:
        logger.error(f"Error fetching food {food_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch food details")

@api_router.get("/search-history", response_model=List[SearchHistory])
async def get_search_history(limit: int = Query(10, ge=1, le=50)):
    """Get recent search history"""
    try:
        history = await db.search_history.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        for entry in history:
            if isinstance(entry.get('timestamp'), str):
                entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
        
        return history
    except Exception as e:
        logger.error(f"Error fetching search history: {e}")
        return []

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
