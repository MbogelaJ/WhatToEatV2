# NurtureNote - Pregnancy Nutrition Education App

## Original Problem Statement
Refactor pregnancy nutrition app for Apple App Store health compliance to be clearly an EDUCATIONAL nutrition reference, not a medical advice or diagnostic app.

## Architecture
- **Frontend**: React with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (device_tokens collection for push notifications, in-memory food database)
- **Push Notifications**: Firebase Cloud Messaging (FCM) HTTP v1 API with APNs production
- **Scheduler**: APScheduler for daily notifications
- **Mobile**: Capacitor for iOS native app wrapper
- **Deployment**: Preview environment at health-ed-guide.preview.emergentagent.com

## User Personas
- Pregnant women seeking nutrition information
- Health-conscious parents-to-be
- Users looking for food safety guidance during pregnancy

## Core Requirements (Static)
1. Mandatory disclaimer modal on first load (session gate)
2. Inline disclaimers on all main pages
3. Educational language (no absolute statements)
4. Q&A with symptom detection safety guard
5. When to Seek Care section
6. References/sources on all content
7. About page with educational purpose, data sources, non-medical statement

## What's Been Implemented

### Push Notification System (March 2026)
- **Device Token Registration**: `/api/register_device` - Store FCM tokens in MongoDB
- **Device Token Unregistration**: `/api/unregister_device/{token}` - Remove tokens
- **Notification Status**: `/api/notification_status` - Check FCM config, scheduler, device count
- **Test Notification**: `/api/test_notification` - Send test push to specific device
- **Daily Notification Trigger**: `/api/trigger_daily_notification` - Manual job trigger
- **Scheduled Daily Tips**: APScheduler job at 3:00 PM Africa/Dar_es_Salaam timezone
- **Trimester-Based Tips**: 30 rotating educational tips (10 per trimester)
- **Invalid Token Handling**: Auto-removal of invalid/expired FCM tokens from database

### iOS App Store Preparation (January 2026)
- Capacitor iOS project with push notification capabilities
- App Store screenshots (iPhone 6.5" and iPad 13")
- Privacy Policy, Terms of Use, Support hosted pages
- App Icon generator HTML tool
- Xcode troubleshooting guide

### Backend API (server.py)
- `/api/foods` - Get all foods (85 items)
- `/api/foods/search?q=` - Search foods by name/category
- `/api/foods/{id}` - Get food details
- `/api/foods/category/{category}` - Filter by category
- `/api/foods/safety/{level}` - Filter by safety level
- `/api/nutrition-topics/search` - Nutrition topics with safety guards
- `/api/qa/ask` - Legacy Q&A endpoint (redirects to topics)
- `/api/categories` - Get all categories
- `/api/about` - About page data
- `/api/emergency-info` - When to seek care data

### Frontend (App.js)
- DisclaimerModal with session storage gate
- HomePage with search, category filters, food cards
- FoodDetailPage with sources, educational language, view references
- Nutrition Topics search (refactored from Q&A)
- AboutPage with purpose, sources, disclaimer
- SettingsPage with pregnancy stage selector, conditions, links
- SourcesPage with data source references
- Terms of Use and Privacy Policy pages
- Footer navigation

### Compliance Features
1. Disclaimer modal with "I Understand" button
2. Session-only storage (reappears each visit)
3. Inline disclaimers on all pages
4. Educational language: "Generally recommended to avoid", "Often limited", etc.
5. Symptom detection for: bleeding, pain, fever, vomiting, dizziness, etc.
6. Personal question detection with redirect to healthcare provider
7. When to Seek Care section with symptoms list
8. Sources on food detail pages (WHO, CDC, NHS, ACOG)
9. About page with educational purpose, data sources, non-medical statement

## Key Files
- `/app/backend/server.py` - Main FastAPI application with all endpoints
- `/app/backend/push_notifications.py` - FCM service and daily tips
- `/app/backend/credentials/firebase_service_account.json` - Firebase credentials
- `/app/frontend/src/App.js` - Full React application (monolithic, needs refactoring)
- `/app/frontend/ios/` - Capacitor iOS project
- `/app/frontend/public/ios_project.zip` - Downloadable iOS project archive
- `/app/frontend/public/*.html` - Hosted legal pages

## Database Schema

### device_tokens (MongoDB)
```json
{
  "token": "string (unique, indexed)",
  "platform": "ios|android",
  "trimester": 1|2|3|null,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

### FOOD_DATABASE (In-memory)
- 85 food items across 9 categories
- Each item: id, name, category, safety_level, description, nutrition_note, context, alternatives, nutrients, sources

## Prioritized Backlog

### P0 (Critical) - DONE
- All compliance features implemented
- Push notification backend system implemented

### P1 (High Priority)
- Add food images to the database
- Expand nutrition topics database
- Refactor App.js into separate component files

### P2 (Medium Priority)
- User settings implementation (text size, theme)
- Pregnancy stage filtering for food content
- Multi-language support

### P3 (Low Priority)
- Social sharing features
- User-submitted food questions
- Integration with healthcare provider portals

## Technical Notes
- Frontend App.js is over 3,000 lines and needs component extraction
- Food database is in-memory (not MongoDB) - consider migration
- Push notifications use FCM as bridge to APNs for iOS devices
- Scheduler uses Africa/Dar_es_Salaam timezone (UTC+3)
