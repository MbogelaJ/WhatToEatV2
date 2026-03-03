import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, DisclaimerModal } from './components/layout/Layout';
import HomePage from './pages/HomePage';
import FoodDetailPage from './pages/FoodDetailPage';
import TopicsPage from './pages/TopicsPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import { TermsPage, PrivacyPage, SupportPage } from './pages/LegalPages';
import './App.css';

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Check if user has accepted disclaimer this session
    const hasAccepted = sessionStorage.getItem('disclaimer_accepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    sessionStorage.setItem('disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  return (
    <BrowserRouter>
      {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/food/:id" element={<FoodDetailPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
