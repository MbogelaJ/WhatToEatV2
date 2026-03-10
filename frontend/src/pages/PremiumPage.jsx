import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function PremiumPage() {
  const navigate = useNavigate();
  const { isPremium } = useUser();

  const features = [
    { title: 'Daily Personalized Tips', description: 'Nutrition tips tailored to your trimester', free: true, premium: true },
    { title: 'Food Safety Database', description: 'Access to 85+ food items with safety info', free: true, premium: true },
    { title: 'Nutrition Topics Search', description: 'Search educational nutrition content', free: true, premium: true },
    { title: 'Trimester-Specific Content', description: 'Content filtered by your pregnancy stage', free: false, premium: true },
    { title: 'Dietary Filtering', description: 'Filter foods by your dietary needs', free: false, premium: true },
    { title: 'Ad-Free Experience', description: 'Enjoy the app without interruptions', free: false, premium: true },
    { title: 'Priority Support', description: 'Get faster responses from our team', free: false, premium: true },
    { title: 'Offline Access', description: 'Access content without internet', free: false, premium: true },
  ];

  if (isPremium()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6" data-testid="premium-active-page">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Crown className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">You're Premium!</h1>
          <p className="text-stone-600 mb-8">
            Thank you for supporting WhatToEat. Enjoy all premium features!
          </p>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 max-w-md mx-auto">
            <h2 className="font-semibold text-amber-800 mb-4">Your Premium Benefits</h2>
            <ul className="space-y-3 text-left">
              {features.filter(f => f.premium && !f.free).map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-amber-700">
                  <Check size={18} className="text-amber-600" />
                  <span className="text-sm">{feature.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="premium-page">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles size={16} />
          Special Offer
        </div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Upgrade to Premium</h1>
        <p className="text-stone-600">
          Get the most out of your pregnancy nutrition journey
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-sm mx-auto mb-8">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-200 text-sm">Premium Access</p>
              <p className="text-3xl font-bold">$0.99</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown size={28} />
            </div>
          </div>
          <p className="text-emerald-100 text-sm mb-4">
            One-time payment • 12 months access
          </p>
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full py-3 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            data-testid="subscribe-btn"
          >
            Get Premium Now
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200">
          <div className="p-4 font-medium text-stone-800">Features</div>
          <div className="p-4 text-center font-medium text-stone-600">Free</div>
          <div className="p-4 text-center font-medium text-amber-600">Premium</div>
        </div>
        
        {features.map((feature, index) => (
          <div
            key={index}
            className={`grid grid-cols-3 ${index !== features.length - 1 ? 'border-b border-stone-100' : ''}`}
          >
            <div className="p-4">
              <p className="font-medium text-stone-800 text-sm">{feature.title}</p>
              <p className="text-xs text-stone-500">{feature.description}</p>
            </div>
            <div className="p-4 flex items-center justify-center">
              {feature.free ? (
                <Check className="text-emerald-600" size={20} />
              ) : (
                <span className="text-stone-300">—</span>
              )}
            </div>
            <div className="p-4 flex items-center justify-center bg-amber-50/50">
              <Check className="text-amber-600" size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/subscribe')}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 mx-auto"
          data-testid="subscribe-btn-bottom"
        >
          <Star size={20} />
          Unlock Premium for $0.99
        </button>
        <p className="text-xs text-stone-500 mt-3">
          One-time payment • 12 months access
        </p>
      </div>
    </div>
  );
}
