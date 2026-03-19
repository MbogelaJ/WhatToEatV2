// API Configuration
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Safety Configuration
export const SAFETY_CONFIG = {
  SAFE: { color: '#10b981', bgColor: '#d1fae5', label: 'Generally Safe' },
  LIMIT: { color: '#f59e0b', bgColor: '#fef3c7', label: 'Limit Intake' },
  AVOID: { color: '#ef4444', bgColor: '#fee2e2', label: 'Best Avoided' }
};

// Dietary Restrictions Options
export const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', name: 'Vegan', icon: '🌱' },
  { id: 'gluten-free', name: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy-free', name: 'Dairy-Free', icon: '🥛' },
  { id: 'nut-allergy', name: 'Nut Allergy', icon: '🥜' },
  { id: 'shellfish-allergy', name: 'Shellfish Allergy', icon: '🦐' },
  { id: 'egg-allergy', name: 'Egg Allergy', icon: '🥚' },
  { id: 'soy-allergy', name: 'Soy Allergy', icon: '🫘' },
  { id: 'halal', name: 'Halal', icon: '☪️' },
  { id: 'kosher', name: 'Kosher', icon: '✡️' }
];
