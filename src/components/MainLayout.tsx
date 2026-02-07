import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MainMap } from './MainMap';
import { AmenitiesPanel } from './AmenitiesPanel';
import { ListingsPanel } from './ListingsPanel';
import { ChatBar } from './ChatBar';
import { useAppStore } from '@/store/appStore';
import { useAmenities } from '@/hooks/useAmenities';
import { useListings } from '@/hooks/useListings';
import { useVoice } from '@/hooks/useVoice';
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
    messages,
    priceMax,
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

  const { speak } = useVoice();

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string>('');

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

    // Simulate AI response for now (in production, this would call the Dify API)
    // The actual Dify integration requires backend setup
    setTimeout(() => {
      const hasBudget = priceMax > 0;
      let response: string;
      
      if (!hasBudget && !message.toLowerCase().includes('budget')) {
        response = `I understand you're looking for ${message}. What's your monthly budget? You can use the quick chips below or tell me directly.`;
      } else {
        response = `Based on your preferences for "${message}" in ${location.city || location.label.split(',')[0]}, I've found some great options. The listings are ranked by how well they match your criteria.`;
        // Trigger a search to show listings
        handleSearch();
      }
      
      addMessage({ role: 'assistant', content: response });
      setAssistantMessage(response);
      setIsChatLoading(false);
      
      // Optionally read response aloud
      // speak(response);
    }, 1500);
  }, [location, addMessage, priceMax, handleSearch]);

  const handleRecenter = useCallback(() => {
    // Map will recenter automatically via the MapRecenter component
  }, []);

  if (!location) return null;

  // Get last assistant message for display
  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content;

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
            Amenities
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
            Offers
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
              assistantMessage={lastAssistantMessage}
            />
          )}
        </div>

        {/* Chat bar */}
        <ChatBar
          onSend={handleSendMessage}
          onSearch={handleSearch}
          isLoading={isChatLoading || isListingsLoading}
          hasLocation={!!location}
          hasBudget={priceMax > 0}
        />
      </motion.div>
    </div>
  );
}
