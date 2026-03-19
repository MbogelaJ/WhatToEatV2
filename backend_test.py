#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NutriSearchAPITester:
    def __init__(self, base_url="https://food-query-patch.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                try:
                    response_json = response.json()
                    if endpoint == "foods/search" and "foods" in response_json:
                        print(f"   Found {len(response_json['foods'])} foods, total: {response_json.get('total', 0)}")
                    elif endpoint.startswith("search-history"):
                        print(f"   History entries: {len(response_json) if isinstance(response_json, list) else 'N/A'}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")

            self.results.append({
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:200] if response.text else ""
            })

            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out (30s)")
            self.results.append({
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "TIMEOUT",
                "success": False,
                "error": "Timeout after 30 seconds"
            })
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error (server may be down)")
            self.results.append({
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "CONNECTION_ERROR",
                "success": False,
                "error": "Connection error"
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.results.append({
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_food_search_apple(self):
        """Test searching for apple"""
        return self.run_test(
            "Food Search - Apple",
            "GET",
            "foods/search",
            200,
            params={"query": "apple", "page": 1, "page_size": 20}
        )

    def test_food_search_chicken(self):
        """Test searching for chicken"""
        return self.run_test(
            "Food Search - Chicken",
            "GET",
            "foods/search",
            200,
            params={"query": "chicken", "page": 1, "page_size": 20}
        )

    def test_food_search_pasta(self):
        """Test searching for pasta"""
        return self.run_test(
            "Food Search - Pasta",
            "GET",
            "foods/search",
            200,
            params={"query": "pasta", "page": 1, "page_size": 20}
        )

    def test_empty_search(self):
        """Test empty search query"""
        return self.run_test(
            "Empty Search Query",
            "GET",
            "foods/search",
            200,
            params={"query": "", "page": 1, "page_size": 20}
        )

    def test_search_history(self):
        """Test getting search history"""
        return self.run_test(
            "Search History",
            "GET", 
            "search-history",
            200,
            params={"limit": 10}
        )

    def test_food_detail_by_id(self):
        """Test getting food details by ID - first search for an apple, then get its details"""
        # First get an apple search result to get a valid food ID
        search_success, search_data = self.test_food_search_apple()
        
        if search_success and search_data.get('foods') and len(search_data['foods']) > 0:
            food_id = search_data['foods'][0]['id']
            print(f"   Testing with food ID: {food_id}")
            return self.run_test(
                f"Food Detail by ID ({food_id})",
                "GET",
                f"foods/{food_id}",
                200
            )
        else:
            print(f"❌ Skipped - No valid food ID available from search")
            return False, {}

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting NutriSearch API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 50)

        # Basic endpoint tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Core functionality tests
        self.test_food_search_apple()
        self.test_food_search_chicken()
        self.test_food_search_pasta()
        self.test_empty_search()
        
        # Additional features
        self.test_search_history()
        self.test_food_detail_by_id()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            failed_tests = [r for r in self.results if not r['success']]
            print(f"\n❌ Failed tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test.get('error', 'Status mismatch')}")
            return 1

def main():
    tester = NutriSearchAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())