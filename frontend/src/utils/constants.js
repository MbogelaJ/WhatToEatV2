// Safety configuration for food items
export const SAFETY_CONFIG = {
  SAFE: { label: 'Generally Safe', color: '#22c55e', bgColor: '#dcfce7' },
  LIMIT: { label: 'Limit Intake', color: '#f59e0b', bgColor: '#fef3c7' },
  AVOID: { label: 'Best Avoided', color: '#ef4444', bgColor: '#fee2e2' }
};

// Dietary restrictions options
export const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'nut-allergy', label: 'Nut Allergy', icon: '🥜' },
  { id: 'shellfish-allergy', label: 'Shellfish Allergy', icon: '🦐' },
  { id: 'soy-allergy', label: 'Soy Allergy', icon: '🫘' },
  { id: 'egg-allergy', label: 'Egg Allergy', icon: '🥚' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'halal', label: 'Halal', icon: '☪️' }
];

// Category icons for food items
export const CATEGORY_ICONS = {
  'Fruits': '🍎',
  'Vegetables': '🥬',
  'Proteins': '🍗',
  'Meat & Protein': '🥩',
  'Fish & Seafood': '🐟',
  'Dairy': '🥛',
  'Grains': '🌾',
  'Beverages': '🥤',
  'Condiments': '🧂',
  'Desserts & Sweets': '🍰',
  'Nuts & Seeds': '🥜',
  'Legumes': '🫘',
  'Herbs & Spices': '🌿',
  'Street & Processed Foods': '🍔',
  'Eggs': '🥚',
  'Seafood': '🦐',
  'Poultry': '🍗',
  'Meat': '🥩',
  'Fish': '🐟',
  'Shellfish': '🦐',
  'Deli': '🥪',
  'Cheese': '🧀',
  'Snacks': '🍿',
  'Sweeteners': '🍯',
  'Other': '🍽️',
  'default': '🍽️'
};

// API configuration
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
