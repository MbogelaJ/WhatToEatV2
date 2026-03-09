"""
Health-based food filtering and personalization
Provides recommendations based on user health conditions
"""

# Health condition to food tag mapping
HEALTH_CONDITION_TAGS = {
    "anemia": {
        "recommended_tags": ["iron-rich", "vitamin-c"],
        "highlight_nutrients": ["Iron", "Vitamin C", "Folate", "B12"],
        "description": "Foods high in iron and vitamin C to support iron absorption"
    },
    "gestational-diabetes": {
        "recommended_tags": ["low-sugar", "low-glycemic", "high-fiber"],
        "highlight_nutrients": ["Fiber", "Protein"],
        "avoid_tags": ["high-sugar"],
        "description": "Low glycemic foods to help manage blood sugar levels"
    },
    "high-blood-pressure": {
        "recommended_tags": ["low-sodium", "potassium-rich"],
        "highlight_nutrients": ["Potassium", "Magnesium", "Calcium"],
        "avoid_tags": ["high-sodium"],
        "description": "Low sodium foods with potassium to support healthy blood pressure"
    },
    "lactose-intolerance": {
        "avoid_categories": ["Dairy"],
        "recommended_tags": ["dairy-free", "calcium-alt"],
        "highlight_nutrients": ["Calcium"],
        "description": "Non-dairy calcium sources and lactose-free alternatives"
    },
    "vegetarian": {
        "avoid_categories": ["Fish & Seafood", "Meat & Protein"],
        "recommended_tags": ["plant-protein", "iron-rich"],
        "highlight_nutrients": ["Protein", "Iron", "B12"],
        "description": "Plant-based protein and iron sources"
    },
    "vegan": {
        "avoid_categories": ["Fish & Seafood", "Meat & Protein", "Dairy"],
        "recommended_tags": ["plant-protein", "vegan"],
        "highlight_nutrients": ["Protein", "Iron", "B12", "Calcium"],
        "description": "Complete plant-based nutrition sources"
    },
    "gluten-free": {
        "avoid_tags": ["contains-gluten"],
        "description": "Naturally gluten-free food options"
    },
    "nut-allergy": {
        "avoid_tags": ["contains-nuts"],
        "description": "Nut-free food options"
    },
    "shellfish-allergy": {
        "avoid_tags": ["shellfish"],
        "description": "Shellfish-free seafood and protein options"
    }
}

# Food health tags database - CORRECTLY mapped to FOOD_DATABASE IDs in server.py
# Each entry: food_id -> {tags, iron_level, sugar_level, sodium_level}
FOOD_HEALTH_TAGS = {
    # ===== Fish & Seafood (IDs 1-12) =====
    "1": {"tags": ["omega-3", "lean-protein", "low-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Salmon
    "2": {"tags": ["raw", "omega-3"], "iron_level": "low", "sugar_level": "none", "sodium_level": "medium"},  # Sushi (Raw Fish) - AVOID
    "3": {"tags": ["high-mercury"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # High Mercury Fish - AVOID
    "4": {"tags": ["lean-protein", "low-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Shrimp
    "5": {"tags": ["omega-3", "lean-protein"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "medium"},  # Canned Tuna
    "6": {"tags": ["iron-rich", "omega-3", "calcium-alt"], "iron_level": "high", "sugar_level": "none", "sodium_level": "medium"},  # Sardines
    "7": {"tags": ["lean-protein", "low-sodium"], "iron_level": "low", "sugar_level": "none", "sodium_level": "low"},  # Cod
    "8": {"tags": ["shellfish", "raw", "iron-rich"], "iron_level": "high", "sugar_level": "none", "sodium_level": "medium"},  # Raw Oysters - AVOID
    "9": {"tags": ["lean-protein", "low-sodium"], "iron_level": "low", "sugar_level": "none", "sodium_level": "low"},  # Tilapia
    "10": {"tags": ["omega-3", "high-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "high"},  # Smoked Salmon (Cold)
    "11": {"tags": ["shellfish", "lean-protein"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "medium"},  # Crab
    "12": {"tags": ["iron-rich", "omega-3", "high-sodium"], "iron_level": "high", "sugar_level": "none", "sodium_level": "high"},  # Anchovies
    
    # ===== Dairy (IDs 13-22) =====
    "13": {"tags": ["calcium-rich", "unpasteurized"], "iron_level": "none", "sugar_level": "low", "sodium_level": "medium"},  # Soft Cheese (Unpasteurized) - AVOID
    "14": {"tags": ["calcium-rich", "probiotic", "low-sugar", "high-protein"], "iron_level": "none", "sugar_level": "low", "sodium_level": "low"},  # Greek Yogurt
    "15": {"tags": ["calcium-rich", "vitamin-d"], "iron_level": "none", "sugar_level": "medium", "sodium_level": "low"},  # Milk (Pasteurized)
    "16": {"tags": ["unpasteurized"], "iron_level": "none", "sugar_level": "medium", "sodium_level": "low"},  # Raw Milk - AVOID
    "17": {"tags": ["calcium-rich", "high-sodium"], "iron_level": "none", "sugar_level": "low", "sodium_level": "high"},  # Hard Cheese
    "18": {"tags": ["calcium-rich", "low-sugar", "high-protein"], "iron_level": "none", "sugar_level": "low", "sodium_level": "medium"},  # Cottage Cheese
    "19": {"tags": ["calcium-rich", "high-sugar"], "iron_level": "none", "sugar_level": "high", "sodium_level": "low"},  # Ice Cream
    "20": {"tags": ["high-sugar"], "iron_level": "none", "sugar_level": "high", "sodium_level": "low"},  # Soft-Serve Ice Cream
    "21": {"tags": ["calcium-rich", "high-sodium"], "iron_level": "none", "sugar_level": "low", "sodium_level": "high"},  # Feta Cheese (Pasteurized)
    "22": {"tags": ["low-sodium"], "iron_level": "none", "sugar_level": "none", "sodium_level": "low"},  # Butter
    
    # ===== Meat & Protein (IDs 23-34) =====
    "23": {"tags": ["high-protein", "iron-rich", "low-sodium", "low-sugar"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Eggs
    "24": {"tags": ["raw"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Raw Eggs - AVOID
    "25": {"tags": ["high-sodium", "processed"], "iron_level": "medium", "sugar_level": "low", "sodium_level": "high"},  # Deli Meats
    "26": {"tags": ["lean-protein", "low-sodium", "low-sugar"], "iron_level": "low", "sugar_level": "none", "sodium_level": "low"},  # Chicken (Cooked)
    "27": {"tags": ["iron-rich", "high-protein", "low-sodium"], "iron_level": "high", "sugar_level": "none", "sodium_level": "low"},  # Beef (Well-Done)
    "28": {"tags": ["raw", "iron-rich"], "iron_level": "high", "sugar_level": "none", "sodium_level": "low"},  # Rare/Undercooked Meat - AVOID
    "29": {"tags": ["iron-rich", "vitamin-a-high"], "iron_level": "very-high", "sugar_level": "none", "sodium_level": "low"},  # Liver
    "30": {"tags": ["lean-protein", "low-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Pork (Cooked)
    "31": {"tags": ["lean-protein", "low-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Turkey (Cooked)
    "32": {"tags": ["plant-protein", "iron-rich", "calcium-alt", "vegan", "low-sodium", "low-glycemic"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Tofu
    "33": {"tags": ["plant-protein", "iron-rich", "high-fiber", "vegan", "low-glycemic"], "iron_level": "high", "sugar_level": "low", "sodium_level": "low"},  # Legumes
    "34": {"tags": ["high-sodium", "processed"], "iron_level": "medium", "sugar_level": "low", "sodium_level": "high"},  # Pate - AVOID
    
    # ===== Fruits (IDs 35-46) =====
    "35": {"tags": ["vitamin-c", "antioxidant", "low-glycemic", "high-fiber", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Berries
    "36": {"tags": ["potassium-rich", "healthy-fat", "high-fiber", "low-glycemic", "vegan"], "iron_level": "low", "sugar_level": "low", "sodium_level": "none"},  # Avocado
    "37": {"tags": ["potassium-rich", "vegan", "vitamin-b6"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Bananas
    "38": {"tags": ["vitamin-c", "vegan", "folate"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Oranges
    "39": {"tags": ["high-fiber", "low-glycemic", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Apples
    "40": {"tags": ["vitamin-c", "vitamin-a", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Papaya (Ripe)
    "41": {"tags": ["unripe"], "iron_level": "low", "sugar_level": "low", "sodium_level": "none"},  # Papaya (Unripe/Green) - AVOID
    "42": {"tags": ["vitamin-c", "vitamin-a", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Mango
    "43": {"tags": ["potassium-rich", "hydrating", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Watermelon
    "44": {"tags": ["antioxidant", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Grapes
    "45": {"tags": ["vitamin-c", "vegan"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "none"},  # Pineapple
    "46": {"tags": ["iron-rich", "high-fiber", "vegan", "high-sugar"], "iron_level": "medium", "sugar_level": "high", "sodium_level": "none"},  # Dried Fruits
    
    # ===== Vegetables (IDs 47-58) =====
    "47": {"tags": ["iron-rich", "calcium-alt", "folate", "high-fiber", "vegan", "low-glycemic"], "iron_level": "high", "sugar_level": "none", "sodium_level": "low"},  # Leafy Greens (Spinach, Kale)
    "48": {"tags": ["raw"], "iron_level": "low", "sugar_level": "none", "sodium_level": "low"},  # Sprouts (Raw) - AVOID
    "49": {"tags": ["vitamin-c", "iron-rich", "calcium-alt", "high-fiber", "vegan", "low-glycemic"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Broccoli
    "50": {"tags": ["potassium-rich", "high-fiber", "vitamin-a", "vegan", "low-glycemic"], "iron_level": "medium", "sugar_level": "low", "sodium_level": "low"},  # Sweet Potatoes
    "51": {"tags": ["vitamin-a", "vegan", "low-glycemic"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Carrots
    "52": {"tags": ["vitamin-c", "vegan", "low-glycemic"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Bell Peppers
    "53": {"tags": ["potassium-rich", "vitamin-c", "vegan", "low-glycemic"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Tomatoes
    "54": {"tags": ["iron-rich", "folate", "high-fiber", "vegan", "low-glycemic"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "low"},  # Asparagus
    "55": {"tags": ["high-fiber", "vitamin-c", "vegan", "low-glycemic"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Cauliflower
    "56": {"tags": ["high-fiber", "vegan"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Corn
    "57": {"tags": ["vegan", "low-glycemic"], "iron_level": "low", "sugar_level": "none", "sodium_level": "low"},  # Mushrooms
    "58": {"tags": ["vegan", "low-glycemic", "hydrating"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Zucchini
    
    # ===== Beverages (IDs 59-68) =====
    "59": {"tags": ["caffeine"], "iron_level": "none", "sugar_level": "none", "sodium_level": "none"},  # Coffee - LIMIT
    "60": {"tags": ["alcohol", "harmful"], "iron_level": "none", "sugar_level": "medium", "sodium_level": "none"},  # Alcohol - AVOID (NEVER RECOMMEND!)
    "61": {"tags": ["caffeine-free"], "iron_level": "none", "sugar_level": "none", "sodium_level": "none"},  # Herbal Tea - LIMIT
    "62": {"tags": ["caffeine", "antioxidant"], "iron_level": "none", "sugar_level": "none", "sodium_level": "none"},  # Green Tea - LIMIT
    "63": {"tags": ["vitamin-c", "vegan"], "iron_level": "none", "sugar_level": "medium", "sodium_level": "none"},  # Fresh Juice (Pasteurized)
    "64": {"tags": ["unpasteurized"], "iron_level": "none", "sugar_level": "medium", "sodium_level": "none"},  # Fresh Juice (Unpasteurized) - AVOID
    "65": {"tags": ["hydrating", "essential"], "iron_level": "none", "sugar_level": "none", "sodium_level": "none"},  # Water
    "66": {"tags": ["caffeine", "high-sugar", "harmful"], "iron_level": "none", "sugar_level": "very-high", "sodium_level": "low"},  # Energy Drinks - AVOID
    "67": {"tags": ["high-sugar"], "iron_level": "none", "sugar_level": "high", "sodium_level": "low"},  # Soda/Soft Drinks - LIMIT
    "68": {"tags": ["potassium-rich", "hydrating", "vegan"], "iron_level": "none", "sugar_level": "low", "sodium_level": "low"},  # Coconut Water
    
    # ===== Grains & Carbs (IDs 69-75) =====
    "69": {"tags": ["high-fiber", "iron-rich", "vegan", "low-glycemic"], "iron_level": "medium", "sugar_level": "low", "sodium_level": "low"},  # Whole Grains
    "70": {"tags": ["vegan"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # White Rice
    "71": {"tags": ["contains-gluten", "high-fiber"], "iron_level": "medium", "sugar_level": "low", "sodium_level": "medium"},  # Bread
    "72": {"tags": ["contains-gluten"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Pasta
    "73": {"tags": ["high-fiber", "iron-rich", "vegan", "low-glycemic"], "iron_level": "high", "sugar_level": "low", "sodium_level": "low"},  # Oatmeal
    "74": {"tags": ["iron-rich", "folate", "vitamin-fortified"], "iron_level": "high", "sugar_level": "medium", "sodium_level": "low"},  # Cereal (Fortified)
    "75": {"tags": ["high-fiber", "vegan"], "iron_level": "low", "sugar_level": "low", "sodium_level": "low"},  # Popcorn
    
    # ===== Herbs & Spices (IDs 76-81) =====
    "76": {"tags": ["anti-nausea", "vegan"], "iron_level": "low", "sugar_level": "none", "sodium_level": "none"},  # Ginger
    "77": {"tags": ["vegan", "immune-boost"], "iron_level": "low", "sugar_level": "none", "sodium_level": "none"},  # Garlic
    "78": {"tags": ["anti-inflammatory", "vegan"], "iron_level": "low", "sugar_level": "none", "sodium_level": "none"},  # Turmeric
    "79": {"tags": ["high-sodium"], "iron_level": "low", "sugar_level": "low", "sodium_level": "high"},  # Cinnamon (in large amounts)
    "80": {"tags": ["iron-rich", "folate", "vegan", "high-sodium"], "iron_level": "medium", "sugar_level": "none", "sodium_level": "high"},  # Parsley
    "81": {"tags": ["vegan", "high-sodium"], "iron_level": "low", "sugar_level": "none", "sodium_level": "high"},  # Basil
    
    # ===== Street Foods & Prepared (IDs 82-85) =====
    "82": {"tags": ["processed", "high-sodium"], "iron_level": "low", "sugar_level": "low", "sodium_level": "high"},  # Hot Dogs - LIMIT
    "83": {"tags": ["high-sodium"], "iron_level": "low", "sugar_level": "low", "sodium_level": "high"},  # Pre-made Salads - LIMIT
    "84": {"tags": ["high-sodium", "food-safety-risk"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "high"},  # Street Vendor Food - LIMIT
    "85": {"tags": ["food-safety-risk", "high-sodium"], "iron_level": "low", "sugar_level": "medium", "sodium_level": "high"},  # Buffet Foods - LIMIT
}

# Tags that should NEVER result in a recommendation (safety override)
NEVER_RECOMMEND_TAGS = ["alcohol", "harmful", "raw", "unpasteurized", "unripe", "high-mercury"]

# Trimester-specific nutrition priorities
TRIMESTER_PRIORITIES = {
    1: {
        "name": "First Trimester",
        "weeks": "1-12",
        "priority_nutrients": ["Folate", "Iron", "Vitamin B6", "Zinc"],
        "focus_areas": ["folate for neural development", "managing nausea", "establishing healthy eating patterns"],
        "recommended_tags": ["iron-rich", "vitamin-c", "low-glycemic", "high-fiber", "folate"],
        "tip_filter": "first_trimester"
    },
    2: {
        "name": "Second Trimester", 
        "weeks": "13-26",
        "priority_nutrients": ["Calcium", "Vitamin D", "Omega-3", "Iron", "Protein"],
        "focus_areas": ["bone development", "brain development", "increased energy needs"],
        "recommended_tags": ["calcium-rich", "iron-rich", "omega-3", "lean-protein", "high-protein"],
        "tip_filter": "second_trimester"
    },
    3: {
        "name": "Third Trimester",
        "weeks": "27-40",
        "priority_nutrients": ["Iron", "Calcium", "DHA", "Protein", "Fiber"],
        "focus_areas": ["final brain development", "preparing for delivery", "managing digestion"],
        "recommended_tags": ["iron-rich", "high-fiber", "calcium-rich", "omega-3", "high-protein"],
        "tip_filter": "third_trimester"
    },
    4: {
        "name": "Postpartum",
        "weeks": "After delivery",
        "priority_nutrients": ["Iron", "Protein", "Calcium", "Vitamin D", "Omega-3"],
        "focus_areas": ["recovery", "breastfeeding nutrition", "energy restoration"],
        "recommended_tags": ["iron-rich", "calcium-rich", "lean-protein", "omega-3", "high-protein"],
        "tip_filter": "postpartum"
    }
}


def get_food_health_tags(food_id: str) -> dict:
    """Get health tags for a specific food"""
    return FOOD_HEALTH_TAGS.get(food_id, {"tags": [], "iron_level": "unknown", "sugar_level": "unknown", "sodium_level": "unknown"})


def get_personalized_recommendations(health_conditions: list, trimester: int = None) -> dict:
    """
    Get personalized food recommendations based on health conditions and trimester
    """
    recommendations = {
        "highlight_nutrients": set(),
        "recommended_tags": set(),
        "avoid_tags": set(),
        "avoid_categories": set(),
        "conditions_info": []
    }
    
    # Process health conditions
    for condition in health_conditions:
        if condition in HEALTH_CONDITION_TAGS:
            config = HEALTH_CONDITION_TAGS[condition]
            recommendations["recommended_tags"].update(config.get("recommended_tags", []))
            recommendations["highlight_nutrients"].update(config.get("highlight_nutrients", []))
            recommendations["avoid_tags"].update(config.get("avoid_tags", []))
            recommendations["avoid_categories"].update(config.get("avoid_categories", []))
            recommendations["conditions_info"].append({
                "condition": condition,
                "description": config.get("description", "")
            })
    
    # Add trimester-specific recommendations
    if trimester and trimester in TRIMESTER_PRIORITIES:
        trimester_config = TRIMESTER_PRIORITIES[trimester]
        recommendations["recommended_tags"].update(trimester_config.get("recommended_tags", []))
        recommendations["highlight_nutrients"].update(trimester_config.get("priority_nutrients", []))
        recommendations["trimester_info"] = {
            "name": trimester_config["name"],
            "weeks": trimester_config["weeks"],
            "focus_areas": trimester_config["focus_areas"],
            "priority_nutrients": trimester_config["priority_nutrients"]
        }
    
    # Convert sets to lists for JSON serialization
    recommendations["highlight_nutrients"] = list(recommendations["highlight_nutrients"])
    recommendations["recommended_tags"] = list(recommendations["recommended_tags"])
    recommendations["avoid_tags"] = list(recommendations["avoid_tags"])
    recommendations["avoid_categories"] = list(recommendations["avoid_categories"])
    
    return recommendations


def filter_food_for_user(food: dict, health_conditions: list, trimester: int = None) -> dict:
    """
    Enhance a food item with personalization flags based on user health conditions
    CRITICAL: Foods with safety_level='avoid' are NEVER recommended
    """
    food_id = food.get("id", "")
    safety_level = food.get("safety_level", "safe")
    health_tags = get_food_health_tags(food_id)
    food_tags = health_tags.get("tags", [])
    
    result = {
        **food,
        "health_tags": food_tags,
        "iron_level": health_tags.get("iron_level", "unknown"),
        "sugar_level": health_tags.get("sugar_level", "unknown"),
        "sodium_level": health_tags.get("sodium_level", "unknown"),
        "is_recommended": False,
        "is_highlighted": False,
        "should_limit": False,
        "recommendation_reasons": [],
        "caution_reasons": []
    }
    
    # CRITICAL SAFETY CHECK: Never recommend foods that should be avoided
    if safety_level == "avoid":
        result["should_limit"] = True
        result["caution_reasons"].append("Not recommended during pregnancy")
        # Return early - no further processing for avoid foods
        return result
    
    # Check for never-recommend tags
    has_dangerous_tags = any(tag in food_tags for tag in NEVER_RECOMMEND_TAGS)
    if has_dangerous_tags:
        result["should_limit"] = True
        result["caution_reasons"].append("Contains ingredients to avoid during pregnancy")
        return result
    
    # Check against health conditions
    for condition in health_conditions:
        if condition in HEALTH_CONDITION_TAGS:
            config = HEALTH_CONDITION_TAGS[condition]
            
            # Check if food matches recommended tags
            recommended = config.get("recommended_tags", [])
            for tag in recommended:
                if tag in food_tags:
                    result["is_recommended"] = True
                    result["is_highlighted"] = True
                    result["recommendation_reasons"].append(f"Good for {condition.replace('-', ' ')}")
                    break
            
            # Check if food should be avoided
            avoid_tags = config.get("avoid_tags", [])
            for tag in avoid_tags:
                if tag in food_tags:
                    result["should_limit"] = True
                    result["caution_reasons"].append(f"Consider limiting for {condition.replace('-', ' ')}")
            
            # Check if category should be avoided
            avoid_categories = config.get("avoid_categories", [])
            if food.get("category") in avoid_categories:
                result["should_limit"] = True
                result["caution_reasons"].append(f"Not suitable for {condition.replace('-', ' ')}")
    
    # Specific condition checks (only for safe/limit foods)
    if "anemia" in health_conditions:
        if health_tags.get("iron_level") in ["high", "very-high"]:
            result["is_recommended"] = True
            result["is_highlighted"] = True
            if "High in iron" not in result["recommendation_reasons"]:
                result["recommendation_reasons"].append("High in iron")
    
    if "gestational-diabetes" in health_conditions:
        if health_tags.get("sugar_level") in ["high", "very-high"]:
            result["should_limit"] = True
            if "High sugar content" not in result["caution_reasons"]:
                result["caution_reasons"].append("High sugar content")
        elif health_tags.get("sugar_level") in ["none", "low"] and "low-glycemic" in food_tags:
            result["is_recommended"] = True
            if "Low glycemic" not in result["recommendation_reasons"]:
                result["recommendation_reasons"].append("Low glycemic")
    
    if "high-blood-pressure" in health_conditions:
        if health_tags.get("sodium_level") in ["high", "very-high"]:
            result["should_limit"] = True
            if "High sodium content" not in result["caution_reasons"]:
                result["caution_reasons"].append("High sodium content")
        elif health_tags.get("sodium_level") in ["none", "low"] and "potassium-rich" in food_tags:
            result["is_recommended"] = True
            if "Low sodium, potassium-rich" not in result["recommendation_reasons"]:
                result["recommendation_reasons"].append("Low sodium, potassium-rich")
    
    # Safety level 'limit' foods should not be highly recommended
    if safety_level == "limit" and result["is_recommended"]:
        result["is_recommended"] = False
        result["is_highlighted"] = False
        result["recommendation_reasons"] = []
        result["should_limit"] = True
        if "Consume in moderation" not in result["caution_reasons"]:
            result["caution_reasons"].append("Consume in moderation")
    
    # Remove duplicates
    result["recommendation_reasons"] = list(set(result["recommendation_reasons"]))
    result["caution_reasons"] = list(set(result["caution_reasons"]))
    
    return result


def get_iron_rich_foods() -> list:
    """Get list of food IDs that are iron-rich"""
    return [fid for fid, tags in FOOD_HEALTH_TAGS.items() 
            if tags.get("iron_level") in ["high", "very-high"] or "iron-rich" in tags.get("tags", [])]


def get_low_sugar_foods() -> list:
    """Get list of food IDs that are low in sugar"""
    return [fid for fid, tags in FOOD_HEALTH_TAGS.items() 
            if tags.get("sugar_level") in ["none", "low"] or "low-sugar" in tags.get("tags", [])]


def get_low_sodium_foods() -> list:
    """Get list of food IDs that are low in sodium"""
    return [fid for fid, tags in FOOD_HEALTH_TAGS.items() 
            if tags.get("sodium_level") in ["none", "low"] or "low-sodium" in tags.get("tags", [])]
