import { motion } from 'framer-motion';
import { Home, Bed, Maximize2, MapPin, ExternalLink, Check, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Listing } from '@/types';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  onSelect: () => void;
}

function ListingCard({ listing, isSelected, onSelect }: ListingCardProps) {
  const scoreColor = listing.score >= 8 
    ? 'nest-score-high' 
    : listing.score >= 6 
      ? 'nest-score-medium' 
      : 'nest-score-low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "nest-card overflow-hidden transition-all",
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
        
        {/* Score badge */}
        <div className={cn("absolute top-3 left-3", scoreColor)}>
          {listing.score.toFixed(1)}
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
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
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
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            {listing.rooms}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="w-4 h-4" />
            {listing.areaM2} m²
          </span>
          {listing.distance && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Pros/Cons */}
        {listing.pros && listing.pros.length > 0 && (
          <div className="mb-3 space-y-1">
            {listing.pros.slice(0, 2).map((pro, i) => (
              <p key={i} className="text-xs text-nest-success">✓ {pro}</p>
            ))}
          </div>
        )}

        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="nest-btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <span>View on {listing.provider}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
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
}

export function ListingsPanel({ listings, isLoading, error, onSearch, isDemoMode }: ListingsPanelProps) {
  const { selectedOfferIds, toggleOfferSelection, listingType } = useAppStore();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Finding {listingType === 'rent' ? 'rentals' : 'properties'}...</p>
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

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Home className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">
          No listings found yet. Click "Search Listings" to find {listingType === 'rent' ? 'rentals' : 'properties'}.
        </p>
        <button onClick={onSearch} className="nest-btn-hero flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Search Listings
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="nest-section-title">
          {listings.length} {listingType === 'rent' ? 'Rentals' : 'Properties'}
          {isDemoMode && <span className="ml-2 text-accent">(Demo Data)</span>}
        </h2>
        {selectedOfferIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedOfferIds.length}/2 selected
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isSelected={selectedOfferIds.includes(listing.id)}
            onSelect={() => toggleOfferSelection(listing.id)}
          />
        ))}
      </div>
    </div>
  );
}
