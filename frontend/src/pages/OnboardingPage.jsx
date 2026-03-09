import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Calendar, Utensils, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';

const dietaryOptions = [
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No gluten-containing foods' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No dairy products' },
  { id: 'nut-allergy', label: 'Nut Allergy', description: 'Avoid all nuts' },
  { id: 'shellfish-allergy', label: 'Shellfish Allergy', description: 'Avoid shellfish' },
  { id: 'halal', label: 'Halal', description: 'Halal diet requirements' },
  { id: 'kosher', label: 'Kosher', description: 'Kosher diet requirements' },
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

  const totalSteps = 3;

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.age) {
        newErrors.age = 'Please enter your age';
      } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 55) {
        newErrors.age = 'Please enter a valid age (18-55)';
      }
    }

    if (step === 2) {
      if (!formData.pregnancyWeeks) {
        newErrors.pregnancyWeeks = 'Please enter your pregnancy week';
      } else if (parseInt(formData.pregnancyWeeks) < 1 || parseInt(formData.pregnancyWeeks) > 42) {
        newErrors.pregnancyWeeks = 'Please enter a valid week (1-42)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        // Complete onboarding
        const userData = {
          ...formData,
          age: parseInt(formData.age),
          pregnancyWeeks: parseInt(formData.pregnancyWeeks),
          onboardingCompleted: true,
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        saveUser(userData);
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
          <h1 className="text-2xl font-bold text-stone-800">Welcome to WhatToEat</h1>
          <p className="text-stone-500 mt-2">Let's personalize your experience</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? 'bg-emerald-600' : s < step ? 'bg-emerald-300' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Age */}
        {step === 1 && (
          <div className="space-y-6" data-testid="step-age">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <User className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Your Age</h2>
                  <p className="text-sm text-stone-500">This helps us provide relevant information</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  How old are you?
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Enter your age"
                  min="18"
                  max="55"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  data-testid="age-input"
                />
                {errors.age && (
                  <p className="text-red-500 text-sm">{errors.age}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pregnancy Week */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-pregnancy">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Pregnancy Stage</h2>
                  <p className="text-sm text-stone-500">To show trimester-specific content</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">
                  How many weeks pregnant are you?
                </label>
                <input
                  type="number"
                  value={formData.pregnancyWeeks}
                  onChange={(e) => setFormData({ ...formData, pregnancyWeeks: e.target.value })}
                  placeholder="Enter weeks (1-42)"
                  min="1"
                  max="42"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  data-testid="pregnancy-weeks-input"
                />
                {errors.pregnancyWeeks && (
                  <p className="text-red-500 text-sm">{errors.pregnancyWeeks}</p>
                )}
              </div>

              {trimester && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="font-medium text-emerald-800">{trimester.label}</p>
                  <p className="text-sm text-emerald-600">{trimester.range}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Dietary Considerations */}
        {step === 3 && (
          <div className="space-y-6" data-testid="step-dietary">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Utensils className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Dietary Considerations</h2>
                  <p className="text-sm text-stone-500">Optional - helps filter content</p>
                </div>
              </div>

              <div className="space-y-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDietaryOption(option.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between ${
                      formData.dietaryRestrictions.includes(option.id)
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                    data-testid={`dietary-${option.id}`}
                  >
                    <div>
                      <p className="font-medium text-stone-800">{option.label}</p>
                      <p className="text-xs text-stone-500">{option.description}</p>
                    </div>
                    {formData.dietaryRestrictions.includes(option.id) && (
                      <Check className="text-emerald-600" size={20} />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-stone-400 mt-4 text-center">
                You can skip this step or change it later in Settings
              </p>
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
            {step === totalSteps ? 'Get Started' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Skip Option */}
        {step === 3 && (
          <button
            onClick={handleNext}
            className="w-full mt-4 py-2 text-stone-500 text-sm hover:text-stone-700 transition-colors"
            data-testid="skip-btn"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
