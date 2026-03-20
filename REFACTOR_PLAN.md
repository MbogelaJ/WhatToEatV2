# WhatToEat App - Refactoring Plan

## Current State
The frontend application has been partially refactored with utility modules extracted. The main `App.js` file remains large (~2900 lines) but now has supporting modules that can be used for future incremental refactoring.

## Completed Refactoring Work

### 1. Created Utils Module (`/src/utils/`)
- **constants.js**: Contains SAFETY_CONFIG, DIETARY_RESTRICTIONS, CATEGORY_ICONS, API configuration
- **helpers.js**: Contains isCapacitorNative(), isIOS(), getCategoryIcon(), checkDietaryConcerns(), handleNativeAppleSignIn()
- **index.js**: Barrel export file

### 2. Created Data Module (`/src/data/`)
- **dailyTips.js**: Contains DAILY_TIPS array and DIETARY_SPECIFIC_TIPS object
- **faqs.js**: Contains ALL_FAQS array (40+ FAQ items)
- **index.js**: Barrel export file

### 3. Directory Structure Created
```
/src/
├── components/
│   ├── auth/          # For auth-related components
│   ├── common/        # For shared components (BottomNav, SafetyBadge)
│   ├── filters/       # For filter components
│   ├── food/          # For food-related components (FoodCard, FoodDetailModal)
│   ├── onboarding/    # For onboarding flow components
│   ├── premium/       # For premium-related components
│   ├── views/         # For page views (FAQView, TopicsView, AboutView)
│   └── ui/            # Shadcn UI components (already present)
├── data/
│   ├── dailyTips.js
│   ├── faqs.js
│   └── index.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── index.js
├── App.js             # Main component (still monolithic)
└── App.css            # Styles (could be split in future)
```

## Future Refactoring Tasks (Incremental)

### Phase 1: Extract Simple Components
1. **SafetyBadge** -> `/components/common/SafetyBadge.jsx`
2. **BottomNav** -> `/components/common/BottomNav.jsx`
3. **CategoryFilter** -> `/components/filters/CategoryFilter.jsx`
4. **SafetyFilter** -> `/components/filters/SafetyFilter.jsx`

### Phase 2: Extract Food Components
1. **FoodCard** -> `/components/food/FoodCard.jsx`
2. **FoodDetailModal** -> `/components/food/FoodDetailModal.jsx`

### Phase 3: Extract View Components
1. **FAQView** -> `/components/views/FAQView.jsx`
2. **TopicsView** -> `/components/views/TopicsView.jsx`
3. **AboutView** -> `/components/views/AboutView.jsx`

### Phase 4: Extract Onboarding Components
1. **DisclaimerPage** -> `/components/onboarding/DisclaimerPage.jsx`
2. **CreateAccountPage** -> `/components/onboarding/CreateAccountPage.jsx`
3. **AgePregnancyPage** -> `/components/onboarding/AgePregnancyPage.jsx`
4. **DietaryConsiderationsPage** -> `/components/onboarding/DietaryConsiderationsPage.jsx`

### Phase 5: Extract Premium/Auth Components
1. **PremiumPage** -> `/components/premium/PremiumPage.jsx`
2. **AuthCallback** -> `/components/auth/AuthCallback.jsx`

## CSS Refactoring (Future)
The `App.css` file is also large (~4700 lines). Future work could:
1. Split into component-specific CSS modules
2. Use CSS-in-JS or styled-components
3. Create a design tokens file for colors, spacing, etc.

## How to Use Extracted Modules
When ready to use the extracted modules, update App.js imports:

```javascript
// Import from utils
import { SAFETY_CONFIG, DIETARY_RESTRICTIONS, API } from './utils';
import { getCategoryIcon, checkDietaryConcerns } from './utils';

// Import from data
import { ALL_FAQS } from './data';
import { DAILY_TIPS, DIETARY_SPECIFIC_TIPS } from './data';
```

## Notes
- The monolithic App.js still works - refactoring is backward compatible
- Extract components one at a time and test after each extraction
- Keep the existing code working while incrementally moving to modules
- Consider using React Context for shared state when extracting components
