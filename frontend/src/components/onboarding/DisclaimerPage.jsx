import React from 'react';
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react';

const DisclaimerPage = ({ onAccept }) => {
  return (
    <div className="onboarding-page disclaimer-page-v2" data-testid="disclaimer-page">
      {/* Header */}
      <div className="disclaimer-header">
        <div className="disclaimer-logo">
          <span>W</span>
        </div>
        <h1>WhatToEat</h1>
        <p className="disclaimer-subtitle">Pregnancy Nutrition Guide</p>
        <div className="progress-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      {/* Content Card */}
      <div className="disclaimer-card">
        <div className="disclaimer-card-header">
          <div className="notice-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>Important Notice</h2>
            <p>Please read before continuing</p>
          </div>
        </div>

        <div className="disclaimer-points">
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>This app provides <strong>general educational information</strong> about nutrition during pregnancy compiled from public health sources.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>This is <strong>not medical advice</strong>. It does not replace consultation with qualified healthcare professionals.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>Individual circumstances vary. Please consult your healthcare provider for personalized guidance about your diet and nutrition.</p>
          </div>
          <div className="disclaimer-point">
            <AlertTriangle size={20} className="point-icon" />
            <p>If you experience any concerning symptoms, <strong>seek medical attention immediately</strong>. Do not rely on this app for medical decisions.</p>
          </div>
        </div>

        <div className="disclaimer-agreement">
          <p>By continuing, you acknowledge that you have read and understood this disclaimer, and agree that this app is for educational purposes only.</p>
        </div>

        <p className="disclaimer-copyright">© 2026 PenX Technologies. All Rights Reserved.</p>
      </div>

      {/* Button */}
      <button 
        className="disclaimer-btn"
        onClick={onAccept}
        data-testid="disclaimer-accept-btn"
      >
        <span>I Understand</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default DisclaimerPage;
