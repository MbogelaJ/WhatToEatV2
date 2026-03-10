import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const { hasCompletedOnboarding } = useUser();
  
  if (!hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
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

      {/* Subscribe page - no layout for clean checkout experience */}
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute>
            <SubscribePage />
          </ProtectedRoute>
        }
      />

      {/* Main app routes - with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/food/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <FoodDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/topics"
        element={
          <ProtectedRoute>
            <MainLayout>
              <TopicsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AboutPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
