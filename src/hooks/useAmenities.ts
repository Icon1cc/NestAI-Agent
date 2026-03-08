import { useState, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';
import type { AmenitiesData, Amenity, Location, RadiusKm, AmenityCategory } from '@/types';
import { calculateDistance } from '@/lib/geo';
import { DB, CACHE, API, OVERPASS_TIMEOUT_SECONDS } from '@/config/constants';
import { logger } from '@/lib/logger';

const STORE_NAME = DB.STORES.AMENITIES;

interface CacheEntry {
  key: string;
  data: AmenitiesData;
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

function getCacheKey(lat: number, lng: number, radiusKm: RadiusKm): string {
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusKm}:amenities:v2`;
}

function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  return `
[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
(
  // Groceries
  node["shop"="supermarket"](around:${radiusM},${lat},${lng});
  node["shop"="grocery"](around:${radiusM},${lat},${lng});
  node["shop"="convenience"](around:${radiusM},${lat},${lng});
  
  // Parks
  node["leisure"="park"](around:${radiusM},${lat},${lng});
  way["leisure"="park"](around:${radiusM},${lat},${lng});
  node["leisure"="garden"](around:${radiusM},${lat},${lng});
  
  // Schools
  node["amenity"="school"](around:${radiusM},${lat},${lng});
  way["amenity"="school"](around:${radiusM},${lat},${lng});
  node["amenity"="university"](around:${radiusM},${lat},${lng});
  node["amenity"="college"](around:${radiusM},${lat},${lng});
  node["amenity"="kindergarten"](around:${radiusM},${lat},${lng});
  
  // Transit
  node["public_transport"="stop_position"](around:${radiusM},${lat},${lng});
  node["public_transport"="platform"](around:${radiusM},${lat},${lng});
  node["highway"="bus_stop"](around:${radiusM},${lat},${lng});
  node["railway"="station"](around:${radiusM},${lat},${lng});
  node["railway"="tram_stop"](around:${radiusM},${lat},${lng});
  node["station"="subway"](around:${radiusM},${lat},${lng});
  
  // Healthcare
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["amenity"="doctors"](around:${radiusM},${lat},${lng});
  node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
  node["amenity"="dentist"](around:${radiusM},${lat},${lng});
  
  // Fitness
  node["leisure"="fitness_centre"](around:${radiusM},${lat},${lng});
  node["leisure"="sports_centre"](around:${radiusM},${lat},${lng});
  node["sport"="fitness"](around:${radiusM},${lat},${lng});
  node["leisure"="swimming_pool"](around:${radiusM},${lat},${lng});
);
out center tags;
`.trim();
}

function categorizeElement(element: any, centerLat: number, centerLng: number): Amenity | null {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat;
  const lng = element.lon || element.center?.lon;

  if (!lat || !lng) return null;

  const name = tags.name || tags['name:en'] || 'Unknown';
  const distance = calculateDistance(centerLat, centerLng, lat, lng);

  let category: AmenityCategory | null = null;

  // Categorize based on tags
  if (tags.shop === 'supermarket' || tags.shop === 'grocery' || tags.shop === 'convenience') {
    category = 'groceries';
  } else if (tags.leisure === 'park' || tags.leisure === 'garden') {
    category = 'parks';
  } else if (
    tags.amenity === 'school' || 
    tags.amenity === 'university' || 
    tags.amenity === 'college' ||
    tags.amenity === 'kindergarten'
  ) {
    category = 'schools';
  } else if (
    tags.public_transport ||
    tags.highway === 'bus_stop' ||
    tags.railway === 'station' ||
    tags.railway === 'tram_stop' ||
    tags.station === 'subway'
  ) {
    category = 'transit';
  } else if (
    tags.amenity === 'hospital' ||
    tags.amenity === 'clinic' ||
    tags.amenity === 'doctors' ||
    tags.amenity === 'pharmacy' ||
    tags.amenity === 'dentist'
  ) {
    category = 'healthcare';
  } else if (
    tags.leisure === 'fitness_centre' || 
    tags.leisure === 'sports_centre' || 
    tags.sport === 'fitness' ||
    tags.leisure === 'swimming_pool'
  ) {
    category = 'fitness';
  }

  if (!category) return null;

  return {
    id: `${element.type}-${element.id}`,
    name,
    category,
    lat,
    lng,
    distance,
    tags,
    amenity_id: element.id,
    description: tags.description || name,
  };
}

export function useAmenities() {
  const [data, setData] = useState<AmenitiesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAmenities = useCallback(async (location: Location, radiusKm: RadiusKm): Promise<AmenitiesData | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    const cacheKey = getCacheKey(location.lat, location.lng, radiusKm);

    // Check cache first
    try {
      const db = await getDB();
      const cached = await db.get(STORE_NAME, cacheKey) as CacheEntry | undefined;
      
      if (cached && Date.now() - cached.timestamp < CACHE.AMENITIES_DURATION_MS) {
        setData(cached.data);
        setIsLoading(false);
        return cached.data;
      }
    } catch (err) {
      logger.warn('Cache read error:', err);
    }

    abortControllerRef.current = new AbortController();
    const radiusM = radiusKm * 1000;
    const query = buildOverpassQuery(location.lat, location.lng, radiusM);

    let lastError: Error | null = null;

    for (const endpoint of API.OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status}`);
        }

        const json = await response.json();
        const elements = json.elements || [];

        const amenities: AmenitiesData = {
          groceries: [],
          parks: [],
          schools: [],
          transit: [],
          healthcare: [],
          fitness: [],
        };

        for (const element of elements) {
          const amenity = categorizeElement(element, location.lat, location.lng);
          if (amenity) {
            amenities[amenity.category].push(amenity);
          }
        }

        // Sort each category by distance
        for (const key of Object.keys(amenities) as (keyof AmenitiesData)[]) {
          amenities[key].sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        // Cache the results
        try {
          const db = await getDB();
          await db.put(STORE_NAME, {
            key: cacheKey,
            data: amenities,
            timestamp: Date.now(),
          });
        } catch (err) {
          logger.warn('Cache write error:', err);
        }

        setData(amenities);
        setIsLoading(false);
        return amenities;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setIsLoading(false);
          return null;
        }
        lastError = err as Error;
        logger.warn(`Overpass endpoint ${endpoint} failed:`, err);
      }
    }

    setError(lastError?.message || 'Failed to fetch amenities');
    setIsLoading(false);
    return null;
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchAmenities,
    setData,
  };
}
