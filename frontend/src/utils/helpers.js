import { CATEGORY_ICONS } from './constants';

// Capacitor detection for native app
export const isCapacitorNative = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNativePlatform && 
         window.Capacitor.isNativePlatform();
};

// iOS platform detection
export const isIOS = () => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === 'ios';
};

// Get category icon for food item with fuzzy matching
export const getCategoryIcon = (category) => {
  if (!category) return CATEGORY_ICONS.default || '🍽️';
  
  // Check for exact match first
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  
  // Check for partial matches
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('fruit')) return '🍎';
  if (lowerCat.includes('vegetable') || lowerCat.includes('veg')) return '🥬';
  if (lowerCat.includes('fish') || lowerCat.includes('seafood')) return '🐟';
  if (lowerCat.includes('meat') || lowerCat.includes('protein')) return '🥩';
  if (lowerCat.includes('dairy') || lowerCat.includes('milk') || lowerCat.includes('cheese')) return '🥛';
  if (lowerCat.includes('grain') || lowerCat.includes('bread') || lowerCat.includes('cereal')) return '🌾';
  if (lowerCat.includes('beverage') || lowerCat.includes('drink')) return '🥤';
  if (lowerCat.includes('nut') || lowerCat.includes('seed')) return '🥜';
  if (lowerCat.includes('egg')) return '🥚';
  if (lowerCat.includes('herb') || lowerCat.includes('spice')) return '🌿';
  if (lowerCat.includes('dessert') || lowerCat.includes('sweet')) return '🍰';
  if (lowerCat.includes('processed') || lowerCat.includes('fast') || lowerCat.includes('street')) return '🍔';
  if (lowerCat.includes('legume') || lowerCat.includes('bean')) return '🫘';
  if (lowerCat.includes('condiment') || lowerCat.includes('sauce')) return '🧂';
  
  return CATEGORY_ICONS.default || '🍽️';
};

// Get related FAQs for a food item
export const getRelatedFAQs = (foodName, allFaqs) => {
  const lowercaseName = foodName.toLowerCase();
  return allFaqs.filter(faq => {
    const questionLower = faq.question.toLowerCase();
    const answerLower = faq.answer.toLowerCase();
    return questionLower.includes(lowercaseName) || answerLower.includes(lowercaseName);
  }).slice(0, 3);
};

// Check for dietary concerns based on food and restrictions
export const checkDietaryConcerns = (food, restrictions) => {
  const concerns = [];
  const foodNameLower = food.name.toLowerCase();
  const categoryLower = food.category?.toLowerCase() || '';
  
  // Define food-restriction mappings
  const restrictionChecks = {
    'vegetarian': {
      categories: ['meat', 'poultry', 'seafood', 'fish', 'shellfish'],
      keywords: ['beef', 'pork', 'chicken', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'crab']
    },
    'vegan': {
      categories: ['meat', 'poultry', 'seafood', 'fish', 'shellfish', 'dairy', 'eggs'],
      keywords: ['beef', 'pork', 'chicken', 'fish', 'milk', 'cheese', 'egg', 'butter', 'yogurt', 'cream']
    },
    'gluten-free': {
      categories: ['grains'],
      keywords: ['wheat', 'bread', 'pasta', 'flour', 'barley', 'rye', 'couscous']
    },
    'dairy-free': {
      categories: ['dairy', 'cheese'],
      keywords: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'ice cream']
    },
    'nut-allergy': {
      categories: ['nuts'],
      keywords: ['almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'hazelnut', 'peanut']
    },
    'shellfish-allergy': {
      categories: ['shellfish'],
      keywords: ['shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop']
    },
    'soy-allergy': {
      categories: [],
      keywords: ['soy', 'tofu', 'edamame', 'tempeh', 'miso']
    },
    'egg-allergy': {
      categories: ['eggs'],
      keywords: ['egg']
    }
  };

  restrictions.forEach(restriction => {
    const check = restrictionChecks[restriction];
    if (!check) return;

    const hasConflict = 
      check.categories.some(cat => categoryLower.includes(cat)) ||
      check.keywords.some(keyword => foodNameLower.includes(keyword));

    if (hasConflict) {
      const restrictionLabels = {
        'vegetarian': 'Vegetarian',
        'vegan': 'Vegan',
        'gluten-free': 'Gluten-Free',
        'dairy-free': 'Dairy-Free',
        'nut-allergy': 'Nut Allergy',
        'shellfish-allergy': 'Shellfish Allergy',
        'soy-allergy': 'Soy Allergy',
        'egg-allergy': 'Egg Allergy'
      };
      concerns.push({
        restriction: restrictionLabels[restriction] || restriction,
        message: `May not be suitable for ${restrictionLabels[restriction] || restriction} diet`
      });
    }
  });

  return concerns;
};

// Apple Sign-In handler for native iOS
export const handleNativeAppleSignIn = async () => {
  try {
    if (!window.Capacitor?.Plugins?.SignInWithApple) {
      throw new Error('SignInWithApple plugin not available');
    }
    
    const SignInWithApple = window.Capacitor.Plugins.SignInWithApple;
    
    const response = await SignInWithApple.authorize({
      clientId: 'com.whattoeat.penx.app',
      redirectURI: '',
      scopes: 'email name',
      state: 'state' + Date.now(),
      nonce: 'nonce' + Date.now()
    });
    
    const user = {
      user_id: `apple_${response.response.user}`,
      email: response.response.email || `private.${response.response.user}@privaterelay.appleid.com`,
      name: response.response.givenName 
        ? `${response.response.givenName} ${response.response.familyName || ''}`.trim()
        : 'Apple User',
      picture: null,
      auth_provider: 'apple'
    };
    
    return { success: true, user };
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    return { success: false, error: error.message };
  }
};
