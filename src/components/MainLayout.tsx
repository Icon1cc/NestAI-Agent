import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { MainMap } from './MainMap';
import { AmenitiesPanel } from './AmenitiesPanel';
import { ListingsPanel } from './ListingsPanel';
import { OfferDetailsPanel } from './OfferDetailsPanel';
import { ChatBar } from './ChatBar';
import { useAppStore } from '@/store/appStore';
import { useAmenities } from '@/hooks/useAmenities';
import { useDify } from '@/hooks/useDify';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

// Quick action chips for refining search
const QUICK_CHIPS = [
  { labelKey: 'quick_chip_quieter', prompt: 'I want a quieter area' },
  { labelKey: 'quick_chip_parks', prompt: 'I want more parks nearby' },
  { labelKey: 'quick_chip_transit', prompt: 'I want closer to public transit' },
  { labelKey: 'quick_chip_cheaper', prompt: 'I want something cheaper' },
  { labelKey: 'quick_chip_schools', prompt: 'I need better schools nearby' },
  { labelKey: 'quick_chip_fitness', prompt: 'I want more fitness options' },
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
    isPanelOpen,
    setPanelOpen,
    togglePanel,
  } = useAppStore();
  const t = useI18n();

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

  // Ensure panel appears when a location gets set
  useEffect(() => {
    if (location) {
      setPanelOpen(true);
    }
  }, [location, setPanelOpen]);

  // Auto-trigger Dify for demo mode on first load
  useEffect(() => {
    if (isDemoMode && location && listings.length === 0 && !isDifyLoading) {
      callDify('quiet area, parks nearby, good transit, budget up to 1200');
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

  const showPanelControls = !!location;
  const visibleMessages = messages;

  return (
    <div className="relative h-[calc(100vh-4rem)] pt-16">
      {/* Map fills the canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0"
      >
        <MainMap
          listings={listings}
          onRecenter={handleRecenter}
          onChangeLocation={onChangeLocation}
        />
      </motion.div>

      {/* Panel toggle */}
      {/* Footer toggle bar anchored inside panel white area */}
      {showPanelControls && (
        <div
          className={cn(
            "absolute inset-x-3 sm:inset-x-auto sm:right-5 bottom-[-48px] z-50",
            isPanelOpen ? "w-[calc(100%-1.5rem)] sm:w-[460px] lg:w-[520px]" : "w-auto"
          )}
        >
          <div className="flex justify-end">
            <button
              onClick={togglePanel}
              className={cn(
                "nest-card h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium",
                "border border-border/50 shadow-md hover:border-primary/50 transition-all"
              )}
            >
              {isPanelOpen ? (
                <>
                  <PanelRightClose className="w-4 h-4" />
                  {t('hide_panel')}
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4" />
                  {t('show_panel')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating glass panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            key="glass-panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 26 }}
            className={cn(
              "absolute inset-x-3 sm:inset-x-auto sm:right-5 top-24 bottom-4",
              "w-[calc(100%-1.5rem)] sm:w-[460px] lg:w-[520px]",
              "flex flex-col overflow-hidden rounded-2xl",
              "bg-card/75 backdrop-blur-2xl border border-border/40 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)]"
            )}
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
                  <div className="flex items-center border-b border-border px-4 bg-card/70 backdrop-blur">
                    <button
                      onClick={() => setActiveTab('listings')}
                      className={cn(
                        "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'listings'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t('offers_tab')}
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
                    {t('amenities_tab')}
                  </button>
                  </div>

                  {/* Conversation preview */}
                  {visibleMessages.length > 0 && (
                    <div className="px-4 py-3 border-b border-border/60 bg-card/70 backdrop-blur">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.08em]">
                          Conversation
                        </p>
                        {messages.length > 8 && (
                          <span className="text-[11px] text-muted-foreground">
                            Scroll to see earlier messages
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {visibleMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-2.5 rounded-lg text-sm border",
                              msg.role === 'user'
                                ? "bg-primary/10 border-primary/20 text-foreground"
                                : "bg-muted border-border text-foreground/90"
                            )}
                          >
                            <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                              {msg.role === 'user' ? 'You' : 'NestAI'}
                            </p>
                            <p className="leading-snug break-words">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick chips - only show when on listings tab */}
                  {activeTab === 'listings' && listings.length > 0 && (
                    <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none border-b border-border/50 bg-card/60 backdrop-blur">
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip.labelKey}
                          onClick={() => handleQuickChip(chip.prompt)}
                          disabled={isChatLoading || isDifyLoading}
                          className={cn(
                            "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                            "bg-muted text-muted-foreground",
                            "hover:bg-primary/10 hover:text-primary",
                            "disabled:opacity-50 disabled:pointer-events-none"
                          )}
                        >
                          {t(chip.labelKey as any)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto min-h-0 bg-card/70 backdrop-blur">
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
