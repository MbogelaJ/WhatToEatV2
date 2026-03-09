"""
Test suite for personalized foods API endpoint
CRITICAL: Tests that foods with safety_level='avoid' are NEVER recommended

Tests cover:
1. CRITICAL: Avoid foods never get is_recommended=true
2. Anemia condition recommendations (iron-rich foods)
3. Gestational diabetes recommendations (low-glycemic foods)
4. High blood pressure recommendations (low-sodium, potassium-rich)
5. Caution reasons populated correctly
6. Multiple health conditions combined
7. Trimester-specific recommendations
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# The 13 'avoid' foods in FOOD_DATABASE per requirements
AVOID_FOOD_IDS = ["2", "3", "8", "13", "16", "24", "28", "34", "41", "48", "60", "64", "66"]
AVOID_FOOD_NAMES = [
    "Sushi (Raw Fish)", "High Mercury Fish", "Raw Oysters", 
    "Soft Cheese (Unpasteurized)", "Raw Milk", "Raw Eggs",
    "Rare/Undercooked Meat", "Pate", "Papaya (Unripe/Green)",
    "Sprouts (Raw)", "Alcohol", "Fresh Juice (Unpasteurized)", "Energy Drinks"
]

# All health conditions from the requirement
ALL_HEALTH_CONDITIONS = [
    "anemia", "gestational-diabetes", "high-blood-pressure",
    "lactose-intolerance", "vegetarian", "vegan",
    "gluten-free", "nut-allergy", "shellfish-allergy"
]


class TestCriticalAvoidFoodsNeverRecommended:
    """CRITICAL: Verify that foods with safety_level='avoid' are NEVER recommended"""
    
    def test_avoid_foods_not_recommended_without_conditions(self):
        """Test that avoid foods are not recommended even without health conditions"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check each avoid food
        for food in data["foods"]:
            if food["safety_level"] == "avoid":
                assert food["is_recommended"] == False, \
                    f"CRITICAL BUG: Avoid food '{food['name']}' (id:{food['id']}) has is_recommended=True"
                assert food["should_limit"] == True, \
                    f"Avoid food '{food['name']}' should have should_limit=True"
        print(f"PASS: All avoid foods correctly not recommended (no conditions)")
    
    def test_avoid_foods_not_recommended_with_anemia(self):
        """Test avoid foods not recommended even when anemia (iron-rich) condition is set"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        avoid_foods_found = []
        for food in data["foods"]:
            if food["safety_level"] == "avoid":
                avoid_foods_found.append(food)
                assert food["is_recommended"] == False, \
                    f"CRITICAL BUG: Avoid food '{food['name']}' recommended despite safety_level='avoid'"
                assert food["should_limit"] == True, \
                    f"Avoid food '{food['name']}' should have should_limit=True"
        
        # Verify we found all 13 avoid foods
        assert len(avoid_foods_found) == 13, f"Expected 13 avoid foods, found {len(avoid_foods_found)}"
        print(f"PASS: All {len(avoid_foods_found)} avoid foods correctly not recommended (anemia condition)")
    
    def test_avoid_foods_not_recommended_all_conditions(self):
        """Test avoid foods not recommended with ALL health conditions combined"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ALL_HEALTH_CONDITIONS,
            "trimester": 3
        })
        assert response.status_code == 200
        data = response.json()
        
        for food in data["foods"]:
            if food["safety_level"] == "avoid":
                assert food["is_recommended"] == False, \
                    f"CRITICAL BUG: Avoid food '{food['name']}' recommended with all conditions"
        print(f"PASS: All avoid foods correctly not recommended (all conditions)")
    
    def test_specific_avoid_food_alcohol(self):
        """Test Alcohol (id:60) is NEVER recommended"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia", "gestational-diabetes"],
            "trimester": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        alcohol_food = next((f for f in data["foods"] if f["id"] == "60"), None)
        assert alcohol_food is not None, "Alcohol (id:60) not found in response"
        assert alcohol_food["is_recommended"] == False, "CRITICAL BUG: Alcohol is recommended!"
        assert alcohol_food["should_limit"] == True, "Alcohol should have should_limit=True"
        assert "Not recommended during pregnancy" in alcohol_food.get("caution_reasons", []), \
            "Alcohol should have pregnancy caution reason"
        print(f"PASS: Alcohol correctly never recommended")
    
    def test_specific_avoid_food_raw_fish(self):
        """Test Sushi/Raw Fish (id:2) is NEVER recommended"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        sushi = next((f for f in data["foods"] if f["id"] == "2"), None)
        assert sushi is not None, "Sushi (id:2) not found in response"
        assert sushi["is_recommended"] == False, "CRITICAL BUG: Raw fish is recommended!"
        assert sushi["should_limit"] == True, "Raw fish should have should_limit=True"
        print(f"PASS: Sushi/Raw Fish correctly never recommended")
    
    def test_all_13_avoid_foods_verified(self):
        """Test all 13 specific avoid foods are correctly flagged"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ALL_HEALTH_CONDITIONS,
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        for food_id in AVOID_FOOD_IDS:
            food = foods_by_id.get(food_id)
            assert food is not None, f"Avoid food id:{food_id} not found"
            assert food["safety_level"] == "avoid", \
                f"Food '{food['name']}' (id:{food_id}) should have safety_level='avoid'"
            assert food["is_recommended"] == False, \
                f"CRITICAL BUG: Avoid food '{food['name']}' (id:{food_id}) is recommended"
            assert food["should_limit"] == True, \
                f"Avoid food '{food['name']}' should have should_limit=True"
        
        print(f"PASS: All 13 avoid foods verified correctly")


class TestAnemiaCondition:
    """Test iron-rich food recommendations for anemia condition"""
    
    def test_anemia_recommends_iron_rich_foods(self):
        """Verify iron-rich foods are recommended for anemia"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        # Iron-rich safe foods that should be recommended
        iron_rich_safe_foods = ["47", "27", "33", "6", "73"]  # Leafy Greens, Beef, Legumes, Sardines, Oatmeal
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        recommended_iron_foods = 0
        for food_id in iron_rich_safe_foods:
            food = foods_by_id.get(food_id)
            if food and food.get("is_recommended"):
                recommended_iron_foods += 1
                assert "iron" in str(food.get("recommendation_reasons", [])).lower() or \
                       "High in iron" in food.get("recommendation_reasons", []) or \
                       "Good for anemia" in food.get("recommendation_reasons", []), \
                    f"Iron-rich food {food['name']} should have iron-related recommendation reason"
        
        assert recommended_iron_foods >= 3, \
            f"At least 3 iron-rich foods should be recommended for anemia, found {recommended_iron_foods}"
        print(f"PASS: {recommended_iron_foods} iron-rich foods recommended for anemia")
    
    def test_anemia_recommendations_info(self):
        """Verify anemia condition info is returned"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": None
        })
        assert response.status_code == 200
        data = response.json()
        
        recommendations = data["recommendations"]
        conditions_info = recommendations.get("conditions_info", [])
        
        anemia_info = next((c for c in conditions_info if c["condition"] == "anemia"), None)
        assert anemia_info is not None, "Anemia condition info not found"
        assert "iron" in anemia_info["description"].lower(), "Anemia description should mention iron"
        print(f"PASS: Anemia condition info returned correctly")


class TestGestationalDiabetes:
    """Test low-glycemic food recommendations for gestational diabetes"""
    
    def test_gestational_diabetes_recommends_low_glycemic(self):
        """Verify low-glycemic foods are recommended for gestational diabetes"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["gestational-diabetes"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        # Low-glycemic safe foods
        low_glycemic_foods = ["35", "36", "32", "47", "49"]  # Berries, Avocado, Tofu, Leafy Greens, Broccoli
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        recommended_low_glycemic = 0
        for food_id in low_glycemic_foods:
            food = foods_by_id.get(food_id)
            if food and food.get("is_recommended"):
                recommended_low_glycemic += 1
        
        assert recommended_low_glycemic >= 2, \
            f"At least 2 low-glycemic foods should be recommended, found {recommended_low_glycemic}"
        print(f"PASS: {recommended_low_glycemic} low-glycemic foods recommended for gestational diabetes")
    
    def test_high_sugar_foods_flagged_for_diabetes(self):
        """Verify high sugar foods are flagged for gestational diabetes"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["gestational-diabetes"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        # High sugar foods that should be limited
        high_sugar_foods = ["19", "46", "67"]  # Ice Cream, Dried Fruits, Soda
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        for food_id in high_sugar_foods:
            food = foods_by_id.get(food_id)
            if food:
                assert food.get("should_limit") == True, \
                    f"High sugar food '{food['name']}' should be limited for gestational diabetes"
                caution_reasons = food.get("caution_reasons", [])
                assert len(caution_reasons) > 0, \
                    f"High sugar food '{food['name']}' should have caution reasons"
        print(f"PASS: High sugar foods correctly flagged for gestational diabetes")


class TestHighBloodPressure:
    """Test low-sodium, potassium-rich food recommendations for high blood pressure"""
    
    def test_high_bp_recommends_low_sodium_potassium(self):
        """Verify low-sodium, potassium-rich foods are recommended for high BP"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["high-blood-pressure"],
            "trimester": 3
        })
        assert response.status_code == 200
        data = response.json()
        
        # Potassium-rich, low-sodium foods
        bp_friendly_foods = ["36", "37", "50", "53", "68"]  # Avocado, Bananas, Sweet Potatoes, Tomatoes, Coconut Water
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        recommended_bp_foods = 0
        for food_id in bp_friendly_foods:
            food = foods_by_id.get(food_id)
            if food and food.get("is_recommended"):
                recommended_bp_foods += 1
        
        assert recommended_bp_foods >= 2, \
            f"At least 2 BP-friendly foods should be recommended, found {recommended_bp_foods}"
        print(f"PASS: {recommended_bp_foods} low-sodium/potassium-rich foods recommended for high BP")
    
    def test_high_sodium_foods_flagged_for_bp(self):
        """Verify high sodium foods are flagged for high blood pressure"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["high-blood-pressure"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        # High sodium foods that should be limited
        high_sodium_foods = ["17", "25", "82"]  # Hard Cheese, Deli Meats, Hot Dogs
        
        foods_by_id = {f["id"]: f for f in data["foods"]}
        
        flagged_count = 0
        for food_id in high_sodium_foods:
            food = foods_by_id.get(food_id)
            if food and food.get("should_limit"):
                flagged_count += 1
                caution_reasons = food.get("caution_reasons", [])
                has_sodium_reason = any("sodium" in r.lower() for r in caution_reasons)
                # High sodium foods should have caution reason
                assert len(caution_reasons) > 0, \
                    f"High sodium food '{food['name']}' should have caution reasons"
        
        assert flagged_count >= 2, f"At least 2 high sodium foods should be flagged, found {flagged_count}"
        print(f"PASS: {flagged_count} high sodium foods correctly flagged for high BP")


class TestCautionReasons:
    """Test that caution_reasons are populated correctly"""
    
    def test_avoid_foods_have_caution_reasons(self):
        """Verify all avoid foods have caution_reasons populated"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        for food in data["foods"]:
            if food["safety_level"] == "avoid":
                caution_reasons = food.get("caution_reasons", [])
                assert len(caution_reasons) > 0, \
                    f"Avoid food '{food['name']}' should have caution_reasons"
                assert "Not recommended during pregnancy" in caution_reasons, \
                    f"Avoid food '{food['name']}' should have standard pregnancy caution reason"
        print(f"PASS: All avoid foods have caution_reasons populated")


class TestTrimesterRecommendations:
    """Test trimester-specific recommendations"""
    
    def test_trimester_1_info(self):
        """Verify first trimester info is returned"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        trimester_info = data["recommendations"].get("trimester_info")
        assert trimester_info is not None, "Trimester info should be returned"
        assert trimester_info["name"] == "First Trimester"
        assert "Folate" in trimester_info["priority_nutrients"]
        print(f"PASS: First trimester info correctly returned")
    
    def test_trimester_2_info(self):
        """Verify second trimester info is returned"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        trimester_info = data["recommendations"].get("trimester_info")
        assert trimester_info["name"] == "Second Trimester"
        assert "Calcium" in trimester_info["priority_nutrients"]
        print(f"PASS: Second trimester info correctly returned")
    
    def test_trimester_3_info(self):
        """Verify third trimester info is returned"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 3
        })
        assert response.status_code == 200
        data = response.json()
        
        trimester_info = data["recommendations"].get("trimester_info")
        assert trimester_info["name"] == "Third Trimester"
        assert "Iron" in trimester_info["priority_nutrients"]
        print(f"PASS: Third trimester info correctly returned")
    
    def test_postpartum_trimester_4(self):
        """Verify postpartum (trimester 4) info is returned"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 4
        })
        assert response.status_code == 200
        data = response.json()
        
        trimester_info = data["recommendations"].get("trimester_info")
        assert trimester_info["name"] == "Postpartum"
        print(f"PASS: Postpartum info correctly returned")


class TestAPIResponseStructure:
    """Test the structure and counts of API response"""
    
    def test_response_structure(self):
        """Verify response has all expected fields"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level fields
        assert "foods" in data
        assert "recommendations" in data
        assert "total_count" in data
        assert "recommended_count" in data
        assert "caution_count" in data
        assert "disclaimer" in data
        
        # Verify counts are integers
        assert isinstance(data["total_count"], int)
        assert isinstance(data["recommended_count"], int)
        assert isinstance(data["caution_count"], int)
        
        # Total should be 85 foods
        assert data["total_count"] == 85, f"Expected 85 foods, got {data['total_count']}"
        print(f"PASS: Response structure correct with {data['total_count']} foods")
    
    def test_food_item_structure(self):
        """Verify each food item has personalization fields"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia"],
            "trimester": 2
        })
        assert response.status_code == 200
        data = response.json()
        
        for food in data["foods"][:5]:  # Check first 5
            assert "is_recommended" in food, f"Food {food['name']} missing is_recommended"
            assert "should_limit" in food, f"Food {food['name']} missing should_limit"
            assert "recommendation_reasons" in food, f"Food {food['name']} missing recommendation_reasons"
            assert "caution_reasons" in food, f"Food {food['name']} missing caution_reasons"
            assert "health_tags" in food, f"Food {food['name']} missing health_tags"
        
        print(f"PASS: Food items have correct personalization structure")
    
    def test_caution_count_includes_avoid(self):
        """Verify caution_count includes all avoid foods"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        # At minimum, 13 avoid foods should be in caution count
        assert data["caution_count"] >= 13, \
            f"Caution count should include at least 13 avoid foods, got {data['caution_count']}"
        print(f"PASS: Caution count ({data['caution_count']}) includes avoid foods")
