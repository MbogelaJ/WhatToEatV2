import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Calendar, Utensils, Shield, Check, AlertTriangle } from 'lucide-react';
import { useUser } from '../context/UserContext';

const dietaryOptions = [
  // Dietary preferences
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No gluten-containing foods' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No dairy products' },
  { id: 'halal', label: 'Halal', description: 'Halal diet requirements' },
  { id: 'kosher', label: 'Kosher', description: 'Kosher diet requirements' },
  // Allergies
  { id: 'nut-allergy', label: 'Nut Allergy', description: 'Avoid all nuts' },
  { id: 'shellfish-allergy', label: 'Shellfish Allergy', description: 'Avoid shellfish' },
  { id: 'food-allergies', label: 'Food Allergies', description: 'Other food allergies' },
  { id: 'lactose-intolerance', label: 'Lactose Intolerance', description: 'Difficulty digesting lactose' },
  // Health conditions
  { id: 'gestational-diabetes', label: 'Gestational Diabetes', description: 'Blood sugar management' },
  { id: 'high-blood-pressure', label: 'High Blood Pressure', description: 'Hypertension considerations' },
  { id: 'anemia', label: 'Anemia', description: 'Iron deficiency concerns' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { saveUser } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    pregnancyWeeks: '',
    dietaryRestrictions: [],
  });
  const [errors, setErrors] = useState({});

  const totalSteps = 2;

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.age) {
      newErrors.age = 'Please enter your age';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 55) {
      newErrors.age = 'Please enter a valid age (18-55)';
    }

    if (!formData.pregnancyWeeks) {
      newErrors.pregnancyWeeks = 'Please enter your pregnancy week';
    } else if (parseInt(formData.pregnancyWeeks) < 1 || parseInt(formData.pregnancyWeeks) > 42) {
      newErrors.pregnancyWeeks = 'Please enter a valid week (1-42)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      // Move from disclaimer to profile page
      setStep(2);
    } else if (step === 2) {
      // Validate and complete onboarding
      if (validateStep2()) {
        const userData = {
          ...formData,
          age: parseInt(formData.age),
          pregnancyWeeks: parseInt(formData.pregnancyWeeks),
          onboardingCompleted: true,
          disclaimerAccepted: true,
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        saveUser(userData);
        // Also set session storage so disclaimer modal doesn't show again
        sessionStorage.setItem('disclaimer_accepted', 'true');
        navigate('/');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleDietaryOption = (optionId) => {
    setFormData((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(optionId)
        ? prev.dietaryRestrictions.filter((id) => id !== optionId)
        : [...prev.dietaryRestrictions, optionId],
    }));
  };

  const getTrimesterFromWeeks = (weeks) => {
    if (!weeks) return null;
    const w = parseInt(weeks);
    if (w <= 12) return { number: 1, label: 'First Trimester', range: 'Weeks 1-12' };
    if (w <= 27) return { number: 2, label: 'Second Trimester', range: 'Weeks 13-27' };
    return { number: 3, label: 'Third Trimester', range: 'Weeks 28-42' };
  };

  const trimester = getTrimesterFromWeeks(formData.pregnancyWeeks);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white" data-testid="onboarding-page">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200 z-50">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">WhatToEat</h1>
          <p className="text-stone-500 mt-2">Pregnancy Nutrition Guide</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? 'bg-emerald-600' : s < step ? 'bg-emerald-300' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Disclaimer */}
        {step === 1 && (
          <div className="space-y-6" data-testid="step-disclaimer">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Shield className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Important Notice</h2>
                  <p className="text-sm text-stone-500">Please read before continuing</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-stone-600">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                  <p>
                    This app provides <strong>general educational information</strong> about 
                    nutrition during pregnancy compiled from public health sources.
                  </p>
                </div>

                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                  <p>
                    This is <strong>not medical advice</strong>. It does not replace consultation 
                    with qualified healthcare professionals.
                  </p>
                </div>

                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                  <p>
                    Individual circumstances vary. Please consult your healthcare provider for 
                    personalized guidance about your diet and nutrition.
                  </p>
                </div>

                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                  <p>
                    If you experience any concerning symptoms, <strong>seek medical attention 
                    immediately</strong>. Do not rely on this app for medical decisions.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">
                  By continuing, you acknowledge that you have read and understood this disclaimer, 
                  and agree that this app is for educational purposes only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Profile Information */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-profile">
            {/* Age Input */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <User className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Your Age</h2>
                </div>
              </div>

              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter your age (18-55)"
                min="18"
                max="55"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                data-testid="age-input"
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age}</p>
              )}
            </div>

            {/* Pregnancy Week Input */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Pregnancy Stage</h2>
                </div>
              </div>

              <input
                type="number"
                value={formData.pregnancyWeeks}
                onChange={(e) => setFormData({ ...formData, pregnancyWeeks: e.target.value })}
                placeholder="Enter weeks (1-42)"
                min="1"
                max="42"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                data-testid="pregnancy-weeks-input"
              />
              {errors.pregnancyWeeks && (
                <p className="text-red-500 text-sm mt-1">{errors.pregnancyWeeks}</p>
              )}

              {trimester && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="font-medium text-emerald-800">{trimester.label}</p>
                  <p className="text-sm text-emerald-600">{trimester.range}</p>
                </div>
              )}
            </div>

            {/* Dietary Considerations */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Utensils className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Dietary Considerations</h2>
                  <p className="text-xs text-stone-500">Optional - helps personalize content</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDietaryOption(option.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      formData.dietaryRestrictions.includes(option.id)
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                    data-testid={`dietary-${option.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-stone-800 text-sm">{option.label}</p>
                      {formData.dietaryRestrictions.includes(option.id) && (
                        <Check className="text-emerald-600" size={16} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 border border-stone-200 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              data-testid="back-btn"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 bg-emerald-600 rounded-xl text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            data-testid="next-btn"
          >
            {step === 1 ? 'I Understand' : 'Get Started'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
