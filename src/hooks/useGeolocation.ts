import { useState, useCallback } from 'react';
import { useReverseGeocode } from './useNominatim';
import type { Location } from '@/types';

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

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get label
          const location = await reverseGeocode(latitude, longitude);
          
          if (location) {
            setIsLoading(false);
            resolve(location);
          } else {
            // Fallback: return coordinates without label
            setIsLoading(false);
            resolve({
              label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude,
            });
          }
        },
        (err) => {
          let message = 'Unable to get your location';
          let isSecurityError = false;

          switch (err.code) {
            case 1: // PERMISSION_DENIED
              message = 'Location access was denied. Please enable location permissions in your browser settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              message = 'Your location is currently unavailable. Please try again.';
              break;
            case 3: // TIMEOUT
              message = 'Location request timed out. Please try again.';
              break;
          }

          setError({
            code: err.code,
            message,
            isSecurityError,
          });
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [reverseGeocode]);

  return {
    getCurrentLocation,
    isLoading: isLoading || isReverseLoading,
    error,
    clearError: () => setError(null),
  };
}
