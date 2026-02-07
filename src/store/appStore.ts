import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Location, 
  RadiusKm, 
  ListingType, 
  AmenitiesData, 
  Listing, 
  DifyMessage,
  DifyAmenity,
} from '@/types';

// Generate a simple session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a simple user ID
function generateUserId(): number {
  return Math.floor(Math.random() * 1000000);
}

interface AppStore {
  // Location
  location: Location | null;
  setLocation: (location: Location | null) => void;
  
  // Settings
  radiusKm: RadiusKm;
  setRadiusKm: (radius: RadiusKm) => void;
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  countryCode: string | null;
  setCountryCode: (code: string | null) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Price filters
  priceMin: number;
  priceMax: number;
  setPriceRange: (min: number, max: number) => void;
  
  // UI state
  isMapPickerOpen: boolean;
  setMapPickerOpen: (open: boolean) => void;
  isHistoryDrawerOpen: boolean;
  setHistoryDrawerOpen: (open: boolean) => void;
  isCompareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  activeTab: 'amenities' | 'listings';
  setActiveTab: (tab: 'amenities' | 'listings') => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  
  // Data
  amenities: AmenitiesData | null;
  setAmenities: (data: AmenitiesData | null) => void;
  listings: Listing[];
  setListings: (listings: Listing[]) => void;
  difyAmenities: DifyAmenity[];
  setDifyAmenities: (amenities: DifyAmenity[]) => void;
  
  // Selection
  selectedOfferIds: string[];
  toggleOfferSelection: (id: string, ctrlKey?: boolean) => void;
  clearSelection: () => void;
  selectedOfferId: string | null;
  setSelectedOfferId: (id: string | null) => void;
  
  // Chat
  messages: DifyMessage[];
  addMessage: (message: DifyMessage) => void;
  clearMessages: () => void;
  memorySummary: string;
  setMemorySummary: (summary: string) => void;
  
  // Session
  sessionId: string;
  userId: number;
  resetSession: () => void;
  
  // Demo mode
  isDemoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  
  // Reset
  resetLocation: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Location
      location: null,
      setLocation: (location) => set({ location }),
      
      // Settings
      radiusKm: 3,
      setRadiusKm: (radiusKm) => set({ radiusKm }),
      listingType: 'rent',
      setListingType: (listingType) => set({ listingType }),
      countryCode: null,
      setCountryCode: (countryCode) => set({ countryCode }),
      isDarkMode: false,
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      // Price filters
      priceMin: 0,
      priceMax: 0,
      setPriceRange: (priceMin, priceMax) => set({ priceMin, priceMax }),
      
      // UI state
      isMapPickerOpen: false,
      setMapPickerOpen: (open) => set({ 
        isMapPickerOpen: open,
        isHistoryDrawerOpen: open ? false : get().isHistoryDrawerOpen,
        isCompareModalOpen: open ? false : get().isCompareModalOpen,
      }),
      isHistoryDrawerOpen: false,
      setHistoryDrawerOpen: (open) => set({ 
        isHistoryDrawerOpen: open,
        isMapPickerOpen: open ? false : get().isMapPickerOpen,
        isCompareModalOpen: open ? false : get().isCompareModalOpen,
      }),
      isCompareModalOpen: false,
      setCompareModalOpen: (open) => set({ 
        isCompareModalOpen: open,
        isMapPickerOpen: open ? false : get().isMapPickerOpen,
        isHistoryDrawerOpen: open ? false : get().isHistoryDrawerOpen,
      }),
      isSettingsOpen: false,
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      activeTab: 'listings',
      setActiveTab: (activeTab) => set({ activeTab }),
      isPanelOpen: true,
      setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
      togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
      
      // Data
      amenities: null,
      setAmenities: (amenities) => set({ amenities }),
      listings: [],
      setListings: (listings) => set({ listings }),
      difyAmenities: [],
      setDifyAmenities: (difyAmenities) => set({ difyAmenities }),
      
      // Selection - supports ctrl/cmd click for multi-select
      selectedOfferIds: [],
      toggleOfferSelection: (id, ctrlKey = false) => {
        const current = get().selectedOfferIds;
        if (ctrlKey) {
          // Multi-select mode with ctrl/cmd
          if (current.includes(id)) {
            set({ selectedOfferIds: current.filter(i => i !== id) });
          } else if (current.length < 2) {
            set({ selectedOfferIds: [...current, id] });
          }
        } else {
          // Single select mode - toggle
          if (current.includes(id)) {
            set({ selectedOfferIds: current.filter(i => i !== id) });
          } else if (current.length < 2) {
            set({ selectedOfferIds: [...current, id] });
          }
        }
      },
      clearSelection: () => set({ selectedOfferIds: [], selectedOfferId: null }),
      selectedOfferId: null,
      setSelectedOfferId: (selectedOfferId) => set({ selectedOfferId }),
      
      // Chat
      messages: [],
      addMessage: (message) => set({ messages: [...get().messages, message] }),
      clearMessages: () => set({ messages: [] }),
      memorySummary: '',
      setMemorySummary: (memorySummary) => set({ memorySummary }),
      
      // Session
      sessionId: generateSessionId(),
      userId: generateUserId(),
      resetSession: () => set({ 
        sessionId: generateSessionId(),
        messages: [],
        memorySummary: '',
      }),
      
      // Demo mode
      isDemoMode: false,
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      
      // Reset
      resetLocation: () => set({ 
        location: null, 
        amenities: null, 
        listings: [], 
        selectedOfferIds: [],
        selectedOfferId: null,
        isDemoMode: false,
        messages: [],
        priceMin: 0,
        priceMax: 0,
        difyAmenities: [],
      }),
    }),
    {
      name: 'nestai-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        listingType: state.listingType,
        sessionId: state.sessionId,
        userId: state.userId,
      }),
    }
  )
);
