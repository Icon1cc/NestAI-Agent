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

// Demo listings for Berlin (as per spec)
const DEMO_LISTINGS: Listing[] = [
  {
    id: 'demo-1',
    title: 'Modern 2-Room Apartment in Prenzlauer Berg',
    price: { amount: 1150, currency: 'EUR', period: 'month' },
    address: 'Schönhauser Allee 42, Prenzlauer Berg, Berlin',
    lat: 52.5380,
    lng: 13.4140,
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    rooms: 2,
    areaM2: 58,
    provider: 'Demo',
    source_url: 'https://example.com/listing-1',
    badges: ['furnished', 'balcony'],
    score: 8.5,
    rank: 0.85,
    pros: ['Great location', 'Recently renovated', 'Near U-Bahn'],
    cons: ['No parking', 'Street noise'],
  },
  {
    id: 'demo-2',
    title: 'Cozy Studio near Mauerpark',
    price: { amount: 850, currency: 'EUR', period: 'month' },
    address: 'Gleimstraße 15, Prenzlauer Berg, Berlin',
    lat: 52.5450,
    lng: 13.4050,
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ],
    rooms: 1,
    areaM2: 35,
    provider: 'Demo',
    source_url: 'https://example.com/listing-2',
    badges: ['pets_allowed', 'quiet'],
    score: 7.8,
    rank: 0.78,
    pros: ['Affordable', 'Near Mauerpark', 'Quiet street'],
    cons: ['Small kitchen', 'No elevator'],
  },
  {
    id: 'demo-3',
    title: 'Spacious 3-Room Altbau with Garden Access',
    price: { amount: 1680, currency: 'EUR', period: 'month' },
    address: 'Kastanienallee 77, Mitte, Berlin',
    lat: 52.5340,
    lng: 13.4100,
    photos: [
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    ],
    rooms: 3,
    areaM2: 95,
    provider: 'Demo',
    source_url: 'https://example.com/listing-3',
    badges: ['garden', 'altbau', 'family_friendly'],
    score: 9.2,
    rank: 0.92,
    pros: ['Garden access', 'High ceilings', 'Central location'],
    cons: ['Higher price', 'Old heating system'],
  },
  {
    id: 'demo-4',
    title: 'Bright 2-Room Near Alexanderplatz',
    price: { amount: 1050, currency: 'EUR', period: 'month' },
    address: 'Rosa-Luxemburg-Straße 30, Mitte, Berlin',
    lat: 52.5250,
    lng: 13.4100,
    photos: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
    ],
    rooms: 2,
    areaM2: 52,
    provider: 'Demo',
    source_url: 'https://example.com/listing-4',
    badges: ['furnished', 'new'],
    score: 8.0,
    rank: 0.80,
    pros: ['Central location', 'Modern appliances', 'Good transport'],
    cons: ['Tourist area', 'Small bedrooms'],
  },
  {
    id: 'demo-5',
    title: 'Quiet 1-Room in Friedrichshain',
    price: { amount: 780, currency: 'EUR', period: 'month' },
    address: 'Boxhagener Straße 85, Friedrichshain, Berlin',
    lat: 52.5100,
    lng: 13.4550,
    photos: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    ],
    rooms: 1,
    areaM2: 38,
    provider: 'Demo',
    source_url: 'https://example.com/listing-5',
    badges: ['quiet', 'good_deal'],
    score: 7.5,
    rank: 0.75,
    pros: ['Very affordable', 'Trendy area', 'Near parks'],
    cons: ['No washing machine', 'Small bathroom'],
  },
];

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
    filters: SearchFilters = {},
    isDemoMode: boolean = false
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

    // In demo mode or if no backend is available, use mock data
    if (isDemoMode) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filter and add distance to demo listings
      const filtered = DEMO_LISTINGS.map(listing => ({
        ...listing,
        distance: calculateDistance(location.lat, location.lng, listing.lat, listing.lng),
      })).filter(listing => {
        // Apply filters
        if (filters.budgetMax && listing.price.amount > filters.budgetMax) return false;
        if (filters.budgetMin && listing.price.amount < filters.budgetMin) return false;
        if (filters.minRooms && listing.rooms < filters.minRooms) return false;
        if (filters.minAreaM2 && listing.areaM2 < filters.minAreaM2) return false;
        // Filter by radius
        if (listing.distance && listing.distance > radiusKm) return false;
        return true;
      }).sort((a, b) => b.score - a.score);

      setListings(filtered);
      setIsLoading(false);
      return filtered;
    }

    // TODO: Call actual backend API (/api/dify/run)
    // For now, return demo data as fallback
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filtered = DEMO_LISTINGS.map(listing => ({
        ...listing,
        distance: calculateDistance(location.lat, location.lng, listing.lat, listing.lng),
      })).filter(listing => listing.distance && listing.distance <= radiusKm);

      // Cache results
      try {
        const db = await getDB();
        await db.put(STORE_NAME, {
          key: cacheKey,
          data: filtered,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn('Cache write error:', err);
      }

      setListings(filtered);
      setIsLoading(false);
      return filtered;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return [];
      }
      setError('Failed to fetch listings');
      setIsLoading(false);
      return [];
    }
  }, []);

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    setListings,
  };
}
