import React, { useState, useEffect } from 'react';
import { ExternalLink, Heart, Shield, BookOpen } from 'lucide-react';
import { aboutApi } from '../api';

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const response = await aboutApi.get();
        setAbout(response.data);
      } catch (error) {
        console.error('Error fetching about:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-1/3" />
          <div className="h-32 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="about-page">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">About</h2>

      <div className="space-y-6">
        {/* App Info */}
        <div className="bg-white rounded-xl p-5 border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">{about?.app_name || 'WhatToEat'}</h3>
              <p className="text-sm text-stone-500">{about?.purpose || 'Pregnancy Nutrition Education'}</p>
            </div>
          </div>
          <p className="text-stone-600 text-sm">{about?.description}</p>
        </div>

        {/* Data Sources */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="text-emerald-600" size={20} />
            <h3 className="font-semibold text-stone-800">Data Sources</h3>
          </div>
          <ul className="space-y-2">
            {about?.data_sources?.map((source, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-stone-600">
                <ExternalLink size={14} className="text-stone-400" />
                {source}
              </li>
            ))}
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="text-amber-600" size={20} />
            <h3 className="font-semibold text-amber-800">Important Disclaimer</h3>
          </div>
          <p className="text-amber-700 text-sm mb-3">{about?.disclaimer}</p>
          {about?.non_medical_statement && (
            <p className="text-amber-600 text-xs">{about?.non_medical_statement}</p>
          )}
        </div>

        {/* Version Info */}
        <div className="text-center text-xs text-stone-400 pt-4">
          <p>Version {about?.version || '1.0.0'}</p>
          <p>Last updated: {about?.last_updated || 'January 2026'}</p>
        </div>
      </div>
    </div>
  );
}
