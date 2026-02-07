import { motion } from 'framer-motion';
import { Menu, MapPin, Settings, GitCompare, Sun, Moon } from 'lucide-react';
import { Logo } from './Logo';
import { useAppStore } from '@/store/appStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RadiusKm, ListingType } from '@/types';

const RADIUS_OPTIONS: RadiusKm[] = [1, 3, 7, 10];

// Major French cities ordered alphabetically
const FRENCH_CITIES = [
  { code: 'bordeaux', name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { code: 'lille', name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { code: 'lyon', name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { code: 'marseille', name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { code: 'montpellier', name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { code: 'nantes', name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { code: 'nice', name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { code: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { code: 'strasbourg', name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { code: 'toulouse', name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
];

// France center for "All Cities" view
const FRANCE_CENTER = { lat: 46.6034, lng: 2.3488 };

export function TopBar() {
  const {
    location,
    setLocation,
    radiusKm,
    setRadiusKm,
    listingType,
    setListingType,
    countryCode,
    setCountryCode,
    isDarkMode,
    toggleDarkMode,
    selectedOfferIds,
    setHistoryDrawerOpen,
    setCompareModalOpen,
    setSettingsOpen,
  } = useAppStore();

  const handleCityChange = (code: string) => {
    if (code === 'all') {
      setCountryCode(null);
      // Focus on entire France
      setLocation({
        label: 'France',
        lat: FRANCE_CENTER.lat,
        lng: FRANCE_CENTER.lng,
        countryCode: 'FR',
        country: 'France',
      });
    } else {
      setCountryCode(code);
      // Focus on selected city
      const city = FRENCH_CITIES.find(c => c.code === code);
      if (city) {
        setLocation({
          label: `${city.name}, France`,
          lat: city.lat,
          lng: city.lng,
          countryCode: 'FR',
          city: city.name,
          country: 'France',
        });
      }
    }
  };

  const hasLocation = !!location;
  const canCompare = selectedOfferIds.length === 2;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 nest-glass"
    >
      <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="nest-icon-btn"
            aria-label="Open history"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Logo size="md" showText />
          
          {/* Location chip */}
          {location && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden md:flex items-center gap-1.5 nest-chip-primary max-w-[200px]"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs">{location.city || location.label.split(',')[0]}</span>
            </motion.div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* City selector */}
          <div className="hidden sm:block">
            <Select
              value={countryCode || 'all'}
              onValueChange={handleCityChange}
            >
              <SelectTrigger className="h-9 w-[140px] bg-muted/50 border-border/50 text-sm">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {FRENCH_CITIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Radius selector */}
          <Select
            value={radiusKm.toString()}
            onValueChange={(v) => setRadiusKm(parseInt(v) as RadiusKm)}
            disabled={!hasLocation}
          >
            <SelectTrigger 
              className={cn(
                "h-9 w-[90px] text-sm",
                hasLocation 
                  ? "bg-muted/50 border-border/50" 
                  : "bg-muted/30 border-border/30 opacity-50"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map(r => (
                <SelectItem key={r} value={r.toString()}>{r} km</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Listing type toggle */}
          <div className={cn(
            "flex items-center h-9 rounded-lg p-0.5 bg-muted/50 border border-border/50",
            !hasLocation && "opacity-50 pointer-events-none"
          )}>
            <button
              onClick={() => setListingType('rent')}
              className={cn(
                "px-3 h-8 rounded-md text-sm font-medium transition-all",
                listingType === 'rent' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Rent
            </button>
            <button
              onClick={() => setListingType('buy')}
              className={cn(
                "px-3 h-8 rounded-md text-sm font-medium transition-all",
                listingType === 'buy' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Buy
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="nest-icon-btn"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="nest-icon-btn"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Compare button */}
          <button
            onClick={() => setCompareModalOpen(true)}
            disabled={!canCompare}
            className={cn(
              "nest-icon-btn relative",
              canCompare && "text-accent"
            )}
            aria-label="Compare offers"
          >
            <GitCompare className="w-5 h-5" />
            {selectedOfferIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                {selectedOfferIds.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
