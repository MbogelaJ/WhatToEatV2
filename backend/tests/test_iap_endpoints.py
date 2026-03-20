"""
Backend API Tests for WhatToEat Pregnancy Nutrition App
Tests the Apple In-App Purchase verification and premium status endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://food-query-patch.preview.emergentagent.com')


class TestHealthEndpoint:
    """Health check endpoint test"""
    
    def test_health_check(self):
        """Test that the health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestIAPEndpoints:
    """Tests for Apple In-App Purchase endpoints"""
    
    def test_verify_purchase_with_invalid_receipt(self):
        """Test /api/iap/verify-purchase with invalid receipt returns proper error"""
        response = requests.post(
            f"{BASE_URL}/api/iap/verify-purchase",
            json={"receipt_data": "invalid_test_receipt"}
        )
        
        # Should return 200 with error response (not 500)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == False
        assert data["is_premium"] == False
        assert "message" in data
        # Apple returns status 21002 for malformed receipt data
        assert "verification failed" in data["message"].lower() or "21002" in data["message"]
    
    def test_verify_purchase_with_empty_receipt(self):
        """Test /api/iap/verify-purchase with empty receipt"""
        response = requests.post(
            f"{BASE_URL}/api/iap/verify-purchase",
            json={"receipt_data": ""}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert data["is_premium"] == False
    
    def test_premium_status_unauthenticated(self):
        """Test /api/iap/premium-status without authentication"""
        response = requests.get(f"{BASE_URL}/api/iap/premium-status")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_premium"] == False
        assert data["message"] == "Not authenticated"
    
    def test_premium_status_with_invalid_token(self):
        """Test /api/iap/premium-status with invalid Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/iap/premium-status",
            headers={"Authorization": "Bearer invalid_token_123"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_premium"] == False
        # Should be either "Invalid session" or "Not authenticated"
        assert "session" in data["message"].lower() or "authenticated" in data["message"].lower()


class TestFoodEndpoints:
    """Tests for food-related endpoints"""
    
    def test_get_all_foods(self):
        """Test /api/foods/all returns food list"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        
        assert response.status_code == 200
        
        data = response.json()
        # Response is wrapped in {"foods": [...], "page": 1, ...}
        assert "foods" in data
        assert isinstance(data["foods"], list)
        assert len(data["foods"]) > 0
        
        # Check food structure
        food = data["foods"][0]
        assert "id" in food
        assert "name" in food
        assert "safety" in food
        assert "category" in food
    
    def test_get_categories(self):
        """Test /api/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        
        assert response.status_code == 200
        
        data = response.json()
        # Response is wrapped in {"categories": [...]}
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0
    
    def test_get_safety_levels(self):
        """Test /api/safety-levels returns safety level list"""
        response = requests.get(f"{BASE_URL}/api/safety-levels")
        
        assert response.status_code == 200
        
        data = response.json()
        # Response is wrapped in {"safety_levels": [...]}
        assert "safety_levels" in data
        safety_values = data["safety_levels"]
        assert "SAFE" in safety_values
        assert "LIMIT" in safety_values
        assert "AVOID" in safety_values
    
    def test_search_foods(self):
        """Test /api/foods/search endpoint"""
        response = requests.get(f"{BASE_URL}/api/foods/search?query=apple")
        
        assert response.status_code == 200
        
        data = response.json()
        # Response is wrapped in {"foods": [...]}
        assert "foods" in data
        assert isinstance(data["foods"], list)
        # Should find at least one apple
        assert len(data["foods"]) >= 1
    
    def test_get_food_by_id(self):
        """Test /api/foods/{id} endpoint"""
        # First get a valid food ID
        response = requests.get(f"{BASE_URL}/api/foods/all")
        data = response.json()
        foods = data.get("foods", [])
        
        if len(foods) > 0:
            food_id = foods[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/foods/{food_id}")
            assert response.status_code == 200
            
            food_data = response.json()
            assert food_data["id"] == food_id
    
    def test_food_has_premium_flag(self):
        """Test that foods have is_premium flag"""
        response = requests.get(f"{BASE_URL}/api/foods/all")
        
        assert response.status_code == 200
        
        data = response.json()
        foods = data.get("foods", [])
        assert len(foods) > 0
        
        # Check that is_premium exists on foods
        for food in foods[:5]:  # Check first 5 foods
            assert "is_premium" in food


class TestRestorePurchases:
    """Tests for restore purchases endpoint"""
    
    def test_restore_without_receipt_or_user(self):
        """Test /api/iap/restore-purchases without receipt or user"""
        response = requests.post(
            f"{BASE_URL}/api/iap/restore-purchases",
            json={"receipt_data": ""}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == False
        assert data["is_premium"] == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
