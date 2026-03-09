"""
Backend Auth API Tests
Tests for: register, login, profile (GET /me), update profile (PUT /profile)
Test user: test@example.com / password123
"""
import pytest
import requests
import os
import time
import secrets

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-ed-guide.preview.emergentagent.com')


class TestAuthRegister:
    """Test POST /api/auth/register - User registration"""
    
    def test_register_new_user_success(self):
        """Register a new user with valid data"""
        unique_email = f"test_reg_{int(time.time())}_{secrets.token_hex(4)}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "age": 28,
            "trimester": 2,
            "pregnancy_stage_label": "Second Trimester (Weeks 13-26)",
            "dietary_restrictions": ["vegetarian"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "user" in data, "Response should contain 'user'"
        assert "token" in data, "Response should contain 'token'"
        assert "message" in data, "Response should contain 'message'"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == unique_email.lower()
        assert user["age"] == 28
        assert user["trimester"] == 2
        assert user["pregnancy_stage_label"] == "Second Trimester (Weeks 13-26)"
        assert "vegetarian" in user["dietary_restrictions"]
        assert user["is_premium"] == False
        assert "id" in user and user["id"].startswith("user_")
        
        # Verify token is present
        assert len(data["token"]) > 0
        print(f"✓ Register new user success: {unique_email}")
    
    def test_register_invalid_email_format(self):
        """Registration should fail with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "notanemail",
            "password": "testpass123"
        })
        
        assert response.status_code == 400, f"Expected 400 for invalid email, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "email" in data["detail"].lower() or "invalid" in data["detail"].lower()
        print("✓ Invalid email format rejected correctly")
    
    def test_register_short_password(self):
        """Registration should fail with password < 6 characters"""
        unique_email = f"test_shortpw_{int(time.time())}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "12345"  # Only 5 characters
        })
        
        assert response.status_code == 400, f"Expected 400 for short password, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "password" in data["detail"].lower() or "6" in data["detail"]
        print("✓ Short password rejected correctly")
    
    def test_register_duplicate_email(self):
        """Registration should fail for duplicate email"""
        # test@example.com is already registered per the test requirements
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "already" in data["detail"].lower() or "registered" in data["detail"].lower()
        print("✓ Duplicate email rejected correctly")


class TestAuthLogin:
    """Test POST /api/auth/login - User login"""
    
    def test_login_valid_credentials(self):
        """Login with valid test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "user" in data
        assert "token" in data
        assert "message" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == "test@example.com"
        assert "id" in user
        
        # Verify token
        assert len(data["token"]) > 0
        
        # Store token for subsequent tests
        TestAuthLogin.auth_token = data["token"]
        TestAuthLogin.user_id = user["id"]
        print(f"✓ Login success for test@example.com, user_id: {user['id']}")
        return data["token"]
    
    def test_login_invalid_email(self):
        """Login should fail with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()
        print("✓ Invalid email rejected correctly")
    
    def test_login_wrong_password(self):
        """Login should fail with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()
        print("✓ Wrong password rejected correctly")


class TestAuthProfile:
    """Test GET /api/auth/me - Get current user profile"""
    
    @pytest.fixture(autouse=True)
    def get_auth_token(self):
        """Get auth token before tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.user = response.json()["user"]
        else:
            pytest.skip("Could not login to get token")
    
    def test_get_profile_with_valid_token(self):
        """Get profile with valid Bearer token"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify profile data matches login user
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "trimester" in data
        assert "dietary_restrictions" in data
        assert isinstance(data["dietary_restrictions"], list)
        print(f"✓ Get profile success, trimester: {data.get('trimester')}, conditions: {data.get('dietary_restrictions')}")
    
    def test_get_profile_without_token(self):
        """Get profile without token should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated request rejected correctly")
    
    def test_get_profile_invalid_token(self):
        """Get profile with invalid token should fail"""
        headers = {"Authorization": "Bearer invalidtoken123"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid token rejected correctly")


class TestAuthProfileUpdate:
    """Test PUT /api/auth/profile - Update user profile"""
    
    @pytest.fixture(autouse=True)
    def get_auth_token(self):
        """Get auth token before tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.original_user = response.json()["user"]
        else:
            pytest.skip("Could not login to get token")
    
    def test_update_profile_trimester(self):
        """Update user trimester"""
        headers = {"Authorization": f"Bearer {self.token}"}
        new_trimester = 3
        
        response = requests.put(f"{BASE_URL}/api/auth/profile", 
            headers=headers,
            json={"trimester": new_trimester}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["trimester"] == new_trimester
        
        # Verify persistence - GET profile to confirm
        get_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert get_response.status_code == 200
        persisted = get_response.json()
        assert persisted["trimester"] == new_trimester
        print(f"✓ Update profile trimester to {new_trimester} - verified persistence")
    
    def test_update_profile_dietary_restrictions(self):
        """Update user dietary restrictions"""
        headers = {"Authorization": f"Bearer {self.token}"}
        new_restrictions = ["vegetarian", "gluten-free", "gestational-diabetes"]
        
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            headers=headers,
            json={"dietary_restrictions": new_restrictions}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert set(data["dietary_restrictions"]) == set(new_restrictions)
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        persisted = get_response.json()
        assert set(persisted["dietary_restrictions"]) == set(new_restrictions)
        print(f"✓ Update dietary restrictions - verified persistence")
    
    def test_update_profile_without_token(self):
        """Update profile without token should fail"""
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            json={"trimester": 1}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated update rejected correctly")


class TestPersonalizedFoods:
    """Test personalized foods API with auto-highlight"""
    
    @pytest.fixture(autouse=True)
    def get_auth_token(self):
        """Get auth token before tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.user = response.json()["user"]
        else:
            pytest.skip("Could not login to get token")
    
    def test_personalized_foods_with_conditions(self):
        """Test personalized foods API returns is_recommended and should_limit flags"""
        # User has anemia and vegetarian conditions per test requirements
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": ["anemia", "vegetarian"],
            "trimester": 2
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "foods" in data
        assert len(data["foods"]) > 0
        
        # Check that some foods have is_recommended or should_limit flags
        has_recommended = any(f.get("is_recommended") for f in data["foods"])
        has_limit = any(f.get("should_limit") for f in data["foods"])
        
        print(f"✓ Personalized foods API working: {len(data['foods'])} foods, recommended: {has_recommended}, limit_flags: {has_limit}")
        
        # Check for iron-rich recommendations for anemia
        recommended_foods = [f for f in data["foods"] if f.get("is_recommended")]
        print(f"  Recommended foods count: {len(recommended_foods)}")
    
    def test_personalized_foods_without_conditions(self):
        """Test personalized foods API with no conditions"""
        response = requests.post(f"{BASE_URL}/api/foods/personalized", json={
            "health_conditions": [],
            "trimester": 1
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "foods" in data
        print(f"✓ Personalized foods without conditions: {len(data['foods'])} foods returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
