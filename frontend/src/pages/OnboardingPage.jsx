import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Calendar, Utensils, Shield, Check, AlertTriangle, Loader } from 'lucide-react';
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

const pregnancyStages = [
  { id: 'first-trimester', label: 'First Trimester (Weeks 1-12)', trimester: 1 },
  { id: 'second-trimester', label: 'Second Trimester (Weeks 13-26)', trimester: 2 },
  { id: 'third-trimester', label: 'Third Trimester (Weeks 27-40)', trimester: 3 },
  { id: 'postpartum', label: 'Postpartum (After delivery)', trimester: 4 },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { register, login, saveUser } = useUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    authMode: 'signup', // 'signup' or 'signin'
    age: '',
    pregnancyStage: '',
    dietaryRestrictions: [],
  });
  const [errors, setErrors] = useState({});

  const totalSteps = 3;

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.age) {
      newErrors.age = 'Please enter your age';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 55) {
      newErrors.age = 'Please enter a valid age (18-55)';
    }

    if (!formData.pregnancyStage) {
      newErrors.pregnancyStage = 'Please select your pregnancy stage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      // Move from disclaimer to auth page
      setStep(2);
    } else if (step === 2) {
      // Validate auth and either login or register
      if (validateStep2()) {
        setIsLoading(true);
        setErrors({});
        
        try {
          if (formData.authMode === 'signin') {
            // Login existing user
            const result = await login(formData.email, formData.password);
            if (result.success) {
              navigate('/');
              return;
            } else {
              setErrors({ auth: result.error });
            }
          } else {
            // For signup, move to profile step to collect more info
            setStep(3);
          }
        } catch (err) {
          setErrors({ auth: 'An error occurred. Please try again.' });
        } finally {
          setIsLoading(false);
        }
      }
    } else if (step === 3) {
      // Validate and complete registration
      if (validateStep3()) {
        setIsLoading(true);
        setErrors({});
        
        const selectedStage = pregnancyStages.find(s => s.id === formData.pregnancyStage);
        
        try {
          const result = await register(formData.email, formData.password, {
            age: parseInt(formData.age),
            trimester: selectedStage?.trimester || null,
            pregnancyStageLabel: selectedStage?.label || '',
            dietaryRestrictions: formData.dietaryRestrictions
          });
          
          if (result.success) {
            navigate('/');
          } else {
            setErrors({ auth: result.error });
          }
        } catch (err) {
          setErrors({ auth: 'Registration failed. Please try again.' });
        } finally {
          setIsLoading(false);
        }
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

  const selectPregnancyStage = (stageId) => {
    setFormData((prev) => ({
      ...prev,
      pregnancyStage: stageId,
    }));
    // Clear error when selection is made
    if (errors.pregnancyStage) {
      setErrors((prev) => ({ ...prev, pregnancyStage: null }));
    }
  };

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
          {[1, 2, 3].map((s) => (
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

        {/* Step 2: Sign In / Sign Up */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-auth">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              {/* Auth Mode Toggle */}
              <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authMode: 'signup' })}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                    formData.authMode === 'signup'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-stone-500'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authMode: 'signin' })}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                    formData.authMode === 'signin'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-stone-500'
                  }`}
                >
                  Sign In
                </button>
              </div>

              <h2 className="text-xl font-semibold text-stone-800 mb-2 text-center">
                {formData.authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-stone-500 mb-6 text-center">
                {formData.authMode === 'signup' 
                  ? 'Sign up to save your preferences' 
                  : 'Sign in to access your profile'}
              </p>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  data-testid="email-input"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={formData.authMode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  data-testid="password-input"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Auth Error Message */}
              {errors.auth && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{errors.auth}</p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-stone-200"></div>
                <span className="text-sm text-stone-400">or</span>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>

              {/* Social Login Buttons - Icons Only in One Row */}
              <div className="flex items-center justify-center gap-4">
                {/* Google */}
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                  data-testid="google-login-btn"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-xl hover:bg-stone-800 transition-colors"
                  data-testid="apple-login-btn"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-colors"
                  data-testid="facebook-login-btn"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* Instagram */}
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-xl hover:opacity-90 transition-opacity"
                  data-testid="instagram-login-btn"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </button>
              </div>

              <p className="text-xs text-stone-400 text-center mt-6">
                Your data is stored locally on your device for privacy
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Profile Information */}
        {step === 3 && (
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

            {/* Pregnancy Stage Selection */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Pregnancy Stage</h2>
                  <p className="text-xs text-stone-500">Select your current stage</p>
                </div>
              </div>

              <div className="space-y-2">
                {pregnancyStages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => selectPregnancyStage(stage.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors flex items-center justify-between ${
                      formData.pregnancyStage === stage.id
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                    data-testid={`stage-${stage.id}`}
                  >
                    <p className="font-medium text-stone-800">{stage.label}</p>
                    {formData.pregnancyStage === stage.id && (
                      <Check className="text-emerald-600" size={20} />
                    )}
                  </button>
                ))}
              </div>
              {errors.pregnancyStage && (
                <p className="text-red-500 text-sm mt-2">{errors.pregnancyStage}</p>
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
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-stone-200 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="back-btn"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-emerald-600 rounded-xl text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="next-btn"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                {step === 1 ? 'I Understand' : step === 2 ? (formData.authMode === 'signup' ? 'Continue' : 'Sign In') : 'Get Started'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
