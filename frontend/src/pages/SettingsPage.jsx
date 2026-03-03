import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Shield, HelpCircle, Bell } from 'lucide-react';

export default function SettingsPage() {
  const settingsItems = [
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage daily tip notifications',
      to: null,
      external: false,
    },
    {
      icon: FileText,
      label: 'Terms of Use',
      description: 'Read our terms and conditions',
      to: '/terms',
      external: false,
    },
    {
      icon: Shield,
      label: 'Privacy Policy',
      description: 'How we handle your data',
      to: '/privacy',
      external: false,
    },
    {
      icon: HelpCircle,
      label: 'Support',
      description: 'Get help and contact us',
      to: '/support',
      external: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="settings-page">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Settings</h2>

      <div className="space-y-3">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <Icon className="text-stone-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-800">{item.label}</h3>
                <p className="text-sm text-stone-500">{item.description}</p>
              </div>
              <ChevronRight className="text-stone-400" size={20} />
            </div>
          );

          if (item.to) {
            return (
              <Link key={item.label} to={item.to} data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              className="w-full text-left"
              onClick={() => alert('This feature is coming soon!')}
              data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {content}
            </button>
          );
        })}
      </div>

      {/* App Version */}
      <div className="mt-8 text-center text-xs text-stone-400">
        <p>WhatToEat v1.0.0</p>
        <p>Pregnancy Nutrition Education</p>
      </div>
    </div>
  );
}
