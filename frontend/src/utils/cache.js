/**
 * Offline caching utility for food database and other static content
 * Uses localStorage with timestamp-based expiration
 */

const CACHE_PREFIX = 'whattoeat_cache_';
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found/expired
 */
export function getFromCache(key) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp, expiryMs } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > expiryMs) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (err) {
    console.warn('Cache read error:', err);
    return null;
  }
}

/**
 * Save item to cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiryMs - Cache expiry in milliseconds (default: 24 hours)
 */
export function saveToCache(key, data, expiryMs = DEFAULT_EXPIRY_MS) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiryMs
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (err) {
    // LocalStorage might be full - try to clear old cache entries
    console.warn('Cache write error:', err);
    clearExpiredCache();
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiryMs
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write failed after cleanup:', e);
    }
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    
    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp, expiryMs } = JSON.parse(cached);
          if (now - timestamp > expiryMs) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Cache cleanup error:', err);
  }
}

/**
 * Clear all app cache
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Clear cache error:', err);
  }
}

/**
 * Get cache statistics
 * @returns {object} - Cache stats including size and entry count
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    let totalSize = 0;
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // UTF-16 encoding = 2 bytes per char
      }
    });
    
    return {
      entryCount: keys.length,
      sizeBytes: totalSize,
      sizeKB: Math.round(totalSize / 1024 * 100) / 100
    };
  } catch (err) {
    return { entryCount: 0, sizeBytes: 0, sizeKB: 0 };
  }
}

// Cache keys for different data types
export const CACHE_KEYS = {
  FOODS_ALL: 'foods_all',
  CATEGORIES: 'categories',
  ABOUT: 'about',
  TIPS_ALL: 'tips_all',
  HEALTH_CONDITIONS: 'health_conditions',
  FOOD_DETAIL: (id) => `food_${id}`,
};

// Cache durations
export const CACHE_DURATIONS = {
  SHORT: 1 * 60 * 60 * 1000,    // 1 hour
  MEDIUM: 6 * 60 * 60 * 1000,   // 6 hours
  LONG: 24 * 60 * 60 * 1000,    // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000 // 7 days
};
