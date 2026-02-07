import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MainMap } from './MainMap';
import { AmenitiesPanel } from './AmenitiesPanel';
import { ListingsPanel } from './ListingsPanel';
import { ChatBar } from './ChatBar';
import { useAppStore } from '@/store/appStore';
import { useAmenities } from '@/hooks/useAmenities';
import { useListings } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  onChangeLocation: () => void;
}

export function MainLayout({ onChangeLocation }: MainLayoutProps) {
  const { 
    location, 
    radiusKm, 
    listingType,
    activeTab, 
    setActiveTab,
    isDemoMode,
    addMessage,
  } = useAppStore();

  const { 
    data: amenitiesData, 
    isLoading: isAmenitiesLoading, 
    error: amenitiesError,
    fetchAmenities,
  } = useAmenities();

  const {
    listings,
    isLoading: isListingsLoading,
    error: listingsError,
    fetchListings,
  } = useListings();

  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch amenities and listings when location or radius changes
  useEffect(() => {
    if (location) {
      fetchAmenities(location, radiusKm);
      fetchListings(location, radiusKm, listingType, {}, isDemoMode);
    }
  }, [location, radiusKm, listingType, isDemoMode, fetchAmenities, fetchListings]);

  const handleSearch = useCallback(async () => {
    if (!location) return;

    // Fetch amenities if not already loaded
    if (!amenitiesData) {
      await fetchAmenities(location, radiusKm);
    }

    // Fetch listings
    await fetchListings(location, radiusKm, listingType, {}, isDemoMode);
    
    // Switch to listings tab
    setActiveTab('listings');
  }, [location, radiusKm, listingType, isDemoMode, amenitiesData, fetchAmenities, fetchListings, setActiveTab]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!location) return;

    addMessage({ role: 'user', content: message });
    setIsChatLoading(true);

    // Simulate AI response for now
    // In production, this would call the Dify API
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `I understand you're looking for ${message}. Based on your location in ${location.city || location.label.split(',')[0]}, I've analyzed the area and listings. Would you like me to refine the search with specific filters?`,
      });
      setIsChatLoading(false);
    }, 1500);
  }, [location, addMessage]);

  const handleRecenter = useCallback(() => {
    // Map will recenter automatically via the MapRecenter component
  }, []);

  if (!location) return null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] pt-16">
      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-[55%] h-[45vh] lg:h-full p-4 lg:pr-2"
      >
        <MainMap
          listings={listings}
          onRecenter={handleRecenter}
          onChangeLocation={onChangeLocation}
        />
      </motion.div>

      {/* Results Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col min-h-0 lg:h-full"
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-border px-4">
          <button
            onClick={() => setActiveTab('amenities')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'amenities'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Area & Amenities
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'listings'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Listings
            {listings.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {listings.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'amenities' ? (
            <AmenitiesPanel
              data={amenitiesData}
              isLoading={isAmenitiesLoading}
              error={amenitiesError}
            />
          ) : (
            <ListingsPanel
              listings={listings}
              isLoading={isListingsLoading}
              error={listingsError}
              onSearch={handleSearch}
              isDemoMode={isDemoMode}
            />
          )}
        </div>

        {/* Chat bar */}
        <ChatBar
          onSend={handleSendMessage}
          onSearch={handleSearch}
          isLoading={isChatLoading || isListingsLoading}
          hasLocation={!!location}
        />
      </motion.div>
    </div>
  );
}
