# WhatToEat App.js Refactoring Plan

## Current State
- **App.js**: 3,488 lines (monolithic)
- **Target**: Break into smaller, maintainable components

## Component Structure

```
/src/
├── components/
│   ├── auth/
│   │   ├── AuthCallback.jsx          # OAuth redirect handler
│   │   └── CreateAccountPage.jsx     # Sign-in/Sign-up page
│   ├── common/
│   │   ├── ErrorBoundary.jsx         # Error boundary wrapper
│   │   └── LoadingSpinner.jsx        # Loading states
│   ├── food/
│   │   ├── FoodCard.jsx              # ✅ EXISTS (needs update)
│   │   ├── FoodDetailModal.jsx       # Food detail popup
│   │   └── FoodList.jsx              # Food list container
│   ├── filters/
│   │   ├── CategoryFilter.jsx        # ✅ EXISTS
│   │   ├── SafetyFilter.jsx          # ✅ EXISTS
│   │   └── SearchBar.jsx             # Search input
│   ├── onboarding/
│   │   ├── DisclaimerPage.jsx        # ✅ CREATED
│   │   ├── AgePregnancyPage.jsx      # Age/trimester selection
│   │   ├── DietaryPage.jsx           # Dietary restrictions
│   │   └── index.js                  # ✅ CREATED
│   ├── premium/
│   │   ├── PremiumPage.jsx           # Premium purchase page
│   │   └── PremiumModal.jsx          # Premium upsell modal
│   ├── views/
│   │   ├── AboutView.jsx             # ✅ CREATED
│   │   ├── FAQView.jsx               # FAQ page
│   │   ├── TopicsView.jsx            # ✅ CREATED
│   │   ├── HomeView.jsx              # Main home page
│   │   └── index.js                  # ✅ CREATED
│   ├── BottomNav.jsx                 # ✅ EXISTS
│   ├── DailyTip.jsx                  # ✅ EXISTS
│   └── index.js                      # ✅ EXISTS (needs update)
├── data/
│   ├── staticFoods.js                # ✅ EXISTS - Food data
│   └── faqs.js                       # FAQ data (extract from App.js)
├── utils/
│   ├── constants.js                  # ✅ EXISTS
│   ├── helpers.js                    # ✅ EXISTS
│   └── index.js                      # ✅ EXISTS
└── App.js                            # Main app (orchestration only)
```

## Refactoring Progress

### Phase 1: Extract Data ✅
- [x] constants.js - Safety config, category icons
- [x] helpers.js - Utility functions
- [ ] faqs.js - FAQ data array

### Phase 2: Extract Views ✅ PARTIAL
- [x] AboutView.jsx
- [x] TopicsView.jsx
- [ ] FAQView.jsx
- [ ] HomeView.jsx

### Phase 3: Extract Onboarding ✅ PARTIAL
- [x] DisclaimerPage.jsx
- [ ] CreateAccountPage.jsx
- [ ] AgePregnancyPage.jsx
- [ ] DietaryPage.jsx

### Phase 4: Extract Food Components
- [ ] FoodDetailModal.jsx (update existing)
- [ ] FoodList.jsx
- [ ] Update FoodCard.jsx

### Phase 5: Extract Auth & Premium
- [ ] AuthCallback.jsx
- [ ] PremiumPage.jsx
- [ ] PremiumModal.jsx

### Phase 6: Final Cleanup
- [ ] Update App.js imports
- [ ] Remove extracted code from App.js
- [ ] Test all functionality
- [ ] Update barrel exports

## Notes
- Keep App.js as the main orchestrator with state management
- Components should receive props for data and callbacks
- Avoid circular dependencies
- Test after each extraction

## Estimated Size After Refactoring
- App.js: ~800-1000 lines (state management + routing)
- Individual components: 50-200 lines each
