# WhatToEat - Pregnancy Nutrition Education App

## Original Problem Statement
Build a pregnancy nutrition education app with onboarding, premium features, and Stripe payment integration.

## Architecture
- **Frontend**: React with Tailwind CSS, React Router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (device_tokens, payment_transactions)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Payments**: Stripe Checkout ($0.99 one-time)
- **Mobile**: Capacitor for iOS
- **Deployment**: Preview at health-ed-guide.preview.emergentagent.com

## User Personas
- Pregnant women seeking nutrition information
- Health-conscious parents-to-be
- Users looking for food safety guidance during pregnancy

## What's Been Implemented

### Onboarding Flow (March 2026)
- **Step 1**: Age input (18-55 years validation)
- **Step 2**: Pregnancy weeks (1-42) with automatic trimester calculation
- **Step 3**: Dietary considerations (optional multi-select)
  - Options: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut Allergy, Shellfish Allergy, Halal, Kosher
- User data persisted to localStorage

### Premium & Payment System (March 2026)
- **Premium Page**: Feature comparison (Free vs Premium)
- **Subscription Page**: Stripe checkout integration
- **Price**: $0.99 one-time payment for entire pregnancy
- **Payment Endpoints**:
  - `POST /api/payments/checkout` - Create Stripe checkout session
  - `GET /api/payments/status/{session_id}` - Check payment status
  - `POST /api/webhook/stripe` - Handle Stripe webhooks
- **MongoDB**: payment_transactions collection

### Push Notification System (March 2026)
- Device token registration and storage
- Daily scheduled tips at 3:00 PM Africa/Dar_es_Salaam
- 30 trimester-based nutrition tips with expanded content
- Invalid token auto-removal

### Core Features
- **Home Page**: Food search, category filters, safety filters
- **Food Detail**: Nutrition info, safety badges, references
- **Topics Search**: Educational nutrition content with safety guards
- **Settings**: User profile, premium upgrade, legal pages

## Project Structure
```
/app
├── backend/
│   ├── server.py              # FastAPI app with all endpoints
│   ├── push_notifications.py  # FCM service and daily tips
│   └── credentials/           # Firebase service account
├── frontend/
│   ├── src/
│   │   ├── api/index.js       # API client
│   │   ├── context/UserContext.jsx  # User state management
│   │   ├── components/
│   │   │   ├── layout/Layout.jsx    # Header, Footer, Layout
│   │   │   ├── food/FoodCard.jsx    # Food cards and grid
│   │   │   └── common/Filters.jsx   # Search, filters
│   │   └── pages/
│   │       ├── OnboardingPage.jsx   # 3-step onboarding
│   │       ├── PremiumPage.jsx      # Premium features
│   │       ├── SubscribePage.jsx    # Stripe checkout
│   │       ├── HomePage.jsx         # Food search
│   │       ├── FoodDetailPage.jsx   # Food details
│   │       ├── TopicsPage.jsx       # Nutrition topics
│   │       ├── SettingsPage.jsx     # Settings & profile
│   │       └── LegalPages.jsx       # Terms, Privacy, Support
│   └── ios/                   # Capacitor iOS project
```

## Database Schema

### payment_transactions
```json
{
  "session_id": "string (Stripe session ID)",
  "user_id": "string",
  "amount": 0.99,
  "currency": "usd",
  "product": "whattoeat_premium",
  "payment_status": "pending|paid|failed",
  "status": "initiated|complete|expired",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

### device_tokens
```json
{
  "token": "string (FCM token)",
  "platform": "ios|android",
  "trimester": 1|2|3|null,
  "created_at": "ISO datetime"
}
```

## API Endpoints

### Foods
- `GET /api/foods` - All foods (85 items)
- `GET /api/foods/{id}` - Food details
- `GET /api/foods/search?q=` - Search foods
- `GET /api/categories` - All categories

### Payments
- `POST /api/payments/checkout` - Create Stripe session
- `GET /api/payments/status/{session_id}` - Payment status
- `POST /api/webhook/stripe` - Stripe webhook

### Push Notifications
- `POST /api/register_device` - Register FCM token
- `GET /api/notification_status` - Scheduler status
- `GET /api/tips/today` - Today's tip
- `GET /api/tips/all` - All 30 tips

## Testing Status
- Backend: 100% (all tests passed)
- Frontend: 100% (Playwright tests passed)
- Stripe Integration: Working (test mode)

## Backlog

### P1 (High Priority)
- Add food images to database
- Implement dietary filtering on food list
- Use trimester for personalized content filtering

### P2 (Medium Priority)
- Multi-language support
- Offline caching
- User analytics

### P3 (Low Priority)
- Social sharing
- Healthcare provider integration
