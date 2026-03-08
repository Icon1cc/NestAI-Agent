import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trees, Train, ChevronDown, ChevronUp, Loader2, GraduationCap, Stethoscope, Dumbbell } from 'lucide-react';
import { useState } from 'react';
import type { AmenitiesData, Amenity, AmenityCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface AmenityCardProps {
  category: AmenityCategory;
  items: Amenity[];
  icon: React.ReactNode;
  label: string;
  color: string;
}

function AmenityCard({ items, icon, label, color }: AmenityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nearestThree = items.slice(0, 3);
  const hasMore = items.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="nest-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground">{items.length} nearby</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {nearestThree.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground truncate pr-2">{item.name}</span>
            <span className="text-muted-foreground flex-shrink-0">
              {item.distance ? `${(item.distance * 1000).toFixed(0)}m` : '—'}
            </span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <>
          <AnimatePresence>
            {isExpanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-2"
              >
                {items.slice(3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate pr-2">{item.name}</span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {item.distance ? `${(item.distance * 1000).toFixed(0)}m` : '—'}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show all {items.length}</span>
              </>
            )}
          </button>
        </>
      )}
    </motion.div>
  );
}

interface AmenitiesPanelProps {
  data: AmenitiesData | null;
  isLoading: boolean;
  error: string | null;
}

export function AmenitiesPanel({ data, isLoading, error }: AmenitiesPanelProps) {
  const t = useI18n();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>{t('loading_amenities')}</p>
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t('no_amenities')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="nest-section-title px-1">Area & Amenities</h2>
      
      <div className="grid gap-4">
        <AmenityCard
          category="groceries"
          items={data.groceries}
          icon={<ShoppingCart className="w-5 h-5 text-white" />}
          label={t('amenity_groceries')}
          color="bg-emerald-500"
        />
        <AmenityCard
          category="parks"
          items={data.parks}
          icon={<Trees className="w-5 h-5 text-white" />}
          label={t('amenity_parks')}
          color="bg-green-600"
        />
        <AmenityCard
          category="schools"
          items={data.schools}
          icon={<GraduationCap className="w-5 h-5 text-white" />}
          label={t('amenity_schools')}
          color="bg-purple-500"
        />
        <AmenityCard
          category="transit"
          items={data.transit}
          icon={<Train className="w-5 h-5 text-white" />}
          label={t('amenity_transit')}
          color="bg-blue-500"
        />
        <AmenityCard
          category="healthcare"
          items={data.healthcare}
          icon={<Stethoscope className="w-5 h-5 text-white" />}
          label={t('amenity_healthcare')}
          color="bg-red-500"
        />
        <AmenityCard
          category="fitness"
          items={data.fitness}
          icon={<Dumbbell className="w-5 h-5 text-white" />}
          label={t('amenity_fitness')}
          color="bg-orange-500"
        />
      </div>
    </div>
  );
}
