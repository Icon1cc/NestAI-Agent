import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Location, 
  RadiusKm, 
  ListingType, 
  AmenitiesData, 
  Listing, 
  DifyMessage 
} from '@/types';

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
  
  // Data
  amenities: AmenitiesData | null;
  setAmenities: (data: AmenitiesData | null) => void;
  listings: Listing[];
  setListings: (listings: Listing[]) => void;
  
  // Selection
  selectedOfferIds: string[];
  toggleOfferSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Chat
  messages: DifyMessage[];
  addMessage: (message: DifyMessage) => void;
  clearMessages: () => void;
  memorySummary: string;
  setMemorySummary: (summary: string) => void;
  
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
      
      // UI state
      isMapPickerOpen: false,
      setMapPickerOpen: (open) => set({ 
        isMapPickerOpen: open,
        // Close other overlays
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
      activeTab: 'amenities',
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // Data
      amenities: null,
      setAmenities: (amenities) => set({ amenities }),
      listings: [],
      setListings: (listings) => set({ listings }),
      
      // Selection
      selectedOfferIds: [],
      toggleOfferSelection: (id) => {
        const current = get().selectedOfferIds;
        if (current.includes(id)) {
          set({ selectedOfferIds: current.filter(i => i !== id) });
        } else if (current.length < 2) {
          set({ selectedOfferIds: [...current, id] });
        }
      },
      clearSelection: () => set({ selectedOfferIds: [] }),
      
      // Chat
      messages: [],
      addMessage: (message) => set({ messages: [...get().messages, message] }),
      clearMessages: () => set({ messages: [] }),
      memorySummary: '',
      setMemorySummary: (memorySummary) => set({ memorySummary }),
      
      // Demo mode
      isDemoMode: false,
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      
      // Reset
      resetLocation: () => set({ 
        location: null, 
        amenities: null, 
        listings: [], 
        selectedOfferIds: [],
        isDemoMode: false,
      }),
    }),
    {
      name: 'nestai-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        radiusKm: state.radiusKm,
        listingType: state.listingType,
        countryCode: state.countryCode,
      }),
    }
  )
);
