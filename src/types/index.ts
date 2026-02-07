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

// Radius options
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

export interface ListingsResponse {
  listings: Listing[];
  meta: {
    fetchedAt: string;
    providerCounts: Record<string, number>;
  };
  errors: string[];
}

// Amenity types
export type AmenityCategory = 'groceries' | 'gyms' | 'parks' | 'transit';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  lat: number;
  lng: number;
  distance?: number;
  tags?: Record<string, string>;
}

export interface AmenitiesData {
  groceries: Amenity[];
  gyms: Amenity[];
  parks: Amenity[];
  transit: Amenity[];
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

// Property search request
export interface PropertySearchRequest {
  countryCode?: string;
  listingType: ListingType;
  radiusKm: RadiusKm;
  location: Location;
  filters: SearchFilters;
  sort: 'best' | 'price_asc' | 'price_desc' | 'distance';
}

// Dify integration
export type DifyMode = 'search' | 'compare' | 'chat';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyRequest {
  mode: DifyMode;
  user_prompt: string;
  countryCode?: string;
  radiusKm: RadiusKm;
  listingType: ListingType;
  location: Location;
  filters: SearchFilters;
  memory_summary: string;
  recent_messages: DifyMessage[];
  amenities: AmenitiesData;
  listings: Listing[];
  selected_offer_ids: string[];
}

export interface DifyResponse {
  assistant_text: string;
  offers: Listing[];
  comparison?: {
    offer1: Listing;
    offer2: Listing;
    summary: string;
    winner?: string;
  };
  errors: string[];
}

// Session/History
export interface Session {
  id: string;
  createdAt: string;
  location?: Location;
  messages: DifyMessage[];
  memorySummary: string;
  listings: Listing[];
  selectedOfferIds: string[];
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
  
  // Demo mode
  isDemoMode: boolean;
}
