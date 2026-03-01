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

# =============================================================================
# TRIMESTER-BASED DAILY PREGNANCY NUTRITION TIPS
# Educational, neutral, non-medical content
# 30 total tips (10 per trimester) - rotates daily, repeats after full cycle
# =============================================================================

FIRST_TRIMESTER_TIPS = [
    {
        "title": "Daily Nutrition Tip",
        "body": "Folate is a key nutrient discussed in early pregnancy nutrition.",
        "expanded_content": "Folate, a B-vitamin, is extensively discussed in prenatal nutrition literature, particularly regarding early pregnancy. Public health guidance commonly references leafy green vegetables, legumes, fortified cereals, and citrus fruits as dietary sources. Many health organizations discuss folate supplementation as a common practice during the preconception period and early pregnancy.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "folate", "tip_id": "t1_01"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Hydration plays a key role in pregnancy wellness.",
        "expanded_content": "Staying well hydrated is commonly discussed in prenatal nutrition literature. Adequate fluid intake supports normal physiological changes during pregnancy. Public health sources often encourage water as a primary beverage option. Individual fluid needs may vary based on activity level, climate, and other factors.",
        "sources": ["WHO", "CDC", "NHS"],
        "data": {"screen": "topics", "query": "water", "tip_id": "t1_02"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Small, frequent meals are often discussed for early pregnancy.",
        "expanded_content": "Nutrition literature commonly discusses eating smaller, more frequent meals during early pregnancy, particularly when appetite changes may occur. This eating pattern is referenced in prenatal guidance as one approach that some individuals find helpful. Keeping simple snacks accessible is often mentioned in educational materials.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "topics", "query": "morning sickness", "tip_id": "t1_03"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Iron-rich foods are commonly discussed in prenatal nutrition.",
        "expanded_content": "Iron is a mineral frequently mentioned in prenatal nutrition education. Dietary sources commonly noted include lean meats, poultry, fish, beans, lentils, fortified cereals, and leafy green vegetables. Nutrition literature often discusses pairing iron-rich foods with vitamin C sources to support absorption.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "iron", "tip_id": "t1_04"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Vitamin B6 food sources include bananas and poultry.",
        "expanded_content": "Vitamin B6 is found in various foods including chicken, fish, potatoes, bananas, and fortified cereals. This vitamin is commonly discussed in prenatal nutrition materials. Food-based sources of vitamins are generally referenced in nutrition guidance as part of a varied diet.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "37", "tip_id": "t1_05"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Ginger is often referenced in pregnancy nutrition literature.",
        "expanded_content": "Ginger, used in cooking and teas, is frequently mentioned in pregnancy-related nutrition discussions. It has been traditionally used in many cultures and is referenced in some prenatal educational materials. Ginger can be incorporated into meals, beverages, or consumed as ginger tea.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "food", "foodId": "76", "tip_id": "t1_06"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Protein needs are discussed as important during pregnancy.",
        "expanded_content": "Protein is a macronutrient commonly discussed in prenatal nutrition literature. Food sources frequently mentioned include lean meats, poultry, fish, eggs, dairy products, legumes, nuts, and seeds. Public health guidance generally emphasizes variety in protein sources as part of overall dietary patterns.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "protein", "tip_id": "t1_07"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Citrus fruits provide vitamin C, noted for iron absorption.",
        "expanded_content": "Citrus fruits such as oranges, grapefruits, and lemons are commonly referenced as vitamin C sources in nutrition literature. Vitamin C is discussed in relation to supporting iron absorption from plant-based foods. Including a variety of fruits is generally encouraged in dietary guidance.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "38", "tip_id": "t1_08"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Whole grains provide fiber and B vitamins.",
        "expanded_content": "Whole grains such as brown rice, oatmeal, quinoa, and whole wheat bread are referenced in nutrition literature for their fiber and B vitamin content. Prenatal nutrition guidance commonly includes whole grains as part of varied eating patterns. Fiber intake is discussed in relation to digestive health.",
        "sources": ["WHO", "CDC", "NHS"],
        "data": {"screen": "food", "foodId": "69", "tip_id": "t1_09"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Food safety awareness is emphasized in prenatal guidance.",
        "expanded_content": "Food safety is an important topic discussed in prenatal nutrition education. Public health organizations provide guidance on food handling, storage, and preparation practices. Being informed about foods that are commonly discussed in pregnancy food safety literature can support informed dietary choices.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "home", "tip_id": "t1_10"}
    },
]

SECOND_TRIMESTER_TIPS = [
    {
        "title": "Daily Nutrition Tip",
        "body": "Calcium supports bone health, per nutrition literature.",
        "expanded_content": "Calcium is a mineral extensively discussed in prenatal nutrition education regarding bone and teeth development. Dietary sources commonly noted include dairy products such as milk, yogurt, and cheese, as well as fortified plant-based alternatives, leafy greens, and almonds. Public health materials often reference daily calcium intake thresholds.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "calcium", "tip_id": "t2_01"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Omega-3 fatty acids are discussed in prenatal nutrition.",
        "expanded_content": "Omega-3 fatty acids, particularly DHA, are frequently referenced in prenatal nutrition literature regarding fetal development. Fatty fish such as salmon, sardines, and anchovies are commonly noted as dietary sources. Public health guidance often discusses fish consumption recommendations during pregnancy, including considerations about mercury content in different fish varieties.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "food", "foodId": "1", "tip_id": "t2_02"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Iron needs increase as pregnancy progresses.",
        "expanded_content": "Nutrition literature discusses increased iron needs during pregnancy, particularly in the second and third trimesters. Combining iron-rich foods with vitamin C sources is commonly mentioned as a practice that may support iron absorption. Leafy greens, lean meats, legumes, and fortified cereals are frequently noted as dietary iron sources.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "iron", "tip_id": "t2_03"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Protein intake is discussed throughout pregnancy.",
        "expanded_content": "Protein requirements are commonly discussed as continuing throughout pregnancy. Nutrition literature references a variety of protein sources including lean meats, poultry, fish, eggs, dairy, legumes, tofu, nuts, and seeds. Incorporating diverse protein sources is generally encouraged in dietary guidance.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "protein", "tip_id": "t2_04"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Vitamin D is discussed for calcium absorption support.",
        "expanded_content": "Vitamin D is referenced in nutrition literature regarding its role in calcium absorption and bone health. Sources discussed include sunlight exposure, fortified foods such as milk and cereals, fatty fish, and egg yolks. Individual vitamin D needs may vary based on various factors including geographic location and sun exposure.",
        "sources": ["CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "vitamin d", "tip_id": "t2_05"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Fiber from vegetables supports digestive wellness.",
        "expanded_content": "Fiber is commonly discussed in prenatal nutrition materials regarding digestive health. Vegetables, fruits, whole grains, and legumes are referenced as dietary fiber sources. Leafy greens such as spinach and kale provide both fiber and various vitamins and minerals noted in nutrition literature.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "food", "foodId": "47", "tip_id": "t2_06"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Healthy fats are part of balanced nutrition discussions.",
        "expanded_content": "Healthy fats from sources such as avocados, nuts, seeds, and olive oil are referenced in general nutrition guidance. These foods provide various nutrients and are commonly included in discussions about varied eating patterns. Avocados are noted as sources of folate, potassium, and healthy fats.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "36", "tip_id": "t2_07"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Magnesium is found in nuts, seeds, and whole grains.",
        "expanded_content": "Magnesium is a mineral found in various foods including nuts, seeds, whole grains, legumes, and leafy green vegetables. It is discussed in nutrition literature as one of many minerals involved in various body functions. Dietary variety is commonly emphasized in public health nutrition guidance.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "33", "tip_id": "t2_08"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Fish varieties differ in mercury content, per guidance.",
        "expanded_content": "Public health organizations provide information about mercury content in different fish varieties. Lower-mercury options commonly mentioned include salmon, sardines, anchovies, tilapia, and shrimp. Fish consumption during pregnancy is discussed in nutrition literature with considerations for both nutritional benefits and food safety.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "category", "category": "Fish & Seafood", "tip_id": "t2_09"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Nutritious snacking can support varied nutrient intake.",
        "expanded_content": "Snacking on nutrient-dense foods is discussed in prenatal nutrition education as one way to support varied nutrient intake. Options commonly mentioned include fruits, vegetables with hummus, yogurt, nuts, cheese, and whole grain crackers. Individual eating patterns and preferences vary.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "home", "tip_id": "t2_10"}
    },
]

THIRD_TRIMESTER_TIPS = [
    {
        "title": "Daily Nutrition Tip",
        "body": "Complex carbohydrates provide sustained energy.",
        "expanded_content": "Complex carbohydrates from whole grains, legumes, and starchy vegetables are discussed in nutrition literature as sources of sustained energy. Foods such as brown rice, oatmeal, sweet potatoes, and whole grain bread are commonly referenced. Energy needs are discussed as varying throughout pregnancy.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "69", "tip_id": "t3_01"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Iron-rich foods remain important in late pregnancy.",
        "expanded_content": "Iron intake continues to be discussed in nutrition literature throughout pregnancy, including the third trimester. Lean red meat, poultry, fish, legumes, fortified cereals, and leafy greens are commonly noted as dietary sources. Combining iron-rich foods with vitamin C sources is frequently mentioned.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "iron", "tip_id": "t3_02"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Protein continues to be emphasized in late pregnancy.",
        "expanded_content": "Protein intake remains a topic in prenatal nutrition discussions throughout pregnancy. A variety of protein sources including lean meats, poultry, fish, eggs, dairy, legumes, and nuts are commonly referenced in nutrition guidance. Individual protein needs may vary.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "protein", "tip_id": "t3_03"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Staying hydrated remains important throughout pregnancy.",
        "expanded_content": "Adequate hydration continues to be emphasized in prenatal nutrition materials throughout pregnancy. Water is commonly referenced as the primary beverage recommendation. Other hydrating options mentioned include milk, herbal teas (where appropriate), and water-rich fruits and vegetables such as watermelon and cucumber.",
        "sources": ["WHO", "CDC", "NHS"],
        "data": {"screen": "food", "foodId": "43", "tip_id": "t3_04"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Calcium intake continues to be discussed in late pregnancy.",
        "expanded_content": "Calcium remains a mineral discussed in prenatal nutrition education throughout pregnancy. Dairy products, fortified plant-based alternatives, leafy greens, and calcium-fortified foods are commonly referenced sources. Public health guidance generally emphasizes consistent calcium intake throughout pregnancy.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "topics", "query": "calcium", "tip_id": "t3_05"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "DHA omega-3 is discussed for fetal brain development.",
        "expanded_content": "DHA, a type of omega-3 fatty acid, is frequently mentioned in prenatal nutrition literature, particularly regarding fetal brain and eye development. Fatty fish such as salmon and sardines are commonly referenced as DHA sources. Fish consumption recommendations during pregnancy are discussed in public health guidance.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "food", "foodId": "1", "tip_id": "t3_06"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Smaller, more frequent meals are often discussed later.",
        "expanded_content": "Eating smaller, more frequent meals is commonly discussed in late pregnancy nutrition guidance, as physical changes may affect appetite and comfort. This eating pattern is referenced as one approach some individuals find helpful. Nutrient-dense foods are generally emphasized regardless of meal size.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "home", "tip_id": "t3_07"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Fiber supports digestive comfort in late pregnancy.",
        "expanded_content": "Fiber intake is discussed in prenatal nutrition materials throughout pregnancy, including the third trimester. Fruits, vegetables, whole grains, and legumes are commonly referenced as fiber sources. Dried fruits such as prunes and apricots are mentioned in nutrition literature for their fiber content.",
        "sources": ["NHS", "ACOG"],
        "data": {"screen": "food", "foodId": "46", "tip_id": "t3_08"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Potassium-rich foods include bananas and sweet potatoes.",
        "expanded_content": "Potassium is a mineral found in various foods including bananas, sweet potatoes, potatoes, oranges, and leafy greens. It is discussed in general nutrition literature as one of many minerals involved in various body functions. A varied diet including fruits and vegetables is commonly encouraged.",
        "sources": ["CDC", "NHS"],
        "data": {"screen": "food", "foodId": "50", "tip_id": "t3_09"}
    },
    {
        "title": "Daily Nutrition Tip",
        "body": "Balanced nutrition is emphasized throughout pregnancy.",
        "expanded_content": "Maintaining varied and balanced nutrition is consistently emphasized in prenatal education materials. This includes consuming a variety of fruits, vegetables, whole grains, protein sources, and dairy or alternatives. Individual nutritional needs may vary, and consulting with healthcare providers for personalized guidance is commonly suggested.",
        "sources": ["WHO", "CDC", "NHS", "ACOG"],
        "data": {"screen": "home", "tip_id": "t3_10"}
    },
]

# Combined tips list for rotation (30 total)
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
                  If None, rotates through all 30 tips
    
    Returns:
        dict with title, body, expanded_content, sources, and data
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


def get_tip_by_index(index: int, trimester: Optional[int] = None) -> dict:
    """Get a specific tip by index (for testing/preview)"""
    if trimester == 1:
        tips = FIRST_TRIMESTER_TIPS
    elif trimester == 2:
        tips = SECOND_TRIMESTER_TIPS
    elif trimester == 3:
        tips = THIRD_TRIMESTER_TIPS
    else:
        tips = ALL_TIPS
    
    return tips[index % len(tips)]


def get_all_tips(trimester: Optional[int] = None) -> List[dict]:
    """Get all tips, optionally filtered by trimester"""
    if trimester == 1:
        return FIRST_TRIMESTER_TIPS
    elif trimester == 2:
        return SECOND_TRIMESTER_TIPS
    elif trimester == 3:
        return THIRD_TRIMESTER_TIPS
    else:
        return ALL_TIPS


def get_tips_count(trimester: Optional[int] = None) -> dict:
    """Get count of tips by trimester"""
    return {
        "first_trimester": len(FIRST_TRIMESTER_TIPS),
        "second_trimester": len(SECOND_TRIMESTER_TIPS),
        "third_trimester": len(THIRD_TRIMESTER_TIPS),
        "total": len(ALL_TIPS),
        "selected_trimester": trimester,
        "selected_count": len(get_all_tips(trimester))
    }


# Singleton instance - initialized when imported
fcm_service = None

def get_fcm_service() -> FCMService:
    """Get or create FCM service singleton"""
    global fcm_service
    if fcm_service is None:
        fcm_service = FCMService()
    return fcm_service
