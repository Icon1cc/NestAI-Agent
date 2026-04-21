import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, MapPin, Settings, GitCompare, Sun, Moon, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { useAppStore } from '@/store/appStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { RadiusKm } from '@/types';

const RADIUS_OPTIONS: RadiusKm[] = [1, 3, 7, 10];

const FRENCH_CITIES = [
  { code: 'bordeaux', name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { code: 'lille', name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { code: 'lyon', name: 'Lyon', lat: 45.764, lng: 4.8357 },
  { code: 'marseille', name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { code: 'montpellier', name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { code: 'nantes', name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { code: 'nice', name: 'Nice', lat: 43.7102, lng: 7.262 },
  { code: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { code: 'strasbourg', name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { code: 'toulouse', name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
];

export function TopBar() {
  const {
    location,
    setLocation,
    radiusKm,
    setRadiusKm,
    listingType,
    setListingType,
    isDarkMode,
    toggleDarkMode,
    selectedOfferIds,
    setHistoryDrawerOpen,
    setCompareModalOpen,
    setSettingsOpen,
  } = useAppStore();
  const t = useI18n();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const canCompare = selectedOfferIds.length === 2;

  const getCurrentCityCode = () => {
    if (!location) return 'all';
    const matchedCity = FRENCH_CITIES.find(
      (c) => Math.abs(c.lat - location.lat) < 0.1 && Math.abs(c.lng - location.lng) < 0.1
    );
    return matchedCity?.code || 'custom';
  };

  const handleCityChange = (code: string) => {
    if (code === 'all') {
      setLocation({
        label: 'France',
        lat: 46.2276,
        lng: 2.2137,
        countryCode: 'FR',
        country: 'France',
      });
    } else {
      const city = FRENCH_CITIES.find((c) => c.code === code);
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 nest-glass overflow-visible"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-white/6 to-white/4 opacity-70 pointer-events-none" />
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80 pointer-events-none" />

      <div className="h-full max-w-[1800px] mx-auto px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="nest-icon-btn shrink-0"
            aria-label="Open history"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo size="md" showText className="hidden sm:flex" />
          <Logo size="sm" showText={false} className="sm:hidden" />

          {/* Location chip - visible on tablet+ */}
          {location && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden md:flex items-center gap-1.5 nest-chip-primary max-w-[180px]"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs">
                {location.city || location.label.split(',')[0]}
              </span>
            </motion.div>
          )}
        </div>

        {/* Right: Controls - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {/* City selector */}
          <Select value={getCurrentCityCode()} onValueChange={handleCityChange}>
            <SelectTrigger className="h-9 w-[110px] md:w-[130px] text-xs md:text-sm bg-muted/50 border-border/50">
              <SelectValue placeholder={t('all_cities')} />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-popover">
              <SelectItem value="all">{t('all_cities')}</SelectItem>
              {FRENCH_CITIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Radius selector */}
          <Select
            value={radiusKm.toString()}
            onValueChange={(v) => setRadiusKm(parseInt(v) as RadiusKm)}
          >
            <SelectTrigger className="h-9 w-[70px] md:w-[80px] text-xs md:text-sm bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-popover">
              {RADIUS_OPTIONS.map((r) => (
                <SelectItem key={r} value={r.toString()}>
                  {r} km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Listing type toggle */}
          <div className="flex items-center h-9 rounded-lg p-0.5 bg-muted/50 border border-border/50">
            <button
              onClick={() => setListingType('rent')}
              className={cn(
                'px-2 md:px-3 h-8 rounded-md text-xs md:text-sm font-medium transition-all',
                listingType === 'rent'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('rent')}
            </button>
            <button
              onClick={() => setListingType('buy')}
              className={cn(
                'px-2 md:px-3 h-8 rounded-md text-xs md:text-sm font-medium transition-all',
                listingType === 'buy'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('buy')}
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
            className={cn('nest-icon-btn relative', canCompare && 'text-accent')}
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

        {/* Right: Controls - Mobile */}
        <div className="flex sm:hidden items-center gap-1">
          {/* Compact Rent/Buy toggle */}
          <div className="flex items-center h-8 rounded-lg p-0.5 bg-muted/50 border border-border/50">
            <button
              onClick={() => setListingType('rent')}
              className={cn(
                'px-2 h-7 rounded-md text-xs font-medium transition-all',
                listingType === 'rent'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {t('rent')}
            </button>
            <button
              onClick={() => setListingType('buy')}
              className={cn(
                'px-2 h-7 rounded-md text-xs font-medium transition-all',
                listingType === 'buy'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {t('buy')}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          <DropdownMenu open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <DropdownMenuTrigger asChild>
              <button className="nest-icon-btn" aria-label="More options">
                <ChevronDown className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[200]">
              {/* City selection */}
              <DropdownMenuItem
                className="flex justify-between"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-xs text-muted-foreground">City</span>
                <Select value={getCurrentCityCode()} onValueChange={handleCityChange}>
                  <SelectTrigger className="h-7 w-24 text-xs border-0 bg-transparent p-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[300]">
                    <SelectItem value="all">All</SelectItem>
                    {FRENCH_CITIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DropdownMenuItem>

              {/* Radius selection */}
              <DropdownMenuItem
                className="flex justify-between"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-xs text-muted-foreground">Radius</span>
                <Select
                  value={radiusKm.toString()}
                  onValueChange={(v) => setRadiusKm(parseInt(v) as RadiusKm)}
                >
                  <SelectTrigger className="h-7 w-16 text-xs border-0 bg-transparent p-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[300]">
                    {RADIUS_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r.toString()}>
                        {r} km
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" /> Light mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" /> Dark mode
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setCompareModalOpen(true)}
                disabled={!canCompare}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
                {selectedOfferIds.length > 0 && (
                  <span className="ml-auto text-xs bg-accent/20 text-accent px-1.5 rounded">
                    {selectedOfferIds.length}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
