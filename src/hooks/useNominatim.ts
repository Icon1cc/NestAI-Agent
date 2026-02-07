import { useState, useRef, useCallback } from 'react';
import type { NominatimResult, Location } from '@/types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export function useNominatimSearch() {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string, countryCode?: string | null) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query || query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '7',
        dedupe: '1',
        namedetails: '1',
        'accept-language': navigator.language || 'en',
      });

      if (countryCode) {
        params.set('countrycodes', countryCode.toLowerCase());
      }

      try {
        const response = await fetch(
          `${NOMINATIM_BASE}/search?${params.toString()}`,
          { 
            signal: abortControllerRef.current.signal,
            headers: {
              'User-Agent': 'NestAI/1.0'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limited, please try again in a moment');
          }
          throw new Error('Search failed');
        }

        const data: NominatimResult[] = await response.json();
        setResults(data);
        
        if (data.length === 0) {
          setError('No results found');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const resultToLocation = useCallback((result: NominatimResult): Location => {
    const addr = result.address;
    const city = addr?.city || addr?.town || addr?.village || addr?.municipality;
    
    return {
      label: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      countryCode: addr?.country_code?.toUpperCase(),
      city: city,
      country: addr?.country,
    };
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clear,
    resultToLocation,
  };
}

export function useReverseGeocode() {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<Location | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'jsonv2',
      addressdetails: '1',
    });

    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/reverse?${params.toString()}`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'User-Agent': 'NestAI/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocode failed');
      }

      const data: NominatimResult = await response.json();
      const addr = data.address;
      const city = addr?.city || addr?.town || addr?.village || addr?.municipality;

      return {
        label: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        countryCode: addr?.country_code?.toUpperCase(),
        city: city,
        country: addr?.country,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      console.error('Reverse geocode error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { reverseGeocode, isLoading };
}
