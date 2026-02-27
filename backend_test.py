import requests
import sys
from datetime import datetime

class PregnancyNutritionAPITester:
    def __init__(self, base_url="https://health-ed-guide.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, expected_content=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            
            if success and expected_content:
                response_data = response.json()
                for key, value in expected_content.items():
                    if key not in response_data:
                        success = False
                        print(f"❌ Failed - Missing key: {key}")
                        break
                    elif isinstance(value, str) and value not in str(response_data.get(key, "")):
                        success = False
                        print(f"❌ Failed - Expected '{value}' in field '{key}'")
                        break
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if method == 'GET' and response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   📋 Returned {len(data)} items")
                    elif isinstance(data, dict):
                        print(f"   📋 Returned data with keys: {list(data.keys())[:5]}")
            else:
                self.failed_tests.append(name)
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.status_code == 200 else {}

        except Exception as e:
            self.failed_tests.append(name)
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200,
            expected_content={"message": "NurtureNote"}
        )

    def test_get_all_foods(self):
        """Test getting all foods"""
        success, response = self.run_test(
            "Get All Foods",
            "GET",
            "foods",
            200
        )
        if success and len(response) > 0:
            sample_food = response[0]
            required_fields = ["id", "name", "category", "safety_level", "recommendation", "sources"]
            missing_fields = [field for field in required_fields if field not in sample_food]
            if missing_fields:
                print(f"⚠️  Warning: Missing fields in food data: {missing_fields}")
        return success

    def test_search_foods(self):
        """Test food search functionality"""
        return self.run_test(
            "Search Foods - General",
            "GET",
            "foods/search?q=salmon",
            200
        )

    def test_get_food_detail(self):
        """Test getting specific food details"""
        success, response = self.run_test(
            "Get Food Detail (Salmon)",
            "GET",
            "foods/1",
            200,
            expected_content={
                "name": "Salmon",
                "safety_level": "safe",
                "recommendation": "Generally considered beneficial"
            }
        )
        return success

    def test_foods_by_category(self):
        """Test getting foods by category"""
        return self.run_test(
            "Foods by Category",
            "GET",
            "foods/category/Fish",
            200
        )

    def test_foods_by_safety_level(self):
        """Test getting foods by safety level"""
        return self.run_test(
            "Foods by Safety Level (avoid)",
            "GET",
            "foods/safety/avoid",
            200
        )

    def test_qa_normal_question(self):
        """Test Q&A with normal nutrition question"""
        return self.run_test(
            "Q&A Normal Question",
            "POST",
            "qa/ask",
            200,
            data={"question": "What foods are high in folate?"},
            expected_content={
                "is_symptom_detected": False,
                "sources": ["WHO", "CDC", "NHS pregnancy nutrition guidance"]
            }
        )

    def test_qa_symptom_detection_bleeding(self):
        """Test Q&A symptom detection for bleeding"""
        return self.run_test(
            "Q&A Symptom Detection (bleeding)",
            "POST", 
            "qa/ask",
            200,
            data={"question": "I'm having bleeding, what should I do?"},
            expected_content={
                "is_symptom_detected": True,
                "answer": "We cannot assess symptoms"
            }
        )

    def test_qa_symptom_detection_fever(self):
        """Test Q&A symptom detection for fever"""
        return self.run_test(
            "Q&A Symptom Detection (fever)",
            "POST",
            "qa/ask", 
            200,
            data={"question": "I have a fever during pregnancy"},
            expected_content={
                "is_symptom_detected": True,
                "answer": "We cannot assess symptoms"
            }
        )

    def test_qa_symptom_detection_pain(self):
        """Test Q&A symptom detection for severe pain"""
        return self.run_test(
            "Q&A Symptom Detection (severe pain)",
            "POST",
            "qa/ask",
            200,
            data={"question": "I'm experiencing severe pain in my abdomen"},
            expected_content={
                "is_symptom_detected": True,
                "answer": "We cannot assess symptoms"
            }
        )

    def test_get_categories(self):
        """Test getting food categories"""
        return self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )

    def test_get_about(self):
        """Test about endpoint"""
        return self.run_test(
            "Get About Info",
            "GET",
            "about",
            200,
            expected_content={
                "app_name": "NurtureNote",
                "purpose": "Educational",
                "data_sources": ["WHO", "CDC", "NHS", "ACOG"]
            }
        )

    def test_get_emergency_info(self):
        """Test emergency info endpoint"""
        return self.run_test(
            "Get Emergency Info",
            "GET",
            "emergency-info",
            200,
            expected_content={
                "title": "When to Seek Medical Care",
                "symptoms": []
            }
        )

def main():
    """Run all tests"""
    print("🏥 Starting Pregnancy Nutrition App API Tests")
    print("="*60)
    
    tester = PregnancyNutritionAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_get_all_foods,
        tester.test_search_foods,
        tester.test_get_food_detail,
        tester.test_foods_by_category,
        tester.test_foods_by_safety_level,
        tester.test_qa_normal_question,
        tester.test_qa_symptom_detection_bleeding,
        tester.test_qa_symptom_detection_fever,
        tester.test_qa_symptom_detection_pain,
        tester.test_get_categories,
        tester.test_get_about,
        tester.test_get_emergency_info
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            tester.failed_tests.append(test.__name__)
    
    # Print summary
    print("\n" + "="*60)
    print(f"📊 Test Summary:")
    print(f"   Total tests: {tester.tests_run}")
    print(f"   Passed: {tester.tests_passed}")
    print(f"   Failed: {len(tester.failed_tests)}")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests:")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n📈 Success rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())