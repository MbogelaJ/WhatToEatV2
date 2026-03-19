# WhatToEat - Pregnancy Nutrition Guide PRD

## Original Problem Statement
Build a pregnancy nutrition app called "WhatToEat" that helps pregnant users understand which foods are safe to eat during pregnancy. The app should have an intuitive onboarding flow, food search with filtering, dietary personalization, and a premium upgrade option.

## Architecture
- **Frontend**: React.js + Capacitor (for mobile builds)
- **Backend**: FastAPI (Python) with MongoDB
- **Data Storage**: In-memory food database (288 foods) + MongoDB for user auth
- **User Preferences**: localStorage for dietary restrictions, onboarding state, premium status

## App Flow (Updated March 2026)
1. **Disclaimer Page** - Medical disclaimer with WHO, CDC, ACOG, FDA sources
2. **Create Account Page** - Email/password + Apple/Google social login
3. **Age and Pregnancy Stage Page** - Age range + Trimester selection
4. **Dietary Considerations Page** - 2-column grid of dietary restrictions
5. **Premium Page** - One-time purchase US$1.99 offer
6. **Home Page** - Educational banner, Daily tip, Trimester info, Food search

## Features Implemented

### 1. Complete Onboarding Flow ✅
Five-step onboarding with progress dots and Back/Continue navigation

### 2. Authentication System ✅ (March 19, 2026)

#### Google Sign-In (FUNCTIONAL)
- Uses Emergent Auth for OAuth flow
- Redirects to Google, returns with session
- Backend exchanges session for user data
- User info stored in MongoDB and localStorage
- Session cookies for persistent auth

#### Apple Sign-In (FUNCTIONAL on iOS)
- Uses native iOS Sign in with Apple via Capacitor plugin
- Bundle ID: `com.whattoeat.penx.app`
- Team ID: `92W4Z3C38H`
- On web: Shows message to use Google Sign-In instead
- Setup instructions in `/app/APPLE_SIGNIN_SETUP.md`

#### Backend Auth Endpoints
- `POST /api/auth/session` - Exchange Emergent Auth session for app session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and clear session

### 3. User Profile in Settings ✅
- Shows user avatar, name, email
- "Signed in with Google/Apple" indicator
- Sign Out button

### 4. Home Page ✅
- Header with back/close/profile buttons
- Educational Information banner (blue)
- Daily Tip (yellow) with source citation
- Trimester banner based on user selection
- Search bar, category filters, safety filters
- Personalized View toggle
- Food count display

### 5. Food Search & Filtering ✅
- Client-side instant search
- **288 foods in database** (updated March 20, 2026)
  - 220 SAFE foods (Generally Safe)
  - 44 LIMIT foods (Limit Intake)
  - 24 AVOID foods (Best Avoided)
- Category and Safety level filters
- Pagination support (fetches all pages)

### 6. Medical Disclaimer Footer ✅ (Added March 20, 2026)
Every food detail page now displays a prominent disclaimer at the bottom:
- **Disclaimer**: "This is general nutrition guidance only — not medical advice. Consult your doctor, midwife, or healthcare provider for personalized advice."
- **Sources**: WHO, FDA, CDC, ACOG, NHS (with full organization names)

### 7. Freemium Access Model ✅ (Updated March 20, 2026)

**Overall Split: 86% Premium (249 items) / 14% Free (39 items)**

| Safety Level | Total | Premium | Free | Premium % |
|--------------|-------|---------|------|-----------|
| AVOID        | 24    | 24      | 0    | 100%      |
| LIMIT        | 44    | 39      | 5    | 88%       |
| SAFE         | 220   | 186     | 34   | 84%       |

**Dynamic Teaser Messages for Locked Foods:**
- AVOID: "High-risk food — Unlock full safety details"
- LIMIT: "Unlock portions, safe swaps & timing tips"
- SAFE: "Unlock nutrition facts & preparation tips"

**Premium Upsell Banner:** Context-aware messaging at bottom of food list

**Free Foods (39 items):**
- Basic fruits: Apple, Banana, Orange, Grapes, Watermelon
- Basic vegetables: Carrots, Broccoli, Spinach, Tomatoes, Cucumber, etc.
- Basic proteins: Chicken Breast, Eggs, Lentils, Chickpeas
- Basic dairy: Milk, Greek Yogurt, Cheddar Cheese
- Basic grains: Oatmeal, Brown Rice, Quinoa, Whole Wheat Bread
- Basic LIMIT rules: Green Tea, High Sodium Foods (general advice only)

**Premium Foods (249 items):**
- ALL AVOID foods (high-risk items require detailed safety info)
- 90% of LIMIT foods (detailed portions, brand specifics, mg breakdowns)
- 85% of SAFE foods (detailed nutrition, benefits, preparation tips)

### 8. Stripe Payment Integration ✅ (Added March 20, 2026)
Real payment processing for premium subscription:
- **Price**: US$1.99 one-time purchase
- **Backend Endpoints**:
  - `POST /api/payments/checkout` - Create Stripe checkout session
  - `GET /api/payments/status/{session_id}` - Poll payment status
  - `POST /api/webhook/stripe` - Handle Stripe webhooks
  - `GET /api/payments/premium-status` - Check user premium status
- **Features**:
  - Secure checkout via Stripe
  - Payment status polling on frontend
  - Transaction records in MongoDB (`payment_transactions` collection)
  - Automatic premium status update on successful payment
  - Processing overlay UI during payment verification

## API Endpoints
- `GET /api/foods/all` - Get all foods
- `GET /api/foods/search?query=` - Search foods
- `POST /api/auth/session` - Exchange OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

## Database Collections (MongoDB)
- `users` - User profiles (user_id, email, name, picture, auth_provider, is_premium, premium_since)
- `user_sessions` - Active sessions (session_token, user_id, expires_at)
- `payment_transactions` - Payment records (session_id, amount, currency, payment_status, user_id, created_at)

## What's FUNCTIONAL
1. ✅ Google Sign-In (via Emergent Auth)
2. ✅ Apple Sign-In (on iOS native app)
3. ✅ User logout
4. ✅ Session management
5. ✅ Complete onboarding flow
6. ✅ Food search and filtering
7. ✅ Stripe payment for premium ($1.99)
8. ✅ Medical disclaimer on all food details
9. ✅ Dynamic teaser messages for locked foods

## What's MOCKED
1. Email/Password authentication - UI only

## Next Action Items (Priority Order)
1. **P0 IN PROGRESS**: Refactor App.js monolith - component files created, need to integrate
2. **P1**: Implement email/password authentication
3. **P1**: Implement "Favorites" feature for bookmarking foods

## Completed Features
- Stripe payment integration for premium subscription ($1.99)
- Medical disclaimer footer with WHO, FDA, CDC, ACOG, NHS sources
- Dynamic teaser messages for locked foods
- Freemium classification (86% premium, 14% free)
- Component files created for refactor:
  - /app/frontend/src/components/SafetyBadge.jsx
  - /app/frontend/src/components/FoodCard.jsx
  - /app/frontend/src/components/CategoryFilter.jsx
  - /app/frontend/src/components/SafetyFilter.jsx
  - /app/frontend/src/components/BottomNav.jsx
  - /app/frontend/src/components/DailyTip.jsx
  - /app/frontend/src/utils/constants.js
  - /app/frontend/src/utils/helpers.js
  - /app/frontend/src/data/dailyTips.js

## Future Tasks
- **P2**: Add food images
- **P2**: Add FAQ page search

## Key Files
- `/app/frontend/src/App.js` - Main React component
- `/app/frontend/src/App.css` - All styles
- `/app/backend/server.py` - FastAPI backend with auth endpoints
- `/app/APPLE_SIGNIN_SETUP.md` - Apple Sign-In setup instructions

## iOS App Setup Required
To enable Apple Sign-In on the iOS app:
1. Install plugin: `npm install @capacitor-community/apple-sign-in`
2. Run: `npx cap sync ios`
3. Open Xcode and add "Sign in with Apple" capability
4. See `/app/APPLE_SIGNIN_SETUP.md` for detailed instructions
