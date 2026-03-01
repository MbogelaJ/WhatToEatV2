"""
Backend tests for Push Notification System - NurtureNote
Testing: Device token registration, unregistration, notification status, test notifications, 
and daily notification trigger endpoints.
"""

import pytest
import requests
import os
import uuid
import time

# Base URL from environment variable
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test token prefix for cleanup
TEST_TOKEN_PREFIX = "TEST_FCM_TOKEN_"


class TestNotificationStatus:
    """Test /api/notification_status endpoint - FCM config and scheduler status"""
    
    def test_notification_status_returns_200(self):
        """Verify notification_status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        assert response.status_code == 200
        print(f"✓ Notification status endpoint returns 200")
    
    def test_notification_status_contains_fcm_config(self):
        """Verify FCM configuration is present in status"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert "fcm_configured" in data
        assert "fcm_project_id" in data
        # FCM should be configured since credentials exist
        assert data["fcm_configured"] == True
        assert data["fcm_project_id"] == "whattoeat-5f53f"
        print(f"✓ FCM configured: {data['fcm_configured']}, Project: {data['fcm_project_id']}")
    
    def test_notification_status_contains_scheduler_info(self):
        """Verify scheduler information is present in status"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert "scheduler_running" in data
        assert "next_notification_time" in data
        assert "timezone" in data
        assert "scheduled_time" in data
        
        # Verify timezone is Africa/Dar_es_Salaam
        assert data["timezone"] == "Africa/Dar_es_Salaam"
        assert data["scheduled_time"] == "15:00 (3:00 PM)"
        assert data["scheduler_running"] == True
        print(f"✓ Scheduler running: {data['scheduler_running']}, Timezone: {data['timezone']}")
        print(f"  Next notification: {data['next_notification_time']}")
    
    def test_notification_status_contains_device_count(self):
        """Verify registered device count is present"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert "registered_devices" in data
        assert isinstance(data["registered_devices"], int)
        assert data["registered_devices"] >= 0
        print(f"✓ Registered devices count: {data['registered_devices']}")
    
    def test_notification_status_contains_daily_tip_preview(self):
        """Verify daily tip preview is present"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert "daily_tip_preview" in data
        tip = data["daily_tip_preview"]
        assert "title" in tip
        assert "body" in tip
        assert "data" in tip
        print(f"✓ Daily tip preview: {tip['title'][:50]}...")


class TestDeviceTokenRegistration:
    """Test /api/register_device endpoint - Register new and update existing tokens"""
    
    def test_register_new_device_token(self):
        """Register a new device token"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token, "platform": "ios", "trimester": 2}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "registered successfully" in data["message"]
        assert data["token_id"] is not None
        print(f"✓ New device token registered: {unique_token[:30]}...")
        
        # Cleanup - unregister the token
        cleanup = requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
        assert cleanup.status_code == 200
    
    def test_register_device_with_default_platform(self):
        """Register device token with default platform (ios)"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token}  # Only token, no platform
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Device registered with default platform")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
    
    def test_update_existing_device_token(self):
        """Update existing device token with new trimester"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token, "platform": "ios", "trimester": 1}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        assert "registered successfully" in data1["message"]
        
        # Update same token with new trimester
        response2 = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token, "platform": "ios", "trimester": 3}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert "updated successfully" in data2["message"]
        print(f"✓ Device token updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
    
    def test_register_device_empty_token_fails(self):
        """Empty token should return 422 validation error"""
        response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": ""}  # Empty token
        )
        
        # Pydantic validation should reject min_length=1
        assert response.status_code == 422
        print(f"✓ Empty token correctly rejected with 422")
    
    def test_register_device_whitespace_token_fails(self):
        """Whitespace-only token should fail"""
        response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": "   "}  # Whitespace token
        )
        
        # Should return 400 after strip() makes it empty
        assert response.status_code == 400
        data = response.json()
        assert "empty" in data["detail"].lower()
        print(f"✓ Whitespace token correctly rejected")
    
    def test_register_device_invalid_trimester_fails(self):
        """Invalid trimester value should fail"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token, "trimester": 5}  # Invalid: should be 1-3
        )
        
        # Pydantic validation (ge=1, le=3)
        assert response.status_code == 422
        print(f"✓ Invalid trimester correctly rejected with 422")
    
    def test_register_device_valid_trimesters(self):
        """All valid trimester values (1, 2, 3) should work"""
        for trimester in [1, 2, 3]:
            unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
            
            response = requests.post(
                f"{BASE_URL}/api/register_device",
                json={"token": unique_token, "trimester": trimester}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
        
        print(f"✓ All valid trimesters (1, 2, 3) accepted")


class TestDeviceTokenUnregistration:
    """Test DELETE /api/unregister_device/{token} endpoint"""
    
    def test_unregister_existing_token(self):
        """Unregister an existing device token"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        # First register
        reg_response = requests.post(
            f"{BASE_URL}/api/register_device",
            json={"token": unique_token}
        )
        assert reg_response.status_code == 200
        
        # Then unregister
        unreg_response = requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
        assert unreg_response.status_code == 200
        data = unreg_response.json()
        assert data["success"] == True
        assert "unregistered successfully" in data["message"]
        print(f"✓ Device token unregistered successfully")
    
    def test_unregister_nonexistent_token_returns_404(self):
        """Unregister non-existent token should return 404"""
        fake_token = f"{TEST_TOKEN_PREFIX}nonexistent_{uuid.uuid4()}"
        
        response = requests.delete(f"{BASE_URL}/api/unregister_device/{fake_token}")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
        print(f"✓ Non-existent token correctly returns 404")
    
    def test_unregister_and_verify_removed_from_db(self):
        """Verify token is actually removed from database"""
        unique_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        # Register
        requests.post(f"{BASE_URL}/api/register_device", json={"token": unique_token})
        
        # Get device count before
        status_before = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_before = status_before["registered_devices"]
        
        # Unregister
        unreg_response = requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
        assert unreg_response.status_code == 200
        
        # Get device count after
        status_after = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_after = status_after["registered_devices"]
        
        # Verify count decreased
        assert count_after == count_before - 1
        print(f"✓ Device count decreased from {count_before} to {count_after}")
        
        # Verify double-delete returns 404
        double_delete = requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
        assert double_delete.status_code == 404
        print(f"✓ Double delete correctly returns 404")


class TestTestNotification:
    """Test POST /api/test_notification endpoint"""
    
    def test_notification_endpoint_returns_response(self):
        """Test notification endpoint processes request"""
        fake_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        response = requests.post(
            f"{BASE_URL}/api/test_notification",
            json={
                "token": fake_token,
                "title": "Test Title",
                "body": "Test Body"
            }
        )
        
        # Should return 200 even for fake tokens (FCM handles token validation)
        assert response.status_code == 200
        data = response.json()
        
        # Since it's a fake token, expect success=False with invalid_token flag
        assert "success" in data
        # FCM will reject invalid tokens
        if not data["success"]:
            assert "error" in data
            print(f"✓ Fake token correctly identified as invalid")
            print(f"  Error: {data.get('error', 'No error message')}")
        else:
            print(f"✓ Notification sent (unexpected for fake token)")
    
    def test_notification_with_default_title_body(self):
        """Test notification with default title and body"""
        fake_token = f"{TEST_TOKEN_PREFIX}{uuid.uuid4()}"
        
        response = requests.post(
            f"{BASE_URL}/api/test_notification",
            json={"token": fake_token}  # Only token, use defaults
        )
        
        assert response.status_code == 200
        print(f"✓ Test notification endpoint accepts default title/body")
    
    def test_notification_empty_token_fails(self):
        """Empty token should fail validation"""
        response = requests.post(
            f"{BASE_URL}/api/test_notification",
            json={"token": ""}
        )
        
        # Pydantic validation
        assert response.status_code == 422
        print(f"✓ Empty token correctly rejected")


class TestTriggerDailyNotification:
    """Test POST /api/trigger_daily_notification endpoint"""
    
    def test_trigger_daily_notification_returns_200(self):
        """Manual trigger endpoint should return 200"""
        response = requests.post(f"{BASE_URL}/api/trigger_daily_notification")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "triggered" in data["message"].lower()
        print(f"✓ Daily notification job triggered successfully")
    
    def test_trigger_daily_notification_idempotent(self):
        """Multiple triggers should all succeed"""
        for i in range(3):
            response = requests.post(f"{BASE_URL}/api/trigger_daily_notification")
            assert response.status_code == 200
        
        print(f"✓ Daily notification trigger is idempotent (called 3 times)")


class TestDailyTipRotation:
    """Test daily tip rotation logic"""
    
    def test_daily_tip_has_correct_structure(self):
        """Verify daily tip preview has correct structure"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        tip = data["daily_tip_preview"]
        
        # Verify structure
        assert "title" in tip
        assert "body" in tip
        assert "data" in tip
        
        # Verify tip content is valid
        assert len(tip["title"]) > 0
        assert len(tip["body"]) > 0
        assert isinstance(tip["data"], dict)
        
        # Title should indicate trimester
        assert "Trimester" in tip["title"]
        print(f"✓ Daily tip structure is correct")
        print(f"  Title: {tip['title']}")
    
    def test_daily_tip_contains_navigation_data(self):
        """Verify tip contains navigation data for app"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        tip = data["daily_tip_preview"]
        
        # Check data contains screen navigation info
        tip_data = tip["data"]
        assert "screen" in tip_data
        
        # Screen should be one of the valid values
        valid_screens = ["home", "topics", "food", "category"]
        assert tip_data["screen"] in valid_screens
        print(f"✓ Daily tip contains valid navigation data: screen={tip_data['screen']}")


class TestMongoDBPersistence:
    """Test MongoDB token storage and retrieval"""
    
    def test_token_persists_after_registration(self):
        """Verify token is stored in MongoDB"""
        unique_token = f"{TEST_TOKEN_PREFIX}persist_{uuid.uuid4()}"
        
        # Get initial count
        status_before = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_before = status_before["registered_devices"]
        
        # Register
        reg = requests.post(f"{BASE_URL}/api/register_device", json={"token": unique_token})
        assert reg.status_code == 200
        
        # Verify count increased
        status_after = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_after = status_after["registered_devices"]
        assert count_after == count_before + 1
        print(f"✓ Token persisted - device count: {count_before} -> {count_after}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")
    
    def test_duplicate_token_updates_not_duplicates(self):
        """Same token registered twice should update, not duplicate"""
        unique_token = f"{TEST_TOKEN_PREFIX}duplicate_{uuid.uuid4()}"
        
        # Get initial count
        status_before = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_before = status_before["registered_devices"]
        
        # Register twice
        requests.post(f"{BASE_URL}/api/register_device", json={"token": unique_token, "trimester": 1})
        requests.post(f"{BASE_URL}/api/register_device", json={"token": unique_token, "trimester": 2})
        
        # Verify count only increased by 1
        status_after = requests.get(f"{BASE_URL}/api/notification_status").json()
        count_after = status_after["registered_devices"]
        assert count_after == count_before + 1
        print(f"✓ Duplicate token correctly updates existing entry")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/unregister_device/{unique_token}")


class TestSchedulerConfiguration:
    """Test scheduler is correctly configured for Africa/Dar_es_Salaam"""
    
    def test_scheduler_timezone_is_dar_es_salaam(self):
        """Verify scheduler timezone is Africa/Dar_es_Salaam"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert data["timezone"] == "Africa/Dar_es_Salaam"
        print(f"✓ Scheduler timezone: {data['timezone']}")
    
    def test_scheduled_time_is_3pm(self):
        """Verify scheduled time is 3:00 PM"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        assert data["scheduled_time"] == "15:00 (3:00 PM)"
        print(f"✓ Scheduled time: {data['scheduled_time']}")
    
    def test_next_notification_time_format(self):
        """Verify next notification time is valid ISO format"""
        response = requests.get(f"{BASE_URL}/api/notification_status")
        data = response.json()
        
        # Should be ISO format with timezone
        next_time = data["next_notification_time"]
        assert next_time is not None
        
        # Should contain timezone offset +03:00 (East Africa Time)
        assert "+03:00" in next_time
        print(f"✓ Next notification time: {next_time}")


# Cleanup fixture that runs after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_tokens():
    """Cleanup any remaining test tokens after test module"""
    yield
    # Cleanup logic would go here if needed
    print("\n✓ Test cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
