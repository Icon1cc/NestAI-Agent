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

const DEMO_LOCATION = {
  label: 'Prenzlauer Berg, Berlin, Germany',
  lat: 52.5388,
  lng: 13.4244,
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
    listingType,
    setActiveTab,
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
    setDemoMode(true);
    setLocation(DEMO_LOCATION);
    
    // Fetch demo data
    await fetchAmenities(DEMO_LOCATION, 3);
    await fetchListings(DEMO_LOCATION, 3, 'rent', { budgetMax: 1200 }, true);
    setActiveTab('listings');
  }, [setDemoMode, setLocation, fetchAmenities, fetchListings, setActiveTab]);

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