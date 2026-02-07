import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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
import { useI18n } from '@/lib/i18n';

const RADIUS_OPTIONS: RadiusKm[] = [1, 3, 7, 10];

// Major French cities ordered alphabetically
const FRENCH_CITIES = [
  { code: 'bordeaux', name: 'Bordeaux' },
  { code: 'lille', name: 'Lille' },
  { code: 'lyon', name: 'Lyon' },
  { code: 'marseille', name: 'Marseille' },
  { code: 'montpellier', name: 'Montpellier' },
  { code: 'nantes', name: 'Nantes' },
  { code: 'nice', name: 'Nice' },
  { code: 'paris', name: 'Paris' },
  { code: 'strasbourg', name: 'Strasbourg' },
  { code: 'toulouse', name: 'Toulouse' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    isDarkMode,
    toggleDarkMode,
    radiusKm,
    setRadiusKm,
    countryCode,
    setCountryCode,
    listingType,
    setListingType,
    language,
    setLanguage,
  } = useAppStore();
  const t = useI18n();
  const [pendingLanguage, setPendingLanguage] = useState(language);

  useEffect(() => {
    if (isOpen) {
      setPendingLanguage(language);
    }
  }, [isOpen, language]);

  const handleApplyAndClose = () => {
    setLanguage(pendingLanguage);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="settings-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md nest-card-elevated pointer-events-auto">
              {/* Header */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('settings_title')}</h2>
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
                      {t('dark_mode')}
                    </Label>
                  </div>
                  <Switch
                    id="theme-toggle"
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>

                {/* Language selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <Label className="text-sm font-medium">{t('language_label')}</Label>
                  </div>
                  <Select
                    value={pendingLanguage}
                    onValueChange={(v) => setPendingLanguage(v as 'en' | 'fr' | 'de')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[200] bg-popover">
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="fr">Français (FR)</SelectItem>
                      <SelectItem value="de">Deutsch (DE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* City selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <Label className="text-sm font-medium">{t('default_city')}</Label>
                  </div>
                  <Select
                    value={countryCode || 'all'}
                    onValueChange={(v) => setCountryCode(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('all_cities')} />
                    </SelectTrigger>
                    <SelectContent className="z-[200] bg-popover">
                      <SelectItem value="all">{t('all_cities')}</SelectItem>
                      {FRENCH_CITIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Radius selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-primary" />
                    <Label className="text-sm font-medium">{t('default_radius')}</Label>
                  </div>
                  <Select
                    value={radiusKm.toString()}
                    onValueChange={(v) => setRadiusKm(parseInt(v) as RadiusKm)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[200] bg-popover">
                      {RADIUS_OPTIONS.map(r => (
                        <SelectItem key={r} value={r.toString()}>{r} km</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Listing type preference */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('default_listing_type')}</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setListingType('rent')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        listingType === 'rent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('rent')}
                    </button>
                    <button
                      onClick={() => setListingType('buy')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        listingType === 'buy'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('buy')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border/50">
                <button onClick={handleApplyAndClose} className="nest-btn-primary w-full">
                  {t('done')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
