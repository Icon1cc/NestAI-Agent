import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, ExternalLink, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Listing } from '@/types';
import { cn } from '@/lib/utils';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
}

interface CompareRowProps {
  label: string;
  value1: string | number;
  value2: string | number;
  winner?: 1 | 2 | null;
  format?: 'number' | 'currency' | 'text';
}

function CompareRow({ label, value1, value2, winner, format = 'text' }: CompareRowProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency' && typeof val === 'number') {
      return `€${val.toLocaleString()}`;
    }
    if (format === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-medium text-center",
        winner === 1 && "text-nest-success"
      )}>
        {formatValue(value1)}
        {winner === 1 && <Trophy className="w-3 h-3 inline ml-1" />}
      </span>
      <span className={cn(
        "text-sm font-medium text-center",
        winner === 2 && "text-nest-success"
      )}>
        {formatValue(value2)}
        {winner === 2 && <Trophy className="w-3 h-3 inline ml-1" />}
      </span>
    </div>
  );
}

const MotionBackdrop = motion.div;
const MotionPanel = motion.div;

export const CompareModal = forwardRef<HTMLDivElement, CompareModalProps>(
  function CompareModal({ isOpen, onClose, listings }, ref) {
    const { selectedOfferIds, clearSelection } = useAppStore();

    const offer1 = listings.find(l => l.id === selectedOfferIds[0]);
    const offer2 = listings.find(l => l.id === selectedOfferIds[1]);

    // Determine winners for each category
    const priceWinner = offer1 && offer2 
      ? (offer1.price.amount < offer2.price.amount ? 1 : offer1.price.amount > offer2.price.amount ? 2 : null)
      : null;
    const areaWinner = offer1 && offer2
      ? (offer1.areaM2 > offer2.areaM2 ? 1 : offer1.areaM2 < offer2.areaM2 ? 2 : null)
      : null;
    const roomsWinner = offer1 && offer2
      ? (offer1.rooms > offer2.rooms ? 1 : offer1.rooms < offer2.rooms ? 2 : null)
      : null;
    const scoreWinner = offer1 && offer2
      ? (offer1.score > offer2.score ? 1 : offer1.score < offer2.score ? 2 : null)
      : null;
    const distanceWinner = offer1 && offer2
      ? ((offer1.distance || 999) < (offer2.distance || 999) ? 1 
        : (offer1.distance || 999) > (offer2.distance || 999) ? 2 : null)
      : null;

    const handleClose = () => {
      onClose();
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div ref={ref} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <MotionBackdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            />

            {/* Modal */}
            <MotionPanel
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto nest-card-elevated"
            >
              {!offer1 || !offer2 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">Select exactly 2 listings to compare</p>
                  <button onClick={handleClose} className="nest-btn-primary mt-4">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-card z-10 p-6 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Compare Listings</h2>
                    <button onClick={handleClose} className="nest-icon-btn">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Images */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div /> {/* Empty cell for label column */}
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                        {offer1.photos[0] ? (
                          <img src={offer1.photos[0]} alt={offer1.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                        <div className="absolute top-2 left-2 nest-score-high">
                          {offer1.score.toFixed(1)}
                        </div>
                      </div>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                        {offer2.photos[0] ? (
                          <img src={offer2.photos[0]} alt={offer2.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                        <div className="absolute top-2 left-2 nest-score-high">
                          {offer2.score.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Titles */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <span className="text-sm text-muted-foreground font-medium">Title</span>
                      <p className="text-sm font-semibold line-clamp-2">{offer1.title}</p>
                      <p className="text-sm font-semibold line-clamp-2">{offer2.title}</p>
                    </div>

                    {/* Comparison rows */}
                    <CompareRow 
                      label="Price" 
                      value1={offer1.price.amount} 
                      value2={offer2.price.amount} 
                      winner={priceWinner}
                      format="currency"
                    />
                    <CompareRow 
                      label="Area" 
                      value1={`${offer1.areaM2} m²`} 
                      value2={`${offer2.areaM2} m²`} 
                      winner={areaWinner}
                    />
                    <CompareRow 
                      label="Rooms" 
                      value1={offer1.rooms} 
                      value2={offer2.rooms} 
                      winner={roomsWinner}
                    />
                    <CompareRow 
                      label="AI Score" 
                      value1={offer1.score.toFixed(1)} 
                      value2={offer2.score.toFixed(1)} 
                      winner={scoreWinner}
                    />
                    <CompareRow 
                      label="Distance" 
                      value1={offer1.distance ? `${offer1.distance.toFixed(1)} km` : '—'} 
                      value2={offer2.distance ? `${offer2.distance.toFixed(1)} km` : '—'} 
                      winner={distanceWinner}
                    />

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-3 gap-4 py-4 mt-2">
                      <span className="text-sm text-muted-foreground font-medium">Pros</span>
                      <div className="space-y-1">
                        {offer1.pros?.slice(0, 3).map((pro, i) => (
                          <p key={i} className="text-xs text-nest-success flex items-start gap-1">
                            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {pro}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {offer2.pros?.slice(0, 3).map((pro, i) => (
                          <p key={i} className="text-xs text-nest-success flex items-start gap-1">
                            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {pro}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-border/50">
                      <span className="text-sm text-muted-foreground font-medium">Cons</span>
                      <div className="space-y-1">
                        {offer1.cons?.slice(0, 3).map((con, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {con}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {offer2.cons?.slice(0, 3).map((con, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {con}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-4 pt-6">
                      <div /> {/* Empty cell */}
                      <a
                        href={offer1.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nest-btn-primary flex items-center justify-center gap-2 text-sm"
                      >
                        View Listing
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={offer2.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nest-btn-primary flex items-center justify-center gap-2 text-sm"
                      >
                        View Listing
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-border/50 flex justify-end gap-3">
                    <button onClick={clearSelection} className="nest-btn-secondary">
                      Clear Selection
                    </button>
                    <button onClick={handleClose} className="nest-btn-primary">
                      Close
                    </button>
                  </div>
                </>
              )}
            </MotionPanel>
          </div>
        )}
      </AnimatePresence>
    );
  }
);