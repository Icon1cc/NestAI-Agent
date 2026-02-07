import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, ExternalLink, Trophy, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useDify } from '@/hooks/useDify';
import type { Listing, DifyCompareResponse } from '@/types';
import { getCategoryLabel, normalizeCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

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

// Extract decision hints from AI text
function extractDecisionHints(text1: string, text2: string): string[] {
  const hints: string[] = [];
  const keywords = ['quiet', 'parks', 'transit', 'schools', 'central', 'value', 'space', 'modern'];
  
  keywords.forEach(keyword => {
    if (text1.toLowerCase().includes(keyword) && !text2.toLowerCase().includes(keyword)) {
      hints.push(`Best for ${keyword}: Property 1`);
    } else if (text2.toLowerCase().includes(keyword) && !text1.toLowerCase().includes(keyword)) {
      hints.push(`Best for ${keyword}: Property 2`);
    }
  });
  
  return hints.slice(0, 3);
}

export function CompareModal({ isOpen, onClose, listings }: CompareModalProps) {
  const { selectedOfferIds, clearSelection } = useAppStore();
  const { compareOffers, isLoading, resolveOfferAmenities } = useDify();
  const t = useI18n();
  
  const [compareResult, setCompareResult] = useState<DifyCompareResponse | null>(null);

  const offer1 = listings.find(l => l.id === selectedOfferIds[0]);
  const offer2 = listings.find(l => l.id === selectedOfferIds[1]);

  // Get amenities for each offer
  const amenities1 = offer1 ? resolveOfferAmenities(offer1) : [];
  const amenities2 = offer2 ? resolveOfferAmenities(offer2) : [];

  // Fetch comparison when modal opens with 2 offers
  useEffect(() => {
    if (isOpen && offer1 && offer2) {
      // Extract property IDs from offer IDs
      const id1 = parseInt(offer1.id.replace('dify-', '')) || 0;
      const id2 = parseInt(offer2.id.replace('dify-', '')) || 0;
      
      // Call compare API
      compareOffers(id1, id2).then(result => {
        if (result) {
          setCompareResult(result);
        }
      }).catch(() => {
        // Ignore errors - we'll show manual comparison
      });
    }
  }, [isOpen, offer1, offer2, compareOffers]);

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
    ? (offer1.rank > offer2.rank ? 1 : offer1.rank < offer2.rank ? 2 : null)
    : null;
  const amenitiesWinner = amenities1.length > amenities2.length ? 1 
    : amenities1.length < amenities2.length ? 2 : null;

  const handleClose = () => {
    setCompareResult(null);
    onClose();
  };

  // Get decision hints
  const decisionHints = compareResult 
    ? extractDecisionHints(compareResult.assistant_text_property1, compareResult.assistant_text_property2)
    : [];

  // Convert rank to display format
  const displayScore = (rank: number) => Math.round(rank * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="compare-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="compare-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto nest-card-elevated pointer-events-auto">
              {!offer1 || !offer2 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">{t('select_two_listings')}</p>
                  <button onClick={handleClose} className="nest-btn-primary mt-4">
                    {t('close')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-card z-10 p-6 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-xl font-bold">{t('compare_listings')}</h2>
                    <button onClick={handleClose} className="nest-icon-btn">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Decision hints */}
                    {decisionHints.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium">{t('quick_decision_guide')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {decisionHints.map((hint, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs bg-accent/20 text-accent">
                              {hint}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images and AI Analysis */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {/* Offer 1 */}
                      <div>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                          {offer1.photos[0] ? (
                            <img src={offer1.photos[0]} alt={offer1.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold nest-score-high">
                            {displayScore(offer1.rank)}/100
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{offer1.title}</h3>
                        <p className="text-lg font-bold text-primary mb-2">
                          €{offer1.price.amount.toLocaleString()}
                          {offer1.price.period === 'month' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                        </p>
                        
                        {/* AI Analysis for Offer 1 */}
                        {isLoading ? (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          </div>
                        ) : compareResult?.assistant_text_property1 ? (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm text-foreground">{compareResult.assistant_text_property1}</p>
                          </div>
                        ) : null}

                        {/* Amenities for offer 1 */}
                        {amenities1.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t('nearby')} ({amenities1.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {amenities1.slice(0, 5).map((a) => (
                                <span key={a.amenity_id} className="text-xs px-2 py-0.5 rounded bg-muted">
                                  {getCategoryLabel(normalizeCategory(a.category))}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Offer 2 */}
                      <div>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                          {offer2.photos[0] ? (
                            <img src={offer2.photos[0]} alt={offer2.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold nest-score-high">
                            {displayScore(offer2.rank)}/100
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{offer2.title}</h3>
                        <p className="text-lg font-bold text-primary mb-2">
                          €{offer2.price.amount.toLocaleString()}
                          {offer2.price.period === 'month' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                        </p>
                        
                        {/* AI Analysis for Offer 2 */}
                        {isLoading ? (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          </div>
                        ) : compareResult?.assistant_text_property2 ? (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm text-foreground">{compareResult.assistant_text_property2}</p>
                          </div>
                        ) : null}

                        {/* Amenities for offer 2 */}
                        {amenities2.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t('nearby')} ({amenities2.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {amenities2.slice(0, 5).map((a) => (
                                <span key={a.amenity_id} className="text-xs px-2 py-0.5 rounded bg-muted">
                                  {getCategoryLabel(normalizeCategory(a.category))}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comparison rows */}
                    <div className="border-t border-border/50 pt-4">
                      <CompareRow 
                        label="Price" 
                        value1={offer1.price.amount} 
                        value2={offer2.price.amount} 
                        winner={priceWinner}
                        format="currency"
                      />
                      {(offer1.areaM2 > 0 || offer2.areaM2 > 0) && (
                        <CompareRow 
                          label="Area" 
                          value1={offer1.areaM2 > 0 ? `${offer1.areaM2} m²` : '—'} 
                          value2={offer2.areaM2 > 0 ? `${offer2.areaM2} m²` : '—'} 
                          winner={areaWinner}
                        />
                      )}
                      {(offer1.rooms > 0 || offer2.rooms > 0) && (
                        <CompareRow 
                          label="Rooms" 
                          value1={offer1.rooms || '—'} 
                          value2={offer2.rooms || '—'} 
                          winner={roomsWinner}
                        />
                      )}
                      <CompareRow 
                        label="AI Score" 
                        value1={`${displayScore(offer1.rank)}/100`} 
                        value2={`${displayScore(offer2.rank)}/100`} 
                        winner={scoreWinner}
                      />
                      <CompareRow 
                        label="Nearby Amenities" 
                        value1={amenities1.length} 
                        value2={amenities2.length} 
                        winner={amenitiesWinner}
                        format="number"
                      />
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-2 gap-6 py-4 mt-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pros</p>
                        <div className="space-y-1">
                          {offer1.pros?.slice(0, 3).map((pro, i) => (
                            <p key={i} className="text-xs text-nest-success flex items-start gap-1">
                              <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {pro}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">Cons</p>
                        <div className="space-y-1">
                          {offer1.cons?.slice(0, 2).map((con, i) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {con}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pros</p>
                        <div className="space-y-1">
                          {offer2.pros?.slice(0, 3).map((pro, i) => (
                            <p key={i} className="text-xs text-nest-success flex items-start gap-1">
                              <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {pro}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">Cons</p>
                        <div className="space-y-1">
                          {offer2.cons?.slice(0, 2).map((con, i) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <Minus className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {con}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {offer1.redirect_url && offer1.redirect_url !== '#' ? (
                        <a
                          href={offer1.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nest-btn-primary flex items-center justify-center gap-2 text-sm"
                        >
                          Open Listing 1
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="nest-btn-secondary text-center text-sm opacity-50">
                          No external link
                        </div>
                      )}
                      {offer2.redirect_url && offer2.redirect_url !== '#' ? (
                        <a
                          href={offer2.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nest-btn-primary flex items-center justify-center gap-2 text-sm"
                        >
                          Open Listing 2
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="nest-btn-secondary text-center text-sm opacity-50">
                          No external link
                        </div>
                      )}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
