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
  badges: string[];
  score: number;
  distance?: number;
  pros?: string[];
  cons?: string[];
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
  analysis: {
    pros: string[];
    cons: string[];
  };
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
export type AmenityCategory = 'groceries' | 'parks' | 'schools' | 'transit' | 'healthcare' | 'fitness';

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

export interface DifyCompareRequest {
  mode: 'compare';
  session_id: string;
  user_id: number;
  offer_id1: number;
  offer_id2: number;
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
  
  // Selection
  selectedOfferIds: string[];
  
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

// Helper to normalize offer lng from long/lng
export function normalizeOfferLng(offer: any): number {
  return offer.lng ?? offer.long ?? 0;
}
