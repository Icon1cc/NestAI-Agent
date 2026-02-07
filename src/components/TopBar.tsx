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

const COUNTRIES = [
  { code: 'DE', name: 'Germany', lat: 51.1657, lng: 10.4515 },
  { code: 'FR', name: 'France', lat: 46.2276, lng: 2.2137 },
  { code: 'NL', name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
  { code: 'ES', name: 'Spain', lat: 40.4637, lng: -3.7492 },
  { code: 'IT', name: 'Italy', lat: 41.8719, lng: 12.5674 },
  { code: 'PT', name: 'Portugal', lat: 39.3999, lng: -8.2245 },
  { code: 'AT', name: 'Austria', lat: 47.5162, lng: 14.5501 },
  { code: 'CH', name: 'Switzerland', lat: 46.8182, lng: 8.2275 },
  { code: 'BE', name: 'Belgium', lat: 50.5039, lng: 4.4699 },
  { code: 'PL', name: 'Poland', lat: 51.9194, lng: 19.1451 },
  { code: 'GB', name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
  { code: 'US', name: 'United States', lat: 37.0902, lng: -95.7129 },
];

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

  const handleCountryChange = (code: string) => {
    if (code === 'all') {
      setCountryCode(null);
    } else {
      setCountryCode(code);
      // Auto-focus map to country center
      const country = COUNTRIES.find(c => c.code === code);
      if (country) {
        setLocation({
          label: country.name,
          lat: country.lat,
          lng: country.lng,
          countryCode: country.code,
          country: country.name,
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
          {/* Country selector */}
          <div className="hidden sm:block">
            <Select
              value={countryCode || 'all'}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="h-9 w-[130px] bg-muted/50 border-border/50 text-sm">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map(c => (
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
