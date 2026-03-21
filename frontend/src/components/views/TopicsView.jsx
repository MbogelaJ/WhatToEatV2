import React, { useState } from 'react';
import { Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';

const TopicsView = ({ isPremium, onNavigateToPremium }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  
  const topics = [
    {
      title: "First Trimester Nutrition",
      icon: "🌱",
      description: "Essential nutrients for early pregnancy development",
      tips: ["Focus on folate-rich foods like leafy greens", "Stay hydrated to combat morning sickness", "Eat small, frequent meals", "Prioritize protein for baby's cell growth"],
      isPremium: false
    },
    {
      title: "Foods to Avoid",
      icon: "⚠️",
      description: "Important restrictions during pregnancy",
      tips: ["Raw or undercooked meats and eggs", "High-mercury fish (shark, swordfish)", "Unpasteurized dairy products", "Alcohol - no safe amount established", "Excessive caffeine (limit to 200mg/day)"],
      isPremium: true
    },
    {
      title: "Managing Morning Sickness",
      icon: "🍋",
      description: "Foods that may help ease nausea",
      tips: ["Ginger tea or ginger candies", "Plain crackers before getting up", "Cold foods may be more tolerable", "Avoid strong-smelling foods", "Eat small portions frequently"],
      isPremium: true
    },
    {
      title: "Iron & Preventing Anemia",
      icon: "💪",
      description: "Building healthy blood for you and baby",
      tips: ["Red meat is the best iron source", "Pair plant iron with vitamin C", "Cook in cast iron when possible", "Avoid calcium with iron-rich meals", "Consider iron-fortified cereals"],
      isPremium: true
    },
    {
      title: "Gestational Diabetes Nutrition",
      icon: "🩺",
      description: "Managing blood sugar through diet during pregnancy",
      tips: [
        "Choose complex carbs over simple sugars",
        "Pair carbs with protein and healthy fats",
        "Eat smaller, more frequent meals",
        "Monitor portion sizes of starchy foods",
        "Include fiber-rich vegetables at every meal",
        "Limit fruit juice and sugary drinks",
        "Choose whole grains over refined grains"
      ],
      isPremium: false
    },
    {
      title: "Preeclampsia & Nutrition",
      icon: "❤️",
      description: "Dietary factors for blood pressure management",
      tips: [
        "Adequate calcium intake (1000mg daily)",
        "Foods rich in potassium (bananas, potatoes)",
        "Limit sodium/salt intake",
        "Include magnesium-rich foods (nuts, seeds)",
        "Stay well hydrated",
        "Eat plenty of fruits and vegetables",
        "Include lean protein at each meal"
      ],
      isPremium: true
    },
    {
      title: "Calcium & Bone Health",
      icon: "🦴",
      description: "Supporting baby's skeletal development",
      tips: ["Dairy products are excellent sources", "Fortified plant milks work too", "Sardines with bones are calcium-rich", "Leafy greens provide some calcium", "Vitamin D helps calcium absorption"],
      isPremium: true
    },
    {
      title: "Third Trimester Focus",
      icon: "👶",
      description: "Preparing for delivery and breastfeeding",
      tips: ["Omega-3s for brain development", "Dates may help with labor prep", "Keep protein intake high", "Stay hydrated for amniotic fluid", "Prepare freezer meals for postpartum"],
      isPremium: true
    }
  ];

  const handleTopicClick = (index, topic) => {
    if (topic.isPremium && !isPremium) {
      if (onNavigateToPremium) {
        onNavigateToPremium();
      }
      return;
    }
    setExpandedTopic(expandedTopic === index ? null : index);
  };

  return (
    <div className="page-view" data-testid="topics-view">
      <div className="page-content">
        <p className="page-intro">Learn about pregnancy nutrition topics.</p>
        
        <div className="topics-grid">
          {topics.map((topic, index) => {
            const isLocked = topic.isPremium && !isPremium;
            const isExpanded = expandedTopic === index && !isLocked;
            
            return (
              <div 
                key={index} 
                className={`topic-card ${isLocked ? 'locked' : ''} ${isExpanded ? 'expanded' : ''}`}
                data-testid={`topic-card-${index}`}
                onClick={() => handleTopicClick(index, topic)}
              >
                {isLocked && (
                  <div className="topic-premium-badge">
                    <Lock size={14} />
                    <span>Premium</span>
                  </div>
                )}
                <div className="topic-header">
                  <span className="topic-icon">{topic.icon}</span>
                  <h3>{topic.title}</h3>
                </div>
                <p className="topic-description">{topic.description}</p>
                
                {isLocked ? (
                  <div className="topic-locked-content">
                    <p className="topic-locked-message">Unlock premium to access this topic</p>
                    <button className="topic-unlock-btn">
                      <Lock size={14} />
                      Unlock Premium
                    </button>
                  </div>
                ) : (
                  <ul className={`topic-tips ${isExpanded ? 'show' : ''}`}>
                    {topic.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>
                        <Check size={14} className="tip-check" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {!isLocked && (
                  <button className="topic-expand-btn">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {isExpanded ? 'Show less' : 'Show tips'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicsView;
