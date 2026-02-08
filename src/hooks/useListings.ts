import { useState, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import type { Listing, Location, RadiusKm, ListingType, SearchFilters } from '@/types';

const DB_NAME = 'nestai-cache';
const STORE_NAME = 'listings';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  key: string;
  data: Listing[];
  timestamp: number;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 2, {
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

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        setListings(cached.data);
        setIsLoading(false);
        return cached.data;
      }
    } catch (err) {
      console.warn('Cache read error:', err);
    }

    abortControllerRef.current = new AbortController();

    // TODO: Replace with real backend call.
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
