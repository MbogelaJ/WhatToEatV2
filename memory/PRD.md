# WhatToEat - Pregnancy Nutrition App PRD

## Original Problem Statement
Build a comprehensive, user-friendly mobile and web app that provides food safety information for pregnant individuals, targeting English-speaking international markets.

## Product Requirements
- Classify all food items into safety labels: SAFE, LIMIT, and AVOID
- Strict freemium access rule: AVOID (100% premium), LIMIT (~90% premium), SAFE (~85% premium)
- Authentication: Google Sign-in and Apple Sign-in (Functional via Capacitor)
- Payment: Apple In-App Purchase for the iOS app ($1.99 one-time)
- UI/UX: Fully responsive, specific category filtering, Daily tips, App Store ready

## Current Status: ✅ PRODUCTION READY (v1.0.0)
Last Updated: March 21, 2026

## What's Been Implemented

### Core Features
- ✅ 288 foods with safety classifications (SAFE, LIMIT, AVOID)
- ✅ Freemium model: 39 free foods, 249 premium foods
- ✅ Search functionality with instant results
- ✅ Category filtering (13 categories)
- ✅ Safety filtering (All, Safe, Limit, Avoid)
- ✅ Daily personalized tips
- ✅ FAQ section with search (4 free, 35+ premium)
- ✅ Topics section (2 free, 6 premium)
- ✅ About page
- ✅ Foods sorted alphabetically A-Z

### Authentication
- ✅ Google Sign-In (native via Capacitor)
- ✅ Apple Sign-In (native via Capacitor)
- ✅ Email/Password authentication (requires valid input)
- ✅ Session persistence

### iOS Native Features
- ✅ Capacitor integration
- ✅ Apple In-App Purchase (Product ID: com.whattoeat.penx.premium)
- ✅ Offline data fallback (staticFoods.js with 288 foods)
- ✅ Error boundary for crash recovery
- ✅ Xcode warnings suppressed via Podfile

### Premium Gating
- ✅ Premium foods redirect to Premium page
- ✅ Premium FAQs show lock modal (answer hidden)
- ✅ Premium Topics show "Unlock premium" (tips hidden)
- ✅ Food detail modal shows lock overlay for premium items

### Quality Improvements (March 21, 2026)
- ✅ Auth bypass fix: Continue button disabled without valid email/password
- ✅ Premium gating enforced across all content types
- ✅ Xcode warnings suppressed via Podfile configuration
- ✅ All tests passing (12/12 - 100% success rate)

## Technical Architecture

### Frontend
- React.js with Create React App
- Capacitor for iOS native wrapper
- Shadcn/UI components

### Backend
- FastAPI (Python)
- MongoDB for data storage

### Component Structure (Refactoring in Progress)
```
/src/
├── components/
│   ├── auth/
│   ├── common/
│   ├── food/
│   │   ├── FoodCard.jsx
│   ├── filters/
│   │   ├── CategoryFilter.jsx
│   │   ├── SafetyFilter.jsx
│   ├── onboarding/
│   │   ├── DisclaimerPage.jsx ✅ NEW
│   │   └── index.js ✅ NEW
│   ├── views/
│   │   ├── AboutView.jsx ✅ NEW
│   │   ├── TopicsView.jsx ✅ NEW
│   │   └── index.js ✅ NEW
│   ├── BottomNav.jsx
│   ├── DailyTip.jsx
│   └── index.js
├── data/
│   ├── staticFoods.js
│   ├── faqs.js
│   ├── dailyTips.js
│   └── index.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── index.js
└── App.js (3488 lines → target: 800-1000 lines)
```

### App Configuration
- Bundle ID: com.penx.whattoeat
- IAP Product ID: com.whattoeat.penx.premium
- iOS Minimum: 15.0

## Testing Status
- All 12 core features tested and passing
- Premium gating verified on foods, FAQs, and Topics
- Auth validation working
- Alphabetical sorting confirmed
- See: `/app/test_reports/iteration_8.json`

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- [x] Auth bypass prevention
- [x] Premium content gating
- [x] Xcode warning suppression
- [x] All features tested

### P1 (High Priority) - IN PROGRESS
- [x] Component extraction started (AboutView, TopicsView, DisclaimerPage)
- [ ] Complete App.js refactoring
- [ ] Favorites feature implementation

### P2 (Medium Priority)
- [ ] Android build and testing
- [ ] Analytics integration
- [ ] Push notifications

### P3 (Low Priority)
- [ ] Social sharing improvements
- [ ] User feedback system
- [ ] Multi-language support

## Data Model

### Food Item
```json
{
  "id": "apple-1",
  "name": "Apple",
  "category": "Fruits",
  "safety": "SAFE",
  "safety_label": "Generally Safe",
  "nutritional_benefits": ["Vitamin C", "Fiber"],
  "benefits_summary": "...",
  "recommended_consumption": ["..."],
  "preparation_tips": ["..."],
  "precautions": ["..."],
  "allergy_warning": null,
  "is_premium": false
}
```

### Premium Distribution
- SAFE foods: ~85% premium (201 of 238)
- LIMIT foods: ~90% premium (32 of 36)
- AVOID foods: 100% premium (16 of 16)
- **Total: 39 free, 249 premium**

## App Store Submission Checklist
- [x] All features working
- [x] Premium gating enforced
- [x] Auth validation working
- [x] Offline data working
- [x] Xcode building without critical errors
- [ ] App icons configured
- [ ] Screenshots prepared
- [ ] App Store Connect configured
- [ ] Archive and upload

## Known Issues
- None in functionality (all critical issues resolved)

## Future Enhancement Ideas
- Recipe suggestions based on safe foods
- Pregnancy week tracker integration
- Healthcare provider sharing feature
- Community Q&A section
