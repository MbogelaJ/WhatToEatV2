# NurtureNote - Pregnancy Nutrition Education App

## Original Problem Statement
Refactor pregnancy nutrition app for Apple App Store health compliance to be clearly an EDUCATIONAL nutrition reference, not a medical advice or diagnostic app.

## Architecture
- **Frontend**: React with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (for potential user data - currently using in-memory food database)
- **Deployment**: Preview environment at health-ed-guide.preview.emergentagent.com

## User Personas
- Pregnant women seeking nutrition information
- Health-conscious parents-to-be
- Users looking for food safety guidance during pregnancy

## Core Requirements (Static)
1. Mandatory disclaimer modal on first load (session gate)
2. Inline disclaimers on all main pages
3. Educational language (no absolute statements)
4. Q&A with symptom detection safety guard
5. When to Seek Care section
6. References/sources on all content
7. About page with educational purpose, data sources, non-medical statement

## What's Been Implemented (January 2026)

### Backend (server.py)
- `/api/foods` - Get all foods
- `/api/foods/search?q=` - Search foods by name/category
- `/api/foods/{id}` - Get food details
- `/api/foods/category/{category}` - Filter by category
- `/api/foods/safety/{level}` - Filter by safety level
- `/api/qa/ask` - Q&A with symptom detection
- `/api/categories` - Get all categories
- `/api/about` - About page data
- `/api/emergency-info` - When to seek care data
- Sample database with 15 foods across categories

### Frontend (App.js)
- DisclaimerModal with session storage gate
- HomePage with search, category filters, food cards
- FoodDetailPage with sources, educational language
- QAPage with symptom detection, When to Seek Care section
- AboutPage with purpose, sources, disclaimer
- Footer navigation (Search, Q&A, About)

### Compliance Features
1. ✅ Disclaimer modal with "I Understand" button
2. ✅ Session-only storage (reappears each visit)
3. ✅ Inline disclaimers on all pages
4. ✅ Educational language: "Generally recommended to avoid", "Often limited", "Consider safer alternatives"
5. ✅ Symptom detection for: bleeding, pain, fever, vomiting, dizziness, etc.
6. ✅ Medical care redirect message
7. ✅ When to Seek Care section with symptoms list
8. ✅ Sources on food detail pages (WHO, CDC, NHS)
9. ✅ About page with educational purpose, data sources, non-medical statement

## Modified Files
- `/app/backend/server.py` - Complete backend API
- `/app/frontend/src/App.js` - Full React application
- `/app/frontend/src/index.css` - Custom styles with design system
- `/app/frontend/src/App.css` - Additional utility styles
- `/app/design_guidelines.json` - Design system

## Prioritized Backlog

### P0 (Critical) - DONE
- All compliance features implemented

### P1 (High Priority)
- User authentication for personalized experience
- Save favorite foods
- Pregnancy trimester-specific recommendations

### P2 (Medium Priority)
- Multi-language support
- Dark mode option
- Push notifications for daily nutrition tips

### P3 (Low Priority)
- Social sharing features
- User-submitted food questions
- Integration with healthcare provider portals

## Next Tasks
1. Consider adding more foods to database
2. Add food images from reliable sources
3. Implement user accounts for personalization
4. Add analytics for compliance monitoring
