import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation, Loader2, AlertCircle, X } from 'lucide-react';
import { Logo } from './Logo';
import { useNominatimSearch } from '@/hooks/useNominatim';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAppStore } from '@/store/appStore';
import type { NominatimResult } from '@/types';
import { useI18n } from '@/lib/i18n';

interface LocationPickerProps {
  onPickOnMap: () => void;
}

export function LocationPicker({ onPickOnMap }: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const t = useI18n();
  
  const { setLocation, countryCode } = useAppStore();
  const { results, isLoading, error, search, clear, resultToLocation } = useNominatimSearch();
  const { getCurrentLocation, isLoading: isGeoLoading, error: geoError, clearError } = useGeolocation();

  useEffect(() => {
    search(query, countryCode);
  }, [query, countryCode, search]);

  const handleSelect = (result: NominatimResult) => {
    const location = resultToLocation(result);
    setLocation(location);
    setQuery('');
    setShowResults(false);
    clear();
  };

  const handleUseMyLocation = async () => {
    clearError();
    try {
      const location = await getCurrentLocation();
      if (location) {
        setLocation(location);
      }
    } catch (err) {
      console.error('Location error:', err);
      // Error is already set by the hook
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto px-4 relative"
    >
      <div className="absolute -left-16 -top-24 w-48 h-48 bg-primary/20 blur-[70px] rounded-full pointer-events-none" />
      <div className="absolute -right-10 -bottom-16 w-44 h-44 bg-accent/18 blur-[70px] rounded-full pointer-events-none" />
      <div className="nest-card-elevated p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('location_title')}</h1>
          <p className="text-muted-foreground">
            {t('location_subtitle')}
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder={t('search_placeholder')}
              className="nest-input-lg w-full pl-12 pr-10"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  clear();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          <AnimatePresence>
            {showResults && (query.length >= 2 || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 nest-card-elevated z-50 overflow-hidden"
              >
                {isLoading ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('searching')}</span>
                  </div>
                ) : error ? (
                  <div className="p-4 flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                ) : results.length > 0 ? (
                  <ul className="max-h-[280px] overflow-y-auto">
                    {results.map((result) => (
                      <li key={result.place_id}>
                        <button
                          onClick={() => handleSelect(result)}
                          className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {result.namedetails?.name || result.display_name.split(',')[0]}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.display_name}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUseMyLocation}
            disabled={isGeoLoading}
            className="nest-btn-primary w-full flex items-center justify-center gap-2"
          >
            {isGeoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{t('use_my_location')}</span>
          </button>

          <button
            onClick={onPickOnMap}
            className="nest-btn-secondary w-full flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>{t('pick_on_map')}</span>
          </button>
        </div>

        {/* Geolocation error */}
        <AnimatePresence>
          {geoError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{geoError.message}</p>
                  {geoError.isSecurityError && (
                    <p className="mt-1 text-xs opacity-80">
                      Try accessing this page via HTTPS or localhost.
                    </p>
                  )}
                  <p className="mt-2 text-xs opacity-80">
                    💡 If you have a location spoofing extension, try disabling it or use "Pick on map" instead.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Explore neighborhoods, compare amenities, and find properties to rent or buy
      </p>
    </motion.div>
  );
}
