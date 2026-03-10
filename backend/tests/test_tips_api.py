"""
Test suite for Daily Tips API endpoints
Tests: GET /api/tips/today, GET /api/tips/all, GET /api/tips/{index}, GET /api/about
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTipsToday:
    """Tests for GET /api/tips/today endpoint"""

    def test_get_today_tip_no_trimester(self):
        """Get today's tip without trimester filter - should return tip with full structure"""
        response = requests.get(f"{BASE_URL}/api/tips/today")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tip" in data, "Response should contain 'tip' key"
        
        # Verify tip structure
        tip = data["tip"]
        assert "title" in tip, "Tip should have 'title'"
        assert "body" in tip, "Tip should have 'body'"
        assert "expanded_content" in tip, "Tip should have 'expanded_content'"
        assert "sources" in tip, "Tip should have 'sources'"
        assert isinstance(tip["sources"], list), "Sources should be a list"
        assert len(tip["sources"]) > 0, "Sources should not be empty"
        
        # Verify disclaimer is present
        assert "disclaimer" in data, "Response should contain disclaimer"
        print(f"SUCCESS: GET /api/tips/today - returned tip: {tip['title']}")

    def test_get_today_tip_first_trimester(self):
        """Get today's tip for first trimester"""
        response = requests.get(f"{BASE_URL}/api/tips/today?trimester=1")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["trimester_filter"] == 1, "Trimester filter should be 1"
        assert "tip" in data
        print(f"SUCCESS: GET /api/tips/today?trimester=1 - tip: {data['tip']['body'][:50]}...")

    def test_get_today_tip_second_trimester(self):
        """Get today's tip for second trimester"""
        response = requests.get(f"{BASE_URL}/api/tips/today?trimester=2")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["trimester_filter"] == 2
        print(f"SUCCESS: GET /api/tips/today?trimester=2 - tip: {data['tip']['body'][:50]}...")

    def test_get_today_tip_third_trimester(self):
        """Get today's tip for third trimester"""
        response = requests.get(f"{BASE_URL}/api/tips/today?trimester=3")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["trimester_filter"] == 3
        print(f"SUCCESS: GET /api/tips/today?trimester=3 - tip: {data['tip']['body'][:50]}...")

    def test_get_today_tip_invalid_trimester(self):
        """Invalid trimester should return 400"""
        response = requests.get(f"{BASE_URL}/api/tips/today?trimester=5")
        assert response.status_code == 400, f"Expected 400 for invalid trimester, got {response.status_code}"
        print("SUCCESS: Invalid trimester returns 400")


class TestTipsAll:
    """Tests for GET /api/tips/all endpoint"""

    def test_get_all_tips_no_filter(self):
        """Get all tips without filter - should return 30 tips"""
        response = requests.get(f"{BASE_URL}/api/tips/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tips" in data, "Response should contain 'tips' key"
        assert "counts" in data, "Response should contain 'counts' key"
        
        # Verify counts structure
        counts = data["counts"]
        assert counts["first_trimester"] == 10, "Should have 10 first trimester tips"
        assert counts["second_trimester"] == 10, "Should have 10 second trimester tips"
        assert counts["third_trimester"] == 10, "Should have 10 third trimester tips"
        assert counts["total"] == 30, "Total should be 30 tips"
        
        # Verify tips list
        tips = data["tips"]
        assert len(tips) == 30, f"Expected 30 tips, got {len(tips)}"
        
        # Verify each tip has required structure
        for tip in tips:
            assert "title" in tip, "Each tip should have title"
            assert "body" in tip, "Each tip should have body"
            assert "expanded_content" in tip, "Each tip should have expanded_content"
            assert "sources" in tip, "Each tip should have sources"
        
        print(f"SUCCESS: GET /api/tips/all - returned {len(tips)} tips")

    def test_get_all_tips_first_trimester(self):
        """Get first trimester tips - should return 10 tips"""
        response = requests.get(f"{BASE_URL}/api/tips/all?trimester=1")
        assert response.status_code == 200
        
        data = response.json()
        tips = data["tips"]
        assert len(tips) == 10, f"Expected 10 first trimester tips, got {len(tips)}"
        assert data["trimester_filter"] == 1
        print(f"SUCCESS: GET /api/tips/all?trimester=1 - returned {len(tips)} tips")

    def test_get_all_tips_second_trimester(self):
        """Get second trimester tips - should return 10 tips"""
        response = requests.get(f"{BASE_URL}/api/tips/all?trimester=2")
        assert response.status_code == 200
        
        data = response.json()
        tips = data["tips"]
        assert len(tips) == 10, f"Expected 10 second trimester tips, got {len(tips)}"
        print(f"SUCCESS: GET /api/tips/all?trimester=2 - returned {len(tips)} tips")

    def test_get_all_tips_third_trimester(self):
        """Get third trimester tips - should return 10 tips"""
        response = requests.get(f"{BASE_URL}/api/tips/all?trimester=3")
        assert response.status_code == 200
        
        data = response.json()
        tips = data["tips"]
        assert len(tips) == 10, f"Expected 10 third trimester tips, got {len(tips)}"
        print(f"SUCCESS: GET /api/tips/all?trimester=3 - returned {len(tips)} tips")


class TestTipsByIndex:
    """Tests for GET /api/tips/{index} endpoint"""

    def test_get_tip_by_index_zero(self):
        """Get first tip (index 0)"""
        response = requests.get(f"{BASE_URL}/api/tips/0")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tip" in data
        assert data["tip_index"] == 0
        assert "total_tips" in data
        print(f"SUCCESS: GET /api/tips/0 - tip: {data['tip']['body'][:50]}...")

    def test_get_tip_by_index_with_trimester(self):
        """Get tip by index with trimester filter"""
        response = requests.get(f"{BASE_URL}/api/tips/5?trimester=2")
        assert response.status_code == 200
        
        data = response.json()
        assert data["trimester_filter"] == 2
        assert "tip" in data
        assert data["total_tips"] == 10  # Should be 10 for single trimester
        print(f"SUCCESS: GET /api/tips/5?trimester=2 - returned tip index {data['tip_index']}")

    def test_get_tip_by_large_index(self):
        """Large index should wrap around (modulo)"""
        response = requests.get(f"{BASE_URL}/api/tips/100")
        assert response.status_code == 200
        
        data = response.json()
        # Index 100 % 30 = 10
        assert data["tip_index"] == 100 % 30, f"Expected index {100 % 30}, got {data['tip_index']}"
        print(f"SUCCESS: GET /api/tips/100 - wraps to index {data['tip_index']}")


class TestAboutEndpoint:
    """Tests for GET /api/about endpoint"""

    def test_get_about_returns_whattoeat(self):
        """About endpoint should return WhatToEat app name"""
        response = requests.get(f"{BASE_URL}/api/about")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify app name is WhatToEat
        assert "app_name" in data, "Response should contain 'app_name'"
        assert data["app_name"] == "WhatToEat", f"App name should be 'WhatToEat', got '{data['app_name']}'"
        
        # Verify description mentions WhatToEat
        assert "description" in data, "Response should contain 'description'"
        assert "WhatToEat" in data["description"], "Description should mention WhatToEat"
        
        # Verify other expected fields
        assert "version" in data, "Should have version"
        assert "disclaimer" in data, "Should have disclaimer"
        assert "non_medical_statement" in data, "Should have non_medical_statement"
        
        # Check non_medical_statement also has WhatToEat
        assert "WhatToEat" in data["non_medical_statement"], "Non-medical statement should mention WhatToEat"
        
        print(f"SUCCESS: GET /api/about - app_name is '{data['app_name']}'")


class TestAPIRoot:
    """Tests for API root endpoint"""

    def test_api_root_returns_whattoeat(self):
        """API root should return WhatToEat message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "WhatToEat" in data["message"], f"Message should contain 'WhatToEat', got: {data['message']}"
        print(f"SUCCESS: GET /api/ - message: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
