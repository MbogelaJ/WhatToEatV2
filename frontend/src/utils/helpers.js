// Check if running in Capacitor native environment
export const isCapacitorNative = () => {
  return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
};

// Check if running on iOS
export const isIOS = () => {
  return window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios';
};

// Get related FAQs for a food item
export const getRelatedFAQs = (foodName, allFAQs) => {
  if (!foodName) return [];
  const searchTerms = foodName.toLowerCase().split(' ');
  
  return allFAQs.filter(faq => {
    const questionLower = faq.question.toLowerCase();
    const answerLower = faq.answer.toLowerCase();
    return searchTerms.some(term => 
      questionLower.includes(term) || answerLower.includes(term)
    );
  }).slice(0, 3);
};

// Check dietary concerns for a food
export const checkDietaryConcerns = (food, restrictions) => {
  const concerns = [];
  
  if (!food || !restrictions || restrictions.length === 0) return concerns;
  
  const category = (food.category || '').toLowerCase();
  const name = (food.name || '').toLowerCase();
  
  if (restrictions.includes('vegetarian') && category.includes('meat')) {
    concerns.push({ type: 'vegetarian', message: 'Contains meat - not suitable for vegetarians' });
  }
  if (restrictions.includes('vegan') && (category.includes('dairy') || category.includes('meat') || category.includes('egg'))) {
    concerns.push({ type: 'vegan', message: 'Contains animal products - not suitable for vegans' });
  }
  if (restrictions.includes('dairy-free') && category.includes('dairy')) {
    concerns.push({ type: 'dairy-free', message: 'Contains dairy' });
  }
  if (restrictions.includes('nut-allergy') && (name.includes('nut') || name.includes('almond') || name.includes('cashew'))) {
    concerns.push({ type: 'nut-allergy', message: 'May contain nuts' });
  }
  if (restrictions.includes('shellfish-allergy') && (name.includes('shrimp') || name.includes('crab') || name.includes('lobster') || name.includes('shellfish'))) {
    concerns.push({ type: 'shellfish-allergy', message: 'Contains shellfish' });
  }
  
  return concerns;
};
