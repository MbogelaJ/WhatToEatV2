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
- ✅ FAQ section with search
- ✅ Topics section with premium content
- ✅ About page

### Authentication
- ✅ Google Sign-In (native via Capacitor)
- ✅ Apple Sign-In (native via Capacitor)
- ✅ Email/Password authentication
- ✅ Session persistence

### iOS Native Features
- ✅ Capacitor integration
- ✅ Apple In-App Purchase (Product ID: com.whattoeat.penx.premium)
- ✅ Offline data fallback (staticFoods.js with 288 foods)
- ✅ Error boundary for crash recovery

### Quality Improvements (March 21, 2026)
- ✅ Auth bypass fix: Continue button disabled without valid email/password
- ✅ Premium gating enforced: Locked foods redirect to premium page
- ✅ Xcode warnings suppressed via Podfile configuration

## Technical Architecture

### Frontend
- React.js with Create React App
- Capacitor for iOS native wrapper
- Shadcn/UI components

### Backend
- FastAPI (Python)
- MongoDB for data storage

### Key Files
- `/frontend/src/App.js` - Main application (3400+ lines)
- `/frontend/src/data/staticFoods.js` - Offline food data
- `/frontend/ios/App/Podfile` - iOS pod configuration
- `/frontend/capacitor.config.json` - Capacitor settings

### App Configuration
- Bundle ID: com.penx.whattoeat
- IAP Product ID: com.whattoeat.penx.premium
- iOS Minimum: 15.0

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Auth bypass prevention
- [x] Premium content gating
- [x] Xcode warning suppression

### P1 (High Priority)
- [ ] App.js refactoring (break into components)
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
- SAFE foods: ~85% premium
- LIMIT foods: ~90% premium  
- AVOID foods: 100% premium

## Known Issues
- None in functionality (all critical issues resolved)

## Future Enhancement Ideas
- Recipe suggestions based on safe foods
- Pregnancy week tracker integration
- Healthcare provider sharing feature
- Community Q&A section
