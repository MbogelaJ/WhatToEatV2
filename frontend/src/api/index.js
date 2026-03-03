import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Foods API
export const foodsApi = {
  getAll: () => api.get('/foods'),
  getById: (id) => api.get(`/foods/${id}`),
  search: (query) => api.get(`/foods/search?q=${encodeURIComponent(query)}`),
  getByCategory: (category) => api.get(`/foods/category/${encodeURIComponent(category)}`),
  getBySafety: (level) => api.get(`/foods/safety/${level}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

// Nutrition Topics API
export const topicsApi = {
  search: (query) => api.post('/nutrition-topics/search', { query }),
};

// About API
export const aboutApi = {
  get: () => api.get('/about'),
};

// Emergency Info API
export const emergencyApi = {
  get: () => api.get('/emergency-info'),
};

// Tips API
export const tipsApi = {
  getToday: (trimester) => api.get(`/tips/today${trimester ? `?trimester=${trimester}` : ''}`),
  getAll: (trimester) => api.get(`/tips/all${trimester ? `?trimester=${trimester}` : ''}`),
  getByIndex: (index, trimester) => api.get(`/tips/${index}${trimester ? `?trimester=${trimester}` : ''}`),
};

export default api;
