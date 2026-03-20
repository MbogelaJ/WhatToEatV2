"""
WhatToEat Pregnancy Nutrition App - Backend API Tests
Full QA testing for App Store/Play Store submission readiness.
Tests: Health, Foods, Search by name/category, Auth, IAP
Note: Category/Safety filtering is done client-side in the frontend.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Test health and root endpoints"""
    
    def test_health_endpoint(self):
        """API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health endpoint OK")
    
    def test_root_endpoint(self):
        """API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint OK")


class TestFoodsEndpoints:
    """Test all food-related endpoints"""
    
    def test_foods_all_returns_288_items(self):
        """Home page should load 288 foods"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        assert response.status_code == 200
        data = response.json()
        assert "foods" in data
        assert "total" in data
        # Check for expected 288 foods
        assert data["total"] == 288, f"Expected 288 foods, got {data['total']}"
        # Default page_size is 250
        assert len(data["foods"]) == 250, f"Expected 250 foods in response, got {len(data['foods'])}"
        print(f"✓ Foods all returns {data['total']} total foods")
    
    def test_foods_all_structure(self):
        """Foods should have proper structure"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        data = response.json()
        
        # Check first food has all expected fields
        food = data["foods"][0]
        expected_fields = ["id", "name", "category", "safety", "safety_label", 
                          "nutritional_benefits", "recommended_consumption", 
                          "preparation_tips", "precautions"]
        
        for field in expected_fields:
            assert field in food, f"Missing field: {field}"
        
        # Check safety levels are valid
        valid_safety = ["SAFE", "LIMIT", "AVOID"]
        assert food["safety"] in valid_safety, f"Invalid safety: {food['safety']}"
        
        # Check is_premium field exists
        assert "is_premium" in food, "Missing is_premium field"
        print("✓ Food structure is correct")
    
    def test_foods_search_by_name(self):
        """Search filters foods by name"""
        response = requests.get(f"{BASE_URL}/api/foods/search?query=apple")
        assert response.status_code == 200
        data = response.json()
        assert "foods" in data
        
        # All returned foods should contain 'apple' in name or category
        for food in data["foods"]:
            name_lower = food["name"].lower()
            cat_lower = food.get("category", "").lower()
            assert "apple" in name_lower or "apple" in cat_lower, f"Food '{food['name']}' doesn't match 'apple'"
        print(f"✓ Search 'apple' returns {len(data['foods'])} results")
    
    def test_foods_search_by_category_name(self):
        """Search filters foods by category name"""
        response = requests.get(f"{BASE_URL}/api/foods/search?query=fruits")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        # All foods should have 'fruits' in name or category
        for food in data["foods"]:
            name_lower = food["name"].lower()
            cat_lower = food.get("category", "").lower()
            assert "fruits" in name_lower or "fruits" in cat_lower
        print(f"✓ Search 'fruits' returns {data['total']} results")
    
    def test_foods_search_empty_query(self):
        """Empty search should return all foods"""
        response = requests.get(f"{BASE_URL}/api/foods/search?query=")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 288
        print("✓ Empty search returns all 288 foods")
    
    def test_foods_search_special_characters(self):
        """Search should handle special characters without crash"""
        special_queries = ["<script>", "'; DROP TABLE", "café", "🍎", "a&b=c", "'''", "   "]
        for query in special_queries:
            response = requests.get(f"{BASE_URL}/api/foods/search", params={"query": query})
            assert response.status_code == 200, f"Failed for query: {query}"
            data = response.json()
            assert "foods" in data
            assert "total" in data
        print("✓ Special character search handled safely")
    
    def test_foods_by_id(self):
        """Get individual food by ID"""
        response = requests.get(f"{BASE_URL}/api/foods/apple-1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "apple-1"
        assert data["name"] == "Apple"
        print("✓ Get food by ID works")
    
    def test_foods_invalid_id(self):
        """Get invalid food ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/foods/nonexistent-food-123")
        assert response.status_code == 404
        print("✓ Invalid food ID returns 404")
    
    def test_foods_pagination_page_2(self):
        """Test pagination - get page 2"""
        response = requests.get(f"{BASE_URL}/api/foods/all?page=2&page_size=100")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["page_size"] == 100
        # Total is 288, page 1 has 100, page 2 has 100, page 3 has 88
        assert len(data["foods"]) == 100
        print("✓ Pagination page 2 works")
    
    def test_premium_foods_exist(self):
        """Check premium foods are marked correctly"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        data = response.json()
        
        premium_count = sum(1 for food in data["foods"] if food.get("is_premium"))
        free_count = sum(1 for food in data["foods"] if not food.get("is_premium"))
        
        assert premium_count > 0, "Should have premium foods"
        assert free_count > 0, "Should have free foods"
        print(f"✓ Premium: {premium_count}, Free: {free_count}")


class TestCategoryAndSafetyEndpoints:
    """Test category and safety endpoints"""
    
    def test_categories_endpoint(self):
        """Get all categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 10
        
        expected_categories = ["Fruits", "Vegetables", "Proteins", "Dairy", "Beverages"]
        for cat in expected_categories:
            assert cat in data["categories"], f"Missing category: {cat}"
        print(f"✓ Categories returns {len(data['categories'])} categories")
    
    def test_safety_levels_endpoint(self):
        """Get all safety levels"""
        response = requests.get(f"{BASE_URL}/api/safety-levels")
        assert response.status_code == 200
        data = response.json()
        
        expected_levels = ["SAFE", "LIMIT", "AVOID"]
        for level in expected_levels:
            assert level in data["safety_levels"]
        print("✓ Safety levels returns correct values")
    
    def test_all_safety_levels_exist_in_foods(self):
        """Verify all safety levels have foods"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        data = response.json()
        
        safety_counts = {"SAFE": 0, "LIMIT": 0, "AVOID": 0}
        for food in data["foods"]:
            if food["safety"] in safety_counts:
                safety_counts[food["safety"]] += 1
        
        for level, count in safety_counts.items():
            assert count > 0, f"No foods with safety level: {level}"
        print(f"✓ Safety counts: SAFE={safety_counts['SAFE']}, LIMIT={safety_counts['LIMIT']}, AVOID={safety_counts['AVOID']}")


class TestAuthEndpoints:
    """Test authentication endpoints (without actual auth)"""
    
    def test_auth_me_unauthorized(self):
        """Auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth/me returns 401 without token")
    
    def test_logout_without_token(self):
        """Logout works even without token"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Logout endpoint works")


class TestIAPEndpoints:
    """Test In-App Purchase endpoints"""
    
    def test_premium_status_unauthenticated(self):
        """Premium status without auth returns not premium"""
        response = requests.get(f"{BASE_URL}/api/iap/premium-status")
        assert response.status_code == 200
        data = response.json()
        assert data["is_premium"] == False
        print("✓ Premium status returns false when unauthenticated")
    
    def test_verify_purchase_empty(self):
        """Verify purchase with empty receipt"""
        response = requests.post(f"{BASE_URL}/api/iap/verify-purchase", 
                                json={"receipt_data": ""})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        print("✓ Empty receipt handled correctly")
    
    def test_restore_purchases_unauthenticated(self):
        """Restore purchases without auth"""
        response = requests.post(f"{BASE_URL}/api/iap/restore-purchases",
                                json={"receipt_data": ""})
        assert response.status_code == 200
        data = response.json()
        # Should fail gracefully
        assert "is_premium" in data
        print("✓ Restore purchases endpoint works")


class TestRapidRequests:
    """Test rapid requests (simulates rapid typing in search)"""
    
    def test_rapid_sequential_requests(self):
        """Test rapid sequential requests (simulate rapid typing)"""
        queries = ["a", "ap", "app", "appl", "apple"]
        for q in queries:
            response = requests.get(f"{BASE_URL}/api/foods/search?query={q}")
            assert response.status_code == 200
        print("✓ Rapid requests handled without crash")
    
    def test_concurrent_category_check(self):
        """Test fetching categories multiple times"""
        for _ in range(5):
            response = requests.get(f"{BASE_URL}/api/categories")
            assert response.status_code == 200
        print("✓ Concurrent category requests OK")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
