import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Shield, HelpCircle, Bell, Crown, User, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isPremium, clearUser, getTrimester } = useUser();

  const trimesterLabels = {
    1: 'First Trimester',
    2: 'Second Trimester',
    3: 'Third Trimester',
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to reset your profile? This will clear all your data.')) {
      clearUser();
      navigate('/onboarding');
    }
  };

  const settingsItems = [
    {
      icon: Crown,
      label: isPremium() ? 'Premium Active' : 'Upgrade to Premium',
      description: isPremium() ? 'You have full access' : 'Unlock all features for $0.99',
      to: '/premium',
      highlight: !isPremium(),
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage daily tip notifications',
      to: null,
      action: () => alert('Notification settings coming soon!'),
    },
    {
      icon: FileText,
      label: 'Terms of Use',
      description: 'Read our terms and conditions',
      to: '/terms',
    },
    {
      icon: Shield,
      label: 'Privacy Policy',
      description: 'How we handle your data',
      to: '/privacy',
    },
    {
      icon: HelpCircle,
      label: 'Support',
      description: 'Get help and contact us',
      to: '/support',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="settings-page">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Settings</h2>

      {/* User Profile Card */}
      {user && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
              <User className="text-emerald-600" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-800">Your Profile</h3>
                {isPremium() && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    Premium
                  </span>
                )}
              </div>
              <div className="text-sm text-stone-500 mt-1">
                <span>Age: {user.age}</span>
                <span className="mx-2">•</span>
                <span>Week {user.pregnancyWeeks}</span>
                {getTrimester() && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{trimesterLabels[getTrimester()]}</span>
                  </>
                )}
              </div>
              {user.dietaryRestrictions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.dietaryRestrictions.map((restriction) => (
                    <span
                      key={restriction}
                      className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Items */}
      <div className="space-y-3">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`flex items-center gap-4 p-4 bg-white rounded-xl border transition-colors ${
                item.highlight
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.highlight ? 'bg-amber-100' : 'bg-stone-100'
                }`}
              >
                <Icon className={item.highlight ? 'text-amber-600' : 'text-stone-600'} size={20} />
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${item.highlight ? 'text-amber-800' : 'text-stone-800'}`}>
                  {item.label}
                </h3>
                <p className={`text-sm ${item.highlight ? 'text-amber-600' : 'text-stone-500'}`}>
                  {item.description}
                </p>
              </div>
              <ChevronRight className={item.highlight ? 'text-amber-400' : 'text-stone-400'} size={20} />
            </div>
          );

          if (item.to) {
            return (
              <Link
                key={item.label}
                to={item.to}
                data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              className="w-full text-left"
              onClick={item.action}
              data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {content}
            </button>
          );
        })}

        {/* Reset Profile */}
        <button
          onClick={handleLogout}
          className="w-full text-left"
          data-testid="settings-reset-profile"
        >
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-red-200 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-700">Reset Profile</h3>
              <p className="text-sm text-red-500">Clear all data and start over</p>
            </div>
            <ChevronRight className="text-red-400" size={20} />
          </div>
        </button>
      </div>

      {/* App Version */}
      <div className="mt-8 text-center text-xs text-stone-400">
        <p>WhatToEat v1.0.0</p>
        <p>Pregnancy Nutrition Education</p>
      </div>
    </div>
  );
}
