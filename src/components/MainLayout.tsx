import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRightOpen, X } from 'lucide-react';
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
    messages,
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

  const { isLoading: isDifyLoading, callDify } = useDify();

  const [isChatLoading, setIsChatLoading] = useState(false);

  const selectedListing = selectedOfferId
    ? listings.find((l) => l.id === selectedOfferId)
    : null;

  useEffect(() => {
    if (location) {
      fetchAmenities(location, radiusKm);
    }
  }, [location, radiusKm, fetchAmenities]);

  useEffect(() => {
    if (location) {
      setPanelOpen(true);
    }
  }, [location, setPanelOpen]);

  const handleSearch = useCallback(async () => {
    if (!location) return;
    await callDify(
      `Find me ${listingType === 'rent' ? 'rentals' : 'properties to buy'} in this area`
    );
    setActiveTab('listings');
  }, [location, listingType, callDify, setActiveTab]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!location) return;
      setIsChatLoading(true);
      useAppStore.getState().addMessage({ role: 'user', content: message });
      await callDify(message);
      setIsChatLoading(false);
      setActiveTab('listings');
    },
    [location, callDify, setActiveTab]
  );

  const handleQuickChip = useCallback(
    async (prompt: string) => {
      if (!location) return;
      setIsChatLoading(true);
      useAppStore.getState().addMessage({ role: 'user', content: prompt });
      await callDify(prompt);
      setIsChatLoading(false);
    },
    [location, callDify]
  );

  const handleRecenter = useCallback(() => {}, []);

  const handleViewDetails = useCallback(
    (listingId: string) => {
      setSelectedOfferId(listingId);
    },
    [setSelectedOfferId]
  );

  const handleBackFromDetails = useCallback(() => {
    setSelectedOfferId(null);
  }, [setSelectedOfferId]);

  if (!location) return null;

  const lastAssistantMessage = messages
    .filter((m) => m.role === 'assistant')
    .slice(-1)[0]?.content;

  return (
    <div className="relative h-[100dvh] pt-14 sm:pt-16">
      {/* Map fills the canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 top-14 sm:top-16"
      >
        <MainMap
          listings={listings}
          onRecenter={handleRecenter}
          onChangeLocation={onChangeLocation}
        />
      </motion.div>

      {/* Panel toggle button - positioned at bottom of screen on mobile */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300',
          // Mobile: bottom center
          'bottom-4 left-1/2 -translate-x-1/2',
          // Desktop: follows panel position
          'sm:left-auto sm:translate-x-0 sm:right-5',
          isPanelOpen ? 'sm:bottom-[calc(100vh-6rem)]' : 'sm:bottom-4'
        )}
      >
        <button
          onClick={togglePanel}
          className={cn(
            'nest-card h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium',
            'border border-border/50 shadow-lg hover:border-primary/50 transition-all',
            'bg-card/95 backdrop-blur-xl'
          )}
        >
          {isPanelOpen ? (
            <>
              <PanelRightClose className="w-4 h-4" />
              <span className="hidden sm:inline">{t('hide_panel')}</span>
              <X className="w-4 h-4 sm:hidden" />
            </>
          ) : (
            <>
              <PanelRightOpen className="w-4 h-4" />
              <span>{t('show_panel')}</span>
            </>
          )}
        </button>
      </div>

      {/* Floating glass panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            key="glass-panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              // Mobile: full width bottom sheet
              'fixed inset-x-0 bottom-0 z-40',
              'h-[70vh] max-h-[70vh]',
              // Desktop: side panel
              'sm:absolute sm:inset-x-auto sm:right-5 sm:top-20 sm:bottom-4',
              'sm:w-[420px] md:w-[460px] lg:w-[520px]',
              'sm:h-auto sm:max-h-none',
              // Styling
              'flex flex-col overflow-hidden',
              'rounded-t-2xl sm:rounded-2xl',
              'bg-card/90 backdrop-blur-2xl border border-border/40',
              'shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] sm:shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)]'
            )}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

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
                  <div className="flex items-center border-b border-border px-2 sm:px-4 bg-card/70 backdrop-blur shrink-0">
                    <button
                      onClick={() => setActiveTab('listings')}
                      className={cn(
                        'px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'listings'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t('offers_tab')}
                      {listings.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {listings.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('amenities')}
                      className={cn(
                        'px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'amenities'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t('amenities_tab')}
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={cn(
                        'px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'chat'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Chat
                    </button>
                  </div>

                  {/* Quick chips - only show when on listings tab */}
                  {activeTab === 'listings' && listings.length > 0 && (
                    <div className="flex gap-2 p-2 sm:p-3 overflow-x-auto scrollbar-none border-b border-border/50 bg-card/60 backdrop-blur shrink-0">
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip.labelKey}
                          onClick={() => handleQuickChip(chip.prompt)}
                          disabled={isChatLoading || isDifyLoading}
                          className={cn(
                            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all',
                            'bg-muted text-muted-foreground',
                            'hover:bg-primary/10 hover:text-primary',
                            'disabled:opacity-50 disabled:pointer-events-none'
                          )}
                        >
                          {t(chip.labelKey as any)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto min-h-0 bg-card/70 backdrop-blur">
                    {activeTab === 'listings' && (
                      <ListingsPanel
                        listings={listings}
                        isLoading={isDifyLoading}
                        error={null}
                        onSearch={handleSearch}
                        assistantMessage={lastAssistantMessage}
                        onViewDetails={handleViewDetails}
                      />
                    )}
                    {activeTab === 'amenities' && (
                      <AmenitiesPanel
                        data={amenitiesData}
                        isLoading={isAmenitiesLoading}
                        error={amenitiesError}
                      />
                    )}
                    {activeTab === 'chat' && (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2">
                          {messages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Ask NestAI anything to get started.
                            </p>
                          ) : (
                            messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  'p-2.5 rounded-lg text-sm border',
                                  msg.role === 'user'
                                    ? 'bg-primary/10 border-primary/20 text-foreground'
                                    : 'bg-muted border-border text-foreground/90'
                                )}
                              >
                                <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                                  {msg.role === 'user' ? 'You' : 'NestAI'}
                                </p>
                                <p className="leading-snug break-words whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="border-t border-border bg-card/80 backdrop-blur px-2 py-2 shrink-0">
                          <ChatBar
                            onSend={handleSendMessage}
                            onSearch={handleSearch}
                            isLoading={isChatLoading || isDifyLoading}
                            hasLocation={!!location}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
