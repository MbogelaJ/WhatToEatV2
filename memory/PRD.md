# WhatToEat - Pregnancy Nutrition Education App

## Original Problem Statement
Build a pregnancy nutrition education app with:
- Push notifications for daily nutrition tips
- Onboarding flow with user profile collection
- Premium subscription via Stripe ($0.99 one-time)
- Food personalization based on health conditions
- Offline caching for food database
- MongoDB migration for scalability

## Architecture
- **Frontend**: React with Tailwind CSS, React Router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (foods, device_tokens, payment_transactions)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Payments**: Stripe Checkout ($0.99 one-time)
- **Mobile**: Capacitor for iOS
- **Deployment**: Preview at health-ed-guide.preview.emergentagent.com

## User Personas
- Pregnant women seeking nutrition information
- Health-conscious parents-to-be
- Users looking for food safety guidance during pregnancy

## What's Been Implemented

### Backend Authentication API (March 2026)
- POST /api/auth/register - Create new user with email/password
- POST /api/auth/login - Authenticate and return JWT token (7-day expiry)
- GET /api/auth/me - Get current user profile (requires Bearer token)
- PUT /api/auth/profile - Update user profile fields
- JWT-based authentication with SHA-256 password hashing
- Email and password validation
- Duplicate email prevention
- Users stored in MongoDB 'users' collection

### Auto-Highlight Foods on Home Page (March 2026)
- Recommended foods show emerald gradient + sparkle badge
- Caution foods show amber gradient + warning badge
- Food tags display "Good for anemia", "High in iron", etc.
- Personalization banners show trimester focus and health condition info
- Already implemented via personalized API and FoodCard component

### MongoDB Food Database (March 2026)
- Migrated 85 foods from in-memory to MongoDB `foods` collection
- All food endpoints query MongoDB with _id excluded
- Automatic seeding on server startup
- Maintains backward compatibility with in-memory fallback

### Premium Status Sync (March 2026)
- New endpoint: `GET /api/payments/user/{user_id}/premium-status`
- Checks `payment_transactions` collection for paid status
- Frontend UserContext syncs premium status on app load
- User ID generated during onboarding: `user_{timestamp}_{random9chars}`

### Offline Caching (March 2026)
- Cache utility at `/app/frontend/src/utils/cache.js`
- localStorage with `whattoeat_cache_` prefix
- Foods, categories, about, tips cached automatically
- Cache durations: SHORT=1h, MEDIUM=6h, LONG=24h, WEEK=7d
- Settings page shows cache stats with Clear button

### Content Personalization (March 2026)
- CRITICAL BUG FIXED: Foods with safety_level='avoid' never recommended
- Personalization based on 9 health conditions
- Trimester-specific recommendations
- Recommendation badges on food cards

### Push Notification System (March 2026)
- Device token registration and storage
- Daily scheduled tips at 3:00 PM Africa/Dar_es_Salaam
- 85 trimester-based nutrition tips
- Invalid token auto-removal

### Onboarding Flow (March 2026, Updated December 2026)
**New Users (Sign Up):**
- Step 1: Important Notice (Disclaimer acceptance)
- Step 2: Create Your Account (Email/Password + Social login buttons)
- Step 3: Your Profile - Age (18-55), Pregnancy Stage selection
- Step 4: Dietary Considerations - Multiple selection for restrictions/conditions
- After Step 4: Redirects to **Premium page**

**Returning Users (Sign In):**
- Step 1: Important Notice (Disclaimer)
- Step 2: Click "Already have an account? Sign In" → Enter credentials → **Go directly to Home page**
- Skips: Profile, Dietary, Premium pages

### Back Button Navigation (March 2026)
- Back button added to header on all non-home pages
- Uses browser history navigation (navigate(-1))
- ChevronLeft icon from lucide-react

### Premium & Payment System (March 2026, Updated December 2026)
- **Paywall enforced**: Users MUST subscribe ($0.99) before accessing home page
- Premium Page: Feature comparison (Free vs Premium) - no skip button
- Subscription Page: Stripe checkout integration
- Price: $0.99 one-time payment
- **Access duration**: 12 months from purchase date
- Premium status synced from backend including `purchased_at` timestamp
- Expiration date displayed in Settings page
- After 12 months, access is limited (user redirected to Premium page)

## Project Structure
```
/app
├── backend/
│   ├── server.py              # FastAPI app with MongoDB
│   ├── health_filters.py      # Food personalization logic
│   ├── push_notifications.py  # FCM service and tips
│   └── credentials/           # Firebase service account
├── frontend/
│   ├── src/
│   │   ├── api/index.js       # API client with caching
│   │   ├── utils/cache.js     # Offline cache utility
│   │   ├── context/UserContext.jsx  # User state + premium sync
│   │   ├── components/
│   │   └── pages/
│   └── ios/                   # Capacitor iOS project
```

## Database Schema

### foods (MongoDB Collection)
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "safety_level": "safe|limit|avoid",
  "description": "string",
  "nutrition_note": "string",
  "context": "string",
  "alternatives": ["string"],
  "nutrients": ["string"],
  "sources": ["string"]
}
```

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

### Foods (MongoDB)
- `GET /api/foods` - All 85 foods
- `GET /api/foods/{id}` - Food details
- `GET /api/foods/search?q=` - Search foods
- `GET /api/foods/category/{category}` - By category
- `GET /api/foods/safety/{level}` - By safety level
- `POST /api/foods/personalized` - Personalized list
- `GET /api/categories` - All categories

### Payments
- `POST /api/payments/checkout` - Create Stripe session
- `GET /api/payments/status/{session_id}` - Payment status
- `GET /api/payments/user/{user_id}/premium-status` - Premium check
- `POST /api/webhook/stripe` - Stripe webhook

### Push Notifications
- `POST /api/register_device` - Register FCM token
- `GET /api/notification_status` - Scheduler status
- `GET /api/tips/today` - Today's tip
- `GET /api/tips/all` - All 85 tips

## Testing Status
- Backend: 100% (all tests passed)
- Frontend: 100% (Playwright tests passed)
- Test reports: /app/test_reports/iteration_5.json

## Completed Features
- [x] MongoDB food database migration
- [x] Premium status sync from payments
- [x] Offline caching with management UI
- [x] Content personalization (critical bug fixed)
- [x] Push notifications with scheduler
- [x] Stripe payment integration
- [x] Onboarding with user ID generation

## Backlog

### P1 (Next Sprint)
- Automatic food highlighting on home page based on user preferences

### P2 (Future)
- User analytics
- Social sharing
- Healthcare provider integration

### P3 (Backlog)
- Admin interface for food management
- Push notification preferences per user
