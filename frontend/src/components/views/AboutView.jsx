import React from 'react';
import { Check } from 'lucide-react';

const AboutView = () => {
  return (
    <div className="page-view" data-testid="about-view">
      <div className="page-content">
        <div className="about-section">
          <p className="version" style={{textAlign: 'center', marginBottom: '1rem'}}>Version 1.0.0</p>
        </div>

        <div className="about-section">
          <h3>About This App</h3>
          <p>
            WhatToEat is a pregnancy nutrition guide designed to help expectant mothers make informed food choices. 
            Browse our database of 288 foods with pregnancy-specific safety information, nutritional benefits, 
            and preparation tips.
          </p>
        </div>

        <div className="about-section">
          <h3>Features</h3>
          <ul className="feature-list">
            <li><Check size={16} /> 288 foods with pregnancy safety ratings</li>
            <li><Check size={16} /> Instant search and filtering</li>
            <li><Check size={16} /> Personalized dietary restriction alerts</li>
            <li><Check size={16} /> Nutritional benefits and precautions</li>
            <li><Check size={16} /> Preparation tips for safe consumption</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>Data Sources</h3>
          <p>
            Our information is compiled from reputable sources including the World Health Organization (WHO), 
            USDA FoodData Central, American College of Obstetricians and Gynecologists (ACOG), 
            FDA Food Safety Guidelines, CDC pregnancy nutrition recommendations, and NHS guidelines.
          </p>
        </div>

        <div className="about-section disclaimer-section">
          <h3>Medical Disclaimer</h3>
          <p>
            <strong>Important:</strong> This app is for educational purposes only and does not constitute medical advice. 
            The information provided should not be used for diagnosing or treating health problems. 
            Always consult with a qualified healthcare provider about your specific situation.
          </p>
          <p>
            Every pregnancy is unique. What is safe for one person may not be appropriate for another 
            based on individual health conditions, allergies, or medical history.
          </p>
        </div>

        <div className="about-section">
          <h3>Privacy</h3>
          <p>
            Your dietary preferences are stored locally on your device and are not transmitted to any server. 
            We respect your privacy and do not collect personal health information.
          </p>
        </div>

        <div className="about-footer">
          <p>Made with ❤️ for expectant mothers</p>
          <p className="copyright">© 2026 PenX Technologies. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
