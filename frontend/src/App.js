import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { UserProvider, useUser } from './context/UserContext';
import HomePage from './pages/HomePage';
import FoodDetailPage from './pages/FoodDetailPage';
import TopicsPage from './pages/TopicsPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import PremiumPage from './pages/PremiumPage';
import SubscribePage from './pages/SubscribePage';
import { TermsPage, PrivacyPage, SupportPage } from './pages/LegalPages';
import './App.css';

// Protected Route wrapper - requires completed onboarding
function ProtectedRoute({ children }) {
  const { hasCompletedOnboarding, user } = useUser();
  
  // Check sessionStorage as backup (for immediate post-registration navigation)
  const navigatingToPremium = sessionStorage.getItem('navigateToPremium') === 'true';
  
  if (!hasCompletedOnboarding() && !navigatingToPremium) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
}

// Premium Route wrapper - requires completed onboarding AND active premium subscription
function PremiumRoute({ children }) {
  const { hasCompletedOnboarding, isPremium } = useUser();
  
  // Check sessionStorage as backup (for immediate post-registration navigation)
  const navigatingToPremium = sessionStorage.getItem('navigateToPremium') === 'true';
  
  if (!hasCompletedOnboarding() && !navigatingToPremium) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (!isPremium()) {
    return <Navigate to="/premium" replace />;
  }
  
  return children;
}

// Layout wrapper for main app routes
function MainLayout({ children }) {
  return <Layout>{children}</Layout>;
}

function AppContent() {
  const { loading, hasCompletedOnboarding } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check if we're trying to navigate to premium after signup
  const isNavigatingToPremium = location.pathname === '/premium' || 
                                 sessionStorage.getItem('navigateToPremium') === 'true';

  return (
    <Routes>
      {/* Onboarding - always accessible (Home button goes here) */}
      <Route
        path="/onboarding"
        element={<OnboardingPage />}
      />

      {/* Subscribe page - no layout, allow access with session_id for payment return */}
      <Route
        path="/subscribe"
        element={<SubscribePage />}
      />

      {/* Main app routes - require premium subscription */}
      <Route
        path="/"
        element={
          <PremiumRoute>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </PremiumRoute>
        }
      />
      <Route
        path="/food/:id"
        element={
          <PremiumRoute>
            <MainLayout>
              <FoodDetailPage />
            </MainLayout>
          </PremiumRoute>
        }
      />
      <Route
        path="/topics"
        element={
          <PremiumRoute>
            <MainLayout>
              <TopicsPage />
            </MainLayout>
          </PremiumRoute>
        }
      />
      <Route
        path="/about"
        element={
          <PremiumRoute>
            <MainLayout>
              <AboutPage />
            </MainLayout>
          </PremiumRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PremiumRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </PremiumRoute>
        }
      />
      {/* Premium page - accessible without subscription (to allow purchase) */}
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PremiumPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/terms"
        element={
          <ProtectedRoute>
            <MainLayout>
              <TermsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PrivacyPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SupportPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </UserProvider>
  );
}

export default App;
