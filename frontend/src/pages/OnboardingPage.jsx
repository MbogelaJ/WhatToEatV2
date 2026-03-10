import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Calendar, Utensils, Shield, Check, AlertTriangle, Loader } from 'lucide-react';
import { useUser } from '../context/UserContext';

const dietaryOptions = [
  // No restriction option
  { id: 'none', label: 'No Dietary Restrictions', description: 'I have no specific dietary needs' },
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
  const { register, login, updateProfile } = useUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    age: '',
    pregnancyStage: '',
    dietaryRestrictions: [],
  });
  const [errors, setErrors] = useState({});

  const totalSteps = 4; // Disclaimer, Auth, Profile (age+stage), Dietary

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
      // Disclaimer -> Auth
      setStep(2);
    } else if (step === 2) {
      // Auth step - just validate and proceed to profile
      if (validateStep2()) {
        setStep(3);
      }
    } else if (step === 3) {
      // Profile (age + stage) -> Dietary
      if (validateStep3()) {
        setStep(4);
      }
    } else if (step === 4) {
      // Dietary -> Complete registration -> Premium
      setIsLoading(true);
      setErrors({});
      const selectedStage = pregnancyStages.find(s => s.id === formData.pregnancyStage);
      
      // Filter out 'none' from dietary restrictions
      const actualRestrictions = formData.dietaryRestrictions.filter(r => r !== 'none');
      
      try {
        const result = await register(formData.email, formData.password, {
          age: parseInt(formData.age),
          trimester: selectedStage?.trimester || null,
          pregnancyStageLabel: selectedStage?.label || '',
          dietaryRestrictions: actualRestrictions
        });
        
        if (result.success) {
          sessionStorage.setItem('navigateToPremium', 'true');
          navigate('/premium', { replace: true });
          setTimeout(() => sessionStorage.removeItem('navigateToPremium'), 100);
        } else {
          // If email already registered, try to login instead
          if (result.error && result.error.includes('already registered')) {
            const loginResult = await login(formData.email, formData.password);
            if (loginResult.success) {
              // Update profile with new data after login
              await updateProfile({
                age: parseInt(formData.age),
                trimester: selectedStage?.trimester || null,
                pregnancyStageLabel: selectedStage?.label || '',
                dietaryRestrictions: actualRestrictions
              });
              sessionStorage.setItem('navigateToPremium', 'true');
              navigate('/premium', { replace: true });
              setTimeout(() => sessionStorage.removeItem('navigateToPremium'), 100);
            } else {
              setErrors({ auth: 'This email is already registered. Please go back and sign in instead.' });
            }
          } else {
            setErrors({ auth: result.error });
          }
        }
      } catch (err) {
        setErrors({ auth: 'Registration failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const toggleDietaryOption = (optionId) => {
    setFormData((prev) => {
      // If selecting 'none', clear all other selections
      if (optionId === 'none') {
        return {
          ...prev,
          dietaryRestrictions: prev.dietaryRestrictions.includes('none') ? [] : ['none']
        };
      }
      
      // If selecting another option, remove 'none' if it was selected
      let newRestrictions = prev.dietaryRestrictions.filter(r => r !== 'none');
      
      if (newRestrictions.includes(optionId)) {
        newRestrictions = newRestrictions.filter(r => r !== optionId);
      } else {
        newRestrictions = [...newRestrictions, optionId];
      }
      
      return {
        ...prev,
        dietaryRestrictions: newRestrictions
      };
    });
  };

  const selectPregnancyStage = (stageId) => {
    setFormData({ ...formData, pregnancyStage: stageId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">WhatToEat</h1>
          <p className="text-stone-500 text-sm">Pregnancy Nutrition Guide</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
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
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Important Notice</h2>
                  <p className="text-xs text-stone-500">Please read before continuing</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-stone-600">
                <div className="flex gap-2">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                  <p>This app provides <strong>general educational information</strong> about nutrition during pregnancy compiled from public health sources.</p>
                </div>
                <div className="flex gap-2">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                  <p>This is <strong>not medical advice</strong>. It does not replace consultation with qualified healthcare professionals.</p>
                </div>
                <div className="flex gap-2">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                  <p>Individual circumstances vary. Please consult your healthcare provider for personalized guidance about your diet and nutrition.</p>
                </div>
                <div className="flex gap-2">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                  <p>If you experience any concerning symptoms, <strong>seek medical attention immediately</strong>. Do not rely on this app for medical decisions.</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                  By continuing, you acknowledge that you have read and understood this disclaimer, 
                  and agree that this app is for educational purposes only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-auth">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-xl font-semibold text-stone-800 mb-2 text-center">
                Create Your Account
              </h2>
              <p className="text-sm text-stone-500 mb-6 text-center">
                Sign up to save your preferences
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
                  placeholder="Create a password (min 6 chars)"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  data-testid="password-input"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Auth Error */}
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

              {/* Social Login Icons */}
              <div className="flex items-center justify-center gap-4">
                <button type="button" className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors" data-testid="google-login-btn">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                <button type="button" className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-xl hover:bg-stone-800 transition-colors" data-testid="apple-login-btn">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </button>
                <button type="button" className="w-12 h-12 flex items-center justify-center bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-colors" data-testid="facebook-login-btn">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button type="button" className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-xl hover:opacity-90 transition-opacity" data-testid="instagram-login-btn">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </button>
              </div>

              <p className="text-xs text-stone-400 text-center mt-6">
                Your data is stored securely
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Age & Pregnancy Stage */}
        {step === 3 && (
          <div className="space-y-6" data-testid="step-profile">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <User className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Your Profile</h2>
                  <p className="text-xs text-stone-500">Help us personalize your experience</p>
                </div>
              </div>

              {/* Age Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Your Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Enter your age"
                  min="18"
                  max="55"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  data-testid="age-input"
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </div>
            </div>

            {/* Pregnancy Stage */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-pink-600" size={20} />
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
          </div>
        )}

        {/* Step 4: Dietary Considerations */}
        {step === 4 && (
          <div className="space-y-6" data-testid="step-dietary">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Utensils className="text-orange-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800">Dietary Considerations</h2>
                  <p className="text-xs text-stone-500">Select any that apply to you</p>
                </div>
              </div>

              {/* Auth Error */}
              {errors.auth && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{errors.auth}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDietaryOption(option.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      formData.dietaryRestrictions.includes(option.id)
                        ? option.id === 'none' 
                          ? 'bg-stone-100 border-stone-400'
                          : 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                    data-testid={`dietary-${option.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-800">{option.label}</span>
                      {formData.dietaryRestrictions.includes(option.id) && (
                        <Check className={option.id === 'none' ? 'text-stone-600' : 'text-emerald-600'} size={16} />
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
                {step === 1 ? 'I Understand' : 'Continue'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
