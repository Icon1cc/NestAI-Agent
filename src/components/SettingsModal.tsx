import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Globe, Ruler } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { RadiusKm } from '@/types';

const RADIUS_OPTIONS: RadiusKm[] = [1, 3, 7, 10];

const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MotionBackdrop = motion.div;
const MotionPanel = motion.div;

export const SettingsModal = forwardRef<HTMLDivElement, SettingsModalProps>(
  function SettingsModal({ isOpen, onClose }, ref) {
    const {
      isDarkMode,
      toggleDarkMode,
      radiusKm,
      setRadiusKm,
      countryCode,
      setCountryCode,
      listingType,
      setListingType,
    } = useAppStore();

    return (
      <AnimatePresence>
        {isOpen && (
          <div ref={ref} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <MotionBackdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            />

            {/* Modal */}
            <MotionPanel
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md nest-card-elevated"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-xl font-bold">Settings</h2>
                <button onClick={onClose} className="nest-icon-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Theme toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                    <Label htmlFor="theme-toggle" className="text-sm font-medium">
                      Dark Mode
                    </Label>
                  </div>
                  <Switch
                    id="theme-toggle"
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>

                {/* Country selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <Label className="text-sm font-medium">Default Country</Label>
                  </div>
                  <Select
                    value={countryCode || 'all'}
                    onValueChange={(v) => setCountryCode(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Countries" />
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
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-primary" />
                    <Label className="text-sm font-medium">Default Search Radius</Label>
                  </div>
                  <Select
                    value={radiusKm.toString()}
                    onValueChange={(v) => setRadiusKm(parseInt(v) as RadiusKm)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map(r => (
                        <SelectItem key={r} value={r.toString()}>{r} km</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Listing type preference */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default Listing Type</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setListingType('rent')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        listingType === 'rent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Rent
                    </button>
                    <button
                      onClick={() => setListingType('buy')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        listingType === 'buy'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border/50">
                <button onClick={onClose} className="nest-btn-primary w-full">
                  Done
                </button>
              </div>
            </MotionPanel>
          </div>
        )}
      </AnimatePresence>
    );
  }
);
