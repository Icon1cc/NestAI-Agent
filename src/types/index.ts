// Location types
export interface Location {
  label: string;
  lat: number;
  lng: number;
  countryCode?: string;
  city?: string;
  country?: string;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  namedetails?: {
    name?: string;
  };
}

// Radius options - only 1, 3, 7, 10
export type RadiusKm = 1 | 3 | 7 | 10;

// Listing types
export type ListingType = 'rent' | 'buy';

export interface ListingPrice {
  amount: number;
  currency: string;
  period: 'month' | 'total';
}

// Nice to have details from Dify
export interface NiceToHave {
  posted_date?: string;
  area_m2?: number;
  rooms?: number;
  deposit?: number;
  furnished?: boolean;
  requirements?: string[];
}

// Analysis with summary
export interface OfferAnalysis {
  summary?: string;
  pros: string[];
  cons: string[];
}

// Internal listing format used in UI
export interface Listing {
  id: string;
  title: string;
  price: ListingPrice;
  address: string;
  lat: number;
  lng: number;
  photos: string[];
  rooms: number;
  areaM2: number;
  provider: string;
  source_url: string;
  redirect_url?: string;
  badges: string[];
  score: number; // 0-10 scale internally
  rank: number; // 0-1 scale from Dify
  distance?: number;
  summary?: string;
  pros?: string[];
  cons?: string[];
  nice_to_have?: NiceToHave;
  closest_amenity_ids?: number[];
}

// Dify offer schema (normalized from API)
// Supports both 'long' and 'lng' for compatibility with Dify API
export interface DifyOffer {
  property_id: number;
  lat: number;
  lng?: number; // normalized internal field
  long?: number; // Dify API uses 'long'
  rank: number;
  photos: string[];
  price: number;
  rent_or_buy: boolean; // true = rent, false = buy
  adress: string;
  redirect_url?: string;
  nice_to_have?: NiceToHave;
  analysis: OfferAnalysis;
  closest_amenity_ids: number[];
}

export interface ListingsResponse {
  listings: Listing[];
  meta: {
    fetchedAt: string;
    providerCounts: Record<string, number>;
  };
  errors: string[];
}

// Amenity types - exactly these categories
// IMPORTANT: Internal storage uses 'healtcare' (typo) for Dify compatibility
// UI displays as 'Healthcare'
export type AmenityCategory = 'groceries' | 'parks' | 'schools' | 'transit' | 'healthcare' | 'fitness';
export type DifyAmenityCategory = 'groceries' | 'parks' | 'schools' | 'transit' | 'healtcare' | 'fitness';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  lat: number;
  lng: number;
  distance?: number;
  tags?: Record<string, string>;
  amenity_id?: number;
  description?: string;
}

// Normalized internal amenity from Dify
// Supports both 'long' and 'lng' for compatibility
export interface DifyAmenity {
  amenity_id: number;
  lat: number;
  lng?: number; // normalized internal field
  long?: number; // Dify API uses 'long'
  category: AmenityCategory | 'healtcare'; // Handle Dify typo
  description: string;
}

export interface AmenitiesData {
  groceries: Amenity[];
  parks: Amenity[];
  schools: Amenity[];
  transit: Amenity[];
  healthcare: Amenity[];
  fitness: Amenity[];
}

// Search filters
export interface SearchFilters {
  budgetMin?: number;
  budgetMax?: number;
  minRooms?: number;
  minAreaM2?: number;
  maxCommuteMin?: number;
  furnished?: boolean;
  moveInDate?: string;
}

// Budget quick chips
export const BUDGET_CHIPS = [
  { label: 'Under €800', min: 0, max: 800 },
  { label: '€800-1200', min: 800, max: 1200 },
  { label: '€1200-1600', min: 1200, max: 1600 },
  { label: '€1600+', min: 1600, max: 999999 },
] as const;

// Dify integration
export type DifyMode = 'chat' | 'compare';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyRequest {
  mode: DifyMode;
  user_prompt: string;
  session_id: string;
  user_id: number;
  locale: string;
  countryCode: string;
  price_min: number;
  price_max: number;
  radiusKm: RadiusKm;
  location: { lat: number; lng: number };
}

// Updated compare request with full offer data
export interface DifyCompareRequest {
  mode: 'compare';
  session_id: string;
  user_id: number;
  offer_id1: number;
  offer_id2: number;
  offer1: {
    property_id: number;
    analysis: OfferAnalysis;
    amenities: DifyAmenity[];
  };
  offer2: {
    property_id: number;
    analysis: OfferAnalysis;
    amenities: DifyAmenity[];
  };
}

export interface DifyResponse {
  assistant_text: string;
  session_id: string;
  user_id: number;
  offers: DifyOffer[];
  amenities: DifyAmenity[];
}

export interface DifyCompareResponse {
  action: 'compare';
  assistant_text_property1: string;
  assistant_text_property2: string;
}

// Session/History stored in IndexedDB
export interface Session {
  id: string;
  createdAt: string;
  location?: Location;
  messages: DifyMessage[];
  memorySummary: string;
  listings: Listing[];
  selectedOfferIds: string[];
  countryCode?: string;
  priceMin?: number;
  priceMax?: number;
  radiusKm?: RadiusKm;
  amenitiesSnapshot?: AmenitiesData;
  offersSnapshot?: Listing[];
  difyAmenities?: DifyAmenity[];
}

// App state
export interface AppState {
  // Location
  location: Location | null;
  isLocationLoading: boolean;
  locationError: string | null;
  
  // Settings
  radiusKm: RadiusKm;
  listingType: ListingType;
  countryCode: string | null;
  isDarkMode: boolean;
  
  // Price filters
  priceMin: number;
  priceMax: number;
  
  // UI state
  isMapPickerOpen: boolean;
  isHistoryDrawerOpen: boolean;
  isCompareModalOpen: boolean;
  isSettingsOpen: boolean;
  activeTab: 'amenities' | 'listings';
  
  // Data
  amenities: AmenitiesData | null;
  isAmenitiesLoading: boolean;
  amenitiesError: string | null;
  
  listings: Listing[];
  isListingsLoading: boolean;
  listingsError: string | null;
  
  // Dify amenities (from API response)
  difyAmenities: DifyAmenity[];
  
  // Selection
  selectedOfferIds: string[];
  selectedOfferId: string | null; // Currently viewed offer details
  
  // Chat
  messages: DifyMessage[];
  memorySummary: string;
  isChatLoading: boolean;
  
  // Session
  sessionId: string;
  userId: number;
  
  // Demo mode
  isDemoMode: boolean;
}

// Helper to normalize category from Dify (handles typos like "healtcare")
export function normalizeCategory(cat: string): AmenityCategory {
  const normalized = cat.toLowerCase().trim();
  if (normalized === 'healtcare' || normalized === 'healthcare') return 'healthcare';
  if (normalized === 'gyms' || normalized === 'fitness') return 'fitness';
  if (['groceries', 'parks', 'schools', 'transit'].includes(normalized)) {
    return normalized as AmenityCategory;
  }
  return 'transit'; // fallback
}

// Helper to get Dify category (with typo)
export function toDifyCategory(cat: AmenityCategory): DifyAmenityCategory {
  if (cat === 'healthcare') return 'healtcare';
  return cat as DifyAmenityCategory;
}

// Helper to normalize offer lng from long/lng
export function normalizeOfferLng(offer: any): number {
  return offer.lng ?? offer.long ?? 0;
}

// Get category display label (for UI)
export function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    groceries: 'Groceries',
    parks: 'Parks',
    schools: 'Schools',
    transit: 'Transit',
    healtcare: 'Healthcare',
    healthcare: 'Healthcare',
    fitness: 'Fitness',
  };
  return labels[cat.toLowerCase()] || cat;
}

// Calculate distance between two coordinates in km
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
