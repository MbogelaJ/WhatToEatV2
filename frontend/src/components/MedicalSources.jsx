/**
 * Medical Sources Component
 * Displays citations and sources for the health information in the app
 * Required for Apple App Store compliance (Guideline 1.4.1)
 */
import React from 'react';

// Medical sources used for food safety information
export const MEDICAL_SOURCES = [
  {
    id: 'acog',
    name: 'American College of Obstetricians and Gynecologists (ACOG)',
    url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy',
    description: 'Nutrition guidelines during pregnancy'
  },
  {
    id: 'fda',
    name: 'U.S. Food and Drug Administration (FDA)',
    url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish',
    description: 'Fish consumption guidelines for pregnant women'
  },
  {
    id: 'cdc',
    name: 'Centers for Disease Control and Prevention (CDC)',
    url: 'https://www.cdc.gov/listeria/prevention.html',
    description: 'Food safety and Listeria prevention'
  },
  {
    id: 'who',
    name: 'World Health Organization (WHO)',
    url: 'https://www.who.int/health-topics/nutrition',
    description: 'Global nutrition and health guidelines'
  },
  {
    id: 'nih',
    name: 'National Institutes of Health (NIH)',
    url: 'https://ods.od.nih.gov/factsheets/list-all/',
    description: 'Dietary supplements and nutrient information'
  },
  {
    id: 'mayo',
    name: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/pregnancy-nutrition/art-20045082',
    description: 'Pregnancy nutrition recommendations'
  },
  {
    id: 'apa',
    name: 'American Pregnancy Association',
    url: 'https://americanpregnancy.org/healthy-pregnancy/pregnancy-health-wellness/foods-to-avoid-during-pregnancy/',
    description: 'Foods to avoid during pregnancy'
  },
  {
    id: 'marchofdimes',
    name: 'March of Dimes',
    url: 'https://www.marchofdimes.org/pregnancy/vitamins-and-other-nutrients-during-pregnancy.aspx',
    description: 'Vitamins and nutrients during pregnancy'
  },
  {
    id: 'foodsafety',
    name: 'FoodSafety.gov',
    url: 'https://www.foodsafety.gov/people-at-risk/pregnant-women',
    description: 'Food safety guidelines for pregnant women'
  },
  {
    id: 'healthline',
    name: 'Healthline (Medically Reviewed)',
    url: 'https://www.healthline.com/nutrition/pregnancy-foods',
    description: 'Evidence-based pregnancy nutrition articles'
  }
];

export function MedicalSources({ onClose }) {
  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="medical-sources-container">
      <div className="medical-sources-header">
        <h2>Medical Sources & References</h2>
        <p>The food safety information in WhatToEat is based on recommendations from the following trusted medical sources:</p>
      </div>

      <div className="medical-sources-list">
        {MEDICAL_SOURCES.map((source) => (
          <div 
            key={source.id} 
            className="medical-source-item"
            onClick={() => openLink(source.url)}
          >
            <div className="source-info">
              <h3>{source.name}</h3>
              <p>{source.description}</p>
            </div>
            <div className="source-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="medical-sources-disclaimer">
        <h3>Important Disclaimer</h3>
        <p>
          The information provided in this app is for educational purposes only and should not replace 
          professional medical advice, diagnosis, or treatment. Always consult with your healthcare 
          provider, obstetrician, or registered dietitian about your specific dietary needs during pregnancy.
        </p>
        <p>
          Food safety recommendations may vary based on your individual health conditions, location, 
          and specific circumstances. When in doubt, always err on the side of caution and consult 
          a medical professional.
        </p>
      </div>

      {onClose && (
        <button className="medical-sources-close" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );
}

// Inline citation component for use within content
export function Citation({ sourceId }) {
  const source = MEDICAL_SOURCES.find(s => s.id === sourceId);
  if (!source) return null;
  
  return (
    <a 
      href={source.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-citation"
      title={source.name}
    >
      [{source.name.split('(')[1]?.replace(')', '') || source.id.toUpperCase()}]
    </a>
  );
}

export default MedicalSources;
