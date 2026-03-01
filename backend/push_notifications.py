"""
Push Notification Service for NurtureNote
Uses Firebase Cloud Messaging HTTP v1 API with APNs production environment
Timezone: Africa/Dar_es_Salaam
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

# Daily nutrition tips for push notifications
DAILY_TIPS = [
    {
        "title": "Folate Focus",
        "body": "Leafy greens like spinach and kale are noted in nutrition literature as excellent sources of folate.",
        "data": {"screen": "topics", "query": "folate"}
    },
    {
        "title": "Hydration Reminder",
        "body": "Staying hydrated is commonly discussed in prenatal nutrition guidance. Consider keeping water nearby.",
        "data": {"screen": "topics", "query": "water"}
    },
    {
        "title": "Iron Insight",
        "body": "Iron needs are discussed in prenatal literature. Lean meats, beans, and fortified cereals are common sources.",
        "data": {"screen": "topics", "query": "iron"}
    },
    {
        "title": "Calcium Corner",
        "body": "Calcium is discussed in nutrition literature for bone health. Dairy, leafy greens, and fortified foods are noted sources.",
        "data": {"screen": "topics", "query": "calcium"}
    },
    {
        "title": "Omega-3 Information",
        "body": "Fatty fish like salmon are frequently referenced in public health guidance for omega-3 content.",
        "data": {"screen": "food", "foodId": "1"}
    },
    {
        "title": "Protein Pointers",
        "body": "Protein needs are discussed as typically increasing during pregnancy. Explore protein-rich food options.",
        "data": {"screen": "topics", "query": "protein"}
    },
    {
        "title": "Food Safety Note",
        "body": "Food safety is an important topic during pregnancy. Learn about foods commonly discussed in guidance.",
        "data": {"screen": "home"}
    },
    {
        "title": "Vitamin D Discovery",
        "body": "Vitamin D is discussed in nutrition literature for calcium absorption. Sunlight and fortified foods are noted sources.",
        "data": {"screen": "topics", "query": "vitamin d"}
    },
    {
        "title": "Fiber Focus",
        "body": "Fiber from fruits, vegetables, and whole grains is commonly discussed in general nutrition guidance.",
        "data": {"screen": "topics", "query": "fiber"}
    },
    {
        "title": "Healthy Snacking",
        "body": "Looking for snack ideas? Explore our food database for nutritious options noted in public health guidance.",
        "data": {"screen": "home"}
    },
    {
        "title": "Nutrition Knowledge",
        "body": "Browse our Sources & References section to learn about the public health organizations behind our information.",
        "data": {"screen": "sources"}
    },
    {
        "title": "Seafood Savvy",
        "body": "Fish and seafood are discussed in prenatal nutrition literature. Learn which varieties are commonly noted.",
        "data": {"screen": "category", "category": "Fish & Seafood"}
    },
    {
        "title": "Dairy Discussion",
        "body": "Dairy products are frequently referenced in nutrition guidance. Explore pasteurized options in our database.",
        "data": {"screen": "category", "category": "Dairy"}
    },
    {
        "title": "Vegetable Variety",
        "body": "Vegetables are commonly included in balanced diets. Discover nutritional information about various vegetables.",
        "data": {"screen": "category", "category": "Vegetables"}
    },
    {
        "title": "Fruit Facts",
        "body": "Fruits provide various nutrients noted in nutrition literature. Explore our fruit entries for more information.",
        "data": {"screen": "category", "category": "Fruits"}
    }
]


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
        
        # Build message payload
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
                        "apns-priority": "10"
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
                error_code = error_data.get("error", {}).get("code")
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                
                logger.error(f"FCM error: {error_code} - {error_message}")
                
                return {
                    "success": False,
                    "error": error_message,
                    "error_code": error_code,
                    "invalid_token": error_code in [404, 400] and "not found" in error_message.lower()
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
                    "token": token[:20] + "...",  # Truncate for logging
                    "error": result.get("error")
                })
        
        return results


def get_daily_tip() -> dict:
    """Get the daily tip based on current date (cycles through tips)"""
    now = datetime.now(TIMEZONE)
    day_of_year = now.timetuple().tm_yday
    tip_index = day_of_year % len(DAILY_TIPS)
    return DAILY_TIPS[tip_index]


# Singleton instance
fcm_service = FCMService()
