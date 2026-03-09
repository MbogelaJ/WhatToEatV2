"""
Test file for new features:
1. Premium status sync from payments collection
2. Foods migration to MongoDB (85 foods)
3. Food search, categories from MongoDB
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestPremiumStatusEndpoint:
    """Tests for GET /api/payments/user/{user_id}/premium-status"""
    
    def test_premium_status_non_premium_user(self):
        """Test that a user without paid transactions returns is_premium: false"""
        response = requests.get(f"{BASE_URL}/api/payments/user/non_existing_user_12345/premium-status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "is_premium" in data, "Response should have is_premium field"
        assert data["is_premium"] == False, "Non-existing user should not be premium"
        assert data["purchased_at"] is None, "Non-premium user should have null purchased_at"
        assert data["session_id"] is None, "Non-premium user should have null session_id"
        print(f"✓ Non-premium user status correct: {data}")
    
    def test_premium_status_response_structure(self):
        """Test the response structure of premium status endpoint"""
        response = requests.get(f"{BASE_URL}/api/payments/user/test_user_abc/premium-status")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields exist
        required_fields = ["is_premium", "purchased_at", "session_id"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"✓ Response structure correct with fields: {list(data.keys())}")

    def test_premium_status_with_various_user_ids(self):
        """Test premium status with different user ID formats"""
        test_user_ids = [
            "user_1234567890_abcdefghi",  # Standard format
            "simple_user",
            "user-with-dashes",
            "USER_CAPS",
        ]
        
        for user_id in test_user_ids:
            response = requests.get(f"{BASE_URL}/api/payments/user/{user_id}/premium-status")
            assert response.status_code == 200, f"Failed for user_id: {user_id}"
            data = response.json()
            assert "is_premium" in data
        print(f"✓ Premium status endpoint handles various user ID formats")


class TestFoodsMongoDB:
    """Tests for food endpoints using MongoDB"""
    
    def test_get_all_foods_returns_85_items(self):
        """Test GET /api/foods returns all 85 foods from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/foods")
        assert response.status_code == 200
        
        foods = response.json()
        assert isinstance(foods, list), "Response should be a list"
        assert len(foods) == 85, f"Expected 85 foods, got {len(foods)}"
        print(f"✓ GET /api/foods returns {len(foods)} foods")
    
    def test_food_structure(self):
        """Test that foods have correct structure"""
        response = requests.get(f"{BASE_URL}/api/foods")
        assert response.status_code == 200
        
        foods = response.json()
        first_food = foods[0]
        
        required_fields = ["id", "name", "category", "safety_level", "description", "nutrition_note"]
        for field in required_fields:
            assert field in first_food, f"Food missing required field: {field}"
        
        # Verify _id from MongoDB is excluded
        assert "_id" not in first_food, "MongoDB _id should be excluded"
        print(f"✓ Food structure correct: {list(first_food.keys())}")
    
    def test_get_food_by_id(self):
        """Test GET /api/foods/{id} returns single food from MongoDB"""
        # Test with known food ID - Salmon (id: 1)
        response = requests.get(f"{BASE_URL}/api/foods/1")
        assert response.status_code == 200
        
        food = response.json()
        assert food["id"] == "1"
        assert food["name"] == "Salmon"
        assert "_id" not in food, "MongoDB _id should be excluded"
        print(f"✓ GET /api/foods/1 returns: {food['name']}")
    
    def test_get_food_by_id_not_found(self):
        """Test GET /api/foods/{id} returns 404 for non-existent food"""
        response = requests.get(f"{BASE_URL}/api/foods/non_existent_id_999")
        assert response.status_code == 404
        print("✓ Non-existent food returns 404")
    
    def test_search_foods(self):
        """Test GET /api/foods/search?q={query} searches MongoDB"""
        # Search for salmon
        response = requests.get(f"{BASE_URL}/api/foods/search?q=salmon")
        assert response.status_code == 200
        
        foods = response.json()
        assert len(foods) > 0, "Should find salmon"
        assert any("salmon" in f["name"].lower() for f in foods), "Results should contain salmon"
        print(f"✓ Search for 'salmon' found {len(foods)} results")
    
    def test_search_foods_by_category(self):
        """Test searching foods by category"""
        response = requests.get(f"{BASE_URL}/api/foods/search?q=Dairy")
        assert response.status_code == 200
        
        foods = response.json()
        assert len(foods) > 0, "Should find dairy foods"
        print(f"✓ Search for 'Dairy' found {len(foods)} results")
    
    def test_search_foods_empty_query(self):
        """Test search with empty query returns all foods"""
        response = requests.get(f"{BASE_URL}/api/foods/search?q=")
        assert response.status_code == 200
        
        foods = response.json()
        assert len(foods) == 85, f"Empty search should return all 85 foods, got {len(foods)}"
        print(f"✓ Empty search returns all {len(foods)} foods")


class TestCategoriesMongoDB:
    """Tests for categories endpoint using MongoDB"""
    
    def test_get_categories(self):
        """Test GET /api/categories returns categories from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list), "Categories should be a list"
        assert len(categories) > 0, "Should have categories"
        
        # Verify expected categories exist
        expected_categories = [
            "Fish & Seafood", "Dairy", "Meat & Protein", "Fruits", 
            "Vegetables", "Beverages", "Grains & Carbs", "Herbs & Spices"
        ]
        
        for cat in expected_categories:
            assert cat in categories, f"Missing expected category: {cat}"
        
        print(f"✓ GET /api/categories returns {len(categories)} categories: {categories}")
    
    def test_categories_sorted(self):
        """Test that categories are returned sorted"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert categories == sorted(categories), "Categories should be sorted alphabetically"
        print("✓ Categories are sorted alphabetically")


class TestPersonalizedFoodsWithMongoDB:
    """Test personalized foods endpoint works with MongoDB"""
    
    def test_personalized_foods_uses_mongodb(self):
        """Test POST /api/foods/personalized works with MongoDB data"""
        response = requests.post(
            f"{BASE_URL}/api/foods/personalized",
            json={"health_conditions": [], "trimester": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "foods" in data
        assert len(data["foods"]) == 85, f"Expected 85 foods, got {len(data['foods'])}"
        print(f"✓ Personalized foods returns {len(data['foods'])} foods from MongoDB")
    
    def test_personalized_foods_with_conditions(self):
        """Test personalized foods with health conditions"""
        response = requests.post(
            f"{BASE_URL}/api/foods/personalized",
            json={"health_conditions": ["anemia"], "trimester": 2}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "foods" in data
        assert "recommendations" in data
        
        # Check that some foods are recommended
        recommended_foods = [f for f in data["foods"] if f.get("is_recommended")]
        assert len(recommended_foods) > 0, "Should have some recommended foods for anemia"
        print(f"✓ Personalized with anemia condition: {len(recommended_foods)} recommended foods")


class TestFoodsByCategory:
    """Test getting foods by category"""
    
    def test_get_foods_by_category(self):
        """Test GET /api/foods/category/{category}"""
        response = requests.get(f"{BASE_URL}/api/foods/category/Dairy")
        assert response.status_code == 200
        
        foods = response.json()
        assert len(foods) > 0, "Should have dairy foods"
        assert all(f["category"] == "Dairy" for f in foods), "All foods should be Dairy category"
        print(f"✓ Dairy category has {len(foods)} foods")


class TestFoodsBySafety:
    """Test getting foods by safety level"""
    
    def test_get_safe_foods(self):
        """Test GET /api/foods/safety/safe"""
        response = requests.get(f"{BASE_URL}/api/foods/safety/safe")
        assert response.status_code == 200
        
        foods = response.json()
        assert all(f["safety_level"] == "safe" for f in foods)
        print(f"✓ Safe foods: {len(foods)} items")
    
    def test_get_limit_foods(self):
        """Test GET /api/foods/safety/limit"""
        response = requests.get(f"{BASE_URL}/api/foods/safety/limit")
        assert response.status_code == 200
        
        foods = response.json()
        assert all(f["safety_level"] == "limit" for f in foods)
        print(f"✓ Limit foods: {len(foods)} items")
    
    def test_get_avoid_foods(self):
        """Test GET /api/foods/safety/avoid"""
        response = requests.get(f"{BASE_URL}/api/foods/safety/avoid")
        assert response.status_code == 200
        
        foods = response.json()
        assert all(f["safety_level"] == "avoid" for f in foods)
        assert len(foods) == 13, f"Expected 13 avoid foods, got {len(foods)}"
        print(f"✓ Avoid foods: {len(foods)} items")
    
    def test_invalid_safety_level(self):
        """Test GET /api/foods/safety/{invalid} returns 400"""
        response = requests.get(f"{BASE_URL}/api/foods/safety/invalid")
        assert response.status_code == 400
        print("✓ Invalid safety level returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
