import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  Minus, 
  MapPin, 
  Calendar, 
  Maximize2, 
  BedDouble, 
  Wallet, 
  Sofa, 
  FileText,
  ChevronDown,
  Building,
  Navigation
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useDify } from '@/hooks/useDify';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Listing, DifyAmenity } from '@/types';
import { getCategoryLabel, calculateDistance, normalizeCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface OfferDetailsPanelProps {
  listing: Listing;
  onBack: () => void;
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  groceries: '🛒',
  parks: '🌳',
  schools: '🏫',
  transit: '🚇',
  healthcare: '🏥',
  healtcare: '🏥',
  fitness: '💪',
};

export function OfferDetailsPanel({ listing, onBack }: OfferDetailsPanelProps) {
  const { selectedOfferIds, toggleOfferSelection, setActiveTab } = useAppStore();
  const { resolveOfferAmenities } = useDify();
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const t = useI18n();

  const isSelected = selectedOfferIds.includes(listing.id);
  const displayScore = Math.round(listing.rank * 100);
  const scoreColor = displayScore >= 80 
    ? 'nest-score-high' 
    : displayScore >= 60 
      ? 'nest-score-medium' 
      : 'nest-score-low';

  // Resolve amenities for this offer
  const offerAmenities = listing.amenities && listing.amenities.length > 0
    ? listing.amenities
    : resolveOfferAmenities(listing);
  
  // Group amenities by category
  const amenitiesByCategory = offerAmenities.reduce((acc, amenity) => {
    const cat = normalizeCategory(amenity.category);
    if (!acc[cat]) acc[cat] = [];
    // Calculate distance from listing
    const lng = amenity.lng ?? amenity.long ?? 0;
    const distance = calculateDistance(listing.lat, listing.lng, amenity.lat, lng);
    acc[cat].push({ ...amenity, distance });
    return acc;
  }, {} as Record<string, (DifyAmenity & { distance: number })[]>);

  const handleViewAmenities = () => {
    setActiveTab('amenities');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <button
          onClick={onBack}
          className="nest-icon-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold text-foreground flex-1 line-clamp-1">
          {t('offer_details')}
        </h2>
        <button
          onClick={() => toggleOfferSelection(listing.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            isSelected 
              ? "bg-accent text-accent-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {isSelected ? t('selected') : t('select')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Photo carousel */}
        <div className="relative aspect-[16/10]">
          {listing.photos.length > 0 ? (
            <>
              <img 
                src={listing.photos[currentPhotoIndex]} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhotoIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === currentPhotoIndex 
                          ? "bg-white w-4" 
                          : "bg-white/50 hover:bg-white/80"
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Building className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Score badge */}
          <div className={cn("absolute top-3 left-3 px-3 py-1.5 rounded-lg text-sm font-bold", scoreColor)}>
            {displayScore}/100
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Address and price */}
          <div>
            <div className="flex items-start gap-2 text-muted-foreground mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{listing.address}</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              €{listing.price.amount.toLocaleString()}
              {listing.price.period === 'month' && (
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {listing.price.period === 'month' ? 'Rent' : 'Purchase price'}
            </p>
          </div>

          {/* Summary */}
            {listing.summary && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-foreground text-sm leading-relaxed">{listing.summary}</p>
              </div>
            )}

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 gap-4">
            {listing.pros && listing.pros.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">{t('pros')}</h3>
                <div className="space-y-1.5">
                  {listing.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-nest-success mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{pro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {listing.cons && listing.cons.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">{t('cons')}</h3>
                <div className="space-y-1.5">
                  {listing.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Minus className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Redirect button */}
          {listing.redirect_url && listing.redirect_url !== '#' && (
            <a
              href={listing.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="nest-btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>{t('open_listing')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Nice to have accordion */}
          {listing.nice_to_have && Object.keys(listing.nice_to_have).length > 0 && (
            <Collapsible open={isMoreInfoOpen} onOpenChange={setIsMoreInfoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{t('more_info')}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isMoreInfoOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="space-y-3 p-3 rounded-lg border border-border/50">
                  {listing.nice_to_have.posted_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('posted')}:</span>
                      <span className="text-foreground">{listing.nice_to_have.posted_date}</span>
                    </div>
                  )}
                  {listing.nice_to_have.area_m2 && listing.nice_to_have.area_m2 > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Maximize2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('area')}:</span>
                      <span className="text-foreground">{listing.nice_to_have.area_m2} m²</span>
                    </div>
                  )}
                  {listing.nice_to_have.rooms && listing.nice_to_have.rooms > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <BedDouble className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('rooms')}:</span>
                      <span className="text-foreground">{listing.nice_to_have.rooms}</span>
                    </div>
                  )}
                  {listing.nice_to_have.deposit && listing.nice_to_have.deposit > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('deposit')}:</span>
                      <span className="text-foreground">€{listing.nice_to_have.deposit.toLocaleString()}</span>
                    </div>
                  )}
                  {listing.nice_to_have.furnished !== undefined && (
                    <div className="flex items-center gap-3 text-sm">
                      <Sofa className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('furnished')}:</span>
                      <span className="text-foreground">{listing.nice_to_have.furnished ? t('yes') : t('no')}</span>
                    </div>
                  )}
                  {listing.nice_to_have.requirements && listing.nice_to_have.requirements.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">{t('requirements')}:</span>
                        <ul className="mt-1 space-y-1">
                          {listing.nice_to_have.requirements.map((req, i) => (
                            <li key={i} className="text-foreground">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Associated Amenities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">{t('nearby_amenities')}</h3>
              {offerAmenities.length > 0 && (
                <button 
                  onClick={handleViewAmenities}
                  className="text-xs text-primary hover:underline"
                >
                  {t('view_on_map')}
                </button>
              )}
            </div>
            
            {offerAmenities.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Navigation className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('amenities_not_available')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                  <div key={category} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{CATEGORY_ICONS[category]}</span>
                      <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
                      <span className="text-xs text-muted-foreground">({amenities.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {amenities.slice(0, 3).map((amenity) => (
                        <div key={amenity.amenity_id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{amenity.description}</span>
                          <span className="text-muted-foreground text-xs">
                            {amenity.distance.toFixed(1)} km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
