/**
 * Application-wide constants and configuration values
 */

// Cache durations
export const CACHE = {
  AMENITIES_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  LISTINGS_DURATION_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// API configuration
export const API = {
  NOMINATIM_BASE: 'https://nominatim.openstreetmap.org',
  OVERPASS_ENDPOINTS: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ],
  DIFY_WORKFLOW_ENDPOINT: 'https://api.dify.ai/v1/workflows/run',
  DIFY_CHAT_ENDPOINT: 'https://api.dify.ai/v1/chat-messages',
} as const;

// IndexedDB configuration
export const DB = {
  CACHE_NAME: 'nestai-cache',
  SESSIONS_NAME: 'nestai-sessions',
  STORES: {
    AMENITIES: 'amenities',
    LISTINGS: 'listings',
    SESSIONS: 'sessions',
    MESSAGES: 'messages',
    STATE: 'state',
  },
} as const;

// UI configuration
export const UI = {
  DEBOUNCE_SEARCH_MS: 350,
  DEBOUNCE_SAVE_MS: 2000,
  GEOLOCATION_TIMEOUT_MS: 10000,
  REVERSE_GEOCODE_TIMEOUT_MS: 3500,
  MAX_MESSAGES_KEPT: 6,
  SEARCH_RESULTS_LIMIT: 7,
} as const;

// Overpass query timeout
export const OVERPASS_TIMEOUT_SECONDS = 12;

// Default values
export const DEFAULTS = {
  RADIUS_KM: 3 as const,
  LISTING_TYPE: 'rent' as const,
  LANGUAGE: 'en' as const,
} as const;
