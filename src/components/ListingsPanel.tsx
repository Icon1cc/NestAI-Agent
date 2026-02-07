import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bed, Maximize2, MapPin, ExternalLink, Check, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Listing } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onSelect: (ctrlKey: boolean) => void;
  onViewDetails: () => void;
}

function ListingCard({ listing, isSelected, onSelect, onViewDetails }: ListingCardProps) {
  // Use rank (0-1) to calculate display score (0-100)
  const displayScore = Math.round(listing.rank * 100);
  const scoreColor = displayScore >= 80 
    ? 'nest-score-high' 
    : displayScore >= 60 
      ? 'nest-score-medium' 
      : 'nest-score-low';

  const handleCardClick = (e: React.MouseEvent) => {
    // If ctrl/cmd key is held, toggle selection instead
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      onSelect(true);
    } else {
      onViewDetails();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e.ctrlKey || e.metaKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={handleCardClick}
      className={cn(
        "nest-card overflow-hidden transition-all cursor-pointer",
        isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background"
      )}
    >
      {/* Image */}
      <div className="relative h-40">
        {listing.photos[0] ? (
          <img 
            src={listing.photos[0]} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Home className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Score badge - shows as X/100 */}
        <div className={cn("absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold", scoreColor)}>
          {displayScore}/100
        </div>

        {/* Badges */}
        {listing.badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {listing.badges.slice(0, 2).map((badge) => (
              <span key={badge} className="nest-badge bg-white/90 text-foreground backdrop-blur-sm">
                {badge.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Select checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={cn(
            "absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            isSelected 
              ? "bg-accent text-accent-foreground" 
              : "bg-white/90 text-muted-foreground hover:bg-white"
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
          {listing.title}
        </h3>
        
        <p className="text-xl font-bold text-primary mb-3">
          €{listing.price.amount.toLocaleString()}
          {listing.price.period === 'month' && (
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          )}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {listing.rooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {listing.rooms}
            </span>
          )}
          {listing.areaM2 > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-4 h-4" />
              {listing.areaM2} m²
            </span>
          )}
          {listing.distance && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Summary (truncated) */}
        {listing.summary && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {listing.summary}
          </p>
        )}

        {/* Pros/Cons preview */}
        {listing.pros && listing.pros.length > 0 && (
          <div className="mb-3 space-y-1">
            {listing.pros.slice(0, 2).map((pro, i) => (
              <p key={i} className="text-xs text-nest-success">✓ {pro}</p>
            ))}
          </div>
        )}
        {listing.cons && listing.cons.length > 0 && (
          <div className="mb-3 space-y-1">
            {listing.cons.slice(0, 1).map((con, i) => (
              <p key={i} className="text-xs text-destructive/80">✗ {con}</p>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 nest-btn-secondary text-sm"
          >
            Details
          </button>
          {listing.redirect_url && listing.redirect_url !== '#' ? (
            <a
              href={listing.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 nest-btn-primary flex items-center justify-center gap-1.5 text-sm"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

interface ListingsPanelProps {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  onSearch: () => void;
  isDemoMode: boolean;
  assistantMessage?: string;
  onViewDetails: (listingId: string) => void;
}

export function ListingsPanel({ 
  listings, 
  isLoading, 
  error, 
  onSearch, 
  isDemoMode, 
  assistantMessage,
  onViewDetails,
}: ListingsPanelProps) {
  const { selectedOfferIds, toggleOfferSelection, listingType } = useAppStore();
  const t = useI18n();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>
          {listingType === 'rent' ? t('loading_listings') : t('loading_properties')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Show assistant message even if no listings
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        {assistantMessage ? (
          <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50 max-w-md">
            <p className="text-foreground">{assistantMessage}</p>
          </div>
        ) : (
          <>
            <Home className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">
              {t('no_offers_title')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('no_offers_subtitle')}
            </p>
          </>
        )}
        <button onClick={onSearch} className="nest-btn-hero flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t('search_with_nestai')}
        </button>
      </div>
    );
  }

  // Sort listings by rank descending
  const sortedListings = [...listings].sort((a, b) => b.rank - a.rank);

  return (
    <div className="p-4 space-y-4">
      {/* Assistant message */}
      {assistantMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-foreground text-sm">{assistantMessage}</p>
        </motion.div>
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="nest-section-title">
          {listings.length} {listingType === 'rent' ? t('rent') : t('buy')}
          {isDemoMode && <span className="ml-2 text-accent">(Demo)</span>}
        </h2>
        {selectedOfferIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedOfferIds.length}/2 {t('selected')}
            <span className="ml-2 text-xs">(Ctrl+click)</span>
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {sortedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isSelected={selectedOfferIds.includes(listing.id)}
            onSelect={(ctrlKey) => toggleOfferSelection(listing.id, ctrlKey)}
            onViewDetails={() => onViewDetails(listing.id)}
          />
        ))}
      </div>
    </div>
  );
}
