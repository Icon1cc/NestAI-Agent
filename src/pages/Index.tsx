import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/TopBar';
import { LocationPicker } from '@/components/LocationPicker';
import { MapPickerModal } from '@/components/MapPickerModal';
import { MainLayout } from '@/components/MainLayout';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { CompareModal } from '@/components/CompareModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useAppStore } from '@/store/appStore';
import { useListings } from '@/hooks/useListings';
import { useAmenities } from '@/hooks/useAmenities';

// Berlin demo location as per spec
const BERLIN_DEMO_LOCATION = {
  label: 'Berlin, Germany',
  lat: 52.52,
  lng: 13.405,
  countryCode: 'DE',
  city: 'Berlin',
  country: 'Germany',
};

export default function Index() {
  const {
    location,
    setLocation,
    isDarkMode,
    isMapPickerOpen,
    setMapPickerOpen,
    isHistoryDrawerOpen,
    setHistoryDrawerOpen,
    isCompareModalOpen,
    setCompareModalOpen,
    isSettingsOpen,
    setSettingsOpen,
    setDemoMode,
    resetLocation,
    radiusKm,
    setRadiusKm,
    listingType,
    setActiveTab,
    setPriceRange,
    addMessage,
  } = useAppStore();

  const { listings, fetchListings } = useListings();
  const { fetchAmenities } = useAmenities();

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [isDarkMode]);

  const handlePickOnMap = useCallback(() => {
    setMapPickerOpen(true);
  }, [setMapPickerOpen]);

  const handleDemoMode = useCallback(async () => {
    // Set demo mode with Berlin location
    setDemoMode(true);
    setLocation(BERLIN_DEMO_LOCATION);
    setRadiusKm(3);
    setPriceRange(0, 1200);
    
    // Add demo user prompt
    addMessage({
      role: 'user',
      content: 'quiet area, parks nearby, good transit, budget under 1200',
    });
    
    // Fetch demo data
    await fetchAmenities(BERLIN_DEMO_LOCATION, 3);
    await fetchListings(BERLIN_DEMO_LOCATION, 3, 'rent', { budgetMax: 1200 }, true);
    
    // Add demo assistant response
    addMessage({
      role: 'assistant',
      content: `I found some great options in Berlin within your €1,200 budget! These listings are in quiet areas with good park access and transit connections. I've ranked them based on your preferences.`,
    });
    
    setActiveTab('listings');
  }, [setDemoMode, setLocation, setRadiusKm, setPriceRange, addMessage, fetchAmenities, fetchListings, setActiveTab]);

  const handleChangeLocation = useCallback(() => {
    resetLocation();
  }, [resetLocation]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <AnimatePresence mode="wait">
        {!location ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center pt-16"
          >
            <LocationPicker
              onPickOnMap={handlePickOnMap}
              onDemoMode={handleDemoMode}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MainLayout onChangeLocation={handleChangeLocation} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
      />
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      />
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        listings={listings}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
