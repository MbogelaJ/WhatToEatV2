# WhatToEat - Pregnancy Nutrition Guide PRD

## Original Problem Statement
Apple App Store Review Feedback (Submission ID: ac697cb9-cc29-408a-945e-8a724103acf7):
- **Issue**: Guideline 2.1(a) - Performance - App Completeness
- **Bug**: Search fails or appears unresponsive due to API latency
- **Device**: iPad Air 11-inch (M3), iPadOS 26.3.1

## Architecture
- **Frontend**: React.js + Capacitor (Tailwind CSS, Lucide Icons)
- **Backend**: FastAPI (Python)
- **Data Storage**: In-memory food database (40 foods with pregnancy-specific content)
- **User Preferences**: localStorage for dietary restrictions

## Features Implemented (March 2026)

### 1. Core Search & Filtering
- Client-side instant search (no API calls for filtering)
- Category filter (Beverages, Condiments, Dairy, Fruits, Grains, Nuts & Seeds, Proteins, Vegetables)
- Safety level filter (Safe, Limit, Avoid)
- All filtering is done locally for instant response
- **235 foods in database**

### 2. Food Detail Modal
Matching user's design requirements:
- **Header**: Back to Home button, Share button
- **Title Section**: Food name, Category, Safety badge (color-coded)
- **Nutritional Benefits**: Displayed as pill tags
- **Recommended Consumption**: Checklist with blue checkmarks
- **Preparation Tips**: Checklist with purple checkmarks
- **Precautions**: Red/pink background card with warning icons
- **Allergy Warning**: When applicable (red alert style)
- **View References**: Collapsible section with sources
- **Educational Disclaimer**: Bottom disclaimer text

### 3. Dietary Restrictions Personalization (NEW)
- Settings page accessible via bottom navigation
- 10 dietary restriction options:
  - Vegetarian (No meat or fish)
  - Vegan (No animal products)
  - Gluten-Free (No gluten-containing foods)
  - Dairy-Free (No dairy products)
  - Nut-Free (No tree nuts or peanuts)
  - Shellfish-Free (No shellfish)
  - Egg-Free (No eggs)
  - Soy-Free (No soy products)
  - Low Sodium (Limit salt intake)
  - Diabetic Friendly (Low sugar options)
- Preferences saved to localStorage
- Active restrictions indicator on home page
- Food cards show dietary concern warnings
- Modal shows "Dietary Alert" for conflicting foods

### 4. Bottom Navigation
- Home (food search)
- FAQ
- Topics
- About
- Settings (dietary restrictions)

### 5. Light Theme UI
- Clean white/gray color scheme
- Card-based design with rounded borders
- Green accent color for safe/positive elements
- Orange for warnings
- Red for precautions/avoid items

## API Endpoints
- `GET /api/foods/all` - Get all foods (used once on mount)
- `GET /api/foods/search?query=` - Search foods
- `GET /api/foods/{food_id}` - Get single food
- `GET /api/categories` - Get category list
- `GET /api/safety-levels` - Get safety levels

## Food Data Structure
```python
{
  "id": "apple-1",
  "name": "Apple",
  "category": "Fruits",
  "safety": "SAFE",
  "safety_label": "Generally Safe",
  "nutritional_benefits": ["Vitamin C", "Fiber", "Antioxidants", "Potassium"],
  "benefits_summary": "Apples provide fiber for digestive health...",
  "recommended_consumption": ["Great as a daily snack", ...],
  "preparation_tips": ["Wash thoroughly before eating", ...],
  "precautions": ["Wash thoroughly to remove pesticide residue", ...],
  "allergy_warning": null or "Allergy warning text"
}
```

## Testing Status
- **Backend**: 100% (6/6 API endpoints working)
- **Frontend**: 100% (23 feature tests passed)
- **Test Report**: /app/test_reports/iteration_2.json

## Next Action Items
1. **P1**: Implement Favorites/Bookmarking feature
2. **P2**: Add food images
3. **P2**: Implement FAQ, Topics, About pages (currently just navigation placeholders)

## Completed Tasks
- [x] Fixed Apple review bug (instant client-side search)
- [x] Migrated from external APIs to local data
- [x] Added category and safety filters
- [x] Expanded food database with pregnancy-specific content
- [x] Implemented modal design matching user screenshot
- [x] Added dietary restrictions personalization
- [x] Added bottom navigation
- [x] Implemented light theme UI
- [x] Expanded database from 40 to 235 foods (March 2026)

## Key Files
- `/app/frontend/src/App.js` - Main React component
- `/app/frontend/src/App.css` - All styles
- `/app/backend/server.py` - FastAPI backend with food data
