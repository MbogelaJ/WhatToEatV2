# WhatToEat - Pregnancy Nutrition Guide PRD

## Original Problem Statement
Build a pregnancy nutrition app called "WhatToEat" that helps pregnant users understand which foods are safe to eat during pregnancy. The app should have an intuitive onboarding flow, food search with filtering, dietary personalization, and a premium upgrade option.

## Architecture
- **Frontend**: React.js + Capacitor (for mobile builds)
- **Backend**: FastAPI (Python)
- **Data Storage**: In-memory food database (235 foods with pregnancy-specific content)
- **User Preferences**: localStorage for dietary restrictions, onboarding state, premium status

## App Flow (Updated March 2026)
1. **Disclaimer Page** - Medical disclaimer with WHO, CDC, ACOG, FDA sources (first time only)
2. **Create Account Page** - Email/password + Apple/Google social login options (MOCKED)
3. **Age and Pregnancy Stage Page** - Age range selection + Trimester/Pregnancy stage
4. **Dietary Considerations Page** - Select dietary restrictions (vegetarian, vegan, etc.)
5. **Premium Page** - One-time purchase US$1.99 offer
6. **Home Page** - Educational banner, Daily tip, Trimester info, Food search with filters

## Features Implemented (March 19, 2026)

### 1. Complete Onboarding Flow (COMPLETED)
Five-step onboarding with progress dots:
- **Step 0 - Disclaimer**: Medical disclaimer with "Important Notice" and "I Understand" button
- **Step 1 - Create Account**: Email/password form + Apple/Google sign-in (MOCKED)
- **Step 2 - Age & Pregnancy Stage**: Age range selection + Trimester selection (First/Second/Third/Postpartum/Planning)
- **Step 3 - Dietary Considerations**: 15 dietary options (Vegetarian, Vegan, Pescatarian, Gluten-Free, etc.)
- **Step 4 - Premium Offer**: US$1.99 one-time purchase with "Continue with Free Version" option
- State saved in localStorage with `onboardingStep` key (0-5)

### 2. Home Page (UPDATED)
- **Header**: "W" logo + "WhatToEat" title + logout/profile icons
- **Educational Banner**: Blue info banner about educational content
- **Daily Tip**: Yellow card with daily pregnancy nutrition tip, source citation, dismiss button, "Read more" link
- **Trimester Banner**: Green card showing user's trimester and focus nutrients (e.g., "Third Trimester - Focus on: Iron, Calcium, DHA, Protein")
- **Search Bar**: Client-side instant search
- **Category Filters**: All, Beverages, Condiments, Dairy, Fruits, Grains, Nuts & Seeds, Proteins, Vegetables
- **Safety Filters**: All, Safe, Limit, Avoid
- **Personalized View Toggle**: Green button to activate dietary restriction filtering
- **Food Count**: Shows "X free foods · Y premium foods"
- **Food Grid**: Cards with food name, category, and safety badge

### 3. Premium Feature (MOCKED)
- **Price**: US$1.99 one-time purchase (12 months access)
- **Premium Page**: Features list with "Get Premium" and "Continue with Free Version" buttons
- **Premium Benefits**: Curated trimester foods, smart filters, expanded database, weekly tips, priority support
- State saved in localStorage (`isPremium` key)

### 4. Core Search & Filtering
- Client-side instant search (no API calls for filtering)
- 235 foods in database
- Category and Safety level filters
- Personalized dietary restriction filtering

### 5. Food Detail Modal
- Safety badge (color-coded: green/yellow/red)
- Related FAQs section
- Nutritional benefits, recommended consumption, preparation tips
- Precautions with warning icons
- Allergy warnings
- View References (WHO, USDA, ACOG, FDA, CDC)

### 6. FAQ Page
- **Free Questions**: 3 sample questions (Salmon, Yogurt, Shrimp)
- **Premium Questions**: 40+ locked questions with lock icons
- Category filters
- Clickable food tags navigate to food detail modal

### 7. Settings Page
- 10+ dietary restriction options
- Preferences saved to localStorage

### 8. Bottom Navigation
- Home, FAQ, Topics, About, Settings

## API Endpoints
- `GET /api/foods/all?page_size=250` - Get all foods
- `GET /api/foods/search?query=` - Search foods
- `GET /api/foods/{food_id}` - Get single food
- `GET /api/categories` - Get category list

## Testing Status
- **Onboarding Flow**: Tested ✅ - Complete 5-step flow working
- **Home Page**: Tested ✅ - All new components (Educational banner, Daily Tip, Trimester banner) working
- **Premium Feature**: Working (payment MOCKED)
- **FAQ**: Working

## What's MOCKED (Not Implemented)
1. User authentication (Email/Password, Apple Sign-In, Google Sign-In) - uses localStorage only
2. Payment processing for Premium - sets localStorage flag directly
3. Backend user accounts - no user database

## Next Action Items (Priority Order)
1. **P1**: Implement real payment integration (Apple In-App Purchase / Stripe) for premium
2. **P1**: Implement functional Apple & Google social logins
3. **P1**: Implement a "Favorites" feature for bookmarking foods

## Future Tasks
- **P2**: CRITICAL Refactor - Break down the monolithic App.js (2000+ lines) into smaller components
- **P2**: Add food images
- **P2**: Add search within FAQ page

## Key Files
- `/app/frontend/src/App.js` - Main React component (~2200 lines)
- `/app/frontend/src/App.css` - All styles (~2400 lines)
- `/app/backend/server.py` - FastAPI backend with food data

## Notes
- Premium payment is MOCKED (localStorage only)
- User authentication is MOCKED (localStorage only)
- Onboarding shown only on first launch (based on localStorage `onboardingStep`)
- All user data persisted in localStorage
