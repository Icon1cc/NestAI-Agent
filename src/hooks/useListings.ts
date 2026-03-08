import { useState, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import type { Listing, Location, RadiusKm, ListingType, SearchFilters } from '@/types';
import { DB, CACHE } from '@/config/constants';
import { logger } from '@/lib/logger';

const STORE_NAME = DB.STORES.LISTINGS;

interface CacheEntry {
  key: string;
  data: Listing[];
  timestamp: number;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB.CACHE_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    },
  });
}

function getCacheKey(
  lat: number,
  lng: number,
  radiusKm: RadiusKm,
  listingType: ListingType,
  filters: SearchFilters
): string {
  const filtersHash = JSON.stringify(filters);
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusKm}:${listingType}:${filtersHash}`;
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchListings = useCallback(async (
    location: Location,
    radiusKm: RadiusKm,
    listingType: ListingType,
    filters: SearchFilters = {}
  ): Promise<Listing[]> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    const cacheKey = getCacheKey(location.lat, location.lng, radiusKm, listingType, filters);

    // Check cache first
    try {
      const db = await getDB();
      const cached = await db.get(STORE_NAME, cacheKey) as CacheEntry | undefined;
      
      if (cached && Date.now() - cached.timestamp < CACHE.LISTINGS_DURATION_MS) {
        setListings(cached.data);
        setIsLoading(false);
        return cached.data;
      }
    } catch (err) {
      logger.warn('Cache read error:', err);
    }

    abortControllerRef.current = new AbortController();

    // Listings are fetched via useDify hook - this hook is for caching purposes only
    setListings([]);
    setIsLoading(false);
    return [];
  }, []);

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    setListings,
  };
}
