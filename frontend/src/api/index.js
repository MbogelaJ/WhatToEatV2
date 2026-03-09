import axios from 'axios';
import { 
  getFromCache, 
  saveToCache, 
  CACHE_KEYS, 
  CACHE_DURATIONS 
} from '../utils/cache';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('whattoeat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to fetch with cache
async function fetchWithCache(key, fetcher, duration = CACHE_DURATIONS.LONG) {
  // Try to get from cache first
  const cached = getFromCache(key);
  if (cached) {
    return { data: cached, fromCache: true };
  }
  
  // Fetch from server
  const response = await fetcher();
  
  // Save to cache
  saveToCache(key, response.data, duration);
  
  return response;
}

// Auth API
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Foods API with caching
export const foodsApi = {
  getAll: async () => {
    return fetchWithCache(
      CACHE_KEYS.FOODS_ALL, 
      () => api.get('/foods'),
      CACHE_DURATIONS.LONG
    );
  },
  getById: async (id) => {
    return fetchWithCache(
      CACHE_KEYS.FOOD_DETAIL(id),
      () => api.get(`/foods/${id}`),
      CACHE_DURATIONS.LONG
    );
  },
  search: (query) => api.get(`/foods/search?q=${encodeURIComponent(query)}`),
  getByCategory: (category) => api.get(`/foods/category/${encodeURIComponent(category)}`),
  getBySafety: (level) => api.get(`/foods/safety/${level}`),
  getPersonalized: (healthConditions, trimester) => api.post('/foods/personalized', {
    health_conditions: healthConditions || [],
    trimester: trimester || null
  }),
  getForCondition: (condition) => api.get(`/foods/recommended/${condition}`),
};

// Categories API with caching
export const categoriesApi = {
  getAll: async () => {
    return fetchWithCache(
      CACHE_KEYS.CATEGORIES,
      () => api.get('/categories'),
      CACHE_DURATIONS.LONG
    );
  },
};

// Nutrition Topics API
export const topicsApi = {
  search: (query) => api.post('/nutrition-topics/search', { query }),
};

// About API with caching
export const aboutApi = {
  get: async () => {
    return fetchWithCache(
      CACHE_KEYS.ABOUT,
      () => api.get('/about'),
      CACHE_DURATIONS.WEEK
    );
  },
};

// Emergency Info API
export const emergencyApi = {
  get: () => api.get('/emergency-info'),
};

// Tips API with caching for all tips
export const tipsApi = {
  getToday: (trimester) => api.get(`/tips/today${trimester ? `?trimester=${trimester}` : ''}`),
  getAll: async (trimester) => {
    const cacheKey = `${CACHE_KEYS.TIPS_ALL}_${trimester || 'all'}`;
    return fetchWithCache(
      cacheKey,
      () => api.get(`/tips/all${trimester ? `?trimester=${trimester}` : ''}`),
      CACHE_DURATIONS.MEDIUM
    );
  },
  getByIndex: (index, trimester) => api.get(`/tips/${index}${trimester ? `?trimester=${trimester}` : ''}`),
};

// Recommendations API with caching
export const recommendationsApi = {
  getForTrimester: (trimester) => api.get(`/recommendations/trimester/${trimester}`),
  getHealthConditions: async () => {
    return fetchWithCache(
      CACHE_KEYS.HEALTH_CONDITIONS,
      () => api.get('/health-conditions'),
      CACHE_DURATIONS.LONG
    );
  },
};

// Payments API
export const paymentsApi = {
  createCheckout: (originUrl, userId) => api.post('/payments/checkout', { origin_url: originUrl, user_id: userId }),
  getStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
  getPremiumStatus: (userId) => api.get(`/payments/user/${userId}/premium-status`),
};

export default api;
