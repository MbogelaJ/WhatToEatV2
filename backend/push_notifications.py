"""
Push Notification Service for NurtureNote
Uses Firebase Cloud Messaging HTTP v1 API with APNs production environment
Timezone: Africa/Dar_es_Salaam
Daily notifications at 3:00 PM
"""

import os
import json
import logging
import requests
from datetime import datetime
from typing import List, Optional
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import pytz

logger = logging.getLogger(__name__)

# Timezone configuration
TIMEZONE = pytz.timezone('Africa/Dar_es_Salaam')

# FCM HTTP v1 API endpoint
FCM_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

# Trimester-based daily pregnancy nutrition tips
# Educational, non-medical advice format
# Rotates daily, repeats after full set is completed

FIRST_TRIMESTER_TIPS = [
    {
        "title": "First Trimester: Folate Focus",
        "body": "Folate is extensively discussed in early pregnancy nutrition literature. Leafy greens, legumes, and fortified cereals are commonly noted sources.",
        "data": {"screen": "topics", "query": "folate"}
    },
    {
        "title": "First Trimester: Hydration Matters",
        "body": "Adequate hydration is commonly referenced in prenatal guidance. Keeping water accessible throughout the day is often suggested.",
        "data": {"screen": "topics", "query": "water"}
    },
    {
        "title": "First Trimester: Small Meals",
        "body": "Nutrition literature often discusses small, frequent meals during early pregnancy when appetite changes may occur.",
        "data": {"screen": "topics", "query": "morning sickness"}
    },
    {
        "title": "First Trimester: Iron Foundations",
        "body": "Iron needs are discussed in prenatal literature. Lean meats, beans, and fortified cereals are commonly noted sources.",
        "data": {"screen": "topics", "query": "iron"}
    },
    {
        "title": "First Trimester: Vitamin B6",
        "body": "Vitamin B6 is found in foods like chicken, fish, potatoes, and bananas. It's commonly discussed in early pregnancy nutrition.",
        "data": {"screen": "food", "foodId": "37"}
    },
    {
        "title": "First Trimester: Ginger Information",
        "body": "Ginger is often discussed in pregnancy literature regarding digestive comfort. It can be used in teas or cooking.",
        "data": {"screen": "food", "foodId": "76"}
    },
    {
        "title": "First Trimester: Protein Basics",
        "body": "Protein needs are discussed as important throughout pregnancy. Eggs, lean meats, and legumes are commonly noted sources.",
        "data": {"screen": "topics", "query": "protein"}
    },
    {
        "title": "First Trimester: Citrus & Vitamin C",
        "body": "Vitamin C from citrus fruits may help with iron absorption, as noted in nutrition literature.",
        "data": {"screen": "food", "foodId": "38"}
    },
    {
        "title": "First Trimester: Whole Grains",
        "body": "Whole grains are referenced in prenatal nutrition materials for their fiber and B vitamin content.",
        "data": {"screen": "food", "foodId": "69"}
    },
    {
        "title": "First Trimester: Food Safety Basics",
        "body": "Food safety is an important topic in early pregnancy. Learn which foods are commonly discussed in guidance.",
        "data": {"screen": "home"}
    },
]

SECOND_TRIMESTER_TIPS = [
    {
        "title": "Second Trimester: Calcium Corner",
        "body": "Calcium needs are discussed in mid-pregnancy nutrition literature. Dairy, fortified plant milks, and leafy greens are noted sources.",
        "data": {"screen": "topics", "query": "calcium"}
    },
    {
        "title": "Second Trimester: Omega-3 Focus",
        "body": "Omega-3 fatty acids, especially DHA, are frequently referenced in prenatal nutrition. Fatty fish like salmon are commonly noted.",
        "data": {"screen": "food", "foodId": "1"}
    },
    {
        "title": "Second Trimester: Iron Boost",
        "body": "Iron needs increase as pregnancy progresses, according to nutrition literature. Consider iron-rich food combinations.",
        "data": {"screen": "topics", "query": "iron"}
    },
    {
        "title": "Second Trimester: Protein Power",
        "body": "Protein requirements are discussed as increasing during the second trimester. Explore various protein sources in our database.",
        "data": {"screen": "topics", "query": "protein"}
    },
    {
        "title": "Second Trimester: Vitamin D",
        "body": "Vitamin D is discussed in nutrition literature for supporting calcium absorption. Sunlight and fortified foods are noted sources.",
        "data": {"screen": "topics", "query": "vitamin d"}
    },
    {
        "title": "Second Trimester: Fiber Friends",
        "body": "Fiber from fruits, vegetables, and whole grains is commonly discussed in general prenatal nutrition guidance.",
        "data": {"screen": "food", "foodId": "47"}
    },
    {
        "title": "Second Trimester: Healthy Fats",
        "body": "Healthy fats from avocados, nuts, and olive oil are referenced in nutrition literature for their nutrient density.",
        "data": {"screen": "food", "foodId": "36"}
    },
    {
        "title": "Second Trimester: Magnesium Matters",
        "body": "Magnesium is found in nuts, seeds, whole grains, and leafy greens. It's discussed in prenatal nutrition materials.",
        "data": {"screen": "food", "foodId": "33"}
    },
    {
        "title": "Second Trimester: Seafood Savvy",
        "body": "Fish and seafood provide omega-3s and protein. Learn about lower-mercury options noted in public health guidance.",
        "data": {"screen": "category", "category": "Fish & Seafood"}
    },
    {
        "title": "Second Trimester: Snack Smart",
        "body": "Nutritious snacking can help meet increased nutrient needs. Explore snack ideas from our food database.",
        "data": {"screen": "home"}
    },
]

THIRD_TRIMESTER_TIPS = [
    {
        "title": "Third Trimester: Energy Foods",
        "body": "Complex carbohydrates from whole grains provide sustained energy, as noted in nutrition literature.",
        "data": {"screen": "food", "foodId": "69"}
    },
    {
        "title": "Third Trimester: Iron Importance",
        "body": "Iron needs are discussed as highest in late pregnancy. Combining iron-rich foods with vitamin C may enhance absorption.",
        "data": {"screen": "topics", "query": "iron"}
    },
    {
        "title": "Third Trimester: Protein Needs",
        "body": "Protein requirements continue to be important in the third trimester according to nutrition literature.",
        "data": {"screen": "topics", "query": "protein"}
    },
    {
        "title": "Third Trimester: Stay Hydrated",
        "body": "Adequate hydration remains important throughout pregnancy. Water and hydrating foods like watermelon are noted options.",
        "data": {"screen": "food", "foodId": "43"}
    },
    {
        "title": "Third Trimester: Calcium Continues",
        "body": "Calcium needs remain important for bone development, as discussed in prenatal nutrition guidance.",
        "data": {"screen": "topics", "query": "calcium"}
    },
    {
        "title": "Third Trimester: Omega-3 DHA",
        "body": "DHA is discussed in nutrition literature regarding brain development. Fatty fish remain a commonly noted source.",
        "data": {"screen": "food", "foodId": "1"}
    },
    {
        "title": "Third Trimester: Small Frequent Meals",
        "body": "As space becomes limited, smaller meals are often discussed in late pregnancy nutrition guidance.",
        "data": {"screen": "home"}
    },
    {
        "title": "Third Trimester: Fiber Focus",
        "body": "Fiber from fruits, vegetables, and whole grains is commonly discussed in third trimester nutrition materials.",
        "data": {"screen": "food", "foodId": "46"}
    },
    {
        "title": "Third Trimester: Potassium Power",
        "body": "Potassium-rich foods like bananas and sweet potatoes are referenced in general nutrition guidance.",
        "data": {"screen": "food", "foodId": "50"}
    },
    {
        "title": "Third Trimester: Final Preparations",
        "body": "Maintaining balanced nutrition throughout late pregnancy is commonly emphasized in prenatal literature.",
        "data": {"screen": "home"}
    },
]

# Combined tips list for rotation
ALL_TIPS = FIRST_TRIMESTER_TIPS + SECOND_TRIMESTER_TIPS + THIRD_TRIMESTER_TIPS


class FCMService:
    """Firebase Cloud Messaging Service using HTTP v1 API"""
    
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path or os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        self.project_id = None
        self.credentials = None
        self._initialize_credentials()
    
    def _initialize_credentials(self):
        """Initialize Google service account credentials"""
        if not self.credentials_path:
            logger.warning("FCM credentials path not set. Push notifications will be disabled.")
            return
        
        try:
            if os.path.exists(self.credentials_path):
                with open(self.credentials_path, 'r') as f:
                    creds_data = json.load(f)
                    self.project_id = creds_data.get('project_id')
                
                self.credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=['https://www.googleapis.com/auth/firebase.messaging']
                )
                logger.info(f"FCM credentials loaded for project: {self.project_id}")
            else:
                logger.warning(f"FCM credentials file not found: {self.credentials_path}")
        except Exception as e:
            logger.error(f"Error loading FCM credentials: {e}")
    
    def _get_access_token(self) -> Optional[str]:
        """Get OAuth2 access token for FCM API"""
        if not self.credentials:
            return None
        
        try:
            if self.credentials.expired or not self.credentials.token:
                self.credentials.refresh(Request())
            return self.credentials.token
        except Exception as e:
            logger.error(f"Error refreshing FCM access token: {e}")
            return None
    
    def send_notification(self, token: str, title: str, body: str, data: dict = None) -> dict:
        """
        Send push notification to a single device using FCM HTTP v1 API
        Uses production APNs environment
        
        Args:
            token: Device FCM token
            title: Notification title
            body: Notification body
            data: Optional data payload
        
        Returns:
            dict with success status and message_id or error
        """
        if not self.project_id or not self.credentials:
            return {"success": False, "error": "FCM not configured"}
        
        access_token = self._get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}
        
        url = FCM_URL.format(project_id=self.project_id)
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Build message payload with production APNs
        message = {
            "message": {
                "token": token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "apns": {
                    "payload": {
                        "aps": {
                            "alert": {
                                "title": title,
                                "body": body
                            },
                            "badge": 1,
                            "sound": "default"
                        }
                    },
                    "headers": {
                        "apns-priority": "10",
                        "apns-push-type": "alert"
                    }
                }
            }
        }
        
        # Add data payload if provided
        if data:
            message["message"]["data"] = {k: str(v) for k, v in data.items()}
        
        try:
            response = requests.post(url, headers=headers, json=message, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Notification sent successfully: {result.get('name')}")
                return {"success": True, "message_id": result.get("name")}
            else:
                error_data = response.json()
                error_details = error_data.get("error", {})
                error_code = error_details.get("code")
                error_message = error_details.get("message", "Unknown error")
                error_status = error_details.get("status", "")
                
                logger.error(f"FCM error: {error_code} - {error_message}")
                
                # Detect invalid/unregistered tokens
                is_invalid = (
                    error_status == "NOT_FOUND" or
                    error_status == "UNREGISTERED" or
                    "not a valid FCM registration token" in error_message.lower() or
                    "requested entity was not found" in error_message.lower()
                )
                
                return {
                    "success": False,
                    "error": error_message,
                    "error_code": error_code,
                    "invalid_token": is_invalid
                }
                
        except requests.exceptions.Timeout:
            logger.error("FCM request timeout")
            return {"success": False, "error": "Request timeout"}
        except Exception as e:
            logger.error(f"FCM request error: {e}")
            return {"success": False, "error": str(e)}
    
    def send_multicast(self, tokens: List[str], title: str, body: str, data: dict = None) -> dict:
        """
        Send push notification to multiple devices
        
        Args:
            tokens: List of device FCM tokens
            title: Notification title
            body: Notification body
            data: Optional data payload
        
        Returns:
            dict with success_count, failure_count, and invalid_tokens list
        """
        results = {
            "success_count": 0,
            "failure_count": 0,
            "invalid_tokens": [],
            "errors": []
        }
        
        for token in tokens:
            result = self.send_notification(token, title, body, data)
            
            if result.get("success"):
                results["success_count"] += 1
            else:
                results["failure_count"] += 1
                if result.get("invalid_token"):
                    results["invalid_tokens"].append(token)
                results["errors"].append({
                    "token": token[:20] + "..." if len(token) > 20 else token,
                    "error": result.get("error")
                })
        
        return results


def get_daily_tip(trimester: Optional[int] = None) -> dict:
    """
    Get the daily tip based on current date
    Rotates through all tips daily, repeats after full set is completed
    
    Args:
        trimester: Optional trimester filter (1, 2, or 3)
                  If None, rotates through all tips
    
    Returns:
        dict with title, body, and data for the notification
    """
    now = datetime.now(TIMEZONE)
    day_of_year = now.timetuple().tm_yday
    
    if trimester == 1:
        tips = FIRST_TRIMESTER_TIPS
    elif trimester == 2:
        tips = SECOND_TRIMESTER_TIPS
    elif trimester == 3:
        tips = THIRD_TRIMESTER_TIPS
    else:
        tips = ALL_TIPS
    
    tip_index = day_of_year % len(tips)
    return tips[tip_index]


def get_tip_by_index(index: int) -> dict:
    """Get a specific tip by index (for testing)"""
    return ALL_TIPS[index % len(ALL_TIPS)]


# Singleton instance - initialized when imported
fcm_service = None

def get_fcm_service() -> FCMService:
    """Get or create FCM service singleton"""
    global fcm_service
    if fcm_service is None:
        fcm_service = FCMService()
    return fcm_service
