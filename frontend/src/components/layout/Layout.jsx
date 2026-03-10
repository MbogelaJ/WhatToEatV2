import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, BookOpen, Info, Settings, ChevronLeft, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useUser();
  
  // Don't show back button on home page
  const showBackButton = location.pathname !== '/';
  
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-600"
                data-testid="back-button"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-lg font-semibold text-stone-800">WhatToEat</h1>
            </Link>
          </div>
          
          {/* Account/Profile Button */}
          <button
            onClick={() => navigate(isAuthenticated() ? '/settings' : '/onboarding')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
            data-testid="profile-button"
          >
            <User size={18} className="text-stone-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/topics', icon: BookOpen, label: 'Topics' },
    { path: '/about', icon: Info, label: 'About' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40">
      <nav className="max-w-4xl mx-auto px-4">
        <ul className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-emerald-600' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function DisclaimerModal({ onAccept }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">
          Important Notice
        </h2>
        <div className="space-y-3 text-sm text-stone-600 mb-6">
          <p>
            This app provides <strong>general educational information</strong> about 
            nutrition during pregnancy compiled from public health sources.
          </p>
          <p>
            This is <strong>not medical advice</strong>. It does not replace consultation 
            with qualified healthcare professionals.
          </p>
          <p>
            Individual circumstances vary. Please consult your healthcare provider for 
            personalized guidance.
          </p>
        </div>
        <button
          onClick={onAccept}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          data-testid="disclaimer-accept-btn"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
