import { useState, useCallback } from 'react';
import { useReverseGeocode } from './useNominatim';
import type { Location } from '@/types';
import { UI } from '@/config/constants';
import { logger } from '@/lib/logger';

interface GeolocationError {
  code: number;
  message: string;
  isSecurityError: boolean;
}

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const { reverseGeocode, isLoading: isReverseLoading } = useReverseGeocode();

  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    setIsLoading(true);
    setError(null);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
        isSecurityError: false,
      });
      setIsLoading(false);
      return null;
    }

    // Check for secure context
    if (window.isSecureContext === false) {
      setError({
        code: 0,
        message: 'Location access requires a secure connection (HTTPS or localhost)',
        isSecurityError: true,
      });
      setIsLoading(false);
      return null;
    }

    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get a friendly label, but never block the UX on it.
            // If reverse-geocoding is slow/fails, fall back to coordinates.
            try {
              const reverseWithTimeout = Promise.race([
                reverseGeocode(latitude, longitude),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), UI.REVERSE_GEOCODE_TIMEOUT_MS)),
              ]);

              const location = await reverseWithTimeout;

              setIsLoading(false);
              resolve(
                location || {
                  label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                  lat: latitude,
                  lng: longitude,
                }
              );
            } catch (geoError) {
              logger.error('Reverse geocode error:', geoError);
              setIsLoading(false);
              resolve({
                label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                lat: latitude,
                lng: longitude,
              });
            }
          },
          (err) => {
            logger.error('Geolocation error:', err);
            let message = 'Unable to get your location';

            switch (err.code) {
              case 1: // PERMISSION_DENIED
                message = 'Location access was denied. Please enable location permissions in your browser settings, or use "Pick on map" instead.';
                break;
              case 2: // POSITION_UNAVAILABLE
                message = 'Your location is currently unavailable. Please use "Pick on map" instead.';
                break;
              case 3: // TIMEOUT
                message = 'Location request timed out. Please try again or use "Pick on map".';
                break;
            }

            setError({
              code: err.code,
              message,
              isSecurityError: false,
            });
            setIsLoading(false);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: UI.GEOLOCATION_TIMEOUT_MS,
            maximumAge: 60000,
          }
        );
      });
    } catch (e) {
      logger.error('Unexpected geolocation error:', e);
      setError({
        code: 0,
        message: 'An unexpected error occurred. Please use "Pick on map" instead.',
        isSecurityError: false,
      });
      setIsLoading(false);
      return null;
    }
  }, [reverseGeocode]);

  return {
    getCurrentLocation,
    isLoading: isLoading || isReverseLoading,
    error,
    clearError: () => setError(null),
  };
}
