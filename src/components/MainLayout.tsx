import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainMap } from './MainMap';
import { AmenitiesPanel } from './AmenitiesPanel';
import { ListingsPanel } from './ListingsPanel';
import { OfferDetailsPanel } from './OfferDetailsPanel';
import { ChatBar } from './ChatBar';
import { useAppStore } from '@/store/appStore';
import { useAmenities } from '@/hooks/useAmenities';
import { useDify } from '@/hooks/useDify';
import { cn } from '@/lib/utils';

// Quick action chips for refining search
const QUICK_CHIPS = [
  { label: 'Quieter', prompt: 'I want a quieter area' },
  { label: 'More parks', prompt: 'I want more parks nearby' },
  { label: 'Closer transit', prompt: 'I want closer to public transit' },
  { label: 'Cheaper', prompt: 'I want something cheaper' },
  { label: 'Better schools', prompt: 'I need better schools nearby' },
  { label: 'More fitness', prompt: 'I want more fitness options' },
];

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
    messages,
    priceMax,
    listings,
    selectedOfferId,
    setSelectedOfferId,
  } = useAppStore();

  const { 
    data: amenitiesData, 
    isLoading: isAmenitiesLoading, 
    error: amenitiesError,
    fetchAmenities,
  } = useAmenities();

  const {
    isLoading: isDifyLoading,
    callDify,
  } = useDify();

  const [isChatLoading, setIsChatLoading] = useState(false);

  // Get the selected listing for details view
  const selectedListing = selectedOfferId 
    ? listings.find(l => l.id === selectedOfferId) 
    : null;

  // Fetch amenities when location or radius changes
  useEffect(() => {
    if (location) {
      fetchAmenities(location, radiusKm);
    }
  }, [location, radiusKm, fetchAmenities]);

  // Auto-trigger Dify for demo mode on first load
  useEffect(() => {
    if (isDemoMode && location && listings.length === 0 && !isDifyLoading) {
      callDify('quiet area, parks nearby, good transit, budget under 1200');
    }
  }, [isDemoMode, location, listings.length, isDifyLoading, callDify]);

  const handleSearch = useCallback(async () => {
    if (!location) return;
    
    // Call Dify with a general search prompt
    await callDify(`Find me ${listingType === 'rent' ? 'rentals' : 'properties to buy'} in this area`);
    setActiveTab('listings');
  }, [location, listingType, callDify, setActiveTab]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!location) return;
    
    setIsChatLoading(true);
    
    // Add user message to store
    useAppStore.getState().addMessage({ role: 'user', content: message });
    
    // Call Dify with the message
    await callDify(message);
    
    setIsChatLoading(false);
    setActiveTab('listings');
  }, [location, callDify, setActiveTab]);

  const handleQuickChip = useCallback(async (prompt: string) => {
    if (!location) return;
    
    setIsChatLoading(true);
    useAppStore.getState().addMessage({ role: 'user', content: prompt });
    await callDify(prompt);
    setIsChatLoading(false);
  }, [location, callDify]);

  const handleRecenter = useCallback(() => {
    // Map will recenter automatically via the MapRecenter component
  }, []);

  const handleViewDetails = useCallback((listingId: string) => {
    setSelectedOfferId(listingId);
  }, [setSelectedOfferId]);

  const handleBackFromDetails = useCallback(() => {
    setSelectedOfferId(null);
  }, [setSelectedOfferId]);

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
        {/* Show offer details or tabs */}
        <AnimatePresence mode="wait">
          {selectedListing ? (
            <OfferDetailsPanel
              key="details"
              listing={selectedListing}
              onBack={handleBackFromDetails}
            />
          ) : (
            <motion.div
              key="tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Tabs */}
              <div className="flex items-center border-b border-border px-4">
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
              </div>

              {/* Quick chips - only show when on listings tab */}
              {activeTab === 'listings' && listings.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none border-b border-border/50">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleQuickChip(chip.prompt)}
                      disabled={isChatLoading || isDifyLoading}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        "bg-muted text-muted-foreground",
                        "hover:bg-primary/10 hover:text-primary",
                        "disabled:opacity-50 disabled:pointer-events-none"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'listings' ? (
                  <ListingsPanel
                    listings={listings}
                    isLoading={isDifyLoading}
                    error={null}
                    onSearch={handleSearch}
                    isDemoMode={isDemoMode}
                    assistantMessage={lastAssistantMessage}
                    onViewDetails={handleViewDetails}
                  />
                ) : (
                  <AmenitiesPanel
                    data={amenitiesData}
                    isLoading={isAmenitiesLoading}
                    error={amenitiesError}
                  />
                )}
              </div>

              {/* Chat bar */}
              <ChatBar
                onSend={handleSendMessage}
                onSearch={handleSearch}
                isLoading={isChatLoading || isDifyLoading}
                hasLocation={!!location}
                hasBudget={priceMax > 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
