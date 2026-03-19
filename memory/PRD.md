# WhatToEat - Pregnancy Nutrition Guide PRD

## Original Problem Statement
Apple App Store Review Feedback (Submission ID: ac697cb9-cc29-408a-945e-8a724103acf7):
- **Issue**: Guideline 2.1(a) - Performance - App Completeness
- **Bug**: Search fails or appears unresponsive due to API latency
- **Device**: iPad Air 11-inch (M3), iPadOS 26.3.1

## Architecture
- **Frontend**: React.js + Capacitor (Tailwind CSS, Lucide Icons)
- **Backend**: FastAPI (Python)
- **Data Storage**: In-memory food database (235 foods with pregnancy-specific content)
- **User Preferences**: localStorage for dietary restrictions, onboarding state, premium status

## App Flow
1. **Disclaimer Page** - Medical disclaimer with WHO, CDC, ACOG, FDA sources (first time only)
2. **Onboarding (2 pages)** - Welcome + Personalization intro (first time only)
3. **Home Page** - Daily tip + Food search with filters
4. **FAQ Page** - Free (3) and Premium (40+) questions with food tag links
5. **Premium Page** - One-time purchase US$1.99

## Features Implemented (March 2026)

### 1. Onboarding Flow (NEW)
- **Disclaimer Page**: Medical disclaimer with checkbox agreement
- **Onboarding Page 1**: "Welcome to WhatToEat" - features overview
- **Onboarding Page 2**: "Personalized for You" - dietary preferences intro
- State saved in localStorage, shown only on first launch

### 2. Premium Feature (NEW)
- **Price**: US$1.99 one-time purchase (not subscription)
- **Premium Page**: Dedicated page with pricing and benefits
- **Premium Modal**: Shown when clicking locked FAQ questions
- **Benefits**: 40+ expert answers, safety guidelines, trimester tips, ad-free
- State saved in localStorage

### 3. Daily Tip (NEW)
- Displays rotating nutrition tips at top of home page
- 15 pregnancy-specific tips
- Changes daily based on day of year

### 4. Core Search & Filtering
- Client-side instant search (no API calls for filtering)
- Category filter (Beverages, Condiments, Dairy, Fruits, Grains, Nuts & Seeds, Proteins, Vegetables)
- Safety level filter (Safe, Limit, Avoid)
- **235 foods in database**

### 5. Food Detail Modal
- Safety badge (color-coded)
- Related FAQs section
- Nutritional benefits, recommended consumption, preparation tips
- Precautions with warning icons
- Allergy warnings
- View References (WHO, USDA, ACOG, FDA, CDC)

### 6. Dietary Restrictions Personalization
- Settings page with 10 dietary restriction options
- Preferences saved to localStorage
- Active restrictions indicator on home page
- Food cards show dietary concern warnings

### 7. FAQ Page
- **Free Questions**: 3 sample questions (Salmon, Yogurt, Shrimp)
- **Premium Questions**: 40+ locked questions with lock icons
- Category filters (All, Food Safety, Seafood, Dairy, etc.)
- Clickable food tags navigate to food detail modal
- Premium modal with US$1.99 one-time purchase

### 8. Bottom Navigation
- Home, FAQ, Topics, About, Settings

## API Endpoints
- `GET /api/foods/all` - Get all foods (used once on mount)
- `GET /api/foods/search?query=` - Search foods
- `GET /api/foods/{food_id}` - Get single food
- `GET /api/categories` - Get category list

## Testing Status
- **Onboarding Flow**: Tested via screenshots
- **Premium Feature**: Modal and page working (payment MOCKED)
- **Daily Tip**: Displaying correctly on home page
- **FAQ**: Free/premium distinction working

## Next Action Items
1. **P1**: Integrate actual payment provider (Apple In-App Purchase / Stripe) for premium
2. **P1**: Implement Favorites/Bookmarking feature

## Future Tasks
- **P2**: Add food images
- **P2**: Add search within FAQ page
- **P3**: Refactor App.js monolith into smaller components

## Key Files
- `/app/frontend/src/App.js` - Main React component (~1850 lines)
- `/app/frontend/src/App.css` - All styles (~2000 lines)
- `/app/backend/server.py` - FastAPI backend with food data

## Notes
- Premium payment is currently MOCKED (localStorage only)
- Onboarding/Disclaimer shown only on first launch
- All data persisted in localStorage
