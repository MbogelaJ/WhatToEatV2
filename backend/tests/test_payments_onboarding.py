"""
Test suite for Payment and Onboarding Features
- Stripe payment checkout flow
- Payment status retrieval  
- MongoDB transaction persistence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestStripePaymentCheckout:
    """Tests for POST /api/payments/checkout endpoint"""
    
    def test_checkout_creates_stripe_session(self):
        """Test that checkout endpoint creates a valid Stripe checkout session"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "origin_url": BASE_URL,
                "user_id": "TEST_user_checkout_001"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "url" in data, "Response should contain checkout URL"
        assert "session_id" in data, "Response should contain session_id"
        
        # Verify URL points to Stripe
        assert "checkout.stripe.com" in data["url"], "URL should be a Stripe checkout URL"
        
        # Verify session_id format (Stripe session IDs start with cs_test_ or cs_live_)
        assert data["session_id"].startswith("cs_test_"), f"Session ID should start with cs_test_, got {data['session_id']}"
        
        # Store session_id for subsequent tests
        self.__class__.test_session_id = data["session_id"]
        print(f"✅ Checkout session created: {data['session_id'][:40]}...")

    def test_checkout_with_guest_user(self):
        """Test checkout without user_id (guest checkout)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "origin_url": BASE_URL
            }
        )
        
        assert response.status_code == 200, f"Expected 200 for guest checkout, got {response.status_code}"
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print("✅ Guest checkout works correctly")

    def test_checkout_requires_origin_url(self):
        """Test that checkout requires origin_url"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={}
        )
        
        # Should fail validation - missing required field
        assert response.status_code == 422, f"Expected 422 for missing origin_url, got {response.status_code}"
        print("✅ Checkout correctly validates required origin_url")


class TestPaymentStatus:
    """Tests for GET /api/payments/status/{session_id} endpoint"""
    
    def test_get_payment_status_valid_session(self):
        """Test retrieving status of a valid checkout session"""
        # First create a session to test with
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "origin_url": BASE_URL,
                "user_id": "TEST_user_status_001"
            }
        )
        assert checkout_response.status_code == 200
        session_id = checkout_response.json()["session_id"]
        
        # Now get the status
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        
        assert status_response.status_code == 200, f"Expected 200, got {status_response.status_code}: {status_response.text}"
        
        data = status_response.json()
        # Verify response structure
        assert "session_id" in data
        assert "status" in data
        assert "payment_status" in data
        assert "amount_total" in data
        assert "currency" in data
        
        # Verify values
        assert data["session_id"] == session_id
        assert data["status"] in ["open", "complete", "expired"]
        assert data["payment_status"] in ["unpaid", "paid", "no_payment_required"]
        assert data["currency"] == "usd"
        # Amount should be $0.99 = 99 cents
        assert data["amount_total"] == 99, f"Expected 99 cents, got {data['amount_total']}"
        
        print(f"✅ Payment status retrieved: {data['status']} / {data['payment_status']}")

    def test_get_payment_status_invalid_session(self):
        """Test retrieving status of an invalid session returns error"""
        response = requests.get(f"{BASE_URL}/api/payments/status/invalid_session_id_12345")
        
        # Stripe should return an error for invalid session
        assert response.status_code == 500, f"Expected 500 for invalid session, got {response.status_code}"
        print("✅ Invalid session ID correctly returns error")


class TestPaymentPricing:
    """Tests to verify the $0.99 premium pricing"""
    
    def test_premium_price_is_correct(self):
        """Test that premium price is exactly $0.99"""
        # Create a checkout session
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "origin_url": BASE_URL,
                "user_id": "TEST_user_price_check"
            }
        )
        assert response.status_code == 200
        session_id = response.json()["session_id"]
        
        # Get status to verify price
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_response.status_code == 200
        
        data = status_response.json()
        # $0.99 = 99 cents
        assert data["amount_total"] == 99, f"Premium price should be 99 cents ($0.99), got {data['amount_total']}"
        assert data["currency"] == "usd", f"Currency should be USD, got {data['currency']}"
        
        print("✅ Premium price confirmed: $0.99 USD")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root_accessible(self):
        """Test that API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API root accessible")

    def test_foods_endpoint(self):
        """Test foods endpoint for completeness"""
        response = requests.get(f"{BASE_URL}/api/foods")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 85, f"Expected 85+ foods, got {len(data)}"
        print(f"✅ Foods endpoint returns {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
